/* =============================================================
   Página do curso
   ============================================================= */
(function () {
  const { $, $$, reduce, brl, waUrl, esc, dustField, burstEl, say, maskTel, tilt, splitHeadings, reveal, scrollHooks } = window.FX;
  const U = DB.util;

  dustField($('#cDust'), reduce ? 0 : (innerWidth < 700 ? 36 : 70));
  splitHeadings();
  reveal();
  tilt('.who-card', 6);
  tilt('.ment-item', 6);

  /* parallax das fotos do topo */
  const vis = $('#cVisual'), arch = $('.c-arch'), f1 = $('.f1'), f2 = $('.f2'), seal = $('.c-seal');
  let tx = 0, ty = 0, x = 0, y = 0, t = 0;
  $('#cHero').addEventListener('mousemove', e => { const r = vis.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5 });
  $('#cHero').addEventListener('mouseleave', () => { tx = ty = 0 });
  (function loop() {
    t += .012; x += (tx - x) * .07; y += (ty - y) * .07;
    arch.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
    f1.style.transform = `translate(${x * 50 + Math.sin(t) * 6}px,${y * 50 + Math.cos(t * 1.2) * 8}px)`;
    f2.style.transform = `translate(${-x * 40 + Math.cos(t) * 6}px,${-y * 40 + Math.sin(t * 1.3) * 8}px)`;
    seal.style.transform = `translate(${x * 24}px,${y * 24}px)`;
    requestAnimationFrame(loop);
  })();

  /* faixa */
  const mq = $('.mq-track'); let mqx = 0, lastY = scrollY, vel = 0;
  (function mqLoop() {
    const yy = scrollY; vel += ((yy - lastY) - vel) * .1; lastY = yy; mqx -= (.6 + Math.abs(vel) * .5) * (vel < -1 ? -1 : 1);
    const half = mq.scrollWidth / 2; if (mqx < -half) mqx += half; if (mqx > 0) mqx -= half;
    mq.style.transform = `translateX(${mqx}px) skewX(${Math.max(-10, Math.min(10, -vel * .4))}deg)`; requestAnimationFrame(mqLoop)
  })();

  /* ---------- módulos (etapas do curso) ---------- */
  const MODS = [
    { t: 'Visagismo e mapeamento', d: 'Antes de tirar qualquer pelo, você aprende a ler o rosto da cliente.', i: ['Proporções do rosto e formato ideal', 'Pontos de início, arco e cauda', 'Mapeamento com linha e régua'] },
    { t: 'Pele e pelos', d: 'Entenda o que você está tocando para trabalhar com segurança.', i: ['Tipos de pele e cuidados', 'Crescimento e direção dos pelos', 'Quando atender e quando esperar'] },
    { t: 'Design e epilação', d: 'A técnica que dá forma: limpa, simétrica e natural.', i: ['Cera, pinça e linha', 'Simetria entre as duas sobrancelhas', 'Acabamento sem marcas'] },
    { t: 'Henna na prática', d: 'Preparo, aplicação e fixação para preencher falhas com definição.', i: ['Escolha da cor para cada cliente', 'Preparo e tempo de pausa', 'Aplicação, retirada e durabilidade'] },
    { t: 'Biossegurança', d: 'Higiene e organização que passam confiança desde o primeiro atendimento.', i: ['Limpeza e descarte de materiais', 'Organização da bancada', 'Cuidados antes e depois'] },
    { t: 'Primeiras clientes', d: 'Do certificado ao primeiro horário marcado na sua agenda.', i: ['Fotos de antes e depois', 'Como divulgar no Instagram', 'Precificação para começar'] }
  ];
  const list = $('#modList'); let cur = 0, auto = !reduce, cycle, barAnim;
  list.innerHTML = MODS.map((m, i) => `<button class="mod${i === 0 ? ' on' : ''}" role="tab" data-i="${i}"><span class="mn">${String(i + 1).padStart(2, '0')}</span><b>${esc(m.t)}</b><span class="ma">→</span></button>`).join('');
  function show(i, manual) {
    cur = i; const m = MODS[i];
    $$('.mod').forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i) });
    const d = $('#modDetail'); d.classList.remove('mod-anim'); void d.offsetWidth; d.classList.add('mod-anim');
    $('#modStep').textContent = 'Etapa ' + (i + 1) + ' de ' + MODS.length;
    $('#modTitle').textContent = m.t; $('#modText').textContent = m.d;
    $('#modItems').innerHTML = m.i.map(x => `<li>${esc(x)}</li>`).join('');
    if (barAnim) barAnim.cancel();
    if (manual) { auto = false; clearTimeout(cycle); $('#modBar').style.transform = `scaleX(${(i + 1) / MODS.length})`; return; }
    if (auto) {
      barAnim = $('#modBar').animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 5000, easing: 'linear', fill: 'forwards' });
      clearTimeout(cycle); cycle = setTimeout(() => { if (auto && modVis) show((cur + 1) % MODS.length) }, 5000);
    }
  }
  let modVis = false;
  new IntersectionObserver(es => { modVis = es[0].isIntersecting; if (modVis && auto) show(cur) }, { threshold: .35 }).observe($('#modDetail'));
  list.addEventListener('click', e => { const b = e.target.closest('.mod'); if (b) show(+b.dataset.i, true) });
  show(0, !auto);

  /* ---------- calculadora ---------- */
  const rAt = $('#rAt'), rVl = $('#rVl'); let big = 0, bigRaf;
  const bars = $('#calcBars'); bars.innerHTML = Array.from({ length: 12 }, () => '<i></i>').join('');
  function calc() {
    const at = +rAt.value, vl = +rVl.value;
    [rAt, rVl].forEach(r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'));
    $('#vAt').textContent = at; $('#vVl').textContent = brl(vl);
    const mes = Math.round(at * vl * 4.3);
    $('#calcPay').textContent = Math.ceil(600 / vl);
    cancelAnimationFrame(bigRaf); const de = big, st = performance.now();
    const f = n => { const p = Math.min(1, (n - st) / 500); big = de + (mes - de) * (1 - Math.pow(1 - p, 3)); $('#calcBig').textContent = brl(Math.round(big)); if (p < 1) bigRaf = requestAnimationFrame(f) };
    bigRaf = requestAnimationFrame(f);
    const base = Math.min(1, mes / (40 * 120 * 4.3));
    $$('#calcBars i').forEach((b, k) => { b.style.height = (8 + base * 92 * (0.3 + 0.7 * k / 11)) + '%'; b.style.transitionDelay = k * 25 + 'ms' });
  }
  rAt.addEventListener('input', calc); rVl.addEventListener('input', calc);
  calc();

  /* ---------- lista de interesse ---------- */
  maskTel($('#vTel'));
  $$('[data-interesse]').forEach(a => a.addEventListener('click', () => { const r = $(`.opt input[value="${a.dataset.interesse}"]`); if (r) r.checked = true }));
  $('#vaga').addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#vErr'); err.textContent = '';
    const nome = $('#vNome').value.trim(), tel = $('#vTel').value.trim(), msg = $('#vMsg').value.trim();
    const interesse = ($('.opt input:checked') || {}).value || 'curso';
    if (nome.length < 2) { err.textContent = 'Digite seu nome.'; $('#vNome').focus(); return }
    const dig = U.soDigitos(tel); if (dig.length < 10 || dig.length > 13) { err.textContent = DB.MENSAGENS.TELEFONE_INVALIDO; $('#vTel').focus(); return }
    const btn = $('#vBtn'); btn.classList.add('loading');
    try {
      await DB.registrarInteresse({ nome, telefone: tel, interesse, mensagem: msg });
      $('#vagaForm').hidden = true; $('#vagaOk').hidden = false;
      $('#vOkTxt').textContent = `${nome.split(' ')[0]}, a Daniele vai chamar você no WhatsApp com as informações ${interesse === 'mentoria' ? 'da mentoria' : 'da próxima turma'}.`;
      $('#vOkWa').href = waUrl(`Olá, Daniele! Acabei de entrar na lista ${interesse === 'mentoria' ? 'da mentoria' : 'do Curso Design Fairy'} pelo site. Meu nome é ${nome}.`);
      setTimeout(() => { burstEl($('#vagaOk .big'), 22); setTimeout(() => burstEl($('#vagaOk .big'), 14), 250) }, 250);
    } catch (ex) { err.textContent = ex.message; }
    finally { btn.classList.remove('loading'); }
  });
})();
