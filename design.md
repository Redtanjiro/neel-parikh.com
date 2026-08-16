# neel-parikh.com — Design Spec

**Mark 4 · Homepage**
Status: spec, pre-build · Last updated: 1 Aug 2026

---

## 1. Concept

No man is an island — all by their self, one must seek a piece of the Continent.

The homepage is a single held shot: a lone figure at a laptop, on a grass-topped cliff, above an ocean of cloud. Beautiful, and completely cut off. The scroll delivers one line of thought at a time — the way a thought actually arrives when there's nobody to say it to — building to the ask: *wave a hand or send a boat, lets join forces to do more.*

The reveal is the argument, not decoration. Each line arrives out of focus and racks into sharpness — the same thing the video is doing, the same thing the blackout is doing. Everything on this page is about something resolving out of atmosphere.

An earlier version scrambled the text instead. It was the wrong metaphor: scramble is a *computer* effect, and nothing in this world is a computer. The world is weather, altitude and distance, and the reveal has to belong to it.

Restraint is the whole game here. One video, one typeface, one sentence broken across six steps, no chrome until the story is finished. Anything added past that dilutes it.

---

## 2. Decisions locked

| Decision | Choice | Why |
|---|---|---|
| Stack | Static HTML + CSS + JS, GSAP from CDN | Fastest iteration loop on the one hard problem (the pinned reveal sequence). Push-to-deploy on GitHub Pages, no build step. |
| Scroll model | Pinned hero, **one line per scroll step** | Deterministic line order. A phrase declares its own in/out range, so lines can accumulate rather than swap. Not tied to the video timeline. |
| Display type | Panchang (Fontshare / ITF) | Already licensed and downloaded locally. |
| Hero footage | **The ASCII treatment**, not the clean plate | Four steps of black have to pay off with something worth the wait. Also makes the binary-digit scroll cue cohere. |
| Case studies | 3–6 | Hand-authored pages are manageable; markup kept template-ready. |
| Line reveal | Focus pull — blur + scale, resolving to sharp | Optical, not digital. Belongs to a page about weather and distance. |
| Animation lib | GSAP 3 + ScrollTrigger + CustomEase | All free for commercial use since Webflow's April 2025 change — no Club membership, license key, or auth token. |

---

## 3. Assets

### Hero video

`ascii-magic-1.mp4` — the ASCII treatment, not the clean plate.
2720 × 1536 · 30fps · 5.87s · 8.7 MB source

This reverses an earlier decision ("ASCII clip — not used on homepage"). It's the right call for a reason that only became visible once the page went pitch black: **the setup is four steps of white type on nothing.** When the frame finally opens, it has to be worth four steps of waiting, and a photograph of a cabin isn't — a photograph of a cabin dissolving into characters is.

It also makes the rest of the page cohere. The scroll cue is binary digits; the reveal is the world resolving into data. One idea, two places.

**Encoding.** ASCII is dense high-frequency detail and compresses badly — the naive settings that gave 1.35 MB on the clean plate gave 5.3 MB here. Settled at **1600 wide, 24fps, CRF 24**:

| File | Size |
|---|---|
| `hero.mp4` (H.264, faststart) | 2.49 MB |
| `hero.webm` (VP9) | 1.75 MB |
| `hero-poster.jpg` (1280w) | 122 KB |

Only one video is ever fetched, so real transfer is **2.15 MB** on the webm path, **2.91 MB** on mp4 — both inside the 3 MB budget.

1600 rather than 1920 was decided by looking, not by the number: side by side at display size the two are indistinguishable, and the 1600 is arguably cleaner because it carries less compression noise. Character detail going marginally soft is far less legible a fault than photographic detail going soft, which is what made the trade cheap here.

**The poster is not preloaded.** The frame is black until step 5, by which point the video is playing. Preloading the still would have been 122 KB spent on something almost nobody sees. It stays in the markup for reduced motion, where it replaces the video entirely.

**Seamless loop.** Same technique as before — the last 0.8s crossfaded back over the first, giving a continuous 5.08s loop:

```
[0:v]scale=1600:-2:flags=lanczos,fps=24,eq=contrast=1.02:saturation=1.02,split=2[a][b];
[a]trim=0:5.067,setpts=PTS-STARTPTS[base];
[b]trim=5.067:5.867,setpts=PTS-STARTPTS,format=yuva420p,fade=t=out:st=0:d=0.8:alpha=1[tail];
[base][tail]overlay=shortest=0,format=yuv420p[v]
```

**The grade is baked in, not applied in CSS.** Never put a CSS `filter` on a playing video — it costs a compositing pass every frame for an adjustment nobody can consciously see.

**Grain dropped to 0.025** (from 0.05). The ASCII frame is already dense texture; grain on top of it is noise on noise.

Attributes: `autoplay muted loop playsinline preload="auto"`. `muted` and `playsinline` are both required or iOS refuses to autoplay.

### The dither

`ascii-magic-3.mp4` — the same shot as a cold magenta halftone. **One element, one use:** it is the layer the hero dissolves into, and it is also the surface the Work section sits on. Not two copies of the clip in two sections — see §7 for why that was built twice and thrown away twice.

Chosen over `ascii-magic-2` (a soft blue mosaic) because the halftone reads as *a machine's version of the place* rather than a filter applied to it — and because its near-white sky is what the teal folders sit against.

| File | Size |
|---|---|
| `dither.mp4` (H.264, faststart) | 1.38 MB |
| `dither.webm` (VP9) | 1.79 MB |
| `dither-poster.jpg` (1200w) | 166 KB |

**mp4 is listed first, unusually.** The halftone is even denser high-frequency noise than the character pass, and VP9 handles it worse than x264 rather than better — at matched quality the webm came out 30% larger. So the source order is reversed from the hero and h264 is what nearly everyone gets; the webm stays only as the fallback for builds without proprietary codecs. (Worth knowing: Playwright's bundled headless Chromium is one of those builds, so without the webm the dissolve silently renders nothing under test — `networkState 3`, no error.)

1400 wide rather than 1600. At CRF 31 that lands at 1.38 MB and the dot grid is still crisp; the grid is the entire aesthetic, so this was checked by looking at a frame, not by the number.

**Same seamless-loop crossfade as the hero** — last 0.8s faded back over the first, giving a 5.08s loop. This one matters more than the hero's: the hero clip is under a blackout for most of its life and on screen for a few seconds, whereas this holds the loop for the whole of Work. A visible cut every six seconds under six folders would be the first thing anyone noticed.

`preload="none"`, with `hero.js` calling `load()` at the island reveal — two gestures of lead time, and nothing before that point pays for a byte. The poster is functional, not decorative: it's what the layer shows if the buffer isn't ready, and without it a slow connection crossfades the frame to nothing.

### The sprite

`Sprite.png` — a 1024² sheet, twenty poses in a 5×4 grid, already transparent. Painted rather than pixelled, and at 140×225 per figure far too detailed for the window it sits in.

**Quantised, not just downscaled.** Each pose is resampled to 72px tall with `BOX` (area-average, so detail collapses rather than aliases), then every pixel is snapped to the nearest palette colour, then alpha is hard-thresholded at 140. The threshold is the part that matters: leaving the antialiased rim in place gives a small painting, and the whole point is that it should look drawn on a grid. The hoodie lands on `--shadow`/`--deep`, the trousers on `--dune`, the skin on `--grass` — the sprite ends up sharing a palette with the photograph it stands on, which is the only reason the two read as one image.

72px, having looked at 56, 84 and 96. At 56 the face is mush. At 84 and above the extra detail is inherited from the painting, so it reads as a downscaled illustration rather than a deliberate bitmap — and the face is measurably *worse*, because more pixels means more mid-tones to average the eye and brow into.

### The face looked blurred, and wasn't

The first build shipped with a head that read as smeared. It wasn't blurred — `image-rendering: pixelated` was applying and the body pixels were hard squares. It was **under-resolved and starved of contrast**, and two separate things were causing it.

**The palette had a hole in it.** Sampling the head showed six colours, dominated by `--moss` (luma 107) and `--shadow` (62) — two dark neighbours. The gap between `--moss` at 107 and `--stone` at 152 is exactly where shaded skin wants to sit, and with nothing there every one of those pixels fell to moss. The face collapsed into one dark mass with a few light specks on it.

Fixed by **doubling the ramp**: a midpoint inserted between each adjacent pair of tokens, 9 steps to 17. These are not new colours — each is the blend of two already-sampled ones, so "every value came out of one photograph" still holds.

**A mean erases the features a face is made of.** `BOX` downsampling averages, and the glasses, eye and brow are 1px dark lines at the source scale — they average straight out. An unsharp mask at full resolution before the downscale exaggerates them enough to survive it. That alone is the difference between an eye and a smudge.

**Order of operations, learned the hard way.** Running the olive-to-teal rotation *after* the unsharp mask painted cyan across his cheek: the ringing around his glasses landed inside the olive test. Hue decisions belong on the original values; contrast decisions come after. The build script now asserts zero cyan in the top quarter of the strip — and that check is on the *head* specifically, because a 45% threshold fails on the coffee pose, where the mug is legitimately at chest height.

`tools-make-sprite.py` at the project root does all of this and is committed. `Sprite.png` is not — it's 1.7 MB of source producing a 11 KB asset.

**The mug is teal on purpose.** The sheet's only saturated colour is the mug and backpack, and they read as *yellow-green* — R and G close, B far below both — so the obvious "G greater than R" test never fires. The test is olive-ness (`min(R,G) − B > 45`, `|R−G| < 25`) and the rotation keeps G, lifts B to meet it and drops R. Thresholds are set against the rest of the sheet rather than by eye: skin sits at a 33 gap, cream trousers at 28, the hoodie at 19.

It exists because teal is the folder colour. One accent shared between the sprite and the files is what stops the two halves of the desktop looking like two different pieces of art.

Output is a five-pose strip, 265 × 72, **11 KB**, stepped by `background-position`. `image-rendering: pixelated` is not optional — it's shown at 3× and without it the browser smooths it back into the painting it started as.

### The folder icon

`folder_icon2.png` (2048², teal) keyed off its black background into `media/folder.png` — 512², trimmed to content and square-padded, 209 KB.

Alpha from the max channel rather than luminance (the teal has no red, so a luma key ate the shadows), soft-thresholded 12→42, and the edge pixels un-premultiplied so the antialiased rim doesn't read as grey fringing against a bright plate. The key is why the icon can sit on the halftone at all — a black card behind it would have been six black rectangles on a photograph.

### Scroll cue

Step 0 is a pure black frame with nothing on it, which is indistinguishable from a page that failed to load. A tumbling grid of binary digits sits above the "Scroll" label and fixes that — the frame reads as alive rather than broken.

**It is decoration, not a loading state.** It blocks nothing, waits on nothing, and reports nothing. An earlier build made this a full-screen loader gated on `fonts.ready` and the video's `loadeddata`; that was a misreading. It is part of the cue, it appears with the cue at 600ms, and it leaves with the cue permanently on the first input.

That last part is what earns it a place. The rotating glyph cut from step 4 was perpetual motion sitting next to text; this runs only on the one frame that has nothing else on it, and stops the moment you act. Motion with a job and an end.

Adapted from a [Uiverse component by PriyanshuGupta28](https://uiverse.io/PriyanshuGupta28/bright-bobcat-12), **recoloured from matrix green to `--ink`**. The green would have been the only saturated colour on a site whose palette is sampled entirely from one photograph. Binary digits fit now the hero is the ASCII treatment — the cue and the film are the same idea.

Three changes from the source component:

- **Scaled to 72 × 96** with 14px digits, from 120 × 160 at 18px. It sits above a 13px label; at full size it dominated the corner it's supposed to quietly occupy.
- **Stagger halved** to 0.09s steps. At the source's 0.2s the eighth digit doesn't arrive until 1.5s and the grid spends most of its life half-empty, which reads as a bug rather than an effect. At 0.09s it's fully alive inside 0.7s.
- **Fall distance reduced** to 28px from 50px, to suit the smaller grid.

### The step ledger

A column of dots down the right edge, **one per line**, the current one filled.

The cue and this answer different questions. The cue asks *is this page broken?* — it exists because step 0 is a black frame, it carries the digit grid, and it leaves permanently on the first input. The ledger asks *how much further?*, and that question is live on every frame of a gated scroll. Taking the page away from someone and giving them no sense of how long you intend to hold them is the single most common way this pattern fails.

**It replaced a chevron**, which answered the same question badly. "There is more" is half of it; the half people actually want is how much more, and six dots give both for the same footprint.

**It counts sentences, not gestures.** Steps 2 and 3 are two halves of one thought held apart across the frame; a dot each said the story was longer than it is, and implied the two fragments were separate ideas — the opposite of what the diagonal is for. A phrase carrying `data-continues` still costs a scroll and still gets its own reveal; it just shares the dot the step before it lit. Six steps, five dots.

```html
<div class="phrase pos--br" data-in="3" data-out="4" data-continues>
```

**Both the count and the mapping come out of the markup.** `LAST` is derived from the phrases and `data-continues` collapses steps into dots, so adding a line to `index.html` — or deciding two of them are one sentence — stays a single edit to that file.

Three conditions, each about not saying the same thing twice:

- **Not at step 0.** The scroll cue owns that frame and already has an arrow on it. The ledger takes over from step 1, where there is a line to be one-of-six of.
- **Not while the cue is still up**, even at step 1 — the cue leaves on the same gesture that brings the first line, so the ledger waits out its 360ms fade rather than crossing it.
- **Not once the files have landed.** Below them is only the footer, the chrome's progress rule is on screen by then, and a *story* counter over the work is counting the wrong thing.

`rgba(251,247,240,.3)` at 8px, active at full `--ink` and `scale(1.5)`. `.22` was right against the black setup frames and vanished on the lit island at step 5 — the one frame where the ledger has real competition. Size alone is too quiet at 8px and colour alone reads flat; together the active dot is findable without a glance costing anything.

**Nothing in it moves and nothing loops.** A dot changing colour is the whole transition. On a page arguing that one thing moves at a time, the progress indicator is the last place to spend a second movement — which is also why it needs no reduced-motion exception.

**Reduced motion holds the digits still** at 0.55 opacity. A grid of characters tumbling *and* flickering is a lot of motion, and flicker in particular is hostile to photosensitive users — the shape stays, nothing moves, nothing strobes.

**The cue starts `hidden` and is `hidden` again 340ms after dismissal**, so the digit animation is never running on the compositor when nobody can see it — neither before it arrives nor for the rest of the session after it goes.

**No loading screen and no play fallback.** `font-display: block` already holds the type until Panchang arrives, and muted + `playsinline` autoplays everywhere except iOS Low Power Mode, where a refusal degrades to the poster still rather than a broken state.

### Typefaces

**Panchang** — display. All hero lines, section headings, the wordmark.
Local at `Panchang_Complete/Fonts/WEB/`. Ship the **variable** woff2 only (`Panchang-Variable.woff2`, 37 KB) rather than seven static cuts — one request instead of seven, and it unlocks the full 200–800 `wght` axis for the reveal.

```css
@font-face {
  font-family: 'Panchang';
  src: url('/fonts/Panchang-Variable.woff2') format('woff2');
  font-weight: 200 800;
  font-display: block; /* not swap — a FOUT mid-reveal looks broken */
  font-style: normal;
}
```

Plain `format('woff2')` — not `woff2-variations`. The latter is a deprecated string that some browsers treat as unknown and skip the source entirely; the `font-weight: 200 800` range is what declares it variable.

`font-display: block` is a deliberate departure from the vendor CSS. The hero lines must not swap face mid-reveal — with a focus pull the substitution happens while the line is blurred, which looks like a rendering fault. Block for the hero, and preload it:

```html
<link rel="preload" href="/fonts/Panchang-Variable.woff2" as="font" type="font/woff2" crossorigin>
```

**Calfine** (DEMO) — the wordmark, and nothing else.

A condensed high-contrast display serif, loaded for exactly eleven characters: "NEEL PARIKH" on the last frame of the story. Using it anywhere else would turn a signature into a typeface. 6 KB, because the file only carries the glyphs it has.

**The mix has a rule.** Calfine throughout, except the two E's, which are Panchang Extrabold. The repeated letter *is* the rule — a two-face wordmark without one reads as a ransom note, and "which letters look nice in which face" is not a rule anyone else can apply later. Panchang runs at `0.8em` because it's a wide face next to a condensed one and needs the reduction to sit at the same apparent cap height; both are baseline-aligned by default, which is the other half of what keeps the mix from looking accidental.

Set at `clamp(2.6rem, 13vw, 13rem)` — considerably larger than `--type-hero`. Calfine is condensed enough to take it without wrapping.

Letters are marked up individually, so the wordmark carries `aria-label="Neel Parikh"` and the spans are `aria-hidden` — otherwise some screen readers spell it out.

⚠️ **This is the DEMO cut.** Fine for a personal site; check the licence before any commercial use. Demo releases usually forbid it, and this one carries 66 glyphs against a full family's several hundred.

**Sprat** (SIL OFL) — Extended Light, one weight, **work titles only**.

The single-typeface homepage was the wrong call. Panchang everywhere reads as monotony, not restraint, and it lets the page below the fold turn into a different, generic website. Sprat is a high-contrast extended didone — about as far from Panchang's geometric sans as the two files in this repo get — and the face changes exactly where the subject changes: the hero is one person shouting into cloud, the titles are the evidence.

Rules, because this is the kind of thing that spreads:

- Titles only. Not the meta, not the notes, not the footer.
- One weight. A second cut would make it a system rather than an accent.
- Never as running text. At 52px it's elegant; at 17px the thin strokes fall apart. The card notes are Panchang Light for exactly this reason.

Converted from the source OTF to woff2 with fonttools — 18 KB.

**Body/UI** — system stack. Nothing on the homepage needs a second webfont.

```css
--font-ui: ui-sans-serif, -apple-system, 'Segoe UI', Roboto, sans-serif;
```

Licensing: Panchang ships under the Fontshare Free License — web use permitted at any scale, worldwide. Self-host the woff2; do not re-distribute the font folder in a public repo beyond what the site serves. **Add `Panchang_Complete/` and `Sprat-type-master/` to `.gitignore`** and commit only the single woff2 the site actually loads.

---

## 4. Colour

Sampled from the hero footage. The palette is the video — nothing is invented.

```css
:root {
  --cloud:    #EBDCBF;  /* lit cloud, warm white */
  --dune:     #D7C7AB;  /* cloud mid-tone */
  --grass:    #C7AF8E;  /* sunlit grass */
  --stone:    #9F9887;  /* neutral warm grey */
  --moss:     #706B58;  /* shaded grass */
  --shadow:   #453E2B;  /* cast shadow */
  --deep:     #22231A;  /* deepest terrain */
  --void:     #10130E;  /* near-black, page bg + Work section */

  --ink:      #FBF7F0;  /* hero text — warm white, never pure #FFF */
  --ink-dim:  rgba(251, 247, 240, 0.80);
  --ink-faint: rgba(251, 247, 240, 0.32);

  --halo: 0 1px 28px rgba(16,19,14,.50), 0 0 2px rgba(16,19,14,.35);
}
```

`--ink-dim` is 0.80, not the 0.55 this spec originally carried. Measured against the composited frame, dim text at 0.55 landed at **2.5:1** over the bright cloud band — a straight fail. 0.80 still reads as recessive next to full `--ink` and clears AA.

Pure `#FFFFFF` is banned. It reads as a foreign object against a frame with no true white in it; `--ink` is the cloud highlight lifted a few points.

### Legibility — measured, not guessed

Mean luminance by band on frame 70:

| Band | Mean L | Range |
|---|---|---|
| Top third | 193 | 32–241 |
| Middle third | 117 | 10–234 |
| Bottom third | 59 | 4–207 |

The top third is bright cloud. **White text there fails contrast outright.** Since the storyboard places lines across all three bands, a scrim is not optional.

```css
.hero__scrim {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(120% 90% at 50% 45%, rgba(16,19,14,.68) 0%, rgba(16,19,14,0) 80%),
    linear-gradient(180deg, rgba(16,19,14,.52) 0%, rgba(16,19,14,0) 40%),
    linear-gradient(0deg,   rgba(16,19,14,.44) 0%, rgba(16,19,14,0) 30%);
}
```

A centre-weighted radial rather than a flat overlay: it protects the text without flattening the sky, and keeps the cliff edge and cloud detail readable.

A black vignette sits above the scrim, doing a different job — the scrim protects the type, the vignette gives the frame depth and pulls the eye to the middle:

```css
.hero__vignette {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(125% 95% at 50% 48%, rgba(0,0,0,0) 38%, rgba(0,0,0,.42) 82%, rgba(0,0,0,.62) 100%),
    radial-gradient(78% 100% at 50% 50%,  rgba(0,0,0,0) 55%, rgba(0,0,0,.28) 100%);
}
```

Two centred stops rather than one. A single gradient at this strength leaves a visible ring where the falloff starts; a wide soft pass plus a tighter corner push reads as optical falloff instead of an overlay. Pure black here, not `--void` — the vignette sits on the image, and black keeps it from looking like a coloured wash.

Two further stops, anchored at the top-left and bottom-right corners, carry step 5's copy. See §6 — they are the fourth attempt at that problem and the only one that doesn't look like a caption box.

It also helps contrast at the edges, where the chrome lives: the nav went from 5.70:1 to 6.44:1, the mark from 8.90:1 to 10.01:1.

Every `.line`, the chrome, and the scroll cue also carry `text-shadow: var(--halo)` — a soft dark halo buys roughly two points of contrast without darkening the frame any further. Cheaper than a heavier scrim, and it keeps the image looking like an image.

### Measured results

Only steps 5 and 6 sit on the video — steps 0–4 are text on #000 at roughly 16:1 and need no checking. Composited over six frames of the loop, worst case, foreground computed at each line's actual opacity:

| Region | Contrast | |
|---|---|---|
| Step 5 — the ask | 6.72:1 | pass |
| Step 6 — name | 12.58:1 | pass |
| Step 6 — sub-line | 10.74:1 | pass |
| Chrome mark | 10.51:1 | pass |
| Chrome nav | 7.07:1 | pass |

These values are load-bearing. Weakening any of the three gradient stops, or dropping the halo, puts step 5 back under 4.5:1. Re-run the check if the hero video is ever re-rendered — a brighter grade changes all of it.

**Never add `contain: paint` to `.line`.** Paint containment clips an element to its own box, and `--halo` is a 28px blur living almost entirely outside the glyph bounds — an earlier build carried `contain: layout paint` and was quietly clipping away the thing these figures depend on. There is no `contain` on `.line` at all now; the focus pull animates `filter`, `transform` and `opacity`, none of which touch layout, so there is nothing to scope.

---

## 5. Type scale

Fluid, viewport-relative. Panchang is geometric and wide — it needs negative tracking at display sizes or it sprawls.

```css
--type-hero:   clamp(2.75rem, 7.5vw, 8rem);    /* "Continent" */
--type-line:   clamp(1.25rem, 2.6vw, 2.5rem);  /* standard beat lines */
--type-sub:    clamp(1rem, 1.75vw, 1.6rem);    /* beat 5 sub-line */
--type-label:  0.8125rem;                       /* nav, meta, caps */

--track-hero:  -0.03em;
--track-line:  -0.01em;
--track-label:  0.08em;

--leading-tight: 0.95;
--leading-line:  1.15;
```

Weights: beat lines at `wght 500`. "Continent" at `wght 600` (tracked +0.22em). Sub-lines at `wght 400`. The name at `wght 800`.

`--type-sub` was raised from `1.15rem` after rendering it: sitting under a display line it vanished. Beat 5 also takes an explicit larger `gap` — the name needs air beneath it before the sub-line lands, and the default row gap was closing it up to nothing.

---

## 6. Scroll choreography

### Structure

The hero is a `100vh` section pinned by ScrollTrigger for the duration of the sequence. Scroll distance is allocated per beat, not to the video — the video loops independently and is never scrubbed.

```
scroll distance = Σ GAPS × 100vh   (5.3 units → 530vh)
```

### Gated input — one gesture, one line

**Position-driven snapping is not enough.** Snap resolves to the nearest beat, so two quick scrolls travel far enough to land on beat 3 and beat 1 never plays at all. The lines get skipped, and the whole argument of the page is that you read them in order.

So input is intercepted and gated instead. Inside the pin, `wheel`, `touchmove` and the scroll keys are `preventDefault`ed and translated into exactly one beat step. The page then glides to that beat's scroll position while the line resolves.

**The lock.** From the moment a step starts, input is held until the line has resolved, then released after a short quiet period — `QUIET` = 110ms of silence, **or `QUIET_CAP` = 380ms, whichever comes first.**

The cap is the important part, and the first build didn't have one. It waited for silence with no upper bound, and every input event refreshed the timer — so a user scrolling continuously could hold the lock open indefinitely. Which is precisely what people do when a page stops responding: they scroll harder. Simulated against a wheel event every 16ms, the uncapped version didn't release until the user *stopped* scrolling; the capped version releases 380ms after the animation settles, always.

**Momentum is filtered by shape, not waited out.** A flick's `deltaY` decays toward zero; a hand still on the pad doesn't. `MOMENTUM_MAX` is deliberately low (10) because a slow deliberate trackpad scroll also produces small deltas, and locking slow scrollers out of the page is a far worse failure than an occasional double-advance. Its remaining job is narrow: stop a decayed tail landing *after* the lock has lifted and advancing a line nobody asked for.

**Input during the lock is discarded, not queued.** ~~One step of intent is remembered and fires the instant the lock lifts.~~ It used to be queued, on the reasoning above — that swallowing a deliberate gesture is the single biggest reason a gated scroll reads as broken. That reasoning was wrong about *which gesture it was catching*.

What actually arrives during the lock is the tail of the flick you already spent. So the queue turned one gesture into two lines: the line you asked for, and then a second one arriving on its own about 400ms later, while you were still reading the first. In use it reads as the page scrolling by itself and eating the reading time — which is a worse failure than a dropped input, and the input isn't really dropped, because the gesture that would have been queued is the same gesture that already advanced you.

**A line now holds until you deliberately scroll again.** Measured: four single wheel notches 2.5s apart advance exactly four beats; one flick of eight decaying events advances exactly one.

**Never trap the user.** The gate applies only inside the pin, and never at either end of it. At beat 0 scrolling up, or beat 5 scrolling down, the handler returns *without* `preventDefault` and the page scrolls normally. Keyboard (`ArrowUp/Down`, `PageUp/Down`, `Space`) goes through the same path, so the pin is never a keyboard trap, and the skip-link to `#work` bypasses the hero entirely.

Scroll-jacking is a real cost and it is not free. It is justified here because the hero is a five-line linear narrative seen once per visit, and the gate is the only way to guarantee the lines are seen in order. It would not be justified on a content page.

### Interruptibility

Gating removes most of the failure mode, but the guards still matter — a scrollbar drag bypasses the gate entirely.

1. **Re-entry guard.** `applyBeat` early-returns if the incoming index equals the active one. ScrollTrigger's `onUpdate` fires every scroll frame; without it the timeline rebuilds ~60×/second.
2. **`overwrite: 'auto'`** on every tween, so competing tweens on the same node resolve instead of fighting.
3. **Skip-ahead collapse.** If the index jumps by more than 1 — only reachable by dragging the scrollbar now — hard-set the skipped lines to their resolved state and pull focus on only the destination. Playing four reveals in sequence to catch up looks broken.
4. **`onUpdate` yields to the lock.** During the glide, `if (locked) return` stops ScrollTrigger fighting the programmatic scroll.

### Containment

The focus pull animates `filter`, `transform` and `opacity` only — no layout, no text mutation. The cost that remains is the blur, which is real (Safari especially), so: values stay modest, only one beat animates at a time, and `will-change: filter, transform, opacity` goes on at `onStart` and comes off the moment the line settles.

Do **not** add `contain: paint` to `.line`. It clips the element to its own box, and `--halo` is a 28px blur living almost entirely outside the glyph bounds — it silently deletes the contrast the measurements depend on.

### The unit is the line, not the group

**One scroll advances one line.** Not one section — one line. Each phrase in the markup declares its own lifespan:

```html
<div class="phrase pos--tl" data-in="2" data-out="4">
  <span class="line line--body">all by their self,</span>
</div>
```

`data-in` is the step it appears on, `data-out` the step it leaves (omit it and the phrase stays for good). A range rather than a single index is the whole trick: it's what lets "all by their self," still be on screen when "one must seek" lands beneath it, so the diagonal *builds* instead of swapping. One scroll is one line, but a line doesn't have to leave when the next one arrives.

`LAST` is derived from the markup, so adding a line to `index.html` is the only edit needed to lengthen the story — the scroll distance, the snap stops and the step count all follow.

**Phrases that stay drop to 0.55 opacity** once they're no longer the line being spoken. Still there, still legible (0.55 white on black is about 6:1), but no longer the thing you're reading. Without it the two fragments compete and the eye doesn't know where the sentence currently is.

### Step sequence

| Step | Dot | Frame | On screen |
|---|---|---|---|
| 0 | — | black | — *(scroll cue + digit grid, 600ms)* |
| 1 | 1 | black | No man is an island… |
| 2 | 2 | black | all by their self, *(upper left)* |
| 3 | 2 | black | all by their self, *(receded)* · one must seek *(lower right)* |
| 4 | 3 | black | a piece of the / C o n t i n e n t |
| 5 | 4 | **island** | wave a hand or send a boat… *(upper left)* · lets work together. *(lower right)* |
| 6 | 5 | island | Neel Parikh · handoff to chrome |
| — | — | **halftone** | *the tail: dissolve, then the six files* |

Six steps, five dots: 2 and 3 share one, because they are one sentence.

The copy is Donne. The structure is unchanged from the build it replaced — six steps, same positions, same reveal point — because the shape was never about the particular words; it was about a sentence arriving one fragment at a time.

**Step 2 → 3 is the one that earns the structure.** "all by their self," sits upper-left, "one must seek" arrives lower-right a full scroll later, and for one step they're both on screen with the whole diagonal of the frame between them. That distance is the isolation the sentence is describing, made spatial — and it only works because they don't share a step.

Both fragments carry `white-space: nowrap`. Breaking "one must seek" across two lines turns a hesitation into a stack, and on a narrow screen the orphan reads as a layout bug rather than a pause.

**Step 3 → 4 holds 1.3×** in scroll allocation. The pause after "one must seek" is the setup for the word.

**Step 4 is the emptiest frame on the biggest idea.** Two lines in one phrase, so the stagger hands you "a piece of the" and then the word 70ms later. "Continent" is tracked out at +0.22em on pure black — the only positive tracking on the site. Everything else here is set tight, so letting this one word breathe makes it read as a label on a specimen rather than a shout. A negative right margin cancels the trailing letter-space so it stays optically centred.

`--split` widens the gap between the two lines: at the phrase's default `1.4vh` the set-up sits on top of the payoff like a kicker, and it's meant to be a beat before it.

**Step 5 is the reveal, and it closes the diagonal it opened.** The island appears during the travel; both halves of the ask resolve onto it, upper-left and lower-right — the same two corners step 2 → 3 used. The sentence opens across the frame and shuts across it.

These two are the only lines on the site that **wrap**, so `pos--tl` and `pos--br`'s `nowrap` is lifted for them and a measure is set instead. The measure lives on the `.line`, not the phrase: `ch` resolves against the element's own font-size, and `.phrase` never sets one — it inherits 16px from the body while the line inside runs at 37px. A 24ch measure on the phrase came out 192px wide and broke the sentence into seven lines.

**Step 6 — Handoff.** The story ends and the site begins. A transformation, not a new line:

- The site mark arrives at top-left — "Marooned." at `--type-label`, caps, `--track-label`. It no longer grows out of a word on the previous step, since step 4's display word is now "Continent"; the mark fades and scales in on its own. Whether the mark should follow the copy to "Continent." is an open question — see §11.
- A thin progress rule draws across the top — the reading position indicator, present from here down
- `NEEL PARIKH` **rises up out of a clipping mask** at bottom-left, arriving from below the frame rather than resolving in place
- The pin releases and the Work section scrolls up over the video

The chrome is a **fixed sibling of `.hero`, not a child of it.** As an absolutely-positioned child it scrolled away with the hero the instant it was born, so the rule whose entire job is to persist was visible for about half a second. It carries a small top gradient so it stays legible over whatever ends up in the work tiles.

The nav is born out of the story rather than sitting on top of it from the first frame. This is the detail that makes the homepage feel authored.

**The wordmark rises; it does not pull focus.** This is the one place the reveal changes, and that's the point — step 6 is where the story stops and the site starts, so the change of mechanism marks the boundary. Reusing the focus pull would make the handoff read as one more line.

```js
gsap.fromTo(line, { yPercent: 115 }, { yPercent: 0, duration: 0.95, ease: 'npOut' });
```

Transform only, so it stays on the GPU. **No fade** — the mask does the concealing, and cross-fading as well would undercut the illusion that the type is a physical thing moving past an edge. The mask carries `padding` with matching negative `margin` so the halo and any overshoot have somewhere to live at rest without opening a gap in the stack. The sub-line follows 0.12s behind. Reduced motion drops the travel entirely and fades instead — a full wordmark sweeping up the frame is exactly the kind of large positional move the setting exists to remove.

**How the chrome handoff is built.** A FLIP move, with three rules:

1. **Transform only.** Measure the start and end rects, then animate with a single `transform: translate() scale()` string. Animating `top`/`left`/`font-size` triggers layout on every frame and will drop frames while the video plays.
2. **CSS or WAAPI, not a JS tween.** Predetermined motion belongs off the main thread. This is the one moment the browser is busiest — pin release, section mount, video playing — and exactly when a main-thread `requestAnimationFrame` tween stutters.
3. **Ease is `--ease-move`.** The element travels across the screen rather than entering or exiting, so it needs acceleration *and* deceleration.

If the shrink reads as two objects rather than one move, add `filter: blur(2px)` at the midpoint and clear it on land. Keep it under 20px — Safari makes heavy blur expensive.

### Timing

Per beat, from the moment it becomes active:

| Phase | Duration | Ease |
|---|---|---|
| Glide to the next beat's scroll position | 0.42s | `move` |
| Focus pull out (previous), concurrent with the glide | 0.42s | `out` |
| Settle — empty frame after landing | 0.08s | — |
| Focus pull in | 0.8s | `out` |
| Sub-line offset | +0.25s | — |
| Hold | until the next gesture | — |

### The line waits for the landing

Travel and reveal do not overlap. The old line dissolves *while* the page moves, so you land on an empty frame; the new line only starts once the page has stopped.

Running them together was wrong, and it's worth being precise about why: while the page is travelling, the whole frame is in motion, and a line resolving inside a moving frame competes with that motion instead of owning it. You end up reading during travel and the reveal gets lost. Separating them gives each phase one job — the scroll delivers you, then the line speaks.

The 0.08s settle is small but load-bearing. Landing and immediately firing the reveal reads as one continuous mechanical event; a single beat of stillness first makes the line feel like a response to arriving rather than part of the scroll.

Full cycle per step: **~1.3s** (1.55s on step 6, which has a sub-line). That's the price of the gate and it's the right one for a six-step story seen once per visit — but it is the number to watch if the sequence ever grows.

**Both directions use ease-out, not ease-in.** Ease-in on the exit delays the first moment of movement — the exact frame the eye is on — and reads as lag rather than departure. Exit is fast *and* immediate.

Step 3 → 4 holds longer via extra scroll allocation — 130% of a standard step. The pause after "one must seek" is the setup for the word.

Out is always faster than in. Arrival earns time; departure doesn't.

### The focus pull

```js
gsap.fromTo(line,
  { opacity: 0, scale: 1.06, filter: 'blur(' + line._blur + 'px)' },
  { opacity: 1, scale: 1,    filter: 'blur(0px)',
    duration: 0.8, ease: 'npOut' }
);
```

**The tracking settle comes free from the scale.** At `scale(1.06)` the glyphs sit measurably wider apart and close to their true tracking as the line resolves — you get the typographic read without animating `letter-spacing`, which would cost a layout pass on every frame. `filter`, `transform` and `opacity` are all GPU.

**Blur depth is calibrated against font size, and lives in CSS** as `--blur-in`, read once per line at init:

| Line | `--blur-in` |
|---|---|
| `.line--hero`, `.line--name` | 15px |
| default (body, article, aside) | 8px |
| `.line--sub` | 5px |

8px reads as genuinely soft on a 40px line and as barely-touched on a 128px one. The number belongs next to the size it's calibrated for, not in a JS constant.

**Blur is the expensive part** — Safari especially. Three mitigations: values stay modest, only one beat animates at a time, and `will-change: filter, transform, opacity` is applied on `onStart` and dropped the moment the line settles.

**The exit mirrors at half the duration** (0.42s) — back out to `blur(0.7×)` and `scale(1.03)`. The line goes out of focus the way it came in, so leaving reads as the thought receding rather than a light switching off. Ease-out in both directions; ease-in on the exit would delay the first frame of movement, which is the frame the eye is on.

**Reduced motion drops the optics and keeps the fade.** A focus pull is movement in the vestibular sense — the frame appears to breathe — so blur and scale both go and only opacity remains.

### What this simplified

Removing the scramble removed a whole class of problem with it. The text no longer mutates, which means:

- No restoring `textContent` after an interrupted animation
- No `aria-hidden` window during which a screen reader would read gibberish — the DOM always holds the real sentence
- No `data-text` mirror of every line
- No `contain: layout` to scope per-frame reflow
- One fewer script (`ScrambleTextPlugin`)

The only `aria-hidden` left is permanent, on beat 4's two echo lines.

---

## 7. Work section — the desktop

**This section replaces the stacked `.work-item` rows entirely.** Those were the weakest part of the build and the part that made the page feel unfinished: the hero was authored and the work index was a portfolio template. Near-black background, 16:9 cards, `01 / 02 / 03` markers, hover-scale. A different website below the fold. The rationale that survived it is at the bottom of this section.

The replacement: **the man on the cliff has a laptop, and the work section is what's on it.**

### The dissolve

The hero plays `ascii-magic-1` — the warm character-overlay pass. `ascii-magic-3` is the same shot rendered as a cold magenta halftone. Chosen over `-2` (a soft blue mosaic) because the halftone reads as *a machine's version of the place* rather than a filter on it, and because its near-white sky gives the folders something to sit against.

The dissolve runs across a **pinned tail** — a seventh entry in `GAPS` with no phrase attached to it. `LAST` is still derived from the markup and stays at 6, so the step machine never lands there; `step()` refuses to advance past `LAST`, the wheel handler hands the gesture back, and you scroll freely through a hero that is still pinned. That ungated stretch is what the dissolve is scrubbed against, and it has to be ungated — a crossfade tied to a gated step snaps between two states instead of passing through them.

Four things ride the same scroll:

1. the halftone fades in over the warm pass
2. scrim, vignette and grain go to zero — the halftone is its own grade, and the previous shot's lighting left switched on is just wrong
3. the wordmark leaves, at 1.6× the rate, so the picture change leads and the text follows rather than reading as one crossfade
4. `--plate-wash` fades in: a top band for the chrome, a bottom band for what comes next

`nearestStop()` is clamped to `LAST`. Without it a scrollbar drag into the tail resolved to step 7, which the phrase logic reads as "the wordmark is no longer the newest line" and dims to 0.55. The tail is not a step.

### There is no second screen

**The dissolve resolves INTO the Work section.** The halftone stops being a picture of the island and becomes the thing the island's laptop is showing, and the files arrive on that surface. One plate.

Two earlier versions are worth recording, because both looked correct on paper.

**Version one: a second section, full bleed.** The Work plate arrived edge to edge at identical framing to the hero's dither layer, then pulled back to reveal a frame. The theory: two copies of one image with a moving edge between them have no visible edge, so the handover hides itself. It leaves a hard horizontal seam straight across the viewport, because **the hero is still translating as the section arrives** — one image is moving and the other is anchored, so they can be the same picture and still never line up. There is no version of a wipe between a scrolling layer and a fixed one that hides itself.

**Version two: a framed window that seats itself.** That fixed the seam — the window arrived as an object over the dark page, in 4% oversized, settling to true as it reached the top. It worked and it was still wrong, and the fault is only visible in motion: you scrolled through a full screen of the halftone to arrive at *another full screen of the halftone*. The transition did all the work and was then immediately repeated. Neither version was a rendering problem. Both were the same structural mistake — treating the transition and the destination as two things.

So the whole of Work now lives inside the pinned hero, as an absolutely-positioned `<main>` over the dither layer. `<main>` nested in `<section>` is legal (main may not descend from `article`/`aside`/`header`/`footer`/`nav`) and it keeps the site's actual content inside the landmark rather than stranding it in a decorative hero. Below the hero there is only the footer.

**The tail budget.** `TAIL = 1.9` screens: one of dissolve, a quarter before the files land, and ~0.65 of dwell. `DISSOLVE_END` and `DESK_AT` are both derived from `TAIL` rather than typed in, so retuning the dwell doesn't silently retune the dissolve.

The files land a quarter-screen *after* the frame has finished turning, not on the same beat — two things resolving at once is one event, and the desktop appearing is supposed to be its own.

Dwell is load-bearing and it is also the thing to keep short. Hovering a folder while the frame under it is still resolving is unusable, so there has to be somewhere to stand afterwards — but every notch of dwell is a scroll that changes nothing, and the rest of the page has trained you that one gesture moves the story on. 2.2 screens felt like the page had stopped responding. 1.9 gives about five wheel notches of standing room.

### The folders

Six, in a **3 × 2 block on the left half** of the plate, with the About window on the right. Wraps to 3 × 2 stacked above the window below 1000px, and to 2 × 3 below 560px. `folder_icon2.png` keyed off its black background (`media/folder.png`), which is also why the icon can sit on a bright halftone at all.

**The grid is capped at 48rem, not fluid.** Left to fill a 1440px column the three cells came out 380px wide with a 100px icon adrift in each — icons on a desktop sit near each other, they don't get distributed across the furniture. The leftover between the last column and the window is empty desk, which is what a desktop mostly is.

**Two columns below 560px, not three.** Three columns on a 390px screen gives each label about 110px, and `PRODUCT · 2026` set in caps with tracking is wider than that — the meta lines ran straight through each other into one unbroken string. Two columns costs a row of height the window can spare.

**They pop.** Scale from 0.8 with the origin at the bottom, on `--ease-pop` (`cubic-bezier(0.34, 1.46, 0.64, 1)`), 55ms apart. These are objects appearing on a surface; a fade would say "another layer of the composition" instead. Overshoot is used here and nowhere else — on a hover response it reads as sloppy, on an arrival it reads as weight. The last one lands at ~660ms, which is over the 300ms ceiling UI motion holds to, and it should be: this is an entrance, the narrative tier, not a response to a pointer.

**Icon sizing is per-breakpoint, not one clamp.** The sizes are driven by `vw`, which collapses to the clamp floor the moment the row count drops — six across at 1400px and three across at 820px both landed on a 58px icon, and at three across that looks like a bug. Re-floored at each breakpoint.

**Keyboard.** The folders are inside the pinned hero and invisible for most of the page's life, so tabbing in from the skip link lands on something you cannot see. Rather than pull them out of the tab order — which would make the site's actual content unreachable without a scroll wheel — `focusin` on `.work` jumps the page to `DESK_AT`. Instant, not glided: this is a focus correction, not a transition, and animating the scroll under someone who just pressed Tab is the kind of helpfulness that loses people.

**The spill.** Three sheets anchored just inside the folder's mouth, fanned upward on hover, `z-index` below the folder art so they read as coming out of it. Outer sheets travel less far and lean harder; the middle goes highest and stays near-upright, which is what stops the spread reading as a symmetrical arc. The whole fan lands inside **290ms** — under the 300ms ceiling everything that isn't narrative motion holds to.

The travel is deliberately short. The first pass cleared the folder entirely and the sheets floated above it with daylight underneath, which is three pictures *near* a folder. Their bottom edges have to stay tucked behind the folder's top edge.

> The sheets are placeholder SVGs in `media/placeholder/`. Swapping in real case study stills is three `src` changes per folder; the fan geometry is driven by `:nth-child` and doesn't care what the image is.

**A bug worth remembering:** the reset's `img { max-width: 100% }` resolves against the containing block, and the spill's anchor is a zero-width element — so every sheet collapsed to zero area while opacity and rotation applied perfectly. Invisible in devtools until you check the computed width. `.folder__sheet { max-width: none }`.

### The About window

Files on the left, the person who made them on the right. That's the argument the whole page has been making, so it lands in one frame rather than two.

**Shaped as a media player**, because a player is a window whose entire job is to tell you what someone is doing right now — which is what an About section is for and almost never says. Five poses, five captions, stepped together by a two-button transport.

**Everything in it works.** No play, no pause, no shuffle, no volume slider: there is nothing here to play or shuffle, and a transport of five dead glyphs and two live ones is set dressing. The three title-bar squares are the one exception and they're honest about it — no hover, no cursor change, nothing that invites a click.

**It moves when you press it and not otherwise.** An avatar cycling on a timer would be the third piece of ambient motion this page has refused, and it would be doing it a few hundred pixels from six things you're meant to be reading. The transport wraps in both directions — greying out at the ends would claim the poses are a sequence, and they aren't.

**Bitmap rules, held completely or not at all.** 2px borders, zero radius, one solid unblurred drop shadow, monospace chrome, integer pixel values instead of the fluid `clamp()`s used everywhere else on the site. Every softness elsewhere on this page is doing a job; here softness is the thing being argued against.

**Same palette as everything else.** The window reads as retro because of its *edges*, not because it brought its own colours — the black-and-electric-blue dialog box in the reference would have been a second colour scheme on a page whose every value was sampled from one photograph. The only borrowed accent is the folder cyan, on the track position.

**Monospace, not a pixel webfont.** A pixel face would be a fourth typeface and another download on a page already carrying two videos. Monospace is what a terminal actually uses, and the scroll cue's digit grid was already set in it — the register was on the page before this window was.

**A bug worth remembering:** the window shipped visible. `.work` is absolutely positioned over the hero from the first paint, and the folders had their own reveal gated on `[data-desk]` while the window didn't — so an opaque bitmap window sat on the black opening frame for the entire story. `pointer-events: none` stopped it being *clickable* and did nothing about it being *visible*. It now arrives 300ms behind the icons: six at 55ms apart finish at ~330ms, and a window landing inside that stagger would read as a seventh icon rather than the thing the files turn out to be sitting beside.

### The desk gets darker

Moving the files from one row along the floor to two rows beside a window broke `--plate-wash`. The old curve was flat until 62% because nothing lived above that line; the top row of folders now sits at 63% and its labels measured **2.4:1** against the cloud. The fall starts at 38% instead.

Which turns out to be the better picture as well as the readable one. The sky stays bright, the bottom half drops into shadow, and the frame stops being a photograph with icons on it and starts being a lit room with a desk in it.

### Contrast, measured

The halftone's sky is near-white, which broke three things that had been fine over the previous footage.

- **The chrome.** The nav sat at 2.7:1 over the cloud. `.chrome::before` deepened to .86 and extended past the bar's own height so it falls off instead of ending in an edge. Now 5.5:1.
- **The file names.** `--ink-dim` measured 3.7:1 on the folder over the bright cloud on the right. They run at full `--ink` — which is also the right hierarchy, since the name is the label and the role/year is the annotation. 6.8:1.
- **The role/year.** `--ink-faint` was legible in theory and invisible in practice. `.75` alpha is the floor that clears 4.5:1 everywhere.

All of these were measured **against glyph coverage**, not against the label's bounding box. Sampling the box includes empty area beside the letters and reported passes that weren't real.

**Below 1000px the gradient wash is replaced by a flat .76 veil.** `--plate-wash` protects the top and bottom and leaves the middle of the picture alone, which works when the files are one row along the floor of the frame. Two or three rows put labels straight through the brightest part of it, where 11px caps measured 2.3:1. Replaced, not stacked — stacking crushed the sky to mud for no benefit, since the chrome sits above the plate at that width. The halftone is near-white against near-black and survives being dimmed by two thirds. Dimming the wallpaper for the sake of the icons is what a desktop does.

### Carried over from the old work section

**It settles on `--deep`, not `--void`.** Every colour on this page was sampled from the video. A neutral near-black at the fold throws that away and lands on the same dark-mode default every other portfolio uses. `--deep` (#22231A) is the frame's own shadow tone.

**No numbered markers, no section header, no "Selected Work" label.** `01 / 02 / 03` is the template answer and these projects aren't a sequence. The handoff needs momentum.

**Press scales down, hover scales up.** An `:active` that scales up slightly less than hover isn't feedback, it's nothing. And every hover is gated behind `(hover: hover) and (pointer: fine)` — an ungated `:hover` sticks open after a tap on touch, which looks like a bug.

**The old descent gradient is gone.** `.work` no longer dissolves up out of the video across 20vh, because the plate covers the fold on its own and the descent is now the window arriving.

---

## 7b. Case study pages

Structure adapted from [Portal](https://useportal.net/). What's borrowed is the **information hierarchy and the motion restraint** — not the visual language. Portal is light, achromatic, one iOS blue; this site is dark and warm with every colour sampled from one frame of video. Taking their palette would delete ours. Everything below is Portal's skeleton wearing our tokens.

### The one lesson worth stealing

**Every H2 on Portal is a claim written as a sentence, never a label.**

> "Stop chasing clients for payments. Instead, make paying dead simple."

not "Payments". Not "Features". Not "Overview". The heading does the arguing; the paragraph underneath only supports it. Applied to a case study, this is the difference between a page that reads like a portfolio and one that reads like someone who can think:

| Label heading (don't) | Claim heading (do) |
|---|---|
| The Problem | Nobody could find the thing they came for. |
| Research | We watched twelve people fail the same task. |
| Solution | One screen, not five. |
| Outcome | Support tickets about navigation dropped by half. |

If a heading could sit on any case study on the internet, it isn't finished.

### Register: this is Read, not Persuade

Portal's homepage is selling; a case study is explaining. The visitor's success is *"I understand what happened and I believe he did it."* Two consequences, both non-negotiable:

- **No scroll gate.** The homepage's one-line-per-gesture lock is the right call for a five-line story seen once. Applying it to a 1,500-word case study would be hostile. Case studies scroll normally.
- **Motion recedes.** The homepage owns the drama. Down here motion is one thing only: a short fade-and-rise as blocks enter, once, never repeating. See *Motion* below.

### Skeleton

```
┌────────────────────────────────────────────────────┐
│  [ fixed chrome — MAROONED.        WORK  CONTACT ] │
├────────────────────────────────────────────────────┤
│                                                    │
│              F U L L - B L E E D                   │  ← 70svh. One still or
│              project atmosphere                    │    silent loop. The
│                                                    │    project's own weather.
├────────────────────────────────────────────────────┤
│  ░░ gradient dissolve into --deep ░░               │  ← same descent as the
│                                                    │    homepage → work
│      Project Title            (Sprat, 48-72px)     │
│      Role · Year · Team       (Panchang label)     │
│                                                    │
│      One sentence on what changed. 24-28px,        │  ← the standfirst.
│      --ink, max 30ch. This is the whole case       │    If a reader only
│      study compressed to a single line.            │    reads this, it works.
│                                                    │
│  ── hairline ──────────────────────────────────    │
│      CONTEXT   6 weeks · 2 designers · Figma       │  ← facts strip, one row
│  ── hairline ──────────────────────────────────    │
├────────────────────────────────────────────────────┤
│                                                    │
│      ## Claim heading, one sentence.               │  ← Sprat 36-44px
│      Body paragraph. 16-18px Panchang Light,       │    max 66ch column
│      1.65 leading, --ink-dim.                      │
│                                                    │
│      [ full-width figure + caption ]               │
│                                                    │
│      ## Another claim.                             │
│      Body.                                         │
│                                                    │
│      ┌──────────┐  ┌──────────┐                    │  ← paired detail blocks
│      │ h3 + 2   │  │ h3 + 2   │                    │    (Portal's H5 pattern)
│      │ lines    │  │ lines    │                    │
│      └──────────┘  └──────────┘                    │
│                                                    │
├────────────────────────────────────────────────────┤
│      ## How it was actually made.                  │  ← THE PROCESS SECTION
│                                                    │
│      01   Step heading                             │    numbered, because
│           Two lines on what happened here.         │    this genuinely IS
│      02   Step heading                             │    a sequence
│           …                                        │
│      03   …                                        │
├────────────────────────────────────────────────────┤
│      ## What it did.                               │  ← outcome. numbers if
│      Big figures + one line each.                  │    they exist, honest
│                                                    │    prose if they don't
├────────────────────────────────────────────────────┤
│      ## What I'd do differently.                   │  ← the reflection block
│      First person, 3-5 sentences, signed.          │    (Portal's founder memo)
├────────────────────────────────────────────────────┤
│      ← Previous project        Next project →      │
│      [ back to all work ]                          │
└────────────────────────────────────────────────────┘
```

### Section by section

**1 — Atmosphere.** 70svh, full-bleed, one still or silent loop from the project. Not 100svh: a full viewport reads as a second homepage and delays the title. The same `linear-gradient` descent dissolves it into `--deep` over the last 20vh, so the transition matches the one the homepage already uses.

**2 — Title block.** Title in Sprat Extended Light (the face is already reserved for work titles — this is the same job at full size). Role/year in Panchang caps at `--type-label`.

**3 — Standfirst.** The single most valuable element on the page, and the one most portfolios skip. One sentence, 24–28px, at full `--ink` while everything below it is `--ink-dim`. It is the case study compressed to a line: *what was wrong, what you did, what changed.* Write this first — if you can't, the project isn't ready to publish.

**4 — Facts strip.** One row between hairlines: duration, team size, your role, tools. Panchang caps, `--ink-dim`. Answers "how much of this was you?" before the reader has to wonder, which is the question every hiring manager is silently asking.

**5 — Body.** Single column, `max-width: 66ch`, alternating claim-heading → paragraphs → figure. Portal's section gap is 80–120px; ours is `clamp(5rem, 12vh, 9rem)`. Do not shrink it. The whitespace is what makes long-form reading feel considered rather than dumped.

**6 — Paired detail blocks.** Portal's H5-plus-paragraph pattern, two up. For things that are genuinely parallel — two constraints, two options considered. Never more than two per row; three becomes a feature grid and the page turns into a product site.

**7 — Process, numbered.** The one place numbering is honest. The homepage work index had `01 / 02 / 03` and I removed it because those projects aren't a sequence — a process is. Numbers in Sprat at `--type-hero`-ish scale, `--ink-faint`, sitting left of each step.

**8 — Outcome.** Real figures if they exist. If they don't, say what changed in prose and don't invent a percentage — a fabricated metric is the fastest way to lose a reader who has shipped things.

**9 — Reflection.** Portal signs off with a first-person founder memo, and it's the warmest thing on their site. Ours is *"What I'd do differently"* — first person, 3–5 sentences, honest about a mistake. It's the section that makes a portfolio sound like a person rather than a case-study generator, and the one most people are too nervous to write.

**10 — Onward.** Previous/next by name, not by arrow alone. A reader who finishes should never have to hunt for the next thing.

### Type

| Element | Face | Size | Colour |
|---|---|---|---|
| Project title | Sprat Ext Light | `clamp(2.4rem, 6vw, 4.5rem)` | `--ink` |
| Standfirst | Panchang Light | `clamp(1.35rem, 2.4vw, 1.75rem)` | `--ink` |
| Claim heading (h2) | Sprat Ext Light | `clamp(1.75rem, 3.4vw, 2.75rem)` | `--ink` |
| Detail heading (h3) | Panchang Medium | `1.125rem` | `--ink` |
| Body | Panchang Light | `clamp(1rem, 1.25vw, 1.125rem)` / 1.65 | `--ink-dim` |
| Labels, facts, captions | Panchang Medium caps | `--type-label` | `--ink-dim` |
| Step numbers | Sprat Ext Light | `clamp(2rem, 4vw, 3.25rem)` | `--ink-faint` |

Panchang Light at 1.65 leading is the one place on this site with real running text. The homepage never has more than eight words on screen; a case study has paragraphs, and the leading has to open up to match.

**Calfine appears nowhere on these pages.** It is the wordmark and only the wordmark.

### Motion

Portal's restraint is the point. One effect, used everywhere, never repeating:

```css
.reveal { opacity: 0; transform: translateY(18px); }
.reveal[data-in] {
  opacity: 1; transform: none;
  transition: opacity 620ms var(--ease-out), transform 620ms var(--ease-out);
}
```

Driven by `IntersectionObserver` with `{ threshold: 0.15 }` and **unobserved after firing** — a block that re-animates when you scroll back up is the tell of an unconsidered page. Stagger children 60ms. `prefers-reduced-motion` drops the translate and keeps the fade.

That is the entire motion budget for a case study. No parallax, no scroll-scrubbed figures, no counters ticking up, no scroll gate. The homepage spends the drama; these pages spend attention on the words.

### What NOT to take from Portal

- **The palette.** Light canvas, `#007aff`, white cards. Ours is dark and warm and sampled from a photograph. This is the whole reason the site looks like anything.
- **Pill buttons at 50px.** Our chrome is hairlines and caps labels. A pill CTA would arrive from a different design system.
- **Glow rings** (`0 0 0 5px #f7f7f7`). That's an elevation language for a light UI. On `--deep` a pale halo would read as a rendering artefact. Our depth is the scrim and the vignette.
- **The marquee.** Two infinite scrolling strips of icons is a landing-page device for a product with many features. A case study has one subject.
- **Repeat CTAs.** Portal asks three times because it's selling. Asking once, at the end, is enough here — and the homepage already made the ask.

## 8. File structure

```
neel-parikh.com/
├── index.html
├── css/
│   ├── main.css
│   └── fonts.css
├── js/
│   └── hero.js          # beat state machine + ScrollTrigger + reveal
├── fonts/
│   └── Panchang-Variable.woff2
├── media/
│   ├── hero.mp4
│   ├── hero.webm
│   └── hero-poster.jpg
├── work/
│   └── {slug}/index.html
├── CNAME                # neel-parikh.com
├── .gitignore           # excludes font source packages, source mp4s, *.psd
└── design.md
```

GSAP from CDN, deferred:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/CustomEase.min.js" defer></script>
```

Deploy: GitHub Pages from `main`, root. `CNAME` contains `neel-parikh.com`. Enforce HTTPS in repo settings.

---

## 9. Accessibility

Non-negotiable, and cheap to get right here.

**Text is real text, always.** Nothing mutates `textContent` — the reveal is purely optical, so the DOM holds the finished sentence at every moment. Screen readers get the sentence; crawlers get the copy.

**No `aria-hidden` churn.** The old scramble needed lines hidden from the accessibility tree while they held gibberish. The focus pull never changes the text, so that machinery is gone entirely.

**Repeated lines are announced once.** Beat 4's three identical lines are a visual device — a signal repeating. A screen reader reading it three times is noise, so the two echoes carry `aria-hidden` permanently.

**Reduced motion.** `@media (prefers-reduced-motion: reduce)`:
- No blur, no scale — lines cross-fade only
- Video does not autoplay; the poster still replaces it
- ScrollTrigger pin remains (it's not motion in the vestibular sense) but the glide drops to 0.15s
- **The blackout still fades**, just faster (0.25s). Reduced motion means less movement, not no transitions — an opacity change isn't vestibular, and a full-screen black rectangle snapping on and off is considerably more jarring than a fade.
- **The dissolve still runs, as two stills.** The hero video is removed and its poster takes over as a background, but the dither element stays in the layout, never plays, and shows its own poster — so the tail cross-fades between two photographs. The folders cross-fade in place instead of popping.

The first attempt cut the dissolve entirely and revealed the files on the last step instead. That put the wordmark and six folders on the same screen, on top of each other. **The sequence isn't decoration**: the name has to leave before the work arrives, and that is true at every motion setting. Reduced motion means less movement, not fewer states.

**The skip link is `position: fixed`.** As an absolute element it positioned against the document, so focusing it while scrolled down parked it off-screen at the top of the page — a skip link that can't be seen is not a skip link.

**Keyboard.** The pinned section must not trap focus. A skip-link to `#work` is the first focusable element on the page, and `#work` carries `tabindex="-1"` so activating it moves focus rather than only the viewport.

Since Work now lives *inside* the pinned hero, the folders are invisible for most of the page's life — so tabbing to one would land focus on something that isn't on screen. Pulling them out of the tab order would make the site's actual content unreachable without a scroll wheel, so instead **`focusin` on `.work` jumps the scroll to `DESK_AT`**. Instant, not glided: this is a focus correction, not a transition, and animating the page under someone who just pressed Tab is the kind of helpfulness that loses people.

**Contrast.** Every line verified ≥ 4.5:1 against the scrimmed frame behind it, at the specific beat position — not against an average, and measured against **glyph coverage** rather than the phrase's bounding box. Sampling the box includes empty area beside the letters and reports passes that aren't real.

**Step 5 needed more light control, and it took four attempts.** `.hero__scrim` is centre-weighted — a radial at `50% 45%` plus a band top and bottom — because every line it was originally measured against sat near the middle. The new copy sits in the *corners* of a lit frame, where it is protected by almost nothing: **3.5:1** top-left and **2.8:1** bottom-right against the cloud.

Deepening the global scrim uniformly needed roughly `0.69` alpha across the upper and lower thirds, which flattens the one frame the entire first half of the page is waiting for. So the first three attempts all tried to put the darkness *behind the text*:

- A **radial sized to the text box** protects an inscribed ellipse. Text is a rectangle; its corners overhang. 4.2:1 and 3.6:1 — better, still failing.
- A **radial sized past the box** to cover those corners gets clipped by the box before it has faded, drawing a hard-edged dark slab across the frame. Visible from across the room.
- A **solid rect through a 20px blur** measured 7.7–11.6:1 and still read as a panel sitting on the picture.

That third one is the useful failure. **Passing the check is not the same as looking right** — a dark rectangle behind type on a photograph reads as a caption box on a stock image no matter how soft its edges are. The problem was never the shape of the backing; it was having a backing at all.

**The frame is what should be darker.** Two more stops on `.hero__vignette`, anchored *at* the top-left and bottom-right corners and fading inward:

```css
radial-gradient(80% 62% at 2% 26%,  rgba(0,0,0,.88) 0%, rgba(0,0,0,.52) 42%, rgba(0,0,0,0) 78%),
radial-gradient(80% 58% at 98% 76%, rgba(0,0,0,.88) 0%, rgba(0,0,0,.52) 42%, rgba(0,0,0,0) 78%),
```

Anchoring at the corner is the whole trick: the gradient has no visible extent, because the half of it that would show an edge is off the frame. It reads as light falling off, which is a thing photographs do. And it can be strong where the lines end and gone by the centre, so the cabin and the cliff stay open.

Corner-weighted rather than symmetrical because the composition is diagonal. If the copy ever moves, these move with it. **4.8–13.5:1** across breakpoints.

**Motion budget.** No parallax, no cursor-follow, no magnetic buttons. The video is the movement.

**Hover gating.** Every `:hover` rule on the site sits inside `@media (hover: hover) and (pointer: fine)`. Without it, touch devices fire hover on tap and elements stay stuck in the hovered state.

---

## 10. Performance targets

| Metric | Target |
|---|---|
| LCP | < 2.0s (poster image, not video) |
| CLS | 0 — `tweenLength: false` and fixed containers guarantee this |
| Total homepage weight | < 4.5 MB (was 3 MB — see below) |
| GSAP payload | ~70 KB gzipped, all three files |

Video is `preload="auto"` but LCP is served by the poster, so a slow video fetch never blocks the paint.

**The budget moved from 3 MB to 4.5 MB when the Work section became the dither.** Full first load on the mp4 path is **4.19 MB**, of which 2.9 MB is two videos. That's a real cost and it was taken deliberately: the second clip is the payoff of the whole page, and it's the only thing in Work — there is no separate set of project thumbnails to pay for on top of it.

The About window added 11 KB. A quantised five-pose sprite strip costs less than one project thumbnail would have.

What keeps it honest is that **almost none of it is on the critical path**. Only the hero clip is `preload="auto"`. The dither is `preload="none"` until the story reaches the island reveal; the folder icon and the placeholder sheets are small and below the fold. First paint is unchanged.

---

## 11. Open questions

1. **Video resolution** — can the source be re-rendered at 2560px? Decides whether the grain overlay is a choice or a patch.
2. ~~**Beat 3 rotating glyph**~~ — resolved: cut. Perpetual motion with no purpose.
3. **Mobile line breaks** — "designer without a team is…" needs a hard break under ~420px. Confirm the break point once type is on screen.
4. ~~**Work section transition**~~ — resolved: there is no transition, because there is no second section. The hero dissolves into the halftone across a pinned tail and the files arrive on that same plate. See §7.
5. **Beat 0 hold** — 2.5s before the scroll cue may be too long or too short. Tune live.
6. **The site mark vs. the copy.** The chrome still reads `MAROONED.` and the footer still says "The island has good wifi. Send a boat anyway." The story now runs on Donne — island, continent, *send a boat*. The footer echoes the new copy better than it did the old one, but the mark names a state the story no longer names out loud. Options: leave it (the mark is the condition, the copy is the argument out of it), or change it to `CONTINENT.` (the mark becomes the goal). Not a code change either way — one string in `index.html` and one in `hero.js`'s `showChrome`.
7. **Two apostrophes.** The copy carries `lets` twice where it means `let's`, and `all by their self` where `themself` would be standard. Both are as supplied and both are one-character fixes. Worth a decision before this goes in front of anyone hiring.

---

## 12. Build order

1. Static hero — video, scrim, Panchang loaded, one line hardcoded and centred. Confirm legibility on a real display before any animation.
2. Get the focus pull right on a single line. Tune `--blur-in` and `SCALE_IN` in isolation before anything else exists.
3. Beat state machine + ScrollTrigger pin. All five beats, forward and backward.
4. **Interruptibility pass.** Scroll through all five beats as fast as the trackpad allows. Nothing should pop, stack, or catch up. Do this before adding anything else.
5. Beat 5 transformation into nav (WAAPI, transform-only).
6. Work section and handoff.
7. Reduced-motion pass, contrast audit, mobile.

Do not proceed past step 2 until a single line resolving into focus looks genuinely good in Panchang at hero size. Everything downstream is a repeat of that one effect — if it's mediocre, the whole page is.

### Reviewing the motion

- **Slow it down.** Temporarily run every duration at 3× and watch. Timing faults that are invisible at speed — a sub-line landing out of sync, an exit that starts a frame late, an easing that stops abruptly — are obvious at 3×.
- **Frame-step it.** Chrome DevTools → Animations panel, for the beat 5 handoff especially. Coordinated properties drifting apart only show up frame by frame.
- **Come back tomorrow.** Review with fresh eyes the next day. You will see things on day two that were invisible on day one, every time.
- **Test on a real phone**, over local IP with Safari remote devtools. Scroll-pinning and video autoplay both behave differently on device than in a responsive-mode viewport.

---

**Sources**

- [GSAP pricing — all plugins free](https://gsap.com/pricing/)
- [Webflow makes GSAP 100% free](https://webflow.com/blog/gsap-becomes-free)
- [CustomEase docs](https://gsap.com/docs/v3/Eases/CustomEase/)
- [Panchang — Fontshare](https://www.fontshare.com/fonts/panchang)
