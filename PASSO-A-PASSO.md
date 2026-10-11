# Site da Daniele Oliveira — passo a passo

Tudo aqui é **gratuito**. Leva uns 20 minutos na primeira vez.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | Site principal (intro, serviços, agendamento, contato) |
| `curso.html` | Página "Saiba mais" do Curso Design Fairy e da mentoria |
| `admin.html` | Painel da Daniele (agenda, horários, preços, alunas, avisos) |
| `config.js` | **Único arquivo que você edita**: códigos do Supabase e WhatsApp |
| `supabase/banco.sql` | Script do banco de dados (você cola uma vez no Supabase) |
| `assets/` | Fotos, estilos e programação (não precisa mexer) |
| `vercel.json`, `admin.webmanifest` | Configurações da Vercel e do app do painel |

> **Antes de configurar**, o site já funciona em *modo demonstração*: abra o `index.html` no Chrome, faça um agendamento e depois abra o `admin.html` (qualquer e-mail e senha). Nesse modo os dados ficam só no seu navegador.

---

## PARTE 1 — Criar o banco de dados (Supabase)

1. Entre em **supabase.com** e clique em **Start your project** (pode entrar com a conta do GitHub).
2. Clique em **New project**:
   - **Name:** `daniele-oliveira`9Jhuw9eu33EW8JT
   - **Database Password:** crie uma senha e guarde (não vai precisar no dia a dia)
   - **Region:** `South America (São Paulo)`
   - Clique em **Create new project** e espere uns 2 minutos.
3. No menu da esquerda, abra **SQL Editor** → **New query**.
4. Abra o arquivo `supabase/banco.sql` no Bloco de Notas, **copie tudo**, cole no Supabase e clique em **Run**.
   - Tem que aparecer **"Success. No rows returned"**.
5. Crie o login da Daniele: menu **Authentication** → **Users** → **Add user** → **Create new user**.
   - Coloque o e-mail e uma senha para ela.
   - Deixe marcado **Auto Confirm User**.
   - Clique em **Create user**.
6. Segurança: menu **Authentication** → **Sign In / Providers** → desligue **Allow new users to sign up** → **Save**.
   *(Assim ninguém consegue criar outra conta. E mesmo que tentassem, o painel só aceita a primeira conta que entrar nele.)*
7. Pegue os dois códigos: **Project Settings** (engrenagem) → **API** (ou o botão **Connect** no topo do projeto):
   - **Project URL** (começa com `https://...supabase.co`)
   - Chave **anon public** (um texto bem longo). Se aparecer só **Publishable key** (`sb_publishable_...`), use ela.
8. Abra o arquivo `config.js` no Bloco de Notas e cole entre as aspas:

```js
SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
SUPABASE_ANON_KEY: "cole-a-chave-aqui",
```

Salve o arquivo. Pronto, o site agora usa a agenda de verdade.

---

## PARTE 2 — Colocar o site no ar (Vercel)

1. Entre em **github.com** → botão **+** (canto de cima) → **New repository**.
   - Nome: `daniele-oliveira` → **Create repository**.
2. Na página do repositório, clique em **uploading an existing file**.
3. Abra a pasta do projeto no computador, **selecione tudo que está dentro dela** (não a pasta em si) e arraste para o GitHub. Espere subir e clique em **Commit changes**.
4. Entre em **vercel.com** → **Add New…** → **Project** → escolha `daniele-oliveira` → **Import** → **Deploy**.
   - Não precisa mudar nenhuma configuração.
5. Em 1 minuto o site está no ar, em algo como `daniele-oliveira.vercel.app`.
   - Site: `daniele-oliveira.vercel.app`
   - Curso: `daniele-oliveira.vercel.app/curso`
   - Painel: `daniele-oliveira.vercel.app/admin`

**Para atualizar depois:** suba o arquivo alterado de novo no GitHub (*Add file → Upload files*). A Vercel atualiza o site sozinha.

*Alternativa ainda mais simples:* em **app.netlify.com/drop** é só arrastar a pasta inteira. O site já sai com link.

**Domínio próprio (opcional):** Vercel → seu projeto → **Settings** → **Domains** → digite o domínio comprado e siga as instruções.

---

## PARTE 3 — Primeiro acesso da Daniele

1. Abra `seusite.vercel.app/admin` e entre com o e-mail e a senha da Parte 1.
2. **Horários:** toque em cada dia da semana e deixe em dourado só os horários que ela atende. Salva sozinho.
   - "Copiar para outros dias" repete a mesma grade nos outros dias.
   - Em **Folgas e feriados** ela fecha um dia inteiro.
3. **Serviços:** confira preços. Dá para esconder um serviço (botão liga/desliga) e marcar ★ "mais procurado".
4. **Aviso no celular** (aba Ajustes):
   1. Instale o app gratuito **ntfy** (App Store ou Google Play).
   2. No painel, toque em **Gerar código**.
   3. No app ntfy, toque em **+**, cole o código e salve (deixe o servidor padrão `ntfy.sh`).
   4. No painel, toque em **Enviar notificação de teste**. A notificação chega no celular.
   - A partir daí, **cada agendamento novo e cada interessada no curso** chega como notificação, mesmo com o painel fechado.
5. **Painel como app:** no celular, abra o painel → **Compartilhar** → **Adicionar à Tela de Início**.

---

## PARTE 4 — Teste final (2 minutos)

1. No celular, abra o site e faça um agendamento com seu nome.
2. Confira: a notificação chega no celular, e o agendamento aparece no painel (com som, se estiver aberto).
3. No painel, toque em **Cancelar** nesse teste para liberar o horário.

---

## Como funciona no dia a dia

- A cliente escolhe serviço, dia e horário livre. O horário fica **reservado na hora**, e duas clientes nunca pegam o mesmo horário.
- Os preços sempre vêm do banco, então ninguém consegue mudar o valor pelo navegador.
- No painel, cada agendamento novo aparece como **Novo**. Ao tocar em **Confirmar**, abre o WhatsApp da cliente com a mensagem de confirmação pronta.
- **Novo agendamento** no painel serve para clientes que marcaram por WhatsApp ou Instagram. O horário some do site na hora.
- Interessadas no curso ou na mentoria aparecem na aba **Alunas**, com botão para chamar no WhatsApp.

## Problemas comuns

- **O site mostra "Modo demonstração"** → o `config.js` está vazio ou não subiu. Confira a Parte 1, passo 8, e suba de novo.
- **"E-mail ou senha incorretos"** → confira o usuário em Authentication → Users e se o **Auto Confirm** foi marcado.
- **"Esta conta não tem acesso ao painel"** → outra conta entrou primeiro no painel. No Supabase, abra **Table Editor** → tabela `admins`, apague a linha e entre de novo com a conta certa.
- **A notificação não chega** → confira se o código no app ntfy é exatamente o do painel e se as notificações do app estão permitidas no celular.
- **Supabase pausado** → no plano grátis, um projeto parado por muitos dias pode ser pausado. Entre em supabase.com e clique em **Restore project**.
