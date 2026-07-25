# BUILD-SPEC — Frosted-glass scroll-scrubbed intro — "hand drawn with love" + standalone spinning heart

**Status:** Built. Supersedes `BUILD-SPEC-PRELOADER.md` and `BUILD-SPEC-PRELOADER-V2.md` entirely — the black-screen blocking preloader is gone, along with the love→heart MorphSVG morph.

Replaces the old black-screen preloader (GSAP + MorphSVGPlugin, love→heart morph + letter-write-in, ~5.3s timed) with a frosted-glass intro over the blurred hero, driven by scroll. Vanilla + CDN only, per the documented GSAP exception in CLAUDE.md. GSAP is pinned at 3.13.0 sitewide — reuses the loaded instance. `MorphSVGPlugin` was dropped entirely (confirmed nothing else on the site called `morphSVG` before removing the script tag).

---

## Structure (as built)

* `#hero` itself is the pinned ScrollTrigger target — not a new section stacked above it. The real hero renders behind; `.intro-glass` is an absolutely-positioned child of `#hero` (`inset:0`, `z-index:20`, below the nav pill's `z-index:100`).
* Glass: `backdrop-filter: blur(18px)` + `-webkit-backdrop-filter`, wrapped in `@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))`. Base background is `rgba(244, 241, 234, 0.5)` (the `--paper` token's rgb decomposition at 50% — that same rule is the `@supports`-unsupported fallback automatically, no extra branch needed).
* Signature: `"hand drawn with love"`, `var(--font-voice)` (Fraunces) italic, built as one `.intro-char` span per character (including spaces) at runtime — matches the old preloader's own hand-built-span pattern rather than pulling in `SplitText` for a short, fixed string.
* Heart: the exact `Vector.svg` path (`Drawn assests/Vector.svg`, viewBox `0 0 134 123`), inlined directly after the word "love" inside the same `<p class="intro-signature">`, so it reads "hand drawn with love ♥" on one line.

## Animation (scrubbed to scroll, desktop ≥900px)

Single GSAP timeline on `ScrollTrigger({ trigger: '#hero', start: 'top top', end: '+=1400', pin: true, scrub: 0.5, anticipatePin: 1 })`. `end`'s `1400` is the main feel dial, called out with an inline comment at the tween site for easy tuning.

1. `"hand drawn with love"` writes in char-by-char — `stagger: 0.035`, `duration: 0.7`, `ease: power2.out`, rising from `y:14px`.
2. Standalone heart spins in beside "love" — `rotation: -230 → 0`, `scale: 0 → 1`, `ease: back.out(1.5)`, `transformOrigin: 50% 50%`, starting `-=0.15` before the text reveal finishes.
3. Brief hold (`0.6`), then signature (text + heart together, one `<p>`) fades up and out — `opacity/y`, `ease: none` (scrub already supplies the feel; per spec, `ease: none` stays on scrubbed *structural* tweens, `power2.out`/`back.out` stay on the char reveal and heart spin).
4. Glass clears via **opacity fade**, not blur-radius animation (GPU-heavy, janks on some machines/Android, needs `-webkit-` prefixing mid-tween) — `opacity: 1 → 0`, `ease: none`, overlapping the tail of the signature fade (`'<+=0.1'`).

## Mobile (<900px) and reduced motion

* `gsap.matchMedia()` with `isDesktop: '(min-width: 900px)'` / `isMobile: '(max-width: 899px)'` — **both must be registered**, not just one. (Real bug hit while building this: registering only `isDesktop` means the callback never fires at all on narrow viewports, so mobile silently got zero setup — no ScrollTrigger, cards/glass stuck at whatever their raw CSS/JS-set state was. `gsap.matchMedia()` only invokes the callback for conditions you explicitly list.)
* Mobile: no pin (backdrop-filter blur is the most likely thing to stutter here). Signature + heart render already-settled (`gsap.set` straight to end state), glass clears via a short **unpinned** `scrub` tween (`end: '+=400'`) on first scroll.
* `prefers-reduced-motion`: checked once, up front, before `gsap.matchMedia()` ever runs — skips pin/scrub/spin entirely, `glass.style.display = 'none'`, hero shown directly. Belt-and-braces with a matching `@media (prefers-reduced-motion: reduce) { .intro-glass { display: none; } }` CSS rule.

## Session gate

`sessionStorage.getItem('np_intro_shown')` — renamed from the old preloader's `np_preloader_shown` key since this is a functionally different feature (harmless either way; sessionStorage is per-tab and clears on close). An early inline `<script>` in `<head>`/`<body>` (before the hero markup paints) adds `html.no-intro` synchronously if the flag is already set, so `.intro-glass` is hidden by CSS before first paint on return visits — **and** the main setup script's own `if (alreadySeen) return;` skips calling `ScrollTrigger.create()`/`gsap.matchMedia()` entirely, so no pin-spacer gets created and there's no dead scroll space where the intro would have been. Verified: document height dropped by exactly 1400px (the pin's `end` value) between a first-visit load and a same-session reload.

## Build notes — the real trap this session hit

**Pinning `#hero` for the intro breaks the existing hero→About pose-scrub unless you fix it — and the "obvious" fix is wrong.** The hand-rolled pose-scrub (`#pose-scrub`, further down in the same script) decides when to start shrinking the hero pose image into its About-section landing spot using `zoneStart = heroHeightPx - ZONE_PX` / `zoneEnd = heroHeightPx`, compared against raw `window.scrollY` — implicitly assuming hero sits at document position 0 and that "scrollY approaching hero's own height" means hero is about to scroll out of view.

First attempt: assumed the intro's pin must be *shifting hero's document position down*, and "fixed" it by measuring `hero.getBoundingClientRect().top + scrollY` at measure-time. **This was wrong.** Pinning `#hero` itself (not inserting a new section above it) does **not** move hero's own document position — hero stays at document top 0 either way, confirmed via `getBoundingClientRect()`. What actually changes is that hero now *looks* frozen on screen for 1400px of scroll before it's free to scroll away normally — so the old zone (tuned for "scrollY ≈ heroHeightPx means hero's about to leave") now falls **inside** the still-pinned range and would have tried to run the About transition while the intro glass was still potentially on screen.

The correct fix: measure where `#about` (the very next section) actually sits at runtime — `aboutSection.getBoundingClientRect().top + window.scrollY` — and anchor the pose-scrub zone to that instead of reconstructing the pin math by hand. This is robust to the intro's pin duration changing (`end: '+=1400'` → anything else) without touching the pose-scrub code again, and degrades correctly to the pre-intro behavior when there's no pin at all (About's measured position just equals `heroHeightPx` naturally, matching the original assumption exactly). Verified end-to-end: `#about`'s measured top now reads `2120` (`720` hero height + `1400` pin), the pose-scrub zone triggers at `1620–2120` (after the pin releases, not during it), and progress reads `0`/`0.5`/`1` correctly at the zone's start/middle/end.

**General lesson for the next pinned section added to `/`:** don't assume "pinning an element changes its own document position" — it doesn't, if you're pinning the element that's already first in flow. What it changes is *how much frozen scroll happens before the next thing starts behaving normally*. Anything downstream that reasons about scroll position relative to a pinned element should measure the next real landmark's position at runtime, not reconstruct the pin's scroll-distance math.

## Traps avoided

* `ScrollTrigger.refresh()` called once after `document.fonts.ready` (the italic Fraunces signature can reflow late) and on `window.load`, then a synthetic `resize` event is dispatched so the pose-scrub's existing resize listener re-measures too — avoids reaching into its closure or duplicating its measurement logic.
* Confirmed `morphSVG` had zero other call sites on `index.html` (and no other page referenced `MorphSVGPlugin` at all) before removing the script tag and dropping it from `registerPlugin`.
* Did not touch the hero pose layer or cursor-pose crossfade system itself — only the pose-scrub's *zone timing* changed, per the spec's explicit instruction.
