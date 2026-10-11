-- =====================================================================
--  DANIELE OLIVEIRA SOBRANCELHAS — banco de dados (Supabase)
--  Cole TUDO isto no Supabase > SQL Editor > New query > Run.
--  Pode rodar de novo sem problema: não apaga agendamentos existentes.
-- =====================================================================

create extension if not exists pg_net;      -- usado para enviar a notificação ao celular

-- ---------- TABELAS ----------
create table if not exists public.servicos (
  id         text primary key,
  nome       text not null,
  categoria  text not null default 'sob',
  descricao  text,
  preco      numeric(10,2) not null default 0,
  unidade    text,
  popular    boolean not null default false,
  ativo      boolean not null default true,
  ordem      int not null default 0
);

-- horários que a Daniele libera em cada dia da semana (0 = domingo ... 6 = sábado)
create table if not exists public.horarios (
  dia_semana smallint primary key check (dia_semana between 0 and 6),
  horas      text[] not null default '{}'
);

-- dias de folga / feriado (nenhum horário fica disponível nesse dia)
create table if not exists public.folgas (
  data   date primary key,
  motivo text
);

create table if not exists public.agendamentos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  nome        text not null,
  telefone    text not null,
  observacao  text,
  servicos    jsonb not null default '[]'::jsonb,
  total       numeric(10,2) not null default 0,
  data        date not null,
  hora        text not null,
  status      text not null default 'novo' check (status in ('novo','confirmado','concluido','cancelado')),
  origem      text not null default 'site',
  criado_em   timestamptz not null default now()
);
-- impede duas clientes no mesmo dia e horário
create unique index if not exists agendamentos_horario_unico
  on public.agendamentos (data, hora) where status <> 'cancelado';
create index if not exists agendamentos_data_idx on public.agendamentos (data);

-- interessadas no curso / mentoria
create table if not exists public.interessadas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text not null,
  interesse  text not null default 'curso',
  mensagem   text,
  atendida   boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- configurações privadas (código de notificação etc.)
create table if not exists public.config (
  chave text primary key,
  valor text
);

-- quem pode entrar no painel
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- ---------- QUEM É ADMIN ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- o PRIMEIRO usuário que entrar no painel vira a dona. Depois disso ninguém mais.
create or replace function public.reivindicar_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if not exists (select 1 from public.admins) then
    insert into public.admins (user_id) values (auth.uid());
  end if;
  return public.is_admin();
end $$;

-- ---------- SEGURANÇA (RLS) ----------
alter table public.servicos      enable row level security;
alter table public.horarios      enable row level security;
alter table public.folgas        enable row level security;
alter table public.agendamentos  enable row level security;
alter table public.interessadas  enable row level security;
alter table public.config        enable row level security;
alter table public.admins        enable row level security;

drop policy if exists "servicos_ler"   on public.servicos;
drop policy if exists "servicos_admin" on public.servicos;
create policy "servicos_ler"   on public.servicos for select using (ativo or public.is_admin());
create policy "servicos_admin" on public.servicos for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "horarios_ler"   on public.horarios;
drop policy if exists "horarios_admin" on public.horarios;
create policy "horarios_ler"   on public.horarios for select using (true);
create policy "horarios_admin" on public.horarios for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "folgas_ler"   on public.folgas;
drop policy if exists "folgas_admin" on public.folgas;
create policy "folgas_ler"   on public.folgas for select using (true);
create policy "folgas_admin" on public.folgas for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "agendamentos_admin" on public.agendamentos;
create policy "agendamentos_admin" on public.agendamentos for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "interessadas_admin" on public.interessadas;
create policy "interessadas_admin" on public.interessadas for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "config_admin" on public.config;
create policy "config_admin" on public.config for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins_ver" on public.admins;
create policy "admins_ver" on public.admins for select using (user_id = auth.uid());

-- ---------- FUNÇÕES PÚBLICAS (usadas pelo site) ----------
-- horários já ocupados num período (só data e hora, nada pessoal)
create or replace function public.horarios_ocupados(p_inicio date, p_fim date)
returns table (data date, hora text)
language sql stable security definer set search_path = public as $$
  select a.data, a.hora from public.agendamentos a
  where a.status <> 'cancelado' and a.data between p_inicio and p_fim;
$$;

create or replace function public.criar_agendamento(
  p_nome text, p_telefone text, p_observacao text,
  p_servicos text[], p_data date, p_hora text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_agora   timestamp := (now() at time zone 'America/Bahia');
  v_hoje    date := v_agora::date;
  v_tel     text := regexp_replace(coalesce(p_telefone,''), '\D', '', 'g');
  v_horas   text[];
  v_itens   jsonb;
  v_total   numeric(10,2);
  v_ativos  int;
  v_row     public.agendamentos;
begin
  if length(trim(coalesce(p_nome,''))) < 2 then raise exception 'NOME_INVALIDO'; end if;
  if length(v_tel) < 10 or length(v_tel) > 13 then raise exception 'TELEFONE_INVALIDO'; end if;
  if p_servicos is null or array_length(p_servicos,1) is null then raise exception 'SEM_SERVICO'; end if;
  if p_data is null or p_data < v_hoje or p_data > v_hoje + 90 then raise exception 'DATA_INVALIDA'; end if;
  if exists (select 1 from public.folgas f where f.data = p_data) then raise exception 'DIA_FECHADO'; end if;

  select h.horas into v_horas from public.horarios h where h.dia_semana = extract(dow from p_data)::int;
  if v_horas is null or not (p_hora = any(v_horas)) then raise exception 'HORARIO_INDISPONIVEL'; end if;
  if p_data = v_hoje and p_hora <= to_char(v_agora, 'HH24:MI') then raise exception 'HORARIO_PASSOU'; end if;

  -- no máximo 3 agendamentos futuros por telefone (evita brincadeiras)
  select count(*) into v_ativos from public.agendamentos a
   where regexp_replace(a.telefone,'\D','','g') = v_tel and a.data >= v_hoje and a.status in ('novo','confirmado');
  if v_ativos >= 3 then raise exception 'LIMITE_AGENDAMENTOS'; end if;

  -- preços vêm do banco, não do navegador
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'nome', s.nome, 'preco', s.preco) order by s.ordem), '[]'::jsonb),
         coalesce(sum(s.preco), 0)
    into v_itens, v_total
    from public.servicos s where s.id = any(p_servicos) and s.ativo;
  if jsonb_array_length(v_itens) = 0 then raise exception 'SEM_SERVICO'; end if;

  begin
    insert into public.agendamentos (nome, telefone, observacao, servicos, total, data, hora)
    values (trim(p_nome), trim(p_telefone), nullif(trim(coalesce(p_observacao,'')), ''), v_itens, v_total, p_data, p_hora)
    returning * into v_row;
  exception when unique_violation then
    raise exception 'HORARIO_OCUPADO';
  end;

  return json_build_object('codigo', v_row.codigo, 'total', v_row.total, 'servicos', v_row.servicos,
                           'data', v_row.data, 'hora', v_row.hora);
end $$;

create or replace function public.registrar_interesse(
  p_nome text, p_telefone text, p_interesse text, p_mensagem text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_tel text := regexp_replace(coalesce(p_telefone,''), '\D', '', 'g');
begin
  if length(trim(coalesce(p_nome,''))) < 2 then raise exception 'NOME_INVALIDO'; end if;
  if length(v_tel) < 10 or length(v_tel) > 13 then raise exception 'TELEFONE_INVALIDO'; end if;
  if exists (select 1 from public.interessadas i
              where regexp_replace(i.telefone,'\D','','g') = v_tel and i.criado_em > now() - interval '1 day') then
    return true;  -- já registrada hoje, não duplica
  end if;
  insert into public.interessadas (nome, telefone, interesse, mensagem)
  values (trim(p_nome), trim(p_telefone),
          case when p_interesse in ('curso','mentoria') then p_interesse else 'curso' end,
          nullif(trim(coalesce(p_mensagem,'')), ''));
  return true;
end $$;

-- ---------- NOTIFICAÇÃO NO CELULAR (app ntfy) ----------
create or replace function public.notificar_celular()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_topico text;
  v_site   text;
  v_titulo text;
  v_msg    text;
begin
  select valor into v_topico from public.config where chave = 'ntfy_topico';
  if v_topico is null or v_topico = '' then return new; end if;
  select valor into v_site from public.config where chave = 'site_url';

  if tg_table_name = 'agendamentos' then
    if new.origem <> 'site' then return new; end if;
    v_titulo := 'Novo agendamento: ' || new.nome;
    v_msg := to_char(new.data, 'DD/MM') || ' às ' || new.hora || ' · R$ ' || replace(to_char(new.total, 'FM999990.00'), '.', ',') || E'\n'
          || (select string_agg(x->>'nome', ', ') from jsonb_array_elements(new.servicos) x) || E'\n'
          || 'WhatsApp: ' || new.telefone;
  else
    v_titulo := case when new.interesse = 'mentoria' then 'Interessada na mentoria: ' else 'Interessada no curso: ' end || new.nome;
    v_msg := 'WhatsApp: ' || new.telefone || coalesce(E'\n' || new.mensagem, '');
  end if;

  begin
    perform net.http_post(
      url  := 'https://ntfy.sh',
      body := jsonb_build_object(
        'topic', v_topico, 'title', v_titulo, 'message', v_msg,
        'tags', jsonb_build_array(case when tg_table_name = 'agendamentos' then 'calendar' else 'mortar_board' end),
        'priority', 4,
        'click', coalesce(nullif(v_site,''), 'https://ntfy.sh') || case when v_site is not null then '/admin.html' else '' end
      ),
      headers := '{"Content-Type":"application/json"}'::jsonb
    );
  exception when others then
    null; -- se a notificação falhar, o agendamento continua salvo
  end;
  return new;
end $$;

drop trigger if exists agendamento_notifica on public.agendamentos;
create trigger agendamento_notifica after insert on public.agendamentos
  for each row execute function public.notificar_celular();

drop trigger if exists interessada_notifica on public.interessadas;
create trigger interessada_notifica after insert on public.interessadas
  for each row execute function public.notificar_celular();

-- ---------- TEMPO REAL (painel atualiza sozinho) ----------
do $$ begin
  begin alter publication supabase_realtime add table public.agendamentos; exception when others then null; end;
  begin alter publication supabase_realtime add table public.interessadas; exception when others then null; end;
end $$;

-- ---------- PERMISSÕES ----------
grant usage on schema public to anon, authenticated;
grant select on public.servicos, public.horarios, public.folgas to anon, authenticated;
grant all on public.servicos, public.horarios, public.folgas, public.agendamentos,
             public.interessadas, public.config, public.admins to authenticated;
grant execute on function public.horarios_ocupados(date, date) to anon, authenticated;
grant execute on function public.criar_agendamento(text, text, text, text[], date, text) to anon, authenticated;
grant execute on function public.registrar_interesse(text, text, text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.reivindicar_admin() to authenticated;

-- ---------- DADOS INICIAIS ----------
insert into public.servicos (id, nome, categoria, descricao, preco, unidade, popular, ordem) values
 ('design',       'Design personalizado',     'sob', 'Epilação feita com cera, pinça e linha, desenhada para o formato do seu rosto.', 35,  null, true,  1),
 ('henna',        'Design com henna',         'sob', 'Design personalizado com henna para preencher falhas e dar definição.',          45,  null, false, 2),
 ('microblading', 'Microblading (fio a fio)', 'pmu', 'Fios desenhados um a um que imitam os pelos naturais. Resultado realista.',       380, null, true,  3),
 ('ombre',        'Ombré shadow',             'pmu', 'Olhar sensual, com o início da sobrancelha suave e esfumado que intensifica até a cauda.', 400, null, false, 4),
 ('shadowline',   'Shadowline',               'pmu', 'Fios no início e esfumado do meio até a cauda. O melhor das duas técnicas.',     450, null, false, 5),
 ('microlabial',  'Micro labial',             'lab', 'Micropigmentação para dar cor, contorno e volume visual aos lábios.',           400, null, false, 6),
 ('neutral',      'Neutralização labial',     'lab', 'Neutraliza o tom escurecido dos lábios. Valor cobrado por sessão.',             300, '/sessão', false, 7),
 ('spa',          'Spa dos lábios',           'lab', 'Limpeza, esfoliação e hidratação para lábios macios.',                          15,  null, false, 8),
 ('lifting',      'Lash lifting',             'olh', 'Curvatura dos cílios naturais com duração de 40 a 65 dias.',                     65,  null, false, 9),
 ('frances',      'Cílios look francês',      'olh', 'Um olhar marcante com praticidade no dia a dia.',                                45,  null, false, 10),
 ('buco',         'Epilação de buço',         'olh', 'Técnica com cera quente.',                                                       15,  null, false, 11)
on conflict (id) do nothing;

insert into public.horarios (dia_semana, horas) values
 (0, '{}'),
 (1, '{08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00}'),
 (2, '{08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00}'),
 (3, '{08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00}'),
 (4, '{08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00}'),
 (5, '{08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00}'),
 (6, '{08:00,09:00,10:00,11:00,13:00,14:00}')
on conflict (dia_semana) do nothing;

-- Pronto! Deve aparecer "Success. No rows returned".
