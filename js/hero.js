/* =========================================================
   neel-parikh.com — the pinned hero
   One scroll-driven story. No lock, no skip, no gate.
   =========================================================

   WHAT CHANGED, AND WHY IT MATTERS WHEN EDITING THIS FILE

   The story used to run on a clock: one gesture opened it and eight
   seconds of animation played whether you wanted them or not. Around
   that clock had grown three separate compensations — a lock that
   swallowed input, a skip that fast-forwarded the timeline, and a gate
   that asked before letting you scroll back into it. All three existed
   for the same reason: the reader did not hold the clock.

   Now the scroll position IS the clock. Every gesture moves the story
   proportionally, scrolling back reverses it, and scrolling fast is
   what skipping looks like. The lock, the skip and the gate went with
   it — several hundred lines that were only ever there to apologise
   for the design.

   ONE THING IS STILL ON A TIMER, DELIBERATELY: the searchlight's hunt.
   Its character is darts and holds — it stops to look — and scrubbing
   that turns every hold into a stretch of scrolling where nothing
   happens, which is the exact failure the whole change is meant to
   avoid. So the beam's PATH loops on its own clock and the scroll
   controls how long you watch it, not where it points. See BEAM below.

   Design notes that still hold:

   - Narrative motion (the lines) gets 400–900ms. UI motion (chrome,
     cue, hover) is hard-capped at 300ms. Do not let the tiers bleed.
   - Every phrase is real text in the DOM. Nothing is generated.
   - Transform, opacity and filter only. All three are GPU.
   - prefers-reduced-motion is a full opt-out of travel, never of
     content: the same states, minus the flying.
*/

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var video      = document.getElementById('hero-video');
  var dither     = document.getElementById('hero-dither');
  var ditherwash = document.getElementById('hero-ditherwash');
  var hero       = document.getElementById('hero');
  var work       = document.getElementById('work');
  var cue        = document.getElementById('cue');
  var door       = document.getElementById('door');
  var chrome     = document.getElementById('chrome');
  var mark       = document.getElementById('chrome-mark');
  var fill       = document.getElementById('progress-fill');
  var blackout   = document.getElementById('blackout');
  var isle       = document.getElementById('isle');
  var isleClip   = document.getElementById('isle-clip');
  var lamps      = document.querySelector('.hero__lamps');
  var lampY      = document.getElementById('lamp-y');
  var lampA      = document.getElementById('lamp-a');
  var lampR      = document.getElementById('lamp-r');
  var stage      = document.querySelector('.hero__stage');
  var scrim      = document.querySelector('.hero__scrim');
  var vignette   = document.querySelector('.hero__vignette');
  var grain      = document.querySelector('.hero__grain');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function playSafe(v)  { if (v && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
  function pauseSafe(v) { if (v && !v.paused) v.pause(); }

  if (video && !reduced) playSafe(video);

  /* No GSAP (CDN blocked / offline): show every line as static text.
     The story still reads. Bail out cleanly. */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    document.documentElement.classList.add('no-js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* Built-in curves are too weak to read as intentional at hero size. */
  var EASE_OUT = 'power3.out';
  if (typeof CustomEase !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('npOut', 'M0,0 C0.23,1 0.32,1 1,1');
    EASE_OUT = 'npOut';
  }

  /* ---------------------------------------------------------
     The reveal: a focus pull.

     Each line arrives out of focus and slightly oversized, then racks
     into sharpness at its true size. These are the only durations left
     among the type, and they should stay durations: a line resolving is
     one event, and scrubbing an event turns it into a slider. The
     SCROLL decides when a line arrives; the line decides how.
     --------------------------------------------------------- */
  var IN_DUR    = 0.62;
  var OUT_DUR   = 0.34;
  var SCALE_IN  = 1.06;
  var SCALE_OUT = 1.03;
  var STAGGER   = 0.07;   /* 70ms — past ~80ms three lines stop reading as one pulse */

  /* ---------------------------------------------------------
     Phrases

     data-at  — screens of scroll, from the top of the story, at which
                this phrase arrives
     data-off — screens at which it leaves again (omit to stay)

     SCREENS, NOT SECONDS. They used to be seconds; the numbers in the
     markup changed meaning when the clock did. One screen is one
     viewport height of scrolling, so a value reads directly as "how
     far down".
     --------------------------------------------------------- */
  var phrases = Array.prototype.slice.call(document.querySelectorAll('.phrase'));
  phrases.forEach(function (b) {
    b._lines = Array.prototype.slice.call(b.querySelectorAll('.line'));
    b._at  = b.dataset.at  ? parseFloat(b.dataset.at)  : 0;
    b._off = b.dataset.off ? parseFloat(b.dataset.off) : null;
    /* Blur depth scales with type size — 8px reads as soft on a 40px
       line and as barely-touched on a 128px one. Declared per line
       class in CSS so the number lives next to the size it belongs to,
       and read once here rather than per tween. */
    b._lines.forEach(function (l) {
      var v = getComputedStyle(l).getPropertyValue('--blur-in').trim();
      l._blur = parseFloat(v) || 8;
    });
  });

  function busy(line, on) {
    if (on) line.setAttribute('data-animating', '');
    else line.removeAttribute('data-animating');
  }

  function enterPhrase(ph, instant) {
    var tl = gsap.timeline();
    tl.set(ph, { visibility: 'visible', opacity: 1 }, 0);

    if (instant) {
      tl.set(ph._lines, { opacity: 1, scale: 1, filter: 'blur(0px)' }, 0);
      return tl;
    }

    ph._lines.forEach(function (line, i) {
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

      tl.fromTo(line, from, to, i * STAGGER);
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

    if (instant) { tl.set(ph, { opacity: 0, visibility: 'hidden' }); return tl; }

    /* The exit mirrors the entrance at half the duration — the line
       goes back out of focus the way it came in, so the return trip
       reads as the thought receding rather than a light switching off. */
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
     The correction on screen one

     "man" struck through, "Designer" written under it. Both are CSS
     transitions on one attribute rather than tweens: they are
     predetermined, they fire once, and the second is a handwriting face
     arriving late on purpose. This file only says when.
     --------------------------------------------------------- */
  var cutPh = document.querySelector('.phrase[data-cut]');

  function setCut(on) {
    if (!cutPh) return;
    if (on) cutPh.setAttribute('data-cut-on', '');
    else cutPh.removeAttribute('data-cut-on');
  }

  /* ---------------------------------------------------------
     The island plate
     --------------------------------------------------------- */
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

  function setIsle(on, instant) {
    if (isle) gsap.to(isle, isleTo(on, instant));
    if (!isleClip || reduced) return;
    if (on) playSafe(isleClip); else pauseSafe(isleClip);
  }

  /* ---------------------------------------------------------
     BEAM — the one thing still on a timer

     `hero-hunt` loops forever while the beam is searching. Its first
     and last keyframes are both the rest pose (centre, small), so the
     loop has no seam and the handoff in and out of it has no jump.

     Settling is not "stop the animation": a running animation owns the
     transform, so removing it snaps the lamp to whatever CSS says it
     should be. The live pose is captured as a matrix, pinned inline,
     the animation removed, and the element then TRANSITIONS from that
     matrix to the settled pose. The same trick in reverse when the
     reader scrolls back up into the hunt.
     --------------------------------------------------------- */
  var beamState = 'off';   /* off | hunt | hold */
  var beamTimer = null;

  function beamPose() {
    if (!lampY) return '';
    var m = getComputedStyle(lampY).transform;
    return (m && m !== 'none') ? m : '';
  }

  function beam(to, instant) {
    if (!lampY || to === beamState) return;
    clearTimeout(beamTimer);

    if (to === 'off') {
      lampY.style.transform = '';
      lampY.removeAttribute('data-hunt');
      lampY.removeAttribute('data-hold');
      lampY.removeAttribute('data-rest');
      beamState = 'off';
      return;
    }

    if (to === 'hunt') {
      if (beamState === 'hold' && !instant && !reduced) {
        /* Ease back to the pose the loop starts from, then hand over.
           Going straight to data-hunt would jump from the settled scale
           to the loop's first frame. */
        lampY.style.transform = beamPose();
        lampY.removeAttribute('data-hold');
        void lampY.offsetWidth;
        lampY.setAttribute('data-rest', '');
        lampY.style.transform = '';
        beamTimer = setTimeout(function () {
          lampY.removeAttribute('data-rest');
          lampY.setAttribute('data-hunt', '');
        }, 420);
      } else {
        lampY.style.transform = '';
        lampY.removeAttribute('data-hold');
        lampY.removeAttribute('data-rest');
        lampY.setAttribute('data-hunt', '');
      }
      beamState = 'hunt';
      return;
    }

    /* hold */
    if (!instant && !reduced) lampY.style.transform = beamPose();
    lampY.removeAttribute('data-hunt');
    lampY.removeAttribute('data-rest');
    void lampY.offsetWidth;
    lampY.setAttribute('data-hold', '');
    lampY.style.transform = '';
    beamState = 'hold';
  }

  function lampsIn(on) {
    if (!lampA || !lampR) return;
    if (on) { lampA.setAttribute('data-on', ''); lampR.setAttribute('data-on', ''); }
    else    { lampA.removeAttribute('data-on'); lampR.removeAttribute('data-on'); }
  }

  /* ---------------------------------------------------------
     The score

     Marks are SCREENS of scroll from the top of the story. Crossing one
     forward runs its `on`; crossing it backward runs its `off`. That is
     the whole mechanism — there is no timeline to keep in sync, and
     reversal is free because it is the same list read the other way.

     The phrase marks are read out of the markup; the staging marks live
     here, because a sentence belongs with the writing and a light
     belongs with the machine.

       0.20  the island and the claim arrive        (markup)
       0.45  the strokes are drawn, Designer follows
       0.85  the island and the claim leave         (markup)
       1.00  the beam comes on, searching
       1.75  it settles — found                     0.75 screens of hunt:
       1.90  all by their Self,                     (markup)   the beam is
       2.35  two more lights, left and right                   the signature
       2.60  all by their Self, leaves              (markup)   moment and it
       2.85  lets work together.                    (markup)   needs room
       3.35  the story ends, the tail begins
     --------------------------------------------------------- */
  var CUT_LEAD  = 0.25;   /* screens after the claim lands before it is corrected */
  var BEAM_ON   = 1.00;
  var BEAM_HOLD = 1.75;
  var LIGHTS_AT = 2.35;

  var MARKS = [];

  phrases.forEach(function (b) {
    MARKS.push({
      at:  b._at,
      on:  function (i) { enterPhrase(b, i); },
      off: function (i) { exitPhrase(b, i); }
    });
    if (b._off != null) {
      MARKS.push({
        at:  b._off,
        on:  function (i) { exitPhrase(b, i); },
        off: function (i) { enterPhrase(b, i); }
      });
    }
  });

  if (cutPh) {
    MARKS.push({
      at:  cutPh._at + CUT_LEAD,
      on:  function () { setCut(true); },
      off: function () { setCut(false); }
    });
    /* The island rides the claim it belongs to — one number in the
       markup rather than two that can drift apart. */
    MARKS.push({ at: cutPh._at, on: function (i) { setIsle(true, i); }, off: function (i) { setIsle(false, i); } });
    if (cutPh._off != null) {
      MARKS.push({ at: cutPh._off, on: function (i) { setIsle(false, i); }, off: function (i) { setIsle(true, i); } });
    }
  }

  MARKS.push({ at: BEAM_ON,   on: function (i) { beam('hunt', i); }, off: function ()  { beam('off'); } });
  MARKS.push({ at: BEAM_HOLD, on: function (i) { beam('hold', i); }, off: function (i) { beam('hunt', i); } });
  MARKS.push({ at: LIGHTS_AT, on: function ()  { lampsIn(true); },   off: function ()  { lampsIn(false); } });

  MARKS.sort(function (a, b) { return a.at - b.at; });
  MARKS.forEach(function (m) { m._past = false; });

  /* ---------------------------------------------------------
     BEATS — the marks grouped by position, each with a hold.

     A mark is a thing that happens; a BEAT is a moment on screen, and
     several marks can share one (the claim and the island arrive
     together, and leave together). The gate below works in beats,
     because what it holds is a moment.

     YOU HOLD FOR ARRIVALS, NOT FOR EXITS. A line leaving is not
     something anybody needs to be made to watch — it is punctuation,
     and holding on it is holding on nothing. So 0.85 and 2.60, the two
     departures, are zero and pass straight through, which also keeps
     the total honest: nine beats, five and a half seconds, not nine
     times seven hundred.

     The beam gets the longest hold of the lot. It is the one beat
     whose meaning IS its duration — a light that darts once has not
     searched for anything.
     --------------------------------------------------------- */
  var HOLDS = [
    [0.20,  750],   /* the claim arrives with the island               */
    [0.45,  700],   /* struck through, and corrected                   */
    [0.85,    0],   /* they leave — a departure, no hold               */
    [1.00, 1000],   /* the beam comes on and hunts                     */
    [1.75,  500],   /* found                                           */
    [1.90,  800],   /* all by their Self,                              */
    [2.35,  800],   /* the other two lights arrive                     */
    [2.60,    0],   /* the line leaves — no hold                       */
    [2.85,  900]    /* lets work together.                             */
  ];

  function holdFor(at) {
    for (var i = 0; i < HOLDS.length; i++) {
      if (Math.abs(HOLDS[i][0] - at) < 0.03) return HOLDS[i][1];
    }
    return 650;
  }

  var BEATS = [];
  MARKS.forEach(function (m) {
    var last = BEATS[BEATS.length - 1];
    if (last && Math.abs(last.at - m.at) < 0.001) return;
    BEATS.push({ at: m.at, dur: 0 });
  });
  /* Reduced motion has no transitions worth waiting out — the states
     simply appear — so the holds shrink to a beat of legibility rather
     than the length of an animation that is not running. */
  BEATS.forEach(function (b) { b.dur = Math.round(holdFor(b.at) * (reduced ? 0.3 : 1)); });

  /* ---------------------------------------------------------
     Scroll allocation

     STORY is the distance the sequence occupies; TAIL is the reveal,
     the name and the desktop. Both in screens.

     3.35 for the story is about two firm flicks. It is deliberately
     denser than the eight seconds it replaces: a reader who controls
     the pace does not need to be given time, only distance.

     THE TAIL IS LONGER THAN THE REVEAL NEEDS, and the surplus is at
     the end, after the files have landed. It is fling headroom.

     The governor below stops a hard flick from crossing the story
     between two frames, but it can only do that while the reader is
     still INSIDE the pin — once a gesture clears the whole pinned
     range the hero unpins and there is nothing left to govern. So the
     range has to be longer than one gesture. A comfortable trackpad
     flick travels 2000-3500px; a hard one 5000. At 832 tall this is
     6032px, and the surplus is spent holding the desktop rather than
     stretching the story, because the desktop is the destination and
     dwelling on it costs a reader nothing.

     Past that it IS a skip, and skips stay honoured. Someone who
     throws 6000px at a page in one gesture is not asking to be shown
     anything.

     NOTE ON RETIMING: on every ordinary viewport height the actual pin
     length is set by the 6200px FLOOR below, not by TOTAL*innerHeight —
     so TOTAL only changes how that fixed pixel budget is SPLIT, not how
     long the whole thing is. Shrinking TAIL alone therefore makes the
     run to the desktop LONGER, not shorter (less of the fixed budget is
     "screens", so each screen and every fixed absolute offset within it
     costs more pixels). To actually shorten the trip, move the floor. */
  var STORY = 3.35;
  var TAIL  = 3.90;
  var TOTAL = STORY + TAIL;

  /* The tail, in fractions of itself:
       0.00 - 0.62   the blackout lifts, the story text goes with it
       0.40 - 1.40   the name, on the footage
       1.30 - 2.35   the plate dissolves to the halftone
       2.60          the files land on it
       2.60 - 3.90   dwell — the desktop held there, hoverable

     The name overlaps the lift on purpose. It has to arrive WITH the
     picture rather than onto a picture that is already there. */
  var LIFT_END     = 0.62 / TAIL;
  var NAME_IN      = 0.40 / TAIL;
  var NAME_OUT     = 1.40 / TAIL;
  var DIS_START    = 1.30 / TAIL;
  var DISSOLVE_END = 2.35 / TAIL;
  var DESK_AT      = 2.60 / TAIL;

  /* ---------------------------------------------------------
     Rendering one scroll position
     --------------------------------------------------------- */
  var lastScreens = 0;

  function applyStory(x) {
    /* A fast flick can cross several marks between two frames. Crossing
       one is an event and gets its animation; crossing four at once is
       a jump, and animating all four produces a pile-up nobody asked
       for — so a multi-mark frame hard-sets instead. */
    var crossed = 0, i, m;
    for (i = 0; i < MARKS.length; i++) {
      if ((x >= MARKS[i].at) !== MARKS[i]._past) crossed++;
    }
    if (!crossed) return;
    var instant = crossed > 1;
    var landed = null;

    for (i = 0; i < MARKS.length; i++) {
      m = MARKS[i];
      var past = x >= m.at;
      if (past === m._past) continue;
      m._past = past;
      if (past) { m.on(instant); if (landed === null || m.at > landed) landed = m.at; }
      else m.off(instant);
    }
    /* The furthest beat crossed forward this frame is the one now on
       screen, and the one the gate holds on. */
    if (landed !== null) beatLanded(landed);
  }

  var nameOn = false;
  function setName(on) {
    on = !!on;
    if (on === nameOn || !hero) return;
    nameOn = on;
    if (on) hero.setAttribute('data-name', '');
    else hero.removeAttribute('data-name');
  }

  var deskOn = false;
  function setDesk(on) {
    on = !!on;
    if (on === deskOn || !hero) return;
    deskOn = on;
    if (on) hero.setAttribute('data-desk', '');
    else hero.removeAttribute('data-desk');
  }

  var ditherLive = false;

  function applyTail(tp) {
    tp = clamp01(tp);

    /* Two moves, one after the other. The lift comes off first and the
       dissolve follows it — the real island has to be on screen as a
       photograph for a moment before the machine's version arrives, or
       the two just cross-fade and the middle state is never seen. */
    var lift = clamp01(tp / LIFT_END);
    var p = clamp01((tp - DIS_START) / (DISSOLVE_END - DIS_START));

    if (blackout) blackout.style.opacity = 1 - lift;
    if (stage)    stage.style.opacity = 1 - clamp01(lift * 1.35);
    /* The lamps leave with the type, on the same curve — three coloured
       lamps still burning over a photograph is a much muddier picture
       than the one this is meant to be. Scrubbed rather than switched,
       so scrolling back up restores them without a flicker. */
    if (lamps)    lamps.style.opacity = 1 - clamp01(lift * 1.35);

    dither.style.opacity = p;
    if (ditherwash) ditherwash.style.opacity = p;

    /* Atmosphere rides the same travel. The halftone is its own grade —
       a scrim and a vignette on top of it are the previous shot's
       lighting left switched on. */
    var t = 1 - p;
    if (scrim)    scrim.style.opacity = t;
    if (vignette) vignette.style.opacity = t;
    if (grain)    grain.style.opacity = 0.025 * t;

    setName(tp >= NAME_IN && tp < NAME_OUT);
    setDesk(tp >= DESK_AT);

    /* The full chrome — mark and reading rule — arrives with the frame
       it sits on. The nav is out from the first frame; see below. */
    if (lift > 0.85) showChrome(); else hideChrome();

    if (reduced) return;
    if (p > 0.01) { if (!ditherLive) { ditherLive = true; playSafe(dither); } }
    else if (ditherLive) { ditherLive = false; pauseSafe(dither); }
    if (p >= 0.995) pauseSafe(video); else playSafe(video);
  }

  /* The hero clip sits behind an opaque black layer for the whole
     story. Decoding 1920x1080 that nobody can see is pure heat, so it
     runs only while it is about to matter — and the dither is 1.5 MB
     on preload="none", asked for far enough out that the crossfade
     never fades into an empty buffer. */
  function pumpMedia(x) {
    if (reduced) return;
    if (dither && x >= STORY - 0.6 && dither.preload === 'none') {
      dither.preload = 'auto';
      dither.load();
    }
    if (!video) return;
    if (x >= STORY - 1.2) playSafe(video); else pauseSafe(video);
  }

  /* x is in SCREENS, not progress. It used to take the trigger's 0-1
     and scale it here; the governor now owns that conversion, because
     a rate limit has to be expressed in the same unit the beats are. */
  function render(x) {
    applyStory(x);
    applyTail((x - STORY) / TAIL);
    pumpMedia(x);
    lastScreens = x;
  }

  /* ---------------------------------------------------------
     THE GOVERNOR

     A pure scrub has exactly one failure and it is the obvious one:
     a flick moves the scrollbar three or four screens between two
     animation frames, so every mark is crossed in a single tick and
     the reader arrives at the tail having seen none of it. The story
     did not play fast — it did not play.

     THE SCROLL IS NEVER REFUSED. The scrollbar goes precisely where
     the gesture sent it, the page never fights the momentum, nothing
     is held and nothing snaps back. What is rate-limited is how fast
     the PICTURE is allowed to travel to meet the scrollbar.

     Under an ordinary wheel notch the picture moves perhaps 0.02
     screens per frame, which is an order of magnitude under the cap,
     so it tracks the scroll exactly and the governor is not there. It
     only ever engages on a flick, and what a flick then buys you is a
     fast-forward — the whole story in about one and three quarter
     seconds — instead of a blank.

     Backwards is faster than forwards on purpose. Missing the story
     on the way out is not a loss, and a reader heading back up is
     going somewhere.
     --------------------------------------------------------- */
  var FWD_RATE  = reduced ? 5.2 : 1.9;  /* screens/sec, inside the story  */
  var TAIL_RATE = 14;                   /* the reveal is scrubbed, not paced */
  var BACK_RATE = 9;

  var shown = 0, target = 0, rawTarget = 0, raf = 0, lastT = 0;

  /* ---------------------------------------------------------
     THE GATE — one gesture, one beat

     The governor stops a flick from crossing the story between two
     frames. It does not stop a flick from crossing it in two SECONDS,
     which is still faster than any of it can be read. So each beat now
     holds: while its animation is landing, neither the picture nor the
     scroll may pass the beat that follows it.

     THIS IS SCROLL-JACKING AND IT IS WORTH SAYING SO. What makes it
     survivable here is that the hero is PINNED: nothing on screen is
     moving with the scroll in the first place, so a clamped scroll
     produces no jitter, no rubber-band and no half-scrolled frame —
     only a scrollbar thumb that declines to travel. It is the one
     place on a page where holding the scroll costs the reader nothing
     they can see.

     Three things keep it from becoming the thing the audit killed:

       - FIRST DESCENT ONLY. The moment the story has been seen
         through once, `sticky` goes false and every later pass is a
         free scrub. Nobody is ever made to watch it twice.
       - THE EXITS ARE NEVER GATED. The nav, the skip link and the
         focus jump all call release() before they move.
       - THE HOLD IS VISIBLE. The cue at the bottom of the frame goes
         dim while a beat is landing and lights when the page will
         take another gesture. A page that refuses to move and does
         not say so is broken; a page that refuses and says why is
         paced.
     --------------------------------------------------------- */
  var EPS     = 0.0015;
  var sticky  = true;    /* the first descent, and only the first */
  var holdEnd = 0;       /* timestamp the beat currently landing finishes */
  var holdCeil = 0;      /* where the ceiling is frozen while it lands */
  var clamping = false;

  function nowMs() { return (window.performance && performance.now) ? performance.now() : +new Date(); }

  /* THE CEILING — the furthest the scroll and the picture may go right
     now. It is a staircase: it stands one beat ahead of the picture,
     and while a beat is landing it does not move at all.

     A hair PAST the beat rather than exactly on it. scrollForScreens
     rounds to whole pixels, so a ceiling sitting exactly on a mark can
     land the picture a ten-thousandth short of it, the mark never
     fires, and the staircase stops climbing. EPS is the width of that
     rounding error. */
  function nextBeatAfter(x) {
    for (var i = 0; i < BEATS.length; i++) if (BEATS[i].at > x + EPS) return BEATS[i];
    return null;
  }

  function ceiling() {
    if (!sticky) return TOTAL;
    if (holdEnd)  return holdCeil;
    var nb = nextBeatAfter(shown);
    return nb ? nb.at + EPS : STORY;
  }

  function release() {
    if (!holdEnd) return;
    holdEnd = 0;
    cueState('ready');
  }

  /* Called once per frame in which the picture landed on a beat. */
  function beatLanded(at) {
    if (!sticky || at >= STORY) return;
    var dur = 0, i;
    for (i = 0; i < BEATS.length; i++) {
      if (Math.abs(BEATS[i].at - at) < 0.001) { dur = BEATS[i].dur; break; }
    }
    if (!dur) return;   /* a departure: no hold, the ceiling just climbs */
    holdCeil = at + EPS;
    holdEnd  = nowMs() + dur;
    cueState('wait');
  }

  /* The scroll is tethered to the ceiling for the length of the first
     descent. Re-entrancy guarded because this runs inside a
     ScrollTrigger update and moves the scroll. */
  function clampScroll() {
    /* st is hoisted but not assigned until the trigger is built, and
       its own onRefresh fires during construction. */
    if (!st || !sticky || clamping) return;
    var c = ceiling();
    if (c >= TOTAL) return;
    var maxY = Math.ceil(scrollForScreens(c));
    if (window.scrollY > maxY) {
      clamping = true;
      window.scrollTo(0, maxY);
      clamping = false;
    }
  }

  function aimed() {
    var c = ceiling();
    return rawTarget > c ? c : rawTarget;
  }

  function frame(t) {
    raf = 0;
    var dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 1 / 60;
    lastT = t;

    if (holdEnd && nowMs() >= holdEnd) release();
    clampScroll();
    target = aimed();

    var d = target - shown;
    var moving = Math.abs(d) >= 0.0005;

    if (moving) {
      /* Rate is chosen by where the picture IS, not where it is going:
         reversing out of the tail should clear the tail at tail speed
         and only then slow to unplay the story. */
      var rate = d < 0 ? BACK_RATE : (shown < STORY ? FWD_RATE : TAIL_RATE);
      var step = rate * dt;
      shown += Math.abs(d) <= step ? d : (d > 0 ? step : -step);
    } else {
      shown = target;
    }

    render(shown);

    /* Seen through once is seen. Every descent after this one is an
       ordinary governed scrub with no holds in it at all. */
    if (sticky && shown >= STORY - 0.02) { sticky = false; release(); }
    cuePlace();

    /* The loop stays alive while the gate is armed, because the scroll
       has to be held every frame and not merely every scroll event —
       momentum keeps arriving after the events stop. */
    if (moving || holdEnd || (sticky && rawTarget > shown + 0.001)) {
      raf = requestAnimationFrame(frame);
    } else {
      lastT = 0;
    }
  }

  function kick() { if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); } }

  function seek(x) {
    rawTarget = x < 0 ? 0 : (x > TOTAL ? TOTAL : x);
    /* Synchronously, inside the trigger's own update — otherwise a
       single huge wheel event reaches the end of the pin and fires
       onLeave before the next animation frame ever runs, and the gate
       is handed a page that has already left. */
    clampScroll();
    kick();
  }

  /* No governor and no gate: layout refreshes, and the two explicit
     exits, which are decisions rather than gestures and must land at
     once. */
  function settle(x) {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    lastT = 0;
    holdEnd = 0;
    shown = target = rawTarget = x < 0 ? 0 : (x > TOTAL ? TOTAL : x);
    render(shown);
    cuePlace();
  }

  /* ---------------------------------------------------------
     The pin. No snap, no gating, no input handlers at all — the page
     scrolls the way every other page scrolls, and this only reads the
     position it lands on.
     --------------------------------------------------------- */
  var st = ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    /* A PIXEL FLOOR under the screens figure. The range has to be
       longer than one gesture, and "one gesture" is measured in
       pixels, not viewports — a 700px-tall laptop window would put the
       whole pin inside 5000px and hand a single fling the entire
       story. 6200 stays above a hard trackpad fling (~5000px) with
       real margin; the screens figure wins on anything tall enough not
       to need it.

       THIS FLOOR IS THE ACTUAL LENGTH on ordinary viewports — cut down
       from 7600 on explicit feedback that the run to the desktop after
       the name landed felt too long. It matters more than STORY/TAIL
       here: on any viewport short enough for the floor to be binding
       (most of them), retiming STORY or TAIL only changes how this
       fixed budget is split between them, not how long the whole trip
       is — shrinking TAIL alone would in fact make the desktop arrive
       LATER, because the same fixed pixels then buy fewer "screens" and
       every absolute offset inside the tail costs more of them. Moving
       this number is what actually shortens the trip. */
    end: function () { return '+=' + Math.max(window.innerHeight * TOTAL, 6200); },
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate:    function (self) { seek(self.progress * TOTAL); },
    onRefresh:   function (self) { settle(self.progress * TOTAL); },
    /* Leaving the pin means the hero is off screen: there is no longer
       a picture to govern, so the catch-up is abandoned rather than
       played to an empty room. */
    onLeave:     function () { if (sticky) { clampScroll(); return; } settle(TOTAL); },
    onLeaveBack: function () { settle(0); }
  });

  function scrollForScreens(x) {
    return st.start + (x / TOTAL) * (st.end - st.start);
  }

  /* ---------------------------------------------------------
     Chrome

     THE NAV IS OUT FROM THE FIRST FRAME. It used to arrive with the
     reveal, which meant that for the whole loader and the whole story
     there was no visible way out and no visible evidence that a
     portfolio existed behind them — measured: zero. A reader deciding
     whether to stay was being asked to take the rest of the site on
     trust. One quiet word fixes it and it costs the opening frame
     almost nothing.

     The mark and the reading rule still wait for the picture. Those are
     furniture; the nav is an exit.
     --------------------------------------------------------- */
  var chromeShown = false;

  function showChrome() {
    if (chromeShown || !chrome) return;
    chromeShown = true;
    chrome.setAttribute('data-full', '');
    if (reduced || !mark || !mark.animate) return;
    mark.animate([
      { opacity: 0, transform: 'translate(2vw, 6vh) scale(1.6)', filter: 'blur(2px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' }
    ], { duration: 560, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' });
  }
  function hideChrome() {
    if (!chromeShown || !chrome) return;
    chromeShown = false;
    chrome.removeAttribute('data-full');
    if (mark && mark.getAnimations) mark.getAnimations().forEach(function (a) { a.cancel(); });
  }

  /* The exit has to actually work, not merely be visible. Links that
     point into the pinned hero jump to the scroll position where the
     desktop exists, rather than to an element that is inside a pin and
     therefore not where the browser thinks it is. */
  /* ---------------------------------------------------------
     THE NAME LANDING

     Where escaping the story puts you: the title card, with the real
     footage behind it, one beat before the plate begins to dissolve.

     NOT the desktop. Somebody who skips an opening sequence has not
     asked to be dropped into a folder grid with no idea what they are
     looking at — they have asked to stop watching. So they arrive at
     the frame the story was travelling towards anyway, and scroll on
     into the work from there under their own steam. It is the
     difference between skipping a title sequence and skipping a film.

     0.85 screens into the tail, arithmetic on the tail constants:
     the blackout has fully lifted (LIFT_END 0.62), the name is at
     strength (NAME_IN 0.40 → NAME_OUT 1.40) and the dissolve has not
     started (DIS_START 1.30). The one frame in the tail where the
     picture is doing exactly one thing. */
  var NAME_LANDING = STORY + 0.85;

  function goToName() {
    sticky = false;              /* never gate somebody on their way out */
    settle(NAME_LANDING);
    window.scrollTo(0, Math.round(scrollForScreens(NAME_LANDING)) + 2);
    doorShow(false);
  }

  function jumpToWork() {
    var y = Math.round(scrollForScreens(STORY + DESK_AT * TAIL)) + 2;
    /* An exit is a decision, not a gesture: the governor is not
       allowed to make somebody watch the story on their way out of
       it. settle() puts the picture at the destination before the
       viewport gets there. */
    /* An exit is never gated. sticky goes false as well as the hold
       coming off, because somebody who has asked for the work once is
       not going to be walked through the story if they scroll back. */
    sticky = false;
    settle(STORY + DESK_AT * TAIL);
    /* And it lands at once rather than gliding. A smooth scroll across
       six thousand pixels of pinned range fires an onUpdate every
       frame on the way, which would drag the picture back down to
       whatever the viewport was passing through and play the story at
       the reader on their way OUT of it. Instant is also simply the
       faster exit, which is the entire reason the link exists. */
    window.scrollTo(0, y);
  }

  Array.prototype.slice.call(document.querySelectorAll('a[href="#work"]')).forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); jumpToWork(); });
  });

  /* A keyboard user tabbing in from the skip link lands on a folder
     that is not on screen yet. Focus JUMPS the page to where the
     desktop is — instantly, because this is a focus correction and not
     a transition. */
  if (work && hero) {
    work.addEventListener('focusin', function () {
      if (hero.hasAttribute('data-desk')) return;
      jumpToWork();
      ScrollTrigger.update();
    });
  }

  /* ---------------------------------------------------------
     The About window's tabs

     Eighteen poses in one 6x3, 256x320-cell sheet (media/sprites/README.md
     has the frame table). Four tabs, each pinned to a resting pose it
     snaps to on selection and a second pose it drifts to after a few
     seconds — enough life to say the window is alive without that life
     ever being the answer to the question the tab is asking.

     A real ARIA tablist: arrow keys, Home/End, roving tabindex, one
     panel visible at a time — see the markup in index.html. Close hides
     the window and shows a reopen chip in its place (`.about__reopen`);
     reopen restores whichever tab was open, not tab zero, because
     reopening isn't restarting.
     --------------------------------------------------------- */
  var FRAMES = [
    'idle', 'walk-1', 'back', 'walk-2', 'walk-3', 'desk',
    'mug', 'think', 'laptop-floor', 'walk-phone', 'backpack', 'headphones',
    'clipboard', 'cheer', 'sit-ground', 'crouch', 'stance', 'cast'
  ];
  /* One pose per tab that shows what the panel is about, then a slower
     second pose. */
  var ABOUT_TABS = [
    { poses: ['idle', 'headphones'] },        /* about me   */
    { poses: ['desk', 'mug'] },               /* experience */
    { poses: ['clipboard', 'laptop-floor'] }, /* studies    */
    { poses: ['cheer', 'walk-phone'] }        /* contact    */
  ];
  var DRIFT_MS = 5200;

  var about       = document.getElementById('about');
  var aboutSprite = document.getElementById('about-sprite');
  var aboutCap    = document.getElementById('about-caption');
  var aboutReopen = document.getElementById('about-reopen');
  var aboutTabs   = about ? Array.prototype.slice.call(about.querySelectorAll('.about__tab')) : [];
  var aboutPanels = aboutTabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var aboutActive = 0, aboutSub = 0, aboutDrift = null, aboutLastTab = 0;

  function aboutPose(pose, hop) {
    var i = FRAMES.indexOf(pose); if (i < 0) i = 0;
    if (aboutSprite) {
      aboutSprite.style.setProperty('--about-col', i % 6);
      aboutSprite.style.setProperty('--about-row', Math.floor(i / 6));
      if (hop && !reduced) {
        aboutSprite.classList.remove('is-hop');
        void aboutSprite.offsetWidth;
        aboutSprite.classList.add('is-hop');
      }
    }
    if (aboutCap) aboutCap.textContent = pose.replace(/-/g, ' ');
  }
  function aboutDriftStart() {
    clearInterval(aboutDrift);
    if (reduced) return;   /* the drift is ambient motion; reduced motion holds the resting pose */
    aboutDrift = setInterval(function () {
      aboutSub = (aboutSub + 1) % ABOUT_TABS[aboutActive].poses.length;
      aboutPose(ABOUT_TABS[aboutActive].poses[aboutSub], false);
    }, DRIFT_MS);
  }
  function aboutSelect(n, focus) {
    aboutActive = n; aboutSub = 0; aboutLastTab = n;
    aboutTabs.forEach(function (t, i) {
      t.setAttribute('aria-selected', i === n ? 'true' : 'false');
      t.tabIndex = i === n ? 0 : -1;
    });
    aboutPanels.forEach(function (p, i) { if (p) p.hidden = i !== n; });
    aboutPose(ABOUT_TABS[n].poses[0], true);
    aboutDriftStart();
    if (focus) aboutTabs[n].focus();
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
  if (about && aboutTabs.length) aboutSelect(0);

  /* Close/reopen, not close/gone — matching every other control on this
     page. Close stops the drift, hides the window and brings in a small
     reopen chip in the same desktop cell; reopen restores the tab that
     was open when it closed. */
  if (about) {
    Array.prototype.slice.call(about.querySelectorAll('[data-about-close]')).forEach(function (b) {
      b.addEventListener('click', function () {
        clearInterval(aboutDrift);
        about.hidden = true;
        if (aboutReopen) {
          aboutReopen.hidden = false;
          requestAnimationFrame(function () { aboutReopen.classList.add('is-in'); });
        }
      });
    });
  }
  if (aboutReopen) {
    aboutReopen.addEventListener('click', function () {
      aboutReopen.classList.remove('is-in');
      setTimeout(function () { aboutReopen.hidden = true; }, 220);
      about.hidden = false;
      aboutSelect(aboutLastTab, true);
    });
  }

  /* ---------------------------------------------------------
     Reading-position rule. Writes transform directly on the element —
     updating a CSS variable on a parent would recalc every child.
     --------------------------------------------------------- */
  if (fill) {
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function (self) {
        fill.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
      }
    });
  }

  /* ---------------------------------------------------------
     THE CUE

     It began as a loader decoration — a tumbling digit grid so that a
     pitch-black opening frame read as alive rather than broken — and
     it left on the first input. It stays now, because the gate gave it
     a job: it is the only thing on the page that can tell a reader
     whether the next scroll will be taken or swallowed.

     Three states, and the middle one is the point:

       READY   lit, the arrow breathing — the page will move
       WAIT    dimmed, the arrow still — a beat is landing, and the
               scroll is being held on purpose
       gone    the story is over; the tail is a free scrub and needs
               no instructions

     The digit grid is dropped on the first scroll (data-compact). It
     was for the empty frame; over lit type it is just clutter, and
     what survives is a word and an arrow.
     --------------------------------------------------------- */
  var cueShown = false, cueMode = '';

  function cueState(mode) {
    if (!cue || mode === cueMode) return;
    cueMode = mode;
    if (mode === 'wait') cue.setAttribute('data-wait', '');
    else cue.removeAttribute('data-wait');
  }

  function cueShow(on) {
    if (!cue || on === cueShown) return;
    cueShown = on;
    if (on) {
      cue.hidden = false;
      requestAnimationFrame(function () { cue.setAttribute('data-show', ''); });
    } else {
      cue.removeAttribute('data-show');
      setTimeout(function () { if (!cueShown) cue.hidden = true; }, 340);
    }
  }

  /* Called every frame the picture moves. The cue belongs to the
     story: it arrives with the first frame of it and leaves at the
     last, and it never appears over the reveal or the desktop. */
  /* The cue belongs to the story: it arrives once the door has been
     answered and the sequence is under way, and leaves at the last
     beat. Two instruments, never both on screen at once. */
  function cuePlace() {
    if (!cue) return;
    cueShow(cueReady && doorDone && shown < STORY - 0.03);
  }

  var cueReady = false;

  /* ---------------------------------------------------------
     THE DOOR

     Shown on the opening frame only, and gone the moment the reader
     has answered it — by clicking either option, by pressing Escape,
     or simply by scrolling, which is itself one of the two answers.

     It never blocks the scroll. `pointer-events: none` on the
     container with `auto` on the two buttons means the frame behind
     is still a scrollable page: the door OFFERS the gesture, it does
     not stand in front of it.
     --------------------------------------------------------- */
  /* doorDone gates the cue as well as the door, so a page with no door
     element in it must start already answered or the cue never shows. */
  var doorOn = false, doorDone = !door;

  function doorShow(on) {
    if (!door || on === doorOn) return;
    doorOn = on;
    if (on) {
      door.hidden = false;
      requestAnimationFrame(function () { door.setAttribute('data-show', ''); });
    } else {
      doorDone = true;
      door.removeAttribute('data-show');
      setTimeout(function () { if (!doorOn) door.hidden = true; }, 460);
    }
  }

  if (door) {
    /* Same 600ms the cue used to wait: long enough that it arrives
       rather than having always been there. */
    setTimeout(function () {
      if (doorDone || shown > 0.05) return;
      doorShow(true);
    }, 600);

    var storyBtn = document.getElementById('door-story');
    var skipBtn  = document.getElementById('door-skip');

    /* Clicking the story option does what scrolling would have done —
       it walks to the first beat and hands over to the gate. On a
       phone this is the whole difference between an opening the
       reader can start and one they have to guess at. */
    if (storyBtn) storyBtn.addEventListener('click', function () {
      doorShow(false);
      var first = BEATS.length ? BEATS[0].at + EPS : 0.25;
      window.scrollTo(0, Math.ceil(scrollForScreens(first)));
      ScrollTrigger.update();
    });

    if (skipBtn) skipBtn.addEventListener('click', goToName);

    /* Any real scroll answers the question too. */
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function () { doorShow(false); }, { passive: true });
    });
  }

  /* ESCAPE, for the whole length of the story and not only on the
     opening frame. It is the one keystroke every reader already knows
     the meaning of, and a reader who wants out three beats in wants
     out exactly as much as one who wanted out at the door. Past the
     story there is nothing to escape from, so it stops. */
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (shown >= STORY) return;
    e.preventDefault();
    goToName();
  });

  if (cue) {
    /* 600ms: long enough that it arrives rather than having always
       been there, short enough that black-with-nothing-on-it doesn't
       burn its welcome. */
    setTimeout(function () { cueReady = true; cuePlace(); }, 600);

  }

  /* Fonts settle after layout — refresh so pin distances stay correct. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  render(0);
})();
