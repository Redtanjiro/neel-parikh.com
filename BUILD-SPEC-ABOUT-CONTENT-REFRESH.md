# BUILD-SPEC — About content refresh + tool-stack logo strip

Written 2026-07-24. Confirmed no collision with an existing spec of the same name (`ls *.md` checked against repo root).

## Context

Per HANDOFF (2026-07-23), `#about-statement` currently renders the approved longer paragraph, centred, with per-line stagger + hand-drawn squiggle underline under one emphasis word (`.about-key`, `var(--font-voice)` → Fraunces italic). This spec replaces that copy and adds a new logo row that was planned but never built (see portfolio-site memory: "tool-stack row will show SVG icons for Figma, Adobe, Procreate, and Claude").

Do not change layout system, fonts, or composition style — this is a content + spacing change within the existing design.

## 1. Replace the About statement copy

Old: the longer third-person paragraph currently live. New (approved 2026-07-24):

> hello! I am an AI-native product designer, illustrator and immersive designer with 3+ years of experience.

- Keep the per-line stagger reveal on scroll — re-break the new copy into lines that read well at the split (e.g. "hello!" / "I am an AI-native product designer," / "illustrator and immersive designer" / "with 3+ years of experience.") — adjust actual line breaks to what looks balanced at real viewport widths, this is just a suggested split.
- Squiggle underline emphasis word: suggest "AI-native" as the `.about-key` target (central to Neel's positioning). Flag back if this doesn't work visually with the current squiggle-under-phrase mechanic (it was built for a single word/short phrase) — Neel to confirm before shipping if it needs to change.
- The old supporting paragraph beneath the statement is removed entirely — the new copy is a single short statement, no second block of body text underneath it.

## 2. New: tool-stack logo strip

A row of tool icons sits below the About statement (reference: Figma "Portfolio" file, Page 1, MacBook Air - 16 frame — logos row between statement and Chosen Work).

- Icons: Figma, Adobe (Creative Cloud mark or the specific app used — confirm which), Procreate, Claude — same four tools already scoped in prior planning.
- Use existing icon/SVG conventions from the design system (same treatment as other SVG-line motion elements) rather than importing icon-font or raster logos where possible — check for official SVG marks and use monochrome/ink-tinted versions to match the site's ink/paper/amber palette, not brand-colour originals.
- Simple layout: horizontal row, evenly spaced, centred under the About statement. No interaction/animation required beyond whatever entrance treatment the rest of the About block already has (reuse the same reveal system, progressive-enhancement gated, per trap #4 in HANDOFF — never opacity:0 with no failsafe).
- Label copy if any (e.g. "tools I use") — optional, keep minimal or omit; use judgement based on how it reads against the short "hello!" statement above it.

## 3. Reduce spacing between About and Chosen Work

Current gap between the About block (statement + new logo row) and the Chosen Work cards section is too large. Tighten the margin/padding between these two sections — pull them visually closer without cramping the logo row against the cards. Check both the pinned/scrubbed hero→About ScrollTrigger range and the static spacing below it aren't broken by the change (re-verify per HANDOFF's "re-verify both ranges together if you touch either" note, since About sits inside `.hero-stage` scroll logic).

## Acceptance criteria

- [ ] About statement shows the new short copy, still per-line staggered on scroll
- [ ] Squiggle underline still renders correctly under the chosen emphasis word/phrase
- [ ] Old supporting paragraph is fully removed (markup + any now-unused CSS)
- [ ] New tool-stack logo strip renders (Figma, Adobe, Procreate, Claude), matches site palette, has reveal + failsafe gating like other reveal systems
- [ ] Visible gap between About block and Chosen Work cards is reduced
- [ ] Hero split-reveal / About scroll-scrub ranges still work correctly after spacing changes (`tl.totalDuration() === 1` check per trap #15)
- [ ] Verified via real screenshot, not just computed styles (per trap #14)
