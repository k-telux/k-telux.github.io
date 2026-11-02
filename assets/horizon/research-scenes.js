/* Research thumbnails come alive: each card's drawing is replaced by a small running simulation of its physics on a
   canvas. A scene plays only while the pointer is on (or right beside) its card, and the pointer steers it: the
   closer to the drawing, the stronger the effect. Every other card holds a still frame. The SVG line drawings stay
   underneath as the fallback (no JavaScript, reduced motion). */
(() => {
  'use strict';
  const thumbs = [...document.querySelectorAll('.project-thumb[data-scene]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!thumbs.length || reduce.matches || !document.createElement('canvas').getContext) return;

  const H = 160, TAU = Math.PI * 2; // scenes draw in a 160-unit-high space
  const STOPS = [[17, 26, 34], [111, 227, 255], [180, 140, 255], [255, 111, 125]];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  // the beam palette as a ramp: 0 dark, then cyan, violet, coral
  const ramp = (t, a = 1) => {
    t = Math.round(clamp(t) * 64) / 64 * 3; const i = Math.min(2, t | 0), u = t - i, p = STOPS[i], q = STOPS[i + 1];
    return `rgba(${p.map((c, k) => Math.round(c + (q[k] - c) * u)).join(',')},${a})`;
  };
  const beamAt = (t, a = 1) => ramp(1 / 3 + clamp(t) * 2 / 3, a); // cyan → coral only
  const CY = '#6fe3ff', VI = '#b48cff', CO = '#ff6f7d';

  // soft round glows are drawn once per colour and stamped, which is far cheaper than shadowBlur on every dot
  const sprites = new Map();
  const sprite = (color) => {
    if (sprites.has(color)) return sprites.get(color);
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, color); r.addColorStop(.18, color); r.addColorStop(.42, color.replace(/[\d.]+\)$/, '.28)')); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); sprites.set(color, c); return c;
  };
  // colours passed here come from a small fixed set (the ramp is quantised); vary brightness with `a`, not the colour string
  const glow = (ctx, x, y, r, color, a = 1) => { if (a <= .01) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sprite(color), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };
  const curve = (ctx, x0, x1, f, step = 2) => { ctx.beginPath(); for (let x = x0; x <= x1 + .01; x += step) { const y = f(x); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } };
  const shine = (ctx, s, width, blur = 7, color = 'rgba(111,227,255,.55)') => {
    ctx.save(); ctx.lineWidth = width; ctx.lineCap = ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = blur * s.dpr; ctx.strokeStyle = s.beam; ctx.stroke(); ctx.restore();
  };
  const faint = (ctx, a = .18, w = 1.1) => { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = w; ctx.stroke(); };
  const rand = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;
  const within = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

  /* Every scene gets: s.W × 160 drawing space, s.x/s.y the steered point (pointer when near, a slow drift
     otherwise), s.near 0–1, s.inside, s.t seconds, dt. init() builds state, draw() runs one frame. */
  const scenes = {
    // an exciton (the pointer) moves through a Bose gas; nearby bosons gather into a dressing cloud and the
    // spectrum below splits into attractive and repulsive polaron peaks
    polaron: {
      init(s) {
        const r = rand(12); s.p = Array.from({ length: 90 }, () => ({ x: r() * s.W, y: r() * 112 + 8, vx: 0, vy: 0, d: 0 }));
      },
      draw(s, ctx, dt) {
        const ex = s.x, ey = Math.min(s.y, 112), pull = .35 + 1.4 * s.near;
        let dressed = 0;
        ctx.globalCompositeOperation = 'lighter';
        for (const b of s.p) {
          const dx = ex - b.x, dy = ey - b.y, d = Math.hypot(dx, dy) || 1, shell = 16 + 4 * Math.sin(s.t * 3 + b.x);
          const f = d < 70 ? pull * (d - shell) / d * Math.exp(-d / 40) : 0;
          b.vx += (dx * f * 6 + (Math.random() - .5) * 60) * dt; b.vy += (dy * f * 6 + (Math.random() - .5) * 60) * dt;
          b.vx *= .92; b.vy *= .92; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < 0) b.x += s.W; if (b.x > s.W) b.x -= s.W; b.y = clamp(b.y, 6, 118);
          b.d = lerp(b.d, d < 34 ? 1 : 0, dt * 4); dressed += b.d;
          glow(ctx, b.x, b.y, 3 + 4 * b.d, b.d > .3 ? 'rgba(180,140,255,.9)' : 'rgba(255,255,255,.5)');
        }
        const pulse = 1 + .15 * Math.sin(s.t * 5);
        glow(ctx, ex, ey, 26 * pulse * (.6 + .5 * s.near), 'rgba(111,227,255,.55)');
        glow(ctx, ex, ey, 7, 'rgba(255,255,255,1)');
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.arc(ex, ey, 20 + 4 * Math.sin(s.t * 2), 0, TAU); ctx.setLineDash([3, 4]); ctx.lineDashOffset = -s.t * 12;
        ctx.strokeStyle = 'rgba(180,140,255,.7)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
        // spectrum: splitting grows with the dressing
        const k = clamp(dressed / 14), base = H - 12, c = s.W * .5, sp = 22 + 60 * k;
        const lor = (x, x0, w) => 1 / (1 + ((x - x0) / w) ** 2);
        curve(ctx, 16, s.W - 16, (x) => base); faint(ctx, .14);
        curve(ctx, 16, s.W - 16, (x) => base - 26 * (.5 + .7 * k) * lor(x, c - sp, 7) - 22 * (1 - .45 * k) * lor(x, c + sp * .6, 9));
        shine(ctx, s, 2);
      },
    },
    // a strained pixel array: the pointer presses the piezo pads, each emitter's colour (wavelength) shifts,
    // and its line moves along the spectrum underneath
    array: {
      init(s) {
        s.cols = Math.max(5, Math.round((s.W - 40) / 44)); s.rows = 2; s.cell = Math.min(30, (s.W - 40) / s.cols - 12);
        const r = rand(3); s.lit = Array.from({ length: s.cols * s.rows }, () => r() < .6); s.e = new Float32Array(s.cols * s.rows);
      },
      draw(s, ctx, dt) {
        const gap = (s.W - 40) / s.cols, lines = [];
        const wave = s.t * 1.6;
        for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
          const i = r * s.cols + c, cx = 20 + gap * (c + .5), cy = 34 + r * 48;
          const press = s.near * Math.exp(-dist2(cx, cy, s.x, s.y) / 1400);
          const idle = .25 + .2 * Math.sin(wave - c * .7 + r);
          s.e[i] = lerp(s.e[i], clamp(idle * (1 - s.near * .6) + press * 1.2), dt * 6);
          const e = s.e[i], size = s.cell * (1 - .18 * e);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(e * .12 * (c % 2 ? 1 : -1));
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-size / 2, -size / 2, size, size, 6) : ctx.rect(-size / 2, -size / 2, size, size);
          ctx.strokeStyle = `rgba(255,255,255,${.16 + .5 * e})`; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.fillStyle = ramp(.1 + e * .5, .18 * e); ctx.fill(); ctx.restore();
          if (s.lit[i]) {
            ctx.globalCompositeOperation = 'lighter';
            glow(ctx, cx, cy, 6 + 10 * e, beamAt(e), .95); ctx.globalCompositeOperation = 'source-over';
            lines.push([e, s.e[i]]);
          }
        }
        // ripples from the pressed point
        if (s.near > .05) for (let k = 0; k < 3; k++) {
          const ph = (s.t * .8 + k / 3) % 1; ctx.beginPath(); ctx.arc(s.x, s.y, 6 + ph * 60, 0, TAU);
          ctx.strokeStyle = `rgba(180,140,255,${.35 * (1 - ph) * s.near})`; ctx.lineWidth = 1; ctx.stroke();
        }
        const base = H - 14, x0 = 24, x1 = s.W - 24;
        curve(ctx, x0, x1, () => base); faint(ctx, .14);
        curve(ctx, x0, x1, (x) => base - lines.reduce((sum, [e], n) => sum + 22 / (1 + ((x - lerp(x0 + 20 + (n % 4) * 6, x1 - 10, e)) / 2.6) ** 2), 0), 1);
        shine(ctx, s, 1.8);
      },
    },
    // single photons, one at a time: the pointer pumps the emitter, photons split at a beam splitter, and the
    // coincidence histogram builds the antibunching dip at τ = 0
    g2: {
      init(s) { s.ph = []; s.next = 0; s.bins = Float32Array.from({ length: 41 }, (_, i) => 6 * (1 - .92 * Math.exp(-Math.abs(i / 20 - 1) / .09)) * (.8 + .4 * Math.random())); s.flash = [0, 0]; },
      draw(s, ctx, dt) {
        const em = [34, 56], bs = [s.W * .5, 56], dA = [s.W - 26, 56], dB = [s.W * .5, 14];
        const rate = 1.6 + 9 * s.near;
        s.next -= dt;
        if (s.next <= 0) { s.next = .08 + (-Math.log(Math.random() + 1e-6)) / rate; s.ph.push({ x: em[0], y: em[1], up: Math.random() < .5, turned: false }); }
        // pump beam from the pointer
        if (s.near > .02) {
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(em[0], em[1]);
          ctx.strokeStyle = `rgba(255,111,125,${.55 * s.near})`; ctx.lineWidth = 1.6; ctx.setLineDash([2, 4]); ctx.lineDashOffset = s.t * 30; ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.beginPath(); ctx.moveTo(em[0], em[1]); ctx.lineTo(dA[0], dA[1]); ctx.moveTo(bs[0], bs[1]); ctx.lineTo(dB[0], dB[1] + 6); faint(ctx, .12);
        ctx.beginPath(); ctx.moveTo(bs[0] - 9, bs[1] + 9); ctx.lineTo(bs[0] + 9, bs[1] - 9); ctx.strokeStyle = 'rgba(231,237,242,.8)'; ctx.lineWidth = 2.4; ctx.stroke();
        // emitter: a strained pillar with a bright spot
        ctx.beginPath(); ctx.moveTo(em[0] - 14, em[1] + 10); ctx.quadraticCurveTo(em[0], em[1] - 12, em[0] + 14, em[1] + 10); faint(ctx, .35, 1.4);
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, em[0], em[1], 10 + 6 * s.near + 4 * Math.max(0, Math.sin(s.t * 9)), 'rgba(111,227,255,.9)');
        for (let i = s.ph.length - 1; i >= 0; i--) {
          const p = s.ph[i]; const v = 190 * dt;
          if (!p.turned && p.x >= bs[0]) { p.turned = true; p.x = bs[0]; }
          if (p.turned && p.up) p.y -= v; else p.x += v;
          for (let k = 0; k < 4; k++) glow(ctx, p.x - (p.turned && p.up ? 0 : k * 5), p.y + (p.turned && p.up ? k * 5 : 0), 5 - k, `rgba(255,255,255,${.9 - k * .2})`);
          if (p.x >= dA[0] || p.y <= dB[1] + 6) {
            s.ph.splice(i, 1); s.flash[p.turned && p.up ? 1 : 0] = 1;
            // a coincidence lands in the histogram, drawn from 1 − e^(−|τ|/τ₀)
            for (let k = 0; k < 3; k++) { let tau; do tau = Math.random() * 2 - 1; while (Math.random() > 1 - .92 * Math.exp(-Math.abs(tau) / .09)); s.bins[Math.round((tau + 1) * 20)] += 1; }
          }
        }
        s.flash = s.flash.map((f) => f * Math.exp(-dt * 6));
        glow(ctx, dA[0], dA[1], 8 + 14 * s.flash[0], 'rgba(255,111,125,.9)'); glow(ctx, dB[0], dB[1] + 4, 8 + 14 * s.flash[1], 'rgba(180,140,255,.9)');
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.2; ctx.strokeRect(dA[0] - 4, dA[1] - 9, 8, 18); ctx.strokeRect(dB[0] - 9, dB[1] - 4, 18, 8);
        // histogram
        const peak = Math.max(6, ...s.bins), x0 = 24, w = (s.W - 48) / 40, base = H - 10;
        for (let i = 0; i < 41; i++) {
          s.bins[i] *= Math.exp(-dt * .05);
          const h = 44 * s.bins[i] / peak; ctx.fillStyle = beamAt(i / 40, .55); ctx.fillRect(x0 + i * w - w * .32, base - h, w * .64, h);
        }
        curve(ctx, x0, s.W - 24, (x) => base - 44 * .92 * (1 - .92 * Math.exp(-Math.abs((x - x0) / (s.W - 48) * 2 - 1) / .09)));
        shine(ctx, s, 1.6, 5);
        ctx.beginPath(); ctx.moveTo(s.W / 2, base - 52); ctx.lineTo(s.W / 2, base + 4); ctx.setLineDash([3, 4]); faint(ctx, .25); ctx.setLineDash([]);
      },
    },
    // a particle in a cavity: its swing is its temperature. Bring the pointer close and cavity + feedback cooling
    // switch on — the swing shrinks and the colour runs from coral (hot) to cyan (cold)
    cooling: {
      init(s) { s.T = 1; s.trail = []; s.ph = 0; },
      draw(s, ctx, dt) {
        const l = s.W * .24, r = s.W * .76, cy = 72, cx = (l + r) / 2;
        s.T += (.22 * (1 - s.T) - 2.6 * s.near * s.T) * dt; s.T = clamp(s.T, .02, 1);
        s.ph += dt * (9 + 3 * s.T);
        for (const m of [[l, -1], [r, 1]]) { ctx.beginPath(); ctx.moveTo(m[0], cy - 44); ctx.quadraticCurveTo(m[0] + m[1] * 16, cy, m[0], cy + 44); ctx.strokeStyle = '#e7edf2'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); }
        // the standing wave inside the cavity
        const span = r - l - 16, modes = 5;
        for (const sign of [1, -1]) {
          curve(ctx, l + 8, r - 8, (x) => { const u = (x - l - 8) / span; return cy + sign * 24 * Math.sin(u * modes * Math.PI) * Math.sin(u * Math.PI) * Math.cos(s.t * 2.2); });
          sign > 0 ? shine(ctx, s, 1.8) : faint(ctx, .22, 1.2);
        }
        const x = cx + 30 * s.T * Math.sin(s.ph) + (Math.random() - .5) * 6 * s.T, y = cy + 12 * s.T * Math.sin(s.ph * 1.37) + (Math.random() - .5) * 6 * s.T;
        s.trail.push([x, y]); if (s.trail.length > 18) s.trail.shift();
        const col = ramp(1 / 3 + s.T * 2 / 3, .9);
        ctx.globalCompositeOperation = 'lighter';
        s.trail.forEach(([tx, ty], i) => glow(ctx, tx, ty, 2 + i * .45, ramp(1 / 3 + s.T * 2 / 3), .05 + i * .03));
        glow(ctx, x, y, 14, ramp(1 / 3 + s.T * 2 / 3), .9); glow(ctx, x, y, 5, 'rgba(255,255,255,1)');
        ctx.globalCompositeOperation = 'source-over';
        // feedback loop: detector → electronics → back to the cavity, live while cooling
        ctx.beginPath(); ctx.moveTo(cx, cy + 34); ctx.lineTo(cx, H - 18); ctx.lineTo(s.W - 22, H - 18); ctx.lineTo(s.W - 22, cy); ctx.lineTo(r + 12, cy);
        ctx.setLineDash([4, 5]); ctx.lineDashOffset = -s.t * 26 * s.near; ctx.strokeStyle = `rgba(111,227,255,${.18 + .6 * s.near})`; ctx.lineWidth = 1.3; ctx.stroke(); ctx.setLineDash([]);
        // thermometer
        const tx = 20, th = 96; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.strokeRect(tx - 3, 24, 6, th);
        ctx.fillStyle = col; ctx.fillRect(tx - 2, 24 + th * (1 - s.T), 4, th * s.T);
      },
    },
    // tightly focused vector beams: rays converge through a high-NA lens; the pointer steers the focus and
    // turns the polarisation from radial (a bright spot) to azimuthal (a doughnut)
    focus: {
      init(s) { s.rad = 0; },
      draw(s, ctx, dt) {
        const lx = s.W * .36, fx = s.W * .72 + (s.x / s.W - .5) * 30 * s.near, fy = 80 + (s.y - 80) * .35 * s.near, n = 7;
        s.rad = lerp(s.rad, s.near > .2 ? clamp(s.x / s.W) : .5 + .5 * Math.sin(s.t * .5), dt * 3);
        ctx.beginPath(); ctx.ellipse(lx, 80, 9, 60, 0, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.fillStyle = 'rgba(111,227,255,.05)'; ctx.fill();
        for (let i = 0; i < n; i++) {
          const y = 26 + i * (108 / (n - 1)), out = [s.W - 10, fy + (fy - y) * (s.W - 10 - fx) / (fx - lx)];
          ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(lx, y); ctx.lineTo(fx, fy); ctx.lineTo(...out);
          ctx.setLineDash([10, 6]); ctx.lineDashOffset = -s.t * 40; shine(ctx, s, 1.2, 5); ctx.setLineDash([]);
          // polarisation on the incoming rays: radial points across the ray, away from the axis; azimuthal points
          // out of the page, drawn as a dot in a ring
          const ax = 40 + ((s.t * 30 + i * 9) % (lx - 60)), up = -Math.sign(80 - y || 1), len = 6 * s.rad * Math.cos(s.t * 6 + i * .6);
          ctx.save(); ctx.translate(ax, y); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath();
          if (Math.abs(len) > .6) { ctx.moveTo(0, -len * up); ctx.lineTo(0, len * up); ctx.lineTo(-2.2, len * up - 2.6 * Math.sign(len * up)); ctx.moveTo(0, len * up); ctx.lineTo(2.2, len * up - 2.6 * Math.sign(len * up)); }
          if (s.rad < .9) { ctx.moveTo(3.2 * (1 - s.rad), 0); ctx.arc(0, 0, 3.2 * (1 - s.rad), 0, TAU); }
          ctx.stroke(); if (s.rad < .9) { ctx.fillStyle = `rgba(255,255,255,${.8 * (1 - s.rad)})`; ctx.fillRect(-.8, -.8, 1.6, 1.6); } ctx.restore();
        }
        // the focal spot: Airy rings, and a doughnut that opens as the polarisation turns azimuthal
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(fx, fy, 6 + k * 8 + Math.sin(s.t * 3 - k) * 1.5, 0, TAU); ctx.strokeStyle = `rgba(180,140,255,${.28 / k})`; ctx.lineWidth = 1.2; ctx.stroke(); }
        const hole = 1 - s.rad;
        glow(ctx, fx, fy, 18, 'rgba(111,227,255,1)', .25 + .5 * s.rad);
        if (hole > .05) { ctx.beginPath(); ctx.arc(fx, fy, 5 + 2 * hole, 0, TAU); ctx.strokeStyle = `rgba(255,111,125,${.9 * hole})`; ctx.lineWidth = 3 * hole; ctx.stroke(); }
        glow(ctx, fx, fy, 5, 'rgba(255,255,255,1)', s.rad);
        ctx.globalCompositeOperation = 'source-over';
      },
    },
    // a movable optical lattice: atoms ride in the wells of a standing wave, and the lattice conveys them toward the
    // pointer; each atom glints with fluorescence
    lattice: {
      init(s) { const r = rand(5); s.phase = 0; s.v = 0; s.fill = Array.from({ length: 24 }, () => r() < .78); s.glint = new Float32Array(24); },
      draw(s, ctx, dt) {
        const period = 64, depth = 24 + 6 * s.near, mid = 78;
        const want = s.near > .05 ? (s.x - s.W / 2) / (s.W / 2) * 70 * s.near : 10;
        s.v = lerp(s.v, want, dt * 2); s.phase = (s.phase + s.v * dt) % (period * 24);
        // lattice beams
        for (const yy of [16, 22]) { ctx.beginPath(); ctx.moveTo(10, yy); ctx.lineTo(s.W - 10, yy); ctx.setLineDash([12, 8]); ctx.lineDashOffset = (yy === 16 ? -1 : 1) * s.t * 30 - s.phase; faint(ctx, .2, 1.2); }
        ctx.setLineDash([]);
        curve(ctx, 10, s.W - 10, (x) => mid - depth * Math.cos((x - s.phase) / period * TAU));
        shine(ctx, s, 2.2);
        ctx.globalCompositeOperation = 'lighter';
        const first = Math.floor((10 - s.phase) / period) - 1;
        for (let k = first; k < first + s.W / period + 3; k++) {
          const idx = ((k % 24) + 24) % 24; if (!s.fill[idx]) continue;
          const wobble = Math.sin(s.t * 6 + idx) * (2 + Math.abs(s.v) * .05);
          const x = s.phase + (k + .5) * period + wobble, y = mid + depth - 6;
          if (x < 6 || x > s.W - 6) continue;
          if (Math.random() < dt * .8) s.glint[idx] = 1; s.glint[idx] *= Math.exp(-dt * 5);
          glow(ctx, x, y, 8 + 14 * s.glint[idx], 'rgba(255,255,255,1)', .7 + .3 * s.glint[idx]);
          glow(ctx, x, y, 24 * s.glint[idx], 'rgba(111,227,255,1)', .45 * s.glint[idx]);
        }
        ctx.globalCompositeOperation = 'source-over';
        // transport arrow
        const dir = Math.sign(s.v) || 1, ax = s.W / 2, ay = H - 14, len = 30 + Math.min(40, Math.abs(s.v));
        ctx.beginPath(); ctx.moveTo(ax - dir * len, ay); ctx.lineTo(ax + dir * len, ay); ctx.moveTo(ax + dir * (len - 7), ay - 5); ctx.lineTo(ax + dir * len, ay); ctx.lineTo(ax + dir * (len - 7), ay + 5);
        faint(ctx, .3, 1.3);
      },
    },
    // a live 2D Ising model near its critical temperature (Metropolis updates); the pointer is a magnet whose
    // field aligns the spins around it
    ising: {
      init(s) {
        s.c = 8; s.nx = Math.floor((s.W - 16) / s.c); s.ny = Math.floor((H - 16) / s.c); s.ox = (s.W - s.nx * s.c) / 2; s.oy = (H - s.ny * s.c) / 2;
        const r = rand(7); s.spin = Int8Array.from({ length: s.nx * s.ny }, () => (r() < .5 ? 1 : -1)); s.show = Float32Array.from(s.spin, (v) => (v + 1) / 2);
      },
      draw(s, ctx, dt) {
        const { nx, ny, c, spin } = s, T = 2.5, steps = nx * ny * 72 * dt; // about 1.2 sweeps a frame at 60 fps
        const gx = (s.x - s.ox) / c, gy = (s.y - s.oy) / c, h0 = 2.6 * s.near;
        for (let k = 0; k < steps; k++) {
          const i = (Math.random() * nx) | 0, j = (Math.random() * ny) | 0, n = j * nx + i;
          const sum = spin[j * nx + (i + 1) % nx] + spin[j * nx + (i + nx - 1) % nx] + spin[((j + 1) % ny) * nx + i] + spin[((j + ny - 1) % ny) * nx + i];
          const h = h0 ? h0 * Math.exp(-((i - gx) ** 2 + (j - gy) ** 2) / 14) : 0;
          const dE = 2 * spin[n] * (sum + h);
          if (dE <= 0 || Math.random() < Math.exp(-dE / T)) spin[n] = -spin[n];
        }
        const a = 1 - Math.exp(-dt * 12);
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const n = j * nx + i; s.show[n] += ((spin[n] + 1) / 2 - s.show[n]) * a; const v = s.show[n];
          const near = s.near * Math.exp(-((i - gx) ** 2 + (j - gy) ** 2) / 30);
          ctx.fillStyle = v > .5 ? (near > .15 ? beamAt(near, .5 + .45 * v) : `rgba(111,227,255,${.12 + .66 * v})`) : `rgba(255,255,255,${.05 + .1 * v})`;
          const sz = c - 2.4 + v * .8; ctx.fillRect(s.ox + i * c + (c - sz) / 2, s.oy + j * c + (c - sz) / 2, sz, sz);
        }
        if (s.near > .05) { ctx.beginPath(); ctx.arc(s.x, s.y, 24, 0, TAU); ctx.strokeStyle = `rgba(255,111,125,${.6 * s.near})`; ctx.setLineDash([3, 4]); ctx.lineDashOffset = s.t * 10; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); }
      },
    },
    // Fabry–Pérot transmission: the pointer scans the cavity length (the comb slides) and raises the finesse
    // (the peaks sharpen); a probe line reads the transmission where you point
    fp: {
      init(s) { s.drift = 0; s.F = 10; },
      draw(s, ctx, dt) {
        s.drift += dt * .35 * (1 - s.near); s.ph = s.drift + s.near * s.x / s.W * Math.PI; s.F = lerp(s.F, 8 + 110 * s.near, dt * 3);
        const base = H - 18, top = 26, T = (x) => 1 / (1 + s.F * Math.sin((x - 16) / (s.W - 32) * 3.5 * Math.PI + s.ph) ** 2);
        curve(ctx, 16, s.W - 16, () => base); faint(ctx, .14);
        curve(ctx, 16, s.W - 16, (x) => base - (base - top) * T(x), .5);
        const g = ctx.createLinearGradient(0, top, 0, base); g.addColorStop(0, 'rgba(180,140,255,.22)'); g.addColorStop(1, 'rgba(180,140,255,0)');
        ctx.save(); ctx.lineTo(s.W - 16, base); ctx.lineTo(16, base); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
        curve(ctx, 16, s.W - 16, (x) => base - (base - top) * T(x), .5); shine(ctx, s, 2);
        // probe
        const px = clamp(s.near > .05 ? s.x : s.W * (.5 + .38 * Math.sin(s.t * .7)), 16, s.W - 16), tv = T(px), py = base - (base - top) * tv;
        ctx.beginPath(); ctx.moveTo(px, top - 10); ctx.lineTo(px, base); ctx.setLineDash([3, 4]); faint(ctx, .3); ctx.setLineDash([]);
        ctx.globalCompositeOperation = 'lighter'; glow(ctx, px, py, 8 + 20 * tv, beamAt(px / s.W), .9); glow(ctx, px, py, 4, 'rgba(255,255,255,1)');
        // the cavity itself, lighting up with the transmission at the probe
        const mx = s.W - 64, my = 14;
        glow(ctx, mx + 22, my, 10 + 18 * tv, 'rgba(111,227,255,1)', .15 + .7 * tv);
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.moveTo(mx, my - 8); ctx.lineTo(mx, my + 8); ctx.moveTo(mx + 44, my - 8); ctx.lineTo(mx + 44, my + 8); ctx.strokeStyle = '#e7edf2'; ctx.lineWidth = 2.4; ctx.stroke();
      },
    },
    // a three-neuron network learns Planck's law: signals run along its edges, and the fitted curve chases the
    // blackbody data; the pointer sets the temperature, so the peak moves (Wien's law)
    neural: {
      init(s) { s.fit = 1; s.pulses = []; s.spawn = 0; s.out = 0; const r = rand(11); s.noise = Array.from({ length: 22 }, () => r() - .5); },
      draw(s, ctx, dt) {
        const ins = [[34, 52], [34, 108]], hid = [[94, 36], [94, 80], [94, 124]], out = [[150, 80]];
        const edges = [...ins.flatMap((a) => hid.map((b) => [a, b])), ...hid.map((a) => [a, out[0]])];
        edges.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); faint(ctx, .16); });
        s.spawn -= dt; if (s.spawn <= 0) { s.spawn = .5 / (1 + 4 * s.near); const e = edges[(Math.random() * 6) | 0]; s.pulses.push({ e, u: 0, next: true }); }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = s.pulses.length - 1; i >= 0; i--) {
          const p = s.pulses[i]; p.u += dt * (1.6 + s.near);
          const [a, b] = p.e, x = lerp(a[0], b[0], p.u), y = lerp(a[1], b[1], p.u);
          glow(ctx, x, y, 6, p.e[1] === out[0] ? 'rgba(255,111,125,.95)' : 'rgba(111,227,255,.95)');
          if (p.u >= 1) { s.pulses.splice(i, 1); if (b === out[0]) s.out = 1; else if (p.next) s.pulses.push({ e: [b, out[0]], u: 0, next: false }); }
        }
        s.out *= Math.exp(-dt * 4);
        glow(ctx, ...out[0], 12 + 14 * s.out, 'rgba(180,140,255,.8)');
        ctx.globalCompositeOperation = 'source-over';
        [...ins, ...hid].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fillStyle = '#111a22'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 1.4; ctx.stroke(); });
        // Planck: B ∝ x³ / (e^(x/θ) − 1); θ from the pointer, the fit follows with a lag
        const theta = s.near > .05 ? lerp(.55, 1.45, clamp(s.x / s.W)) : 1 + .35 * Math.sin(s.t * .4);
        s.fit = lerp(s.fit, theta, dt * 1.6);
        const x0 = 178, x1 = s.W - 14, base = H - 18, top = 22;
        const B = (u, th) => (u ** 3) / (Math.exp(u / th) - 1 + 1e-9), norm = (th) => B(2.821 * th, th);
        const map = (u, th) => base - (base - top) * B(u, th) / norm(th) * (.55 + .45 * (th - .55) / .9);
        ctx.beginPath(); ctx.moveTo(x0, top - 6); ctx.lineTo(x0, base); ctx.lineTo(x1, base); faint(ctx, .22);
        ctx.globalCompositeOperation = 'lighter';
        s.noise.forEach((nz, i) => { const u = .3 + i * 12 / 22, px = x0 + (u / 12.5) * (x1 - x0); glow(ctx, px, map(u, theta) + nz * 10, 4, 'rgba(255,255,255,.75)'); });
        ctx.globalCompositeOperation = 'source-over';
        curve(ctx, x0, x1, (px) => map(Math.max(.02, (px - x0) / (x1 - x0) * 12.5), s.fit), 1.5);
        shine(ctx, s, 2, 7, beamAt(clamp((s.fit - .55) / .9), .7));
      },
    },
    // the lab heatmap tool: hot spots drift, the pointer brings its own, and the cell under it is "clicked" —
    // its spectrum and fitted curve appear in the side panel
    heatmap: {
      init(s) { s.cell = 12; s.cols = Math.floor((s.W * .64 - 20) / s.cell); s.rows = Math.floor((H - 20) / s.cell); s.sel = [0, 0]; s.amp = 0; },
      draw(s, ctx, dt) {
        const { cell, cols, rows } = s, ox = 14, oy = (H - rows * cell) / 2;
        const b1 = [cols * (.3 + .1 * Math.sin(s.t * .5)), rows * (.35 + .15 * Math.cos(s.t * .4))], b2 = [cols * (.72 + .08 * Math.cos(s.t * .6)), rows * (.65 + .1 * Math.sin(s.t * .7))];
        const px = (s.x - ox) / cell, py = (s.y - oy) / cell;
        const val = (c, r) => clamp(Math.exp(-((c - b1[0]) ** 2 / 14 + (r - b1[1]) ** 2 / 8)) + .8 * Math.exp(-((c - b2[0]) ** 2 / 10 + (r - b2[1]) ** 2 / 6)) + 1.1 * s.near * Math.exp(-((c - px) ** 2 + (r - py) ** 2) / 6));
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { ctx.fillStyle = ramp(val(c, r) * .97); ctx.fillRect(ox + c * cell, oy + r * cell, cell - 1.2, cell - 1.2); }
        const sc = clamp(Math.floor(s.near > .05 ? px : b1[0]), 0, cols - 1), sr = clamp(Math.floor(s.near > .05 ? py : b1[1]), 0, rows - 1);
        const v = val(sc + .5, sr + .5); s.amp = lerp(s.amp, v, dt * 6);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.strokeRect(ox + sc * cell - 1, oy + sr * cell - 1, cell + .8, cell + .8);
        ctx.beginPath(); ctx.arc(ox + (sc + .5) * cell, oy + (sr + .5) * cell, 14 + 2 * Math.sin(s.t * 4), 0, TAU); ctx.strokeStyle = 'rgba(180,140,255,.8)'; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
        // side panel: the spectrum at that pixel, with its fit
        const x0 = ox + cols * cell + 16, x1 = s.W - 12, base = H - 22, top = 26, c0 = (x0 + x1) / 2 + (sc / cols - .5) * 30;
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.strokeRect(x0 - 6, top - 12, x1 - x0 + 10, base - top + 26);
        ctx.globalCompositeOperation = 'lighter';
        for (let x = x0; x <= x1; x += 3) { const y = base - (base - top) * (.08 + .9 * s.amp / (1 + ((x - c0) / 6) ** 2)) + Math.sin(x * 7.3 + s.t * 9) * 2.2; glow(ctx, x, y, 2.4, 'rgba(255,255,255,.7)'); }
        ctx.globalCompositeOperation = 'source-over';
        curve(ctx, x0, x1, (x) => base - (base - top) * (.08 + .9 * s.amp / (1 + ((x - c0) / 6) ** 2)), 1); shine(ctx, s, 1.6, 5);
      },
    },
    // the robot's wheel loop: an oscilloscope of the PID step response; near the card the pointer sets the target
    step: {
      init(s) { s.out = 0; s.v = 0; s.r = .6; s.hist = []; s.ang = 0; s.acc = 0; },
      draw(s, ctx, dt) {
        const top = 24, base = H - 22, toY = (v) => base - (base - top) * v;
        const idle = Math.floor(s.t / 2.6) % 2 ? .78 : .22;
        s.r = s.near > .2 ? clamp((base - s.y) / (base - top), .05, .95) : idle;
        const wn = 9, z = .32; let k = Math.ceil(dt / .004);
        for (let i = 0; i < k; i++) { const h = dt / k; s.v += (wn * wn * (s.r - s.out) - 2 * z * wn * s.v) * h; s.out += s.v * h; }
        s.acc += dt; while (s.acc > 1 / 60) { s.acc -= 1 / 60; s.hist.push([s.out, s.r]); }
        const n = Math.floor((s.W - 90) / 1.5); while (s.hist.length > n) s.hist.shift();
        ctx.beginPath(); ctx.moveTo(14, base); ctx.lineTo(s.W - 70, base); faint(ctx, .14);
        ctx.beginPath(); s.hist.forEach(([, r], i) => { const x = 14 + i * 1.5; i ? ctx.lineTo(x, toY(r)) : ctx.moveTo(x, toY(r)); });
        ctx.setLineDash([4, 5]); faint(ctx, .35, 1.2); ctx.setLineDash([]);
        ctx.beginPath(); s.hist.forEach(([y], i) => { const x = 14 + i * 1.5; i ? ctx.lineTo(x, toY(y)) : ctx.moveTo(x, toY(y)); });
        shine(ctx, s, 2);
        const hx = 14 + (s.hist.length - 1) * 1.5;
        ctx.globalCompositeOperation = 'lighter'; glow(ctx, hx, toY(s.out), 10, 'rgba(255,111,125,.9)'); ctx.globalCompositeOperation = 'source-over';
        // the wheel, turning with the loop's output
        s.ang += s.out * dt * 10; const wx = s.W - 36, wy = 80, R = 20;
        ctx.beginPath(); ctx.arc(wx, wy, R, 0, TAU); ctx.fillStyle = '#111a22'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.6; ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = s.ang + i * TAU / 6; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * (R - 3), wy + Math.sin(a) * (R - 3)); ctx.strokeStyle = i ? 'rgba(255,255,255,.3)' : CO; ctx.lineWidth = i ? 1 : 1.8; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(wx, wy, R + 5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(s.out)); ctx.strokeStyle = CY; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
      },
    },
    // equipotential lines of two electrodes in water, drawn from the live potential; the pointer picks up the
    // cyan electrode, the contours re-form around it and ions stream along the field
    equipotential: {
      init(s) {
        s.gw = Math.round(s.W / 2); s.gh = H / 2; s.buf = document.createElement('canvas'); s.buf.width = s.gw; s.buf.height = s.gh;
        s.bctx = s.buf.getContext('2d'); s.img = s.bctx.createImageData(s.gw, s.gh); s.e2 = [s.W * .7, 80];
        s.ions = Array.from({ length: 34 }, () => ({ x: Math.random() * s.W, y: Math.random() * H, age: Math.random() }));
      },
      draw(s, ctx, dt) {
        const e1 = [s.W * .3, 80];
        const want = s.near > .05 ? [lerp(s.W * .7, clamp(s.x, 30, s.W - 14), ease(s.near)), lerp(80, clamp(s.y, 14, H - 14), ease(s.near))] : [s.W * .7, 80 + 10 * Math.sin(s.t * .6)];
        s.e2 = [lerp(s.e2[0], want[0], dt * 8), lerp(s.e2[1], want[1], dt * 8)];
        if (dist2(...s.e2, ...e1) < 900) { const d = Math.hypot(s.e2[0] - e1[0], s.e2[1] - e1[1]) || 1; s.e2 = [e1[0] + (s.e2[0] - e1[0]) / d * 30, e1[1] + (s.e2[1] - e1[1]) / d * 30]; }
        const V = (x, y) => .5 * Math.log((dist2(x, y, ...s.e2) + 4) / (dist2(x, y, ...e1) + 4));
        const { gw, gh, img } = s, d = img.data, drift = s.t * .25;
        for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
          const v = V(i * 2 + 1, j * 2 + 1), u = v * 2.2 + (v > 0 ? -drift : drift), f = Math.abs(u - Math.round(u)), line = Math.exp(-((f / .07) ** 2));
          const t = clamp(.5 + v * .35), o = (j * gw + i) * 4;
          // coral near the left electrode, cyan near the right, violet between
          d[o] = lerp(111, 255, t) * line + 14 * (1 - line); d[o + 1] = lerp(227, 111, t) * line + 20 * (1 - line); d[o + 2] = lerp(255, 125, Math.abs(t - .5) * 2) * line + 28 * (1 - line);
          d[o + 3] = 255 * (.08 + .8 * line);
        }
        s.bctx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(s.buf, 0, 0, s.W, H);
        ctx.globalCompositeOperation = 'lighter';
        for (const p of s.ions) {
          // drift down the field: E = −∇V
          const h = 1, gx = (V(p.x + h, p.y) - V(p.x - h, p.y)) / 2, gy = (V(p.x, p.y + h) - V(p.x, p.y - h)) / 2, g = Math.hypot(gx, gy) || 1;
          const sp = 40 + 40 * s.near; p.x -= gx / g * sp * dt; p.y -= gy / g * sp * dt; p.age += dt * .5;
          if (p.age > 1 || dist2(p.x, p.y, ...s.e2) < 40 || p.x < 0 || p.x > s.W || p.y < 0 || p.y > H) { const a = Math.random() * TAU; p.x = e1[0] + Math.cos(a) * 9; p.y = e1[1] + Math.sin(a) * 9; p.age = 0; }
          glow(ctx, p.x, p.y, 3.2, 'rgba(255,255,255,1)', .75 * Math.sin(Math.PI * clamp(p.age)));
        }
        glow(ctx, ...e1, 20, 'rgba(255,111,125,.85)'); glow(ctx, ...s.e2, 20 + 6 * s.near, 'rgba(111,227,255,.85)');
        glow(ctx, ...e1, 5, 'rgba(255,255,255,1)'); glow(ctx, ...s.e2, 5, 'rgba(255,255,255,1)');
        ctx.globalCompositeOperation = 'source-over';
      },
    },

    /* ----- home page scenes: things to play with, not just watch. s.clicked is set by a click or tap. ----- */

    // find a single-photon emitter: the pointer is the laser spot of a confocal scan over a WSe₂ flake. Where it has
    // been, the PL map fills in, and the live spectrum and g²(0) tell what sits under the spot. Clusters of emitters
    // give g²(0) near 1; park on the one true single emitter (g²(0) < 0.5) and it locks. A click raster-scans for you
    spe: {
      init(s) {
        s.mx0 = 10; s.mx1 = Math.round(s.W * .58); s.my0 = 10; s.my1 = H - 10;
        s.gw = 36; s.gh = 30; s.cw = (s.mx1 - s.mx0) / s.gw; s.ch = (s.my1 - s.my0) / s.gh; s.map = new Float32Array(s.gw * s.gh);
        s.hist = new Float32Array(31).fill(1); const nr = rand(5); s.noise = Array.from({ length: 31 }, () => (nr() - .5) * .1);
        s.ph = []; s.emit = 0; s.g2 = s.raw = 1;
        s.round = (r) => {
          const cx = (s.mx0 + s.mx1) / 2, cy = H / 2, R = Math.min(s.mx1 - s.mx0, H) * .4;
          s.flake = Array.from({ length: 7 }, (_, i) => { const a = (i + r() * .6) / 7 * TAU, rr = R * (.8 + .32 * r()); return [cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr]; });
          s.em = []; const groups = [];
          for (let k = 0; k < 4; k++) {
            let x, y, tries = 0;
            do { x = cx + (r() - .5) * R * 1.6; y = cy + (r() - .5) * R * 1.4; tries++; } while (tries < 200 && (!within(s.flake, x, y) || groups.some((g) => dist2(g[0], g[1], x, y) < 26 * 26)));
            groups.push([x, y]);
            const n = k ? 3 + (r() * 2 | 0) : 1, lam = .15 + .7 * r();
            for (let j = 0; j < n; j++) s.em.push({ x: x + (j ? (r() - .5) * 5 : 0), y: y + (j ? (r() - .5) * 5 : 0), b: k ? .42 + .18 * r() : .9, lam: lam + (j ? (r() - .5) * .07 : 0), single: !k });
          }
          s.target = s.em.find((e) => e.single);
          s.map.fill(0); s.locked = false; s.lockT = 0; s.good = 0; s.auto = false; s.path = 0;
          s.lp = s.lp || { x: lerp(s.mx0, s.mx1, .78), y: H * .3 };
        };
        s.round(rand(21));
        // the still frame shows a scan already begun: park the spot on a cluster and reveal around it
        const c = s.em.find((e) => !e.single); s.lp = { x: c.x + 3, y: c.y - 2 };
      },
      draw(s, ctx, dt) {
        const onFlake = (x, y) => within(s.flake, x, y);
        const pl = (x, y, w) => (onFlake(x, y) ? .2 : 0) + s.em.reduce((t, e) => t + e.b * Math.exp(-dist2(x, y, e.x, e.y) / (2 * w * w)), 0);
        if (s.clicked) { s.clicked = false; if (!s.locked) { s.auto = true; s.path = 0; } }
        // where the spot goes
        if (s.locked) { s.lp.x = lerp(s.lp.x, s.target.x, Math.min(1, dt * 6)); s.lp.y = lerp(s.lp.y, s.target.y, Math.min(1, dt * 6)); }
        else if (s.auto) {
          if (s.raw < .62 && s.sig > .35) { s.lp.x = lerp(s.lp.x, s.target.x, Math.min(1, dt * 5)); s.lp.y = lerp(s.lp.y, s.target.y, Math.min(1, dt * 5)); }
          else {
            const xs = s.flake.map((v) => v[0]), ys = s.flake.map((v) => v[1]), bx = Math.min(...xs), by = Math.min(...ys);
            s.path += dt * 420; const row = 9, len = Math.max(...xs) - bx, rows = Math.floor((Math.max(...ys) - by) / row) + 1, n = Math.floor(s.path / len) % rows, u = (s.path % len) / len;
            s.lp.x = bx + (n % 2 ? 1 - u : u) * len; s.lp.y = by + 4 + n * row;
          }
        } else if (s.inside) { s.lp.x = clamp(s.x, s.mx0, s.mx1); s.lp.y = clamp(s.y, s.my0, s.my1); }
        // what the spot collects
        const B = (onFlake(s.lp.x, s.lp.y) ? .15 : 0) + .02;
        const sig = s.em.map((e) => e.b * Math.exp(-dist2(s.lp.x, s.lp.y, e.x, e.y) / 98));
        const tot = sig.reduce((a, b) => a + b, 0); s.sig = tot;
        const g2 = 1 - sig.reduce((a, b) => a + b * b, 0) / (tot + B) ** 2; s.raw = g2; s.g2 = lerp(s.g2, g2, Math.min(1, dt * 8));
        const ok = s.g2 < .5 && tot > .4;
        if (!s.locked) { s.good = ok ? s.good + dt : 0; if (s.good > .35) { s.locked = true; s.auto = false; s.lockT = 0; } }
        else { s.lockT += dt; if (s.lockT > 2.6) { s.round(Math.random); s.g2 = 1; } }
        // PL map: cells under the spot fill in; when locked the whole map is revealed outward from the emitter
        const reveal = s.locked ? s.lockT * 150 : 0;
        for (let j = 0; j < s.gh; j++) for (let i = 0; i < s.gw; i++) {
          const x = s.mx0 + (i + .5) * s.cw, y = s.my0 + (j + .5) * s.ch, n = j * s.gw + i;
          if (dist2(x, y, s.lp.x, s.lp.y) < 110 || (reveal && dist2(x, y, s.target.x, s.target.y) < reveal * reveal)) s.map[n] = Math.max(s.map[n], pl(x, y, 3.4));
          const v = s.map[n]; if (v > .01) { ctx.fillStyle = ramp(.05 + .92 * Math.min(1, v) ** 1.5, .35 + .6 * Math.min(1, v / .8)); ctx.fillRect(x - s.cw / 2, y - s.ch / 2, s.cw - .6, s.ch - .6); }
        }
        ctx.beginPath(); s.flake.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
        ctx.fillStyle = 'rgba(180,140,255,.06)'; ctx.fill(); ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        // the laser spot
        ctx.globalCompositeOperation = 'lighter';
        const hue = s.locked ? 'rgba(111,227,255,1)' : 'rgba(255,111,125,1)';
        glow(ctx, s.lp.x, s.lp.y, 18, hue, .55); glow(ctx, s.lp.x, s.lp.y, 4, 'rgba(255,255,255,1)', .9);
        if (s.locked) { // a regular train of single photons heads for the detector
          s.emit -= dt; if (s.emit <= 0) { s.emit = .16; s.ph.push({ x: s.target.x, y: s.target.y }); }
        }
        const px0 = Math.round(s.W * .63);
        for (let i = s.ph.length - 1; i >= 0; i--) { const p = s.ph[i]; p.x += 150 * dt; p.y = lerp(p.y, 54, Math.min(1, dt * 3)); if (p.x > px0 - 4) { s.ph.splice(i, 1); continue; } glow(ctx, p.x, p.y, 4.5, 'rgba(255,255,255,1)', .95); }
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.arc(s.lp.x, s.lp.y, 8, 0, TAU); ctx.moveTo(s.lp.x - 13, s.lp.y); ctx.lineTo(s.lp.x - 10, s.lp.y); ctx.moveTo(s.lp.x + 10, s.lp.y); ctx.lineTo(s.lp.x + 13, s.lp.y);
        ctx.strokeStyle = s.locked ? CY : CO; ctx.lineWidth = 1.3; ctx.stroke();
        // panel: the spectrum under the spot, then the coincidence histogram and its g²(0)
        const px1 = s.W - 12, sb = 78, gb = 142;
        ctx.beginPath(); ctx.moveTo(px0, 26); ctx.lineTo(px0, sb); ctx.lineTo(px1, sb); faint(ctx, .22);
        curve(ctx, px0, px1, (x) => { const u = (x - px0) / (px1 - px0); return sb - 32 * (B * .9 * Math.exp(-(((u - .5) / .3) ** 2)) + s.em.reduce((t, e, k) => t + sig[k] / (1 + ((u - e.lam) / .016) ** 2), 0)); }, 1);
        ctx.save(); ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.shadowColor = beamAt(s.g2, .8); ctx.shadowBlur = 6 * s.dpr; ctx.strokeStyle = beamAt(s.g2); ctx.stroke(); ctx.restore();
        const bw = (px1 - px0) / 31, hh = 36;
        for (let i = 0; i < 31; i++) {
          const tau = i / 15 - 1, want = 1 - (1 - s.g2) * Math.exp(-Math.abs(tau) / .13) + s.noise[i] * (1 - Math.abs(tau) * .3);
          s.hist[i] = lerp(s.hist[i], want, Math.min(1, dt * 5));
          ctx.fillStyle = beamAt(s.g2, .7); ctx.fillRect(px0 + i * bw + bw * .18, gb - hh * s.hist[i], bw * .64, hh * s.hist[i]);
        }
        ctx.beginPath(); ctx.moveTo(px0, gb - hh * .5); ctx.lineTo(px1, gb - hh * .5); ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(111,227,255,.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(px0, gb); ctx.lineTo(px1, gb); faint(ctx, .22);
        // meter, as in the fit: shorter is better
        const mw = 50, mx = s.W - mw - 12, my = 12;
        ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(mx, my, mw, 3); ctx.fillStyle = beamAt(s.g2); ctx.fillRect(mx, my, mw * clamp(s.g2), 3);
        ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = '600 9px system-ui, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(s.locked ? 'single photon ✓' : `g²(0) ${s.g2.toFixed(2)}`, mx - 6, my + 4);
      },
    },
    // dress an exciton: in a 2D heterostructure the pointer is an exciton moving through a Bose medium that pools
    // in moiré pockets. Bosons it passes slowly cling to it as a dressing cloud, and the attractive-polaron peak in
    // the spectrum shifts red with every one; move too fast and the cloud is stripped away. Reach the dashed target
    // and the Bose polaron locks; then the pockets move and a new target is set. A click pumps fresh bosons in
    bosepolaron: {
      init(s) {
        const g = (r) => (r() + r() + r() - 1.5) * 1.15;
        s.round = (r) => {
          s.pud = Array.from({ length: 3 }, (_, k) => ({ x: s.W * (.18 + .3 * k) + (r() - .5) * s.W * .14, y: 22 + r() * 76, w: 13 + r() * 10 }));
          s.Nt = 13 + (r() * 6 | 0); s.locked = false; s.lockT = 0; s.good = 0;
          s.b.forEach((b, i) => { if (b.pump) return; const p = s.pud[i % 3]; b.hx = clamp(p.x + g(r) * p.w * .75, 6, s.W - 6); b.hy = clamp(p.y + g(r) * p.w * .65, 6, 110); });
        };
        const r = rand(41);
        s.b = Array.from({ length: 96 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, bound: false, a: 0, pump: false }));
        s.round(r); s.b.forEach((b) => { b.x = b.hx; b.y = b.hy; });
        s.ex = { x: s.W * .08, y: 64 }; s.v = 0; s.pulses = []; s.flash = 0;
      },
      draw(s, ctx, dt) {
        const ex = s.ex, k = 1 - Math.exp(-dt * 10), ox = ex.x, oy = ex.y;
        ex.x += (s.x - ex.x) * k; ex.y += (Math.min(s.y, 110) - ex.y) * k;
        s.v = lerp(s.v, dt ? Math.hypot(ex.x - ox, ex.y - oy) / dt : 0, Math.min(1, dt * 6));
        const fast = s.v > 120 && !s.locked;
        if (s.clicked) {
          s.clicked = false; s.pulses.push({ x: s.x, y: Math.min(s.y, 110), t: 0 });
          // a pump pulse: a few free bosons move their home to the spot (pumped bosons stay in place)
          const free = s.b.filter((b) => !b.bound).sort((p, q) => dist2(p.x, p.y, s.x, s.y) - dist2(q.x, q.y, s.x, s.y)).slice(12, 24);
          free.forEach((b, i) => { const a = i / free.length * TAU; b.x = s.x + Math.cos(a) * 4; b.y = Math.min(s.y, 110) + Math.sin(a) * 4; b.hx = clamp(s.x + Math.cos(a) * 12, 6, s.W - 6); b.hy = clamp(Math.min(s.y, 110) + Math.sin(a) * 10, 6, 110); b.vx = Math.cos(a) * 60; b.vy = Math.sin(a) * 60; b.pump = true; });
        }
        // the medium, and the dressing cloud
        let N = 0;
        for (const b of s.b) {
          if (b.bound) {
            b.a += dt * 1.6; const rr = 9 + 3.5 * Math.sin(b.a * 1.7 + b.hx);
            b.x = lerp(b.x, ex.x + Math.cos(b.a) * rr, Math.min(1, dt * 9)); b.y = lerp(b.y, ex.y + Math.sin(b.a) * rr, Math.min(1, dt * 9));
            if (fast && Math.random() < dt * 4) { b.bound = false; const a = Math.atan2(b.y - ex.y, b.x - ex.x); b.vx = Math.cos(a) * 110; b.vy = Math.sin(a) * 110; }
            else N++;
            continue;
          }
          const dx = ex.x - b.x, dy = ex.y - b.y, d = Math.hypot(dx, dy) || 1;
          if (d < 28 && !fast) { const f = 70 * (1 - d / 28); b.vx += dx / d * f * dt * 3; b.vy += dy / d * f * dt * 3; }
          // only the pointer dresses the exciton, not the idle drift
          if (d < 11 && s.v < 75 && s.near > .2 && !s.locked) { b.bound = true; b.a = Math.atan2(-dy, -dx); }
          b.vx += ((b.hx - b.x) * 1.2 + (Math.random() - .5) * 90) * dt; b.vy += ((b.hy - b.y) * 1.2 + (Math.random() - .5) * 90) * dt;
          b.vx *= Math.exp(-dt * 3); b.vy *= Math.exp(-dt * 3);
          b.x = clamp(b.x + b.vx * dt, 4, s.W - 4); b.y = clamp(b.y + b.vy * dt, 4, 112);
        }
        if (!s.locked) { s.good = N >= s.Nt ? s.good + dt : 0; if (s.good > .4) { s.locked = true; s.lockT = 0; s.flash = 1; } }
        else {
          s.lockT += dt;
          if (s.lockT > 2.4) { // release the cloud and move the pockets
            s.b.forEach((b) => { if (b.bound) { b.bound = false; const a = Math.random() * TAU; b.vx = Math.cos(a) * 70; b.vy = Math.sin(a) * 70; } b.pump = false; });
            s.round(Math.random);
          }
        }
        s.flash *= Math.exp(-dt * 2);
        const q = clamp(N / s.Nt);
        // moiré pockets: where the medium is dense
        ctx.globalCompositeOperation = 'lighter';
        for (const p of s.pud) glow(ctx, p.x, p.y, p.w * 2.6, 'rgba(180,140,255,1)', .12);
        for (const b of s.b) glow(ctx, b.x, b.y, b.bound ? 5 : 3.2, b.bound ? (s.locked ? 'rgba(111,227,255,1)' : 'rgba(180,140,255,1)') : 'rgba(255,255,255,1)', b.bound ? .95 : .5);
        for (let i = s.pulses.length - 1; i >= 0; i--) {
          const p = s.pulses[i]; p.t += dt; if (p.t > .8) { s.pulses.splice(i, 1); continue; }
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 + p.t * 50, 0, TAU); ctx.strokeStyle = `rgba(255,111,125,${(.8 * (1 - p.t / .8)).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        const R = 15 + N * .7 + 6 * s.flash;
        glow(ctx, ex.x, ex.y, R * 1.8, s.locked ? 'rgba(111,227,255,1)' : 'rgba(111,227,255,1)', .25 + .35 * q + .4 * s.flash);
        glow(ctx, ex.x, ex.y, 6, 'rgba(255,255,255,1)', 1);
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.arc(ex.x, ex.y, R, 0, TAU); ctx.setLineDash([3, 4]); ctx.lineDashOffset = -s.t * 14;
        ctx.strokeStyle = fast ? `rgba(255,111,125,${(.5 + .5 * Math.sin(s.t * 40)).toFixed(2)})` : beamAt(1 - q, .85); ctx.lineWidth = 1.3; ctx.stroke(); ctx.setLineDash([]);
        // spectrum: attractive polaron shifts red with the dressing, the repulsive branch fades; dashed: the target
        const base = H - 8, c = s.W * .64, shift = (n) => 8 + 7.2 * n, xa = c - shift(N), xr = c + 10 + 2.6 * N, xt = c - shift(s.Nt);
        ctx.fillStyle = 'rgba(11,16,22,.55)'; ctx.fillRect(0, 118, s.W, H - 118);
        ctx.beginPath(); ctx.moveTo(14, base); ctx.lineTo(s.W - 14, base); faint(ctx, .2);
        ctx.beginPath(); ctx.moveTo(xt, 122); ctx.lineTo(xt, base); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(111,227,255,.75)'; ctx.lineWidth = 1.1; ctx.stroke(); ctx.setLineDash([]);
        curve(ctx, 14, s.W - 14, (x) => base - (8 + 20 * q) / (1 + ((x - xa) / 4.5) ** 2) - Math.max(5, 24 - 1.5 * N) / (1 + ((x - xr) / 6.5) ** 2), 1);
        ctx.save(); ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.shadowColor = beamAt(1 - q, .8); ctx.shadowBlur = (s.locked ? 14 : 5) * s.dpr; ctx.strokeStyle = beamAt(1 - q); ctx.stroke(); ctx.restore();
        // meter
        const mw = 50, mx = s.W - mw - 12, my = 12;
        ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(mx, my, mw, 3); ctx.fillStyle = beamAt(1 - q); ctx.fillRect(mx, my, mw * q, 3);
        ctx.font = '600 9px system-ui, sans-serif'; ctx.textAlign = 'right';
        ctx.fillStyle = fast ? 'rgba(255,111,125,.95)' : 'rgba(255,255,255,.62)';
        ctx.fillText(s.locked ? 'Bose polaron ✓' : fast ? 'too fast' : `dressed ${N} / ${s.Nt}`, mx - 6, my + 4);
      },
    },
    // fit the peak: the pointer moves a Lorentzian (left–right: centre, up–down: height) over noisy data, the
    // residuals and χ² answer live, and a good fit locks in before new data arrive; a click fits automatically
    fit: {
      init(s) {
        s.fresh = (r) => {
          s.x0 = s.W * (.28 + .44 * r()); s.A0 = .55 + .35 * r(); s.w0 = 11 + 6 * r();
          s.pts = Array.from({ length: 46 }, (_, i) => { const x = 18 + i * (s.W - 36) / 45; return { x, v: s.A0 / (1 + ((x - s.x0) / s.w0) ** 2) + .07 * (r() + r() + r() - 1.5) + .04 }; });
          s.locked = false; s.lockT = 0; s.good = 0;
        };
        s.fresh(rand(9)); s.xc = s.W * .74; s.A = .32; s.auto = false;
      },
      draw(s, ctx, dt) {
        const top = 24, base = H - 40, Y = (v) => base - v * (base - top), M = (x) => s.A / (1 + ((x - s.xc) / s.w0) ** 2) + .04;
        if (s.clicked) { s.clicked = false; if (!s.locked) s.auto = true; }
        if (s.locked) { s.lockT += dt; s.xc = lerp(s.xc, s.x0, Math.min(1, dt * 8)); s.A = lerp(s.A, s.A0, Math.min(1, dt * 8)); if (s.lockT > 1.9) s.fresh(Math.random); }
        else if (s.auto) { s.xc = lerp(s.xc, s.x0, Math.min(1, dt * 3.5)); s.A = lerp(s.A, s.A0, Math.min(1, dt * 3.5)); }
        else if (s.inside) { const k = 1 - Math.exp(-dt * 12); s.xc += (s.x - s.xc) * k; s.A += (clamp((base - s.y) / (base - top), .04, 1.1) - s.A) * k; }
        let chi = 0; for (const p of s.pts) chi += (p.v - M(p.x)) ** 2; chi /= s.pts.length * .0045;
        const q = clamp(Math.exp(-Math.max(0, chi - 1) / 4));
        if (!s.locked) { s.good = q > .82 ? s.good + dt : 0; if (s.good > .35) { s.locked = true; s.auto = false; s.lockT = 0; } }
        // axes
        ctx.beginPath(); ctx.moveTo(16, top - 8); ctx.lineTo(16, base); ctx.lineTo(s.W - 12, base); faint(ctx, .22);
        // the model, with its fill; it turns from coral (poor) to cyan (good)
        curve(ctx, 18, s.W - 18, (x) => Y(M(x)), 1.5);
        ctx.save(); ctx.lineTo(s.W - 18, base); ctx.lineTo(18, base); ctx.closePath(); ctx.fillStyle = beamAt(1 - q, .12); ctx.fill(); ctx.restore();
        curve(ctx, 18, s.W - 18, (x) => Y(M(x)), 1.5);
        ctx.save(); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.shadowColor = beamAt(1 - q, .8); ctx.shadowBlur = (s.locked ? 16 : 6) * s.dpr; ctx.strokeStyle = beamAt(1 - q); ctx.stroke(); ctx.restore();
        // the data; a sparkle runs across them when the fit locks
        ctx.globalCompositeOperation = 'lighter';
        const sweep = s.locked ? s.lockT * 1.6 : -1;
        s.pts.forEach((p, i) => { const sp = sweep >= 0 ? Math.exp(-(((i / 45 - sweep) * 9) ** 2)) : 0; glow(ctx, p.x, Y(p.v), 3.4 + 6 * sp, sp > .2 ? 'rgba(111,227,255,1)' : 'rgba(255,255,255,1)', .8); });
        ctx.globalCompositeOperation = 'source-over';
        // residuals
        const rb = H - 16; ctx.beginPath(); ctx.moveTo(18, rb); ctx.lineTo(s.W - 18, rb); faint(ctx, .16);
        s.pts.forEach((p) => { const d = clamp((p.v - M(p.x)) * 60, -14, 14); ctx.fillStyle = Math.abs(d) > 6 ? 'rgba(255,111,125,.8)' : 'rgba(111,227,255,.7)'; ctx.fillRect(p.x - 1.4, Math.min(rb, rb - d), 2.8, Math.max(.8, Math.abs(d))); });
        // χ² meter: shorter is better
        const mw = 58, mx = s.W - mw - 14, my = 12;
        ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(mx, my, mw, 3); ctx.fillStyle = beamAt(1 - q); ctx.fillRect(mx, my, mw * clamp(1 - q + .04), 3);
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '600 9px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(s.locked ? 'fit ✓' : 'χ²', mx - 6, my + 4);
      },
    },
  };

  // ---------- engine ----------
  // A scene plays only while the pointer is on its card (or within HALO px of it), and only the nearest card plays;
  // everywhere else it holds a still frame. Leaving a card lets its scene coast to a stop.
  const HALO = 36, CARD = '.project-item, .horizon-research-card'; // Research page cards, and the home page research cards
  const pointer = { x: -1e4, y: -1e4, on: false, card: null, chrome: false };
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = e.pointerType !== 'touch';
    const el = e.target instanceof Element ? e.target : null;
    // over the sticky header nothing beneath it should wake up
    pointer.card = el?.closest(CARD) || null; pointer.chrome = !!el?.closest('.site-header');
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.on = false; });
  addEventListener('blur', () => { pointer.on = false; });

  const live = [];
  thumbs.forEach((thumb, n) => {
    const scene = scenes[thumb.dataset.scene]; if (!scene) return;
    const canvas = document.createElement('canvas'); canvas.className = 'project-canvas'; canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    thumb.append(canvas);
    const s = { thumb, card: thumb.closest(CARD) || thumb, canvas, ctx, scene, seed: n * 1.7 + .4, near: 0, act: 0, still: false, tap: 0,
      t: n * 3.1, x: 0, y: 0, visible: false, ready: false, inside: false };
    // a click reaches the scene as s.clicked; touch screens have no hover, so a tap also plays it for a few seconds
    thumb.addEventListener('pointerdown', (e) => { s.clicked = true; if (e.pointerType === 'touch') s.tap = performance.now() + 5000; });
    live.push(s);
  });
  if (!live.length) return;

  const paint = (s, dt, lx, ly) => {
    const { ctx } = s;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
    ctx.setTransform(s.k * s.dpr, 0, 0, s.k * s.dpr, 0, 0);
    try {
      s.scene.draw(s, ctx, dt);
      // a soft beam-coloured light under the pointer itself
      if (s.inside && s.near > .02) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, lx, ly, 46, 'rgba(111,227,255,1)', .14 * s.near); glow(ctx, lx, ly, 18, 'rgba(180,140,255,1)', .22 * s.near); }
    } catch (err) { s.ready = false; s.thumb.classList.remove('is-live'); console.error(err); }
    ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); ctx.globalAlpha = 1;
  };
  const size = (s) => {
    const r = s.thumb.getBoundingClientRect(); if (!r.width || !r.height) return;
    s.dpr = Math.min(2, devicePixelRatio || 1); s.k = r.height / H; s.W = r.width / s.k;
    s.canvas.width = Math.round(r.width * s.dpr); s.canvas.height = Math.round(r.height * s.dpr);
    s.beam = s.ctx.createLinearGradient(16, 0, s.W - 16, 0);
    s.beam.addColorStop(0, CY); s.beam.addColorStop(.55, VI); s.beam.addColorStop(1, CO);
    const keep = s.ready && s.lastW && Math.abs(s.lastW - s.W) < 2; s.lastW = s.W;
    if (!s.ready) { s.x = s.W * (.5 + .32 * Math.sin(s.t * .37 + s.seed)); s.y = H * (.5 + .26 * Math.sin(s.t * .53 + s.seed * 2)); }
    if (!keep) {
      // run the scene briefly off screen so its still frame is a settled state, not the raw initial one
      s.scene.init(s); for (let k = 0; k < 40; k++) paint(s, 1 / 30, 0, 0);
    }
    if (!s.ready) { s.ready = true; s.thumb.classList.add('is-live'); }
    s.still = false; // the canvas was cleared by the resize: paint the still frame again
  };
  const ro = new ResizeObserver((entries) => entries.forEach((e) => { const s = live.find((l) => l.thumb === e.target); if (s) size(s); }));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { const s = live.find((l) => l.thumb === e.target); if (s) s.visible = e.isIntersecting; }), { rootMargin: '80px' });
  live.forEach((s) => { ro.observe(s.thumb); io.observe(s.thumb); });

  const gap = (r) => Math.hypot(Math.max(r.left - pointer.x, 0, pointer.x - r.right), Math.max(r.top - pointer.y, 0, pointer.y - r.bottom));
  let last = performance.now(), raf = 0;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    // the simulation steps at most 50 ms at a time; easing in and out follows real time, so a throttled tab still settles
    const real = Math.min(1, (now - last) / 1000), dt = Math.min(.05, real); last = now;
    const shown = live.filter((s) => s.visible && s.ready && !s.thumb.closest('[hidden]'));
    // the one card the pointer is on, or closest to within HALO
    let active = null, best = HALO;
    if (pointer.on && !pointer.chrome) {
      active = pointer.card && shown.find((s) => s.card === pointer.card);
      if (!active) for (const s of shown) { const d = gap(s.card.getBoundingClientRect()); if (d <= best) { best = d; active = s; } }
    }
    for (const s of shown) {
      const tapped = s.tap > now, on = s === active || tapped;
      s.act += ((on ? 1 : 0) - s.act) * (1 - Math.exp(-real * (on ? 6 : 3)));
      if (!on && s.act < .004) { s.act = 0; s.near = 0; if (!s.still) { paint(s, 0, 0, 0); s.still = true; } continue; }
      s.still = false;
      const r = s.thumb.getBoundingClientRect(), d = s === active ? gap(r) : Infinity;
      s.inside = d === 0;
      // strength of the pointer's effect: full over the drawing, fading over the rest of the card
      const want = s === active ? Math.max(.35, ease(clamp(1 - d / 160))) : 0;
      s.near += (want - s.near) * (1 - Math.exp(-real * 5));
      const step = dt * s.act; s.t += step;
      // the steered point: a slow drift on its own, pulled toward the pointer as it approaches
      const gx = s.W * (.5 + .32 * Math.sin(s.t * .37 + s.seed)), gy = H * (.5 + .26 * Math.sin(s.t * .53 + s.seed * 2));
      const lx = clamp((pointer.x - r.left) / s.k, 0, s.W), ly = clamp((pointer.y - r.top) / s.k, 0, H);
      const tx = lerp(gx, lx, s.near), ty = lerp(gy, ly, s.near), follow = 1 - Math.exp(-dt * (s.inside ? 14 : 4));
      s.x += (tx - s.x) * follow; s.y += (ty - s.y) * follow;
      paint(s, step, lx, ly);
    }
  };
  raf = requestAnimationFrame(frame);
  reduce.addEventListener('change', (e) => { if (e.matches) { cancelAnimationFrame(raf); live.forEach((s) => { s.thumb.classList.remove('is-live'); s.canvas.remove(); }); } });
})();
