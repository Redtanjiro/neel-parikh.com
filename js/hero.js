/* =========================================================
   neel-parikh.com — the opening
   A timed sequence on a lid, and a site underneath it.
   =========================================================

   WHAT CHANGED, AND WHY IT MATTERS WHEN EDITING THIS FILE

   TWO THINGS USED TO BE ONE THING. The hero was pinned across seven
   thousand pixels of scroll with the entire site — the desktop, the
   files, the About window — living inside it as a layer. One scrollbar
   drove an animation and a page at the same time. Three consequences,
   all of them structural rather than fixable:

     - scrolling up from the work un-played the story frame by frame,
       because the work's scroll position WAS a position in the story
     - there was no place on the page that simply meant "after the
       opening" — only a number of screens into a pin
     - every rule about the site had to be written twice, once for the
       page and once for the pinned version of it (see how much of the
       no-JS block just disappeared)

   They are two documents now. `.hero` is `position: fixed` — a lid over
   the viewport that runs once on its own clock and then unmounts. The
   site is an ordinary page underneath it with an ordinary scrollbar,
   and it starts at its own top. Nothing scrolls backwards into an
   animation that is finished, because there is nothing back there.

   THE SEQUENCE IS ON A CLOCK AGAIN, AND THIS TIME IT IS ALLOWED TO BE.
   The last version made the scroll the clock, and then had to grow a
   governor to stop a flick crossing it and a gate to stop the governor
   being outrun — several hundred lines whose entire purpose was to
   make a scrollbar behave like a timeline. If what you want is a
   timeline, the honest thing is a timeline.

   What makes a timed sequence defensible is not that it is short. It is
   that the reader chose it, can see how long it is, and can leave:

     - THE DOOR. Nobody is shown this without asking. The opening frame
       offers two answers and the second one is the site.
     - THE RAIL. A bar across the bottom, filling for the length of the
       run. The reader is owed the clock they agreed to.
     - THE EXIT, STANDING. Esc, and a tap target beside the rail, for
       the whole run and not only at the door.

   Remove any of those three and this becomes the auto-play the audit
   killed. They are not decoration.

   ONE THING KEEPS ITS OWN CLOCK INSIDE THE CLOCK: the searchlight's
   hunt. Its character is darts and holds, and the score below only
   decides how long you watch it, not where it points. See BEAM.

   Design notes that still hold:

   - Narrative motion (the lines) gets 400-900ms. UI motion (chrome,
     rail, hover) is hard-capped at 300ms. Do not let the tiers bleed.
   - Every phrase is real text in the DOM. Nothing is generated.
   - Transform, opacity and filter only. All three are GPU.
   - prefers-reduced-motion is a full opt-out of travel, never of
     content: the same states, minus the flying, at roughly half the
     running time.
*/

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var root       = document.documentElement;
  var video      = document.getElementById('hero-video');
  var dither     = document.getElementById('backdrop-dither');
  var hero       = document.getElementById('hero');
  var site       = document.getElementById('site');
  var title      = document.getElementById('title');
  var work       = document.getElementById('work');
  var door       = document.getElementById('door');
  var rail       = document.getElementById('rail');
  var railBar    = document.getElementById('rail-bar');
  var railFill   = document.getElementById('rail-fill');
  var bailBtn    = document.getElementById('bail');
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

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var handedOff = false;

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function playSafe(v)  { if (v && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
  function pauseSafe(v) { if (v && !v.paused) v.pause(); }

  /* No GSAP (CDN blocked / offline): the lid never comes down. `.no-js`
     hides the hero outright and what is left is the site, which is a
     plain document and always was. The story does not read as text any
     more — it reads as not being there — and that is the better
     failure: a portfolio that loads is worth more than a poem that
     half-loads. */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    root.classList.add('no-js');
    if (site) site.setAttribute('data-desk', '');
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

  /* The site is behind the lid and must not be reachable through it —
     not by Tab, not by a screen reader's virtual cursor, not by a
     scroll. Set here rather than in the markup so that a browser
     without JS never sees it and gets the whole page. */
  if (site) {
    site.setAttribute('aria-hidden', 'true');
    site.setAttribute('inert', '');
  }
  root.classList.add('is-opening');

  /* A reload must start at the door, not wherever the reader left the
     page. Without this the browser restores the old scroll position,
     the opening plays over a site scrolled to its footer, and the
     handoff's scrollTo fights the restore. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------------------------------------------------------
     WHAT SITS BEHIND THE LID

     The dissolve at the end is a crossfade: the hero fades out, and
     whatever is behind it is what it fades TO — so that has to be the
     halftone plate. It is .backdrop, fixed to the frame at body level,
     so it is behind the lid at the right framing no matter where the
     locked page is scrolled. The lid dissolves onto it; the name and
     the desktop then share it.

     .site is still offset up by one title card for the length of the
     opening, so that when the offset comes off at the handoff the
     scroll can go to the same number and land the reader on the desk
     (the dissolve resolves INTO the desktop) with the title card a
     scroll-up above. That is now only a scroll-position trick — the
     picture behind the lid is .backdrop either way.

     Measured rather than 100svh. The card is sized in svh and the
     locked body is sized to the live viewport, and on a phone those
     are the same number only while the URL bar is showing. */
  function siteOffset() {
    if (!site || !title || handedOff) return;
    site.style.transform = 'translateY(' + (-title.offsetHeight) + 'px)';
  }
  siteOffset();
  window.addEventListener('resize', siteOffset);

  if (video && !reduced) playSafe(video);

  /* ---------------------------------------------------------
     The reveal: a focus pull.

     Each line arrives out of focus and slightly oversized, then racks
     into sharpness at its true size. The SCORE decides when a line
     arrives; the line decides how.
     --------------------------------------------------------- */
  var IN_DUR    = 0.62;
  var OUT_DUR   = 0.34;
  var SCALE_IN  = 1.06;
  var SCALE_OUT = 1.03;
  var STAGGER   = 0.07;   /* 70ms — past ~80ms three lines stop reading as one pulse */

  /* ---------------------------------------------------------
     Phrases

     data-at  — the position, in screens, at which this phrase arrives
     data-off — the position at which it leaves again (omit to stay)

     SCREENS, STILL. They are no longer screens of scroll — nothing
     scrolls — but they are still the sequence's own coordinate, and
     the SCORE below is what maps them to seconds. Keeping the unit
     meant the markup did not have to be retimed when the clock
     changed, and it keeps the two jobs apart: the markup says what
     order things happen in, the score says how long that takes.
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
       goes back out of focus the way it came in, so the departure
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
     BEAM — its own clock inside the clock

     `hero-hunt` loops forever while the beam is searching. Its first
     and last keyframes are both the rest pose (centre, small), so the
     loop has no seam and the handoff in and out of it has no jump.
     The score decides how long the hunt lasts; the loop decides what
     the hunt looks like, because darts and holds only read as
     searching when they are timed to their own rhythm rather than the
     sequence's.

     Settling is not "stop the animation": a running animation owns the
     transform, so removing it snaps the lamp to whatever CSS says it
     should be. The live pose is captured as a matrix, pinned inline,
     the animation removed, and the element then TRANSITIONS from that
     matrix to the settled pose.
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
     The marks

     A mark is a position in the sequence with something that happens
     there. Crossing one forward runs its `on`; crossing it backward
     runs its `off` — and backward still exists, not because anybody
     scrolls back into this any more, but because the skip jumps the
     playhead and the marks have to arrive at the right state however
     they were reached.

     The phrase marks are read out of the markup; the staging marks
     live here, because a sentence belongs with the writing and a light
     belongs with the machine.
     --------------------------------------------------------- */
  var CUT_LEAD  = 0.25;   /* how far after the claim lands before it is corrected */
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

  /* =========================================================
     THE SCORE — the one table that owns the pacing
     =========================================================

     Pairs of [seconds, position]. The playhead advances in seconds and
     this converts to the position the marks are written in, linearly
     between keyframes. Retiming the piece is editing the left-hand
     column, and nothing else in this file needs to know.

     THIS REPLACES THE `HOLDS` TABLE, and it is the same idea said
     properly. HOLDS listed how long each beat froze the scroll for —
     a duration expressed as a refusal. These are just times.

     What the gaps are actually buying, because they are not arbitrary:

       0.30 -> 1.75   1.45s   five words, and the island arriving under
                              them. Reading time plus a beat to look.
       1.75 -> 3.30   1.55s   the strike is drawn and a second word is
                              written by hand underneath. Two events,
                              and the joke needs the second one to land
                              before the frame empties.
       3.30 -> 3.75   0.45s   a departure. You do not hold on an exit —
                              it is punctuation, and holding on it is
                              holding on nothing.
       3.75 -> 5.70   1.95s   THE LONGEST GAP IN THE PIECE, and the one
                              that most repays being long. A light that
                              darts once has not searched for anything.
                              This is the beat whose meaning IS its
                              duration.
       5.70 -> 6.30   0.60s   found. A settle, not a sentence.
       6.30 -> 7.75   1.45s   four words on a lit frame.
       7.75 -> 9.00   1.25s   two more lamps arrive and the three
                              overlaps have to be seen as colours.
       9.00 -> 9.45   0.45s   a departure again.
       9.45 -> 11.35  1.90s   the ask. It is the last thing said and
                              the only thing anybody has to remember.

     11.35s of story, 2.80s of reveal. Fourteen and a bit seconds, which
     is longer than the eight the auto-play spent — and defensible where
     that was not, for the three reasons at the top of this file. If it
     ever grates, the lever is this column, in one place.
     ========================================================= */
  var STORY = 3.35;    /* where the story ends and the reveal begins */
  var TAIL  = 3.00;    /* the unit the tail's fractions are expressed in */
  var END_X = STORY + 2.70;   /* the playhead's last position: the handoff */

  var SCORE = [
    [ 0.00, 0.00 ],
    [ 0.30, 0.20 ],   /* the island, and "No man is an island…"   */
    [ 1.75, 0.45 ],   /* struck through, and corrected            */
    [ 3.30, 0.85 ],   /* they leave                               */
    [ 3.75, 1.00 ],   /* the beam comes on, hunting               */
    [ 5.70, 1.75 ],   /* found                                    */
    [ 6.30, 1.90 ],   /* all by their Self,                       */
    [ 7.75, 2.35 ],   /* two more lights, left and right          */
    [ 9.00, 2.60 ],   /* that line leaves                         */
    [ 9.45, 2.85 ],   /* lets work together.                      */
    [11.35, STORY ],  /* the story ends, the reveal begins        */
    [14.15, END_X ]   /* the halftone is full: hand over          */
  ];

  /* Reduced motion runs the same score at roughly half length. The
     transitions it waits out are not running — the states simply
     appear — so the gaps are paying for reading time and nothing else.
     Not zero: reading time is still real. */
  var RM = 0.55;
  if (reduced) {
    for (var si = 0; si < SCORE.length; si++) SCORE[si][0] *= RM;
  }
  var DURATION = SCORE[SCORE.length - 1][0];

  function screensAt(t) {
    if (t <= 0) return 0;
    if (t >= DURATION) return END_X;
    for (var i = 1; i < SCORE.length; i++) {
      if (t <= SCORE[i][0]) {
        var a = SCORE[i - 1], b = SCORE[i];
        var f = (t - a[0]) / (b[0] - a[0]);
        return a[1] + f * (b[1] - a[1]);
      }
    }
    return END_X;
  }

  /* The inverse, for the skip: it jumps the playhead to a POSITION in
     the picture and the clock has to be told where that is in time, or
     the rail and the remaining run come out wrong. */
  function timeAt(x) {
    if (x <= 0) return 0;
    if (x >= END_X) return DURATION;
    for (var i = 1; i < SCORE.length; i++) {
      if (x <= SCORE[i][1]) {
        var a = SCORE[i - 1], b = SCORE[i];
        var f = (x - a[1]) / (b[1] - a[1]);
        return a[0] + f * (b[0] - a[0]);
      }
    }
    return DURATION;
  }

  /* The tail, in fractions of TAIL:
       0.00 - 0.62   the blackout lifts, the story text goes with it
       0.40 - 1.60   the name, on the footage
       1.50 - 2.70   the hero dissolves out and the halftone is under it
       2.70          the handoff

     The name overlaps the lift on purpose. It has to arrive WITH the
     picture rather than onto a picture that is already there. */
  var LIFT_END     = 0.62 / TAIL;
  var NAME_IN      = 0.40 / TAIL;
  var NAME_OUT     = 1.60 / TAIL;
  var DIS_START    = 1.50 / TAIL;
  var DISSOLVE_END = 2.70 / TAIL;

  /* THE LANDING — where skipping puts the playhead.

     0.70 into the tail: the blackout has fully lifted (0.62), the name
     is at strength (0.40 -> 1.60) and the dissolve has not started
     (1.50). The one moment in the piece where the picture is doing
     exactly one thing.

     NOT straight to the desktop. Somebody who skips an opening has not
     asked to be dropped into a folder grid with no idea what they are
     looking at — they have asked to stop watching. So they get the
     title card over the real footage, about two seconds of it, and
     then the site. Skipping a title sequence, not the film. */
  var LANDING = STORY + 0.70;

  /* ---------------------------------------------------------
     Rendering one position
     --------------------------------------------------------- */
  function applyStory(x) {
    /* A skip can cross several marks between two frames. Crossing one
       is an event and gets its animation; crossing four at once is a
       jump, and animating all four produces a pile-up nobody asked
       for — so a multi-mark frame hard-sets instead. */
    var crossed = 0, i, m;
    for (i = 0; i < MARKS.length; i++) {
      if ((x >= MARKS[i].at) !== MARKS[i]._past) crossed++;
    }
    if (!crossed) return;
    var instant = crossed > 1;

    for (i = 0; i < MARKS.length; i++) {
      m = MARKS[i];
      var past = x >= m.at;
      if (past === m._past) continue;
      m._past = past;
      if (past) m.on(instant); else m.off(instant);
    }
  }

  var nameOn = false;
  function setName(on) {
    on = !!on;
    if (on === nameOn || !hero) return;
    nameOn = on;
    if (on) hero.setAttribute('data-name', '');
    else hero.removeAttribute('data-name');
  }

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
       than the one this is meant to be. */
    if (lamps)    lamps.style.opacity = 1 - clamp01(lift * 1.35);

    setName(tp >= NAME_IN && tp < NAME_OUT);

    /* THE DISSOLVE IS A CROSSFADE ONTO .backdrop.

       It used to be two stacked <video>s inside the hero, the same
       1.5 MB frame decoded twice on two layers that had to be kept
       pixel-identical by hand or the seam showed. There is one copy
       now: .backdrop is fixed behind this lid at the same framing, and
       the hero simply fades off it. One video, one crossfade, and the
       seam cannot come back because there is no second image to
       misalign — and the same plate carries straight on under the name
       and the desktop, so there is no second seam further down either.

       The scrim, vignette and grain go with it rather than being
       scrubbed separately — they are children of the thing fading. */
    if (hero) hero.style.opacity = 1 - p;

    /* The full chrome — mark and reading rule — arrives with the frame
       it sits on. The nav is out from the first frame; see below. */
    if (lift > 0.85) showChrome();

    if (p >= 0.999) handoff();
  }

  /* The hero clip sits behind an opaque black layer for the whole
     story. Decoding 1920x1080 that nobody can see is pure heat, so it
     runs only while it is about to matter — and the halftone is 1.5 MB
     on preload="none", asked for far enough out that the dissolve never
     fades into an empty buffer. */
  function pumpMedia(x) {
    if (reduced) return;
    if (dither && x >= STORY - 0.8 && dither.preload === 'none') {
      dither.preload = 'auto';
      dither.load();
    }
    if (dither && x >= STORY + 0.9) playSafe(dither);
    if (!video) return;
    if (x >= STORY - 1.2) playSafe(video); else pauseSafe(video);
  }

  function render(x) {
    applyStory(x);
    applyTail((x - STORY) / TAIL);
    pumpMedia(x);
  }

  /* =========================================================
     THE PLAYHEAD

     A clock, and nothing around it. No governor, no gate, no rate
     limit, no scroll listener, no clamp — those all existed to make a
     scrollbar behave like this, and this is the thing they were
     imitating.
     ========================================================= */
  var clock = 0, running = false, raf = 0, lastT = 0;

  function setRail(f) {
    if (railFill) railFill.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    if (railBar)  railBar.setAttribute('aria-valuenow', Math.round(f * 100));
  }

  function frame(t) {
    raf = 0;
    var dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0;
    lastT = t;

    clock += dt;
    if (clock > DURATION) clock = DURATION;

    render(screensAt(clock));
    setRail(clock / DURATION);

    if (running && clock < DURATION) raf = requestAnimationFrame(frame);
    else lastT = 0;
  }

  function kick() { if (!raf && running) { lastT = 0; raf = requestAnimationFrame(frame); } }

  function stopClock() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    lastT = 0;
  }

  /* ---------------------------------------------------------
     THE HANDOFF — the lid comes off, once, and does not go back on
     --------------------------------------------------------- */
  function handoff() {
    if (handedOff) return;
    handedOff = true;
    stopClock();

    railShow(false);
    doorShow(false);

    /* The lid is already at (or a rounding error from) zero opacity —
       this takes it out of the layout, the tab order and the
       compositor. */
    if (hero) { hero.style.opacity = 0; hero.hidden = true; }
    pauseSafe(isleClip);
    clearTimeout(beamTimer);

    /* The clean footage goes with the lid. It only ever belonged to the
       reveal — the title card and the desktop both sit on .backdrop
       (the halftone), which is what the dissolve just landed on. */

    /* And the page underneath becomes the page. */
    var titleH = title ? title.offsetHeight : 0;
    if (site) site.style.transform = '';
    root.classList.remove('is-opening');
    if (site) {
      site.removeAttribute('aria-hidden');
      site.removeAttribute('inert');
    }
    /* Force the layout the unlocked body implies before scrolling into
       it — the document only has a scrollable height once the fixed
       positioning is off, and scrollTo against a stale one silently
       clamps to zero. */
    void document.documentElement.scrollHeight;

    /* LANDING ON THE DESKTOP, WITH THE TITLE CARD ABOVE IT.

       Not scrollTo(0). The dissolve resolves INTO the desktop — that is
       the payoff of the whole sequence, the halftone ceasing to be a
       picture of the island and becoming the thing the island's laptop
       is showing — so the reader has to arrive there, on the frame the
       dissolve just landed on, or the last thing the piece does is
       thrown away.

       The title card sits above them. Scrolling up reaches it: the same
       plate, the same grade, the tagline read in two lines on the way
       up, a real screen they can return to. What is NOT up there is the
       animation, which is the whole distinction — the lid is gone and
       the story cannot be re-entered by scrolling.

       Instant, and read after the unlock so the layout is the unlocked
       one. A smooth scroll here would animate the reader away from the
       frame they were just delivered to. */
    window.scrollTo(0, titleH);

    showChrome();
    watchTitle();
    if (!reduced) setupTitleScroll();
    if (!reduced) playSafe(dither);

    /* The files arrive on the plate they were always going to arrive
       on — now that it is a surface the reader owns rather than the
       last frame of something being played at them. */
    if (site) requestAnimationFrame(function () { site.setAttribute('data-desk', ''); });
    ScrollTrigger.refresh();
  }

  /* ---------------------------------------------------------
     THE TITLE CARD, once the reader owns the page

     One job: THE MARK STANDS DOWN. While the title pane is on screen its
     eyebrow is the "Neel Parikh" mark, so the header's copy of it stands
     down — two of one mark in a frame is a repetition, not a mark. The
     observer watches .title__stage (the 100svh sticky pane), not .title
     (300svh of scroll budget, too tall to ever cross a ratio threshold),
     and fires on any intersection at all.
     --------------------------------------------------------- */
  function watchTitle() {
    var stage = document.querySelector('.title__stage');
    if (!stage || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var onScreen = entries[0].isIntersecting;
      if (chrome) {
        if (onScreen) chrome.setAttribute('data-top', '');
        else chrome.removeAttribute('data-top');
      }
    }, { threshold: 0 }).observe(stage);
  }

  /* ---------------------------------------------------------
     THE TWO LINES, SCRUBBED

     The title pane reads in two lines on the way up, and hands off into
     the desk rather than ending at an edge. .title is 300svh of scroll
     budget; .title__stage is a 100svh sticky pane inside it. One
     scrubbed timeline, its length mapped across .title's whole scroll
     (top top -> bottom top):

       0.00-0.24  line one, held
       0.24-0.40  line one lifts out, line two takes its place
       0.40-0.72  line two, held
       0.72-1.00  line two and the eyebrow fade and the pane lifts,
                  while the pane itself is unpinning and scrolling up
                  and the desk is coming in under it — the fade and the
                  scroll-away are the same move, so it reads as the
                  title dissolving into the work rather than cutting

     Reduced motion never gets here (see the handoff); CSS shows both
     lines stacked and static there and under no-JS. --------------------- */
  function setupTitleScroll() {
    var stage = document.querySelector('.title__stage');
    var l1 = document.querySelector('.title__line--1');
    var l2 = document.querySelector('.title__line--2');
    var eyebrow = document.querySelector('.title__eyebrow');
    if (!title || !stage || !l1 || !l2) return;

    gsap.set(l1, { opacity: 1, yPercent: 0 });
    gsap.set(l2, { opacity: 0, yPercent: 16 });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: title,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.3
      }
    });
    tl.to({}, { duration: 0.24 });
    tl.to(l1, { opacity: 0, yPercent: -16, duration: 0.16 }, '>');
    tl.to(l2, { opacity: 1, yPercent: 0,   duration: 0.16 }, '<');
    tl.to({}, { duration: 0.32 });
    tl.to(l2,      { opacity: 0, yPercent: -16, duration: 0.28 }, '>');
    tl.to(eyebrow, { opacity: 0,               duration: 0.28 }, '<');
    tl.to(stage,   { opacity: 0,               duration: 0.28 }, '<');

    ScrollTrigger.refresh();
  }

  /* ---------------------------------------------------------
     THE TWO ANSWERS
     --------------------------------------------------------- */
  function play() {
    if (handedOff || running) return;
    doorShow(false);
    railShow(true);
    running = true;
    kick();
  }

  /* Jump the playhead to the landing and let the clock finish from
     there. Not a cut to the site: the marks are hard-set, the title
     card is on screen for about two seconds, and then the same
     dissolve everyone else gets. */
  function bail() {
    if (handedOff) return;
    doorShow(false);
    if (clock >= timeAt(LANDING)) return;   /* already past it — let it run */
    clock = timeAt(LANDING);
    render(screensAt(clock));
    setRail(clock / DURATION);
    railShow(true);
    running = true;
    kick();
  }

  if (door) {
    var storyBtn = document.getElementById('door-story');
    var skipBtn  = document.getElementById('door-skip');
    if (storyBtn) storyBtn.addEventListener('click', play);
    if (skipBtn)  skipBtn.addEventListener('click', bail);

    /* THE STORY OPTION ALSO ANSWERS A SCROLL. Its copy says "scroll
       down" and the page is locked, so a reader who does exactly what
       they are told gets nothing unless this is here. A downward wheel
       tick, an upward swipe, or Arrow/Page Down while the door is up
       plays the story — same as the button. Once the run starts, or
       after a skip, these are dead: play()'s own guard covers it and
       doorOn gates the rest. Nothing is preventDefaulted — there is
       nothing to scroll to stop. */
    var wheelAcc = 0;
    window.addEventListener('wheel', function (e) {
      if (handedOff || running || !doorOn || e.deltaY <= 0) return;
      wheelAcc += e.deltaY;
      if (wheelAcc > 24) play();
    }, { passive: true });

    var touchY = null;
    window.addEventListener('touchstart', function (e) {
      touchY = (e.touches && e.touches[0]) ? e.touches[0].clientY : null;
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (handedOff || running || !doorOn || touchY === null) return;
      var y = (e.touches && e.touches[0]) ? e.touches[0].clientY : null;
      if (y !== null && touchY - y > 24) play();
    }, { passive: true });

    window.addEventListener('keydown', function (e) {
      if (handedOff || running || !doorOn) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); play(); }
    });

    /* Long enough that it arrives rather than having always been
       there, short enough that black-with-nothing-on-it doesn't burn
       its welcome. */
    setTimeout(function () { if (!handedOff && !running) doorShow(true); }, 600);
  }
  if (bailBtn) bailBtn.addEventListener('click', bail);

  /* ESCAPE, for the whole run and not only at the door. It is the one
     keystroke every reader already knows the meaning of, and a reader
     who wants out three beats in wants out exactly as much as one who
     wanted out at the start. */
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (handedOff) return;
    e.preventDefault();
    bail();
  });

  /* Every link that points at the work is an exit while the lid is
     down, and an ordinary anchor once it is up. Nobody is walked
     through the story on their way out of it. */
  Array.prototype.slice.call(document.querySelectorAll('a[href="#work"]')).forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (handedOff) return;              /* let the browser do its job */
      e.preventDefault();
      bail();
    });
  });

  var doorOn = false;
  function doorShow(on) {
    if (!door || on === doorOn) return;
    doorOn = on;
    if (on) {
      door.hidden = false;
      requestAnimationFrame(function () { door.setAttribute('data-show', ''); });
    } else {
      door.removeAttribute('data-show');
      setTimeout(function () { if (!doorOn) door.hidden = true; }, 460);
    }
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
     Chrome

     THE NAV IS OUT FROM THE FIRST FRAME. It used to arrive with the
     reveal, which meant that for the whole opening there was no
     visible way out and no visible evidence that a portfolio existed
     behind it. One quiet word fixes it and it costs the opening frame
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
    var entrance = mark.animate([
      { opacity: 0, transform: 'translate(2vw, 6vh) scale(1.6)', filter: 'blur(2px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' }
    ], { duration: 560, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' });

    /* AND THEN GET OUT OF THE CASCADE'S WAY.

       `fill: 'both'` holds the last keyframe after the animation ends,
       and a filled Web Animation outranks every CSS declaration there
       is — origin above !important, never mind specificity. So the mark
       was pinned at opacity 1 for the life of the page and the rule
       that stands it down over the title card silently lost. It looked
       correct under reduced motion for the worst possible reason: that
       is the one path where this animation never runs.

       Cancelling once it has finished hands the property back to CSS.
       Nothing moves — the final keyframe is already the element's
       resting state — and the 300ms opacity transition on .chrome__mark
       then does the standing down. */
    if (entrance.finished) {
      entrance.finished.then(function () { entrance.cancel(); }, function () {});
    }
  }

  /* ---------------------------------------------------------
     Reading-position rule. It measures the SITE now, which is the only
     thing on this page with a scroll position — and that is the whole
     point of the separation in one line: the bar at the top of the
     window used to be reporting a reader's progress through an
     animation. Writes transform directly on the element; updating a
     CSS variable on a parent would recalc every child.
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

  /* Fonts settle after layout. Nothing about the opening depends on
     measurement any more — there is no pin to size — but the site's
     reading rule does. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  render(0);
  setRail(0);
})();
