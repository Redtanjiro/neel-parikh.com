/* =========================================================
   neel-parikh.com — hero step machine
   Pinned hero, gated scroll, one line per gesture.
   =========================================================

   Design notes worth keeping in mind when editing:

   - One gesture = one LINE, and input is LOCKED until that line has
     finished resolving. Position-driven snapping let a fast scroll
     skip lines entirely; the story only works if you can't outrun it.
   - Narrative motion (the lines) gets 400-900ms. UI motion (chrome,
     cue, hover) is hard-capped at 300ms. Do not let the tiers bleed.
   - Trackpad momentum is the enemy, but WAITING it out is worse. A
     flick decays; a hand still on the pad does not. Filter by that
     shape (isMomentumTail) and always release the lock within
     QUIET_CAP — an uncapped quiet period lets continuous scrolling
     hold the page hostage, which is exactly what users do when it
     feels stuck.
   - Input during the lock is DISCARDED. It used to be queued, and that
     was wrong: what arrives during the lock is the tail of the flick you
     already spent, so the queue turned one gesture into two lines — the
     second landing on its own while you were still reading the first.
     See step() for the full account.
   - The lock only applies inside the pin, and never at either end of
     it — you can always scroll out of the hero. Never trap the user.
*/

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var video   = document.getElementById('hero-video');
  var dither  = document.getElementById('hero-dither');
  var ditherwash = document.getElementById('hero-ditherwash');
  var hero    = document.getElementById('hero');
  var work    = document.getElementById('work');
  var cue     = document.getElementById('cue');
  var steps   = document.getElementById('steps');
  var chrome  = document.getElementById('chrome');
  var mark    = document.getElementById('chrome-mark');
  var fill    = document.getElementById('progress-fill');
  var nav     = document.querySelector('.chrome__nav');
  var blackout = document.getElementById('blackout');
  var isle    = document.getElementById('isle');
  var isleClip = document.getElementById('isle-clip');
  var lamps   = document.querySelector('.hero__lamps');
  var lampY   = document.getElementById('lamp-y');
  var lampA   = document.getElementById('lamp-a');
  var lampR   = document.getElementById('lamp-r');
  var nameEl  = document.getElementById('hero-name');
  var gateEl  = document.getElementById('gate');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Muted + playsinline autoplays everywhere except iOS Low Power Mode.
     If it's refused there's no control to offer any more — the poster
     is a frame of the same shot, so a refusal degrades to a still
     image rather than a broken state. */
  if (video && !reduced) {
    var attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(function () {});
  }

  /* No GSAP (CDN blocked / offline): show every line as static text.
     The story still reads. Bail out cleanly. */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    document.documentElement.classList.add('no-js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Built-in curves are too weak to read as intentional at hero size. */
  var EASE_OUT  = 'power3.out';
  var EASE_MOVE = 'power2.inOut';
  if (typeof CustomEase !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('npOut',  'M0,0 C0.23,1 0.32,1 1,1');
    CustomEase.create('npMove', 'M0,0 C0.77,0 0.175,1 1,1');
    EASE_OUT  = 'npOut';
    EASE_MOVE = 'npMove';
  }

  /* ---------------------------------------------------------
     The reveal: a focus pull.

     Each line arrives out of focus and slightly oversized, then racks
     into sharpness at its true size. Scramble was a computer metaphor
     on a page whose entire world is weather, altitude and distance —
     an optical reveal belongs here and a digital one didn't.

     The apparent letter-spacing settle comes free from the scale: at
     scale(1.06) the glyphs sit wider apart, and they close to their
     real tracking as it resolves. Animating letter-spacing directly
     would have given the same read at the cost of a layout pass every
     frame. filter + transform + opacity are all GPU.
     --------------------------------------------------------- */
  /* Trimmed from 0.70 / 0.40. Screen two says four things on one
     gesture now, so the reveals have to be quick enough that the
     sequence reads as speech rather than as four separate arrivals -
     and the same crispness suits screen one. Below about 0.5 the focus
     pull stops being legible as a rack and just looks like a fade. */
  var IN_DUR  = 0.62;
  var OUT_DUR = 0.34;
  var SCALE_IN  = 1.06;   // entrance start
  var SCALE_OUT = 1.03;   // exit end — recedes, doesn't retreat as far
  var STAGGER = 0.07;   // 70ms — past ~80ms three lines stop reading as one pulse
  var SUB_LAG = 0.2;
  var GLIDE   = 0.38;   // scroll travel between steps
  var SETTLE  = 0.08;   // empty frame after landing, before the line starts
  var QUIET     = 110;  // input silence that releases the lock…
  var QUIET_CAP = 380;  // …and the hard limit on waiting for it

  /* The sequence per step, and the order matters:
       0.00  scroll starts moving, outgoing line goes back out of focus
       0.38  page lands on an empty frame
       0.46  incoming line begins pulling into focus
       1.16  animation settles; lock lifts within QUIET_CAP
     The line does NOT animate while the page is moving. Overlapping the
     two meant you were reading during travel and the reveal got lost
     under the motion — the scroll delivers you, then the line speaks. */
  var ENTER_AT = GLIDE + SETTLE;

  /* The reveal. Blackout opacity per step.

     Pitch black for the whole setup — the line, the hesitation, the
     word. The island only appears on the ask. The entire first half of
     the page is a voice with no picture, which is what being marooned
     actually is, and it means the reveal has one job and spends it all
     in one place.

     Tied to the SCROLL, not the line: the darkness lifts across the
     glide and has finished by the time the line starts. Scrolling
     is what uncovers the place. Light change is atmosphere and can
     share the travel; text is information and can't. */
  var REVEAL = [1, 1];   /* one entry per step, 0..LAST */

  /* Step at which the frame becomes visible — also the point from which
     the video is worth decoding.

     NOTHING IS LIT ANY MORE. Both screens are black frames: screen one
     puts the ASCII island on top of the blackout, screen two puts type
     on it. The real place doesn't arrive until the tail, where the
     blackout is scrubbed rather than stepped — see applyDissolve. So
     there is no step whose REVEAL is 0, and indexOf returns -1; falling
     back to LAST is what keeps the video and the dither buffering on
     the right beat instead of from the first frame. */
  var LIT = REVEAL.indexOf(0);
  if (LIT < 0) LIT = null;   /* resolved to LAST once the markup is read */

  /* ---------------------------------------------------------
     Phrases

     A phrase is one or more lines sharing a position and a lifespan:
       data-in   the step it appears on
       data-out  the step it leaves on (absent = stays for good)

     Ranges rather than a single index is what lets "like, well" still
     be on screen when "a person…" lands underneath it. One scroll is
     one line, but a line doesn't have to leave when the next arrives.
     --------------------------------------------------------- */
  var phrases = Array.prototype.slice.call(document.querySelectorAll('.phrase'));
  phrases.forEach(function (b) {
    b._lines = Array.prototype.slice.call(b.querySelectorAll('.line'));
    b._in  = parseInt(b.dataset.in, 10);
    b._out = b.dataset.out ? parseInt(b.dataset.out, 10) : Infinity;
    /* Offsets IN SECONDS inside the step, not scroll positions. A step
       with these is spoken rather than pulled: see SEQ_STEP below.
       _off is what lets a line leave without the step changing, which
       is how screen two clears its own frame halfway through. */
    b._at  = b.dataset.at  ? parseFloat(b.dataset.at)  : 0;
    b._off = b.dataset.off ? parseFloat(b.dataset.off) : null;
    b._shown = false;
    b._faded = false;
    /* Blur depth scales with type size — 8px reads as soft on a 40px
       line and as barely-touched on a 128px one. Declared per line
       class in CSS so the number lives next to the size it belongs to,
       and read once here rather than per tween. */
    b._lines.forEach(function (l) {
      var v = getComputedStyle(l).getPropertyValue('--blur-in').trim();
      l._blur = parseFloat(v) || 8;
    });
  });
  /* Steps run 0..LAST. Step 0 is the empty black frame; LAST is the
     handoff. Derived from the markup so adding a line to index.html is
     the only edit needed to lengthen the story. */
  var LAST = phrases.reduce(function (m, b) { return Math.max(m, b._in); }, 0);
  if (LIT === null) LIT = LAST;

  /* ---------------------------------------------------------
     The spoken step

     One step on this page doesn't wait for you. Its lines arrive on a
     timer, the first two leave again, and the answer lands on the
     cleared frame — four beats for one gesture instead of four
     gestures. Derived from the markup: the step is whichever one holds
     a phrase that leaves inside itself, because only a timed step can
     have one.

     It plays ONCE. Scrolling back to screen one and down again lands on
     the state it finished in — an animation you have already watched
     replaying every time you pass it is a page repeating itself, and
     the second viewing is never the one that was designed.
     --------------------------------------------------------- */
  var SEQ_STEP = (function () {
    var s = -1;
    phrases.forEach(function (b) { if (b._off != null) s = b._in; });
    return s;
  })();
  var seqPlayed  = false;
  var seqTl      = null;
  var seqStarted = 0;

  /* A deliberate scroll during the sequence fast-forwards it to its end
     rather than being swallowed — the rule about never trapping the
     reader outranks the rule about not outrunning the story. The grace
     period is the momentum of the gesture that STARTED the sequence:
     without it, one firm flick opens screen two and its own tail
     immediately skips to the end of it. */
  var SKIP_GRACE = 850;

  /* ---------------------------------------------------------
     The lamps

     Screen two's beats that are NOT lines of copy. They live here
     rather than in the markup for the same reason the phrases live in
     the markup: a phrase is a sentence and belongs with the writing, a
     lamp is a piece of staging and belongs with the machine.

     Offsets are seconds into the step, on the same clock as data-at —
     which now covers the whole story, island included, because there is
     only one step left to be on.
     --------------------------------------------------------- */
  var ISLE_OFF = 2.40;   /* the island leaves before the beam arrives */

  var LIGHTS = [
    { at: 2.85, fn: function () { lampY.removeAttribute('data-hold'); lampY.setAttribute('data-hunt', ''); } },
    { at: 5.00, fn: function () { lampY.removeAttribute('data-hunt'); lampY.setAttribute('data-hold', ''); } },
    { at: 5.95, fn: function () { lampA.setAttribute('data-on', ''); } },
    { at: 6.13, fn: function () { lampR.setAttribute('data-on', ''); } }
  ];

  /* One tween description, both directions, so the island cannot drift
     out of sync with itself between the entrance and the exit. */
  function isleTo(on, instant) {
    var to = {
      opacity: on ? 1 : 0,
      ease: EASE_OUT,
      overwrite: 'auto',
      duration: instant ? 0 : (on ? (reduced ? 0.35 : IN_DUR + 0.25) : OUT_DUR)
    };
    if (!reduced) {
      to.scale  = on ? 1 : 1.04;
      to.filter = on ? 'blur(0px)' : 'blur(12px)';
    }
    return to;
  }

  function lampsOff() {
    if (!lampY) return;
    lampY.removeAttribute('data-hunt');
    lampY.removeAttribute('data-hold');
    lampA.removeAttribute('data-on');
    lampR.removeAttribute('data-on');
  }
  function lampsRest() {
    /* Where the sequence ends up: all three on, none of them moving.
       Used when the step is settled into rather than played. */
    if (!lampY) return;
    lampY.removeAttribute('data-hunt');
    lampY.setAttribute('data-hold', '');
    lampA.setAttribute('data-on', '');
    lampR.setAttribute('data-on', '');
  }

  function seqLive() { return !!(seqTl && seqTl.isActive()); }
  function seqSkip() {
    if (!seqLive()) return;
    if (performance.now() - seqStarted < SKIP_GRACE) return;
    seqTl.progress(1);
  }

  function liveAt(b, i) { return i >= b._in && i < b._out; }

  /* The text never changes now — no scrambling means the DOM always
     holds the real sentence, so there is no window during which a
     screen reader would read gibberish and nothing to hide. The only
     exception is anything explicitly marked data-echo. */
  function busy(line, on) {
    if (on) line.setAttribute('data-animating', '');
    else line.removeAttribute('data-animating');
  }

  /* ---------------------------------------------------------
     Rise — the wordmark only.

     The name travels up out of a clipping mask, so it reads as
     arriving from below the frame rather than resolving in place.
     Different from the focus pull on purpose: this is the moment the
     story stops and the site starts, and the change of reveal is what
     marks the boundary. Reusing the focus pull here would make the
     handoff feel like one more line.

     Transform only, so it stays on the GPU. No fade — the mask does
     the concealing, and cross-fading it as well would undercut the
     illusion that the type is a physical thing moving past an edge.
     --------------------------------------------------------- */
  var RISE_DUR = 0.85;
  var RISE_LAG = 0.12;

  function risePhrase(ph, instant) {
    var tl = gsap.timeline();
    tl.set(ph, { visibility: 'visible', opacity: 1 }, 0);

    if (instant || reduced) {
      /* Reduced motion drops the travel and fades instead — a full
         wordmark sweeping up the frame is exactly the kind of large
         positional move the setting exists to remove. */
      tl.fromTo(ph._lines, { yPercent: 0, opacity: 0 },
                           { opacity: 1, duration: instant ? 0 : 0.3 }, 0);
      return tl;
    }

    ph._lines.forEach(function (line, i) {
      tl.fromTo(line,
        { yPercent: 115 },
        { yPercent: 0, duration: RISE_DUR, ease: EASE_OUT, overwrite: 'auto',
          onStart:    function () { busy(line, true); },
          onComplete: function () { busy(line, false); } },
        i * RISE_LAG);
    });
    return tl;
  }

  function enterPhrase(ph, instant) {
    if (ph.dataset.reveal === 'rise') return risePhrase(ph, instant);

    /* visibility flips inside the timeline, not at build time — this
       timeline is scheduled ENTER_AT seconds into the parent. */
    var tl = gsap.timeline();
    tl.set(ph, { visibility: 'visible', opacity: 1 }, 0);

    if (instant) {
      tl.set(ph._lines, { opacity: 1, scale: 1, filter: 'blur(0px)' }, 0);
      return tl;
    }

    ph._lines.forEach(function (line, i) {
      var at = line.classList.contains('line--sub') ? SUB_LAG : i * STAGGER;

      /* Reduced motion keeps the fade and drops the optics. A focus
         pull is movement in the vestibular sense — the frame appears
         to breathe — so blur and scale both go. */
      var from = reduced
        ? { opacity: 0 }
        : { opacity: 0, scale: SCALE_IN, filter: 'blur(' + line._blur + 'px)' };
      var to = reduced
        ? { opacity: 1, duration: 0.3 }
        : { opacity: 1, scale: 1, filter: 'blur(0px)', duration: IN_DUR };

      to.ease = EASE_OUT;
      to.overwrite = 'auto';
      to.onStart = function () { busy(line, true); };
      to.onComplete = function () { busy(line, false); };

      tl.fromTo(line, from, to, at);
    });

    return tl;
  }

  function exitPhrase(ph, instant) {
    var tl = gsap.timeline({
      onComplete: function () {
        gsap.set(ph, { visibility: 'hidden' });
        ph._lines.forEach(function (l) { busy(l, false); });
      }
    });

    if (instant) { tl.set(ph, { opacity: 0 }); return tl; }

    /* The wordmark leaves the way it came: back down behind the mask. */
    if (ph.dataset.reveal === 'rise') {
      if (reduced) { tl.to(ph._lines, { opacity: 0, duration: 0.25 }, 0); return tl; }
      tl.to(ph._lines, { yPercent: 115, duration: OUT_DUR, ease: EASE_OUT, overwrite: 'auto' }, 0);
      return tl;
    }

    /* The exit mirrors the entrance at half the duration — the line
       goes back out of focus the way it came in, so the return trip
       reads as the thought receding rather than a light switching off.
       ease-out in both directions: ease-in on the exit would delay the
       first frame of movement, which is the frame the eye is on. */
    ph._lines.forEach(function (line) {
      busy(line, true);
      var to = reduced
        ? { opacity: 0, duration: 0.25 }
        : {
            opacity: 0,
            scale: SCALE_OUT,
            filter: 'blur(' + (line._blur * 0.7).toFixed(1) + 'px)',
            duration: OUT_DUR
          };
      to.ease = EASE_OUT;
      to.overwrite = 'auto';
      tl.to(line, to, 0);
    });

    return tl;
  }

  /* ---------------------------------------------------------
     Chrome — born on the last step, not present from the first frame.
     WAAPI, not a JS tween: predetermined motion, firing at the
     busiest moment on the page, so it belongs off the main thread.
     --------------------------------------------------------- */
  /* ---------------------------------------------------------
     The step ledger

     One dot per line, down the right edge, the current one filled. A
     gated scroll takes the page away from you; without something saying
     how much of it is left, the honest reading of a held frame is that
     you have reached the end of the site.

     It replaced a chevron. The chevron said "there is more", which is
     half the answer — the question people actually have is how long the
     thing intends to hold them, and six dots answer both at once.

     IT COUNTS SENTENCES, NOT GESTURES. Steps 2 and 3 are two halves of
     one thought held apart across the frame, and giving them a dot each
     told you the story was longer than it is — and implied the two were
     separate ideas, which is the opposite of what the diagonal is for.
     A phrase carrying `data-continues` still costs a scroll and still
     gets its own reveal; it just shares the dot the step before it lit.

     Both the dot count and the mapping are read out of the markup, so
     adding a phrase to index.html — or deciding two of them are one
     sentence — stays a single edit to that file.

     Three conditions, and each is about not saying the same thing twice:

       - not at step 0. The scroll cue owns that frame and already has an
         arrow on it. The ledger takes over from step 1, where there is a
         line to be one-of-six of.

       - not while the cue is still up, even at step 1 — the cue leaves
         on the same gesture that brings the first line, so the ledger
         waits out its fade rather than crossing it.

       - not once the files have landed. There is nothing below them but
         the footer, the chrome's progress rule is on screen by then, and
         a story counter over the work is counting the wrong thing.
     --------------------------------------------------------- */
  var cueGone = false;
  var deskOn  = false;
  var dots    = [];

  /* stepDot[i] is the dot that step i lights. Steps 1..LAST only — step
     0 is the empty black frame and has no line to count, so it maps to
     nothing and lights nothing. */
  var stepDot = (function () {
    var cont = {};
    phrases.forEach(function (b) {
      if (b.hasAttribute('data-continues')) cont[b._in] = true;
    });
    var map = [], d = -1;
    for (var i = 1; i <= LAST; i++) {
      if (!cont[i]) d++;
      map[i] = d;
    }
    return map;
  })();

  if (steps) {
    var n = stepDot[LAST] + 1;
    for (var s = 0; s < n; s++) steps.appendChild(document.createElement('i'));
    dots = Array.prototype.slice.call(steps.children);
  }

  function refreshSteps() {
    if (!steps) return;
    /* Suppressed at one dot. The ledger exists to answer "how long does
       this mean to hold me", and one-of-one answers nothing the scroll
       cue has not already said. It comes back the moment the story is
       more than one gesture long, because the count is derived. */
    if (dots.length > 1 && cueGone && !deskOn && active >= 1) steps.setAttribute('data-show', '');
    else steps.removeAttribute('data-show');
    var lit = stepDot[active];
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('is-on', i === lit);
    }
  }

  /* ---------------------------------------------------------
     The correction on screen one

     "man" is struck through and "Designer" written under it. Both are
     CSS transitions on one attribute rather than tweens: they are
     predetermined, they fire once, and the second is a handwriting face
     arriving late on purpose. The timeline only says when.
     --------------------------------------------------------- */
  var cutPh  = document.querySelector('.phrase[data-cut]');
  var CUT_AT = 0.62;   /* after the line has resolved, not under it */

  function setCut(on) {
    if (!cutPh) return;
    if (on) cutPh.setAttribute('data-cut-on', '');
    else cutPh.removeAttribute('data-cut-on');
  }

  var chromeShown = false;

  function showChrome(instant, delaySec) {
    if (chromeShown) return;
    chromeShown = true;
    chrome.style.visibility = 'visible';
    chrome.style.opacity = '1';

    if (instant || reduced || !mark.animate) {
      mark.style.opacity = '1'; nav.style.opacity = '1';
      return;
    }
    /* Waits for the landing like everything else — the chrome must not
       arrive while the page is still travelling. */
    var d = Math.round((delaySec || 0) * 1000);

    mark.animate([
      { opacity: 0, transform: 'translate(2vw, 6vh) scale(1.6)', filter: 'blur(2px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' }
    ], { duration: 560, delay: d, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' });

    nav.animate([
      { opacity: 0, transform: 'translateY(-4px)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 280, delay: d + 140, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'both' });
  }

  function hideChrome() {
    if (!chromeShown) return;
    chromeShown = false;
    chrome.style.opacity = '0';
    chrome.style.visibility = 'hidden';
  }

  /* ---------------------------------------------------------
     Scroll allocation
     --------------------------------------------------------- */
  /* One weight per transition, 0→1 … 5→6, plus the tail.
     The 1.3 sits on 3→4: the hold after "a person…" and before
     "Marooned." The pause is the setup for the word.

     THE LAST ENTRY IS NOT A STEP. It's pinned scroll with no phrase
     attached to it, sitting after the wordmark has landed — LAST is
     derived from the markup and stays at 6, so the step machine never
     tries to go there. What it buys is the only stretch of the hero
     where scrolling is ungated: `step()` refuses to advance past LAST,
     the wheel handler hands the gesture back to the page, and you
     scroll freely through a hero that is still pinned.

     That ungated stretch is what the dissolve is scrubbed against. It
     has to be free scrolling, because a crossfade tied to a gated step
     would snap between two states instead of passing through them.

     It's also where the Work section lives, which is why 1.9 screens
     rather than 1. The budget: one screen of dissolve, a quarter screen
     before the files land, and the remaining ~0.65 as dwell — the
     desktop simply held on screen, hoverable.

     Dwell is load-bearing and it is also the thing to keep short.
     Hovering a folder while the frame under it is still resolving is
     unusable, so there has to be somewhere to stand afterwards — but
     every notch of dwell is a scroll that changes nothing on screen,
     and the rest of this page has trained you that one gesture moves
     the story on. 2.2 screens felt like the page had stopped
     responding. 1.9 gives about five wheel notches of standing room,
     which is enough to notice the files and reach for one. */
  var TAIL = 3.3;
  /* 0->1, then the tail. One entry, because there is one gesture: the
     loader hands over to the story and the story runs itself. */
  var GAPS = [1, TAIL];

  /* The tail is longer than it was, because it now carries a step that
     used to be a step. The blackout used to lift on beat 5, one pull
     like everything else. There is no beat 5 any more, so the reveal
     moved into the scrub: you scroll, and the black comes off the
     picture in your hand rather than between two held frames.

     Four things across it, in order, each a fraction of the tail so
     retuning the dwell doesn't silently retune the rest:

       0.00 - 0.62   the blackout lifts, the story text goes with it
       0.40 - 1.40   the name, on the footage, with its rule
       1.30 - 2.35   the plate dissolves to the halftone
       2.60          the files land on it
       2.60 - 3.30   dwell - the desktop simply held there, hoverable

     The name overlaps the lift on purpose. It has to arrive WITH the
     picture rather than onto a picture that is already there: waiting
     for the black to finish coming off made it read as a caption being
     added to a photograph.

     Dwell is load-bearing and it is also the thing to keep short.
     Hovering a folder while the frame under it is still resolving is
     unusable, so there has to be somewhere to stand afterwards - but
     every notch of dwell is a scroll that changes nothing on screen. */
  var LIFT_END  = 0.62 / TAIL;
  var NAME_IN   = 0.40 / TAIL;   /* arrives as the black comes off, not after it */
  var NAME_OUT  = 1.40 / TAIL;   /* leaves as the halftone starts */
  var DIS_START = 1.30 / TAIL;
  var DISSOLVE_END = 2.35 / TAIL;
  var DESK_AT      = 2.60 / TAIL;
  var TOTAL = GAPS.reduce(function (a, b) { return a + b; }, 0);
  var STOPS = (function () {
    var pts = [0], run = 0;
    GAPS.forEach(function (g) { run += g; pts.push(run / TOTAL); });
    return pts;   // 7 stops, one per step
  })();

  /* ---------------------------------------------------------
     Step state
       - applyStep() does the DOM work, returns its timeline
       - the early-return on a repeat index is load-bearing: without
         it ScrollTrigger's onUpdate rebuilds the timeline every frame
       - a jump of more than one step hard-sets rather than playing
         catch-up (only reachable by dragging the scrollbar now)
     --------------------------------------------------------- */
  var active = -1;

  /* enterAt: when the incoming line starts, relative to the step.
     Exits always run at 0 — outgoing lines defocus while the page
     travels, so you land on an empty frame rather than on stale text. */
  function applyStep(i, enterAt) {
    if (i === active) return null;

    var jumped = active !== -1 && Math.abs(i - active) > 1;
    var at = (jumped || reduced) ? 0 : (enterAt || 0);
    var tl = gsap.timeline();
    var entering = null;

    /* Three ways to arrive at a step, and only the first one performs:
         first visit          the timed beats play
         come back to it      settle - hard-set to the state it ended in
         jumped / reduced     hard-set, same as it always did
       `flat` is all three collapsed: no offsets, no within-step exits,
       just the resting frame. */
    var isSeq  = (i === SEQ_STEP);
    var settle = isSeq && seqPlayed;
    if (isSeq) seqPlayed = true;
    var flat = jumped || reduced || settle;

    /* Reveal runs at position 0 - it belongs to the travel, and it has
       resolved by the time the line starts. */
    var lvl = REVEAL[i] != null ? REVEAL[i] : 0;
    if (jumped) {
      gsap.set(blackout, { opacity: lvl });
    } else {
      /* Still fades under reduced-motion, just faster. Reduced motion
         means less movement, not no transitions - an opacity change
         isn't vestibular, and a full-screen black rectangle snapping
         on and off is far more jarring than a fade. */
      tl.to(blackout, {
        opacity: lvl,
        duration: reduced ? 0.25 : (at > 0 ? at : 0.3),
        ease: EASE_OUT,
        overwrite: 'auto'
      }, 0);
    }

    phrases.forEach(function (b) {
      var live = liveAt(b, i);
      /* A phrase that leaves inside its own step is not part of that
         step's RESTING state. So when the sequence isn't playing -
         settled, jumped, reduced - those lines never appear at all,
         and what you get is the frame the sequence ends on. */
      var show = live && !(flat && b._off != null);

      if (show !== b._shown) {
        b._shown = show;
        var sub = show ? enterPhrase(b, flat) : exitPhrase(b, jumped || settle);
        /* The FIRST line in, not the last: the lock is released by
           whichever line the reader is about to read. A step whose
           later beats are seconds away must not hold the page for all
           of them - the sequence keeps playing after the lock lifts,
           and a scroll into it skips to the end. */
        if (show && !entering) entering = sub;
        tl.add(sub, show ? (flat ? at : at + b._at) : 0);
        return;
      }

      /* Still on screen, but no longer the line being spoken. It settles
         back so the newest phrase owns the frame - the earlier fragment
         is still there and still legible (0.55 on black is ~6:1), it has
         just stopped being the thing you're reading. */
      if (!show) return;
      var faded = b._in < i;
      if (faded === b._faded) return;
      b._faded = faded;
      tl.to(b, {
        opacity: faded ? 0.55 : 1,
        duration: (jumped || settle) ? 0 : 0.4,
        ease: EASE_OUT,
        overwrite: 'auto'
      }, at);
    });

    /* The within-step exits. Screen two clears its own diagonal before
       the answer arrives, so the payoff lands on an empty frame instead
       of underneath the question. */
    if (!flat) {
      phrases.forEach(function (b) {
        if (!liveAt(b, i) || b._off == null || !b._shown) return;
        var ex = exitPhrase(b);
        ex.eventCallback('onStart', function () { b._shown = false; });
        tl.add(ex, at + b._off);
      });
    }

    /* The lamps. Same clock as the phrases, so retiming one beat can't
       silently desynchronise the light from the line it is lighting.
       On a settle or a jump they hard-set to the state the sequence
       ends in — the copy does the same thing two blocks up. */
    if (lampY) {
      if (!isSeq) { tl.call(lampsOff, null, 0); }
      else if (flat) { tl.call(lampsRest, null, at); }
      else {
        tl.call(lampsOff, null, 0);
        LIGHTS.forEach(function (L) { tl.call(L.fn, null, at + L.at); });
      }
    }

    /* The strike through "man" and the word written under it. CSS owns
       both - they are two transitions on one attribute - so the timeline
       only has to say when. Late enough that the line has resolved
       first: the sentence is read, and then it is corrected. */
    if (cutPh) {
      if (liveAt(cutPh, i) && !flat) {
        tl.call(setCut, [true], at + CUT_AT);
        tl.call(setCut, [false], at + ISLE_OFF + OUT_DUR);   /* off with the line it belongs to */
      } else {
        tl.call(setCut, [false], 0);
      }
    }

    /* The island. It used to own a step; now it owns the first two and
       a half seconds of the only one, and it LEAVES inside that step so
       the beam has an empty frame to search. Same optical language as
       the type either way — it racks into focus rather than fading up,
       because it is the first thing the page shows.

       On a settle or a jump it is simply not there: the resting state
       of this step is the Venn, and the island is four beats before
       that. Same rule the phrases with a data-off follow. */
    if (isle) {
      var showIsle = (i === SEQ_STEP) && !flat;
      if (showIsle) {
        tl.to(isle, isleTo(true), at);
        tl.to(isle, isleTo(false), at + ISLE_OFF);
      } else {
        tl.to(isle, isleTo(false, jumped || flat), 0);
      }

      /* The plate is a five-second loop and it is only looked at for
         the first beats of the run. Decoding it under the lights, the
         reveal or the desktop is heat for nothing. Reduced motion never
         starts it, which leaves the poster — the sequence survives as
         a still. */
      if (isleClip && !reduced) {
        if (showIsle) {
          var pl = isleClip.play(); if (pl && pl.catch) pl.catch(function () {});
          tl.call(function () { if (!isleClip.paused) isleClip.pause(); }, null, at + ISLE_OFF);
        } else if (!isleClip.paused) { isleClip.pause(); }
      }
    }

    /* The chrome is NOT born on a step any more. It used to arrive with
       the wordmark, which was the moment the story stopped and the site
       started; there is no wordmark now, and the equivalent moment is
       the black coming off the picture in the tail. Both screens are
       black frames with type on them and a nav bar over either one is
       furniture on a title card. See applyDissolve. */
    hideChrome();

    pumpVideo(i);

    active = i;
    refreshSteps();

    /* The spoken step hands back the WHOLE timeline, not the first line
       in it - the lock is meant to last as long as the sequence, and
       seqTl is what a scroll during it fast-forwards. */
    if (isSeq && !flat) {
      seqTl = tl;
      seqStarted = performance.now();
      return tl;
    }
    seqTl = null;
    return entering || tl;
  }

  /* The video sits behind an opaque black layer for four of the six
     steps. Decoding 1920x1080 that nobody can see is pure heat, so it
     runs only while it's about to matter.

     Resumed one step EARLY (LIT - 1), not on arrival — starting a
     paused video takes a moment, and the one frame this page cannot
     afford to stutter on is the one where the island appears. */
  function pumpVideo(i) {
    if (reduced) return;

    /* The dither is preload="none" and it is 1.5 MB. Asking for it at
       the moment the dissolve starts means the first second of the
       crossfade is a fade to the poster on a fast connection and a fade
       to nothing on a slow one. Requested at the island reveal instead —
       two gestures of lead time, and nothing before that point pays for
       a byte of it. */
    if (dither && i >= LIT && dither.preload === 'none') {
      dither.preload = 'auto';
      dither.load();
    }

    if (!video) return;
    /* LIT is the last step now, so LIT - 1 is the loader — and the
       loader is a black frame that can sit there for a while. Clamped
       so the decode still starts a step early wherever there is a step
       to be early in, and never on the first frame of the site. */
    var want = i >= Math.max(1, LIT - 1);
    if (want && video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    else if (!want && !video.paused) video.pause();
  }

  /* ---------------------------------------------------------
     Pin. No snap — input gating below owns step advancement.
     --------------------------------------------------------- */
  var st = ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: function () { return '+=' + (window.innerHeight * TOTAL); },
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    scrub: false,
    onUpdate: function (self) {
      /* Only a scrollbar drag reaches this while unlocked — wheel, touch
         and keys are intercepted. Guarded so it can't fight the glide. */
      if (locked) return;
      applyStep(nearestStop(self.progress));
    }
  });

  /* Clamped to LAST. STOPS has one more entry than there are steps now
     (the tail), and without the clamp a scrollbar drag into the tail
     resolved to step 7 — which the phrase logic reads as "the wordmark
     is no longer the newest line" and dims it to 0.55. The tail is not
     a step. Nothing in the step machine should be able to land in it. */
  function nearestStop(p) {
    var best = 0, dist = Infinity;
    for (var i = 0; i <= LAST; i++) {
      var d = Math.abs(STOPS[i] - p);
      if (d < dist) { dist = d; best = i; }
    }
    return best;
  }

  function scrollForBeat(i) { return st.start + STOPS[i] * (st.end - st.start); }
  function inPin() {
    var y = window.scrollY || window.pageYOffset;
    return y >= st.start - 1 && y <= st.end + 1;
  }

  /* ---------------------------------------------------------
     The dissolve, and the desktop

     Four things happen across the pinned tail, and they are one idea:

       1. the atmosphere lifts — scrim, vignette and grain go to zero
       2. the plate dissolves from the warm ASCII pass to the halftone
       3. the story text leaves, so you're handed a clean frame
       4. the files pop in on it

     What's left after (1)–(3) is the raw halftone, no treatment on top —
     and that is the Work section. Not a picture of the Work section, not
     a transition into one: the same plate, with the files arriving on it.
     There was a version with a second copy of the clip in its own
     section below the hero, and the fault was obvious the moment it ran.
     You scrolled through a full screen of the halftone to arrive at
     another full screen of the halftone. The transition did all the work
     and was then repeated.

     Written imperatively in onUpdate rather than scrubbed with tweens.
     These are four opacity writes against one scroll position; a tween
     per property would be four timelines to keep in sync for no gain.
     --------------------------------------------------------- */
  var stage    = document.querySelector('.hero__stage');
  var scrim    = document.querySelector('.hero__scrim');
  var vignette = document.querySelector('.hero__vignette');
  var grain    = document.querySelector('.hero__grain');

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function playSafe(v)  { if (v && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
  function pauseSafe(v) { if (v && !v.paused) v.pause(); }

  var ditherLive = false;

  var nameOn = false;
  function setName(on) {
    on = !!on;
    if (on === nameOn || !hero) return;
    nameOn = on;
    if (on) hero.setAttribute('data-name', '');
    else hero.removeAttribute('data-name');
  }

  /* One attribute, and CSS owns everything that follows from it — the
     pop, the stagger, and whether the folders are clickable at all. */
  function setDesk(on) {
    on = !!on;
    if (on === deskOn) return;      // called every scroll frame; don't thrash
    deskOn = on;
    if (hero) {
      if (on) hero.setAttribute('data-desk', '');
      else hero.removeAttribute('data-desk');
    }
    refreshSteps();
  }

  function applyDissolve(tp) {
    tp = clamp01(tp);

    /* Two moves, one after the other, neither occupying the whole tail.
       The lift comes off first and the dissolve follows it - the real
       island has to be on screen as a photograph for a moment before
       the machine's version of it arrives, or the two just cross-fade
       into each other and the middle state is never seen. */
    var lift = clamp01(tp / LIFT_END);
    var p = clamp01((tp - DIS_START) / (DISSOLVE_END - DIS_START));

    /* The blackout is the whole first half of the page, so this is the
       page's one reveal and it belongs to the scroll rather than to a
       step. The type leaves slightly ahead of it (x1.35): the frame
       should be opening onto a picture, not onto the last line of the
       story sitting over one. */
    if (blackout) blackout.style.opacity = 1 - lift;
    if (isle) isle.style.opacity = 0;
    if (isleClip && !isleClip.paused) isleClip.pause();

    /* The lights leave with the type, on the same curve — three
       coloured lamps still burning over a photograph is a much muddier
       picture than the one this is meant to be.

       SCRUBBED, not switched. Turning them off with lampsOff() here
       looked identical and was wrong: the glide back into the story
       passes through the top of the tail, so the switch fired a frame
       after the step machine had just turned them on, and coming back
       through the gate under reduced motion — where the sequence
       hard-sets rather than playing — left the Venn with no lights in
       it. A scrubbed opacity reverses cleanly because it is a function
       of position rather than an event. */
    if (lamps) lamps.style.opacity = 1 - clamp01(lift * 1.35);

    /* The name is scrubbed, not stepped: two attribute writes, guarded
       so this can run every scroll frame without thrashing. */
    setName(tp >= NAME_IN && tp < NAME_OUT);
    if (stage) stage.style.opacity = 1 - clamp01(lift * 1.35);

    /* The nav arrives with the frame it sits on, not before it. Both
       calls guard internally, so this can be written every scroll
       frame without thrashing. */
    if (lift > 0.85) showChrome(false, 0); else hideChrome();

    dither.style.opacity = p;
    if (ditherwash) ditherwash.style.opacity = p;

    /* Atmosphere rides the same travel. The halftone is its own grade —
       a scrim and a vignette on top of it are the previous shot's
       lighting left switched on. */
    var t = 1 - p;
    if (scrim)    scrim.style.opacity = t;
    if (vignette) vignette.style.opacity = t;
    if (grain)    grain.style.opacity = 0.025 * t;

    /* The files land a quarter of a screen after the frame has finished
       turning. Not on the same beat: two things resolving at once is one
       event, and the desktop appearing is supposed to be its own. */
    setDesk(tp >= DESK_AT);

    /* Decode only what's being looked at. The warm pass is worth nothing
       once it's fully covered; the halftone is worth nothing before it
       has begun.

       Under reduced motion nothing plays at all — the dither element is
       still in the layout and still cross-faded, it just never leaves
       its poster frame. Which is the whole trick: the sequence survives
       intact as two photographs. */
    if (reduced) return;
    if (p > 0.01) { if (!ditherLive) { ditherLive = true; playSafe(dither); } }
    else if (ditherLive) { ditherLive = false; pauseSafe(dither); }
    if (p >= 0.995) pauseSafe(video); else playSafe(video);
  }

  if (dither) {
    /* onUpdate alone is not enough. It fires while the trigger is
       ACTIVE, so a fast flick — or a jump straight past the range from
       a restored scroll position — can leave the last observed progress
       stale and the dissolve permanently half-finished. Every toggle
       callback re-applies too.

       All five read self.progress rather than assuming an extreme.
       Hard-coding onEnter to 0 looked obviously right and was wrong:
       entering the range from a jump lands you in the MIDDLE of it, and
       the trigger would helpfully reset everything to the start. */
    ScrollTrigger.create({
      trigger: '.hero',
      start: function () { return scrollForBeat(LAST); },
      end:   function () { return st.end; },
      invalidateOnRefresh: true,
      onUpdate:    function (self) { applyDissolve(self.progress); },
      onEnter:     function (self) { applyDissolve(self.progress); },
      onEnterBack: function (self) { applyDissolve(self.progress); },
      onLeave:     function (self) { applyDissolve(self.progress); },
      onLeaveBack: function (self) { applyDissolve(self.progress); }
    });
  }

  /* The folders are inside the pinned hero and invisible for most of the
     page's life, so a keyboard user tabbing in from the skip link lands
     on something they cannot see. Rather than pull them out of the tab
     order — which would make the site's actual content unreachable
     without a mouse and a scroll wheel — focus JUMPS the page to the
     point where the desktop exists.

     Instant, not glided. This is a focus correction, not a transition;
     animating the scroll under someone who just pressed Tab is the kind
     of helpfulness that loses people. */
  /* ---------------------------------------------------------
     The About window

     Eighteen poses on a 6x3 sheet, stepped by background-position. No
     timer, no autoplay: the sprite moves because you're reading, not on
     its own — an avatar cycling by itself would be the third piece of
     ambient motion this page has refused, and it would be doing it
     right next to six things you're meant to be reading.

     Hover or focus on a fact MOVES the sprite; the caption above the
     stage names the pose for anyone who lands on a fact without having
     read the ones before it. A click PINS the pose, so moving the mouse
     off the list doesn't reset it — the second click un-pins. Leaving
     the whole list settles back to the pin if there is one, idle if
     there isn't.
     --------------------------------------------------------- */
  var FRAMES = ['idle', 'walk-1', 'back', 'walk-2', 'walk-3', 'desk',
    'mug', 'think', 'laptop-floor', 'walk-phone', 'backpack', 'headphones',
    'clipboard', 'cheer', 'sit-ground', 'crouch', 'stance', 'cast'];

  var about      = document.getElementById('about');
  var aboutBar   = document.getElementById('about-bar');
  var aboutSprite = document.getElementById('about-sprite');
  var aboutCap   = document.getElementById('about-cap');
  var aboutFacts = about ? [].slice.call(about.querySelectorAll('.about__fact')) : [];
  var aboutMin   = document.getElementById('about-min');
  var aboutClose = document.getElementById('about-close');
  var aboutReopen = document.getElementById('about-reopen');

  var poseName = 'idle', pinnedFact = null;

  function setAboutPose(name, hop) {
    if (name === poseName || !aboutSprite) return;
    poseName = name;
    var i = FRAMES.indexOf(name); if (i < 0) i = 0;
    aboutSprite.style.setProperty('--about-col', i % 6);
    aboutSprite.style.setProperty('--about-row', Math.floor(i / 6));
    if (aboutCap) aboutCap.textContent = name.replace(/-/g, ' ');
    if (hop === false || reduced) return;
    aboutSprite.classList.remove('is-hop');
    void aboutSprite.offsetWidth;   /* restart the animation */
    aboutSprite.classList.add('is-hop');
  }

  if (about && aboutSprite) {
    setAboutPose('idle', false);

    aboutFacts.forEach(function (f) {
      f.addEventListener('mouseenter', function () { setAboutPose(f.dataset.pose); });
      f.addEventListener('focus', function () { setAboutPose(f.dataset.pose); });
      f.addEventListener('click', function () {
        pinnedFact = (pinnedFact === f) ? null : f;
        aboutFacts.forEach(function (o) { o.setAttribute('aria-current', o === pinnedFact ? 'true' : 'false'); });
        setAboutPose(f.dataset.pose);
      });
    });
    var factsList = document.getElementById('about-facts');
    if (factsList) {
      factsList.addEventListener('mouseleave', function () {
        setAboutPose(pinnedFact ? pinnedFact.dataset.pose : 'idle');
      });
    }

    /* ---------------------------------------------------------
       Close, and the way back in

       Minimise and close do the same thing — there is nothing here for
       them to do differently. The window fades and scales down, then
       leaves the layout entirely so `.about__reopen` can take its cell;
       reopening puts it back at rest, not mid-transition. */
    function closeAbout() {
      about.classList.add('is-closing');
      setTimeout(function () {
        about.hidden = true;
        about.classList.remove('is-closing');
        /* Back to its grid cell, not wherever it was dragged to — a
           reopened window starting at rest is the same courtesy a
           freshly-arrived one gets. */
        about.style.position = about.style.left = about.style.top = '';
        if (aboutReopen) {
          aboutReopen.hidden = false;
          requestAnimationFrame(function () { aboutReopen.classList.add('is-in'); });
        }
      }, reduced ? 0 : 200);
    }
    if (aboutMin) aboutMin.addEventListener('click', closeAbout);
    if (aboutClose) aboutClose.addEventListener('click', closeAbout);
    if (aboutReopen) {
      aboutReopen.addEventListener('click', function () {
        aboutReopen.classList.remove('is-in');
        aboutReopen.hidden = true;
        about.hidden = false;
      });
    }

    /* ---------------------------------------------------------
       Dragging the window by its bar

       Clamped to the desktop it's sitting on (`.work`), not to the
       viewport — the window can't be dragged out from under the folders
       it shares the plate with. Skipped on touch/narrow layouts, where
       `.about` isn't positioned for it (see the mobile rules in
       main.css) and a drag would fight the page's own scroll. */
    var aboutDrag = null;
    if (aboutBar) {
      aboutBar.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        if (window.matchMedia('(max-width: 820px)').matches) return;
        var r = about.getBoundingClientRect(), d = work.getBoundingClientRect();
        aboutDrag = { x: e.clientX, y: e.clientY, l: r.left - d.left, t: r.top - d.top,
          dw: d.width, dh: d.height, ww: r.width, wh: r.height };
        about.style.position = 'absolute';
        about.style.left = aboutDrag.l + 'px';
        about.style.top = aboutDrag.t + 'px';
        aboutBar.classList.add('is-dragging');
        aboutBar.setPointerCapture(e.pointerId);
      });
      aboutBar.addEventListener('pointermove', function (e) {
        if (!aboutDrag) return;
        var l = Math.max(0, Math.min(aboutDrag.dw - aboutDrag.ww, aboutDrag.l + e.clientX - aboutDrag.x));
        var t = Math.max(0, Math.min(aboutDrag.dh - aboutDrag.wh, aboutDrag.t + e.clientY - aboutDrag.y));
        about.style.left = l + 'px';
        about.style.top = t + 'px';
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) {
        aboutBar.addEventListener(ev, function () { aboutDrag = null; aboutBar.classList.remove('is-dragging'); });
      });
    }
  }

  function scrollForTail(f) {
    var from = scrollForBeat(LAST);
    return from + clamp01(f) * (st.end - from);
  }

  if (work && hero) {
    work.addEventListener('focusin', function () {
      if (hero.hasAttribute('data-desk')) return;
      window.scrollTo(0, Math.round(scrollForTail(DESK_AT)) + 2);
      ScrollTrigger.update();
    });
  }

  /* ---------------------------------------------------------
     The way back

     Above the tail the page scrolls freely; below it the story is
     gated. Crossing that line upward drops you into a five-second
     animation you have already watched, and on a trackpad it is very
     easy to do without meaning to. So the crossing asks first.

     The first upward gesture at the boundary is spent on the question
     and nothing moves. The second one goes — and going resets
     seqPlayed, because the whole point of coming back is to watch it,
     and the play-once rule would otherwise hand you its last frame.

     Disarms on any downward input and on its own after GATE_HOLD, so
     nobody returns to the tab much later and falls straight through a
     question they have forgotten answering.
     --------------------------------------------------------- */
  var GATE_HOLD  = 7000;
  /* The momentum of the gesture that armed it. Without this, one firm
     flick upward arms the gate on its first event and walks straight
     through it on its second — which is precisely the accident the gate
     exists to prevent. Same problem, same shape of fix, as SKIP_GRACE. */
  var GATE_GRACE = 650;
  var gateArmed  = false;
  var gateArmedAt = 0;
  var gateTimer  = null;

  function armGate() {
    gateArmed = true;
    gateArmedAt = performance.now();
    if (hero) hero.setAttribute('data-gate', '');
    clearTimeout(gateTimer);
    gateTimer = setTimeout(disarmGate, GATE_HOLD);
  }
  function disarmGate() {
    if (!gateArmed) return;
    gateArmed = false;
    clearTimeout(gateTimer);
    if (hero) hero.removeAttribute('data-gate');
  }

  /* True when this gesture was spent on the question rather than on
     moving. Called first by every input handler. */
  /* The tail is not a step, and going UP through it should be as free
     as going down through it was. It never was: with active pinned at
     LAST, an upward gesture anywhere in the tail resolved to `next =
     LAST - 1`, which is in range, so the step machine grabbed it and
     glided the page from the desktop back to screen one in one jump.
     Nothing above the boundary should be gated in either direction. */
  function freeUp(dir) {
    if (dir >= 0 || active < LAST) return false;
    var y = window.scrollY || window.pageYOffset;
    return y > scrollForBeat(LAST) + 6;
  }

  function gateHolds(dir, mag) {
    if (dir >= 0) { disarmGate(); return false; }
    if (!inPin() || active < LAST) { disarmGate(); return false; }

    /* The zone has to be wider than the boundary itself. Scrolling is
       native through the tail, so a single wheel event can start above
       the line and finish below it — check the position AFTER this
       gesture would land, not the one it started from. Capped at most
       of a screen so ordinary scrolling around the desktop is never
       inside it. */
    var reach = Math.min(Math.max(160, (mag || 0) * 2), window.innerHeight * 0.9);
    var y = window.scrollY || window.pageYOffset;
    if (y > scrollForBeat(LAST) + reach) return false;   /* still well inside the tail */

    if (!gateArmed) { armGate(); return true; }
    if (performance.now() - gateArmedAt < GATE_GRACE) return true;   /* same gesture, still arriving */

    disarmGate();
    replaySeq();   /* the point of coming back is to watch it, not to be handed its last frame */
    return true;
  }

  /* ---------------------------------------------------------
     The lock

     Held from the moment a step starts until the line has finished
     resolving, then released after a short quiet period.

     THE QUIET PERIOD MUST BE CAPPED. The first version waited for
     QUIET ms of silence with no upper bound, and every input event
     refreshed the timer — so a user scrolling continuously could hold
     the lock open forever. Which is precisely what people do when a
     page stops responding: they scroll harder. The page got stickier
     the more you fought it. QUIET_CAP guarantees release.

     Momentum is handled where it actually lives instead: a trackpad
     flick produces wheel events whose |deltaY| decays toward zero, so
     the tail is filtered by shape rather than by waiting it out.
     --------------------------------------------------------- */
  var locked = false;
  var lastInput = 0;
  var quietTimer = null;

  function unlock() {
    locked = false;
    clearTimeout(quietTimer);
  }

  function tryUnlock() {
    var settledAt = performance.now();
    clearTimeout(quietTimer);
    (function check() {
      var now = performance.now();
      if (now - lastInput >= QUIET || now - settledAt >= QUIET_CAP) return unlock();
      quietTimer = setTimeout(check, 40);
    })();
  }

  function goToBeat(i) {
    locked = true;
    clearTimeout(quietTimer);

    /* Glide the page to the beat's scroll position. Proxy object rather
       than ScrollToPlugin — one less script for one property. */
    var proxy = { y: window.scrollY || window.pageYOffset };
    gsap.to(proxy, {
      y: scrollForBeat(i),
      duration: reduced ? 0.15 : GLIDE,
      ease: EASE_MOVE,
      overwrite: true,
      onUpdate: function () { window.scrollTo(0, proxy.y); }
    });

    /* Old line dissolves during the travel; new line waits for the
       landing. The scroll delivers you, then the line speaks. */
    var tl = applyStep(i, ENTER_AT);
    if (tl) tl.eventCallback('onComplete', tryUnlock);
    else tryUnlock();
  }

  /* Input during the lock is DISCARDED, not queued.

     It used to be queued — one banked step, fired the instant the lock
     lifted, on the reasoning that swallowing a deliberate gesture is
     what makes gated scroll feel broken. That reasoning was wrong about
     which gesture it was catching. What actually arrives during the
     lock is the tail of the flick you already spent, so the queue turned
     one gesture into two lines: the line you asked for, and then a
     second one arriving on its own about 400ms later, while you were
     still reading the first. An automatic scroll that eats the reading
     time is a worse failure than a dropped input, and the input isn't
     really dropped — the gesture that would have been queued is the same
     gesture that already advanced you.

     A line now holds until you deliberately scroll again. */
  /* Coming back through the gate has to REPLAY, and the step machine
     will not re-enter a step it is already on. So the run is torn down
     to its first frame — every phrase hidden, the lamps out, the cut
     undrawn — and `active` is invalidated so applyStep rebuilds rather
     than early-returning. Anything short of this leaves the last line
     of the Venn on screen while the island fades up underneath it. */
  function replaySeq() {
    phrases.forEach(function (b) {
      if (b._in !== SEQ_STEP) return;
      gsap.set(b, { opacity: 0, visibility: 'hidden' });
      b._lines.forEach(function (l) { busy(l, false); });
      b._shown = false;
      b._faded = false;
    });
    lampsOff();
    setCut(false);
    if (isle) gsap.set(isle, { opacity: 0 });
    seqPlayed = false;
    active = -1;
    goToBeat(SEQ_STEP);
  }

  function step(dir) {
    var next = active + dir;
    if (next < 0 || next > LAST) return false;   // let the page scroll out
    if (locked) return true;                     // swallowed on purpose
    goToBeat(next);
    return true;
  }

  /* ---------------------------------------------------------
     Input. passive:false because we preventDefault inside the pin.
     --------------------------------------------------------- */

  /* Momentum filter — deliberately conservative.

     A flick's tail decays toward zero; a hand still on the pad doesn't.
     But a SLOW deliberate trackpad scroll also produces small deltas,
     so a greedy filter locks slow scrollers out of the page entirely.
     That failure is far worse than the one it prevents, so the
     threshold is set low: only the genuinely tiny, shrinking tail is
     dropped.

     It doesn't need to be perfect any more. It used to be the only thing
     standing between a flick and a banked extra step; now that input
     during the lock is discarded outright, momentum that arrives while a
     line is resolving costs nothing. This filter's remaining job is only
     to stop a decayed tail landing AFTER the lock has lifted and
     advancing a line you didn't ask for. */
  var prevDelta = 0;
  var MOMENTUM_MAX = 10;
  function isMomentumTail(d) {
    var a = Math.abs(d), tail = a < MOMENTUM_MAX && a <= Math.abs(prevDelta);
    prevDelta = d;
    return tail;
  }

  function onWheel(e) {
    if (!inPin()) return;
    var dir = e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0);
    if (!dir) return;
    if (gateHolds(dir, Math.abs(e.deltaY))) { e.preventDefault(); lastInput = performance.now(); return; }
    if (freeUp(dir)) { prevDelta = e.deltaY; return; }   // hand the tail back to the page
    /* Checked BEFORE the hand-back below. The spoken step is the last
       one, so `next > LAST` is true throughout it - and without this
       the page would happily scroll on into the reveal while screen two
       was still halfway through saying its sentence. */
    if (seqLive()) {
      e.preventDefault();
      lastInput = performance.now();
      if (isMomentumTail(e.deltaY)) return;
      if (dir > 0) seqSkip();
      return;
    }
    var next = active + dir;
    if (next < 0 || next > LAST) { prevDelta = e.deltaY; return; }  // hand back to the page
    e.preventDefault();
    if (isMomentumTail(e.deltaY)) return;    // don't let a flick's tail queue a step
    lastInput = performance.now();
    step(dir);
  }

  var touchY = null;
  function onTouchStart(e) { touchY = e.touches[0].clientY; lastInput = performance.now(); }
  function onTouchMove(e) {
    if (!inPin() || touchY === null) return;
    var dy = touchY - e.touches[0].clientY;
    var dir = dy > 0 ? 1 : -1;
    if (Math.abs(dy) >= 45 && gateHolds(dir, Math.abs(dy) * 3)) {
      e.preventDefault();
      touchY = e.touches[0].clientY;
      lastInput = performance.now();
      return;
    }
    if (freeUp(dir)) return;
    if (seqLive()) {
      e.preventDefault();
      if (Math.abs(dy) < 45) return;
      touchY = e.touches[0].clientY;
      lastInput = performance.now();
      if (dir > 0) seqSkip();
      return;
    }
    var next = active + dir;
    if (next < 0 || next > LAST) return;
    e.preventDefault();
    if (Math.abs(dy) < 45) return;               // ignore drift, wait for intent
    touchY = e.touches[0].clientY;
    lastInput = performance.now();
    step(dir);
  }
  function onTouchEnd() { touchY = null; }

  /* Keyboard has to work — the pin must never be a keyboard trap.
     Only bail if focus is inside something that wants the key itself;
     the old check required focus to be exactly on <body>, so after any
     click the arrow keys silently scrolled past the whole sequence. */
  var KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, Spacebar: 1, ArrowUp: -1, PageUp: -1 };
  function onKey(e) {
    if (!inPin()) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var dir = KEYS[e.key];
    if (!dir) return;
    if (gateHolds(dir, window.innerHeight * 0.5)) { e.preventDefault(); lastInput = performance.now(); return; }
    if (freeUp(dir)) return;
    if (seqLive()) {
      e.preventDefault();
      lastInput = performance.now();
      if (dir > 0) seqSkip();
      return;
    }
    var next = active + dir;
    if (next < 0 || next > LAST) return;
    e.preventDefault();
    lastInput = performance.now();
    step(dir);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);

  /* Reading-position rule. Writes transform directly on the element —
     updating a CSS variable on a parent would recalc every child. */
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: function (self) {
      fill.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
    }
  });

  /* ---------------------------------------------------------
     Scroll cue.
     1.4s, not the 2.5s this originally held. That hold was there to let
     the landscape land — but beat 0 is now near-black, so there is no
     landscape to admire yet and the wait just reads as a page that
     failed to load. Black with nothing on it burns its welcome fast.
     --------------------------------------------------------- */
  /* 600ms. Short, because the cue is now carrying the digit grid and
     that grid is the only thing keeping a pitch-black opening frame
     from reading as a page that failed to load. Long enough that it
     arrives rather than having always been there.

     `hidden` is flipped a frame before `data-show` so the opacity
     transition has something to move from — and so the digit animation
     isn't running on the compositor before anyone can see it. */
  var cueTimer = setTimeout(function () {
    if (active !== 0) return;
    cue.hidden = false;
    requestAnimationFrame(function () { cue.setAttribute('data-show', ''); });
  }, 600);

  /* Gone for good on the first input. `hidden` after the fade so the
     digits stop animating entirely rather than looping forever behind
     an opacity of 0 for the rest of the session.

     The step ledger takes over as this leaves, and waits out the fade
     rather than crossing it — the cue's arrow and the ledger dissolving
     through each other on the same frame is a swap you can see, and
     there is nothing to be gained by letting anyone see it. */
  function dismissCue() {
    if (cueTimer) clearTimeout(cueTimer);
    cue.removeAttribute('data-show');
    setTimeout(function () { cue.hidden = true; }, 340);
    setTimeout(function () { cueGone = true; refreshSteps(); }, 360);
  }
  ['scroll', 'wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, dismissCue, { passive: true, once: true });
  });

  /* Fonts settle after layout — refresh so pin distances stay correct. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  applyStep(0);
})();
