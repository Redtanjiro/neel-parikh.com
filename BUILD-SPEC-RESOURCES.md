# BUILD SPEC — Resources (quadrant canvas of stamps)

`/resources.html` + a fourth nav item.

Read `CLAUDE.md`, `BUILD-SPEC.md` (tokens), and `BUILD-SPEC-NAV.md` (the pill) first. This page is a pan/zoom canvas, not a grid — an earlier grid version of this spec is superseded.

**Status: built.** `/resources.html` ships with 12 placeholder entries (3 per quadrant) — see "Data" below for how to swap in real ones. Quadrant labels used: Reading / Inspiring / Silly / Useful.

## 1. What it is

A pan-and-zoom canvas divided into four labelled quadrants. Each resource is a postage-stamp card placed in the quadrant that describes it. Drag the background to move, scroll to zoom; a minimap shows where you are.

It's a taste-map: where a stamp sits means something. That spatial meaning is what makes this defensible rather than a decorative link-dump — a reviewer can read the map, not just scroll a list.

Desktop only. On mobile it becomes a clean grouped list (see §7). Deliberate and decided — drag/pan fights scroll on touch.

## 2. The canvas

* A fixed world larger than the viewport (~3000x2200; tune to content).
* Two faint axis lines cross at center, dividing it into four quadrants.
* Pan: drag empty space. Zoom: scroll wheel, toward the cursor.
* Transform via `transform: translate(x,y) scale(s)` — GPU only, never animate layout. `will-change: transform` on the canvas.
* A faint dot grid behind everything signals "this surface moves."
* Pan-vs-click guard: a stamp is a link on a draggable surface. Track pointer movement; if it moved >~3px between down and up, suppress the click (capture-phase handler, `preventDefault` when moved). Otherwise every pan fires a link.
* Use Pointer Events (`pointerdown/move/up` + `setPointerCapture`), not mouse events.

### Quadrants

Four named corners. Neel chooses the four labels — the most personal decision on the page. Working set: Reading / Inspiring / Silly / Useful.

* Giant ghosted quadrant labels (`--display`, ~64px, very low opacity) behind the stamps, so you always know the region.
* Every quadrant must have real entries. An empty corner breaks the concept. If Neel can't fill one, change the label to one he can.

## 3. The stamps

Each resource is a postage-stamp card. All CSS — no downloaded stamp asset.

Perforated edge = radial-gradient mask (not an image). **Layer order matters**: the solid base layer must be listed FIRST, with the 4 perforation gradients after, using `mask-composite: add, subtract, subtract, subtract, subtract` (and the matching `-webkit-mask-composite` list). Listing the solid layer last — as most write-ups of this technique show it — renders the whole element fully invisible in Chromium, with no console error. See CLAUDE.md trap #10.

```
padding: 9px;
background: #fbfaf5;
mask:
  linear-gradient(#000,#000),
  radial-gradient(7px at left,   transparent 98%, #000) 0 0   / 1px 15px repeat-y,
  radial-gradient(7px at right,  transparent 98%, #000) 100% 0/ 1px 15px repeat-y,
  radial-gradient(7px at top,    transparent 98%, #000) 0 0   / 15px 1px repeat-x,
  radial-gradient(7px at bottom, transparent 98%, #000) 0 100%/ 15px 1px repeat-x;
mask-composite: add, subtract, subtract, subtract, subtract;
```

Scales, recolours, zero image weight. Include both the `-webkit-` and standard `mask`/`mask-composite`.

Use `filter: drop-shadow(...)` for the shadow — NOT `box-shadow`, which would show the rectangular edge through the perforations.

### Anatomy

* Inner: 1px border, tiny radius, the screenshot; tag pill top-right (book/tool/toy/blog).
* Name (`--display`) + one-line note (`--body`, REQUIRED).
* Dashed divider.
* Quadrant name where a stamp's price would sit — `--amber`, `--display`. Franks each stamp with its category and ties the metaphor to the quadrants. Host domain (`--mono`, tiny, muted) beside it.
* Slight rotation (±3deg) so they read as placed by hand.

### Postmark — CONFIRMED, include it

Faint circular franking ring overlapping the top-right:

* Two concentric thin rings, rotated ~-12deg, low opacity (~0.5).
* Monospace text inside — `NP · 2026`, `AIR MAIL`, etc. Neel's call.
* `pointer-events: none`.
* Vary per stamp (angle, text) so they aren't identical franks.

### Hover

Stamp lifts and straightens to 0deg, shadow deepens, name goes amber. Gate behind `@media (hover:hover) and (pointer:fine)`, and further gate the transform/lift behind `(prefers-reduced-motion: no-preference)`.

## 4. Minimap

Bottom-left, ~150x110, representing the whole world:

* Four quadrant labels in miniature.
* Amber rectangle = current viewport, updates live on pan/zoom.
* Click-to-jump: click anywhere to center there. Required — the "I'm lost" escape hatch on any pannable canvas.

## 5. Controls

Bottom-right: zoom in (+), zoom out (-), "Fit all" (frames the whole world). On load, open focused near center at a legible scale, not fully zoomed out.

## 6. Data

Single `RESOURCES` array in the inline `<script>` — append one object to add an entry:

```
{ name, url, note, tag, quadrant, host, img }
```

* `quadrant` decides the region (must match a `QUADRANTS` id); layout fans stamps around that quadrant's center.
* Never hardcode stamps — all generated, including the mobile/a11y list.
* `note` REQUIRED — no annotation, doesn't ship. The one-line "why this" is the page's whole value.
* `img` is optional. Empty → graceful fallback tile (a big initial letter), not a broken image. When real screenshots exist, point `img` at a WebP and it lazy-loads automatically.

**Current state:** the array ships with 12 placeholders, notes prefixed "Placeholder —", `url`/`host` pointing at `example.com`. Swap them for real picks — nothing else in the page needs to change.

## 7. Mobile (<=820px)

No canvas. A clean list grouped by quadrant, each entry: thumbnail + name + note. Top banner: "This is a pan-and-zoom map on desktop — open it there for the full thing." This list is also the accessibility fallback (see §8) — not a throwaway.

## 8. Accessibility

The canvas is pointer-driven and will not be keyboard-navigable — accepted only because the list provides an equivalent, fully accessible path to every link.

* The grouped list must be keyboard + screen-reader reachable, every link present.
* Render the list in the DOM always (visually hidden on desktop via the standard clip-rect technique, not `display:none`) so assistive tech has it regardless of viewport.
* The entire canvas region (viewport, minimap, controls, hint) is `aria-hidden="true"`, and every focusable element inside it (`tabindex="-1"` on stamps and control buttons) is removed from the tab order — otherwise a keyboard user tabs through dozens of pointer-only, potentially off-screen elements with no way to see them.
* Stamps are real `<a href>`, `rel="noopener"`, new tab.
* `prefers-reduced-motion`: no hover lift/rotate, no smooth-zoom easing (instant jumps); stamps sit static at their rotations; page still works.

## 9. Weight

* Screenshots → WebP, lazy-loaded, capped dimensions. No raw PNGs.
* Broken image → graceful fallback (favicon / coloured tile), never a broken-image icon.
* Perforation mask + postmark are CSS — zero asset cost.

## 10. Traps

1. Don't animate layout — canvas moves via `transform` only.
2. Don't use `box-shadow` on the stamp — mask reveals its rectangular edge. Use `filter: drop-shadow`.
3. Don't skip the pan-vs-click guard.
4. Don't leave a quadrant empty — change the label.
5. Don't make all postmarks identical.
6. Don't ship without minimap click-to-jump.
7. Don't hardcode stamps — data-driven.
8. Don't ship raw PNGs — WebP, lazy-loaded.
9. Don't treat the mobile list as throwaway — it's the accessibility path.
10. Check the four-item nav on mobile — verify Resources doesn't overflow the shrunk pill.
11. **Mask layer order** — solid base layer first, perforation gradients after, or the whole stamp renders invisible. See CLAUDE.md trap #10.

## 11. Quality floor

* Pan + zoom smooth, transform-only, no layout thrash
* Zoom follows cursor; minimap tracks viewport + click-to-jump
* Stamps: CSS perforations, drop-shadow, slight rotation, varied postmarks, hover lift-and-straighten
* Quadrant name franks each stamp in amber; every quadrant populated
* Every entry has a one-line annotation
* Data-driven; new entry = one appended object
* Mobile = grouped list + banner, fully keyboard/SR accessible
* All screenshots WebP, lazy-loaded, graceful fallback
* Four-item nav fits mobile; new item has the hand-drawn amber underline
* `prefers-reduced-motion` respected
* No console errors
