# ASSET-MANIFEST-CASE-STUDIES.md

Produced 2026-07-23 for `BUILD-SPEC-CASE-STUDY-ELEVATION.md`. Every asset the elevation spec needs, per page, with target path, format, and status. Built from a full survey of the four source folders (`Futee/`, `EMF/`, `Cseds/`, `into yesterday/`, all outside the repo) plus the in-repo `work/*/assets/` dirs.

**Legend:** ✅ in repo · 🟡 source exists but needs a clean flat export (chrome-baked or vector-locked) · 🔴 does not exist anywhere — Neel to supply from archives.

---

## Cross-cutting (all four pages)

| Item | Status | Notes |
|---|---|---|
| `See all work →` 404 fix | ✅ **DONE this session** | Repointed from `/work.html` (404s) to `/index.html#chosen-work` on all four pages. |
| Stat strip (monument numbers) | ⏸ designed, not built | Each page **already has** a `.{prefix}-meta` definition-list in its hero (Role/Client/Scope/Duration/Attendees…). A second "monument stats" strip risks redundancy with it — needs visual reconciliation, which is blocked until the local preview works again (see "Blockers"). Content is spec-provided and prose-grounded; ready to build once previewable. |
| Next-project chaining card | ⏸ designed, not built | Reuses the homepage `.work-card` component; loop Futee → EMF ACE → CSEDS → Into Yesterday → Futee. Additive, safe, but also wants one visual pass. |

---

## Futee — `work/futee/assets/`

✅ **RESOLVED 2026-07-23 — all placeholders gone.** The page previously rendered **zero** real images (every content slot was a placeholder box) despite **16 clean flat screen exports already sitting in `work/futee/assets/`**, unused. A prior session made the assets but never wired them in. Now wired: 6 real screens verified loading in-browser (200 OK, correct natural sizes, no overflow, no console errors), captions rewritten to match each actual screen. Mapping:

| Slot | Now shows | 
|---|---|
| cover | `hero-illustration.png` (hand-drawn footballer) |
| teardown | `problem-grid.png` (problems→features research board) |
| ★ booking-night | `solution-findgame-full.png` (the full Find Game flow — dominant tall frame) |
| owner-backend | **removed** — no pitch-owner screen was ever exported; the bullet text carries that side honestly |
| rating-ui | `solution-teams-mobile.png` (the show/no-show "confirm players" checklist) |
| final ×2 | `solution-dashboard.png` (player home) + `create-game-confirm-full.png` ("game booked") |

Still optional/missing: the **flow-in-motion clip** (🔴 no video exists) and a true **pitch-owner back-end** screen (🔴 never exported). Neither blocks the page — it's clean and complete without them.

| Slot | Target path | Format | Status | Source / note |
|---|---|---|---|---|
| `futee-cover` (night-play hero, full-bleed) | `work/futee/assets/futee-cover.webp` | 16:9, flat | 🔴 | No clean night-play export. **Interim option:** `Futee/Untitled_Artwork 49.png` — a strong hand-drawn footballer (#8, floodlit palette) that fits the page's illustrated voice. Neel to confirm cover vs. a real night-play screen. |
| `futee-process-teardown` (local-app teardown board) | `work/futee/assets/futee-process-teardown.webp` | 4:3, flat | 🔴 | Not in repo or folder as a flat board. Needs export from Figma. |
| ★ `futee-booking-night` (booking screen, evening-first — **largest frame**) | `work/futee/assets/futee-booking-night.webp` | 9:16, flat | 🟡 | Visible inside `Futee/Group 1000002953.png` (matchmaking board) and `iPhone 11 Pro Max - 10.png`, but both carry board/device chrome. Needs a clean flat slice from `Futee web.svg`. |
| `futee-owner-backend` (pitch-owner back-end) | `work/futee/assets/futee-owner-backend.webp` | 16:10, flat | 🔴 | Not present as a standalone screen. |
| `futee-rating-ui` (show/no-show + 1–5 score) | `work/futee/assets/futee-rating-ui.webp` | 3:4, flat | 🔴 | Not present as a standalone screen. |
| `futee-final-shots` (×2, shipped hero shots) | `work/futee/assets/futee-final-1.webp`, `-2.webp` | 16:10, flat | 🟡 | Candidates in `Futee/iPhone 11 Pro Max - 3.png` and the `Group 100000295x` boards, all chrome-baked. Need clean slices. |
| flow-in-motion clip (find-game → book) | `work/futee/assets/futee-flow.mp4` (+ poster) | muted loop, ≤~4 MB | 🔴 | **Does not exist** — no video anywhere in project. Screen-record the prototype, or drop this addition. |

**Already in repo and usable (not placeholders):** `hero-illustration.png`, `solution-findgame-full.png`, `solution-matchmaking.png`, `solution-dashboard.png`, `solution-teams-*.png`, `screen-*.png`, `persona-*.png`, `problem-grid.png`, `killed-wireframe.png`, `reflection-*.png`. The interactive coach card is already built.

---

## EMF ACE — `work/emf-ace/assets/`

Strongest-covered page. Five phase images + the full-bleed marquee are all already in repo.

| Item | Target path | Status | Note |
|---|---|---|---|
| Asset wall (30–60 post thumbnails) | `work/emf-ace/assets/wall/` (new dir) | 🟡 | `EMF/` folder has ~10 `Instagram post - *.png` + event photos; repo has ~10 more. ~20 total — **short of 30–60**. Neel to export the rest of the campaign posts for a dense contact sheet. Buildable at reduced density now if desired. |
| Phase timeline hand-drawn line (5 nodes) | `work/emf-ace/assets/emf-phase-line.svg` | 🔴 | Neel to hand-draw (same batch rule as the My Process meander). |
| Phase images (Teaser/Reveal/Hype/Credibility/Event) | ✅ | `emf-teaser-*`, `emf-anniversary-11years`, `emf-countdown-*`, `emf-500-registered`, `emf-venue-ritz-carlton` all present. |
| Full-bleed outcome marquee photo | ✅ | `emf-event-marquee.jpg` in repo. |

---

## CSEDS — `work/cseds/assets/`

| Item | Target path | Status | Note |
|---|---|---|---|
| Legacy site screenshots (2, for before→after) | — | ⛔ **DROPPED** | Neel confirmed 2026-07-23 he doesn't have the old-site screenshots. The before→after composition is **cut from the spec** — not deferred, gone. |
| Lighthouse mobile score | — | ✅ **RESOLVED this session** | Both visible `[Lighthouse … placeholder]` spans **removed** from the live page (+ orphaned `.cs-lighthouse-placeholder` CSS). The surrounding prose already frames the missing benchmark honestly ("too new to have a performance benchmark worth quoting… rather than invent one"), so it reads clean without a number. If Neel later runs Lighthouse and wants the score in, it can be added then. |
| Ted Bennett testimonial | (quote block, hidden-if-empty) | 🔴 | Neel to request from client. Slot renders nothing until supplied. |
| Trust-stats junk-data flag | — | ⚠️ **To verify** | Spec reports the CSEDS screenshots show template trust-stats (97% on-time / 49+ pros desktop; 27% / 14+ mobile) — inconsistent junk inside a case study about faithfulness. Verify against live `csedsaust.com.au`; if still live, it's a client-site bug for Ted + a refresh-contract item, and screenshots get re-taken or the block cropped. |

---

## Into Yesterday — `work/into-yesterday/assets/`

| Item | Target path | Status | Note |
|---|---|---|---|
| Original score (audio) | `work/into-yesterday/assets/iy-score.mp3` | ⏸ **DEFERRED** | Neel said leave the music for later (2026-07-23). No audio file exists yet (`into yesterday/_extracted/garageband.png` is just a screenshot of the session). Audio player unbuilt until he exports the track. |
| Blender flythrough film (video) | `work/into-yesterday/assets/iy-film.mp4` (+ poster) | 🔴 | **No video anywhere.** Spec mentions a YouTube film from the original writeup — Neel to supply the URL or a self-hosted mp4. **Blocks the film embed.** |
| Storyboard, 8 individual frames | `work/into-yesterday/assets/iy-frame-1..8.jpg` | 🟡 | Repo has `iy-storyboard-1.jpg` + `-2.jpg` (2 composites). Source `into yesterday/_extracted/multi/` has `storyboard-0/1.png` (2 frames). Filmstrip wants 8 discrete frames — Neel to export, or the strip uses the composites as-is. |
| Speculative-status statement | ✅ | Keep exactly as written — a strength, per spec §3.4. |

---

## Blockers summary (what stops the rest of the spec today)

1. **Local preview is down** — `~/Desktop` has owner-only (`700`) permissions, so the dev server (and even `curl`) can't read the repo. Nothing can be visually verified. Deferred by Neel earlier; the case-study elevation work (stat strips, asset wall, before/after, filmstrip, embeds) all need visual iteration and shouldn't be pushed blind onto live pages.
2. **Missing assets** — the 🔴 rows above. Notably CSEDS before/after (no legacy shots), Into Yesterday audio + film (no media files at all), and Futee's clean flat screens (locked in a 91 MB Figma SVG).

## Shipped this session (safe, unblocked, no verification needed)

- `See all work →` 404 fixed on all four pages → `/index.html#chosen-work`.
- Homepage card **outcome lines** added (`project.outcome` in `assets/projects.js`, rendered as `.work-card-outcome`) — Claude-drafted from each study's own facts, **flagged in `projects.js` as awaiting Neel's approval** (standing rule is Neel writes copy; this is the one-off the user authorized).
- CSEDS **Lighthouse placeholders removed** (2 visible spans + orphaned CSS) — the page now reads clean; the honest surrounding prose stands on its own.
- CSEDS **before→after dropped** and Into Yesterday **audio deferred**, per Neel's 2026-07-23 calls.
