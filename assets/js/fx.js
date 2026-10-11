/* =============================================================
   Efeitos compartilhados (site + página do curso)
   ============================================================= */
(function () {
  const CFG = window.SITE_CONFIG || {};
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: Number(v) % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const waUrl = (m, num) => 'https://wa.me/' + (num || CFG.WHATSAPP) + '?text=' + encodeURIComponent(m);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* sem seleção de texto / arrastar imagens */
  document.addEventListener('contextmenu', e => { if (!e.target.closest('input,textarea')) e.preventDefault() });
  document.addEventListener('dragstart', e => { if (!e.target.closest('input,textarea')) e.preventDefault() });
  document.addEventListener('selectstart', e => { if (!e.target.closest || !e.target.closest('input,textarea')) e.preventDefault() });

  /* links de WhatsApp e textos vindos do config */
  function waLinks(root) { (root || document).querySelectorAll('.wa-link').forEach(a => a.href = waUrl(a.dataset.msg || 'Olá, Daniele!')); }
  waLinks();
  $$('[data-cfg]').forEach(el => { const v = CFG[el.dataset.cfg]; if (v) el.textContent = v; });

  /* poeira dourada */
  function dustField(canvas, count, opts = {}) {
    if (!canvas) return () => { };
    const c = canvas.getContext('2d'); let W, H, dpr = Math.min(2, devicePixelRatio || 1), P = [], mx = -999, my = -999, alive = true;
    function size() { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0) }
    size(); addEventListener('resize', size);
    for (let i = 0; i < count; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .3, vx: (Math.random() - .5) * .25, vy: -Math.random() * .4 - .08, a: Math.random() * .6 + .2, t: Math.random() * 6 });
    canvas.parentElement.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top });
    canvas.parentElement.addEventListener('mouseleave', () => { mx = my = -999 });
    let vis = true; new IntersectionObserver(es => vis = es[0].isIntersecting).observe(canvas);
    (function f() {
      if (!alive) return; requestAnimationFrame(f); if (!vis || document.hidden) return; c.clearRect(0, 0, W, H);
      for (const p of P) {
        p.t += .02; p.x += p.vx + Math.sin(p.t) * .15; p.y += p.vy * (opts.speed || 1);
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy); if (d < 120 && d > 0) { p.x += dx / d * 2.2; p.y += dy / d * 2.2 }
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W } if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        const tw = .55 + Math.sin(p.t * 2) * .45; c.beginPath(); c.fillStyle = `rgba(240,214,168,${p.a * tw})`; c.shadowColor = 'rgba(217,180,122,.8)'; c.shadowBlur = p.r * 4; c.arc(p.x, p.y, p.r, 0, 7); c.fill()
      }
    })();
    return () => alive = false;
  }

  /* nav sólida, barra de progresso, barra mobile */
  const nav = $('#nav'), mbar = $('#mbar'), progBar = $('#progress');
  const scrollHooks = [];
  function onScroll() {
    const y = scrollY;
    if (nav) nav.classList.toggle('solid', y > 30);
    if (mbar) mbar.classList.toggle('show', y > 500);
    if (progBar) { const max = document.documentElement.scrollHeight - innerHeight; progBar.style.transform = `scaleX(${max > 0 ? y / max : 0})` }
    scrollHooks.forEach(f => f(y));
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* contadores */
  function countEl(el) {
    const t = +el.dataset.count, suf = el.dataset.suffix || ''; const st = performance.now(), d = 2000;
    const f = n => { const p = Math.min(1, (n - st) / d); el.textContent = Math.round(t * (1 - Math.pow(1 - p, 4))).toLocaleString('pt-BR') + (p === 1 ? suf : ''); if (p < 1) requestAnimationFrame(f) }; requestAnimationFrame(f)
  }
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countEl(e.target); cio.unobserve(e.target) } }), { threshold: .6 });
  function counters(root) { (root || document).querySelectorAll('[data-count]').forEach(el => cio.observe(el)); }
  counters();

  /* cursor dourado (só desktop) */
  const cur = $('#cursor'); let cx = 0, cy = 0, tx = 0, ty = 0;
  if (cur) {
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on') });
    (function loop() { cx += (tx - cx) * .18; cy += (ty - cy) * .18; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop) })();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('a,button,.svc,.gi,.mod,.day:not(:disabled),.slot,label.opt');
      cur.classList.toggle('big', !!t);
      cur.dataset.l = t && t.matches('.gi') ? 'Arraste' : t && t.matches('.svc') ? (t.classList.contains('sel') ? 'Remover' : 'Adicionar') : '';
    });
  }

  /* botões magnéticos */
  function magnet(root) {
    (root || document).querySelectorAll('.magnet').forEach(b => {
      if (b._mg) return; b._mg = 1;
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px,${(e.clientY - r.top - r.height / 2) * .3}px)` });
      b.addEventListener('mouseleave', () => b.style.transform = '');
    });
  }
  magnet();

  /* títulos: palavras sobem quando entram na tela */
  const hio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); hio.unobserve(e.target) } }), { threshold: .3 });
  function splitHeadings(sel) {
    $$(sel || 'section h2').forEach(h => {
      if (h.classList.contains('split')) return;
      const walk = n => {
        [...n.childNodes].forEach(ch => {
          if (ch.nodeType === 3) {
            const frag = document.createDocumentFragment(); ch.textContent.split(/(\s+)/).forEach(w => {
              if (!w) return; if (/^\s+$/.test(w)) { frag.append(' '); return }
              const o = document.createElement('span'); o.className = 'wd'; const i = document.createElement('span'); i.textContent = w; o.append(i); frag.append(o)
            }); ch.replaceWith(frag)
          } else if (ch.nodeType === 1 && !ch.matches('svg')) walk(ch)
        })
      };
      walk(h); h.classList.add('split');
      h.querySelectorAll('.wd > span').forEach((s, i) => s.style.transitionDelay = i * 60 + 'ms');
      if (h.getBoundingClientRect().top > innerHeight) { h.classList.add('pre'); hio.observe(h); }
    });
  }

  /* revelar elementos ao rolar (fallback para navegadores sem animation-timeline) */
  const supportsTimeline = CSS.supports && CSS.supports('animation-timeline: view()');
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target) } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  function reveal(root) {
    if (supportsTimeline || reduce) return;
    (root || document).querySelectorAll('.rv:not(.in)').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) { el.classList.add('in'); return; }
      el.classList.add('rv-js'); rio.observe(el);
    });
  }

  /* explosão dourada */
  function burst(x, y, n) {
    if (reduce) return; for (let i = 0; i < (n || 14); i++) {
      const s = document.createElement('i'); s.className = 'burst'; const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60;
      s.style.left = x + 'px'; s.style.top = y + 'px'; document.body.append(s);
      s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove()
    }
  }
  function burstEl(el, n) { if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n); }

  /* aviso rápido */
  const toast = $('#toast'); let tt;
  function say(m) { if (!toast) return; toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2400) }

  /* copiar */
  function copiar(txt, okMsg) {
    try { navigator.clipboard.writeText(txt).then(() => say(okMsg || 'Copiado'), () => say(txt)); } catch (e) { say(txt); }
  }

  /* máscara de telefone */
  function maskTel(input) {
    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '').slice(0, 11);
      let v = d;
      if (d.length > 2) v = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 7) v = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
      input.value = v;
    });
  }

  /* inclinação 3D em cartões */
  function tilt(sel, max) {
    $$(sel).forEach(c => {
      if (c._tl) return; c._tl = 1;
      c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); c.style.transform = `perspective(900px) rotateY(${x * (max || 8)}deg) rotateX(${-y * (max || 8)}deg) translateY(-4px)` });
      c.addEventListener('mouseleave', () => c.style.transform = '');
    });
  }

  window.FX = { $, $$, reduce, brl, waUrl, esc, dustField, burst, burstEl, say, copiar, maskTel, tilt, splitHeadings, reveal, magnet, counters, waLinks, scrollHooks, onScroll };
  requestAnimationFrame(onScroll);
})();
