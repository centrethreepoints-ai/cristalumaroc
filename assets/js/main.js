// CRISTALU MAROC — interactions UI (vanilla, sans dépendance)
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Loader
addEventListener('load', () => setTimeout(() => $('.loader')?.classList.add('done'), 700));
setTimeout(() => $('.loader')?.classList.add('done'), 2500);

// Header
const header = $('.header');
const onScroll = () => header?.classList.toggle('scrolled', scrollY > 40 || !$('.hero'));
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Menu mobile
$('.burger')?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
$$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

// Active nav
const page = location.pathname.split('/').pop() || 'index.html';
$$('.nav a').forEach(a => { if (a.getAttribute('href') === page) a.classList.add('active'); });

// Reveal
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
$$('.reveal,.reveal-img,.process').forEach(el => io.observe(el));

// Parallaxe
const px = $$('[data-parallax]');
const parallax = () => {
  px.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const sp = parseFloat(el.dataset.parallax);
    el.style.transform = `translate3d(0,${(r.top + r.height / 2 - innerHeight / 2) * -sp}px,0)`;
  });
};
addEventListener('scroll', () => requestAnimationFrame(parallax), { passive: true }); parallax();

// Compteurs
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, end = +el.dataset.count, t0 = performance.now();
  const tick = t => { const p = Math.min((t - t0) / 1800, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (el.dataset.suffix || ''); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); cio.unobserve(el);
}), { threshold: .5 });
$$('[data-count]').forEach(el => cio.observe(el));

// Carrousel réalisations
const track = $('.real-track');
if (track) {
  $$('.real-nav button').forEach(b => b.addEventListener('click', () => track.scrollBy({ left: (b.dataset.dir === 'next' ? 1 : -1) * track.clientWidth * 0.6, behavior: 'smooth' })));
  let down = false, sx, sl;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.pageX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; });
  addEventListener('pointerup', () => { down = false; track.style.scrollSnapType = ''; });
  track.addEventListener('pointermove', e => { if (down) track.scrollLeft = sl - (e.pageX - sx); });
}

// Curseur
const cur = $('.cursor');
if (cur && matchMedia('(hover:hover)').matches) {
  addEventListener('pointermove', e => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; });
  $$('a,button,.product').forEach(el => { el.addEventListener('mouseenter', () => cur.classList.add('hover')); el.addEventListener('mouseleave', () => cur.classList.remove('hover')); });
}

// Formulaire devis → WhatsApp (en attendant un backend)
$$('form[data-quote]').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault();
  const d = new FormData(f);
  const prods = d.getAll('produits').join(', ');
  const txt = `Demande de devis — CRISTALU MAROC%0A` +
    `Nom : ${d.get('nom')}%0ATél : ${d.get('tel')}%0AVille : ${d.get('ville') || ''}%0AProduits : ${prods}%0AProjet : ${d.get('message') || ''}`;
  window.open(`https://wa.me/212661239493?text=${txt}`, '_blank');
  const m = $('.form-msg', f); if (m) m.style.display = 'block';
  f.reset();
}));

// Année
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
