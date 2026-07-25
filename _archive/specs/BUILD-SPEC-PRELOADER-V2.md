# BUILD-SPEC-PRELOADER-V2.md — Homepage preloader (GSAP + MorphSVG)

Supersedes `BUILD-SPEC-PRELOADER.md` (the stroke-dashoffset mug version) entirely — different mechanism, different asset, different timeline. `index.html` only, same as before: the exit hands off to the hero, which only exists on the homepage.

## Intent

Vanilla HTML/CSS/JS via CDN only — no npm, no build step, consistent with CLAUDE.md's no-framework constraint.

## Scripts

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/MorphSVGPlugin.min.js"></script>
<script>gsap.registerPlugin(MorphSVGPlugin);</script>
```

Loaded before site scripts. (`index.html` already loads GSAP core + ScrollTrigger + SplitText sitewide from the previous session — MorphSVGPlugin is added alongside those and registered together, not as a separate/duplicate `gsap` include.)

## Assets

`Love.svg` — the word "love" as four separate paths (L, o, v, e). `Vector.svg` — the heart as a single path. Both inlined into the preloader markup (no `<img>`) so GSAP can target paths directly.

* `Love.svg`'s four paths tagged: `id="loveO"` on the "o" path (second path in the file), shared `class="love-letter"` on L, v, e.
* Heart `d` string copied into a JS variable as the morph target. The heart's own inlined SVG stays hidden/unused (`display:none`) — only its path data is read.

## Timeline

1. "made with" and the inlined "love" fade/rise in together (`power3.out`, slight stagger).
2. Hold ~0.4s.
3. The three `.love-letter` paths (L, v, e) fade out (`power2.in`, stagger ~0.06). Simultaneously `#loveO` recolors to `#e8a13a` and morphs into the heart via `morphSVG: { shape: heartPathData, type: "rotational" }`, `duration: 0.9`, `power2.inOut`.
4. Subtle heart settle: small scale tween, `transformOrigin` at the heart's center, `back.out(1.4)`.
5. Hold ~0.4s, then the whole "made with ♥" line fades up and out (`power2.in`).
6. "illustrated by Neel" writes in letter by letter, individual `<span>`s built in JS. "illustrated" italic in `var(--font-voice)` serif; "by Neel" in the sans body font. Stagger ~0.045s/char, `power2.out`, y-offset reveal. "illustrated" finishes before "by Neel" starts.
7. Hold ~0.5s, then the whole overlay fades out (`power2.inOut`, ~0.7s), removed on complete.

## Constraints

* Show once per session (`sessionStorage`); skip → hero shows immediately, no overlay.
* Respect `prefers-reduced-motion` → skip animation, reveal hero directly.
* Don't touch hero time-of-day logic or the cursor-driven pose system.
* Fire only after DOM + inlined SVGs are ready.

## Build notes — added while building

* **Runtime vs. the ~3.5s target: actual sequence lands around ~5.3s, not under 3.5s.** Summed from the *explicitly specified* numbers alone — 0.4s + 0.4s + 0.9s (morph) + 0.5s + 0.7s (final fade) = 2.9s of fixed holds/durations — before adding the two fade-ins, the settle tween, and ~1.3s of stagger for 18 characters across two groups ("illustrated" = 11, "by Neel" = 7) at 0.045s/char. Built faithfully to the explicit per-step timings rather than silently compressing them to hit the 3.5s ceiling — flagged to Neel rather than guessing which numbers were flexible. Easiest levers if it needs to come down: drop the char stagger to ~0.03s, or shorten the two holds after the morph.
* **Heart alignment needs a computed offset, not zero-transform.** `Love.svg`'s viewBox is `0 0 426 135`; the "o" path's own bounding box sits around x:[93, 200], y:[24, 134] (center ≈ 146, 79). `Vector.svg`'s heart path was authored in its own `0 0 134 123` viewBox with its shape centered around (67, 61). MorphSVG rewrites `#loveO`'s `d` attribute directly using the heart's raw coordinates — it does not reposition them into the old shape's location. Without a translate, the morphed heart renders offset toward the top-left of the wordmark, not centered where the "o" was. Fixed by tweening `x`/`y` on `#loveO` in the same tween as the morph (an actual GSAP transform, not a baked-in path edit) — offset computed from the two bounding-box centers, then confirmed/adjusted visually.
* **`var(--font-voice)` is new** — added as `Fraunces` (italic weight), the same serif already in the type system but documented in `CLAUDE.md` as About-page-only. This preloader is the second deliberate exception to that rule (`CLAUDE.md` updated) — used only for the signature's "illustrated," nowhere else on the homepage.
