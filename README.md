# neel-parikh.com — v1

Hand-painted, time-synced homepage. The hero illustration matches the visitor's local time of day.

## Files
- `index.html` — everything (markup, styles, time-of-day logic)
- `assets/hero-morning.webp` + `-sm` — golden morning scene
- `assets/hero-noon.webp` + `-sm` — midday scene

## Deploy to GitHub Pages (one-time setup)
1. Create a repo (e.g. `neel-parikh.com`) on GitHub
2. Push these files to the `main` branch (index.html at the root)
3. Repo → Settings → Pages → Source: "Deploy from a branch" → `main` / root
4. Settings → Pages → Custom domain: `neel-parikh.com` (this creates a CNAME file)
5. In Cloudflare DNS for neel-parikh.com:
   - CNAME record: `@` → `<your-username>.github.io` (proxied is fine)
   - CNAME record: `www` → `<your-username>.github.io`
6. Back in GitHub Pages, tick "Enforce HTTPS" once the cert issues (can take ~15 min)

## Updating / adding scenes
When sunset and night are painted:
1. Export from Procreate, convert to WebP at 2560w and 1280w
2. Name them `hero-sunset.webp`, `hero-sunset-sm.webp`, `hero-night.webp`, `hero-night-sm.webp` and drop into `/assets`
3. In index.html, find the SCENES array and set `available: true` for those scenes
That's it — the logic already handles them.

## Things to edit before going live
- Contact email (currently hello@neel-parikh.com in two places)
- LinkedIn URL in the footer
- Case study links as they're written
