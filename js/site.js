/* =========================================================
   neel-parikh.com — the page under the opening
   The reading rule, the title card, the files arriving, and the About
   links. Nothing here knows the opening exists: the lid is
   js/opening.js, the island is js/about-island.js.
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
  function rule() {
    if (!fill) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    fill.style.transform = 'scaleX(' + f.toFixed(4) + ')';
  }

  /* ---------------------------------------------------------
     THE TITLE CARD, READ IN TWO LINES

     .title is 300svh of scroll; .title__stage is the 100svh sticky pane
     inside it. Progress runs from the card's top at the top of the
     window to its bottom there, and every beat is a pure function of it,
     so scrolling back up unplays it exactly:

       0.00-0.24  line one, held
       0.24-0.40  line one lifts out, line two takes its place
       0.40-0.72  line two, held
       0.72-1.00  line two, the eyebrow and the pane fade while the pane
                  unpins and the desk comes up under it — the title
                  dissolving into the work rather than ending at an edge

     Reduced motion and no-JS never get here: CSS stacks both lines,
     static.
     --------------------------------------------------------- */
  var title   = document.getElementById('title');
  var tStage  = title && title.querySelector('.title__stage');
  var tLine1  = title && title.querySelector('.title__line--1');
  var tLine2  = title && title.querySelector('.title__line--2');
  var tBrow   = title && title.querySelector('.title__eyebrow');
  var scrubTitle = !!(tStage && tLine1 && tLine2) &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastP = -1;

  function seg(p, a, b) { var v = (p - a) / (b - a); return v < 0 ? 0 : v > 1 ? 1 : v; }
  function titleScrub() {
    var r = title.getBoundingClientRect();
    var p = r.height > 0 ? Math.min(1, Math.max(0, -r.top / r.height)) : 0;
    if (p === lastP) return;
    lastP = p;
    var swap = seg(p, 0.24, 0.40), out = seg(p, 0.72, 1);
    tLine1.style.opacity = (1 - swap).toFixed(3);
    tLine1.style.transform = 'translateY(' + (-16 * swap).toFixed(2) + '%)';
    tLine2.style.opacity = (swap * (1 - out)).toFixed(3);
    tLine2.style.transform = 'translateY(' + (16 * (1 - swap) - 16 * out).toFixed(2) + '%)';
    if (tBrow) tBrow.style.opacity = (1 - out).toFixed(3);
    tStage.style.opacity = (1 - out).toFixed(3);
  }

  var ticking = false;
  function onScroll() {
    ticking = false;
    rule();
    if (scrubTitle) titleScrub();
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  onScroll();

  /* ---------------------------------------------------------
     ABOUT, BY CLICK, PLAYS THE SAME WAY IT DOES BY SCROLL

     The island track is driven by scroll position, so an anchor jump
     lands on the settled frame and skips the whole disperse. Instead the
     link carries the page there: from above the track it cuts to the
     Work grid at rest — the frame the sequence starts from — then runs
     the scroll down to the settle, so the grid flies apart and the island
     gathers on the way. Scrolling by hand is untouched.

     Any wheel, touch or key during the run hands the page straight back.
     Reduced motion, and no track (no JS for it, or the still island),
     keep the plain jump. While the opening's lid is down, js/opening.js
     owns the link. */
  var atoll = document.getElementById('atoll');
  var cue   = document.getElementById('about');
  var carrying = 0;

  function stopCarry() {
    if (!carrying) return;
    cancelAnimationFrame(carrying);
    carrying = 0;
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.removeEventListener(t, stopCarry); });
  }

  function carryToAbout() {
    var r = atoll.getBoundingClientRect();
    var trackTop = r.top + window.scrollY;
    var hold = parseFloat(getComputedStyle(atoll).getPropertyValue('--hold')) || window.innerHeight;
    var margin = parseFloat(getComputedStyle(cue).scrollMarginTop) || 0;
    var target = cue.getBoundingClientRect().top + window.scrollY - margin;
    var from = window.scrollY;
    if (from < trackTop + hold && target > trackTop + hold) {
      from = trackTop + hold;
      window.scrollTo(0, from);
    }
    var dist = target - from;
    if (Math.abs(dist) < 2) return;
    var screens = Math.abs(dist) / window.innerHeight;
    var dur = Math.max(700, Math.min(2400, 600 + 450 * screens));
    var t0 = 0;
    function step(now) {
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / dur);
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, from + dist * e);
      if (k < 1) carrying = requestAnimationFrame(step);
      else stopCarry();
    }
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, stopCarry, { passive: true }); });
    carrying = requestAnimationFrame(step);
  }

  if (atoll && cue) {
    [].slice.call(document.querySelectorAll('a[href="#about"]')).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var root = document.documentElement;
        if (root.classList.contains('is-opening') || !root.classList.contains('atoll-on')) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        e.preventDefault();
        stopCarry();
        if (window.location.hash !== '#about' && history.pushState) history.pushState(null, '', '#about');
        carryToAbout();
      });
    });
  }

  /* ---------------------------------------------------------
     THE SCROLL CUE — on and off, all the way down

     Hidden while the reader is scrolling, back the moment they stop
     (REST is just long enough to see a scroll has ended, momentum
     included), and gone for good while the footer is in view: there is
     nothing further down to point at. It
     first arrives once the opening's lid has lifted — watched for on
     html's class, since the lid is js/opening.js's business.
     --------------------------------------------------------- */
  var cue = document.getElementById('scroll-cue');
  var footer = document.querySelector('.footer');
  if (cue) {
    var REST = 220, restT = 0, atEnd = false, root = document.documentElement;
    var cueShow = function () {
      if (atEnd || root.classList.contains('is-opening')) return;
      cue.setAttribute('data-on', '');
    };
    var cueRest = function (ms) { clearTimeout(restT); restT = setTimeout(cueShow, ms); };
    window.addEventListener('scroll', function () {
      cue.removeAttribute('data-on');
      cueRest(REST);
    }, { passive: true });
    if (footer && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        atEnd = entries[0].isIntersecting;
        if (atEnd) { clearTimeout(restT); cue.removeAttribute('data-on'); }
        else cueRest(REST);
      }).observe(footer);
    }
    if (root.classList.contains('is-opening') && 'MutationObserver' in window) {
      var lid = new MutationObserver(function () {
        if (root.classList.contains('is-opening')) return;
        lid.disconnect();
        cueRest(700);
      });
      lid.observe(root, { attributes: true, attributeFilter: ['class'] });
    } else cueRest(700);
  }

  /* The mark stands down while the card is on screen: its eyebrow IS
     the mark there, and two of one mark in a frame is a repetition. */
  var chrome = document.getElementById('chrome');
  if (tStage && chrome && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) chrome.setAttribute('data-top', '');
      else chrome.removeAttribute('data-top');
    }, { threshold: 0 }).observe(tStage);
  }

  /* ---------------------------------------------------------
     THE FILES ARRIVING — one-shot, the first time a section is a
     quarter on screen. Not toggled: an entrance that replays every time
     you scroll past is a tic. The desk sits under the title card, so
     the files arrive as the reader scrolls down to them.
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
