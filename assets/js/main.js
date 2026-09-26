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

/* ===== V2 dynamic animations ===== */
document.body.insertAdjacentHTML('afterbegin', '<div class="progress-bar"></div>');
const bar = $('.progress-bar');

// Split titres en mots
$$('.split, .section-head h2, .h-lg').forEach(el => {
  if (el.dataset.splitDone) return; el.dataset.splitDone = 1;
  el.classList.add('split'); el.classList.remove('reveal');
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) {
      const frag = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.append(' '); return; }
        const w = document.createElement('span'); w.className = 'w'; w.innerHTML = '<span></span>'; w.firstChild.textContent = t; frag.append(w);
      });
      c.replaceWith(frag);
    } else if (c.nodeType === 1) walk(c);
  });
  walk(el);
  $$('.w>span', el).forEach((s, i) => s.style.transitionDelay = (i * 0.05) + 's');
  io.observe(el);
});
// hero : révélation immédiate
setTimeout(() => $$('.hero2 .split').forEach(e => e.classList.add('in')), 250);

// Stagger des grilles
$$('.features,.solutions,.quality-grid,.blog-grid,.stats').forEach(g => {
  g.classList.add('stagger');
  [...g.children].forEach((c, i) => { c.classList.remove('reveal'); c.style.transitionDelay = i * 0.08 + 's'; });
  io.observe(g);
});

// Scroll loop : progression, cadre hero, marquee à vélocité, header auto-hide
const frame = $('#heroFrame'), mtrack = $('.marquee-track');
let lastY = scrollY, mx = 0, vel = 0;
function frameLoop() {
  const y = scrollY, dy = y - lastY; lastY = y;
  bar.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - innerHeight || 1)})`;
  if (frame) {
    const r = frame.getBoundingClientRect();
    const p = Math.min(Math.max(1 - (r.top / (innerHeight * 0.8)), 0), 1);
    frame.style.setProperty('--p', p.toFixed(3));
  }
  if (mtrack) {
    vel += (dy - vel) * 0.1;
    mx -= 0.6 + Math.abs(vel) * 0.4;
    const half = mtrack.scrollWidth / 2; if (-mx > half) mx += half;
    mtrack.style.transform = `translate3d(${mx}px,0,0) skewX(${Math.max(-8, Math.min(8, -vel * 0.3))}deg)`;
  }
  if (header && !document.body.classList.contains('menu-open')) header.classList.toggle('hidden', dy > 2 && y > 400 ? true : dy < -2 ? false : header.classList.contains('hidden'));
  requestAnimationFrame(frameLoop);
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frameLoop);

// Boutons magnétiques
if (matchMedia('(hover:hover)').matches) $$('.btn').forEach(b => {
  b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`; });
  b.addEventListener('mouseleave', () => b.style.transform = '');
});

// Tilt léger sur les cartes produits
if (matchMedia('(hover:hover)').matches) $$('.product').forEach(c => {
  const img = c.querySelector('img,.pattern');
  c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; img.style.transform = `scale(.97) perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`; });
  c.addEventListener('mouseleave', () => img.style.transform = '');
});

/* ===== Sélecteur de design + suivi d'image (liste produits) ===== */
document.body.insertAdjacentHTML('beforeend', '<div class="design-switch" role="group" aria-label="Design"><button data-d="noir">Noir</button><button data-d="minimal">Minimal</button></div>');
const syncSwitch = () => $$('.design-switch button').forEach(b => b.classList.toggle('on', b.dataset.d === (document.documentElement.classList.contains('theme-noir') ? 'noir' : 'minimal')));
$$('.design-switch button').forEach(b => b.onclick = () => { document.documentElement.classList.toggle('theme-noir', b.dataset.d === 'noir'); localStorage.setItem('design', b.dataset.d); syncSwitch(); });
syncSwitch();
$$('.product').forEach(c => c.addEventListener('mousemove', e => {
  if (!document.documentElement.classList.contains('theme-noir')) return;
  const img = c.querySelector('img,.pattern'); img.style.left = e.clientX + 'px'; img.style.top = e.clientY + 'px';
}));
