# CLAUDE.md

Project constants for **neel-parikh.com**. Read this before touching anything.

---

## Non-negotiables

1. **NEVER delete the `CNAME` file.** It maps the custom domain. Deleting it breaks the site. This has happened before.
2. **Vanilla HTML/CSS/JS only.** No React, no framework, no npm, no bundler, no build step, no third-party libraries. Deploys straight to GitHub Pages. If a solution requires a build step, it is the wrong solution.
3. **Root-relative paths** (`/assets/...`) so pages resolve from any route.

---

## Stack

- GitHub: `Redtanjiro/neel-parikh.com` · GitHub Pages + Cloudflare DNS
- Neel Parikh — interaction & immersive designer, Sydney. MDes at UNSW.
- Email: neelparikh7@gmail.com

---

## 🔴 Current priority

All three case studies (`/work/futee.html`, `/work/emf-ace.html`, `/work/cseds.html`) are now four-move and hold real, placeholder-labelled asset slots — see `BUILD-SPEC-FUTEE-V2.md`, `BUILD-SPEC-EMF-ACE.md`, `BUILD-SPEC-CSEDS-MOVES.md`. Open items, in priority order:

1. **Futee real assets** — 6 placeholder slots await final art: `futee-cover`, `futee-process-teardown`, `futee-booking-night` (⭐ largest, make-or-break), `futee-owner-backend`, `futee-rating-ui`, `futee-final-shots` (×2). The coach card is the one thing already built for real (interactive hover/flip).
2. **EMF-ACE confirms** — India→Abu Dhabi remote framing is now confirmed (designed remotely from India, environmental branding executed on-site in a single day) and no longer marked. One `[CONFIRM]` span remains: the studio name ("Media Mushroom," in the hero meta's Role line). One placeholder remains (`emf-award-or-spread`, optional) — everything else uses real campaign assets already in `work/emf-ace/assets/`.
3. **CSEDS Lighthouse score** — the one genuinely missing fact, two placeholder chips (`.cs-lighthouse-placeholder`) waiting on a real mobile score run against the live site.
4. Two homepage About-section placeholders from `BUILD-SPEC-ABOUT.md` — the blurb (`<!-- ABOUT COPY GOES HERE -->`) and the AU work-rights line (`<!-- WORK RIGHTS LINE GOES HERE -->`) in `index.html`. Don't guess at citizen/PR/visa status.

**Don't assume old case-study copy was "unwritten" just because a new spec says so** — check the live page first. This session found EMF-ACE and CSEDS both already had specific, real, previously-approved copy that a fresh spec incorrectly assumed didn't exist yet; both were restructured into four moves rather than overwritten with generic placeholder text. See the "Copy note" in each spec file.

**The locked copy in `BUILD-SPEC-FUTEE-MOVES.md` is Neel's, reproduced verbatim.** Don't paraphrase it on future edits.

---

## Design tokens — never hardcode these

```css
--display : 'Bricolage Grotesque'  /* headlines, titles, discipline words, wordmark */
--body    : 'DM Sans'              /* paragraphs, descriptions */
--ui      : 'Inter'                /* nav, eyebrows, labels, buttons, captions */
--mono    : 'JetBrains Mono'       /* clock, row numbers, data/meta */

--amber : #e8a13a   /* THE single accent. Hover states, highlights. */
--ink   : #141210   /* near-black */
--paper : #f4f1ea   /* warm off-white — page background */
--line  : rgba(20,18,16,0.12)
```

`Fraunces` and `Caveat` exist but are **About-page only** — don't import them elsewhere.

**Case studies derive their OWN palette from their subject's world.** They share *structure*, not *look*.
- **Futee** = football at night under floodlights: `--pitch #0F7126` · `--floodlight #f2e338` · `--chalk #f4f5f0`

---

## Motion signature

**Lines draw themselves in.** Every hover mark is an SVG stroke animated via `stroke-dashoffset`, hidden → drawn. Nav underlines, discipline rings, process timeline. Nothing fades or slides in as a plain rectangle.

`prefers-reduced-motion` respected everywhere. Animate `transform`/`opacity` only.

**Motion must explain something.** The Futee match timer, the counting stats, the self-drawing timeline — these carry meaning. Fade-ins on every section, parallax everywhere, and text sliding in word-by-word do not. Motion that doesn't explain delays the reader from reaching the reasoning, which is what they came for.

---

## Traps — real bugs already hit. Do not re-introduce.

1. **`pathLength` is an SVG *attribute*, not a CSS property.** `pathLength: 1` in a CSS rule silently does nothing, breaking the `stroke-dasharray:1 / stroke-dashoffset:1` hide-then-draw technique — the stroke renders fully visible at rest. Set `pathLength="1"` on the `<path>` element. Belt-and-braces with `opacity: 0` at rest.

2. **Never put `mix-blend-mode: difference` on the header.** It inverts everything inside it, so amber comes out muddy blue — and a child *cannot* opt out of its parent's blend group. Use `text-shadow` for nav legibility.

3. **Stretched hand-drawn SVGs need two attributes.** `preserveAspectRatio="none"` so the mark spans its container, and `vector-effect: non-scaling-stroke` so the stroke keeps a consistent hand-drawn weight instead of thinning out.

4. **Never let the clock exist in two places.** Duplicate `id="clock"` / `id="time-label"` is invalid HTML and `getElementById` silently returns only the first — breaking the clock outright. It lives in the nav pill. Nowhere else.

5. **`scroll-padding-top` on `html` is required, sized to the pill's EXPANDED height.** The nav pill is `position: fixed`, so anchor jumps land underneath it.

6. **Hero illustrations are 16:9 landscape.** On a portrait phone, `background-size: cover` crops so hard the viewport fills with blank wall. Use `contain` on mobile.

7. **Nav scroll-shrink needs a ~6px threshold.** Without it, trackpad jitter makes the pill flicker between states.

8. **Never ship images containing Figma UI** — selection handles, bounding boxes, frame labels. Export cleanly; don't crop around them.

9. **Never fabricate a metric.** Futee was a Figma prototype with no conversion rate. A fake number dies in the interview when someone asks "how did you measure that?"

10. **CSS `mask`/`mask-composite` multi-layer order matters — get it backwards and the element goes fully invisible, not "unmasked."** For the perforated-edge (postage-stamp) technique on `/resources.html`: the solid base layer (`linear-gradient(#000,#000)`) must be listed **first**, with the 4 perforation gradients listed after using `mask-composite: add, subtract, subtract, subtract, subtract` (matching order for `-webkit-mask-composite`). Listing the solid layer *last* (the order most CSS-tricks writeups show) renders as a fully transparent element in Chromium — not a square card, not a broken corner, just nothing, with no console error. If a masked element vanishes, suspect layer order before anything else.

11. **Not a code trap — a verification-tool quirk.** The Claude Code Browser pane's screenshot capture is unreliable at some `window.scrollTo()` positions on tall pages: it can return a blank frame, or a frame mid-way through a CSS transition (translucent/washed-out), even though `getComputedStyle`, bounding rects, and `elementFromPoint` all report the page is correct. Reproduces on already-shipped pages too (confirmed on `/work/cseds.html`, and again on `/` past the hero once `BUILD-SPEC-HERO-SCROLL-TRANSITION.md` made the page taller — screenshots came back reliably blank at every scroll position at or past the About section, across fresh tabs, native anchor-jumps, and multiple viewport sizes, while `getBoundingClientRect`/`getComputedStyle`/`elementFromPoint` all confirmed the sticky illustration and About content were laid out and painted correctly), so it isn't something to "fix" in page CSS. When a screenshot looks broken: re-screenshot the same scroll position without re-scrolling (rules out a mid-transition snapshot), and cross-check with `get_page_text` / computed-style JS calls before concluding the page itself is broken. Same root cause also affects native `<img loading="lazy">`: it doesn't reliably fetch after a synthetic `scrollTo()` jump on a very tall page (confirmed on `/work/futee.html` past ~4000px), even though the image loads instantly on direct navigation or once it's within the initial eager-load margin. Don't remove `loading="lazy"` from real page code to work around this — it's correct for real users on a multi-MB below-the-fold image; only strip it temporarily, in a live JS console, to visually confirm a mockup during verification.

12. **Two more verification-tool quirks, both confirmed while building `BUILD-SPEC-ABOUT.md` — neither is a real site bug.** (a) The Browser pane's local dev-server preview caches an HTML response **by URL**, so after editing a file and reloading the *same* tab/URL you can still be shown pre-edit markup — confirmed when an already-edited nav link kept reading its old `href` in one tab while a sibling tab on the identical URL showed the fix. Append a throwaway query string (`?cb=1`, bump the number each time) to force a real fetch when a reload doesn't seem to reflect a just-saved edit; don't assume the file write failed. (b) Reading `window.scrollY` (or any scroll-position property) in the *same* `javascript_tool` call that just triggered the scroll (`scrollTo`, `.click()` on an anchor, `scrollIntoView()`) returns a stale pre-scroll value — the scroll did happen, the read just raced it. Add a `computer` `wait` (~1s) before the follow-up read, or check in a separate tool call.

13. **`position: sticky` never visually clamps in the Browser pane, regardless of how the scroll is triggered.** Confirmed with a minimal from-scratch test element (`position:sticky; top:50px` on a plain div, no grid, no ancestors) appended straight to `body` — its viewport `top` tracked `scrollY` 1:1 with zero clamping at every offset tested, identical to `position:static`. `getComputedStyle` still correctly reports `position: sticky` and the right `top` value, so the CSS is right; the tool's compositor just doesn't apply the constraint the way a real browser does. Also confirmed in the same session: `requestAnimationFrame` callbacks registered via `javascript_tool` don't fire between separate tool calls (waited 5s+, never ran) — don't gate scroll-driven logic behind rAF if you need to verify it through this tool; a plain synchronous scroll-listener call is both simpler and actually testable here. Net effect: any sticky-positioning or rAF-scroll-effect work needs to be verified by the human in their own browser (`localhost` + a real tab) — computed-style/rect checks in this tool can confirm the CSS/JS *would* work, but can't confirm the pin/scrub itself visually holds.

---

## Specs — read in this order. Later ones supersede earlier.

| File | Covers | Status |
|---|---|---|
| `BUILD-SPEC.md` | Architecture, tokens, hero, data layer | ⚠️ Partly superseded |
| `BUILD-SPEC-NAV.md` | Floating pill, scroll shrink, pixel sprite | Current |
| `BUILD-SPEC-WORK.md` | Chosen Work — hover-expand rows | Current |
| `BUILD-SPEC-PROCESS.md` | My Process section + All Work → `/work.html` | Current |
| `BUILD-SPEC-FOOTER.md` | Falling contact pills (CSS, **no Matter.js**) | Current |
| `BUILD-SPEC-FUTEE.md` | The Futee case study — original nine-section template | ⛔ Superseded by `BUILD-SPEC-FUTEE-MOVES.md` |
| `FIX-SPEC-FUTEE.md` | Fixes to the old nine-section Futee page | ⛔ Moot — that page no longer exists |
| `BUILD-SPEC-FUTEE-MOVES.md` | Futee rebuilt as a four-move argument, locked copy | ⛔ Superseded by `BUILD-SPEC-FUTEE-V2.md` (new approved copy + asset treatment) |
| `BUILD-SPEC-FUTEE-MOCKUPS.md` | Addendum — scroll-inside/parallax device mockups on Moves 3 & 4 only | Built (mechanism reused, not superseded) |
| `BUILD-SPEC-FUTEE-V2.md` | Futee four-move, new approved copy — swaps the built night-play HTML mockup for an image placeholder, adds a third Move-4 bullet (pitch-owner backend) | Built |
| `BUILD-SPEC-HERO-CLOCK.md` | Clickable clock — "it's night in Lisbon right now" | ⚠️ Built, but the spec file itself was never saved to the repo — this table entry describes behavior that exists in `index.html`, not a doc you can open |
| `BUILD-SPEC-RESOURCES.md` | `/resources.html` — pan/zoom quadrant canvas of stamps | Built, placeholder data |
| `BUILD-SPEC-ABOUT.md` | Hero pose-layer system (cursor-driven, decoupled from time-of-day) + inline About section below hero | Built |
| `BUILD-SPEC-HERO-SCROLL-TRANSITION.md` | Illustration sticks and scrolls with the visitor from hero into About (desktop only) — supersedes §4/§6 of `BUILD-SPEC-ABOUT.md` | Built |
| `BUILD-SPEC-EMF-ACE.md` | EMF ACE case study, old 7-section → four-move; real campaign assets used where they exist, 2 facts still `[CONFIRM]` | Built |
| `BUILD-SPEC-CSEDS-MOVES.md` | CSEDS case study, old 8-section → four-move; all copy is `[COPY TBD]`, real assets reused | Built |

**⚠️ `BUILD-SPEC.md` is partly superseded.** It still describes a click-accordion for Chosen Work (now hover-expand — see `BUILD-SPEC-WORK.md`) and an All Work section on the homepage (now moved to `/work.html` — see `BUILD-SPEC-PROCESS.md`). **When they conflict, the later spec wins.**

---

## Site structure

```
/                  Hero (with cursor-driven pose layer) → About → Chosen Work → My Process → Footer
/work.html         All Work        (not built — linked from "See all work")
/about.html        About           (not built — About lives inline on / at #about instead, see below)
/contact.html      Contact         (not built)
/work/futee.html   Case study      ✅ LIVE — four-move rebuild
/work/emf-ace.html Case study      ✅ LIVE
/work/cseds.html   Case study      ✅ LIVE
/resources.html    Quadrant canvas of stamps  ✅ LIVE — placeholder data, see below
```

**Nav:** Work · About · Contact · Resources. Work anchor-scrolls to Chosen Work (does *not* go to `/work.html`). **About anchor-scrolls to `#about` on the homepage** (not a separate route — see `BUILD-SPEC-ABOUT.md`). Contact → `/contact.html`. Resources → `/resources.html`. **Nothing in the nav points to `/work.html`** — it's reached only via "See all work".

**`#about` section (between hero and Chosen Work):** blurb + "~4 years in industry" credential + résumé link, two placeholders still open (see 🔴 Current priority above) + a 4-icon tool-stack row (Figma/Adobe/Procreate/Claude, inline SVG, ink/amber only — no brand-colour badges).

**`/resources.html` placeholder data:** the `RESOURCES` array (bottom of the file, in the inline `<script>`) currently holds 12 placeholder entries (3 per quadrant) with `url: 'https://example.com'` and notes explicitly marked "Placeholder —". Swap in real picks by editing that one array — nothing else needs to change (layout, minimap, and the mobile/a11y list all derive from it). Quadrant labels are Reading / Inspiring / Silly / Useful, set in the `QUADRANTS` array just above it.

---

## Data layer

Single source of truth: `window.PROJECTS` in `/assets/projects.js`. Read by every section that lists work. **Adding a project = appending one object.** Never duplicate project data across files.

---

## Case-study rules (learned the hard way)

Reviewers **scan for signals** — they don't read linearly. They look for **judgment, trade-offs, and reflection.**

1. **Descriptive headings, never phase names.** ❌ "Research" ✅ "Discovering how much customers care about privacy." Generic headings tell a hiring manager you did what every other designer did.
2. **Outcome first.** They may give the page 60 seconds. Put the result at the top.
3. **"What I killed" is the highest-signal section.** Show a direction you abandoned and why. Easiest to omit, hardest to fake.
4. **Never fabricate metrics.** Use honest numbers — people interviewed, personas built, iterations run.
5. **Don't lean on project names as the payload.** Reviewers don't know what "EMF ACE" is. Concrete detail persuades; the name is a footnote.
6. **Neel writes the copy, not the AI.** Every case study is a document he'll be cross-examined on in an interview. Workflow: he brain-dumps → Claude interviews him → Claude structures and edits. **The thinking stays his.**

---

## Context

- Neel is in **Sydney (AEST, UTC+10)**. Verify the current date before anything date-dependent.
- Neel's hand-drawn SVG assets (arrows, rings, underlines, separators, process timeline) live in `Drawn assests/` (typo, with a space — that's the real folder name) at the project root, **outside this repo**, sibling to `neel-parikh-site/`. Black, `stroke-width: 2`, `stroke-linecap: round` — **recolour in code, never edit the source SVG.** Pull a copy into `neel-parikh-site/assets/` (optimized as needed) rather than referencing the outside folder from any page.
- **Confirm asset filenames before wiring them in.** Don't guess.
- Neel has ~4 years industry experience (Design Lead at Media Mushroom) — **this is currently invisible on the site and it's his strongest credential.** He reads as a fresh grad. Worth surfacing.
