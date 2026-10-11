/* =============================================================
   Painel da Daniele
   ============================================================= */
(function () {
  const CFG = window.SITE_CONFIG || {};
  const U = DB.util;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: Number(v) % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const DIAS_C = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const IMG = id => ['design', 'henna', 'microblading', 'ombre', 'shadowline', 'microlabial', 'neutral', 'spa', 'lifting', 'frances', 'buco'].includes(id) ? `assets/img/${id}.jpg` : 'assets/img/circle.jpg';
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (e) { return d } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };

  let SVC = [], AG = [], INT = [], H = {}, FOLGAS = [], CONF = {};
  let filtro = 'prox', diaFiltro = null, filtroA = 'pend', diaSel = 1, seen = new Set(), seenI = new Set(), freshIds = new Set();
  const hoje = () => U.hojeIso();
  const addDias = (iso, n) => { const d = U.deIso(iso); d.setDate(d.getDate() + n); return U.iso(d) };
  const fmtDia = iso => U.deIso(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
  const fmtLongo = iso => U.deIso(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const telWa = t => { let d = U.soDigitos(t); if (d.length <= 11) d = '55' + d; return d };
  const baseSite = () => (location.origin + location.pathname.replace(/\/admin(\.html)?\/?$/, '')).replace(/\/$/, '');
  const waUrl = (num, msg) => 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  function abrir(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove(); }

  /* ---------- efeitos ---------- */
  document.addEventListener('contextmenu', e => { if (!e.target.closest('input,textarea,code')) e.preventDefault() });
  document.addEventListener('dragstart', e => e.preventDefault());
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn'); if (!b || reduce) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), i = document.createElement('i');
    i.className = 'ripple'; i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`; b.append(i); setTimeout(() => i.remove(), 650);
  });
  function burst(el, n) {
    if (reduce || !el) return; const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    for (let i = 0; i < (n || 14); i++) {
      const s = document.createElement('i'); s.className = 'burst'; const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60;
      s.style.left = x + 'px'; s.style.top = y + 'px'; document.body.append(s);
      s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove();
    }
  }
  function toast(titulo, sub, opt = {}) {
    const t = document.createElement('div'); t.className = 'tst' + (opt.big ? ' big' : '');
    t.innerHTML = `<i>${opt.icon || '✓'}</i><div><b>${esc(titulo)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div><small>${opt.big ? 'agora' : ''}</small>`;
    t.onclick = () => { fechar(); if (opt.onClick) opt.onClick() };
    $('#toasts').prepend(t);
    const fechar = () => { t.classList.add('out'); setTimeout(() => t.remove(), 400) };
    setTimeout(fechar, opt.big ? 8000 : 2600);
  }
  function contar(el, alvo, money) {
    const de = +(el.dataset.v || 0), st = performance.now(); el.dataset.v = alvo;
    const f = n => { const p = Math.min(1, (n - st) / 900), v = de + (alvo - de) * (1 - Math.pow(1 - p, 3)); el.textContent = money ? brl(Math.round(v)) : Math.round(v); if (p < 1) requestAnimationFrame(f) };
    requestAnimationFrame(f);
  }
  let audio;
  function chime() {
    if (!lsGet('painel_som', true)) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [[880, 0], [1320, .16], [1760, .32]].forEach(([f, t]) => {
        const o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, audio.currentTime + t); g.gain.linearRampToValueAtTime(.18, audio.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + t + .6);
        o.connect(g).connect(audio.destination); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + .65);
      });
    } catch (e) { }
  }
  document.addEventListener('pointerdown', () => { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume() } catch (e) { } }, { once: true });

  /* poeira do login */
  function dust(canvas) {
    const c = canvas.getContext('2d'); let W, H2, P = []; const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { W = canvas.clientWidth; H2 = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H2 * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0) }; size(); addEventListener('resize', size);
    for (let i = 0; i < (reduce ? 0 : 70); i++) P.push({ x: Math.random() * W, y: Math.random() * H2, r: Math.random() * 1.7 + .3, v: Math.random() * .35 + .08, t: Math.random() * 6 });
    (function f() { if (!$('#login') || $('#login').hidden) return; requestAnimationFrame(f); c.clearRect(0, 0, W, H2); P.forEach(p => { p.t += .02; p.y -= p.v; p.x += Math.sin(p.t) * .2; if (p.y < -5) { p.y = H2 + 5; p.x = Math.random() * W } c.beginPath(); c.fillStyle = `rgba(240,214,168,${.25 + Math.sin(p.t * 2) * .2 + .2})`; c.arc(p.x, p.y, p.r, 0, 7); c.fill() }) })();
  }

  /* ============================================================
     LOGIN
     ============================================================ */
  async function iniciar() {
    if (DB.modo === 'demo') { $('#lDemo').hidden = false; $('#demoPill').hidden = false; $('#demoReset').hidden = false; $('#pwBox').hidden = true; }
    let s = null; try { s = await DB.sessao(); } catch (e) { }
    if (s) { try { if (await DB.verificarAdmin()) return abrirApp(s); } catch (e) { } }
    mostrarLogin();
  }
  function mostrarLogin() { $('#app').hidden = true; $('#login').hidden = false; dust($('#lDust')); setTimeout(() => $('#lEmail').focus(), 400); }
  $('#lEye').onclick = () => { const i = $('#lPass'); i.type = i.type === 'password' ? 'text' : 'password'; $('#lEye').textContent = i.type === 'password' ? 'ver' : 'ocultar' };
  $('#lForm').addEventListener('submit', async e => {
    e.preventDefault(); const btn = $('#lBtn'); $('#lErr').textContent = '';
    btn.classList.add('loading');
    try { const s = await DB.entrar($('#lEmail').value.trim(), $('#lPass').value); abrirApp(s); }
    catch (ex) { $('#lErr').textContent = ex.message; $('#lForm').classList.remove('shake'); void $('#lForm').offsetWidth; $('#lForm').classList.add('shake'); }
    finally { btn.classList.remove('loading'); }
  });

  /* ============================================================
     APP
     ============================================================ */
  async function abrirApp(s) {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#accEmail').textContent = s && s.email ? s.email : '';
    const h = new Date().getHours();
    $('#hello').innerHTML = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + ', Daniele<span class="hello-date"> · ' + new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) + '</span>';
    $('#tabbar').innerHTML = $('#nav').innerHTML;
    $$('#nav button, #tabbar button').forEach(b => b.onclick = () => ver(b.dataset.v));
    $('#siteUrl').textContent = baseSite() + '/';
    ver(location.hash.slice(1) || 'agenda');
    $('#list').innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    await carregarTudo(true);
    DB.aoMudar(onMudanca);
    setInterval(() => sincronizar(), 45000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar() });
  }
  const TITULOS = { agenda: 'Agenda', horarios: 'Horários', servicos: 'Serviços', alunas: 'Alunas', ajustes: 'Ajustes' };
  function ver(v) {
    if (!TITULOS[v]) v = 'agenda';
    $$('.view').forEach(s => s.classList.toggle('on', s.dataset.view === v));
    $$('#nav button, #tabbar button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    $('#vTitle').textContent = TITULOS[v];
    history.replaceState(null, '', '#' + v);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  async function carregarTudo(primeira) {
    try {
      const [svc, ag, it, h, fg, cf] = await Promise.all([
        DB.getServicos(true), DB.listarAgendamentos(addDias(hoje(), -90)), DB.listarInteressadas(), DB.getHorarios(), DB.listarFolgas(), DB.getConfig()
      ]);
      SVC = svc; AG = ag; INT = it; H = h; FOLGAS = fg; CONF = cf || {};
      if (primeira) { AG.forEach(a => seen.add(a.id)); INT.forEach(i => seenI.add(i.id)); }
      $('#liveTxt').textContent = 'Ao vivo · ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { toast('Não consegui carregar', e.message, { icon: '!' }); }
    renderAgenda(); renderDias(); renderDia(); renderFolgas(); renderServicos(); renderAlunas(); renderAjustes();
  }

  /* ---------- tempo real ---------- */
  function onMudanca(ev) {
    if (ev.tabela === 'agendamentos') {
      if (ev.tipo === 'INSERT' && ev.novo && !seen.has(ev.novo.id)) { AG.push(ev.novo); novoAgendamento(ev.novo); }
      else if (ev.tipo === 'UPDATE' && ev.novo) { const i = AG.findIndex(a => a.id === ev.novo.id); if (i >= 0) AG[i] = ev.novo; }
      else if (ev.tipo === 'DELETE') { sincronizar(); return; }
      renderAgenda();
    } else if (ev.tabela === 'interessadas') {
      if (ev.tipo === 'INSERT' && ev.novo && !seenI.has(ev.novo.id)) { INT.unshift(ev.novo); novaInteressada(ev.novo); }
      renderAlunas();
    }
  }
  async function sincronizar() {
    try {
      const [ag, it] = await Promise.all([DB.listarAgendamentos(addDias(hoje(), -90)), DB.listarInteressadas()]);
      ag.filter(a => !seen.has(a.id)).forEach(novoAgendamento);
      it.filter(i => !seenI.has(i.id)).forEach(novaInteressada);
      AG = ag; INT = it; renderAgenda(); renderAlunas();
      $('#liveTxt').textContent = 'Ao vivo · ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { $('#liveTxt').textContent = 'Sem conexão'; }
  }
  function novoAgendamento(a) {
    seen.add(a.id); if (a.origem === 'painel') return;
    freshIds.add(a.id);
    const quando = fmtDia(a.data) + ' às ' + a.hora;
    toast('Nova cliente: ' + a.nome, quando + ' · ' + brl(a.total), { big: true, icon: '✦', onClick: () => { ver('agenda'); setFiltro('novos') } });
    chime(); $('#bell').classList.remove('ring'); void $('#bell').offsetWidth; $('#bell').classList.add('ring'); burst($('#bell'), 16);
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Novo agendamento · ' + a.nome, { body: quando + '\n' + (a.servicos || []).map(s => s.nome).join(', '), icon: 'assets/img/icone-192.png' }); } catch (e) { }
  }
  function novaInteressada(i) {
    seenI.add(i.id);
    toast((i.interesse === 'mentoria' ? 'Interessada na mentoria: ' : 'Interessada no curso: ') + i.nome, i.telefone, { big: true, icon: '🎓', onClick: () => ver('alunas') });
    chime();
  }

  /* ============================================================
     AGENDA
     ============================================================ */
  const ativo = a => a.status !== 'cancelado';
  function renderAgenda() {
    const h = hoje(), sem = addDias(h, 6), mesIni = h.slice(0, 8) + '01', mesFim = h.slice(0, 8) + '31';
    const novos = AG.filter(a => a.status === 'novo' && a.data >= h);
    contar($('[data-k=hoje]'), AG.filter(a => ativo(a) && a.data === h).length);
    contar($('[data-k=semana]'), AG.filter(a => ativo(a) && a.data >= h && a.data <= sem).length);
    contar($('[data-k=novos]'), novos.length);
    contar($('[data-k=mes]'), AG.filter(a => ativo(a) && a.data >= mesIni && a.data <= mesFim).reduce((t, a) => t + Number(a.total || 0), 0), true);
    ['#bAgenda', '#bBell'].forEach(s => $$(s).forEach(b => { b.textContent = novos.length; b.hidden = !novos.length }));
    $$('#tabbar [data-v=agenda] .badge').forEach(b => { b.textContent = novos.length; b.hidden = !novos.length });
    document.title = (novos.length ? `(${novos.length}) ` : '') + 'Painel · Daniele Oliveira';

    // faixa de 14 dias
    let st = `<button class="sd all${diaFiltro ? '' : ' on'}" data-d="">Todos</button>`;
    for (let i = 0; i < 14; i++) {
      const d = addDias(h, i), n = AG.filter(a => ativo(a) && a.data === d).length, dt = U.deIso(d);
      st += `<button class="sd${diaFiltro === d ? ' on' : ''}" data-d="${d}" style="animation-delay:${i * 25}ms"><small>${i === 0 ? 'Hoje' : DIAS_C[dt.getDay()]}</small><b>${dt.getDate()}</b><i class="${n ? 'has' : ''}">${n}</i></button>`;
    }
    $('#strip').innerHTML = st;

    // lista
    let L;
    if (diaFiltro) L = AG.filter(a => a.data === diaFiltro);
    else if (filtro === 'novos') L = novos;
    else if (filtro === 'hist') L = AG.filter(a => a.data < h || a.status === 'concluido' || a.status === 'cancelado').sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, 80);
    else L = AG.filter(a => a.data >= h && (a.status === 'novo' || a.status === 'confirmado'));
    if (filtro !== 'hist' || diaFiltro) L = L.slice().sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

    if (!L.length) {
      const msg = diaFiltro ? ['Dia livre', 'Nenhum agendamento em ' + fmtLongo(diaFiltro) + '.'] : filtro === 'novos' ? ['Tudo confirmado', 'Nenhum agendamento esperando sua confirmação.'] : filtro === 'hist' ? ['Sem histórico ainda', 'Os atendimentos passados aparecem aqui.'] : ['Agenda livre', 'Quando uma cliente agendar pelo site, ela aparece aqui na hora.'];
      $('#list').innerHTML = `<div class="empty"><b>${msg[0]}</b>${msg[1]}</div>`; return;
    }
    let html = '', ult = '', i = 0;
    L.forEach(a => {
      if (a.data !== ult) { ult = a.data; html += `<div class="dgroup">${a.data === h ? 'Hoje · ' : a.data === addDias(h, 1) ? 'Amanhã · ' : ''}${fmtLongo(a.data)}</div>`; }
      html += cardAg(a, i++);
    });
    $('#list').innerHTML = html;
    freshIds.clear();
  }
  const ROT = { novo: 'Novo', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' };
  function cardAg(a, i) {
    const svcs = (a.servicos || []).map(s => s.nome).join(' · ');
    let act = '';
    if (a.status === 'novo') act += `<button class="btn gold sm" data-a="confirmar" data-id="${a.id}">✓ Confirmar</button>`;
    act += `<button class="btn wa sm" data-a="wa" data-id="${a.id}">WhatsApp</button>`;
    if (a.status === 'confirmado') act += `<button class="btn ok sm" data-a="concluir" data-id="${a.id}">Concluído</button>`;
    if (a.status === 'novo' || a.status === 'confirmado') act += `<button class="btn ghost sm" data-a="cancelar" data-id="${a.id}">Cancelar</button>`;
    if (a.status === 'cancelado' && a.data >= hoje()) act += `<button class="btn ghost sm" data-a="reabrir" data-id="${a.id}">Reabrir</button>`;
    return `<article class="ap st-${a.status}${freshIds.has(a.id) ? ' fresh' : ''}" data-id="${a.id}" style="animation-delay:${Math.min(i, 10) * 40}ms">
      <div class="ap-time"><b>${esc(a.hora)}</b><small>${fmtDia(a.data).split(',')[0]}</small></div>
      <div class="ap-main">
        <h3>${esc(a.nome)}</h3>
        <div class="ap-svcs">${esc(svcs)}</div>
        <div class="ap-meta"><b>${brl(a.total)}</b><span>${esc(a.telefone)}</span><span>Cód. ${esc(a.codigo || '')}</span>${a.origem === 'painel' ? '<span>Marcado por você</span>' : ''}</div>
        ${a.observacao ? `<div class="ap-obs">“${esc(a.observacao)}”</div>` : ''}
        <div class="ap-act">${act}</div>
      </div>
      <span class="pill p-${a.status}">${ROT[a.status] || a.status}</span>
    </article>`;
  }
  const agById = id => AG.find(a => a.id === id);
  function msgConfirma(a) { return `Olá, ${a.nome.split(' ')[0]}! Aqui é a Daniele Oliveira. Seu horário está confirmado ✨\n\n${(a.servicos || []).map(s => '• ' + s.nome).join('\n')}\n📅 ${fmtLongo(a.data)} às ${a.hora}\n\nQualquer dúvida é só me chamar!` }
  function msgCancela(a) { return `Olá, ${a.nome.split(' ')[0]}! Aqui é a Daniele Oliveira. Infelizmente precisei cancelar seu horário de ${fmtLongo(a.data)} às ${a.hora}. Me chama aqui que a gente remarca, tá bom?` }
  async function setStatus(a, st, btn) {
    if (btn) btn.classList.add('loading');
    try { await DB.atualizarStatus(a.id, st); a.status = st; renderAgenda(); toast(st === 'confirmado' ? 'Agendamento confirmado' : st === 'cancelado' ? 'Agendamento cancelado' : st === 'concluido' ? 'Atendimento concluído' : 'Agendamento reaberto', a.nome); }
    catch (e) { toast('Não foi possível salvar', e.message, { icon: '!' }); if (btn) btn.classList.remove('loading'); }
  }
  $('#list').addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = agById(b.dataset.id); if (!a) return;
    const card = b.closest('.ap');
    switch (b.dataset.a) {
      case 'confirmar': abrir(waUrl(telWa(a.telefone), msgConfirma(a))); burst(b, 12); setStatus(a, 'confirmado', b); break;
      case 'wa': abrir(waUrl(telWa(a.telefone), `Olá, ${a.nome.split(' ')[0]}! Aqui é a Daniele Oliveira.`)); break;
      case 'concluir': burst(b, 10); setStatus(a, 'concluido', b); break;
      case 'reabrir': setStatus(a, 'novo', b); break;
      case 'cancelar': {
        if (card.querySelector('.confirm-box')) return;
        const box = document.createElement('div'); box.className = 'confirm-box';
        box.innerHTML = `<span>Cancelar o horário de ${esc(a.nome.split(' ')[0])}?</span><button class="btn ghost sm" data-c="avisar">Cancelar e avisar</button><button class="btn ghost sm" data-c="so">Só cancelar</button><button class="btn sm" data-c="nao">Voltar</button>`;
        card.querySelector('.ap-main').append(box);
        box.addEventListener('click', ev => {
          const c = ev.target.closest('[data-c]'); if (!c) return; ev.stopPropagation();
          if (c.dataset.c === 'nao') return box.remove();
          if (c.dataset.c === 'avisar') abrir(waUrl(telWa(a.telefone), msgCancela(a)));
          setStatus(a, 'cancelado', c);
        });
        break;
      }
    }
  });
  function setFiltro(f) { filtro = f; diaFiltro = null; $$('#seg button').forEach(b => b.classList.toggle('on', b.dataset.f === f)); renderAgenda(); }
  $('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFiltro(b.dataset.f) });
  $('#strip').addEventListener('click', e => { const b = e.target.closest('.sd'); if (!b) return; diaFiltro = b.dataset.d || null; renderAgenda(); });
  $('#bell').onclick = () => { ver('agenda'); setFiltro('novos'); };

  /* ---------- novo agendamento manual ---------- */
  $('#addBtn').onclick = () => {
    $('#mSvcs').innerHTML = SVC.filter(s => s.ativo).map(s => `<label><input type="checkbox" value="${esc(s.id)}"><span>${esc(s.nome)}</span></label>`).join('');
    $('#mData').value = diaFiltro || hoje(); $('#mData').min = hoje(); $('#mHora').value = '';
    ['#mNome', '#mTel', '#mObs'].forEach(s => $(s).value = ''); $('#mErr').textContent = '';
    $('#modal').hidden = false; setTimeout(() => $('#mNome').focus(), 300);
  };
  const fecharModal = () => { $('#modal').hidden = true };
  $('#mCancel').onclick = fecharModal;
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') fecharModal() });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) fecharModal() });
  $('#mForm').addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#mErr'); err.textContent = '';
    const ids = $$('#mSvcs input:checked').map(i => i.value);
    const nome = $('#mNome').value.trim(), tel = $('#mTel').value.trim(), data = $('#mData').value, hora = $('#mHora').value;
    if (nome.length < 2) return err.textContent = 'Digite o nome da cliente.';
    if (!ids.length) return err.textContent = 'Escolha pelo menos um serviço.';
    if (!data || !hora) return err.textContent = 'Escolha data e horário.';
    const itens = SVC.filter(s => ids.includes(s.id)).map(s => ({ id: s.id, nome: s.nome, preco: Number(s.preco) }));
    const btn = $('#mSave'); btn.classList.add('loading');
    try {
      await DB.criarManual({ nome, telefone: tel || '-', observacao: $('#mObs').value.trim(), itens, total: itens.reduce((t, s) => t + s.preco, 0), data, hora });
      fecharModal(); toast('Agendamento salvo', nome + ' · ' + fmtDia(data) + ' ' + hora);
      AG = await DB.listarAgendamentos(addDias(hoje(), -90)); AG.forEach(a => seen.add(a.id)); renderAgenda();
    } catch (ex) { err.textContent = ex.code === 'HORARIO_OCUPADO' ? 'Já existe uma cliente nesse dia e horário.' : ex.message; }
    finally { btn.classList.remove('loading'); }
  });

  /* ============================================================
     HORÁRIOS
     ============================================================ */
  const TODAS = []; for (let h = 7; h <= 21; h++) { TODAS.push(U.pad(h) + ':00'); if (h < 21) TODAS.push(U.pad(h) + ':30'); }
  const lembrar = {};
  function renderDias() {
    $('#days').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => { const n = (H[d] || []).length; return `<button class="dbtn${d === diaSel ? ' on' : ''}${n ? '' : ' off'}" data-d="${d}"><b>${DIAS_C[d]}</b><i>${n ? n + 'h' : 'fechado'}</i></button>` }).join('');
  }
  function renderDia() {
    const hs = new Set(H[diaSel] || []);
    $('#dcName').textContent = DIAS[diaSel];
    $('#dcOpen').checked = hs.size > 0;
    $('#dayCard').classList.toggle('closed', !hs.size);
    const ord = [...hs].sort();
    $('#dcInfo').textContent = hs.size ? `${hs.size} horários · das ${ord[0]} às ${ord[ord.length - 1]}` : 'Você não atende neste dia';
    const grupos = [['Manhã', h => h < '12:00'], ['Tarde', h => h >= '12:00' && h < '18:00'], ['Noite', h => h >= '18:00']];
    let k = 0;
    $('#hourGrid').innerHTML = grupos.map(([n, f]) => `<div class="hgroup"><small>${n}</small><div class="hgrid">${TODAS.filter(f).map(h => `<button class="hc${hs.has(h) ? ' on' : ''}" data-h="${h}" aria-pressed="${hs.has(h)}" style="animation:viewIn .35s ${(k++) * 12}ms both">${h}</button>`).join('')}</div></div>`).join('');
  }
  $('#days').addEventListener('click', e => { const b = e.target.closest('.dbtn'); if (!b) return; diaSel = +b.dataset.d; $('#copyBox').hidden = true; renderDias(); renderDia(); });
  $('#hourGrid').addEventListener('click', e => {
    const b = e.target.closest('.hc'); if (!b) return;
    const s = new Set(H[diaSel] || []); const h = b.dataset.h; s.has(h) ? s.delete(h) : s.add(h);
    H[diaSel] = [...s].sort(); b.classList.toggle('on'); b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip');
    salvarDia(diaSel); renderDias(); atualizarInfo();
  });
  function atualizarInfo() { const hs = (H[diaSel] || []).slice().sort(); $('#dcOpen').checked = hs.length > 0; $('#dayCard').classList.toggle('closed', !hs.length); $('#dcInfo').textContent = hs.length ? `${hs.length} horários · das ${hs[0]} às ${hs[hs.length - 1]}` : 'Você não atende neste dia'; }
  $('#dcOpen').addEventListener('change', e => {
    if (e.target.checked) H[diaSel] = lembrar[diaSel] && lembrar[diaSel].length ? lembrar[diaSel] : ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    else { lembrar[diaSel] = (H[diaSel] || []).slice(); H[diaSel] = []; }
    salvarDia(diaSel); renderDias(); renderDia();
  });
  $('#dcQuick').addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b) return; const s = new Set(H[diaSel] || []);
    const blocos = { manha: ['08:00', '09:00', '10:00', '11:00'], tarde: ['13:00', '14:00', '15:00', '16:00', '17:00'], noite: ['18:00', '19:00', '20:00'] };
    if (b.dataset.q === 'limpar') s.clear();
    else { const bl = blocos[b.dataset.q]; const todos = bl.every(h => s.has(h)); bl.forEach(h => todos ? s.delete(h) : s.add(h)); }
    H[diaSel] = [...s].sort(); salvarDia(diaSel); renderDias(); renderDia();
  });
  const timers = {};
  function salvarDia(d) {
    const st = $('#saveSt'); st.className = 'save-st'; st.textContent = 'Salvando…';
    clearTimeout(timers[d]);
    timers[d] = setTimeout(async () => {
      try { await DB.salvarHorarios(d, (H[d] || []).slice().sort()); st.className = 'save-st ok'; st.textContent = '✓ Salvo · já aparece no site'; }
      catch (e) { st.className = 'save-st'; st.textContent = 'Erro ao salvar: ' + e.message; }
    }, 500);
  }
  $('#copyBtn').onclick = () => {
    $('#copyDays').innerHTML = [1, 2, 3, 4, 5, 6, 0].filter(d => d !== diaSel).map(d => `<label><input type="checkbox" value="${d}"><span>${DIAS_C[d]}</span></label>`).join('');
    $('#copyBox').hidden = false;
  };
  $('#copyCancel').onclick = () => $('#copyBox').hidden = true;
  $('#copyApply').onclick = async () => {
    const alvo = $$('#copyDays input:checked').map(i => +i.value); if (!alvo.length) return;
    const btn = $('#copyApply'); btn.classList.add('loading');
    try { for (const d of alvo) { H[d] = (H[diaSel] || []).slice(); await DB.salvarHorarios(d, H[d]); } toast('Horários copiados', alvo.map(d => DIAS_C[d]).join(', ')); $('#copyBox').hidden = true; renderDias(); }
    catch (e) { toast('Erro ao copiar', e.message, { icon: '!' }); }
    finally { btn.classList.remove('loading'); }
  };

  /* folgas */
  function renderFolgas() {
    $('#fgData').min = hoje();
    $('#folgas').innerHTML = FOLGAS.length ? FOLGAS.map((f, i) => `<div class="fg" style="animation-delay:${i * 40}ms"><div><b>${fmtLongo(f.data)}</b><br><span>${esc(f.motivo || 'Dia fechado')}</span></div><button class="x" data-d="${f.data}" aria-label="Reabrir dia">✕</button></div>`).join('') : '<p class="muted" style="margin-top:6px">Nenhuma folga marcada.</p>';
  }
  $('#fgAdd').onclick = async () => {
    const d = $('#fgData').value, err = $('#fgErr'); err.textContent = '';
    if (!d) return err.textContent = 'Escolha a data.';
    if (d < hoje()) return err.textContent = 'Escolha uma data a partir de hoje.';
    const btn = $('#fgAdd'); btn.classList.add('loading');
    try {
      await DB.addFolga(d, $('#fgMotivo').value.trim()); FOLGAS = await DB.listarFolgas(); renderFolgas();
      const n = AG.filter(a => ativo(a) && a.data === d).length;
      toast('Dia fechado', fmtLongo(d)); if (n) toast(`Atenção: ${n} cliente${n > 1 ? 's' : ''} já marcada${n > 1 ? 's' : ''} nesse dia`, 'Veja na agenda e avise pelo WhatsApp.', { icon: '!', big: true, onClick: () => { ver('agenda'); diaFiltro = d; renderAgenda() } });
      $('#fgData').value = ''; $('#fgMotivo').value = '';
    } catch (e) { err.textContent = e.message; }
    finally { btn.classList.remove('loading'); }
  };
  $('#folgas').addEventListener('click', async e => { const b = e.target.closest('.x'); if (!b) return; b.closest('.fg').style.opacity = .3; try { await DB.removerFolga(b.dataset.d); FOLGAS = FOLGAS.filter(f => f.data !== b.dataset.d); renderFolgas(); toast('Dia reaberto', fmtLongo(b.dataset.d)); } catch (ex) { toast('Erro', ex.message, { icon: '!' }) } });

  /* ============================================================
     SERVIÇOS
     ============================================================ */
  const CAT = { sob: 'Sobrancelhas', pmu: 'Micropigmentação', lab: 'Lábios', olh: 'Olhar & rosto' };
  function renderServicos() {
    $('#svcList').innerHTML = SVC.map((s, i) => `<div class="sv${s.ativo ? '' : ' off'}" data-id="${esc(s.id)}" style="animation-delay:${i * 35}ms">
      <img src="${IMG(s.id)}" alt="">
      <div class="sv-tx"><b>${esc(s.nome)}</b><small>${CAT[s.categoria] || ''}${s.unidade ? ' · ' + esc(s.unidade) : ''}</small></div>
      <div class="sv-ctl">
        <label class="price"><span>R$</span><input inputmode="decimal" value="${String(Number(s.preco)).replace('.', ',')}" data-f="preco" aria-label="Preço de ${esc(s.nome)}"></label>
        <button class="star${s.popular ? ' on' : ''}" data-f="popular" title="Destacar como mais procurado" aria-pressed="${!!s.popular}">★</button>
        <label class="switch" title="Mostrar no site"><input type="checkbox" data-f="ativo" ${s.ativo ? 'checked' : ''}><span></span></label>
      </div></div>`).join('');
  }
  const svT = {};
  async function salvarSvc(s, msg) {
    clearTimeout(svT[s.id]);
    svT[s.id] = setTimeout(async () => {
      try { await DB.salvarServico({ id: s.id, nome: s.nome, categoria: s.categoria, descricao: s.descricao, preco: s.preco, unidade: s.unidade, popular: s.popular, ativo: s.ativo, ordem: s.ordem }); toast(msg || 'Salvo', s.nome); }
      catch (e) { toast('Erro ao salvar', e.message, { icon: '!' }); }
    }, 600);
  }
  $('#svcList').addEventListener('input', e => {
    const i = e.target.closest('[data-f=preco]'); if (!i) return; const s = SVC.find(x => x.id === i.closest('.sv').dataset.id);
    const v = parseFloat(i.value.replace(/[^\d,\.]/g, '').replace(',', '.')); if (isNaN(v) || v < 0) return;
    s.preco = Math.round(v * 100) / 100; salvarSvc(s, 'Preço atualizado · ' + brl(s.preco));
  });
  $('#svcList').addEventListener('click', e => {
    const b = e.target.closest('.star'); if (!b) return; const s = SVC.find(x => x.id === b.closest('.sv').dataset.id);
    s.popular = !s.popular; b.classList.toggle('on', s.popular); if (s.popular) burst(b, 10); salvarSvc(s, s.popular ? 'Destacado como mais procurado' : 'Destaque removido');
  });
  $('#svcList').addEventListener('change', e => {
    const c = e.target.closest('[data-f=ativo]'); if (!c) return; const row = c.closest('.sv'); const s = SVC.find(x => x.id === row.dataset.id);
    s.ativo = c.checked; row.classList.toggle('off', !s.ativo); salvarSvc(s, s.ativo ? 'Aparecendo no site' : 'Escondido do site');
  });

  /* ============================================================
     ALUNAS
     ============================================================ */
  function renderAlunas() {
    const pend = INT.filter(i => !i.atendida);
    $$('#bAlunas, #tabbar [data-v=alunas] .badge').forEach(b => { b.textContent = pend.length; b.hidden = !pend.length });
    const L = filtroA === 'pend' ? pend : INT;
    $('#alunas').innerHTML = L.length ? L.map((i, k) => `<article class="al${i.atendida ? ' done' : ''}" style="animation-delay:${k * 40}ms">
      <div class="av">${esc((i.nome || '?').trim()[0].toUpperCase())}</div>
      <div><h3>${esc(i.nome)}</h3>
        <div class="ap-meta"><span class="pill ${i.interesse === 'mentoria' ? 'p-confirmado' : 'p-novo'}">${i.interesse === 'mentoria' ? 'Mentoria' : 'Curso'}</span><span>${esc(i.telefone)}</span><span>${new Date(i.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>
        ${i.mensagem ? `<div class="ap-obs">“${esc(i.mensagem)}”</div>` : ''}
        <div class="ap-act"><button class="btn wa sm" data-wa="${esc(i.id)}">Chamar no WhatsApp</button><label class="chk"><input type="checkbox" data-at="${esc(i.id)}" ${i.atendida ? 'checked' : ''}> Já respondi</label></div>
      </div></article>`).join('') : `<div class="empty"><b>${filtroA === 'pend' ? 'Tudo respondido' : 'Ninguém ainda'}</b>Quem pedir informações na página do curso aparece aqui.</div>`;
  }
  $('#segA').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; filtroA = b.dataset.f; $$('#segA button').forEach(x => x.classList.toggle('on', x === b)); renderAlunas() });
  $('#alunas').addEventListener('click', e => {
    const b = e.target.closest('[data-wa]'); if (!b) return; const i = INT.find(x => x.id === b.dataset.wa);
    abrir(waUrl(telWa(i.telefone), `Oi, ${i.nome.split(' ')[0]}! Aqui é a Daniele Oliveira. Vi que você se interessou ${i.interesse === 'mentoria' ? 'pela minha mentoria' : 'pelo Curso Design Fairy'}. Posso te passar as informações?`));
  });
  $('#alunas').addEventListener('change', async e => {
    const c = e.target.closest('[data-at]'); if (!c) return; const i = INT.find(x => x.id === c.dataset.at);
    try { await DB.marcarAtendida(i.id, c.checked); i.atendida = c.checked; setTimeout(renderAlunas, 300); } catch (ex) { toast('Erro', ex.message, { icon: '!' }); }
  });

  /* ============================================================
     AJUSTES
     ============================================================ */
  function renderAjustes() {
    const t = CONF.ntfy_topico;
    $('#ntfyCode').textContent = t || '—'; $('#ntfyCopy').hidden = !t;
    $('#ntfyGen').textContent = t ? 'Gerar novo' : 'Gerar código';
    $('#ntfySt').textContent = t ? 'Ligado' : 'Desligado'; $('#ntfySt').classList.toggle('on', !!t);
    $('#optSom').checked = lsGet('painel_som', true);
    if ('Notification' in window && Notification.permission === 'granted') $('#optNotif').textContent = 'Ativado ✓';
  }
  $('#ntfyGen').onclick = async () => {
    const rnd = Array.from(crypto.getRandomValues(new Uint8Array(9))).map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
    const topic = 'daniele-' + rnd; const btn = $('#ntfyGen'); btn.classList.add('loading');
    try {
      await DB.setConfig('ntfy_topico', topic);
      await DB.setConfig('site_url', baseSite());
      CONF.ntfy_topico = topic; renderAjustes(); burst($('#ntfyCode'), 14); toast('Código criado', 'Agora cole no app ntfy');
    } catch (e) { toast('Erro', e.message, { icon: '!' }); }
    finally { btn.classList.remove('loading'); }
  };
  function copiar(txt, msg) { try { navigator.clipboard.writeText(txt).then(() => toast(msg || 'Copiado'), () => toast(txt)); } catch (e) { toast(txt); } }
  $('#ntfyCopy').onclick = () => copiar(CONF.ntfy_topico, 'Código copiado');
  $('#ntfyTest').onclick = async () => {
    if (!CONF.ntfy_topico) return toast('Gere o código primeiro', 'Passo 2', { icon: '!' });
    const btn = $('#ntfyTest'); btn.classList.add('loading');
    try {
      const r = await fetch('https://ntfy.sh', { method: 'POST', body: JSON.stringify({ topic: CONF.ntfy_topico, title: 'Teste do painel ✨', message: 'Pronto! Você vai receber aqui cada novo agendamento.', tags: ['sparkles'], priority: 4 }) });
      if (!r.ok) throw new Error('HTTP ' + r.status); toast('Notificação enviada', 'Confira no celular');
    } catch (e) { toast('Não consegui enviar o teste', 'Verifique a internet e tente de novo.', { icon: '!' }); }
    finally { btn.classList.remove('loading'); }
  };
  $('#optSom').onchange = e => { lsSet('painel_som', e.target.checked); if (e.target.checked) chime(); };
  $('#optNotif').onclick = async () => {
    if (!('Notification' in window)) return toast('Este navegador não permite', 'No iPhone, instale o painel na Tela de Início primeiro.', { icon: '!' });
    const p = await Notification.requestPermission(); if (p === 'granted') { $('#optNotif').textContent = 'Ativado ✓'; toast('Avisos ativados'); } else toast('Permissão negada', 'Libere nas configurações do navegador.', { icon: '!' });
  };
  $('#siteCopy').onclick = () => copiar($('#siteUrl').textContent, 'Link copiado');
  $('#logout').onclick = async () => { await DB.sair(); location.hash = ''; location.reload(); };
  $('#pwSave').onclick = async () => {
    const v = $('#pwNew').value; if (v.length < 8) return toast('Senha muito curta', 'Use pelo menos 8 caracteres.', { icon: '!' });
    const btn = $('#pwSave'); btn.classList.add('loading');
    try { await DB.trocarSenha(v); $('#pwNew').value = ''; toast('Senha alterada'); } catch (e) { toast('Erro', e.message, { icon: '!' }); }
    finally { btn.classList.remove('loading'); }
  };
  $('#resetDemo').onclick = () => { DB.resetDemo(); location.reload(); };

  iniciar();
})();
