// CRISTALU MAROC — interactions discrètes
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  addEventListener('load', () => root.classList.add('loaded'));

  // Header transparent sur le hero, opaque ensuite
  const header = $('.header'), hero = $('.hero');
  const onScroll = () => header.classList.toggle('over', !!hero && scrollY < hero.offsetHeight - 80);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Menu mobile
  const btn = $('.menu-btn');
  btn?.addEventListener('click', () => { const o = root.classList.toggle('nav-open'); btn.setAttribute('aria-expanded', o); });
  $$('.nav a').forEach(a => a.addEventListener('click', () => root.classList.remove('nav-open')));

  // Page active
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav a').forEach(a => { if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page'); });

  // Apparition progressive
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  // Parallaxe légère
  const px = $$('[data-parallax]');
  if (px.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let tick = false;
    const run = () => {
      px.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const k = parseFloat(el.dataset.parallax) || .06;
        el.style.transform = `translate3d(0,${((r.top + r.height / 2) - innerHeight / 2) * -k}px,0) scale(1.08)`;
      });
      tick = false;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true }); run();
  }

  // Filtres réalisations
  const gal = $('.gallery');
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f;
    gal.classList.toggle('filtered', f !== 'all');
    $$('.proj', gal).forEach(p => p.classList.toggle('hide', f !== 'all' && !p.dataset.cat.includes(f)));
  }));

  // Onglets contact / devis
  const tabs = $$('.tabs button');
  const setTab = id => { tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.tab === id)); $$('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== id); };
  tabs.forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)));
  if (tabs.length) setTab(location.hash === '#devis' ? 'devis' : 'contact');
  addEventListener('hashchange', () => tabs.length && location.hash === '#devis' && setTab('devis'));

  // Formulaires → WhatsApp / e-mail (en attente d'un backend)
  $$('form[data-send]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const lines = [...new FormData(f)].filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`);
    const body = encodeURIComponent(`${f.dataset.send} — Cristalu Maroc\n\n${lines.join('\n')}`);
    window.open(`https://wa.me/212661239493?text=${body}`, '_blank', 'noopener');
    $('.form-ok', f).style.display = 'block'; f.reset();
  }));

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
