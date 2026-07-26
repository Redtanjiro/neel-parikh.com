# HANDOFF — neel-parikh.com, scroll-driven lamp portfolio

Paste this whole file into a new Claude Code session, opened at this folder
(`neel-parikh-site/`, which **is** the `Redtanjiro/neel-parikh.com` repo).
Written 2026-07-26, end of a Cowork session that replaced the old
vanilla-HTML/GSAP site with a new Next.js + WebGL build from scratch.

## Where things stand right now — read this first

**The last push's GitHub Actions run failed and the error hasn't been read
yet.** Two commits are already on `origin/main` (`5a98c32`, `bca9f49`), but
the deploy workflow (`.github/workflows/deploy.yml`) is failing. Your very
first job: get the actual log —

```bash
gh run list --limit 5
gh run view <run-id> --log-failed
```

(or the GitHub web UI → Actions tab → the failed run → the red step) —
and fix whatever it says before doing anything else. I never saw the log;
I was diagnosing this blind from a sandbox with no GitHub API access.

## What this project is

A full-page scroll experience, built from a spec pasted into chat (not a
committed file — reproduced in full below so nothing is lost). Core arc:
**hand-drawn room → everything leaves → lamp survives → lamp becomes
light → light becomes the workspace.**

Repo: `Redtanjiro/neel-parikh.com`, GitHub Pages (Source: **GitHub
Actions**, already set — don't need to touch Settings → Pages), custom
domain `neel-parikh.com` via `CNAME` (never delete that file) + Cloudflare
DNS. The previous site (vanilla HTML/CSS/JS + GSAP, no build step) is
archived locally at `V2/` — gitignored, never pushed, still on disk if
anything needs to be recovered from it.

## Stack

Next.js (App Router, static export via `output: "export"` in
`next.config.ts`) · TypeScript · Tailwind v4 · react-three-fiber + three +
three-stdlib (hand-rolled bloom — deliberately not
`@react-three/postprocessing`) · GSAP + ScrollTrigger · Lenis. Fonts are
self-hosted via `@fontsource` (Caveat, Pixelify Sans, Inter) specifically
so the site has zero external font requests — **don't switch these to
`next/font/google`**, it'll fail in network-restricted build environments
(this is how I found out: Google Fonts fetches 403'd in my sandbox).

`npm run dev` for local dev, `npm run build` produces a static `out/`
folder. If `npm run build` ever crashes with a bus error / segfault
pointing at a native binary (`@next/swc-*`, `lightningcss-*`,
`@tailwindcss/oxide-*`), that's a corrupted first download, not a real
bug — `rm -rf node_modules/<that package>` and reinstall just it. Hit this
twice on an arm64 sandbox; unlikely on a normal machine, but if GitHub
Actions' runner ever shows the same failure, that's the fix.

## Typography / palette (locked, not up for casual re-litigating)

Two typefaces plus one body face, deliberately: **Caveat** (hand-drawn,
warm) for the room/hero half of the page, **Pixelify Sans** (pixel-sans,
digital) for the lamp/about/work half, **Inter** for body copy/UI
throughout. Orange accent (`--accent: #e8622d`) on near-black warm-gray
background (`--bg: #0f0d0c`), cream lamp-glow (`--cream: #f5e3ab`). All in
`src/app/globals.css`.

## What's real vs. placeholder — the important part

**Seven of the spec's ten hero layers are real hand-drawn cutouts**, found
mid-build in the project's `../Drawn assests/` folder (note the typo —
that's the real folder name), sibling to this repo, outside it:

- `Home office interior@2x.png` → **lamp**
- `Home office interior@2x (1).png` → **table** (mug included)
- `Home office interior@2x (2).png` → **chair** (jacket included)
- `Home office interior@2x (3).png` → **window-curtains** (combined —
  the spec listed window/curtains-left/curtains-right as three separate
  files; Neel's own export came out as one, so that's what's used)
- `Home office interior@2x (4).png` → **kettle**
- `Home office interior@2x (5).png` → **fridge**
- `Working_pose.png` → **figure** (an old cursor-pose asset from the
  previous site's hero, re-used here since it's already exactly "person
  at a desk on a laptop")

All cropped to content bounds — a couple needed **alpha-threshold
cleanup**, not just `getbbox()`: some exports had scattered near-zero-alpha
noise pixels that dragged a naive bounding box out to the canvas edge.
Threshold at alpha > 20 before computing the crop box if you touch these
again. Converted to WebP with PNG fallback, in `public/hero/`.

**Only `wall` (the background) is still a placeholder** — a plain CSS
gradient in `src/components/hero-scene.tsx`. No cutout exists for it
anywhere in the project. If one turns up, swap it in the same way as the
others.

Everything else the spec asked for is genuinely built, not stubbed:

- **The shader particle lamp is a real GPU port**, not a placeholder —
  `src/lib/lamp-shader.ts`. Ported from the spec's `useFrame` CPU loop,
  including both precision fixes it called out: CPU-precomputed hash
  (`sin(i * 78.233 + 2.0)` at i=20000 collapses into banding if evaluated
  in a 32-bit GLSL float — computed in JS float64 instead, uploaded as an
  attribute) and the same fix for the golden-angle term.
- **The full scroll map** (`src/lib/beats.ts` has the vh budget table,
  `src/components/scroll-experience.tsx` builds the GSAP timeline): hero
  hold → room flies apart (per-layer stagger, heavy objects slower,
  ease-out) → lamp anchors to its final position → cone opens
  (`clip-path` wedge) → 4 snap-scrolled about lines → the burst
  (luminance-matched white-out) → particle reformation → unpinned work
  grid. `tl.totalDuration() === 1` is checked at build time in a
  `console.warn` — if you ever see that warning, every beat boundary in
  the table is off by the same ratio (classic scrubbed-GSAP-timeline
  footgun).
- **Mobile (`<900px`) and `prefers-reduced-motion: reduce`** branches via
  `gsap.matchMedia()` in the same file — reduced motion gets a genuinely
  different static page (no pin, no scrub, everything in normal document
  flow), not just a disabled animation.
- **Perf/a11y budget**: 20k particles desktop / 6k mobile, bloom off on
  mobile, DPR capped at 2, render loop pauses on tab-hidden, mouse
  parallax (not autorotate) gated to `(hover: hover) and (pointer: fine)`.

## Deviations from the spec — decisions I made, reversible if wrong

1. **Beat 9 ("the burst") is a scrub-based approximation of "time-based."**
   The spec wants a genuinely time-based ~400ms sub-timeline at
   peak-white so no one can scroll-park inside the blown-out frame. I
   implemented scrub + a snap-guard instead (see the comment above
   `ScrollTrigger.create` in `scroll-experience.tsx`) — close, but worth
   feeling out in a real browser and replacing with a true decoupled
   timeline if the parking behavior is noticeable.
2. **Spec section 12's open question, resolved**: the lamp exists as a
   DOM layer through beats 1–8, then *becomes* the WebGL particle system
   at the burst, rather than a persistent lamp shell surviving alongside
   the particles ("the reformation is a truer loop," per the spec's own
   framing of the two options). Reversible if that reads wrong in
   practice.
3. **Mobile timeline is compressed to 55% of the desktop scroll distance**
   with beat 2's per-layer stagger collapsed to a simpler group exit —
   spec explicitly allows this, hasn't been tuned on a real device.
4. **`/work/[slug]` case-study pages don't exist yet.** Cards in
   `src/data/projects.ts` link to `/work/futee` etc., which 404. Titles
   are real (Futee, EMF ACE, CSEDS, Into Yesterday); role/year/summary
   are TODO placeholders, not fabricated specifics.
5. **About-line copy is a draft** (`src/components/about-lines.tsx`) —
   line 1 is short on purpose (narrow cone apex). Neel's to edit, not
   yours to finalize.

## Never verified in a real browser

TypeScript is clean, the production build and static export both
succeeded repeatedly, and I confirmed the rendered static HTML contains
all expected content — but the sandbox this was built in has no browser.
The actual pin/scrub/shader *feel* — the one thing GSAP+WebGL work always
needs a real tab for — has never been looked at by human eyes. This is
the highest-value thing you can do that I couldn't: run `npm run dev`,
open it, and see whether the scroll mechanic and burst transition actually
feel right, before trusting any of the numeric tuning above.

## Immediate priority order

1. Get the failed Actions run's actual error and fix it.
2. Once deployed, look at `neel-parikh.com` for real and sanity-check the
   scroll feel end to end.
3. Tune beat 9 toward a true time-based sub-timeline if the scrub
   approximation feels parkable.
4. `wall.png` cutout, if Neel produces one.
5. `/work/[slug]` case-study pages.
6. Real about-line copy and work-card copy from Neel (not drafted by
   Claude — same "Neel writes the copy" principle the old project held
   to, worth keeping).
