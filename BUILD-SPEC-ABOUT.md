# BUILD-SPEC-ABOUT.md

Hero pose-layer system + inline About section (scrolls below hero, not a separate page).

Read `CLAUDE.md` first for tokens/traps/precedence. This spec extends the hero behaviour described in `BUILD-SPEC-HERO-CLOCK.md` — the time-of-day illustration logic stays as-is; this adds a pose layer on top of it, plus new content below the hero.

## 1. Concept

Two independent, composited layers in the hero:

1. **Background layer** — the 4 existing time-of-day room paintings (day / golden hour / sunset / night), picked by the visitor's local clock exactly as already specced.
2. **Pose layer** — a transparent PNG of Neel, cut out on his own, absolutely positioned on top of the background at the same scale/seat position as the room art. Which pose shows is driven by cursor position over the hero. Poses are fully decoupled from time-of-day — every pose is valid on every background (see §3).

This replaces the earlier "12 full scenes" idea — we paint backgrounds once and poses once, then mix and match. Much less art than a full pose-per-time-of-day matrix.

## 2. Assets

Assets live in a `drawn-assets/` folder in the repo (adjust the path below if Neel's actual folder name differs — check the repo before hardcoding). Naming convention, already in use:

* Poses: filename contains `_pose` (e.g. `laptop_pose.png`, `reading_pose.png`)
* Backgrounds: filename is just the time-of-day (e.g. `day.png`, `golden.png`, `sunset.png`, `night.png`) — no `_pose` in the name

Claude Code: list the actual contents of `drawn-assets/` when building rather than assuming the exact filenames above — populate `HERO_BACKGROUNDS` and `HERO_POSES` (§3) from whatever's really in the folder, sorting into the two arrays by whether `_pose` appears in the filename. Since this is a no-build-step vanilla site, there's no runtime directory listing in the browser — the two arrays are a static list hardcoded from what's in the folder at build time, not computed at page-load. When a new pose or background is dropped into `drawn-assets/`, the arrays need a one-line manual update to include it.

Pose PNGs must all share the same canvas dimensions and the same anchor point (seat position) as the background paintings, so any pose can be swapped onto any background with zero per-pose positioning code. Confirm each new pose export uses the same canvas size before dropping it in — if that ever drifts, note it in CLAUDE.md's traps list rather than fixing it silently per-pose.

## 3. Data model

Backgrounds and poses are two flat, independent lists — no per-scene mapping needed, since every pose is valid on every background:

```js
// Populated from drawn-assets/ — backgrounds are named by time-of-day only,
// poses have "_pose" in the filename. Update this list when new art is added.
const HERO_BACKGROUNDS = ['day.png', 'golden.png', 'sunset.png', 'night.png'];
const HERO_POSES = ['laptop_pose.png', 'reading_pose.png'];
```

Background is picked by clock (unchanged from `BUILD-SPEC-HERO-CLOCK.md`). Pose is picked by cursor zone from `HERO_POSES`, independent of whichever background is currently showing. Adding a new pose is a one-line addition to `HERO_POSES` — nothing else to touch, no per-time-of-day bookkeeping.

## 4. Cursor → pose mapping

* Split the hero illustration area into horizontal zones — default: 3 zones (left third / middle third / right third of the illustration's bounding box).
* On `mousemove` over the hero, determine which zone the cursor is in; if it differs from the currently-shown pose's zone, swap to `HERO_POSES[zoneIndex % HERO_POSES.length]` — same lookup regardless of which background is currently showing.
* Debounce/throttle the zone check (e.g. only recompute on zone change, not every mousemove tick) — swaps should feel like discrete, deliberate changes, not jitter.
* No interpolation/morphing between poses — these are hand-painted, so it's a hard swap, not a crossfade. A very short opacity crossfade (~100ms) is fine to soften the pop if it looks bad flat-swapped; test both.

Scope: hero only. The pinned/sticky-scroll idea from earlier is dropped — since pose is now cursor-driven rather than scroll-driven, there's no reason for the illustration to follow you into the About section. About gets its own static layout (§6).

Open decision for Neel: 3 zones is a placeholder. If poses end up being more about "what he's doing" than "which side of the desk," a different zone shape (e.g. top/bottom, or a 2x2 grid) might map better once more poses exist. Revisit once pose 2 and 3 are painted.

## 5. Mobile / touch fallback

No cursor on touch devices. Default behaviour: show `poses[0]` for the active time-of-day and skip the mousemove listener entirely (check for touch support / lack of `hover` via `@media (hover: hover)` or a `matchMedia` check — don't rely on viewport width alone, since some laptops are touch+trackpad).

## 6. About section

Placement: new `<section>` directly below the hero, above "Chosen Work". Not a route change — `/about.html` stays unbuilt/unlinked for now; nav's "About" link anchor-scrolls here instead (update nav spec if it currently points elsewhere).

Content, in order:

1. Short about-me blurb — Neel writes this copy, per the standing rule. Leave a clearly marked placeholder in the HTML (`<!-- ABOUT COPY GOES HERE -->`) rather than generating filler text.
2. The experience/credential line (highest-priority open item from the handoff — the "4 years" line belongs here if it doesn't already live in the hero).
3. Tool-stack row: inline SVG icons, no external icon font/library. Initial set:
   * Figma
   * Adobe (use the generic Adobe "A" mark — confirmed with Neel)
   * Procreate
   * Claude

   Render as a simple flex row of icon + label pairs, sized consistently, using `--ink`/`--amber` for icon fill so they match the site's line-art motion signature rather than looking like imported brand badges. Source each SVG as a clean single-path/simple-shape mark — avoid pasting multi-layer brand SVGs wholesale, since those tend to carry unwanted fills/gradients that fight the design system.
4. Résumé link + AU work-rights line (open item #2 from the handoff) — put it here unless Neel wants it in the hero instead.

Layout: simple — this section's job is to hold real content, not introduce a new interaction. A two-column layout (blurb+credentials left, stack row right) or a single stacked column both work; don't over-build this relative to how little content it holds. No sticky illustration, no scroll-linked motion — that complexity was deliberately dropped in §4.

## 7. Explicitly out of scope for this spec

* Sticky/pinned hero illustration following scroll into About (dropped, see §4)
* Full pose-per-time-of-day art matrix (replaced by the layered approach in §1)
* `/about.html` as a separate route
* Any icon beyond the 4 listed — extend the same pattern later, don't pre-build slots for tools that aren't confirmed

## 8. Open decisions before/while building

* [ ] Zone count/shape for cursor mapping (placeholder: 3 vertical zones)
* [x] Whether "Adobe" icon means the generic mark or a specific app — **generic Adobe "A" mark, confirmed**
* [ ] Exact About section copy (Neel to write)
* [ ] Whether the experience line and résumé/work-rights line live here or in the hero

## Build notes (added when this spec was built)

* `drawn-assets/` doesn't exist as a repo folder — Neel's source PNGs live in `Drawn assests/` (typo, with a space) at the project root, sibling to `neel-parikh-site/`, outside the repo. Assets were pulled in and optimized into `neel-parikh-site/assets/hero/` following the existing convention (2560×1440 full + 1280×720 `-sm`, webp).
* The actual background files were `Morningtime.png`, `Noontime.png`, `Goldenhour.png`, `Nighttime.png` — confirmed to be the *same* room paintings as the existing `hero-morning/midday/golden/night` backgrounds, just with Neel's figure removed from the desk chair. The pose files `Reading_pose.png` and `Working_pose.png` are that same figure, cut out with alpha, at an identical seat anchor. All six share an identical 3840×2160 canvas, confirmed via `sips` before wiring anything in — no drift, no per-pose positioning needed.
