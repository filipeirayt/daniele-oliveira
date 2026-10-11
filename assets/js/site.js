/* =============================================================
   Página inicial — intro, serviços, técnicas, galeria, agendamento
   ============================================================= */
(function () {
  const { $, $$, reduce, brl, waUrl, esc, dustField, burst, burstEl, say, maskTel, tilt, splitHeadings, reveal, scrollHooks } = window.FX;
  const CFG = window.SITE_CONFIG || {};
  const U = DB.util;

  /* ---------- INTRO (animação em CSS; o script só encurta ao tocar) ---------- */
  const intro = $('#intro'); let gone = false; const t0 = performance.now();
  const stopIntroDust = dustField($('#dust'), reduce ? 0 : 90, { speed: 1.6 });
  function endIntro() { if (gone) return; gone = true; document.body.classList.add('ready'); setTimeout(() => { intro && intro.remove(); stopIntroDust() }, 1300) }
  setTimeout(endIntro, 4400);
  function skipIntro() { if (gone) return; const el = (performance.now() - t0) / 1000; intro.classList.add('skip'); document.documentElement.style.setProperty('--d0', Math.min(el, 3.4) + 's'); setTimeout(endIntro, 700) }
  if (intro) intro.addEventListener('click', skipIntro);
  if (reduce) skipIntro();

  /* ---------- HERO ---------- */
  dustField($('#heroDust'), reduce ? 0 : (innerWidth < 700 ? 40 : 80));
  const hword = $('#heroWord'), arch = $('#archWrap');
  scrollHooks.push(y => {
    if (y < innerHeight * 1.2) {
      if (hword) hword.style.transform = `translateX(calc(-50% + ${-y * .35}px))`;
      if (arch && document.body.classList.contains('ready')) arch.style.translate = `0 ${y * .12}px`;
    }
  });
  const stage = $('#stage'), hv = $('#heroVisual'); let ox = 0, oy = 0, otx = 0, oty = 0;
  $('#hero').addEventListener('mousemove', e => {
    const r = hv.getBoundingClientRect(); otx = (e.clientX - r.left) / r.width - .5; oty = (e.clientY - r.top) / r.height - .5;
    const s = stage.getBoundingClientRect(); stage.style.setProperty('--sx', (e.clientX - s.left) + 'px'); stage.style.setProperty('--sy', (e.clientY - s.top) + 'px')
  });
  $('#hero').addEventListener('mouseleave', () => { otx = oty = 0 });
  (function orbit() { ox += (otx - ox) * .08; oy += (oty - oy) * .08; stage.style.transform = `rotateY(${ox * 10}deg) rotateX(${-oy * 10}deg)`; requestAnimationFrame(orbit) })();

  splitHeadings();
  reveal();

  /* ---------- faixa que acelera com a rolagem ---------- */
  const mq = $('.mq-track'); let mqx = 0, lastY = scrollY, vel = 0;
  (function mqLoop() {
    const y = scrollY; vel += ((y - lastY) - vel) * .1; lastY = y; mqx -= (.6 + Math.abs(vel) * .5) * (vel < -1 ? -1 : 1);
    const half = mq.scrollWidth / 2; if (mqx < -half) mqx += half; if (mqx > 0) mqx -= half;
    mq.style.transform = `translateX(${mqx}px) skewX(${Math.max(-10, Math.min(10, -vel * .4))}deg)`; requestAnimationFrame(mqLoop)
  })();

  /* =============================================================
     SERVIÇOS (vêm do banco — a Daniele muda preços pelo painel)
     ============================================================= */
  const CAT = { sob: 'Sobrancelhas', pmu: 'Micropigmentação', lab: 'Lábios', olh: 'Olhar & rosto' };
  const IMG = id => ['design', 'henna', 'microblading', 'ombre', 'shadowline', 'microlabial', 'neutral', 'spa', 'lifting', 'frances', 'buco'].includes(id) ? `assets/img/${id}.jpg` : 'assets/img/circle.jpg';
  const plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>';
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let S = [];
  const sel = new Set();
  const svcById = id => S.find(s => s.id === id);

  function renderServicos() {
    $('#svcGrid').innerHTML = S.map((s, i) => `<div class="svc${s.popular ? ' popular' : ''}" data-id="${esc(s.id)}" data-c="${esc(s.categoria)}" role="button" tabindex="0" aria-pressed="false" style="animation:dayIn .6s ${i * 50}ms cubic-bezier(.2,.8,.2,1) both">
      <div class="th"><img src="${IMG(s.id)}" alt="${esc(s.nome)}"></div>
      <div><span class="tg">${CAT[s.categoria] || ''}</span><h3>${esc(s.nome)}</h3><p>${esc(s.descricao || '')}</p>
      <div class="pr"><b>${brl(s.preco)}${s.unidade ? `<small> ${esc(s.unidade)}</small>` : ''}</b><span class="add">${plus}</span></div></div></div>`).join('');
    $('#pickList').innerHTML = S.map(s => `<button class="pick" data-id="${esc(s.id)}"><span class="ck">${check}</span><span class="nm">${esc(s.nome)}</span><span class="vl">${brl(s.preco)}</span></button>`).join('');
    const nCount = $('.numbers [data-count="11"]'); if (nCount) nCount.dataset.count = S.length;
    setTech(tech, true);
    render();
  }

  function toggle(id, force) {
    if (!svcById(id)) return;
    const had = sel.has(id); const on = force === undefined ? !had : force; on ? sel.add(id) : sel.delete(id);
    if (on && !had) say('Adicionado: ' + svcById(id).nome); render();
  }
  function render() {
    $$('.svc').forEach(el => { const on = sel.has(el.dataset.id); el.classList.toggle('sel', on); el.setAttribute('aria-pressed', on) });
    $$('.pick').forEach(el => el.classList.toggle('on', sel.has(el.dataset.id)));
    const items = S.filter(s => sel.has(s.id)); const tot = items.reduce((a, s) => a + Number(s.preco), 0);
    $('#sumList').innerHTML = items.map(s => `<div class="sum-row"><span>${esc(s.nome)}</span><span>${brl(s.preco)}</span></div>`).join('');
    animarTotal(tot);
    const pill = $('#cartPill'); $('#cartTxt').textContent = items.length + (items.length > 1 ? ' serviços' : ' serviço') + ' · ' + brl(tot);
    const bk = $('#agendar').getBoundingClientRect(); pill.classList.toggle('show', items.length > 0 && step < 4 && !(bk.top < innerHeight && bk.bottom > 0));
  }
  let totAtual = 0, totRaf;
  function animarTotal(alvo) {
    cancelAnimationFrame(totRaf); const de = totAtual, st = performance.now();
    const f = n => { const p = Math.min(1, (n - st) / 500); totAtual = de + (alvo - de) * (1 - Math.pow(1 - p, 3)); $('#sumTotal').textContent = brl(Math.round(totAtual)); if (p < 1) totRaf = requestAnimationFrame(f); else { totAtual = alvo; $('#sumTotal').textContent = brl(alvo) } };
    totRaf = requestAnimationFrame(f);
  }
  addEventListener('scroll', () => { if (sel.size) render() }, { passive: true });

  const grid = $('#svcGrid');
  grid.addEventListener('click', e => { const c = e.target.closest('.svc'); if (!c) return; toggle(c.dataset.id); if (sel.has(c.dataset.id)) burst(e.clientX, e.clientY); const cur = $('#cursor'); if (cur) cur.dataset.l = sel.has(c.dataset.id) ? 'Remover' : 'Adicionar' });
  grid.addEventListener('keydown', e => { const c = e.target.closest('.svc'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(c.dataset.id) } });
  grid.addEventListener('mousemove', e => { const c = e.target.closest('.svc'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); c.style.transform = `perspective(800px) rotateY(${((e.clientX - r.left) / r.width - .5) * 8}deg) rotateX(${-((e.clientY - r.top) / r.height - .5) * 8}deg) translateY(-4px)` });
  grid.addEventListener('mouseout', e => { const c = e.target.closest('.svc'); if (c && !c.contains(e.relatedTarget)) c.style.transform = '' });
  $('#pickList').addEventListener('click', e => { const c = e.target.closest('.pick'); if (c) { toggle(c.dataset.id); $('#err').textContent = '' } });
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('.tab'); if (!b) return; $$('#tabs .tab').forEach(t => t.classList.toggle('on', t === b)); const f = b.dataset.f;
    $$('.svc').forEach((el, i) => { const show = f === 'all' || el.dataset.c === f; el.classList.toggle('hide', !show); if (show) { el.animate([{ opacity: 0, transform: 'translateY(20px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: i * 30 % 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }) } })
  });

  /* ---------- TÉCNICAS (canvas) ---------- */
  const T = {
    micro: { id: 'microblading', n: 'Microblading (fio a fio)', d: 'Cada fio é desenhado à mão, um a um, seguindo a direção natural dos pelos. Ideal para quem quer um resultado realista e leve.' },
    ombre: { id: 'ombre', n: 'Ombré shadow', d: 'Pigmento aplicado em pontos que formam um esfumado: suave no início e mais intenso até a cauda. Efeito de sobrancelha maquiada.' },
    shadow: { id: 'shadowline', n: 'Shadowline', d: 'Fios no início da sobrancelha e esfumado do meio até a cauda. Une a naturalidade do fio a fio com a definição do ombré.' }
  };
  const cv = $('#browCanvas'), ctx = cv.getContext('2d'); let tech = 'micro', prog = 0, raf;
  function browPath() { const p = new Path2D(); p.moveTo(150, 330); p.bezierCurveTo(240, 250, 430, 175, 610, 168); p.bezierCurveTo(700, 165, 770, 205, 830, 262); p.bezierCurveTo(770, 232, 700, 214, 620, 220); p.bezierCurveTo(450, 232, 280, 300, 175, 372); p.bezierCurveTo(150, 380, 140, 350, 150, 330); p.closePath(); return p }
  function rnd(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }
  function drawBrow() {
    const w = cv.width, h = cv.height; ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(90,55,35,.35)'; ctx.lineWidth = 2;
    [[160, 60, 160, 480], [610, 60, 610, 480], [830, 60, 830, 480]].forEach(l => { ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.stroke() }); ctx.restore();
    ctx.fillStyle = 'rgba(90,55,35,.55)'; ctx.font = '700 20px Manrope, sans-serif'; ctx.fillText('INÍCIO', 120, 50); ctx.fillText('ARCO', 580, 50); ctx.fillText('CAUDA', 790, 50);
    const path = browPath(); ctx.save(); ctx.clip(path);
    const r = rnd(7); const revealX = 150 + prog * 700;
    const isFio = x => tech === 'micro' || (tech === 'shadow' && x < 400);
    if (tech !== 'micro') {
      for (let i = 0; i < 9000 * prog; i++) {
        const x = 150 + r() * 690, y = 150 + r() * 240; if (x > revealX) continue; if (tech === 'shadow' && x < 340) continue;
        const k = Math.min(1, (x - 150) / 560); ctx.fillStyle = `rgba(52,30,20,${.06 + k * .22})`; ctx.beginPath(); ctx.arc(x, y, 1.6 + r() * 1.6, 0, 7); ctx.fill()
      }
    }
    const r2 = rnd(3); ctx.lineCap = 'round';
    for (let i = 0; i < 190; i++) {
      const x = 150 + r2() * 690; const y0 = 170 + r2() * 230; const a = r2(), b = r2(); if (x > revealX || !isFio(x)) continue;
      const ang = x < 300 ? -1.35 : x < 620 ? -0.6 - (x - 300) / 900 : 0.25 + (x - 620) / 700; const len = 26 + a * 22;
      ctx.strokeStyle = `rgba(45,26,17,${.55 + b * .35})`; ctx.lineWidth = 1.6 + b; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + Math.cos(ang) * len * .5 + 4, y0 + Math.sin(ang) * len * .5, x + Math.cos(ang) * len, y0 + Math.sin(ang) * len); ctx.stroke()
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(217,180,122,.9)'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke(path);
  }
  function setTech(t, semAnim) {
    tech = t; cancelAnimationFrame(raf); const info = T[t], s = svcById(info.id);
    $('#techInfo').innerHTML = `<b>${info.n}</b>${info.d}`;
    $('#techPrice').textContent = s ? brl(s.preco) : '';
    $('#techAdd').hidden = !s;
    $$('#techBtns .tab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    if (semAnim) { prog = 1; drawBrow(); return; }
    prog = 0; const st = performance.now(); const f = n => { prog = Math.min(1, (n - st) / 1400); drawBrow(); if (prog < 1) raf = requestAnimationFrame(f) }; raf = requestAnimationFrame(f)
  }
  $('#techBtns').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) setTech(b.dataset.t) });
  $('#techAdd').addEventListener('click', e => { toggle(T[tech].id, true); burst(e.clientX, e.clientY) });
  setTech('micro', true);
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setTech(tech) }), { threshold: .5 }).observe(cv);

  /* ---------- GALERIA ---------- */
  const gal = $('#gal'); let down = false, sx = 0, sl = 0;
  gal.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = gal.scrollLeft; gal.classList.add('drag') });
  addEventListener('pointerup', () => { down = false; gal.classList.remove('drag') });
  addEventListener('pointermove', e => { if (down) gal.scrollLeft = sl - (e.clientX - sx) });
  let galHold = 0;['pointerdown', 'wheel', 'touchstart'].forEach(ev => gal.addEventListener(ev, () => galHold = performance.now() + 4000, { passive: true }));
  gal.addEventListener('mouseenter', () => galHold = 1e15); gal.addEventListener('mouseleave', () => galHold = performance.now() + 800);
  let galVis = false; new IntersectionObserver(es => galVis = es[0].isIntersecting).observe(gal); let gacc = 0;
  (function drift(n) { requestAnimationFrame(drift); if (reduce || !galVis || n < galHold || down) return; gal.style.scrollSnapType = 'none'; gacc += .5; if (gacc >= 1) { const s = Math.floor(gacc); gacc -= s; gal.scrollLeft += s; if (gal.scrollLeft + gal.clientWidth >= gal.scrollWidth - 2) gal.scrollLeft = 0 } })(0);

  /* =============================================================
     AGENDAMENTO REAL
     ============================================================= */
  const DIAS = CFG.DIAS_AGENDA || 60;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const hojeIso = U.iso(hoje);
  const maxD = new Date(hoje); maxD.setDate(maxD.getDate() + DIAS); const maxIso = U.iso(maxD);
  let H = null, FOLGAS = new Set(), OC = [], step = 0, date = null, time = null, vm = new Date(hoje.getFullYear(), hoje.getMonth(), 1), agendaCarregada = 0;
  if (DB.modo === 'demo') $('#demoTag').hidden = false;

  const fmtDate = iso => U.deIso(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const agoraMais = (min) => { const n = new Date(Date.now() + min * 60000); return U.pad(n.getHours()) + ':' + U.pad(n.getMinutes()); };

  async function carregarAgenda(forcar) {
    if (!forcar && H && Date.now() - agendaCarregada < 30000) return;
    $('#cal').classList.add('loading');
    try {
      const [h, f, oc] = await Promise.all([DB.getHorarios(), DB.getFolgas(), DB.getOcupados(hojeIso, maxIso)]);
      H = h; FOLGAS = new Set(f.map(x => x.data)); OC = oc; agendaCarregada = Date.now();
      $('#liveTxt').textContent = 'Agenda atualizada agora';
      resumoHorarios();
    } catch (e) {
      $('#err').textContent = e.message;
    }
    $('#cal').classList.remove('loading');
  }
  function horasDoDia(iso) {
    if (!H || FOLGAS.has(iso)) return [];
    return (H[U.deIso(iso).getDay()] || []).slice().sort();
  }
  function livres(iso) {
    const occ = new Set(OC.filter(o => o.data === iso).map(o => o.hora));
    let r = horasDoDia(iso).filter(h => !occ.has(h));
    if (iso === hojeIso) { const lim = agoraMais(60); r = r.filter(h => h > lim); }
    return r;
  }

  function drawCal() {
    $('#calTitle').textContent = vm.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const first = vm.getDay(), days = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate();
    let h = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => `<div class="dw">${d}</div>`).join('');
    for (let i = 0; i < first; i++) h += '<button class="day empty" disabled></button>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(vm.getFullYear(), vm.getMonth(), d); const iso = U.iso(dt);
      let cls = 'day', dis = true, title = '';
      if (iso < hojeIso || iso > maxIso) { title = 'Fora do período'; }
      else if (FOLGAS.has(iso)) { title = 'Fechado'; }
      else if (!horasDoDia(iso).length) { title = 'Sem atendimento'; }
      else if (!livres(iso).length) { cls += ' full'; title = 'Lotado'; }
      else { cls += ' free'; dis = false; title = livres(iso).length + ' horários livres'; }
      if (iso === hojeIso) cls += ' today';
      if (date === iso) cls += ' on';
      h += `<button class="${cls}" data-d="${iso}" title="${title}" style="animation-delay:${d * 12}ms" ${dis ? 'disabled' : ''}>${d}</button>`;
    }
    $('#cal').innerHTML = h;
    $('#calPrev').disabled = vm.getFullYear() === hoje.getFullYear() && vm.getMonth() === hoje.getMonth();
    $('#calNext').disabled = new Date(vm.getFullYear(), vm.getMonth() + 1, 1) > maxD;
  }
  $('#calPrev').onclick = () => { vm.setMonth(vm.getMonth() - 1); drawCal() };
  $('#calNext').onclick = () => { vm.setMonth(vm.getMonth() + 1); drawCal() };
  $('#cal').addEventListener('click', e => {
    const b = e.target.closest('.day[data-d]'); if (!b || b.disabled) return;
    date = b.dataset.d; time = null; drawCal(); sum(); $('#err').textContent = '';
    burstEl(b, 8); setTimeout(() => go(2), 260)
  });

  function drawSlots() {
    if (!date) return;
    const todas = horasDoDia(date), liv = new Set(livres(date));
    const grupos = [['Manhã', h => h < '12:00'], ['Tarde', h => h >= '12:00' && h < '18:00'], ['Noite', h => h >= '18:00']];
    let html = ''; let i = 0;
    grupos.forEach(([n, f]) => {
      const hs = todas.filter(f); if (!hs.length) return;
      html += `<div class="period">${n}</div><div class="slots">${hs.map(x => {
        const ok = liv.has(x); return `<button class="slot${time === x ? ' on' : ''}${ok ? '' : ' taken'}" data-t="${x}" style="animation-delay:${(i++) * 35}ms" ${ok ? '' : 'disabled title="Horário ocupado"'}>${x}</button>`
      }).join('')}</div>`;
    });
    $('#slots').innerHTML = liv.size ? html : '<div class="slots-empty">Os horários desse dia acabaram de ser preenchidos. Escolha outro dia.</div>';
    $('#slotSub').textContent = fmtDate(date) + ' · ' + liv.size + (liv.size === 1 ? ' horário livre' : ' horários livres');
  }
  $('#slots').addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    time = b.dataset.t; drawSlots(); sum(); $('#err').textContent = ''; burstEl(b, 8); setTimeout(() => go(3), 260)
  });
  function sum() {
    $('#sumDate').textContent = date ? fmtDate(date) : 'Data a escolher';
    $('#sumTime').textContent = time ? time + 'h' : 'Horário a escolher';
  }

  async function go(n) {
    step = n; $$('.step').forEach(s => s.classList.toggle('on', +s.dataset.s === n));
    $$('#steps div').forEach((d, i) => d.classList.toggle('done', i <= Math.min(n, 3)));
    $('#back').disabled = n === 0; $('#bkNav').hidden = n === 4;
    $('#next').textContent = n === 3 ? 'Reservar meu horário' : 'Continuar';
    if (n === 1) { drawCal(); await carregarAgenda(); drawCal(); }
    if (n === 2) { await carregarAgenda(); drawSlots(); }
    if (n === 3) setTimeout(() => { if (innerWidth > 960) $('#fName').focus() }, 300);
    render();
  }

  $('#next').onclick = async () => {
    const err = $('#err'); err.textContent = '';
    if (step === 0 && !sel.size) { err.textContent = 'Escolha pelo menos um serviço para continuar.'; shake(); return }
    if (step === 1 && !date) { err.textContent = 'Escolha um dia no calendário.'; shake(); return }
    if (step === 2 && !time) { err.textContent = 'Escolha um horário.'; shake(); return }
    if (step === 3) { await reservar(); return; }
    go(step + 1);
    if (innerWidth < 960) $('#bkPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('#back').onclick = () => { $('#err').textContent = ''; go(step - 1) };
  function shake() { $('#bkPanel').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380 }) }
  maskTel($('#fPhone'));

  async function reservar() {
    const err = $('#err');
    const nome = $('#fName').value.trim(), tel = $('#fPhone').value.trim(), obs = $('#fObs').value.trim();
    if (nome.length < 2) { err.textContent = 'Digite seu nome para a Daniele saber quem é você.'; $('#fName').focus(); shake(); return }
    const dig = U.soDigitos(tel); if (dig.length < 10 || dig.length > 13) { err.textContent = DB.MENSAGENS.TELEFONE_INVALIDO; $('#fPhone').focus(); shake(); return }
    const btn = $('#next'); btn.classList.add('loading');
    try {
      const r = await DB.criarAgendamento({ nome, telefone: tel, observacao: obs, servicos: [...sel], data: date, hora: time });
      sucesso(r, nome);
    } catch (e) {
      err.textContent = e.message; shake();
      if (['HORARIO_OCUPADO', 'HORARIO_INDISPONIVEL', 'HORARIO_PASSOU'].includes(e.code)) { time = null; sum(); await carregarAgenda(true); go(2); err.textContent = e.message; }
      else if (['DIA_FECHADO', 'DATA_INVALIDA'].includes(e.code)) { date = null; time = null; sum(); await carregarAgenda(true); go(1); err.textContent = e.message; }
    } finally { btn.classList.remove('loading'); }
  }

  function sucesso(r, nome) {
    const itens = r.servicos || [];
    const nomes = itens.map(s => s.nome).join(', ');
    $('#doneCode').textContent = r.codigo;
    $('#doneTxt').textContent = `${nome.split(' ')[0]}, seu horário de ${fmtDate(r.data)} às ${r.hora} está guardado. A Daniele vai confirmar com você pelo WhatsApp.`;
    $('#doneWa').href = waUrl(`Olá, Daniele! Acabei de agendar pelo site.\n\nCódigo: ${r.codigo}\n${nomes}\n📅 ${fmtDate(r.data)} às ${r.hora}\nTotal: ${brl(r.total)}\n\nNome: ${nome}`);
    const d = r.data.replace(/-/g, ''), h = r.hora.replace(':', '') + '00';
    const fim = new Date(U.deIso(r.data)); const [hh, mm] = r.hora.split(':').map(Number); fim.setHours(hh + 1, mm);
    const dFim = U.iso(fim).replace(/-/g, '') + 'T' + U.pad(fim.getHours()) + U.pad(fim.getMinutes()) + '00';
    $('#doneCal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Daniele Oliveira · ' + nomes) + '&dates=' + d + 'T' + h + '/' + dFim + '&ctz=America/Bahia&details=' + encodeURIComponent('Código ' + r.codigo + ' · WhatsApp ' + (CFG.WHATSAPP_EXIBICAO || '')) + '&location=' + encodeURIComponent(CFG.CIDADE || 'Salvador');
    OC.push({ data: r.data, hora: r.hora });
    go(4);
    setTimeout(() => { const b = $('.done-box .big'); burstEl(b, 22); setTimeout(() => burstEl(b, 16), 250) }, 300);
    if (innerWidth < 960) $('#bkPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#doneNew').onclick = () => { sel.clear(); date = null; time = null; ['#fName', '#fPhone', '#fObs'].forEach(s => $(s).value = ''); sum(); go(0); };

  /* ---------- horário de atendimento no contato ---------- */
  function resumoHorarios() {
    if (!H) return;
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const fx = d => { const h = (H[d] || []).slice().sort(); return h.length ? h[0] + ' às ' + h[h.length - 1] : '' };
    const ordem = [1, 2, 3, 4, 5, 6, 0]; const grupos = [];
    ordem.forEach(d => { const v = fx(d); if (!v) return; const g = grupos[grupos.length - 1]; if (g && g.v === v && ordem.indexOf(d) === ordem.indexOf(g.fim) + 1) g.fim = d; else grupos.push({ ini: d, fim: d, v }) });
    $('#hrResumo').innerHTML = grupos.length ? grupos.map(g => `${nomes[g.ini]}${g.fim !== g.ini ? ' a ' + nomes[g.fim] : ''} · ${g.v}`).join('<br>') : 'Combine pelo WhatsApp';
  }

  /* ---------- contato ---------- */
  const qMsg = $('#qMsg');
  $('#quickChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#quickChips button').forEach(x => x.classList.toggle('on', x === b)); qMsg.value = b.dataset.t; qMsg.focus() });
  $('#quickForm').addEventListener('submit', e => {
    e.preventDefault(); const m = qMsg.value.trim();
    if (!m) { qMsg.focus(); qMsg.animate([{ borderColor: '#ef9a8a' }, { borderColor: 'var(--line)' }], { duration: 900 }); return }
    const a = document.createElement('a'); a.href = waUrl('Olá, Daniele! ' + m); a.target = '_blank'; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove();
  });
  tilt('.pitch', 4);
  tilt('.course', 4);

  /* ---------- carregar dados ---------- */
  (async () => {
    try { S = await DB.getServicos(); }
    catch (e) { S = DB.SERVICOS_PADRAO.slice(); }
    if (!S.length) S = DB.SERVICOS_PADRAO.slice();
    renderServicos(); sum(); go(0);
    carregarAgenda();
  })();
})();
