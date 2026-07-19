# BUILD SPEC — Futee mockups addendum (Moves 3 & 4)

Addendum to `BUILD-SPEC-FUTEE-MOVES.md`. Adds scrolling / moving device mockups to **Moves 3 and 4 only**.

**Status: built (2026-07-19).**

**Scope guard:** mockups go ONLY where a move is already making an argument. Moves 1 (hook) and 2 (frame) stay clean — no hardware.

---

## What shipped, and one honest deviation from the brief

Both new scroll-inside assets are real, clean, already-existing Futee exports (`Futee/Wireframes/MacBook Pro - 61.png` and `MacBook Pro - 42.png` — resized and copied into `/work/futee/assets/` as `solution-findgame-full.png` (already present) and `create-game-confirm-full.png` (new, 1400×3576)). Both were visually checked before wiring in, per CLAUDE.md ("confirm asset filenames before wiring them in").

**Neither export shows quite what its bullet claims**, once actually opened:
- 3b's asset (`MacBook Pro - 61`) is the general Find Game page — filters and a pitch-results grid — not a list of time slots. It doesn't literally show "night slots surfacing first."
- 4a's asset (`MacBook Pro - 42`) is the game organiser's booking-confirmation + publish-visibility modal, not a pitch-owner-facing management back-end.

Rather than caption them with the spec's more specific claims (which the images don't actually support), both figcaptions were written to describe what's honestly on screen while still tying back to the section's argument. This is the same truthfulness bar the rest of the site holds to — see CLAUDE.md's non-negotiables. If real pitch-owner-dashboard or time-slot-list screens ever get exported, swap the `src` and rewrite the caption; nothing else needs to change.

---

## Move 3 — the night-play spine

### 3a. Night-play booking screen — hero of the page

**Not a placeholder.** Built as real HTML/CSS (`.fc-nightscreen`, from `BUILD-SPEC-FUTEE-MOVES.md`) rather than the placeholder this addendum originally called for, since that solution already existed and is stronger than a "TO SUPPLY" box. Static in the frame, phone-framed, prominent — unchanged by this addendum.

### 3b. Find Game full-page — scroll-inside ✅ built

- `solution-findgame-full.png` (already in the repo), laptop frame, `data-scroll-inside`.
- `data-depth="-10"` parallax, `--float-delay: 2.5s` (3a is `14` / `0s` — distinct, so the pair doesn't move in lockstep).
- Entrance staggered 140ms after 3a.
- Stacked below 3a (phone as emphasis, laptop as supporting evidence) rather than side-by-side — a 210px phone and a 680px laptop don't share a row cleanly.

## Move 4 — three sides, three screens

Built as three **sequential** figures (Coaches → Pitch owners → Players, matching bullet order) rather than a literal 3-column row — same reasoning as above: a 210px interactive card, a 680px laptop, and a 280px list don't fit one balanced row. Each still gets its own entrance stagger, parallax depth, and float delay, so it reads as one deliberate set, not three separate afterthoughts.

| Side | Screen | Treatment |
|---|---|---|
| Coaches | FIFA-style coach card | Interactive, hover-tilt (unchanged from `BUILD-SPEC-FUTEE-MOVES.md`). Now wrapped in `.device-enter`/`.device-parallax` (`depth 12`) and given an idle float via the shared `.device` class on `.fc-coach-card-wrap` — `--float-delay: 0s` |
| Pitch owners | `create-game-confirm-full.png` (new) | Scroll-inside, laptop frame. `depth -14`, `--float-delay: 2s`, entrance +140ms |
| Players | Rating / show-no-show list | Static. Wrapped in `.fc-frame` (not a full phone bezel — the tall 9:19.5 aspect ratio left dead space below the card; a padded dark frame reads as "hardware-adjacent" without it) + `.device` for float. `depth 10`, `--float-delay: 4s`, entrance +280ms |

---

## Motion — confirmed against the existing shared system, no new JS needed

The reusable device-mockup script (`.device-enter` entrance, `.device-parallax` + `data-depth`, `img[data-scroll-inside]`) already discovers new elements via `querySelectorAll`, so none of the above needed JS changes — only markup.

- `transform`/`opacity` only — inherited, unchanged.
- Scroll-inside: eased, capped at image end — inherited, unchanged.
- `prefers-reduced-motion`: `.device { animation: none; }` already covers the newly `.device`-classed wrapper and frame; scroll-inside images already snap to `translate3d(0,0,0)` (top of image) under reduced motion; parallax already returns early under reduced motion. Verified via computed-style checks, not just code reading.
- Mobile (≤820px): parallax already collapses to identity (verified: all 5 `.device-parallax` elements read `matrix(1,0,0,1,0,0)` at 390px width). No horizontal overflow at 390px.

---

## Traps carried over from the parent spec

1. No mockups on Moves 1/2 — untouched.
2. No full-page export cropped into a static frame — both new assets are genuine scroll-inside.
3. Mockups don't outweigh the copy — three-up stays visually lean (one interactive card, one laptop, one small list).
4. No fabricated screens — both new-to-this-addendum images are real exports, visually confirmed before wiring in.
5. `transform`/`opacity` only — confirmed via computed styles.
6. Devices don't float in unison — each of the five `.device-parallax` elements has a distinct `data-depth`, and each float-animated element within a single reading view (the Move 3 pair, the Move 4 trio) has a distinct `--float-delay`.
7. **New trap this session:** native `<img loading="lazy">` did not fetch reliably when testing via `window.scrollTo()` in the Claude Code Browser pane on this project's tallest page yet (~6000px) — confirmed the image, markup, and CSS are all correct (loads fine on direct navigation, loads fine with a viewport tall enough to include it in the eager-load margin, all `getBoundingClientRect`/`getComputedStyle` values sane). Real user scrolling is a different input path from this tool's synthetic scroll and is not expected to have this issue. See CLAUDE.md trap 11 — same root cause, now confirmed to also affect native lazy-loading, not just screenshot capture.
