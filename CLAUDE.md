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

**Fix the live Futee case study.** See `FIX-SPEC-FUTEE.md`.

Three problems, in order:
1. **Images are Figma canvas screenshots** — visible selection handles, blue bounding boxes, `iPhone 12 Pro Max – 1` frame labels baked in. Needs clean re-export from Figma. **Most damaging issue on the site.**
2. **Nav pill covers section headings** — `scroll-padding-top` not clearing the pill's expanded height on this page.
3. **Before/after images are broken** — the "after" is an unreadable thumbnail of a whole board. Must be one-screen-vs-one-screen, equal size, both legible.

**Do not rewrite the Futee copy.** It's the strongest writing on the site.

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

5. **`scroll-padding-top` on `html` is required, sized to the pill's EXPANDED height.** The nav pill is `position: fixed`, so anchor jumps land underneath it. **This is currently broken on `/work/futee.html`.**

6. **Hero illustrations are 16:9 landscape.** On a portrait phone, `background-size: cover` crops so hard the viewport fills with blank wall. Use `contain` on mobile.

7. **Nav scroll-shrink needs a ~6px threshold.** Without it, trackpad jitter makes the pill flicker between states.

8. **Never ship images containing Figma UI** — selection handles, bounding boxes, frame labels. Export cleanly; don't crop around them.

9. **Never fabricate a metric.** Futee was a Figma prototype with no conversion rate. A fake number dies in the interview when someone asks "how did you measure that?"

10. **CSS `mask`/`mask-composite` multi-layer order matters — get it backwards and the element goes fully invisible, not "unmasked."** For the perforated-edge (postage-stamp) technique on `/resources.html`: the solid base layer (`linear-gradient(#000,#000)`) must be listed **first**, with the 4 perforation gradients listed after using `mask-composite: add, subtract, subtract, subtract, subtract` (matching order for `-webkit-mask-composite`). Listing the solid layer *last* (the order most CSS-tricks writeups show) renders as a fully transparent element in Chromium — not a square card, not a broken corner, just nothing, with no console error. If a masked element vanishes, suspect layer order before anything else.

---

## Specs — read in this order. Later ones supersede earlier.

| File | Covers | Status |
|---|---|---|
| `BUILD-SPEC.md` | Architecture, tokens, hero, data layer | ⚠️ Partly superseded |
| `BUILD-SPEC-NAV.md` | Floating pill, scroll shrink, pixel sprite | Current |
| `BUILD-SPEC-WORK.md` | Chosen Work — hover-expand rows | Current |
| `BUILD-SPEC-PROCESS.md` | My Process section + All Work → `/work.html` | Current |
| `BUILD-SPEC-FOOTER.md` | Falling contact pills (CSS, **no Matter.js**) | Current |
| `BUILD-SPEC-FUTEE.md` | The Futee case study — reference template | Built |
| `FIX-SPEC-FUTEE.md` | Fixes to the live Futee page | 🔴 **Do this first** |
| `BUILD-SPEC-HERO-CLOCK.md` | Clickable clock — "it's night in Lisbon right now" | Not built |
| `BUILD-SPEC-RESOURCES.md` | `/resources.html` — pan/zoom quadrant canvas of stamps | Built, placeholder data |

**⚠️ `BUILD-SPEC.md` is partly superseded.** It still describes a click-accordion for Chosen Work (now hover-expand — see `BUILD-SPEC-WORK.md`) and an All Work section on the homepage (now moved to `/work.html` — see `BUILD-SPEC-PROCESS.md`). **When they conflict, the later spec wins.**

---

## Site structure

```
/                  Hero → Chosen Work → My Process → Footer
/work.html         All Work        (not built — linked from "See all work")
/about.html        About           (not built)
/contact.html      Contact         (not built)
/work/futee.html   Case study      ✅ LIVE — needs fixes
/work/emf-ace.html Case study      ✅ LIVE
/work/cseds.html   Case study      ✅ LIVE
/resources.html    Quadrant canvas of stamps  ✅ LIVE — placeholder data, see below
```

**Nav:** Work · About · Contact · Resources. Work anchor-scrolls to Chosen Work (does *not* go to `/work.html`). About → `/about.html`. Contact → `/contact.html`. Resources → `/resources.html`. **Nothing in the nav points to `/work.html`** — it's reached only via "See all work".

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
- Neel's hand-drawn SVG assets (arrows, rings, underlines, separators, process timeline) live in the drawn-assets folder. Black, `stroke-width: 2`, `stroke-linecap: round` — **recolour in code, never edit the source SVG.**
- **Confirm asset filenames before wiring them in.** Don't guess.
- Neel has ~4 years industry experience (Design Lead at Media Mushroom) — **this is currently invisible on the site and it's his strongest credential.** He reads as a fresh grad. Worth surfacing.
