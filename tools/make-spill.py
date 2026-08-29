#!/usr/bin/env python3
"""
tools/make-spill.py — generates media/spill/, the 420px-wide WebP
copies of the twelve .folder__sheet hover images.

The originals (work/*/**.png|jpg) stay where they are — the case
studies use them at full size. The homepage only ever shows the spill
art at 88-160px, so it should not be downloading 1.6 MB source PNGs
to do it. Run from the repo root:

    python3 tools/make-spill.py

Requires: pip install Pillow
"""
import os
import re
from urllib.parse import unquote

from PIL import Image

html = open('index.html').read()
srcs = re.findall(r'<img class="folder__sheet" src="([^"]+)"', html)

os.makedirs('media/spill', exist_ok=True)

for s in srcs:
    path = unquote(s)
    im = Image.open(path).convert('RGB')
    w = 420
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    name = re.sub(r'[^a-z0-9]+', '-', os.path.splitext(os.path.basename(path))[0].lower()).strip('-')
    out = f'media/spill/{name}.webp'
    im.save(out, 'WEBP', quality=82, method=6)
    print(f'{path} -> {out} ({im.width}x{im.height}, {os.path.getsize(out)} bytes)')
