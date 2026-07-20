# BUILD-SPEC-FUTEE-V2.md — Futee case study · /work/futee.html

Supersedes `BUILD-SPEC-FUTEE-MOVES.md`'s copy and asset treatment. Structure (four moves, no metrics, no phase-name headings, no process timeline) carries over unchanged — only the copy, the Move 3 asset (built HTML → image placeholder), and Move 4 (gains a third bullet) change.

Read `CLAUDE.md` first (tokens, motion, traps, precedence). `FIX-SPEC-FUTEE.md` doesn't exist in the repo — its fixes (no Figma-chrome, nav-pill/heading overlap, remove broken before/after) were already resolved when the page was first rebuilt to four moves, and stay resolved here.

## Structure: four-move argument, visuals woven into the move they prove. No metrics section, no process timeline, no phase-name headings.

### Move 1 — Hero
Copy: "We designed a football-pitch booking app for Bangkok from our desks in India, never having been there. It went live, booked real games, and worked well enough that the pitch owners took it in-house."
- Asset: `futee-cover` (night-play cover). PLACEHOLDER until supplied.

### Move 2 — The frame (narrow measure, no image)
Copy: "Futee was a two-person project — my co-designer and I owned it end to end, no PM, no researcher, no local team. It's a booking product for grassroots football in Thailand: find a pitch, fill a game, with a coaching layer on top — and, underneath, a three-sided marketplace to hold together. We had about three months, two people, and no way to visit the place we were designing for."

### Move 3 — The hard call (most visual weight on the page)
Para 1: "Designing for a country you can't visit forces you to find the truth some other way. We couldn't watch people book pitches in Bangkok, so we did the next best things: we talked to people who actually play football in Thailand, and we pulled apart the local booking apps they already used — reading how they handled time, price, and place, rather than importing assumptions from apps we knew."
- Then ONE process artifact: `futee-process-teardown` — flat, captioned (local-app teardown board or captioned player note). Caption ~1 line showing the reasoning. PLACEHOLDER. This is the only process moment — no timeline.

Para 2: "One thing reframed the entire product. Thailand is hot — so people play at night. In the cold-weather countries most booking apps are designed for, football is a daytime, weekend-morning activity, and the whole interface assumes it. Ours had to assume the inverse. That single fact wasn't a detail — it cascaded through every important decision on the page:"
Bullets:
- "Default time slots opened in the evening, not the morning — the app should meet people when they actually play."
- "Availability surfaced night slots first, because a daytime-first list would bury the times that mattered and quietly tell users the app wasn't built for them."
- "Imagery and tone leaned into floodlights and night play — the product had to look like the game it was for, or it would read as a foreign app translated for a local market."
- Beside these bullets: ⭐ `futee-booking-night` — booking screen, evening default slots, night surfaced first. LARGEST frame on the page, immediately adjacent to the bullets it proves. PLACEHOLDER (make-or-break asset; clean flat export).

Closing: "None of that comes from a feature list. It comes from one correctly-read constraint about heat and daylight — and getting it wrong would have produced a perfectly functional app that no Thai player felt was theirs."

### Move 4 — Second constraint + honest outcome
Intro: "The harder structural problem was that Futee is a marketplace with three sides that each need something different — and one system had to serve all of them."
Bullets, each paired with its visual:
- "Coaches got FIFA-style player cards, matched to real AFC coaching qualifications — turning a credential into something you'd actually want to browse." → `futee-coach-card`: **build as a real interactive HTML/CSS/JS hover/flip card** (front = player-card face w/ AFC badge; reveal = coaching detail). Use `stroke-dashoffset` line-draw on reveal. Must read as browsable — it's the proof for this line.
- "Pitch owners got a deliberately simple booking back-end — the side of the market most likely to walk away if the tool felt like work." → `futee-owner-backend`: flat screen. PLACEHOLDER.
- "Players got a public rating system — show / no-show reliability, plus a 1–5 star score for how accurately they'd described their own ability — because the real thing that breaks pickup 11-a-side isn't finding a pitch, it's trusting that ten strangers will turn up and be roughly who they said they were." → `futee-rating-ui`: flat. PLACEHOLDER.

Outcome: "It shipped. It ran live and booked real games. Then the pitch owners took it in-house — which is the honest ending, and not a disappointing one: a model gets absorbed like that precisely because it works. The thing we'd designed was worth owning."

### Closing beat
1–2 clean shipped-app hero shots: `futee-final-shots`. PLACEHOLDER.

## What changed from BUILD-SPEC-FUTEE-MOVES.md

- All four moves' copy is replaced with the new verbatim text above.
- Move 3's night-play screen was previously built as real HTML/CSS (`.fc-nightscreen`, a phone-frame mockup) because no clean export existed. This spec calls for a PLACEHOLDER image slot (`futee-booking-night`) instead — the built HTML approach is dropped in favor of a labelled placeholder awaiting a real export.
- Move 4 gains a third bullet + asset (`futee-owner-backend`, pitch-owner booking back-end) that didn't exist in the previous build — previously only two sides of the marketplace (coaches, players) were shown; now all three sides are represented.
- The coach card interactive build carries over unchanged (still the one asset built for real, not placeholdered).
- A closing beat (`futee-final-shots`) is new — the previous build had no closing shots section.

## Placeholders

Every PLACEHOLDER: labelled box at final dimensions/aspect ratio, slot name visible, no reflow on swap. Coach card is the exception — build for real. Never fabricate UI screenshots.

## Constraints (CLAUDE.md)

Single amber `#e8a13a`; ink/paper; four project typefaces. `stroke-dashoffset` line-draw on enter, carried into the coach card. Traps: `pathLength` = SVG attr; `mix-blend-mode:difference` inverts amber; clock only in nav pill. Move 3 = most visual weight.

## Done when

Page renders top-to-bottom, copy verbatim, all placeholder slots at final dims, coach card working and browsable, no Figma-chrome images, no console errors.
