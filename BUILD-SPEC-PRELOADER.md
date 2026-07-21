# BUILD-SPEC-PRELOADER.md — Homepage preloader

## Intent

Before the site loads, show a brief sequence that establishes the site's core premise — everything on this site is hand-drawn by Neel — through demonstration rather than text. The loader should feel like watching a sketch begin, not like a loading spinner.

## Sequence

1. **Black screen (~250ms hold)** Full viewport, solid black (`--color-ink` or true black, whichever reads better against the hero on load — test both). No visible UI. This is the "blank page" beat — long enough to register as intentional, short enough not to read as a stall.
2. **Line-draw animation (~800–1200ms)** A single SVG illustration draws itself in using the site's existing stroke-dashoffset signature (see CLAUDE.md — `pathLength` must be set as an SVG attribute, not in CSS, per documented site convention). Subject: something small and personal — a simple sketch of Neel, a desk object, or an abstract line portrait. Keep it to one continuous line if possible, or a small number of strokes drawn in sequence.
   * Vary stroke timing/easing slightly per segment (not uniform linear) so it reads as a hand drawing, not a mechanical reveal.
   * Line color: amber accent (`#e8a13a`) against the black background.
3. **Signature line (~300ms fade-in)** Text "illustrated by Neel" fades in near the drawn illustration — small, low-contrast, positioned like a watermark/signature (bottom-left or bottom-right of the illustration or viewport). Use the site's hand-lettered/script typeface if one exists in the type system; otherwise fall back to the smallest weight of the existing type stack. This should read as a signature, not a caption or headline.
4. **Exit transition** Loader fades/dissolves as the hero fades or scales in underneath. Match easing and duration to the hero's existing time-of-day illustration transitions so the handoff feels like one continuous system, not two unrelated animations.

Total duration target: ~1.5–2s from black to hero fully visible. This is a flourish, not a gate — do not let it run long enough that a returning visitor feels stalled.

## Behavior rules

* Frequency: Show once per session (sessionStorage flag), not on every page navigation within the site. Re-show on a fresh visit/new tab or after the session flag expires.
* Reduced motion: Respect `prefers-reduced-motion`. If set, skip straight to a static version (illustration fully drawn + signature visible, ~400ms hold, then fade to hero) rather than animating the draw-in.
* No blocking: The loader should not delay actual page/asset loading — it should run concurrently with (or slightly ahead of) real load, and its minimum display time should not exceed real load time by more than the sequence above. If assets are slow, prefer extending the line-draw stage subtly over adding a spinner or dead time.
* Skip on fast repeat visits: If sessionStorage flag is present, skip the loader entirely — no truncated version, just go straight to the hero.

## Technical notes

* Reuse the existing stroke-dashoffset draw-in mechanism already used for hero SVG lines — do not introduce a second animation system for this.
* Keep the preloader illustration as its own lightweight inline SVG (not a PNG) so the line-draw can be animated natively.
* Vanilla HTML/CSS/JS, no framework, no build step — consistent with the rest of the site.
* Follows CLAUDE.md spec precedence; add this file to the repo's committed spec set.

## Explicitly out of scope for this pass

* No loading percentage/progress indicator.
* No interactivity during the loader (no cursor response, no clicks).
* No sound.

## Build decisions — added while building

* **Scope: `index.html` only.** The spec's exit step explicitly hands off to "the hero" — that only means something on the homepage. Case-study pages have their own, unrelated hero systems; this pass doesn't touch them.
* **Background: `--ink` (`#141210`)**, not pure `#000`. It's the site's existing near-black token, already used for the nav pill and footer, and reads as part of the same warm palette instead of a colder true-black flash.
* **Illustration: a simple line-drawn coffee mug with steam**, four strokes (cup outline, handle, two steam wisps). Chosen over a face/portrait attempt — a hand-drawn portrait risks landing uncanny without real reference art to trace, where a desk object is easy to render cleanly and already echoes the mug/desk imagery in the hero paintings.
* **Signature typeface: falls back to the existing body stack (`DM Sans`, italic, small, low-opacity)** rather than pulling in `Caveat`. `Caveat`/`Fraunces` are documented in `CLAUDE.md` as About-page-only tokens — the spec's own fallback clause ("otherwise fall back to the smallest weight of the existing type stack") covers this without breaking that rule.
* **Exit sync, no new hero-side code needed:** `index.html`'s hero scenes already fade in via their own existing `opacity 1.4s ease` transition, triggered immediately on load by the clock JS (`.hero-scene.is-active`). The preloader's own timings (black hold + line-draw + settle ≈ 1.4s) were tuned to land right around when that existing fade completes, so the hero is already visible underneath by the time the preloader dissolves — "matching the hero's transition" by reusing it, not duplicating it.
* **Total budget used: ~1.8s** (250ms black + 900ms draw + 250ms settle/signature overlap + 400ms exit fade), inside the 1.5–2s target.
* **Flash-free skip for repeat visits:** a tiny synchronous inline script runs before the preloader markup and checks `sessionStorage` immediately, adding a class to `<html>` if the flag is already set. The CSS rule for that class hides the preloader before it would otherwise paint — not just skipped by JS after the fact.
