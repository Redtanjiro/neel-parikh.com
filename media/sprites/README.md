# Neel sprite sheet — cut and repacked

Source was one 1536×1024 image with a soft alpha channel and coloured fringing
around every figure. This pack is that sheet cleaned up and rebuilt.

## What changed

- **Alpha hardened.** The original alpha was 0–254 with no fully opaque pixel;
  the fringe pixels sat at alpha 1–60. Thresholded at 128 → on/off, so the
  edges are clean and there is no dark halo over a light background.
- **Bleed removed.** The 6×3 grid had no gutter, so several cells caught
  fragments of their neighbours (a mug and a table leg in `walk-3`, the top of a
  head in `think`). Anything not connected to the main figure, and further than
  20px from it, was dropped — except the music note beside `headphones` and the
  sparks around `cast`, which are close enough to count.
- **Repacked on one baseline.** Every pose is bottom-aligned in a 256×320 cell
  with 6px of floor padding, so switching between standing, sitting and
  crouching never shifts his feet.

## Files

- `neel-sprites.png` — 1536×960, lossless, the master.
- `neel-sprites.webp` — same sheet at q90, 157 KB. Alpha is bit-identical to the
  PNG; only the colour is compressed. Use this on the web.
- `neel-sprites.json` — cell size and the row/col of every frame.
- `frames/` — the 18 poses as individual tight-cropped PNGs.

## Frame order

| | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| **row 0** | idle | walk-1 | back | walk-2 | walk-3 | desk |
| **row 1** | mug | think | laptop-floor | walk-phone | backpack | headphones |
| **row 2** | clipboard | cheer | sit-ground | crouch | stance | cast |

## Using it

One element, one background, move `background-position`:

```css
.sprite{
  --sw:190px; --sh:238px;              /* one cell on screen; keep the 4:5 ratio */
  width:var(--sw); height:var(--sh);
  background:url(neel-sprites.webp) no-repeat;
  background-size:calc(var(--sw)*6) calc(var(--sh)*3);
  background-position:calc(var(--sw)*var(--col)*-1) calc(var(--sh)*var(--row)*-1);
  image-rendering:pixelated;
}
```

Then set `--col` / `--row` from the table above. `image-rendering:pixelated` is
what keeps the pixels crisp when the cell is scaled.

A walk cycle is `walk-1 → walk-2 → walk-3 → walk-2` at about 140ms a frame;
`steps()` works because the cells are a uniform grid.
