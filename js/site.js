/* =========================================================
   neel-parikh.com — the page under the opening
   The reading rule, the files arriving, and the About links. Nothing
   here knows the opening exists: the lid is js/opening.js, the island
   is js/about-island.js.
   ========================================================= */
(function () {
  'use strict';

  var site = document.getElementById('site');

  /* ---------------------------------------------------------
     Reading-position rule. transform on the fill itself — a CSS
     variable on a parent would recalc every child — and one write per
     frame at most, whatever the scroll event rate.
     --------------------------------------------------------- */
  var fill = document.getElementById('progress-fill');
  if (fill) {
    var ticking = false;
    var measure = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    };
    var queue = function () { if (!ticking) { ticking = true; requestAnimationFrame(measure); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    measure();
  }

  /* ---------------------------------------------------------
     THE FILES ARRIVING — one-shot, the first time a section is a
     quarter on screen. Not toggled: an entrance that replays every time
     you scroll past is a tic. The desk is at the top of the page, so
     under the opening this fires at load and the files are standing by
     the time the boat uncovers them.
     --------------------------------------------------------- */
  function reveal(el, attr) {
    if (!site || !el) return;
    if (!('IntersectionObserver' in window)) { site.setAttribute(attr, ''); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      site.setAttribute(attr, '');
      io.disconnect();
    }, { threshold: 0.25 });
    io.observe(el);
  }
  reveal(document.getElementById('desk'), 'data-desk');
  reveal(document.getElementById('about-sec'), 'data-about');

  /* ---------------------------------------------------------
     The About links. Three links, one panel; the panes share a grid cell
     so selecting one is an opacity swap and the box never changes height.
     A real ARIA tablist — arrows, Home/End, roving tabindex.

     Looked up from #about-sec, the section. #about is the 1px scroll cue
     inside the island track, and looking the tabs up from it found none
     — which is how they went dead.
     --------------------------------------------------------- */
  var aboutSec  = document.getElementById('about-sec');
  var aboutTabs = aboutSec ? [].slice.call(aboutSec.querySelectorAll('.about__tab')) : [];
  var aboutPanes = aboutTabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

  function aboutSelect(n, focus) {
    aboutTabs.forEach(function (t, i) {
      t.setAttribute('aria-selected', String(i === n));
      t.tabIndex = i === n ? 0 : -1;
      if (!aboutPanes[i]) return;
      if (i === n) aboutPanes[i].setAttribute('data-on', '');
      else aboutPanes[i].removeAttribute('data-on');
    });
    if (focus && aboutTabs[n]) aboutTabs[n].focus();
  }

  aboutTabs.forEach(function (t, i) {
    t.addEventListener('click', function () { aboutSelect(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % aboutTabs.length;
      if (k === 'ArrowLeft'  || k === 'ArrowUp')   n = (i - 1 + aboutTabs.length) % aboutTabs.length;
      if (k === 'Home') n = 0;
      if (k === 'End')  n = aboutTabs.length - 1;
      if (n !== null) { e.preventDefault(); aboutSelect(n, true); }
    });
  });

  /* Whichever one the markup ships selected — "just me". */
  if (aboutTabs.length) {
    var start = 0;
    aboutTabs.forEach(function (t, i) { if (t.getAttribute('aria-selected') === 'true') start = i; });
    aboutSelect(start);
  }
})();
