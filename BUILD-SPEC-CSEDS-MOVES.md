# BUILD-SPEC-CSEDS-MOVES.md — CSEDS case study · /work/cseds.html

Read `CLAUDE.md` first. Converts the current 8-section `/work/cseds.html` (hero/impact/problem/approach/solution/faithful/light/reflection) into the four-move format below — this spec wins on structure. Rebuild body of `/work/cseds.html`; keep shared nav/footer + tokens. Vanilla only.

Copy NOT written yet — Neel writes it. Build every text block as a labelled `[COPY TBD]` slot with guidance. Do not fabricate copy or a Lighthouse score.

## Honesty constraints (load-bearing)

- Built in Framer on the Manufact template — be upfront; a reviewer sees "Made in Framer". Real work = platform choice, template customization, IA, content strategy, consolidation. Do not imply hand-coding.
- CSEDS is a DISTRIBUTOR of construction products + engineering software for the Australian market — NOT an engineering consultancy.
- Lighthouse mobile score: run on the live site, supplied by Neel. PLACEHOLDER stat until then — never invent.

## Copy note — added during build

This spec assumes "copy NOT written yet" and calls for `[COPY TBD]` slots throughout. That assumption didn't match reality: the existing `/work/cseds.html` (a prior 8-section build) already had extensive, specific, already-honest copy — Ted Bennett, CP Eng; the four competing constraints named and explained; the Framer/Manufact platform reasoning; the specific product and software names; and, notably, the reflection section already documents the exact honest finding this spec asks for (a real, still-live Manufact trust-stats block with contradicting numbers across breakpoints, an actual bug the writer caught, not invented). Overwriting all of that with generic `[COPY TBD]` placeholders would have deleted real, valuable, already-approved material for no reason.

So instead of placeholder slots, this build **consolidates the existing 8 sections into 4 moves**, preserving the real copy throughout, and only placeholders the one thing that's genuinely not decided yet: the Lighthouse mobile score (`.cs-lighthouse-placeholder`, two instances — Move 1's headline stat slot and Move 4's "keeping it light" aside), exactly as the honesty constraint requires. If Neel actually wants the case-study prose itself rewritten from scratch, that's a separate ask — this build treats the existing words as already his, not as filler to replace.

## Asset note — added during build

`work/cseds/assets/` already has real assets from the current (soon-to-be-restructured) page — reused rather than placeholdered:

```
hero-landing.png              solution-product.png
reflection-desktop.png        solution-software.png / -static.png
reflection-mobile.png         solution-stack.png
solution-landing-desktop.png
solution-landing-mobile.png / -static.png
```

- `cseds-cover` (Move 1) → `hero-landing.png`.
- `cseds-stack-accordion` (Move 3, make-or-break) → `solution-stack.png`. **Confirm on arrival** whether this genuinely shows the product accordion in an interactive/expanded state the way the spec wants ("hero artifact, answers findability") — the filename suggests yes, but per standing practice, verify the actual crop/content matches the claim rather than trusting the name alone.
- `cseds-mobile` (Move 3) → `solution-landing-mobile.png` (or the `-static` variant if the animated one doesn't suit a static frame).
- `cseds-product-page` (Move 4) → `solution-product.png`.
- `cseds-software-page` (Move 4) → `solution-software.png` (or `-static`).
- `cseds-lighthouse` (Move 1 stat slot) → no real number exists yet; stays PLACEHOLDER regardless of asset availability, per the explicit "never invent" rule.

## Four-move

- **Move 1 — Hook:** `[COPY TBD]` — what shipped (two large live sites consolidated into one, live at csedsaust.com.au) + outcome; real Lighthouse mobile score as headline stat if supplied. Assets: `cseds-cover` (→ `hero-landing.png`), `cseds-lighthouse` (stat slot, PLACEHOLDER).
- **Move 2 — Frame:** `[COPY TBD]` — sole freelance designer for CSEDS Aust (founder Ted Bennett); a distributor; job = consolidate two existing sites into one. No image.
- **Move 3 — Hard call (most weight):** `[COPY TBD]` — four competing constraints (consolidate everything / keep a big catalogue findable / faithful to the originals / stay light for mobile), esp. "consolidate everything" vs "stay light for mobile"; honest Framer+Manufact-as-deliberate-tool framing. ⭐ Asset `cseds-stack-accordion` (→ `solution-stack.png`), LARGEST frame; plus `cseds-mobile` (→ `solution-landing-mobile.png`).
- **Move 4 — Second constraint + outcome:** `[COPY TBD]` — IA/content-strategy balance of faithfulness vs cleaner single structure; close honest (live, serves the catalogue, solo build, deliberate platform). Assets `cseds-product-page` (→ `solution-product.png`), `cseds-software-page` (→ `solution-software.png`).

## Placeholders

Labelled boxes at final dims for the one genuinely-missing asset (Lighthouse stat); visible `[COPY TBD]` + guidance for every copy block. Confirm ratios on arrival (full-page → scroll-inside likely, reusing the existing device-mockup system already built for this page). No fabricated copy/screenshots/Lighthouse.

## Constraints (CLAUDE.md)

Single amber; ink/paper; four typefaces; `stroke-dashoffset` on enter; same traps; no phase-name headings; Move 3 = most weight.

## Done when

Renders four-move top-to-bottom with labelled copy + real assets wired in where they exist, placeholder slots at final dims elsewhere; Framer + distributor framing respected; nothing fabricated; no console errors.
