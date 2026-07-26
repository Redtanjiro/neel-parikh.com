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

1. **Six of the ten hero layers are real** — `lamp`, `kettle`, `fridge`,
   `table` (mug included), `chair` (jacket included), and a combined
   `window-curtains` (found in `Drawn assests/` as "Home office
   interior@2x*.png", not in the composite mockups I'd checked earlier —
   real transparent cutouts, cropped to content bounds and converted to
   WebP+PNG in `public/hero/`, ~620KB total). **`figure` and `wall` still
   don't exist as cutouts** — `src/components/hero-scene.tsx` keeps
   labeled placeholder divs for just those two; export them the same way
   and swap them in the `PLACEHOLDER_LAYERS` list.
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

**This IS `Redtanjiro/neel-parikh.com`** — the real repo, already wired to
the `neel-parikh.com` custom domain via the `CNAME` file (untouched) and
Cloudflare DNS, and GitHub Pages is already set to **Source: GitHub
Actions**. This replaces what used to be here (the old vanilla-HTML/GSAP
build, archived locally in `V2/` — gitignored, never pushed, still on
disk if you want it back) with this Next.js project at the repo root,
plus `.github/workflows/deploy.yml`, which builds and deploys the static
export automatically on every push to `main`.

Because Pages is already set to "GitHub Actions" as its source, **there is
no settings change to make** — the very next push to `main` triggers the
workflow, and once it's green (check the **Actions** tab), `neel-parikh.com`
is serving this new site.

```bash
git add -A
git commit -m "Replace site with scroll-driven lamp portfolio"
git push
```

I can't run that last command myself — no GitHub connector is authorized
in this session, and this sandbox has no saved credentials for
`github.com` (confirmed: `git push` here fails with "could not read
Username for '`https://github.com`'"). Everything above is already staged
and ready; that push is the one thing only you can do.
