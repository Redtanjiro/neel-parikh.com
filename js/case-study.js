/* ══════════════════════════════════════════════════════════════
   CASE STUDY — shared motion.
   Loaded by every case study so timings never drift between them.
   Case-specific interactions live in the page that needs them.

   transform/opacity only · custom easing · reveals fire once and
   unobserve · full prefers-reduced-motion opt-out.
   ══════════════════════════════════════════════════════════════ */

const REDUCED = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1 · reveal on enter, once, never on the way back up */
(function reveals() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (REDUCED || !('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  targets.forEach(t => io.observe(t));
})();

/* 2 · line-mask headlines.
   Splits on authored <br> — we only wrap, never re-flow, so the text
   stays selectable and legible to a screen reader. */
(function maskLines() {
  document.querySelectorAll('[data-lines]').forEach(el => {
    el.innerHTML = el.innerHTML.split('<br>').map((line, i) =>
      `<span class="ln"><i style="--d:${i * 70}ms">${line.trim()}</i></span>`).join('');
  });
})();

/* 3 · stagger index, authored so it survives a re-order in the markup */
(function stagger() {
  document.querySelectorAll('[data-stagger]').forEach(group =>
    [...group.children].forEach((child, i) => child.style.setProperty('--i', i)));
})();

/* 4 · parallax — full-bleed media only, desktop only */
(function parallax() {
  if (REDUCED || window.innerWidth < 768) return;
  const items = [...document.querySelectorAll('[data-parallax]')];
  if (!items.length) return;
  let ticking = false;
  const run = () => {
    const vh = window.innerHeight;
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      const amt = parseFloat(el.dataset.parallax) || 10;
      const img = el.querySelector('img');
      if (img) img.style.transform =
        `translate3d(0,${(-progress * amt).toFixed(2)}%,0) scale(1.12)`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(run); }
  }, { passive: true });
  addEventListener('resize', run);
  run();
})();

/* 5 · sticky nav — tucks on scroll down, returns on scroll up */
(function stickyNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-live', y > innerHeight * 0.75);
    if (y > last + 4 && y > innerHeight) nav.classList.add('is-tucked');
    else if (y < last - 4) nav.classList.remove('is-tucked');
    last = y;
  }, { passive: true });

  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!sections.length) return;
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(l => l.classList.toggle('is-active',
      l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));
})();

/* 6 · scroll progress */
(function progress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  const run = () => {
    const max = document.body.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', run, { passive: true });
  addEventListener('resize', run);
  run();
})();

/* 7 · count-up — only ever on figures that are real */
(function countUp() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count);
    if (REDUCED || !('IntersectionObserver' in window)) { el.textContent = end; return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1200;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
  });
})();

requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
