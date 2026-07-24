# CLAUDE.md

Project constants for **neel-parikh.com**. Read this before touching anything.

---

## Non-negotiables

1. **NEVER delete the `CNAME` file.** It maps the custom domain. Deleting it breaks the site. This has happened before.
2. **Vanilla HTML/CSS/JS only, with one exception: GSAP.** No React, no other framework, no npm, no bundler, no build step. **GSAP (core + ScrollTrigger + SplitText) is loaded sitewide via the cdnjs CDN, added 2026-07-21** — every page has three `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/...">` tags plus a `gsap.registerPlugin(ScrollTrigger, SplitText)` call, right before that page's own inline `<script>` block. **Pinned to 3.13.0, not the 3.12.5 first requested** — `SplitText` was a paid "Club GreenSock" plugin and 404s on cdnjs at 3.12.5; it only became public in 3.13.0. Keep all three files on the same version. **`MorphSVGPlugin` was dropped entirely (2026-07-22)** when the homepage intro moved off the love→heart morph — nothing on the site uses `morphSVG` anymore, so all five pages now load exactly the same three-tag baseline, no per-page exception. No other third-party library — this is a deliberate, single exception, not a general opening. Everything still deploys straight to GitHub Pages with no build step; GSAP is a runtime script tag, not a bundled dependency. Before building a new scroll/reveal/text effect, check whether GSAP already does it rather than hand-rolling another `IntersectionObserver`/`stroke-dashoffset` version — but the existing hand-rolled systems (hero pose scrub, device-mockup parallax, footer pill drop, line-draw hovers) stay as they are; this isn't a mandate to port them. **The homepage frosted-glass intro (`BUILD-SPEC-INTRO.md`) was removed entirely (2026-07-22)** — no more `.intro-glass`, `#introGlass`/`#introWords`/`#introHeart`/`#introSignature` markup or `np_intro_shown` sessionStorage gate. **`#hero` is now pinned again (2026-07-22, `BUILD-SPEC-HERO-SPLIT-REVEAL.md`)** — a different mechanic, the hero illustration splits into two curtain-halves (`pin: true, pinSpacing: false`) to reveal `#about` sitting behind it. **"My Process" was removed entirely (2026-07-24)** — the pinned vertical scroll-scrubbed timeline section (markup, CSS, and its `PROCESS`-array JS) is gone from `/`; the hero-split is now the only pinned/scrubbed ScrollTrigger section on the page.
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
4. ~~Two homepage About-section placeholders~~ — **done.** The AU work-rights line was removed outright rather than filled in — `.about-work-rights` and its placeholder span no longer exist in `index.html`. The About content has since changed twice more (2026-07-22): first to a single third-person bio paragraph, then to the current layout — a big display-type statement (`#about-statement`, mixed heavy-sans/italic-serif, per-line stagger reveal) above that same paragraph as calmer supporting copy. See `BUILD-SPEC-HERO-SPLIT-REVEAL.md`.

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

`Fraunces` and `Caveat` exist but are **About-page only**. `Fraunces` was briefly removed from the Google Fonts import (2026-07-22) when the frosted-glass intro was deleted, then re-added the same day for the About display-statement's italic emphasis word (`.about-key`, `var(--font-voice)`) — still About-only, just a different consumer. Don't import either family anywhere beyond the About page.

**Case studies derive their OWN palette from their subject's world.** They share *structure*, not *look*.
- **Futee** = football at night under floodlights: `--pitch #0F7126` · `--floodlight #f2e338` · `--chalk #f4f5f0`

---

## Motion signature

**Lines draw themselves in.** Every hover mark is an SVG stroke animated via `stroke-dashoffset`, hidden → drawn. Nav underlines, discipline rings. Nothing fades or slides in as a plain rectangle.

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

14. **The pane validates computed styles, not rendered pixels — a passing `getComputedStyle` check on the target element proves nothing about what's painted on top of it.** Hit for real during the hero-split build (`BUILD-SPEC-SPLIT-FIX.md`): `getComputedStyle(aboutEl).backgroundColor` correctly reported the paper token at every scroll depth tested, yet Neel's real browser showed an opaque black panel where About should have appeared — `.hero`'s own un-faded `background: var(--ink)` was sitting in the stacking order between the split halves and `#about`, invisible to a computed-style check on `#about` alone since that check never asks what else occupies the same screen position. Visual bugs reported from a real browser (screenshots, "I can see X") need a paint-stack check — `document.elementsFromPoint(x, y).map(el => getComputedStyle(el).backgroundColor)` — or the user's own screenshot, before declaring something non-reproducing. Don't stop at confirming the target element's own styles are correct.

15. **GSAP timeline position labels are TIME, not fractions of scroll progress — and `scrub`/`tl.progress(p)` map onto a fraction of the timeline's TOTAL duration, not directly onto your authored position numbers.** Hit during the hero-split recompose (`BUILD-SPEC-HERO-SPLIT-REVEAL.md`): an interim version's tweens summed to a total duration of 0.9 (the last tween ended at 0.9, not 1.0), so every authored checkpoint silently drifted — "0.45" actually fired at real scroll-progress 0.5, "0.7" at ~0.78. Invisible by eyeballing scrubbed scroll behaviour or even by checking computed opacity at scroll positions that assume 1:1 mapping; only surfaced by driving `tl.progress(p)` directly and comparing the result against the authored labels. **Before trusting any multi-checkpoint scrubbed timeline, verify `tl.totalDuration() === 1`** (or whatever your intended scale is) — if the last tween doesn't end exactly there, every earlier checkpoint is off by the same ratio. Separately: the `stagger` keyword combined with explicit numeric position parameters didn't land where the numbers implied either — use explicit per-element `.to()` calls with named positions instead of `stagger` when a timeline has other position-sensitive tweens depending on exact sequencing.

16. **`#about-reveal`'s `position:sticky` needs its NEXT SIBLING (`#about-support`) to be at least as tall as the hero-split pin's own scroll distance, or it releases early and exposes Chosen Work while the reveal is still mid-fade.** CSS sticky isn't GSAP-pinned — it only stays glued to the viewport for as long as the remaining height of its containing block (`#about-content`) allows, which in practice means "however tall `#about-support` renders." This was fine when `#about-support` held a full bio paragraph; removing that paragraph (`BUILD-SPEC-ABOUT-CONTENT-REFRESH.md`, 2026-07-24) shrank it to ~190px while the split's `end:'+=900'` pin distance stayed the same — About started sliding away and exposing Chosen Work underneath at barely 20% of the reveal, confirmed live in Neel's own browser (faded/incomplete statement text with "Chosen Work" already visible below it), not just a Browser-pane artifact. **Fixed by shrinking the pin to `end:'+=300'` (matching what a lean `#about-support` can actually sustain) and adding desktop-only (`min-width:900px`) padding to `#about-support`/`.about-stack` so its rendered height (331px) comfortably clears 300px** — gated to desktop only because mobile never uses the sticky/pin at all and the extra padding there just looked like a stray gap. **Whenever `#about-support`'s content changes, re-check `#about-support`'s rendered height against the pin's `end` distance** (`document.getElementById('about-support').getBoundingClientRect().height` vs the ScrollTrigger's `end - start`) — do not just check `tl.totalDuration()===1` (trap #15), which stays satisfied even while this bug is happening, since it's a completely separate mechanism (CSS sticky range vs. GSAP timeline duration).

---

## Specs — read in this order. Later ones supersede earlier.

| File | Covers | Status |
|---|---|---|
| `BUILD-SPEC.md` | Architecture, tokens, hero, data layer | ⚠️ Partly superseded |
| `BUILD-SPEC-NAV.md` | Floating pill, scroll shrink, pixel sprite | Current |
| `BUILD-SPEC-WORK.md` | Chosen Work — hover-expand accordion rows | ⛔ Superseded by `BUILD-SPEC-ABOUT-CENTER-WORK-CARDS.md` — the accordion is gone, replaced by stacked cards |
| `BUILD-SPEC-PROCESS.md` | My Process section (original hover-driven horizontal timeline) + All Work → `/work.html` | ⛔ Superseded, then removed — the section (later rebuilt as a pinned vertical ScrollTrigger sequence) was deleted entirely 2026-07-24, by request; the All Work → `/work.html` link still stands |
| `BUILD-SPEC-FOOTER.md` | Falling contact pills (CSS, **no Matter.js**) | Current |
| `BUILD-SPEC-FUTEE.md` | The Futee case study — original nine-section template | ⛔ Superseded by `BUILD-SPEC-FUTEE-MOVES.md` |
| `FIX-SPEC-FUTEE.md` | Fixes to the old nine-section Futee page | ⛔ Moot — that page no longer exists |
| `BUILD-SPEC-FUTEE-MOVES.md` | Futee rebuilt as a four-move argument, locked copy | ⛔ Superseded by `BUILD-SPEC-FUTEE-V2.md` (new approved copy + asset treatment) |
| `BUILD-SPEC-FUTEE-MOCKUPS.md` | Addendum — scroll-inside/parallax device mockups on Moves 3 & 4 only | Built (mechanism reused, not superseded) |
| `BUILD-SPEC-FUTEE-V2.md` | Futee four-move, new approved copy — swaps the built night-play HTML mockup for an image placeholder, adds a third Move-4 bullet (pitch-owner backend) | Built |
| `BUILD-SPEC-HERO-CLOCK.md` | Clickable clock — "it's night in Lisbon right now" | ⚠️ Built, but the spec file itself was never saved to the repo — this table entry describes behavior that exists in `index.html`, not a doc you can open |
| `BUILD-SPEC-RESOURCES.md` | `/resources.html` — pan/zoom quadrant canvas of stamps | Built, placeholder data |
| `BUILD-SPEC-ABOUT.md` | Hero pose-layer system (cursor-driven, decoupled from time-of-day) + inline About section below hero | Built |
| `BUILD-SPEC-HERO-SCROLL-TRANSITION.md` | Illustration sticks and scrolls with the visitor from hero into About via a two-column landing panel (desktop only) — supersedes §4/§6 of `BUILD-SPEC-ABOUT.md` | ⛔ Superseded by `BUILD-SPEC-HERO-ABOUT-COLLAPSE.md` |
| `BUILD-SPEC-HERO-ABOUT-COLLAPSE.md` | Hero pose-scrub retargeted to dissolve into the nav pill instead of landing beside About; word-staggered bio reveal | ⛔ Never pushed — corrected by Neel after seeing screenshots, superseded by `BUILD-SPEC-HERO-SPLIT-REVEAL.md` before shipping |
| `BUILD-SPEC-HERO-SPLIT-REVEAL.md` | Hero illustration splits into two curtain-halves (pinned, `pinSpacing:false`) revealing `#about` behind it; About gets a big display-type statement with per-line stagger + hand-drawn squiggle underline, approved paragraph as calmer supporting copy beneath; Work accordion rows get scroll-reveal | Built |
| `BUILD-SPEC-ABOUT-CENTER-WORK-CARDS.md` | Two changes: (1) centres the About statement composition (was left-aligned) — statement/paragraph/tools all `text-align:center` + centred as blocks, `.about-content` itself `margin-inline:auto` so it lines up with the viewport's true centre, not a left-anchored column; (2) Chosen Work accordion → four stacked cards (Futee/EMF ACE/CSEDS/Into Yesterday — spec assumed 3, site actually has 4), reusing each case study's own hero image, outcome-line HTML-comment slots left for Neel, one `<a>` per card (single tab stop) | Built — `BUILD-SPEC-MOTION.md` unavailable (never saved to repo, see below), so card motion reuses the site's existing fade+rise reveal rather than an invented "ink-reveal"; not visually verified live, see the spec's completion report for why |
| `BUILD-SPEC-EMF-ACE.md` | EMF ACE case study, old 7-section → four-move; real campaign assets used where they exist, 2 facts still `[CONFIRM]` | Built |
| `BUILD-SPEC-CSEDS-MOVES.md` | CSEDS case study, old 8-section → four-move; all copy is `[COPY TBD]`, real assets reused | Built |
| `BUILD-SPEC-PRELOADER.md` | Homepage-only preloader — black hold → hand-drawn mug line-draw → signature → dissolve into the hero | ⛔ Superseded by `BUILD-SPEC-PRELOADER-V2.md` |
| `BUILD-SPEC-PRELOADER-V2.md` | Homepage preloader v2 — GSAP + MorphSVGPlugin, "love" wordmark morphs its "o" into a heart, then signature writes in letter by letter | ⛔ Superseded by `BUILD-SPEC-INTRO.md` — the black-screen blocking preloader is gone entirely |
| `BUILD-SPEC-INTRO.md` | Homepage intro v3 — a frosted-glass panel that pinned over the real hero and cleared via scroll, "hand drawn with love" signature + spinning heart | ⛔ Removed entirely (2026-07-22), by request — the hero now renders with no intro/preloader of any kind. `MorphSVGPlugin` stays dropped (nothing on the site used it even while this spec was live). |
| `BUILD-SPEC-INTO-YESTERDAY.md` | Fourth case study, `/work/into-yesterday.html` — a speculative Vivid Sydney installation, DDES9010 coursework, not client work. Own four-move build, own palette, no device frames | Built — copy is Claude-drafted per an explicit one-off exception to "Neel writes the copy," awaiting his edit/approval before it ships |
| `BUILD-SPEC-ABOUT-CONTENT-REFRESH.md` | Replaces the About statement copy (four lines, "hello! I am an AI-native product designer, illustrator and immersive designer with 3+ years of experience.", squiggle moved to "AI-native"), removes the old `#about-copy-text` bio paragraph entirely, fixes the tool-stack row's layout (was column, now the horizontal row it was meant to be), tightens the About→Chosen Work gap; trims the credential line to just "MDes at UNSW." | Built — Neel's own approved copy, reproduced verbatim; My Process no longer exists as of the same day so it isn't part of this spec's "gap" scope. **Removing the bio paragraph triggered a real bug (trap #16)** — reported live by Neel with a screenshot, not caught by this session's own Browser-pane checks — fixed by shrinking the hero-split pin's distance and adding desktop-only padding back to `#about-support` |

**⚠️ `BUILD-SPEC.md` is partly superseded.** It still describes a click-accordion for Chosen Work (now hover-expand — see `BUILD-SPEC-WORK.md`) and an All Work section on the homepage (now moved to `/work.html` — see `BUILD-SPEC-PROCESS.md`). **When they conflict, the later spec wins.**

---

## Site structure

```
/                  Hero (with cursor-driven pose layer) → About → Chosen Work → Footer
/work.html         All Work        (not built — linked from "See all work")
/about.html        About           (not built — About lives inline on / at #about instead, see below)
/contact.html      Contact         (not built)
/work/futee.html          Case study      ✅ LIVE — four-move rebuild
/work/emf-ace.html        Case study      ✅ LIVE
/work/cseds.html          Case study      ✅ LIVE
/work/into-yesterday.html Case study      ✅ Built — speculative/coursework, not client work; see BUILD-SPEC-INTO-YESTERDAY.md
/resources.html    Quadrant canvas of stamps  ✅ LIVE — placeholder data, see below
```

**Into Yesterday sits in the Chosen Work grid alongside the client case studies** (a card, not an accordion row, since 2026-07-23 — see `BUILD-SPEC-ABOUT-CENTER-WORK-CARDS.md`) (`featured: true` in `assets/projects.js`, `speculative: true` retained as metadata for whenever `/work.html` gets built) — the earlier session's separate "Speculative / Coursework" block was removed by request; there's no visual distinction from client work in the grid itself, only within the case study page's own honest-framing copy.

**Nav:** Work · About · Contact · Resources. Work anchor-scrolls to Chosen Work (does *not* go to `/work.html`). **About anchor-scrolls to `#about` on the homepage** (not a separate route — see `BUILD-SPEC-ABOUT.md`). Contact → `/contact.html`. Resources → `/resources.html`. **Nothing in the nav points to `/work.html`** — it's reached only via "See all work".

**The hero illustration splits to reveal About (2026-07-22, `BUILD-SPEC-HERO-SPLIT-REVEAL.md`) — replaces the never-shipped nav-pill dissolve from the previous session.** `#hero`'s illustration layer (`.hero-scenes`/`.hero-poses`/`.hero-dim`) is duplicated into `.hero-half--left`/`.hero-half--right`, each clip-pathed to one side (1% overlap at the seam to avoid a gap during motion) — only the illustration duplicates, not the interactive UI (discipline buttons, clock), which stays singular and just fades, to avoid duplicate-`id` bugs (trap #4). `#hero` pins with `pin: true, pinSpacing: false`. **The dark fallback `background` (shown briefly before the first time-of-day scene image fades in) lives on `.hero-half`, not on `.hero` itself** (fixed 2026-07-23, `BUILD-SPEC-SPLIT-FIX.md`) — `.hero`'s own box doesn't move when its children (the halves) translate apart, so a background on `.hero` painted over `#about` for the whole split instead of revealing it; found via `document.elementsFromPoint`, not computed-style checks (see trap #14).

**`#hero` and `#about` share one `.hero-stage` container (`position:relative`) — `#hero` is `position:absolute; top:0; left:0; width:100%; height:100vh` inside it, contributing zero document-flow height ever.** `#about` (normal flow, tall) is what actually determines the stage's height. This isn't optional structure — a first build that only used `pinSpacing:false` on a normal-flow `#hero` produced a full black gap after unpinning, because (confirmed against GSAP's own docs) `pinSpacing:false` only skips reserving *extra* space *during* the pin; it does nothing about the pinned element's own resting height occupying flow space *after* it releases. Full writeup, plus two more bugs found the same way (a GSAP pin-spacer width-measurement quirk specific to absolutely-positioned pin targets, and `#hero`'s own un-faded `background` color still covering content underneath after the split completed) in `BUILD-SPEC-HERO-SPLIT-REVEAL.md`'s Build notes.

**Recomposed 2026-07-23 into explicit, verified checkpoints** (see `BUILD-SPEC-HERO-SPLIT-REVEAL.md`'s recompose Build notes) — `#about-content` splits into two groups: `#about-reveal` (eyebrow + `#about-statement`, `position:sticky; top:0; height:100vh; display:flex; justify-content:center; padding-top:110px`, its own opaque `--paper` background) keeps the statement centred in the pinned viewport and clear of the nav at every progress point; `#about-support` (credential/résumé/tools, grouped) stays at `opacity:0` for the entire pin and only reveals via its own trigger (`start:'bottom top'` on `#hero`) once scrolled *past* it — never mid-pin, never before the statement. One shared scrubbed timeline drives all of it: hero-UI fade `[0,0.15]`, halves part `[0.1,0.7]`, `#about-reveal` flips visible at `0.45` then its **four** lines reveal via named per-line positions (not the `stagger` keyword — see trap #15) through `0.78`, squiggle draws `[0.78,0.9]`, `#hero` cleanup-fades `[0.9,1.0]` — retimed 2026-07-24 for a fourth line (`BUILD-SPEC-ABOUT-CONTENT-REFRESH.md`), still verified landing on exactly 1.0. **The pin's own `end` distance is `+=300` (was `+=900`), shrunk the same day after the fourth-line retiming exposed trap #16** (`#about-support` shrinking when its bio paragraph was removed left too little CSS-sticky "stick room" for a 900px pin — see trap #16 before ever changing this number or `#about-support`'s height again). `scrub` is `0.25` (was `0.5`), tightened at the same time. **Every tween's end time must be checked against `tl.totalDuration()` — see trap #15**; position labels are time, not scroll-fraction, and the total must land on exactly 1.0 or every checkpoint drifts. `#hero` needs `z-index: 10` (below `.site-nav`'s 100, above `#about`'s default) so it visually covers About until parted. `#about-reveal`'s sticky positioning **cannot be visually verified in this Browser pane** — trap #13 — confirmed correct only via `getComputedStyle`/`elementsFromPoint`, needs checking in a real browser. Mobile (`<900px` for the GSAP `matchMedia`, `<820px` for the hero's own CSS layout breakpoint — a pre-existing small mismatch, not introduced here): no split, no stage overlay, no sticky — `.hero`, `.hero-stage`, `#about-reveal` all revert to normal static/relative flow, `#about-support` shown via a CSS-only override (must be declared *before* its own base rule in source order, or the override silently loses — see the recompose Build notes), `.hero-half--right` hidden and `.hero-half--left`'s clip-path removed so hero renders as one plain illustration, matching how every other pinned/scrubbed effect on this site degrades below its breakpoint.

**`#about` section (between hero and Chosen Work):** single-column full-width — display statement (`#about-statement`, four lines: "hello! / I am an *AI-native* product designer, / illustrator and immersive designer / with 3+ years of experience.", squiggle under `.about-key` = "AI-native", replaces the earlier three-line statement + separate bio paragraph 2026-07-24, `BUILD-SPEC-ABOUT-CONTENT-REFRESH.md` — the old `#about-copy-text` bio paragraph is gone entirely, no second body-text block) + trimmed credential line + résumé link + a 4-icon tool-stack row (Figma/Adobe/Procreate/Claude, inline SVG, ink/amber only — no brand-colour badges, hover bump added 2026-07-22). **The tool row's markup already existed before 2026-07-24 but `.tool-row` was `flex-direction: column`, rendering it as a vertical stack, not the horizontal strip it was meant to be — fixed to `row` + `flex-wrap` that day.** Gap between `#about` and Chosen Work tightened the same day (`.hero-about-wrap` bottom padding + `.chosen-work` top padding both reduced — combined gap ~240px → ~120px at desktop widths). **No side illustration panel** — see the hero-split note above for what reveals it instead.

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
