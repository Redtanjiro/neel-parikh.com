/* =========================================================
   neel-parikh.com — the opening
   The island standing, three lines in the space it gives up, and a boat
   that leaves the site behind it in its wake.
   =========================================================

   ONE ENGINE. The island is js/about-island.js's own scene and renderer,
   borrowed through window.NPIsland for the length of the lid and handed
   back at the end — the opening and the About track never run at the
   same time, so there is no second copy of either. This file owns the
   playhead, the score, the boat and its wake, and the reveal.

   It plays on its own, once per visit. What keeps a timed sequence
   nobody asked for from being an ambush is that the reader can see how
   long it is and can leave at any point:

     - THE RAIL. A bar filling for the length of the run.
     - THE EXIT, STANDING. Esc, a tap target beside the rail, and every
       nav link, for the whole run.

   THE SHAPE, in seconds of playhead:

      0.15  the erosion begins, alone
      1.15  "no designer is an island"
      2.75  "all by themself,"                 lines stack and stay
      4.35  "let's work together."
      5.15  the remnant of the island starts to go
      6.25  the boat enters from the right
     ~9.2   the hull is off the left edge; the wake is still clearing
     10.8   the title card is standing, and the lid comes off

   Every beat except the wake is a pure function of the playhead.

   THE REVEAL MASKS THE LID, NOT THE SITE. The site is already laid out
   and scroll-locked underneath; making the lid transparent behind the
   boat uncovers it without the page having to know — and the lines, the
   canvas and the rail are all taken by the same edge, which is what
   "wiped by the boat" has to mean.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');

  var hero     = document.getElementById('hero');
  var cvs      = document.getElementById('hero-isle');
  var site     = document.getElementById('site');
  var rail     = document.getElementById('rail');
  var railBar  = document.getElementById('rail-bar');
  var railFill = document.getElementById('rail-fill');
  var bailBtn  = document.getElementById('bail');
  var chrome   = document.getElementById('chrome');
  var mark     = document.getElementById('chrome-mark');
  var lines    = [].slice.call(document.querySelectorAll('.hero__ln'));
  var linesEl  = document.querySelector('.hero__lines');
  var E        = window.NPIsland;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function sg(t, a, b) { var v = (t - a) / (b - a); return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(v) { return v * v * (3 - 2 * v); }
  function ease(v) { return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }

  /* ---------------------------------------------------------
     SEEN ALREADY — once per visit

     Coming home from a case study is a return, not an arrival. The head
     of index.html reads the same flag before first paint and hides the
     lid outright, so a return never flashes a black frame either.

     And no engine means no picture: a story without its island is worse
     than no story, so that skips it too.
     --------------------------------------------------------- */
  var SEEN_KEY = 'np:opening-seen';
  function seenGet() { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; } }
  function seenSet() { try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {} }

  var skipOpening = seenGet() || !E || !hero || !cvs;

  if (site && !skipOpening) {
    site.setAttribute('aria-hidden', 'true');
    site.setAttribute('inert', '');
  }
  if (!skipOpening) root.classList.add('is-opening');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* =========================================================
     THE SCORE
     =========================================================
     THE DISSOLVE LEADS. It starts alone and is already under way before
     the first line — the picture gives up the space and the words move
     into it. Starting them together made the copy read as a caption on
     the effect rather than the thing the effect was clearing room for.

     One smooth run, not a step per line: locked to the lines, it stalled
     in every pause. The overshoot is small on purpose — at 1.20 the
     middle is long gone but the silhouette has only lost about a third,
     so the island is still there under the last line.

     Reduced motion runs the same score at a little over half length and
     loses the travel: no erosion (the island dims instead) and no boat
     (the lid crossfades onto the site). Same states, no flying. */
  var RM        = reduced ? 0.55 : 1;
  var DISS_IN   = 0.15 * RM;
  var DISS_END  = (0.15 + 6.40) * RM;
  var APPEAR    = 0.55 * RM;
  var LN_AT     = [1.15 * RM, 2.75 * RM, 4.35 * RM];
  var BOAT_IN   = LN_AT[2] + (0.55 + 1.35) * RM;
  var ISLE_OUT  = 1.10 * RM;     /* the remnant goes before the boat, so it arrives on black */
  var BOAT_SPAN = 4.60;
  var CROSS     = 0.90;          /* reduced motion's crossfade, in place of the crossing */

  /* The boat runs 1.14 -> -0.64 across the frame (screen x). The reveal
     trails it by up to 52% of the width, so the page is fully uncovered
     at bp = (1.14 + 0.52) / 1.78 — and that, not the end of the boat's
     span, is when the lid comes off. The prototype held 0.8s past it on
     a page that looked finished but could not be clicked. */
  var BP_CLEAR  = (1.14 + 0.52) / 1.78;
  var END       = reduced ? BOAT_IN + CROSS : BOAT_IN + BOAT_SPAN * BP_CLEAR + 0.12;

  /* ---------------------------------------------------------
     THE ENGINE'S LOOK FOR THIS FRAME

     The file's own defaults except distance. About fits the island into
     a measured column; this frame is full bleed, so it stands further
     back — and further still on a portrait screen, where 9.5 would put
     the shoreline off both edges. */
  function budget() {
    var w = window.innerWidth;
    return Math.round((w <= 560 ? 70000 : w <= 980 ? 140000 : 260000) * DENS);
  }
  function aspect() { return (window.innerWidth || 1) / (window.innerHeight || 1); }
  function distFor() { return Math.max(9.5, 3.6 / (0.495 * aspect())); }
  /* The boat is placed at a fixed depth; on a narrow frame that depth
     makes it most of the screen wide, so it stands off in proportion. */
  function boatDepth() { return Math.max(5.7, 1.84 / (0.26 * 0.99 * aspect())); }

  var DENS = 1;
  var look = {
    gain: 1.70, bloom: 0.50, occl: 0.10, yaw: -0.62, pitch: 0.24,
    dist: distFor(), cap: 1200000, points: 0,
    ECH: reduced ? [0, 0, 0, 0, 0, 0] : null
  };

  /* =========================================================
     THE BOAT
     A runabout, bow to local +x. A mast is a tall thin thing that
     disappears at this scale; a long low hull with a lifting sheer, a
     transom, a recessed cockpit and a raked screen holds its silhouette
     down to a few hundred points, which is all it gets when it is small
     in frame. Sampled like the island: area-weighted triangle, point
     inside it, face normal kept for shading.
     ========================================================= */
  var BPOS = [], BMAT = [];
  function bT(a, b, c, m) { BPOS.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); BMAT.push(m); }
  function bQ(a, b, c, d, m) { bT(a, b, c, m); bT(a, c, d, m); }

  function boatMesh() {
    var L = 0.92, B = 0.27, KEEL = -0.15, SHEER = 0.11, SEG = 11;
    function u01(x) { return (x + L) / (2 * L); }
    function hw(x) { var u = u01(x); return B * Math.sqrt(Math.max(0, 1 - Math.pow(u, 3.0))) * (0.62 + 0.38 * Math.min(1, u * 4)); }
    function sh(x) { return SHEER + 0.095 * Math.pow(u01(x), 2.8); }
    function kl(x) { return KEEL + 0.115 * Math.pow(u01(x), 2.6); }

    for (var i = 0; i < SEG; i++) {
      var x0 = -L + 2 * L * i / SEG, x1 = -L + 2 * L * (i + 1) / SEG;
      var w0 = hw(x0), w1 = hw(x1), s0 = sh(x0), s1 = sh(x1), k0 = kl(x0), k1 = kl(x1);
      bQ([x0, k0, 0], [x1, k1, 0], [x1, s1, w1], [x0, s0, w0], 17);
      bQ([x1, k1, 0], [x0, k0, 0], [x0, s0, -w0], [x1, s1, -w1], 17);
      bQ([x0, s0, w0], [x1, s1, w1], [x1, s1, -w1], [x0, s0, -w0], 18);
    }
    bQ([-L, kl(-L), hw(-L)], [-L, kl(-L), -hw(-L)], [-L, sh(-L), -hw(-L)], [-L, sh(-L), hw(-L)], 17);

    /* the cockpit: dark against the pale deck, so the top is not one slab */
    var cA = -0.34, cB = 0.16, cd = 0.055;
    for (var c = 0; c < 4; c++) {
      var z0 = cA + (cB - cA) * c / 4, z1 = cA + (cB - cA) * (c + 1) / 4;
      var q0 = hw(z0) * 0.72, q1 = hw(z1) * 0.72;
      bQ([z0, sh(z0) - cd, q0], [z1, sh(z1) - cd, q1], [z1, sh(z1) - cd, -q1], [z0, sh(z0) - cd, -q0], 17);
    }
    var wx = 0.20, ww = hw(wx);
    bQ([wx, sh(wx), ww * 0.80], [wx, sh(wx), -ww * 0.80],
       [wx - 0.15, sh(wx) + 0.115, -ww * 0.66], [wx - 0.15, sh(wx) + 0.115, ww * 0.66], 18);
    bQ([wx - 0.15, sh(wx) + 0.115, ww * 0.66], [wx - 0.15, sh(wx) + 0.115, -ww * 0.66],
       [wx, sh(wx), -ww * 0.80], [wx, sh(wx), ww * 0.80], 18);
  }

  var B_P, B_N, B_M, BN = 4800;
  function buildBoat() {
    var TN = BMAT.length, cum = new Float32Array(TN), run = 0, i, b;
    for (i = 0; i < TN; i++) {
      b = i * 9;
      var ux = BPOS[b + 3] - BPOS[b], uy = BPOS[b + 4] - BPOS[b + 1], uz = BPOS[b + 5] - BPOS[b + 2];
      var vx = BPOS[b + 6] - BPOS[b], vy = BPOS[b + 7] - BPOS[b + 1], vz = BPOS[b + 8] - BPOS[b + 2];
      var cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      run += 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz); cum[i] = run;
    }
    B_P = new Float32Array(BN * 3); B_N = new Float32Array(BN * 3); B_M = new Uint8Array(BN);
    for (i = 0; i < BN; i++) {
      var t = Math.random() * run, lo = 0, hi = TN - 1;
      while (lo < hi) { var md = (lo + hi) >> 1; if (cum[md] < t) lo = md + 1; else hi = md; }
      b = lo * 9;
      var r1 = Math.sqrt(Math.random()), r2 = Math.random();
      var A = 1 - r1, Bb = r1 * (1 - r2), C = r1 * r2, o = i * 3;
      B_P[o]     = BPOS[b] * A     + BPOS[b + 3] * Bb + BPOS[b + 6] * C;
      B_P[o + 1] = BPOS[b + 1] * A + BPOS[b + 4] * Bb + BPOS[b + 7] * C;
      B_P[o + 2] = BPOS[b + 2] * A + BPOS[b + 5] * Bb + BPOS[b + 8] * C;
      var ux2 = BPOS[b + 3] - BPOS[b], uy2 = BPOS[b + 4] - BPOS[b + 1], uz2 = BPOS[b + 5] - BPOS[b + 2];
      var vx2 = BPOS[b + 6] - BPOS[b], vy2 = BPOS[b + 7] - BPOS[b + 1], vz2 = BPOS[b + 8] - BPOS[b + 2];
      var nx = uy2 * vz2 - uz2 * vy2, ny = uz2 * vx2 - ux2 * vz2, nz = ux2 * vy2 - uy2 * vx2;
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      B_N[o] = nx / nl; B_N[o + 1] = ny / nl; B_N[o + 2] = nz / nl;
      B_M[i] = BMAT[lo];
    }
  }

  /* ---------------------------------------------------------
     THE WAKE — a trail, not an exhaust

     Laid down in world space and left there. Two thirds is the wake
     proper, low and wide; a third is thrown high and wide off the transom,
     and that curtain is what the site comes through.

     All of it spawns BEHIND the boat, on the side it has already passed —
     the side being uncovered. Ahead of it, the hull drowns in its own
     spray.

     It keeps clearing after the hull has gone: the particles go on
     spreading and dimming on their own clock, and only a last fade makes
     sure the lid comes off on nothing. (The prototype tied the wake to the
     hull's brightness, so the curtain vanished with the boat and the last
     of the reveal was a plain wipe.) */
  var WKN = 22000, WK_P, WK_V, WK_A, wkHead = 0;
  function buildWake() {
    WK_P = new Float32Array(WKN * 3); WK_V = new Float32Array(WKN * 3); WK_A = new Float32Array(WKN);
  }
  function wakeStep(dt, emit, sx, sz, bx, by, bz) {
    var i, o;
    for (i = 0; i < WKN; i++) {
      if (WK_A[i] <= 0) continue;
      o = i * 3;
      WK_P[o] += WK_V[o] * dt; WK_P[o + 1] += WK_V[o + 1] * dt; WK_P[o + 2] += WK_V[o + 2] * dt;
      WK_A[i] -= dt * 0.26;
      if (WK_A[i] < 0) WK_A[i] = 0;
    }
    var k = Math.min(emit, WKN);
    for (i = 0; i < k; i++) {
      var id = wkHead++; if (wkHead >= WKN) wkHead = 0;
      o = id * 3;
      var tall = Math.random() < 0.46;
      var side = (Math.random() - 0.5) * (tall ? 1.10 : 0.60);
      var lead = (tall ? 0.05 : 0.50) + Math.random() * (tall ? 0.55 : 0.30);
      WK_P[o]     = bx - sx * lead - sz * side;
      WK_P[o + 1] = by + (tall ? (Math.random() - 0.42) * 1.30 : -0.10 + Math.random() * 0.12);
      WK_P[o + 2] = bz - sz * lead + sx * side;
      var sp = (tall ? 0.16 : 0.24) + Math.random() * (tall ? 0.52 : 0.42);
      WK_V[o]     = -sx * sp * 0.55 - sz * side * (tall ? 0.30 : 0.90);
      WK_V[o + 1] = tall ? (Math.random() - 0.44) * 0.95 : 0.02 + Math.random() * 0.05;
      WK_V[o + 2] = -sz * sp * 0.55 + sx * side * (tall ? 0.30 : 0.90);
      WK_A[id] = (tall ? 0.55 : 0.80) + Math.random() * 0.45;
    }
  }

  /* =========================================================
     ONE POSITION OF THE PLAYHEAD
     ========================================================= */
  var boatOn = 0, wakeOn = 0, fadeIn = 1, bx = 0, by = 0, bz = 0, sx = 0, sz = 0;
  var lastMask = '', lastLinesMask = '';

  function setMask(v) {
    if (v === lastMask) return;
    lastMask = v;
    hero.style.webkitMaskImage = v;
    hero.style.maskImage = v;
  }
  function setLinesMask(v) {
    if (!linesEl || v === lastLinesMask) return;
    lastLinesMask = v;
    linesEl.style.webkitMaskImage = v;
    linesEl.style.maskImage = v;
  }

  function apply(t) {
    /* They appear; they do not type, and they do not move. All three rows
       exist from the first frame (see .hero__ln), so an arriving line
       never nudges the ones above it. They leave with the lid. */
    for (var i = 0; i < lines.length; i++) {
      lines[i].style.opacity = smooth(sg(t, LN_AT[i], LN_AT[i] + APPEAR)).toFixed(3);
    }

    fadeIn = 1 - ease(sg(t, BOAT_IN - ISLE_OUT, BOAT_IN));

    if (reduced) {
      cvs.style.opacity = ((1 - 0.6 * smooth(sg(t, DISS_IN, DISS_END))) * fadeIn).toFixed(3);
      if (!leaving) hero.style.opacity = (1 - smooth(sg(t, BOAT_IN, BOAT_IN + CROSS))).toFixed(3);
      if (t >= BOAT_IN) showChrome();
      return;
    }

    var diss = smooth(sg(t, DISS_IN, DISS_END)) * 1.20;
    var bp = sg(t, BOAT_IN, BOAT_IN + BOAT_SPAN);

    /* the hull is off the frame by ~0.70; the fade is only tidying up */
    boatOn = t < BOAT_IN - 0.15 ? 0 : sg(t, BOAT_IN - 0.15, BOAT_IN + 0.25) * (1 - sg(bp, 0.72, 0.86));
    wakeOn = t < BOAT_IN ? 0 : 1 - sg(bp, 0.80, BP_CLEAR);
    E.set(fadeIn, diss, wakeOn);

    /* Placed by where it should be ON SCREEN, then inverse-projected — not
       slid along the camera's right axis, which swings it closer mid-run
       and, under a camera that looks slightly down, sinks it through the
       frame. Turned to face the way it travels, or it crabs. */
    var yaw = E.yaw();
    var th = Math.atan2(Math.sin(yaw), -Math.cos(yaw));
    var bsx = 1.14 - 1.78 * bp;
    var p = E.unproject(bsx, 0.615 + 0.012 * Math.sin(t * 1.9), boatDepth());
    bx = p[0]; by = p[1]; bz = p[2];
    sx = -Math.cos(yaw); sz = Math.sin(yaw);
    E.boat(boatOn, bx, by, bz, Math.cos(th), Math.sin(th));

    /* THE REVEAL. The lid goes transparent behind the hull, across a band
       as wide as the curtain it throws: at the hull nothing of the page,
       a third of the way back a suggestion under the densest spray, and
       only once the particles have spread and gone the page itself. The
       page cannot arrive before the wake has cleared, or it is a wipe
       with particles on it. Unclamped, so it clears the left edge. */
    if (t < BOAT_IN) { setMask(''); setLinesMask(''); }
    else {
      var rev = bsx * 100;
      setMask('linear-gradient(to right, #000 ' + (rev - 3).toFixed(1) + '%, rgba(0,0,0,.82) ' +
        (rev + 13).toFixed(1) + '%, rgba(0,0,0,.38) ' + (rev + 32).toFixed(1) + '%, transparent ' +
        (rev + 52).toFixed(1) + '%)');
      /* The lines go at the hull, on a tighter edge than the page arrives
         on: the title card's own lines sit in the same band of the frame,
         and two sentences crossing in the curtain read as neither. */
      setLinesMask('linear-gradient(to right, #000 ' + (rev - 2).toFixed(1) + '%, transparent ' +
        (rev + 12).toFixed(1) + '%)');
    }

    /* The mark arrives as the band clears the top-left, where it sits. */
    if (bp >= 0.78) showChrome();
  }

  /* =========================================================
     THE PLAYHEAD
     The loop runs from the first frame; the playhead starts once the
     island has faded in, so it is seen standing — water, smoke, weather —
     before anything happens to it.
     ========================================================= */
  var clock = 0, running = false, leaving = false, handedOff = false;
  var raf = 0, last = 0;
  var fAcc = 0, fN = 0, eased = 0, slow = 0;

  function setRail(f) {
    if (railFill) railFill.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    if (railBar) railBar.setAttribute('aria-valuenow', Math.round(f * 100));
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var gap = last ? now - last : 16.7;
    var dt = Math.min(0.05, gap / 1000);
    last = now;

    if (running && !leaving) {
      clock += dt;
      if (clock > END) clock = END;
    }
    apply(clock);

    if (!reduced) {
      if (wakeOn > 0) wakeStep(dt, boatOn > 0 ? Math.round(dt * 7600) : 0, sx, sz, bx, by, bz);
      if (fadeIn > 0.004 || boatOn > 0 || wakeOn > 0) E.render(now / 1000, dt);
      else E.blank();
      if (running) pace(gap);
    }
    setRail(clock / END);

    if (running && clock >= END) handoff();
  }

  /* PACING. This is CPU-bound JavaScript: on the MacBook it was built
     for, 260k points cost ~21ms a frame — 45fps, not 60. A sequence that
     stutters is worse than a slightly thinner one that doesn't, so the
     count is FITTED before the island is ever shown (see calibrate), not
     thinned in front of the reader: a rebuild re-samples every point and
     reads as a shimmer.

     After that, one guard for a machine that slows down mid-run: real
     frame gaps, not the clamped dt, and anything over 250ms ignored — a
     throttled or hidden tab is not a slow one. */
  function pace(gap) {
    if (gap > 250 || eased) return;
    fAcc += gap; fN++;
    if (fAcc < 1000) return;
    var fps = 1000 * fN / fAcc;
    fAcc = 0; fN = 0;
    if (fps < 40) { if (++slow > 1) { eased = 1; DENS *= 0.75; E.size(budget()); } }
    else slow = 0;
  }

  /* A frame budget of ~13ms of script leaves room for compositing inside
     16.7. Timed on the real canvas at the real size, behind the lid while
     it is still black, after first paint — during load the page is busy
     enough to halve the answer. Three frames to warm up, then the median
     of five. Per-point cost is near linear over a ~3.5ms fixed cost
     (clear, upload, bloom). */
  function calibrate() {
    var i, t0, ts = [];
    for (i = 0; i < 3; i++) E.render(i / 60, 1 / 60);
    for (i = 0; i < 5; i++) {
      t0 = performance.now();
      E.render((3 + i) / 60, 1 / 60);
      ts.push(performance.now() - t0);
    }
    ts.sort(function (a, b) { return a - b; });
    var ms = ts[2];
    if (ms > 13) {
      DENS = Math.max(0.42, Math.min(1, (13 - 3.5) / Math.max(1, ms - 3.5)));
      E.size(budget());
    }
  }

  /* =========================================================
     THE HANDOFF — the lid comes off, once
     ========================================================= */
  var wanted = null;

  function handoff() {
    if (handedOff) return;
    handedOff = true;
    seenSet();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }

    railShow(false);
    if (hero) {
      hero.hidden = true;
      hero.style.opacity = '';
      setMask('');
      setLinesMask('');
    }

    root.classList.remove('is-opening');
    if (site) {
      site.removeAttribute('aria-hidden');
      site.removeAttribute('inert');
    }
    if (E) E.give();

    /* Force the unlocked layout before scrolling into it; against the
       locked one scrollTo silently clamps to zero. */
    void root.scrollHeight;
    landing();
    showChrome();
  }

  /* Where the reader is put down. The top of the page is the title card —
     what the boat uncovered — so that is the default. A
     fragment wins on a return visit (/#work from a case study), and so
     does a nav link pressed during the lid: that reader asked to go
     somewhere, and skipping them to the top would ignore it. */
  function landing() {
    var hash = wanted || (skipOpening ? window.location.hash : '');
    var target = null;
    if (hash && hash.length > 1) {
      try { target = document.querySelector(hash); } catch (e) { target = null; }
    }
    if (wanted && history.replaceState) history.replaceState(null, '', wanted);
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  function play() {
    if (handedOff || running || leaving) return;
    railShow(true);
    if (reduced) cvs.style.transition = 'none';
    running = true;
  }

  /* The skip. Past the middle of the crossing the reveal already IS the
     way out, and it is nearly done, so it is let finish. Anywhere before
     that the lid fades off the page it is covering — half a second, not a
     cut, and no stop on a title card that no longer exists. */
  function bail() {
    if (handedOff || leaving) return;
    if (running && !reduced && clock >= BOAT_IN + BOAT_SPAN * 0.5) return;
    leaving = true;
    showChrome();
    hero.classList.add('is-leaving');
    hero.style.opacity = '0';
    setTimeout(handoff, 500);
  }

  var railOn = false;
  function railShow(on) {
    if (!rail || on === railOn) return;
    railOn = on;
    if (on) {
      rail.hidden = false;
      requestAnimationFrame(function () { rail.setAttribute('data-show', ''); });
    } else {
      rail.removeAttribute('data-show');
      setTimeout(function () { if (!railOn) rail.hidden = true; }, 440);
    }
  }

  /* ---------------------------------------------------------
     Chrome. The nav is out from the first frame — it is an exit. The
     mark and the reading rule wait for the page, which is furniture.
     --------------------------------------------------------- */
  var chromeShown = false;
  function showChrome() {
    if (chromeShown || !chrome) return;
    chromeShown = true;
    chrome.setAttribute('data-full', '');
    /* Over the title card the mark stands down (its eyebrow is the mark
       there), so an entrance would only play to leave again. */
    if (reduced || !mark || !mark.animate || chrome.hasAttribute('data-top')) return;
    var entrance = mark.animate([
      { opacity: 0, transform: 'translate(2vw, 6vh) scale(1.6)', filter: 'blur(2px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' }
    ], { duration: 560, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' });
    /* A filled animation outranks every CSS declaration; hand the
       property back to the cascade once it has landed. */
    if (entrance.finished) entrance.finished.then(function () { entrance.cancel(); }, function () {});
  }

  /* ---------------------------------------------------------
     Wiring
     --------------------------------------------------------- */
  if (bailBtn) bailBtn.addEventListener('click', bail);

  window.addEventListener('keydown', function (e) {
    if (handedOff) return;
    if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); bail(); }
  });

  /* Every link into the page is an exit while the lid is down — and it
     still goes where it said it would. */
  [].slice.call(document.querySelectorAll('a[href="#work"], a[href="#about"]')).forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (handedOff) return;
      e.preventDefault();
      wanted = a.getAttribute('href');
      if (running && !reduced && clock >= BOAT_IN + BOAT_SPAN * 0.5) return;
      bail();
    });
  });

  /* The way back in. replace(), not reload(), so a #work fragment is
     dropped and the reader lands at the start of the opening. */
  var replayBtn = document.getElementById('replay-opening');
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      try { sessionStorage.removeItem(SEEN_KEY); } catch (e) {}
      window.location.replace(window.location.pathname + window.location.search);
    });
  }

  /* =========================================================
     GO
     ========================================================= */
  if (skipOpening) {
    handoff();
    return;
  }

  look.points = budget();
  if (!E.take(cvs, look)) { handoff(); return; }

  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      if (handedOff) return;
      look.points = budget();
      E.size(look.points, distFor());
      if (reduced) E.render(2.0, 0);
    }, 150);
  });

  if (reduced) {
    /* One still frame: the island as it stands, no weather, no drift. */
    E.render(2.0, 0);
  } else {
    boatMesh(); buildBoat(); buildWake();
    E.carry(B_P, B_N, B_M, BN, WK_P, WK_A, WKN);
  }
  apply(0);
  setRail(0);
  raf = requestAnimationFrame(function () {
    if (!reduced) calibrate();
    /* The island arrives rather than having always been there, and the
       story starts as it finishes arriving. */
    cvs.setAttribute('data-live', '');
    raf = requestAnimationFrame(frame);
    setTimeout(play, 900);
  });
})();
