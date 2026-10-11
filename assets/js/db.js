/* =============================================================
   Camada de dados — Supabase (online) ou modo demonstração (local)
   ============================================================= */
(function () {
  const CFG = window.SITE_CONFIG || {};

  const SERVICOS_PADRAO = [
    { id: 'design', nome: 'Design personalizado', categoria: 'sob', descricao: 'Epilação feita com cera, pinça e linha, desenhada para o formato do seu rosto.', preco: 35, unidade: null, popular: true, ativo: true, ordem: 1 },
    { id: 'henna', nome: 'Design com henna', categoria: 'sob', descricao: 'Design personalizado com henna para preencher falhas e dar definição.', preco: 45, unidade: null, popular: false, ativo: true, ordem: 2 },
    { id: 'microblading', nome: 'Microblading (fio a fio)', categoria: 'pmu', descricao: 'Fios desenhados um a um que imitam os pelos naturais. Resultado realista.', preco: 380, unidade: null, popular: true, ativo: true, ordem: 3 },
    { id: 'ombre', nome: 'Ombré shadow', categoria: 'pmu', descricao: 'Olhar sensual, com o início da sobrancelha suave e esfumado que intensifica até a cauda.', preco: 400, unidade: null, popular: false, ativo: true, ordem: 4 },
    { id: 'shadowline', nome: 'Shadowline', categoria: 'pmu', descricao: 'Fios no início e esfumado do meio até a cauda. O melhor das duas técnicas.', preco: 450, unidade: null, popular: false, ativo: true, ordem: 5 },
    { id: 'microlabial', nome: 'Micro labial', categoria: 'lab', descricao: 'Micropigmentação para dar cor, contorno e volume visual aos lábios.', preco: 400, unidade: null, popular: false, ativo: true, ordem: 6 },
    { id: 'neutral', nome: 'Neutralização labial', categoria: 'lab', descricao: 'Neutraliza o tom escurecido dos lábios. Valor cobrado por sessão.', preco: 300, unidade: '/sessão', popular: false, ativo: true, ordem: 7 },
    { id: 'spa', nome: 'Spa dos lábios', categoria: 'lab', descricao: 'Limpeza, esfoliação e hidratação para lábios macios.', preco: 15, unidade: null, popular: false, ativo: true, ordem: 8 },
    { id: 'lifting', nome: 'Lash lifting', categoria: 'olh', descricao: 'Curvatura dos cílios naturais com duração de 40 a 65 dias.', preco: 65, unidade: null, popular: false, ativo: true, ordem: 9 },
    { id: 'frances', nome: 'Cílios look francês', categoria: 'olh', descricao: 'Um olhar marcante com praticidade no dia a dia.', preco: 45, unidade: null, popular: false, ativo: true, ordem: 10 },
    { id: 'buco', nome: 'Epilação de buço', categoria: 'olh', descricao: 'Técnica com cera quente.', preco: 15, unidade: null, popular: false, ativo: true, ordem: 11 }
  ];
  const UTIL = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const HORARIOS_PADRAO = { 0: [], 1: UTIL, 2: UTIL, 3: UTIL, 4: UTIL, 5: UTIL, 6: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00'] };

  const MENSAGENS = {
    NOME_INVALIDO: 'Digite seu nome completo.',
    TELEFONE_INVALIDO: 'Confira seu WhatsApp com DDD. Ex.: (71) 99999-0000',
    SEM_SERVICO: 'Escolha pelo menos um serviço.',
    DATA_INVALIDA: 'Essa data não está disponível. Escolha outra.',
    DIA_FECHADO: 'A Daniele não atende nesse dia. Escolha outra data.',
    HORARIO_INDISPONIVEL: 'Esse horário não está mais disponível. Escolha outro.',
    HORARIO_PASSOU: 'Esse horário já passou. Escolha outro.',
    HORARIO_OCUPADO: 'Outra cliente acabou de reservar esse horário. Escolha outro.',
    LIMITE_AGENDAMENTOS: 'Você já tem 3 agendamentos em aberto. Fale com a Daniele no WhatsApp.',
    LOGIN: 'E-mail ou senha incorretos.',
    SEM_ACESSO: 'Esta conta não tem acesso ao painel.',
    REDE: 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
  };
  function erro(code, detalhe) {
    const e = new Error(MENSAGENS[code] || detalhe || 'Algo deu errado. Tente de novo.');
    e.code = code; return e;
  }
  function erroSupabase(err) {
    const msg = (err && (err.message || err.details)) || '';
    const k = Object.keys(MENSAGENS).find(c => msg.includes(c));
    if (k) return erro(k);
    if (err && err.code === '23505') return erro('HORARIO_OCUPADO');
    if (/fetch|network/i.test(msg)) return erro('REDE');
    return erro('', msg);
  }

  // ---------- datas ----------
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const deIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const hojeIso = () => iso(new Date());
  const horaAgora = () => { const n = new Date(); return pad(n.getHours()) + ':' + pad(n.getMinutes()); };
  const soDigitos = s => String(s || '').replace(/\D/g, '');

  const temSupabase = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient);
  const DB = { modo: temSupabase ? 'online' : 'demo', util: { iso, deIso, hojeIso, pad, soDigitos }, SERVICOS_PADRAO, HORARIOS_PADRAO, MENSAGENS };

  /* =============================================================
     MODO ONLINE (Supabase)
     ============================================================= */
  if (temSupabase) {
    const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    DB.sb = sb;
    const ok = r => { if (r.error) throw erroSupabase(r.error); return r.data; };

    DB.getServicos = async (todos) => {
      let q = sb.from('servicos').select('*').order('ordem');
      const d = ok(await q);
      return todos ? d : d.filter(s => s.ativo);
    };
    DB.getHorarios = async () => {
      const d = ok(await sb.from('horarios').select('*'));
      const m = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      d.forEach(r => m[r.dia_semana] = (r.horas || []).slice().sort());
      return m;
    };
    DB.getFolgas = async () => ok(await sb.from('folgas').select('*').gte('data', hojeIso()).order('data'));
    DB.getOcupados = async (ini, fim) => ok(await sb.rpc('horarios_ocupados', { p_inicio: ini, p_fim: fim }));
    DB.criarAgendamento = async (a) => ok(await sb.rpc('criar_agendamento', {
      p_nome: a.nome, p_telefone: a.telefone, p_observacao: a.observacao || '',
      p_servicos: a.servicos, p_data: a.data, p_hora: a.hora
    }));
    DB.registrarInteresse = async (i) => ok(await sb.rpc('registrar_interesse', {
      p_nome: i.nome, p_telefone: i.telefone, p_interesse: i.interesse, p_mensagem: i.mensagem || ''
    }));

    // ----- painel -----
    DB.sessao = async () => { const { data } = await sb.auth.getSession(); return data.session ? { email: data.session.user.email } : null; };
    DB.entrar = async (email, senha) => {
      const r = await sb.auth.signInWithPassword({ email, password: senha });
      if (r.error) throw erro('LOGIN');
      const adm = ok(await sb.rpc('reivindicar_admin'));
      if (!adm) { await sb.auth.signOut(); throw erro('SEM_ACESSO'); }
      return { email: r.data.user.email };
    };
    DB.verificarAdmin = async () => ok(await sb.rpc('reivindicar_admin'));
    DB.sair = async () => { await sb.auth.signOut(); };
    DB.trocarSenha = async (nova) => { const r = await sb.auth.updateUser({ password: nova }); if (r.error) throw erro('', r.error.message); };

    DB.listarAgendamentos = async (desde, ate) => {
      let q = sb.from('agendamentos').select('*').order('data').order('hora');
      if (desde) q = q.gte('data', desde);
      if (ate) q = q.lte('data', ate);
      return ok(await q);
    };
    DB.atualizarStatus = async (id, status) => ok(await sb.from('agendamentos').update({ status }).eq('id', id));
    DB.criarManual = async (a) => ok(await sb.from('agendamentos').insert({
      nome: a.nome, telefone: a.telefone, observacao: a.observacao || null, servicos: a.itens,
      total: a.total, data: a.data, hora: a.hora, status: 'confirmado', origem: 'painel'
    }));
    DB.salvarHorarios = async (dia, horas) => ok(await sb.from('horarios').upsert({ dia_semana: dia, horas }));
    DB.listarFolgas = async () => ok(await sb.from('folgas').select('*').gte('data', hojeIso()).order('data'));
    DB.addFolga = async (data, motivo) => ok(await sb.from('folgas').upsert({ data, motivo: motivo || null }));
    DB.removerFolga = async (data) => ok(await sb.from('folgas').delete().eq('data', data));
    DB.salvarServico = async (s) => ok(await sb.from('servicos').upsert(s));
    DB.listarInteressadas = async () => ok(await sb.from('interessadas').select('*').order('criado_em', { ascending: false }));
    DB.marcarAtendida = async (id, v) => ok(await sb.from('interessadas').update({ atendida: v }).eq('id', id));
    DB.getConfig = async () => { const d = ok(await sb.from('config').select('*')); const o = {}; d.forEach(r => o[r.chave] = r.valor); return o; };
    DB.setConfig = async (chave, valor) => ok(await sb.from('config').upsert({ chave, valor }));
    DB.aoMudar = (cb) => {
      const ch = sb.channel('painel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, p => cb({ tabela: 'agendamentos', tipo: p.eventType, novo: p.new }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'interessadas' }, p => cb({ tabela: 'interessadas', tipo: p.eventType, novo: p.new }))
        .subscribe();
      return () => sb.removeChannel(ch);
    };
    window.DB = DB;
    return;
  }

  /* =============================================================
     MODO DEMONSTRAÇÃO (salva no navegador)
     ============================================================= */
  const KEY = 'daniele_demo_v1';
  let mem = null;
  function ler() {
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { }
    return mem;
  }
  function gravar(st) { mem = st; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  function semente() {
    const st = {
      servicos: SERVICOS_PADRAO.map(s => ({ ...s })),
      horarios: JSON.parse(JSON.stringify(HORARIOS_PADRAO)),
      folgas: [], agendamentos: [], interessadas: [], config: {}
    };
    // alguns exemplos para o painel não abrir vazio (marcados como exemplo)
    const prox = []; const d = new Date();
    while (prox.length < 3) { d.setDate(d.getDate() + 1); if (st.horarios[d.getDay()].length) prox.push(iso(d)); }
    const ex = (nome, ids, data, hora, status) => {
      const itens = st.servicos.filter(s => ids.includes(s.id)).map(s => ({ id: s.id, nome: s.nome, preco: s.preco }));
      st.agendamentos.push({ id: 'ex' + Math.random().toString(36).slice(2, 8), codigo: Math.random().toString(36).slice(2, 8).toUpperCase(), nome, telefone: '(71) 90000-0000', observacao: 'Agendamento de exemplo', servicos: itens, total: itens.reduce((a, s) => a + s.preco, 0), data, hora, status, origem: 'site', criado_em: new Date().toISOString() });
    };
    ex('Cliente de exemplo 1', ['design', 'henna'], prox[0], '09:00', 'novo');
    ex('Cliente de exemplo 2', ['microblading'], prox[0], '14:00', 'confirmado');
    ex('Cliente de exemplo 3', ['ombre'], prox[1], '10:00', 'novo');
    st.interessadas.push({ id: 'ex1', nome: 'Interessada de exemplo', telefone: '(71) 90000-0001', interesse: 'curso', mensagem: 'Quero saber a próxima turma', atendida: false, criado_em: new Date().toISOString() });
    return st;
  }
  function st() { let s = ler(); if (!s) { s = semente(); gravar(s); } return s; }
  const espera = (v, ms = 220) => new Promise(r => setTimeout(() => r(v), ms));
  const copia = v => JSON.parse(JSON.stringify(v));

  DB.getServicos = async (todos) => espera(copia(st().servicos.filter(s => todos || s.ativo).sort((a, b) => a.ordem - b.ordem)), 120);
  DB.getHorarios = async () => espera(copia(st().horarios), 120);
  DB.getFolgas = async () => espera(copia(st().folgas.filter(f => f.data >= hojeIso())), 80);
  DB.getOcupados = async (ini, fim) => espera(st().agendamentos.filter(a => a.status !== 'cancelado' && a.data >= ini && a.data <= fim).map(a => ({ data: a.data, hora: a.hora })), 200);
  DB.criarAgendamento = async (a) => {
    await espera(0, 650);
    const s = st();
    if ((a.nome || '').trim().length < 2) throw erro('NOME_INVALIDO');
    const tel = soDigitos(a.telefone); if (tel.length < 10 || tel.length > 13) throw erro('TELEFONE_INVALIDO');
    const itens = s.servicos.filter(x => a.servicos.includes(x.id) && x.ativo).map(x => ({ id: x.id, nome: x.nome, preco: x.preco }));
    if (!itens.length) throw erro('SEM_SERVICO');
    if (a.data < hojeIso()) throw erro('DATA_INVALIDA');
    if (s.folgas.some(f => f.data === a.data)) throw erro('DIA_FECHADO');
    if (!(s.horarios[deIso(a.data).getDay()] || []).includes(a.hora)) throw erro('HORARIO_INDISPONIVEL');
    if (a.data === hojeIso() && a.hora <= horaAgora()) throw erro('HORARIO_PASSOU');
    if (s.agendamentos.some(x => x.status !== 'cancelado' && x.data === a.data && x.hora === a.hora)) throw erro('HORARIO_OCUPADO');
    const row = { id: 'a' + Date.now(), codigo: Math.random().toString(36).slice(2, 8).toUpperCase(), nome: a.nome.trim(), telefone: a.telefone.trim(), observacao: a.observacao || null, servicos: itens, total: itens.reduce((t, x) => t + x.preco, 0), data: a.data, hora: a.hora, status: 'novo', origem: 'site', criado_em: new Date().toISOString() };
    s.agendamentos.push(row); gravar(s);
    return { codigo: row.codigo, total: row.total, servicos: row.servicos, data: row.data, hora: row.hora };
  };
  DB.registrarInteresse = async (i) => {
    await espera(0, 500);
    if ((i.nome || '').trim().length < 2) throw erro('NOME_INVALIDO');
    const tel = soDigitos(i.telefone); if (tel.length < 10 || tel.length > 13) throw erro('TELEFONE_INVALIDO');
    const s = st(); s.interessadas.unshift({ id: 'i' + Date.now(), nome: i.nome.trim(), telefone: i.telefone.trim(), interesse: i.interesse || 'curso', mensagem: i.mensagem || null, atendida: false, criado_em: new Date().toISOString() });
    gravar(s); return true;
  };

  DB.sessao = async () => { try { return JSON.parse(sessionStorage.getItem('daniele_demo_sessao')); } catch (e) { return DB._sess || null; } };
  DB.entrar = async (email, senha) => {
    await espera(0, 600);
    if (!email || !senha) throw erro('LOGIN');
    DB._sess = { email }; try { sessionStorage.setItem('daniele_demo_sessao', JSON.stringify(DB._sess)); } catch (e) { }
    return DB._sess;
  };
  DB.verificarAdmin = async () => true;
  DB.sair = async () => { DB._sess = null; try { sessionStorage.removeItem('daniele_demo_sessao'); } catch (e) { } };
  DB.trocarSenha = async () => espera(true);
  DB.listarAgendamentos = async (desde, ate) => espera(copia(st().agendamentos.filter(a => (!desde || a.data >= desde) && (!ate || a.data <= ate)).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))), 150);
  DB.atualizarStatus = async (id, status) => { const s = st(); const a = s.agendamentos.find(x => x.id === id); if (a) a.status = status; gravar(s); return espera(true, 120); };
  DB.criarManual = async (a) => {
    const s = st();
    if (s.agendamentos.some(x => x.status !== 'cancelado' && x.data === a.data && x.hora === a.hora)) throw erro('HORARIO_OCUPADO');
    s.agendamentos.push({ id: 'm' + Date.now(), codigo: Math.random().toString(36).slice(2, 8).toUpperCase(), nome: a.nome, telefone: a.telefone, observacao: a.observacao || null, servicos: a.itens, total: a.total, data: a.data, hora: a.hora, status: 'confirmado', origem: 'painel', criado_em: new Date().toISOString() });
    gravar(s); return espera(true);
  };
  DB.salvarHorarios = async (dia, horas) => { const s = st(); s.horarios[dia] = horas.slice().sort(); gravar(s); return espera(true, 150); };
  DB.listarFolgas = DB.getFolgas;
  DB.addFolga = async (data, motivo) => { const s = st(); s.folgas = s.folgas.filter(f => f.data !== data); s.folgas.push({ data, motivo: motivo || null }); s.folgas.sort((a, b) => a.data.localeCompare(b.data)); gravar(s); return espera(true); };
  DB.removerFolga = async (data) => { const s = st(); s.folgas = s.folgas.filter(f => f.data !== data); gravar(s); return espera(true); };
  DB.salvarServico = async (sv) => { const s = st(); const i = s.servicos.findIndex(x => x.id === sv.id); if (i >= 0) s.servicos[i] = { ...s.servicos[i], ...sv }; else s.servicos.push(sv); gravar(s); return espera(true, 150); };
  DB.listarInteressadas = async () => espera(copia(st().interessadas), 120);
  DB.marcarAtendida = async (id, v) => { const s = st(); const i = s.interessadas.find(x => x.id === id); if (i) i.atendida = v; gravar(s); return espera(true, 100); };
  DB.getConfig = async () => espera(copia(st().config), 80);
  DB.setConfig = async (k, v) => { const s = st(); s.config[k] = v; gravar(s); return espera(true, 100); };
  DB.aoMudar = (cb) => {
    const h = (e) => {
      if (e.key !== KEY || !e.newValue) return;
      const agora = JSON.parse(e.newValue);
      const antes = e.oldValue ? JSON.parse(e.oldValue) : { agendamentos: [], interessadas: [] };
      const ids = new Set(antes.agendamentos.map(a => a.id));
      agora.agendamentos.filter(a => !ids.has(a.id)).forEach(a => cb({ tabela: 'agendamentos', tipo: 'INSERT', novo: a }));
      const idsI = new Set(antes.interessadas.map(a => a.id));
      agora.interessadas.filter(a => !idsI.has(a.id)).forEach(a => cb({ tabela: 'interessadas', tipo: 'INSERT', novo: a }));
    };
    addEventListener('storage', h);
    return () => removeEventListener('storage', h);
  };
  DB.resetDemo = () => { try { localStorage.removeItem(KEY); } catch (e) { } mem = null; };
  window.DB = DB;
})();
