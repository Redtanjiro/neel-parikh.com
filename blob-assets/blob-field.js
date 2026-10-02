/* blob-field.js — the blob, drawn as a field of points.
 *
 *   No dependencies. No WebGL. Points are accumulated additively into one
 *   ImageData, the same way js/about-island.js rasterises the island, so the
 *   two read as the same material on a black ground.
 *
 *   const field = BlobField.create({
 *     canvas,                       // a <canvas> that fills its own box
 *     manifest: '/blob-assets/manifest.json',   // or an object
 *     base: '/blob-assets/',        // prefix for the sprite paths
 *     points: 14000,                // 1..MAX; any prefix is a whole blob
 *     gain: 1.0,                    // additive brightness
 *     pose: 'happy',                // which one to open on
 *     pointer: true,                // drag pushes the points around
 *     onReady: (ids) => {}
 *   });
 *
 *   Scroll in, scroll out (added for the case studies):
 *     floor: 26,      luminance below this is ground, not drawing. The
 *                     sprites sit on a navy plate that peaks around 54;
 *                     pass ~62 to drop the plate and keep only the blob.
 *     crop:  null,    grid rows at and below this are ignored — 286 cuts
 *                     the baked-in label under every pose.
 *     fit: 1, cy: .80 the blob's size as a share of the canvas, and where its
 *                     base sits — a smaller fit leaves room for the scatter
 *                     to fly out before it reaches the canvas edge
 *     inset: 0,       when set, the blob is scaled to fill the canvas minus
 *                     this share on every side, and centred in it. The page
 *                     makes the canvas larger than the box it should fill and
 *                     passes the difference here, so the blob fills the box
 *                     while the scatter flies out past it.
 *     occlude: false, paint a soft black silhouette of the pose behind the
 *                     points, so lines and rules under the blob vanish
 *                     beneath it instead of showing through its gaps. It
 *                     fades with the blob, so a scattered blob hides nothing.
 *     speed: 1,       how fast the field moves — gather, scatter, pose changes.
 *                     The churn and breath keep their own pace.
 *     hidden: false,  open dispersed and dark; call gather() to bring it in.
 *   field.gather();   points fly in from the scatter and the blob forms
 *   field.scatter();  points blow outward and fade; the loop sleeps once
 *                     they are gone, so an off-screen blob costs nothing
 *
 *   field.setPose('tired', { burst: true });
 *   field.burst();                    // disperse and re-gather in place
 *   field.set({ points: 9000, gain: 1.2 });
 *   field.pose                        // the current id
 *   field.destroy();
 *
 *   The canvas must be served from the same origin as the sprites, or
 *   getImageData throws a security error and nothing draws. Opening the demo
 *   straight off the filesystem trips this: serve the folder instead.
 */
(function (root) {
  'use strict';

  var MAX = 26000;          // points sampled per pose
  var STRIDE = 10007;       // prime, so the stride visits every index exactly once

  function create(opt) {
    var cv = opt.canvas;
    if (!cv) throw new Error('blob-field: no canvas');
    var ctx = cv.getContext('2d', { alpha: true });
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    var N = clamp(opt.points || 14000, 500, MAX);
    var gain = opt.gain == null ? 1 : opt.gain;
    var base = opt.base || '';
    var usePointer = opt.pointer !== false;
    var FLOOR = opt.floor == null ? 26 : opt.floor;
    var CROP = opt.crop == null ? Infinity : opt.crop;
    var mode = opt.hidden ? 'scatter' : 'pose';     /* where the points are heading */
    var vis = opt.hidden ? 0 : 1;                   /* brightness, eased toward 1 or 0 */
    var sleeping = false;
    var SPEED = opt.speed || 1;
    var INSET = opt.inset || 0;
    var OCCLUDE = !!opt.occlude;
    var FIT = opt.fit || 1, CYF = opt.cy == null ? 0.80 : opt.cy;

    var GRID = 340, AX = 170, AY = 318, NORM = 300;   // overwritten by the manifest
    var poses = {}, order = [], labels = {}, current = null, dead = false;

    /* ---- the field ------------------------------------------------- */
    var P = {
      x: new Float32Array(MAX), y: new Float32Array(MAX),
      vx: new Float32Array(MAX), vy: new Float32Array(MAX),
      r: new Float32Array(MAX), g: new Float32Array(MAX), b: new Float32Array(MAX),
      ph: new Float32Array(MAX), lag: new Float32Array(MAX)
    };
    var SX = new Float32Array(MAX), SY = new Float32Array(MAX);
    for (var i = 0; i < MAX; i++) {
      var a = Math.random() * Math.PI * 2, rad = 0.75 + Math.random() * 1.1;
      SX[i] = Math.cos(a) * rad * 1.15;           // where each point goes when it is let go
      SY[i] = -0.4 + Math.sin(a) * rad * 0.8;
      P.x[i] = Math.cos(a) * rad;                 // they start scattered and gather in
      P.y[i] = -0.4 + Math.sin(a) * rad * 0.7;
      P.ph[i] = Math.random() * Math.PI * 2;
      P.lag[i] = 0.55 + Math.random() * 0.75;     // per-point lag, so the gather is not one wall
    }

    /* ---- sampling a pose ------------------------------------------- */
    var work = document.createElement('canvas');
    var wctx = work.getContext('2d', { willReadFrequently: true });

    function build(id, img) {
      work.width = work.height = GRID;
      wctx.clearRect(0, 0, GRID, GRID);
      wctx.drawImage(img, 0, 0, GRID, GRID);
      var d = wctx.getImageData(0, 0, GRID, GRID).data;

      var xs = [], ys = [], rs = [], gs = [], bs = [], w = [], tot = 0;
      for (var y = 0; y < GRID; y++) for (var x = 0; x < GRID; x++) {
        var i = (y * GRID + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
        var l = Math.max(r, g, b);
        if (l < FLOOR || y >= CROP) continue;       // the ground and the label, not the drawing
        var wt = Math.pow(l / 255, 0.78);           // bright places get more points
        xs.push(x); ys.push(y); rs.push(r); gs.push(g); bs.push(b); w.push(wt); tot += wt;
      }
      var cum = new Float32Array(w.length), acc = 0;
      for (var k = 0; k < w.length; k++) { acc += w[k] / tot; cum[k] = acc; }

      var tmp = [];
      for (var p = 0; p < MAX; p++) {
        var u = (p + Math.random()) / MAX;          // stratified, so no clumping
        var lo = 0, hi = cum.length - 1;
        while (lo < hi) { var m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; }
        tmp.push([(xs[lo] + Math.random() - AX) / NORM,
                  (ys[lo] + Math.random() - AY) / NORM,
                  rs[lo], gs[lo], bs[lo]]);
      }

      /* One ordering for every pose — angle sector around the centroid, then
         radius — so point i means the same part of the creature whichever pose
         it is in, and a pose change is a deformation rather than a swap. */
      var cy = -0.40;
      tmp.sort(function (A, B) {
        var sa = Math.floor((Math.atan2(A[1] - cy, A[0]) + Math.PI) / (Math.PI * 2) * 56);
        var sb = Math.floor((Math.atan2(B[1] - cy, B[0]) + Math.PI) / (Math.PI * 2) * 56);
        if (sa !== sb) return sa - sb;
        return Math.hypot(A[0], A[1] - cy) - Math.hypot(B[0], B[1] - cy);
      });

      /* Then spread that order with one fixed co-prime stride, the same in
         every pose, so any prefix of the array is still a whole blob and the
         point count is a dial rather than a crop. */
      var px = new Float32Array(MAX * 2), col = new Float32Array(MAX * 3);
      for (var j = 0; j < MAX; j++) {
        var s = tmp[(j * STRIDE) % MAX];
        px[j * 2] = s[0]; px[j * 2 + 1] = s[1];
        col[j * 3] = s[2]; col[j * 3 + 1] = s[3]; col[j * 3 + 2] = s[4];
      }
      /* the silhouette, at a quarter of the grid so it scales up soft */
      var sil = null;
      if (OCCLUDE){
        var SG = GRID >> 2;
        sil = document.createElement('canvas'); sil.width = sil.height = SG;
        var sc = sil.getContext('2d'), sd = sc.createImageData(SG, SG);
        for (var yy = 0; yy < GRID; yy++) for (var xx = 0; xx < GRID; xx++){
          var q = (yy * GRID + xx) * 4;
          if (yy >= CROP || Math.max(d[q], d[q + 1], d[q + 2]) < FLOOR) continue;
          var o2 = (((yy >> 2) * SG) + (xx >> 2)) * 4;
          sd.data[o2 + 3] = Math.min(255, sd.data[o2 + 3] + 26);   /* coverage, not a hard cut */
        }
        sc.putImageData(sd, 0, 0);
      }
      poses[id] = { px: px, col: col, sil: sil };
    }

    /* ---- the buffer ------------------------------------------------ */
    var W = 1, H = 1, img = null, buf = null, SCALE = 1, CX = 0, CY = 0, EDGE = 0, EDGEY = 0;
    function resize() {
      var r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var s = Math.min(devicePixelRatio || 1, 1.6);
      var budget = 820000;                           // keep the per-frame fill honest on CPU
      if (r.width * r.height * s * s > budget) s = Math.sqrt(budget / (r.width * r.height));
      W = Math.max(2, Math.round(r.width * s));
      H = Math.max(2, Math.round(r.height * s));
      cv.width = W; cv.height = H;
      img = ctx.createImageData(W, H); buf = img.data;
      EDGE = 8 / W; EDGEY = 8 / H;
      if (INSET){
        /* the poses span about 0.9 wide and 0.78 tall in anchor units, with
           their middle 0.49 above the anchor — fill the inner box with that */
        var iw = W * (1 - 2 * INSET), ih = H * (1 - 2 * INSET);
        SCALE = Math.min(iw / 0.9, ih / 0.78) * FIT;
        CX = W * 0.5; CY = H * 0.5 + 0.49 * SCALE;
      } else {
        SCALE = Math.min(W * 0.78, H * 0.92) * FIT;
        CX = W * 0.5; CY = H * CYF;                  // the anchor sits low in frame
      }
    }
    var ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(cv); else addEventListener('resize', resize);

    /* ---- pointer --------------------------------------------------- */
    var pt = null;
    function loc(e) {
      var r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * (W / r.width) - CX) / SCALE,
               y: ((e.clientY - r.top) * (H / r.height) - CY) / SCALE };
    }
    function down(e) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} pt = loc(e); }
    function move(e) { if (pt) pt = loc(e); }
    function up() { pt = null; }
    if (usePointer) {
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', down);
      cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
    }

    /* ---- the loop -------------------------------------------------- */
    var last = performance.now(), t = 0, raf = 0;
    function frame(now) {
      if (dead) return;
      var rdt = Math.min((now - last) / 1000, 0.05); last = now; t += rdt;
      var dt = rdt * SPEED;                          /* the field's clock; t stays real time */
      vis += ((mode === 'pose' ? 1 : 0) - vis) * Math.min(1, dt * (mode === 'pose' ? 2.6 : 3.4));
      if (mode === 'scatter' && vis < 0.006){        /* gone — clear once and sleep */
        vis = 0; if (buf){ buf.fill(0); ctx.putImageData(img, 0, 0); }
        sleeping = true; raf = 0; return;
      }
      raf = requestAnimationFrame(frame);
      var pose = poses[current];
      if (!pose || !buf) return;

      buf.fill(0);
      var tp = pose.px, tc = pose.col;
      var K = reduced ? 26 : 13, DAMP = Math.pow(0.0023, dt);

      for (var i = 0; i < N; i++) {
        var tx = tp[i * 2], ty = tp[i * 2 + 1];
        if (mode === 'scatter' && !reduced){ tx = SX[i]; ty = SY[i]; }
        if (!reduced) {
          var ph = P.ph[i];
          tx += Math.sin(t * 0.62 + ph) * 0.009;                       // churn
          ty += Math.cos(t * 0.49 + ph * 1.7) * 0.009 - Math.sin(t * 0.45) * 0.006;  // and a slow breath
        }
        var lag = P.lag[i];
        P.vx[i] += (tx - P.x[i]) * K * lag * dt;
        P.vy[i] += (ty - P.y[i]) * K * lag * dt;

        if (pt) {
          var dx = P.x[i] - pt.x, dy = P.y[i] - pt.y, d2 = dx * dx + dy * dy;
          if (d2 < 0.055) {
            var f = (0.055 - d2) * 34 / (Math.sqrt(d2) + 0.02);
            P.vx[i] += dx * f * dt * 9; P.vy[i] += dy * f * dt * 9;
          }
        }
        P.vx[i] *= DAMP; P.vy[i] *= DAMP;
        P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;

        var m = Math.min(1, dt * 6);                                   // colour follows the pose it is heading for
        P.r[i] += (tc[i * 3] - P.r[i]) * m;
        P.g[i] += (tc[i * 3 + 1] - P.g[i]) * m;
        P.b[i] += (tc[i * 3 + 2] - P.b[i]) * m;

        var sx = (CX + P.x[i] * SCALE) | 0, sy = (CY + P.y[i] * SCALE) | 0;
        if (sx < 1 || sy < 1 || sx >= W - 1 || sy >= H - 1) continue;
        /* points fade out over the last eighth of the canvas, so a scatter
           thins away instead of meeting the edge in a straight line */
        var ex = (sx < W - sx ? sx : W - sx) * EDGE, ey = (sy < H - sy ? sy : H - sy) * EDGEY;
        var ef = ex < ey ? ex : ey; if (ef > 1) ef = 1;
        var gv = gain * vis * ef;
        var cr = P.r[i] * gv, cg = P.g[i] * gv, cb = P.b[i] * gv;
        /* alpha follows brightness, so a dim point is faint over whatever is
           behind the canvas rather than a black speck on it */
        var ca = cr > cg ? (cr > cb ? cr : cb) : (cg > cb ? cg : cb), ha = ca * 0.26;
        var o = (sy * W + sx) * 4;
        buf[o] += cr; buf[o + 1] += cg; buf[o + 2] += cb; buf[o + 3] += ca;
        var hr = cr * 0.26, hg = cg * 0.26, hb = cb * 0.26;             // a one-pixel halo, in place of a blur pass
        o = (sy * W + sx - 1) * 4; buf[o] += hr; buf[o + 1] += hg; buf[o + 2] += hb; buf[o + 3] += ha;
        o = (sy * W + sx + 1) * 4; buf[o] += hr; buf[o + 1] += hg; buf[o + 2] += hb; buf[o + 3] += ha;
        o = ((sy - 1) * W + sx) * 4; buf[o] += hr; buf[o + 1] += hg; buf[o + 2] += hb; buf[o + 3] += ha;
        o = ((sy + 1) * W + sx) * 4; buf[o] += hr; buf[o + 1] += hg; buf[o + 2] += hb; buf[o + 3] += ha;
      }
      ctx.putImageData(img, 0, 0);
      if (OCCLUDE && pose.sil && vis > 0.01){
        /* behind the points, never over them */
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.globalAlpha = Math.min(1, vis * 1.15);
        ctx.imageSmoothingEnabled = true;
        var k = SCALE / NORM;
        ctx.drawImage(pose.sil, CX - AX * k, CY - AY * k, GRID * k, GRID * k);
        ctx.restore();
      }
    }

    /* ---- api ------------------------------------------------------- */
    function burst() {
      if (reduced) return;
      for (var i = 0; i < N; i++) {
        var a = Math.atan2(P.y[i] + 0.4, P.x[i]), k = 0.9 + Math.random() * 1.6;
        P.vx[i] += Math.cos(a) * k; P.vy[i] += Math.sin(a) * k * 0.8;
      }
    }
    function setPose(id, o) {
      if (!poses[id]) return false;
      current = id; api.pose = id;
      if (o && o.burst) burst();
      return true;
    }

    function wake(){
      if (sleeping && !dead){ sleeping = false; last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    function gather(){
      if (mode === 'pose') return;
      mode = 'pose';
      if (!reduced) for (var i = 0; i < N; i++){       /* start from the scatter, not wherever they faded */
        P.x[i] = SX[i]; P.y[i] = SY[i]; P.vx[i] = 0; P.vy[i] = 0;
      }
      wake();
    }
    function scatter(){
      if (mode === 'scatter') return;
      mode = 'scatter';
      if (!reduced) for (var i = 0; i < N; i++){       /* a push outward, then the spring carries them off */
        var a = Math.atan2(P.y[i] + 0.4, P.x[i]), k = 0.6 + Math.random() * 1.2;
        P.vx[i] += Math.cos(a) * k; P.vy[i] += Math.sin(a) * k * 0.8;
      }
      wake();
    }

    var api = {
      pose: null,
      gather: gather,
      scatter: scatter,
      poses: order,
      labels: labels,
      setPose: setPose,
      burst: burst,
      next: function (o) { return setPose(order[(order.indexOf(current) + 1) % order.length], o); },
      set: function (o) {
        if (o.points != null) N = clamp(o.points, 500, MAX);
        if (o.gain != null) gain = o.gain;
      },
      max: MAX,
      reduced: reduced,
      destroy: function () {
        dead = true; cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else removeEventListener('resize', resize);
        cv.removeEventListener('pointerdown', down);
        cv.removeEventListener('pointermove', move);
        cv.removeEventListener('pointerup', up);
        cv.removeEventListener('pointercancel', up);
      }
    };

    /* ---- boot ------------------------------------------------------ */
    (opt.manifest && typeof opt.manifest === 'object'
      ? Promise.resolve(opt.manifest)
      : fetch(opt.manifest || (base + 'manifest.json')).then(function (r) { return r.json(); })
    ).then(function (man) {
      GRID = man.grid || GRID;
      if (man.anchor) { AX = man.anchor.x; AY = man.anchor.y; NORM = man.anchor.norm; }
      return Promise.all(man.poses.map(function (p) {
        return load(base + p.file).then(function (im) {
          build(p.id, im); order.push(p.id); labels[p.id] = p.label || p.id;
        });
      })).then(function () { return man; });
    }).then(function (man) {
      if (dead) return;
      order.sort(function (a, b) {                       // keep the manifest's order, not the load order
        return man.poses.findIndex(function (p) { return p.id === a; })
             - man.poses.findIndex(function (p) { return p.id === b; });
      });
      resize();
      setPose(opt.pose && poses[opt.pose] ? opt.pose : order[0], false);
      raf = requestAnimationFrame(frame);
      if (opt.onReady) opt.onReady(api);
    }).catch(function (e) {
      if (opt.onError) opt.onError(e); else console.error('blob-field:', e);
    });

    return api;
  }

  function load(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('blob-field: could not load ' + src)); };
      im.src = src;
    });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  root.BlobField = { create: create, MAX: MAX };
})(typeof window !== 'undefined' ? window : this);
