"""Sprite.png -> media/neel-sprite.png

Five poses out of the 5x4 sheet, resampled to bitmap resolution and
snapped to the site palette. Run from the project root:

    python3 tools-make-sprite.py

Rerun it if the sheet changes, if the palette changes, or if you want
different poses (see POSES). Sprite.png is gitignored — it is 1.7 MB of
source that produces a 12 KB asset.
"""
from PIL import Image, ImageFilter
import numpy as np, os

# The nine greys/tans are the site tokens, sampled from the hero frame.
# The two cyans are the folder icon's, and only the mug ever reaches them.
BASE = [(251,247,240),(235,220,191),(215,199,171),(199,175,142),(159,152,135),
        (112,107,88),(69,62,43),(34,35,26),(16,19,14)]
ACC  = [(116,232,232),(58,150,150)]

def luma(c): return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]

def ramp(base):
    """Midpoints between adjacent tokens, doubling the ramp to 17 steps.

    THIS IS WHAT FIXED THE FACE. Nine tokens is a fine palette for flat
    UI and a starving one for a head 21px tall: the gap between --moss
    (luma 107) and --stone (152) is where every shaded skin pixel wants
    to sit, and with nothing there they all fell to moss. The face
    collapsed into one dark mass with a few light specks on it, which
    read as blur.

    These are not new colours. Each is the blend of two already-sampled
    ones, so the claim that every value on this page came out of one
    photograph still holds."""
    s = sorted(base, key=luma); out = []
    for i in range(len(s)-1):
        out.append(s[i])
        out.append(tuple(int(round((s[i][k]+s[i+1][k])/2)) for k in range(3)))
    out.append(s[-1])
    return out

PAL = np.array(ramp(BASE)+ACC, np.float32)
Wt  = np.array([0.30,0.59,0.11], np.float32)     # rough perceptual weighting

def tealify(img):
    """Rotate the olive pixels toward cyan — the mug and the backpack.

    They read as yellow-green, not green: R and G are close and B is far
    below both, so a naive "G greater than R" test never fires. The test
    is olive-ness, and the thresholds are set against the rest of the
    sheet rather than by eye — skin sits at a 33 gap, cream trousers at
    28, the hoodie at 19, so 45 clears all three.

    Runs at full resolution and BEFORE the unsharp mask. After it, the
    ringing around his glasses lands inside the olive test and paints
    cyan across his cheek. Hue decisions belong on the original values;
    contrast decisions come after."""
    a = np.array(img).astype(np.float32)
    r,g,b = a[...,0], a[...,1], a[...,2]
    m = (np.minimum(r,g) - b > 45) & (np.abs(r-g) < 25)
    a[...,2] = np.where(m, g, b)
    a[...,0] = np.where(m, g*0.4, r)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def build(img, h=72, alpha_thr=140):
    src = tealify(img)
    # BOX downsampling is a mean, and a mean erases exactly the 1px dark
    # features a face is made of. Exaggerate them first so they survive
    # the averaging: the glasses and the eye only exist because of this.
    rgb = src.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2.0, percent=110, threshold=3))
    src = Image.merge('RGBA', (*rgb.split(), src.split()[3]))

    w = max(1, round(src.width * h / src.height))
    a = np.array(src.resize((w,h), Image.BOX)).astype(np.float32)
    idx = ((((a[...,:3][:,:,None,:] - PAL[None,None,:,:])**2) * Wt).sum(-1)).argmin(-1)
    # Hard alpha. Keeping the antialiased rim gives a small painting; the
    # whole point is that it should look drawn on a grid.
    return Image.fromarray(np.dstack([PAL[idx].astype(np.uint8),
                                      ((a[...,3]>=alpha_thr)*255).astype(np.uint8)]), 'RGBA')

# 72, having looked at 56, 84 and 96. At 56 the face is mush. At 84 and
# above the extra detail is inherited from the painting, so it reads as a
# downscaled illustration rather than a deliberate bitmap — and the face
# is measurably WORSE, because more pixels means more mid-tones to average
# the eye and brow into.
H = 72
def cells(path='Sprite.png'):
    """Cut the sheet into its twenty figures.

    Not a fixed grid: 1024/5 is 204.8 and the rows are not evenly spaced
    either (23, 311, 598, 855). Rows and columns are found from the alpha
    projection instead, with a 26px merge so a detached music note stays
    with the figure it belongs to."""
    im = Image.open(path).convert('RGBA')
    al = np.array(im)[...,3]
    def segs(v, thr=3, merge=26):
        on = v > thr; s=[]; st=None
        for i,x in enumerate(on):
            if x and st is None: st=i
            if not x and st is not None: s.append([st,i-1]); st=None
        if st is not None: s.append([st,len(on)-1])
        out=[]
        for g in s:
            if out and g[0]-out[-1][1] <= merge: out[-1][1]=g[1]
            else: out.append(g)
        return [tuple(x) for x in out if x[1]-x[0] > 20]
    grid={}
    for ri,(y0,y1) in enumerate(segs((al>128).sum(axis=1))):
        for ci,(x0,x1) in enumerate(segs((al[y0:y1+1]>128).sum(axis=0))):
            sub = im.crop((x0,y0,x1+1,y1+1))
            grid[f'r{ri}c{ci}'] = sub.crop(sub.split()[-1].getbbox())
    return grid

POSES = ['r2c0', 'r1c2', 'r2c1', 'r1c0', 'r2c2']   # listen, work, read, coffee, ship
G = cells()
tiles = [build(G[f], H) for f in POSES]

CW = max(t.width for t in tiles) + 4               # even cell, bottom-aligned, centred
strip = Image.new('RGBA', (CW*len(tiles), H), (0,0,0,0))
for i,t in enumerate(tiles):
    strip.paste(t, (i*CW + (CW-t.width)//2, H-t.height), t)

out = 'media/neel-sprite.png'
strip.save(out, optimize=True)
print('strip', strip.size, 'cell', CW, 'x', H, '|', os.path.getsize(out), 'bytes')

# Teal belongs on the mug and the laptop badge and nowhere else. The
# check is the HEAD — the top quarter — because that is where the bug
# showed up: sharpening ringing round the glasses landed inside the olive
# test and painted cyan across his cheek. Checking the top 45% instead
# fails on the coffee pose, where the mug is legitimately at chest height.
a = np.array(strip)
head = a[:H//4]
leak = ((head[...,0]<130)&(head[...,1]>140)&(head[...,2]>140)&(head[...,3]>0)).sum()
tot  = ((a[...,0]<130)&(a[...,1]>140)&(a[...,2]>140)&(a[...,3]>0)).sum()
print('cyan px total', tot, '| in the head (must be 0):', leak)
assert leak == 0, 'teal leaked onto a face — check the order of tealify and the unsharp mask'

