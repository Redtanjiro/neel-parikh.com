# neel-parikh.com — scroll-driven lamp portfolio

A hand-drawn room empties out. A lamp survives. The lamp becomes light.
The light becomes the workspace. Built from `BUILD-SPEC-SCROLL-LAMP.md`
(pasted into chat, not committed here as a file).

## Stack

Next.js (App Router, static export) · TypeScript · Tailwind v4 ·
react-three-fiber + three + three-stdlib (hand-rolled bloom, no
`@react-three/postprocessing`) · GSAP + ScrollTrigger · Lenis.

Two typefaces plus one body face, per the brief: **Caveat** (hand-drawn,
warm — the room/hero half) and **Pixelify Sans** (pixel-sans, digital —
the lamp/about/work half), both self-hosted via `@fontsource` so the site
has zero external font requests. **Inter** for body copy/UI throughout.
Orange accent (`--accent`) on a near-black warm-gray background
(`--bg`), cream lamp-glow (`--cream`) — see `src/app/globals.css`.

## Run it

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # static export → out/
```

`next.config.ts` is set to `output: "export"` — `npm run build` produces a
plain static `out/` folder, deployable to GitHub Pages, Cloudflare Pages,
or any static host, same as the vanilla-HTML site this replaces.

**Sandbox note:** if `npm install` errors with `ENOTEMPTY`/rename failures,
or a native binary (`@next/swc-*`, `lightningcss-*`, `@tailwindcss/oxide-*`)
crashes with a bus error / segfault on first run, delete that specific
package's folder from `node_modules` and reinstall just it — a corrupted
first download of a native binary, not a real project issue. Hit and fixed
this twice while building (arm64 sandbox), unlikely on a normal machine.

## What's real vs. placeholder

**Fully built and working:**
- The particle lamp itself — a genuine GPU vertex-shader port of the
  spec's `useFrame` loop (`src/lib/lamp-shader.ts`), not a placeholder.
  Bulb/shade/beam/pool/ambient regions, `uFormation` explode↔reform,
  flicker, the two precision-trap fixes (CPU-precomputed hash + golden
  angle).
- The full scroll map (`src/lib/beats.ts`, `src/components/scroll-experience.tsx`):
  hero hold → room flies apart (per-layer stagger, heavy objects slower)
  → lamp anchors → cone opens (`clip-path` wedge) → 4 snap-scrolled about
  lines → the burst (luminance-matched white-out) → particle reformation
  → unpinned work grid. `tl.totalDuration() === 1` is checked at build
  time (see code comment — the classic scrubbed-GSAP-timeline trap).
- Mobile (`<900px`) and `prefers-reduced-motion: reduce` branches via
  `gsap.matchMedia()` — reduced motion gets a genuinely different static
  page, not a disabled animation.
- Perf/a11y budget from spec section 10: 20k particles desktop / 6k
  mobile, bloom off on mobile, capped DPR, tab-hidden pause, mouse
  parallax (not autorotate) gated to `(hover: hover) and (pointer: fine)`.

**Placeholder, needs your input before this ships:**

1. **Seven of the ten hero layers are real** — `lamp`, `kettle`, `fridge`,
   `table` (mug included), `chair` (jacket included), a combined
   `window-curtains` (found in `Drawn assests/` as "Home office
   interior@2x*.png"), and `figure` (found under the name
   `Working_pose.png` — an old cursor-pose asset from the previous site
   that happens to already be exactly "you, at a desk, on a laptop").
   All cropped to content bounds (a couple needed alpha-threshold
   cleanup — stray near-zero-alpha noise pixels were dragging a naive
   bbox out to the canvas edge) and converted to WebP+PNG in
   `public/hero/`. **Only `wall` (the background) still doesn't exist as
   a cutout** — it's a plain CSS gradient in `hero-scene.tsx` for now.
2. **About-line copy is a draft** (`src/components/about-lines.tsx`) —
   line 1 is short on purpose (cone apex is narrow). Yours to edit.
3. **Work-card content is a draft** (`src/data/projects.ts`) — titles are
   real (Futee, EMF ACE, CSEDS, Into Yesterday), role/year/summary are
   TODO placeholders, not fabricated specifics.
4. **`/work/[slug]` case-study pages aren't built** — the cards link to
   `/work/futee` etc., which 404 for now.
5. **Beat 9 is a scrub-based approximation of "time-based."** The spec
   asks for a genuinely time-based 400ms sub-timeline at peak-white so
   no one can scroll-park inside the blown-out frame; I implemented a
   scrub-with-snap-guard instead (see the comment above the
   `ScrollTrigger.create` call in `scroll-experience.tsx`) — functionally
   close, but worth a live-browser tuning pass to feel exactly right.
6. **Open question from spec section 12, resolved:** the lamp exists as
   a DOM placeholder through beats 1–8, then *becomes* the WebGL
   particle system at the burst (rather than a persistent lamp shell
   surviving alongside the particles) — "the reformation is a truer
   loop," per the spec's own framing. Reversible if you want the other
   read.
7. **Nothing here has been checked in a real browser.** TypeScript is
   clean, the production build and static export both succeed, and I
   verified the rendered HTML contains all expected content — but this
   sandbox has no browser, so the actual pin/scrub/shader feel (the one
   thing GSAP+WebGL work always needs a real tab for) is unverified.

## Git / GitHub — get it live

This folder is already a git repo with a clean history (its own, separate
from the old `neel-parikh-site` repo), and includes
`.github/workflows/deploy.yml` — a GitHub Actions workflow that builds and
deploys the static export to GitHub Pages automatically on every push to
`main`. No manual "gh-pages branch" step needed.

1. Create a new, empty repo on GitHub (don't initialize it with a README).
2. From this folder:
   ```bash
   git remote add origin https://github.com/<you>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source → "GitHub Actions"** (not
   "Deploy from a branch"). The push you just did will already have kicked
   off the workflow — check the **Actions** tab; once it's green, the
   Pages URL shown under Settings → Pages is your live site
   (`https://<you>.github.io/<repo-name>/`).
4. Custom domain (optional, once you're happy with it): the old site's
   custom domain (`neel-parikh.com`, via a `CNAME` file + Cloudflare DNS)
   isn't wired up here yet, on purpose — this repo has no `CNAME` file, so
   it'll only be reachable at the `github.io` URL above until you decide
   to point the real domain at it. Add a `CNAME` file with just
   `neel-parikh.com` in it, plus the Cloudflare DNS records, when you're
   ready to make it the live site.

I can't push this myself — no GitHub connector is authorized in this
session — but everything up to step 1 is done and committed.
