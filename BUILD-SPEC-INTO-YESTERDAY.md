# BUILD-SPEC — Into Yesterday — `/work/into-yesterday.html`

**Status:** Built. Follows the shared four-move structure. Source material: DDES9010 (Immersive Design) submission deck — 14 slides/renders originally supplied via `Portfolio-1/`, superseded by a richer, individually-isolated asset drop in `into yesterday/` (Figma-exported SVGs wrapping full-resolution embedded PNG/JPG — see Build notes).

**Shared rules apply:** vanilla only; never fabricate metrics; Neel writes the copy (**exception, agreed explicitly for this case study only** — see Build notes); never ship Figma/tool-chrome images; device frames only where the medium warrants. **Into Yesterday's medium is a physical installation, not app UI or print collateral — so no device frames at all.** Renders are shown flat, full-bleed, the way EMF's environmental work is shown.

---

## The story

**Into Yesterday** is a speculative immersive light-and-sound installation designed for Vivid Sydney, built solo for DDES9010. The brief: translate abstract emotional states — nostalgia, warmth, reflection — into a physical journey a visitor walks through. Role: concept design, spatial design, 3D visualisation, sound design. Tools: Blender, GarageBand. Type: academic / speculative. Year: 2025.

The concept: visitors descend into a maze that gets more sensorially intense the deeper they walk — shorter grass and brighter, cooler light at the edges; longer grass, warmer light, warmer air, and a fuller soundscape toward the centre — before the maze opens onto water, where floating glass orbs mark a final moment of stillness. The physical descent doubles as a psychological one: from searching to remembering.

**This is the only case study on the site that wasn't built or shown to real users** — it's a coursework concept, resolved as far as render + soundscape + storyboard, not a physical build. The honest-outcome line in Move 4 holds that line clearly, stated plainly rather than hedged.

---

## The four moves (as built)

1. **Hero** — cover render (clean, no baked-in title — "Into Yesterday" is real HTML `<h1>`, matching every other case study's convention) + role/type/tools/year/site/scope meta grid.
2. **The brief** (`#frame`) — DDES9010 course context, solo scope, academic/speculative status stated once plainly, paired with the real Barangaroo Reserve site photo.
3. **The pivot** (`#hard-call`) — killed pavilion iterations (sloped roof, then a dome) vs. the shipped maze, plus one optional secondary process artifact (Blender viewport, model + camera markers).
4. **The outcome** (`#outcome`) — second constraint (crowd flow via the single-entrance bottleneck) + immersion-level diagram + 8-frame storyboard + sensory system breakdown + the honest-outcome callout, restated without hedging.

---

## Build notes — added while building

* **The original spec's asset table numbering didn't match the real files — verified visually, third time this has happened on this project (see Futee, EMF ACE/CSEDS).** Every `IY-N.png` in `Portfolio-1/` was off by one against the spec's claimed content, and the spec's `IY-13.png`/`IY-14.png` didn't exist as separate files at all — that content (the numbered immersion diagram, the dense info panel) turned out to live inside `IY-12.png`, a two-panel poster spread. Built a corrected content map by opening every file rather than trusting the table.
* **A better asset source appeared mid-build.** Neel created `into yesterday/` (sibling to the repo, outside git) with the same content as cleanly-isolated Figma-exported SVGs instead of flattened PowerPoint-style slides. These SVGs wrap full-resolution raster images as base64 data URIs (`data:image/png;base64,...` inside a `<pattern>`/`<image>` element) — extracted directly via a small Python script rather than screenshotting, which preserved full source resolution (e.g. 1920×1080 renders) instead of downsampling through a browser viewport.
* **One extracted file (`Group 1000002983.svg`) turned out to be copyrighted film reference material** — stills from a Bond title sequence plus a colour-palette swatch, clearly personal mood-board inspiration, not case-study content. Excluded entirely; flagging here so a future session doesn't accidentally ship it.
* **Blender-chrome removal, `IY-10.png` (killed iterations):** the "ITERATION 1"/"ITERATION 2" text labels baked into the slide overlap the neighbouring Blender screenshot's UI chrome at the pixel level (confirmed via pixel sampling — the second Blender panel's toolbar starts at x≈1263, while the "2" digit extends to x≈1355). No single crop excludes both. Resolved by cropping to the clean shape geometry only (`x < 1250`, safely past both panels) and painting out the truncated text remnants, then re-adding "Iteration 1" / "Iteration 2" / "Mood board" as real HTML captions instead of baked-in slide text — consistent with how every other case study on the site captions its process tiles.
* **Copy authorship deviates from the house rule this one time, by explicit agreement.** CLAUDE.md's case-study rule is "Neel writes the copy, not the AI." For this case study specifically, Neel asked Claude to draft the four-move copy from the dense info panel's language (Experience/Features/Emotions/About/Visibility/Target Audience/Location) rather than writing it from scratch — Neel edits/approves before anything ships. Don't treat this as a precedent for other case studies without the same explicit ask.
* **Site-scope decision:** Into Yesterday is **not** blended into the Chosen Work grid as a fourth item. Neel chose a separate, clearly-labeled "Speculative / Coursework — not client work" block (`.chosen-work-speculative` in `index.html`), directly below the client-work accordion and "See all work" link, so the client-vs-coursework distinction is visible before a reader opens the case study. Also registered in `assets/projects.js` with `featured: false, speculative: true` for whenever `/work.html` (All Work) gets built.
* **Futee's pagenav dangling `/work/into-yesterday` link, flagged as broken in `portfolio-roadmap.md` line 30** — checked the live file; it doesn't actually exist. `work/futee.html`'s pagenav already points to `/index.html` and `/work.html` only. That roadmap note was already stale before this session; now moot either way since the page is real.
* **World palette, matching the "case studies derive their own palette" rule:** `--night: #150f1c` (near-black indigo, water/sky), `--dusk: #e3a05c` (warm amber maze-glow accent), `--mist: #e8ddd3` (body text), `--orb: #c2447a` (secondary accent, memory-orb magenta, used sparingly).

---

## Open items for Neel

1. **Read and approve the four-move copy** — Claude drafted it from the info panel per the agreed exception above; nothing has shipped/pushed yet.
2. Confirm the "academic/speculative" framing in Move 2 and the honest-outcome callout in Move 4 read the way you want — this was the spec's own flagged confirm-before-publish item.
3. `into yesterday/_extracted/` (full-resolution extracted PNGs/JPGs) is still sitting in the sibling `into yesterday/` folder outside the repo — fine to leave as source material, matching the existing `Drawn assests/` / `Futee/` planning-assets pattern.
