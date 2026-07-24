# BUILD-SPEC-CASE-STUDY-ELEVATION.md

Presentation-layer elevation for all four case studies (Futee, EMF ACE, CSEDS, Into Yesterday). Pasted in chat by Neel 2026-07-23. Full asset accounting lives in `ASSET-MANIFEST-CASE-STUDIES.md`.

## Scope overrides from Neel (this session)

The pasted spec says body-copy rewrites and homepage-card changes are **out of scope**. Neel explicitly overrode both in chat: *"I know the spec says write body copy is out of scope but i want you to do it and also improve the homepage card changes… make the best case studies possible."* Treated as a one-off exception to the standing "Neel writes the copy" rule — any Claude-authored copy is flagged in-file as awaiting his approval.

## The spec's intent (condensed)

Add the **skim layer** best-in-kind case studies have (Simon Pan reference): stat strips of monument numbers under each hook, "show don't describe" (fill Futee's 6 placeholders), an EMF asset wall making "1,000+ assets" visible, a CSEDS before→after + resolved Lighthouse, Into Yesterday's score + film made playable, and next-project chaining so no page dead-ends. Motion defers to `BUILD-SPEC-MOTION.md §6` — **note: that spec does not exist in the repo** (discarded earlier, never saved), so any motion reuses the site's existing restrained reveals.

## Build status (2026-07-23)

**Shipped (safe, unblocked):**
- `See all work →` 404 fixed on all four pages → `/index.html#chosen-work`.
- Homepage card outcome lines added (`project.outcome` in `assets/projects.js` → `.work-card-outcome`), Claude-drafted from each study's own facts, flagged for Neel's approval.
- `ASSET-MANIFEST-CASE-STUDIES.md` produced (per spec §5).

**Blocked / not built (see manifest for detail):**
- Everything requiring visual iteration — stat strips, asset wall, before→after, filmstrip, embeds — is held because the **local preview is down** (`~/Desktop` at `700` perms; server can't read files) and these must not be pushed blind onto live pages.
- Asset-dependent pieces missing their files: CSEDS legacy screenshots (none exist), Into Yesterday score audio + film (no media anywhere), Futee clean flat screens (locked in a 91 MB Figma SVG). All listed 🔴 in the manifest for Neel to supply.

## Next session

1. Restore preview access (fix `~/Desktop` perms) so case-study changes can be verified.
2. Pull the 🔴 assets from the manifest.
3. Then build: stat strips (reconcile with the existing `.{prefix}-meta` hero dl — don't duplicate), next-project chaining card (reuse `.work-card`), and the per-page pieces as assets land.
