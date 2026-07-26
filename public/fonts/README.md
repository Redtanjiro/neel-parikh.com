# Drop licensed Futura Condensed here

Futura Condensed is Adobe-licensed and can't be shipped from a public CDN,
so the site falls back to **Jost** (a free geometric Futura revival) with a
slight horizontal narrowing to approximate a condensed width.

If you have the licensed webfont files, put them in this folder as:

    futura-condensed.woff2
    futura-condensed-bold.woff2

then uncomment the `@font-face` blocks at the bottom of
`src/app/globals.css`. Nothing else needs to change — `--font-display`
already lists Futura ahead of Jost, so it takes over automatically, and
the `.display-condensed` narrowing is skipped once a real condensed face
is active.
