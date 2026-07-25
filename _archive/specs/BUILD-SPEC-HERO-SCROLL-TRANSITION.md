# BUILD-SPEC-HERO-SCROLL-TRANSITION.md

The illustration follows the visitor from the hero into the About section on scroll.

Read `CLAUDE.md` first. This spec supersedes §4 and §6 of `BUILD-SPEC-ABOUT.md`, which explicitly dropped this behaviour — that call is reversed here. Everything else in `BUILD-SPEC-ABOUT.md` (asset naming, cursor→pose mapping, tool-stack icons) stands as-is; this spec only adds the scroll transition on top of it.

## 1. Concept

**Revised during build, from the original spec below:** only the *pose* (the transparent character cutout) follows the visitor down from the hero into About — the background room art stays in the hero and scrolls away normally with it. The pose is cropped tight to the character (see Build notes) rather than shown at the full room-art canvas size, since without the room there's nothing for the rest of that canvas to show.

Original framing, kept for context: while the visitor scrolls from the hero into the About section, the composited illustration (background + pose) stays pinned in place instead of scrolling away with the hero — About's text content scrolls up beside it. Once About's content is exhausted, the illustration releases and scrolls away normally.

This only applies on layouts wide enough for a two-column arrangement. See §5.

## 2. Structure

```html
<section id="hero-about-wrap">
  <div id="hero-illustration">
    <!-- existing bg + pose layers from BUILD-SPEC-ABOUT.md -->
  </div>
  <div id="about-content">
    <!-- About copy, credential line, tool-stack row, résumé link -->
  </div>
</section>
```

`#hero-illustration` and `#about-content` sit side by side (two-column) starting from wherever the hero currently ends and About currently begins — the hero's own full-width intro moment (before the two columns start) is unaffected by this spec.

## 3. Sticky mechanics

* `#hero-about-wrap` must be taller than `#hero-illustration` — its height is effectively `illustration height + about content height`, so there's room for `#about-content` to scroll past while the illustration holds still.
* `#hero-illustration` gets `position: sticky; top: <nav height + margin>;` — it pins when its normal scroll position reaches that `top` offset, and releases naturally when the bottom of `#hero-about-wrap` reaches it (standard sticky behaviour, no scroll-event JS needed for the pin/release itself).
* `#about-content` scrolls normally in its own column.
* No fade/scale/parallax on release — it just stops sticking. Don't add an exit animation unless a plain stop looks bad in testing.

## 4. Pose behaviour while pinned

Default: freeze on whichever pose was active when the pin starts. Background (time-of-day) stays exactly as picked at page load — unaffected by this spec either way.

**Build note:** implemented with zero extra JS. `#hero-illustration` duplicates only the `.hero-pose` elements (same classes, same `data-pose` attributes) already wired up by `BUILD-SPEC-ABOUT.md`'s existing `setPoseZone()` logic, which runs `document.querySelectorAll('.hero-pose')` — so the duplicate set is included for free. The cursor→pose `mousemove` listener is bound only to `.hero` (the original hero element), not to `#hero-illustration`, so once the visitor scrolls past the hero, no further mousemove events reach it — the duplicate naturally freezes on whatever pose was last active, satisfying the freeze default with no new code.

The `.hero-scene` background images are **not** duplicated here — only the pose. The room art stays in the hero and scrolls away with it normally; `#hero-illustration` is a transparent floating character only, using a tighter crop than the hero's (see asset note below), sized to `min(100%, 380px)` wide so it reads as an accent illustration next to the About copy rather than a room-sized panel.

## 5. Mobile / narrow viewports

No two-column room on mobile. Below the 820px breakpoint (same one `BUILD-SPEC-ABOUT.md`'s two-column About layout already collapses at), `#hero-illustration` is hidden entirely and `#about-content` reverts to exactly the single-column mobile layout already specced in `BUILD-SPEC-ABOUT.md` §6 — no second illustration on mobile at all, since the original About section never had one there.

## 6. Explicitly out of scope

* Any fade/scale/parallax effect during the pin or on release (see §3)
* Pose continuing to respond to cursor while pinned (see §4 — off by default)
* A mobile equivalent of the sticky effect — mobile stays as already specced

## Asset note — added during build

The hero's pose PNGs (`hero-pose-working.webp` / `hero-pose-reading.webp`, from `BUILD-SPEC-ABOUT.md`) are full 3840×2160-canvas exports so they align with the room backgrounds. The character itself only occupies roughly the right/bottom quadrant of that canvas — shown alone at full-canvas size that's a small figure with a lot of dead transparent space.

For this spec, cropped a **shared** bounding box (union of both poses' alpha bounds, plus padding — same box for both, so swapping poses in the sidebar doesn't jump or rescale) out of both PNGs, producing `hero-pose-working-crop.webp` / `hero-pose-reading-crop.webp` (+ `-sm` variants) in `assets/hero/`. Only these crops are used in `#hero-illustration`; the originals are untouched and still used in the hero itself.

## 7. Open decisions — resolved during build

* [x] Should pose keep responding to cursor while pinned, or freeze on pin — **froze on pin (default), per the recommendation in the spec**
* [x] Exact `top` offset for the sticky pin — **100px, matching the site's existing `scroll-padding-top` value** (same value that already accounts for the fixed nav pill's expanded height, per `CLAUDE.md` trap #5)
