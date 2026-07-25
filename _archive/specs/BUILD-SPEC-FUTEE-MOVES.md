# BUILD SPEC — Futee case study (four-move rebuild)

`/work/futee.html`

**Status: built (2026-07-19).** This superseded the nine-section structure in the original `BUILD-SPEC-FUTEE.md` and resolved every item in `FIX-SPEC-FUTEE.md` by removing the sections that had the problems (Figma-chrome screenshots, the broken before/after compare) rather than patching them. Both files are now historical.

Read `CLAUDE.md` first (tokens, traps — especially trap 11, a Browser-pane verification-tool quirk hit while building this page, not a page bug).

## 0. Structure — four moves, not nine sections

The page is **one continuous argument about a design decision**, not a process report.

- **No** day-by-day process narration.
- **No** metrics section.
- **No** phase-name headings ("Research", "Ideation").
- Lead with the outcome. Keep the judgment calls; cut the connective scaffolding.

Four moves, in order:
1. **Outcome hook** (hero)
2. **The frame** (`#frame`)
3. **The hard call** (`#hard-call`) — the spine; most visual weight on the page
4. **Second constraint + honest outcome** (`#outcome`)

Then a pagenav (same "← Neel Parikh / See all work →" pattern as every other case study — `/work.html` doesn't exist yet, this is intentional and consistent).

## 1. Locked copy

The four moves reproduce Neel's approved copy verbatim in `/work/futee.html`. Do not paraphrase it on future edits — treat the prose in the four `<section>` blocks (ids `hero`, `frame`, `hard-call`, `outcome`) as fixed text, same as any other locked copy on the site.

**Truthfulness note:** this copy asserts Futee shipped, ran live, booked real games, and was taken in-house by the pitch owners — a change from the previous page's "Figma prototype, not a live product" framing. This is confirmed accurate by Neel, not a drift to fix. Don't soften it back to prototype language.

## 2. How the moves render

- **Move headings are pulled phrases from the copy, never phase names** — e.g. Move 3's `<h2>` is "Thailand is hot, so people play at night," not "The hard call." The sticky secnav (`.fc-secnav`) uses short wayfinding labels ("The frame" / "The hard call" / "The outcome") since that's UI chrome, not body copy.
- **Two cascade lists** (Move 3's three consequences, Move 4's three sides) share one component, `.fc-cascade` — a vertical floodlight rule with a dot per item, so they read as visually parallel "one thing → three consequences" structures.
- **Move 3 carries the most weight**: two intro paragraphs, the night-play phone mockup, the three-item cascade, and a closing line. Move 4 is deliberately leaner — don't let it outweigh Move 3.

## 3. The three built assets

None of Move 3's or Move 4's assets exist as clean screenshots — the real Futee UI screenshots are either Figma-chrome exports or, worse, show the *opposite* of the argument (daytime-first slots, which is exactly what got redesigned away). Per the original spec's own escape hatch ("the night-play screen is the asset most worth rebuilding as HTML/CSS if it can't be re-exported clean"), all three are built as real markup, not images:

- **`.fc-nightscreen`** (Move 3) — a phone-frame mockup of the Find Game screen with evening slots (7/8/9 PM) highlighted and daytime slots (10 AM, 2 PM) muted. Pure CSS floodlit-pitch background (radial-gradient glow dots), zero image weight.
- **`.fc-coach-card`** (Move 4) — the FIFA-style coach card, interactive: hover-tilt via `mousemove` setting `--tiltX`/`--tiltY` custom properties consumed by `transform: rotateX() rotateY()`, gated behind `(hover: hover) and (pointer: fine)` and `prefers-reduced-motion: no-preference`.
- **`.fc-rating-ui`** (Move 4) — a static show/no-show + 1–5 star list.

All three figcaptions disclose "rebuilt in code for this write-up" and, where the content is illustrative (coach name, stats, player names/scores), say so explicitly — same honesty pattern the rest of the site already uses for mock UI numbers (e.g. CSEDS's "28, 8.1/10 and 12 are mock data... not measured outcomes").

If real clean exports of these screens ever become available, they can replace the built markup directly inside the `.device-screen` divs — the device-phone frame, entrance animation, and parallax wiring don't need to change.

## 4. Motion

- Device frame: entrance fade+rise via the shared `.device-enter`/`IntersectionObserver` pattern (reused from `/work/cseds.html`), gentle float, scroll parallax via `data-depth`.
- Coach card hover-tilt as described above.
- `prefers-reduced-motion` fully respected: entrance skips the transition, coach card skips the tilt transition, `.device` float animation is removed.

## 5. What got removed

The old nine sections (Impact/stats, Problem, Quiz, Framing/personas/process-timeline, What I Killed, Solution, Timer, Reflection) and their CSS/JS are gone: `.fc-stat*`, `.fc-quiz*`/`.fc-hotspot*`, `.fc-personas`/`.fc-process*`, `.fc-killed*`, `.fc-timer*`, the counting-stat JS, the quiz reveal-all JS, the process-timeline draw-in JS, and the match-timer JS. The old screenshot assets (personas, problem-grid, killed-wireframe, reflection, the old solution screens) are still on disk in `/work/futee/assets/` but are no longer referenced — left in place rather than deleted, since they're Neel's design assets, not code.

## 6. Traps

1. Don't paraphrase the locked copy.
2. Don't print phase-name headings in the body — pull descriptive phrases from the copy. Secnav wayfinding labels are the one exception (UI chrome, not argument copy).
3. Don't ship Figma-chrome screenshots — this is why Move 3/4's assets are built, not screenshotted.
4. Don't let Move 4 outweigh Move 3.
5. Don't fabricate metrics. The coach card / rating list content is illustrative UI-demo content (same category as existing mock numbers elsewhere on the site) and is captioned as such — it is not a claimed outcome metric.
6. `scroll-padding-top`/`scroll-margin-top` for the fixed pill — verified clear on this page (140px margin vs. an 80px pill).
7. See CLAUDE.md trap 11 if a screenshot during a future edit looks blank or washed out at some scroll depth — check computed styles / `get_page_text` before assuming the page broke.

## 7. Quality floor

- Reads as one continuous argument; four moves; no process narration, no metrics section
- Locked copy reproduced verbatim
- Descriptive headings pulled from copy, no phase names in body copy
- Night-play mockup visibly shows evening-first default slots
- FIFA coach card interactive (hover-tilt); rating list clean and static
- No Figma chrome in any image (there are no images in the new sections at all)
- No fabricated outcome data; illustrative UI content is captioned as such
- Device frames use the shared cross-case-study mockup system; `prefers-reduced-motion` respected
- No console errors
