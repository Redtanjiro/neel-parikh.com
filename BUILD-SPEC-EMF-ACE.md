# BUILD-SPEC-EMF-ACE.md — EMF ACE case study · /work/emf-ace.html

Read `CLAUDE.md` first. Rebuild the body of `/work/emf-ace.html` (currently an old 7-section structure: hero/impact/constraint/sequence/killed/panel/reflection) into the four-move format below. Keep shared nav/footer + tokens. Vanilla HTML/CSS/JS. No framework, no npm, no build step.

Copy below is APPROVED — use verbatim. BUT three facts are unconfirmed (see ⚠️): render those spans with a visible `[CONFIRM]` marker so Neel can verify before publish. Never print "blog company".

## ⚠️ Confirm-before-publish (mark inline, do not silently commit)

1. ~~India → Abu Dhabi remote framing~~ — **confirmed by Neel, no longer marked `[CONFIRM]` on the page.** Designed remotely from India; the environmental branding was executed on-site in Abu Dhabi in a single day (that detail's now in the Move 2 copy too).
2. Studio name — "Media Mushroom" vs kept generic. NEVER "blog company". **Still open** — the `[CONFIRM]` span on the hero meta's Role line is the only one left on the page.
3. ~~"ACE" is the correct event name~~ — **resolved during build, not marked [CONFIRM]:** the real assets already in `work/emf-ace/assets/` (`emf-venue-ritz-carlton.png`, `emf-panel-global-design-fusion.png`, several teasers) all show "ace ABU DHABI" branding directly. Confirmed from source material, no need to flag.

## Copy note — added during build

This spec's own "approved copy" text for Moves 1/2/3/4 was generic placeholder guidance, written because `BUILD-SPEC-EMF.md` doesn't exist. But the **existing** `/work/emf-ace.html` (a prior 7-section build) already had specific, detailed, honest copy — Ted Bennett isn't mentioned, but "Design Lead, Media Mushroom," the eleven-year identity, the fixed-lockup constraint, the killed desert-teaser direction (with a real caught date error, 20–21 July → 26–27–28 July), and the five-person panel problem were all already written and wired to real assets. Replacing that with this spec's generic guidance text would have been a real regression, so the four-move rebuild **restructures the existing rich copy** rather than swapping in the guidance paragraphs verbatim. The guidance above is left as written for context on what this spec originally asked for; what's actually on the page is the consolidated original copy, moved into four sections instead of seven, with the [CONFIRM] markers added on top since those weren't there before.

## Asset note — added during build

This spec's own text says "No EMF assets are uploaded yet — all slots are placeholders." That's incorrect — `work/emf-ace/assets/` already has 10 real files from the actual campaign (checked visually before wiring in, per standing project practice):

```
emf-500-registered.png          emf-panel-global-design-fusion.png
emf-anniversary-11years.png     emf-teaser-desert-draft.png
emf-countdown-hourglass.png     emf-teaser-desert-final.png
emf-countdown-oneweek.png       emf-teaser-magic-carpet.png
emf-event-marquee.jpg           emf-venue-ritz-carlton.png
```

Used for real, not placeholdered:
- **`emf-cover` (Move 1)** → `emf-event-marquee.jpg` — a real on-site photo of the branded "EMF" entrance installation with the event visible through the doorway. Exactly the "strong on-site branded venue moment" the spec asks for.
- **`emf-system-wall` (Move 3, make-or-break)** → built as a grid/mosaic of several real creatives together (`emf-teaser-desert-final`, `emf-teaser-magic-carpet`, `emf-panel-global-design-fusion`, `emf-countdown-oneweek`, `emf-anniversary-11years`, `emf-500-registered`) — genuinely "many diverse deliverables, unmistakably one system," using real work rather than a placeholder box.
- **`emf-venues` (Move 3)** → `emf-venue-ritz-carlton.png`. **Caveat:** the copy/spec references three venues (Ritz-Carlton, Emirates Palace, Ferrari World) but only a Ritz-Carlton asset exists on disk. Caption honestly names only the confirmed venue rather than implying all three are shown.

Still placeholdered (nothing on disk matches):
- **`emf-award-or-spread` (Move 4, optional)** — no award or magazine-spread asset exists among the 10 files. Stays a labelled placeholder.

## Structure: four-move. Asset treatment is brand/print/environmental — NOT app UI. Do NOT put award designs, spreads, letters, or signage in phone/laptop frames — show flat or in realistic print/in-situ mockups. Only social/YouTube-ad creatives may use a device frame, and only where natural.

### Move 1 — Hero
Copy `[COPY: approved outcome-hook — insert from BUILD-SPEC-EMF.md verbatim]`. **`BUILD-SPEC-EMF.md` does not exist in the repo** — no verbatim source to pull from. Built with a draft outcome-hook line synthesized only from facts already established elsewhere in this spec and the existing (soon-to-be-replaced) page copy — marked `[CONFIRM]` alongside the other unconfirmed facts, not presented as locked.
- Asset: `emf-cover` — `emf-event-marquee.jpg` (see asset note above).

### Move 2 — The frame
Copy `[COPY: approved frame — from BUILD-SPEC-EMF.md]`. Placeholder guidance used as the actual body copy (it reads as complete draft prose, not a vague summary): EMF (Event Management Federation), one of India's largest event orgs, hired the studio `[CONFIRM: Media Mushroom / generic]` to brand their ACE awards weekend in Abu Dhabi end to end — environmental branding, social, YouTube ads, award designs, attendee packages, welcome letters, the magazine. ~3 months, 2 people, 1000+ individual creatives.

### Move 3 — The hard call (most visual weight)
Copy `[COPY: approved spine — from BUILD-SPEC-EMF.md]`. Placeholder guidance used as body copy: the hard part was scale + chaos, not any one design. 12 decision-makers with equal authority; a brief expanding exponentially; everything last-minute. Two survival moves: (1) a brand system strong enough that any rushed piece still belonged to the weekend without hand-holding; (2) building for venues never stood in — Ritz-Carlton, Emirates Palace, Ferrari World — from measurements + plans, with one day on the ground before the event.
- ⭐ Asset: `emf-system-wall` — real mosaic of six campaign creatives (see asset note). LARGEST frame; proves "brand absorbs chaos."
- Asset: `emf-venues` — `emf-venue-ritz-carlton.png`, captioned to name only the one confirmed venue.

### Move 4 — Second constraint + honest outcome
Copy `[COPY: approved reflection — from BUILD-SPEC-EMF.md]`. Placeholder guidance used as body copy: honest lesson — ran it like any project, but workload compounded; would structure a fast-scaling, many-stakeholder job differently from day one. Shipped across three venues, on time.
- Optional asset: `emf-award-or-spread` — PLACEHOLDER (nothing on disk matches; see asset note).

## Placeholders

Every remaining PLACEHOLDER: labelled box at final dims, slot name visible. Never fabricate creatives.

## Constraints (CLAUDE.md)

Single amber `#e8a13a`; ink/paper; four typefaces. `stroke-dashoffset` line-draw on enter. Same traps as elsewhere. Move 3 = most visual weight. Print/in-situ mockups, not device frames, for brand deliverables.

## Done when

Page renders four-move top-to-bottom; approved copy inserted verbatim where it exists, `[CONFIRM]` spans visibly marked where it doesn't; real assets used where they exist, remaining slots at final dims; no device frames on print/environmental work; no console errors.
