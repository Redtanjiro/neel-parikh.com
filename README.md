# neel-parikh.com

Portfolio, Mark 4. Static site — no build step, no dependencies to install.

A designer without a team is marooned. Six steps of white type on a black
frame, one line per scroll, and on the last of them the frame opens onto a
cliff-top cabin above the clouds dissolving into ASCII. It hands off to the
work section by turning the story's last word into the site's nav.

## Run it

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` as a `file://` URL
mostly works, but the font and video paths are more reliable over HTTP.

## Structure

```
index.html          markup — every hero line is real text in the DOM
css/fonts.css       Panchang / Sprat / Calfine @font-face
css/main.css        tokens, hero, phrases, chrome, work, a11y
js/hero.js          the step machine (read the header comment first)
fonts/              the three shipped woff2s
media/              encoded hero video (ASCII treatment) + poster
design.md           the spec — decisions, measurements, and why
```

## Editing the story

Copy lives in `index.html` inside `.phrase` elements — just edit the text.
Nothing mirrors it in an attribute and nothing mutates it at runtime, so what
you type is exactly what a screen reader and a crawler get.

**One scroll = one line.** Each phrase declares its own lifespan:

```html
<div class="phrase pos--tl" data-in="2" data-out="4">
  <span class="line line--body">like, well</span>
</div>
```

`data-in` is the step it appears on, `data-out` the step it leaves (omit it and
it stays for good). Ranges rather than a single index are what let "like, well"
still be on screen when "a person…" lands underneath it — a line doesn't have
to leave when the next one arrives. A phrase that's still up but no longer the
line being spoken drops to 0.55 opacity so the newest one owns the frame.

The step count is derived from the markup, so adding a phrase is the only edit
needed to lengthen the story — scroll distance, snap stops and step count all
follow. If you do add one, extend `REVEAL` in `hero.js` to match (one entry per
step) and `GAPS` (one per transition).

Placement classes: `pos--mid`, `pos--tl`, `pos--br`, `pos--ask`, `pos--name`.
Position lives on the phrase, animation on the `.line` inside — keeping them on
separate elements means the focus pull's scale never fights the placement
transform.

Scroll pacing is `GAPS` in `js/hero.js`, one relative weight per transition.
The `1.3` sits on 3→4: the pause after "a person…" is the setup for
"Marooned.".

## The scroll gate

One gesture advances exactly one step, and input is locked until the line has
finished resolving. The sequence per step:

```
0.00  scroll starts moving, old line goes back out of focus
0.38  page lands on an empty frame
0.46  new line begins pulling into focus
1.16  animation settles
≤1.54 lock lifts (QUIET, or QUIET_CAP at the latest)
```

Travel and reveal never overlap — the scroll delivers you, then the line
speaks.

**Input during the lock is queued, not discarded.** One step of intent is
remembered and fires the moment the lock lifts, so a deliberate gesture is
never silently thrown away — that's the main reason a gated scroll feels broken
rather than deliberate.

Knobs, all in `js/hero.js`:

- `GLIDE` (0.38s) — how long the page takes to travel between steps.
- `SETTLE` (0.08s) — the moment of stillness after landing, before the line
  starts. Small, but removing it makes the reveal feel mechanically welded to
  the scroll rather than like a response to arriving.
- `IN_DUR` (0.7s) — how long a line takes to resolve.
- `SCALE_IN` (1.06) — how oversized a line starts. This is also where the
  apparent letter-spacing settle comes from, so raising it widens the tracking
  effect too.
- `--blur-in` in `main.css` — focus-pull depth, per line class. Calibrated
  against font size (15px on display, 8px on body, 5px on sub) because a fixed
  value reads soft on small type and untouched on large. Blur is the expensive
  part of the reveal; don't push these much higher.
- `REVEAL` — blackout opacity per step, `[1, 1, 1, 1, 1, 0, 0]`. Pitch black
  for the entire setup; the island appears only on the ask. The video is paused
  while it's hidden and resumes one step early so it's warm before it's seen.
- `QUIET` (110ms) — silence that releases the lock early.
- `QUIET_CAP` (380ms) — the hard limit on waiting for that silence. **Do not
  remove this.** The first build waited for quiet with no cap, and every input
  event reset the timer — so scrolling continuously held the lock open
  indefinitely, which is exactly what people do when a page feels stuck. It got
  stickier the harder you fought it.
- `MOMENTUM_MAX` (10) — a wheel event smaller than this *and* shrinking is
  treated as the tail of a flick. Kept deliberately low: a slow trackpad scroll
  also produces small deltas, and locking slow scrollers out is a much worse
  failure than the occasional double-advance.

If the whole thing feels slow, `IN_DUR` is the honest lever — it's most of the
1.5s. Shortening `GLIDE` just makes the travel snappy without changing how
long you wait.

The gate never applies at either end of the pin, so you can always scroll out
of the hero. Keyboard goes through the same path — the pin must not become a
keyboard trap.

## The scroll cue

Step 0 is a pure black frame, which is indistinguishable from a page that
failed to load. The tumbling grid of binary digits above the "Scroll" label is
what makes it read as alive.

It is **decoration, not a loading state** — it blocks nothing and waits on
nothing. It appears with the cue at 600ms and leaves with it permanently on the
first input, which is what keeps it from becoming ambient motion competing with
the lines. The cue is `hidden` before it arrives and `hidden` again after it
goes, so the animation never runs where nobody can see it.

Adapted from a [Uiverse component by
PriyanshuGupta28](https://uiverse.io/PriyanshuGupta28/bright-bobcat-12),
recoloured from matrix green to `--ink`, scaled down to 72 × 96, and with the
stagger halved to 0.09s — at the source's 0.2s the grid doesn't finish filling
until 1.5s and spends most of its life half-empty.

There's no loading screen and no "play video" fallback: `font-display: block`
holds the type until Panchang lands, and muted + `playsinline` autoplays
everywhere except iOS Low Power Mode, where a refusal degrades to the poster
still.

## Before you change the scrim or the video

The scrim gradient values and `--ink-dim` are measured, not chosen. Every line
was composited over six frames of the loop and checked for WCAG AA contrast at
its actual position and opacity. The results are in `design.md` §4. If you
re-render the hero video with a different grade, those numbers are stale and
need re-checking.

## Deploy

GitHub Pages from `main`, root directory. `CNAME` points at neel-parikh.com.
Enforce HTTPS in repo settings.

## Typography

Three faces, each with one job.

- **Panchang** carries the hero, the chrome, the notes and the footer. It's the voice of the person on the island.
- **Calfine** is the wordmark and nothing else — "NEEL PARIKH" on the last frame, with the two E's swapped to Panchang Extrabold. The repeated letter is the rule; don't add ad-hoc swaps, and don't use the face anywhere else. It's the DEMO cut, so check the licence before commercial use.
- **Sprat** Extended Light is used for **work titles only** — one weight, never as running text. The face changes where the subject changes: story above, evidence below. Don't spread it; at 17px its thin strokes fall apart, which is why the card notes are Panchang Light.

## Licensing

- **Panchang** — Indian Type Foundry via [Fontshare](https://www.fontshare.com/fonts/panchang), Fontshare Free License. Web use permitted. Only the variable woff2 is committed; the full package is gitignored.
- **Sprat** — SIL OFL. Only `Sprat-ExtendedLight.woff2` ships (converted from the source OTF with fonttools); the rest of the family is gitignored.
- **Calfine** — DEMO release. Only `Calfine.woff2` ships (6 KB); `calfine/` and `calfine.zip` are gitignored. **Check the licence before commercial use** — demo cuts usually prohibit it.
- **GSAP 3** — free for commercial use including all plugins ([since April 2025](https://webflow.com/blog/gsap-becomes-free)). No licence key or Club membership needed.
