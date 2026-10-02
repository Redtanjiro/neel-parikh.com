# blob-assets

The creature, drawn as a field of points. Drop the folder in, point the engine at it,
and it runs. Nothing here depends on GSAP, three.js or WebGL.

```
blob-assets/
  manifest.json      the eleven poses, the grid and the anchor
  blob-field.js      the engine — sampler, field, renderer, API
  blob-field.css     the stage only (ground, canvas box, caption)
  demo.html          a working page, one button per pose
  sprites/*.webp     one file per pose (11)
```

## Plugging it in

```html
<link rel="stylesheet" href="/blob-assets/blob-field.css">

<div class="blobstage" style="aspect-ratio:16/11">
  <canvas class="blobstage__canvas" id="blob"></canvas>
</div>

<script src="/blob-assets/blob-field.js"></script>
<script>
  var field = BlobField.create({
    canvas: document.getElementById('blob'),
    base:   '/blob-assets/',
    points: 14000,
    pose:   'resting'
  });
</script>
```

The stage needs a height of its own — `aspect-ratio`, a grid track, `height: 100%`,
anything. The engine watches the box with a `ResizeObserver` and sizes its own
buffer from it, capped so the per-frame fill stays affordable on CPU.

### API

| | |
|---|---|
| `field.setPose(id, { burst: true })` | change pose; `burst` disperses first |
| `field.next({ burst: true })` | the next pose in manifest order |
| `field.burst()` | disperse and re-gather in place |
| `field.set({ points, gain })` | thin the field, or change the additive brightness |
| `field.pose` / `field.poses` / `field.labels` | current id, the ids in order, their labels |
| `field.destroy()` | stop the loop, drop the observer and the listeners |

`create` also takes `gain` (default 1), `pointer: false` to switch off drag-to-push,
`manifest` (a URL or an object, if you'd rather not fetch), `onReady(field)` and
`onError(err)`.

## Two things that will bite

**Serve the folder.** The sampler reads the sprites back with `getImageData`, so a
page opened straight off the filesystem taints the canvas and throws a security
error — nothing draws, and the only sign is the message in `onError`. `python3 -m
http.server` in this folder is enough for a look.

**The sprites are drawn on black, not keyed out.** The renderer is additive, so
black is the ground and nothing has to be transparent. Any pixel under luminance 26
is skipped as ground — which also means a pose on a light background samples as a
solid rectangle.

## How a pose is made

Pixels are picked in proportion to brightness (`lum^0.78`), so the gloss highlight
and the warm belly come out dense and the rim stays sparse. That is what makes the
field read as the drawing rather than a silhouette of dots.

Then the points of **every** pose are put in one order — angle sector around the
centroid, then radius — so point *i* means the same part of the creature whichever
pose it is in. A change of mood is one field deforming, not two fields swapping.

That order is then spread with a fixed co-prime stride (10007 against 26000), the
same in every pose, so any prefix of the array is still a whole blob. That is what
makes `points` a dial rather than a crop: 4,000 is a sparser creature, not a
quarter of one.

## Adding a pose

1. Draw it on the same **340 × 340** grid at the shared scale, bottom-centre of the
   body on the anchor (`170, 318`), on black.
2. Save it as `sprites/<id>.webp`.
3. Append `{ "id": "...", "label": "...", "file": "sprites/<id>.webp" }` to
   `manifest.json`.

Scale and anchor are what hold the poses still relative to each other. A sprite
drawn at its own scale will jump when it is morphed to.

## Reduced motion

`prefers-reduced-motion` drops the churn, the breath and the disperse, and stiffens
the spring so a pose change arrives without travel. The creature is still there and
still changes pose — the motion goes, the content doesn't.

## Cost

One pass over `points` per frame, five writes each, into a single `ImageData`. At
14,000 points on a 1,000 × 690 stage that is well inside a frame on a laptop. If it
needs to share a page with the particle island, thin this one first — the island's
budget is the larger of the two.
