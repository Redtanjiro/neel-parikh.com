# BUILD-SPEC-HERO-ABOUT-COLLAPSE.md

Pasted directly in chat by Neel, referencing wallofportfolios.in profile pages (e.g. rishika-gupta) as the pattern: hero collapses into a slim identity mark on scroll, About reveals full-width beneath it.

Read `CLAUDE.md` first. **This spec supersedes `BUILD-SPEC-HERO-SCROLL-TRANSITION.md` entirely** — that spec's sticky two-column landing panel (`#hero-illustration` sitting beside `.about-content`) is removed. The pose-crop assets it produced (`hero-pose-*-crop.webp`) are reused here, just retargeted.

## 1. Concept (as given)

Reference: wallofportfolios.in. At rest, hero fills the viewport. On scroll, hero content shrinks into a slim persistent bar while About's content fades/slides up beneath it; the bar stays put while the rest of the page scrolls underneath; reversing scroll reverses the whole thing.

## 2. Resolved during build — how this maps onto what's actually on the site

The literal spec (a new slim bar containing a re-laid-out name + shrunk illustration, built via a fresh `pin:true` GSAP ScrollTrigger) doesn't map cleanly onto the site as it actually exists today. Two things the spec draft wasn't written against:

* **A persistent identity bar already exists** — the fixed nav pill (`#site-nav`), which shows a small avatar sprite + "Neel Parikh" (or "NP" once scroll-shrunk) on every page, at every scroll depth. Building a second slim bar with its own name text would duplicate it.
* **A hero→About scroll transition already exists** — `#pose-scrub`, a hand-rolled (non-GSAP) scroll-driven element that already shrinks the hero pose illustration from full-hero size down to a small crop as you scroll, driven by a single `progress` value computed in a `scroll` listener (see `BUILD-SPEC-HERO-SCROLL-TRANSITION.md`). It currently hands off to a sticky landing panel beside About's text.

**Asked Neel directly how the new bar should relate to the existing nav pill** (rather than guess and risk building throwaway work) — answer: **merge into the nav pill, don't build a second one.**

Given that, the implementation is: **retarget the existing `#pose-scrub` mechanism** so instead of shrinking toward a landing panel beside About's copy, it shrinks and fades toward the nav pill's brand mark (`.nav-brand`) and disappears — a "handoff" cue, not a new persistent element. About's own layout drops the two-column grid and becomes a single full-width column (the mobile layout already does exactly this — see `BUILD-SPEC-HERO-SCROLL-TRANSITION.md` §5 — so it's applied at all widths now, not just narrow ones).

This also means: **no second GSAP-pinned ScrollTrigger.** CLAUDE.md's non-negotiable #2 already flags that stacking pinned sections is a proven source of scroll-math bugs (see `BUILD-SPEC-INTRO.md`'s history, before that intro was removed). "My Process" remains the only pinned section on `/`. The existing hand-rolled `#pose-scrub` scroll listener already does 90% of what this spec wants — reusing it instead of adding a competing `pin:true` timeline avoids that risk entirely and is significantly less code.

## 3. What changes

* `#hero-illustration` and its sticky two-column landing panel: **removed**. `.hero-about-wrap` goes single-column at all widths.
* `#pose-scrub`'s landing target (`rectB` in the existing scroll handler): was `#hero-illustration`'s rect, now `.nav-brand`'s rect. Opacity fades to 0 over the last part of the scroll zone (rather than snapping to a fully-opaque landed image) — it dissolves toward the identity mark rather than colliding with it.
* About's copy: replaced with Neel's approved paragraph (§4). The existing `.about-credential` line is trimmed to drop the now-redundant "Design Lead at Media Mushroom" (the new paragraph already says it) — kept only for the MDes fact the paragraph doesn't cover.
* "EMF ACE" in the new paragraph links to `/work/emf-ace.html` (a real, live case study) using the site's SVG stroke-draw underline hover — same treatment applied to "View case study →" and "See all work →". Maruti Suzuki / IIM Ahmedabad stay plain text — no page on this site to link them to, and the spec's own client-link note is explicitly conditional ("if these become clickable").
* About copy reveals word-by-word, staggered off the **same** `progress` value the pose-scrub and container fade already use (manual span-wrapping, not the SplitText plugin) — one shared timing source instead of a second competing scroll-driven system.
* Tool-stack icons get a small hover bump (scale + slight rotation, ~0.15s).
* `.nav-brand` gets a small hover "still alive" nudge (subtle scale), doing double duty as the acknowledgement that this is where the illustration hands off to.

## 4. Final About copy (approved, ship as-is)

> Neel Parikh is a product and interaction designer based in Sydney with over 4 years of experience across brand, UI/UX, and immersive design. He's led design as Design Lead at Media Mushroom, working with clients including Maruti Suzuki, IIM Ahmedabad, and EMF ACE. Neel is known for hand-illustrated craft — bringing a painterly, personal touch to interfaces that usually stay generic. Whether shaping brand systems or building AI-native and immersive product experiences, his work is driven by curiosity, precision, and a refusal to let good design look templated.

## 5. Explicitly out of scope

* A new slim bar element separate from the nav pill (resolved against — see §2)
* A second pinned ScrollTrigger (resolved against — see §2)
* New pose-crop assets — the existing `-crop.webp` files are reused, just retargeted
* Linking Maruti Suzuki / IIM Ahmedabad anywhere
