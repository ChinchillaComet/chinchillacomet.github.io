/* An original, pixel-by-pixel landscape. No images, fonts, or libraries are fetched. */
(() => {
  'use strict';

  const PI = Math.PI;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (a) => `rgb(${a.join(',')})`;
  function random(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function ellipse(c, x, y, rx, ry, color) {
    for (let j = -Math.floor(ry); j <= ry; j++) {
      const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - j * j / (ry * ry))));
      rect(c, x - span, y + j, span * 2 + 1, 1, color);
    }
  }
  function polygon(c, points, color) {
    const low = Math.floor(Math.min(...points.map(p => p[1])));
    const high = Math.ceil(Math.max(...points.map(p => p[1])));
    for (let y = low; y < high; y++) {
      const hits = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          hits.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i < hits.length - 1; i += 2) {
        rect(c, Math.ceil(hits[i]), y, Math.floor(hits[i + 1]) - Math.ceil(hits[i]) + 1, 1, color);
      }
    }
  }
  function line(c, x0, y0, x1, y1, color) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      rect(c, x0, y0, 1, 1, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = error * 2;
      if (e2 >= dy) { error += dy; x0 += sx; }
      if (e2 <= dx) { error += dx; y0 += sy; }
    }
  }
  function star(c, x, y, size, color) {
    rect(c, x, y - size, 1, size * 2 + 1, color);
    rect(c, x - size, y, size * 2 + 1, 1, color);
    if (size > 2) rect(c, x - 1, y - 1, 3, 3, color);
  }
  const SKY = [
    [0, [29, 29, 59]], [.20, [53, 43, 79]], [.43, [104, 71, 112]],
    [.66, [164, 108, 142]], [.84, [210, 148, 158]], [1, [244, 188, 166]]
  ];
  function skyColor(t) {
    for (let i = 1; i < SKY.length; i++) {
      if (t <= SKY[i][0]) return rgb(mix(SKY[i - 1][1], SKY[i][1], (t - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0])));
    }
    return rgb(SKY[SKY.length - 1][1]);
  }

  function create(w, h, makeCanvas) {
    const rng = random(719042);
    const horizon = Math.round(h * .625);
    const small = w / h < .8;
    const moon = { x: Math.round(w * (small ? .72 : .75)), y: Math.round(h * (small ? .225 : .20)), r: small ? 12 : 15 };
    const layer = () => { const cv = makeCanvas(w, h); cv.width = w; cv.height = h; return cv; };
    const sky = layer(), land = layer(), water = layer(), garden = layer();
    const sc = sky.getContext('2d'), lc = land.getContext('2d'), wc = water.getContext('2d'), gc = garden.getContext('2d');
    [sc, lc, wc, gc].forEach(c => { c.imageSmoothingEnabled = false; });

    // Quiet, dithered dusk: every colour is drawn on the same integer pixel grid.
    for (let y = 0; y < horizon + 1; y++) {
      const t = Math.floor(y / 2) * 2 / horizon;
      rect(sc, 0, y, w, 1, skyColor(t));
      if (y % 2) for (let x = y % 4; x < w; x += 4) rect(sc, x, y, 1, 1, skyColor((y + 1) / horizon));
    }
    // Faint celestial dust, deliberately sparse around the central title.
    for (let i = 0; i < w * .44; i++) {
      const x = Math.floor(rng() * w), y = Math.floor(rng() * horizon * .66);
      if (rng() < y / horizon) continue;
      rect(sc, x, y, 1, 1, ['#625373', '#736285', '#978199'][Math.floor(rng() * 3)]);
    }
    const stars = Array.from({ length: Math.round(w * .12) }, () => ({
      x: Math.floor(rng() * w), y: Math.floor(rng() * horizon * .67),
      phase: rng() * PI * 2, size: rng() > .91 ? 2 : 0, speed: .25 + rng() * .3
    }));

    // The crescent is a binary pixel mask, never a blurred circle.
    for (let r = moon.r + 8; r > moon.r; r -= 3) {
      sc.globalAlpha = .018;
      ellipse(sc, moon.x, moon.y, r, r, '#ffddb8');
    }
    sc.globalAlpha = 1;
    for (let yy = -moon.r; yy <= moon.r; yy++) {
      for (let xx = -moon.r; xx <= moon.r; xx++) {
        if (xx * xx + yy * yy > moon.r * moon.r) continue;
        const cut = (xx - 6) ** 2 + (yy + 5) ** 2 < (moon.r - 1) ** 2;
        if (!cut) rect(sc, moon.x + xx, moon.y + yy, 1, 1, xx < -8 || yy > 10 ? '#edbca3' : '#ffead0');
      }
    }
    star(sc, moon.x - moon.r - 11, moon.y + 5, 2, '#dfb4b3');
    rect(sc, moon.x + moon.r + 9, moon.y - 12, 1, 1, '#fff1d0');

    // Silhouettes are scan-converted polygons, with hand-placed ridgelines.
    function mountain(points, color, shadow, detail) {
      const relief = small ? .64 : 1;
      const pts = points.map(([x, y]) => [x * w, horizon - (horizon - y * h) * relief]);
      const ridge = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const steps = Math.max(1, Math.floor((b[0] - a[0]) / 3));
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          ridge.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + Math.sin(t * PI) * (rng() * 3 - 1)]);
        }
      }
      ridge.push(pts[pts.length - 1]);
      polygon(lc, [...ridge, [w, horizon + 3], [0, horizon + 3]], color);
      for (let i = 1; i < pts.length - 1; i++) {
        if (pts[i][1] >= pts[i - 1][1] || pts[i][1] >= pts[i + 1][1]) continue;
        const p = pts[i];
        polygon(lc, [p, [p[0] + 6, p[1] + 11], [p[0] - 5, p[1] + 16], [p[0] + 18, horizon], [pts[i + 1][0], horizon], pts[i + 1]], shadow);
        line(lc, p[0] - 1, p[1] + 2, p[0] - 12, p[1] + 12, detail);
        for (let s = 0; s < 14; s++) {
          const depth = 8 + rng() * Math.max(1, horizon - p[1] - 8);
          const xx = p[0] - depth * .52 - rng() * depth * .42;
          const yy = p[1] + depth;
          lc.globalAlpha = .22;
          rect(lc, xx, yy, 2 + rng() * 8, 1, detail);
        }
        lc.globalAlpha = 1;
      }
    }
    mountain([[0,.52],[.05,.49],[.12,.51],[.19,.43],[.24,.47],[.31,.42],[.38,.49],[.43,.47],[.49,.53],[.55,.46],[.63,.49],[.71,.40],[.77,.45],[.85,.43],[.91,.50],[1,.45]], '#ad7f9f', '#9d7299', '#cb94ac');
    mountain([[0,.55],[.10,.47],[.14,.50],[.20,.53],[.28,.49],[.34,.54],[.44,.58],[.52,.52],[.58,.55],[.65,.48],[.70,.53],[.75,.55],[.83,.49],[.9,.54],[1,.48]], '#735e88', '#645a80', '#9c789c');
    mountain([[0,.56],[.09,.55],[.18,.58],[.27,.59],[.34,.58],[.42,.615],[.54,.61],[.66,.60],[.71,.57],[.80,.58],[.88,.55],[.97,.57],[1,.55]], '#4d506f', '#444b68', '#786585');
    // Distant conifers and the last pink edge of daylight on the water.
    for (let x = 0; x < w; x += 2 + Math.floor(rng() * 3)) {
      const centerDistance = Math.abs(x / w - .5);
      const baseY = horizon - 2 - Math.round(Math.sin(x * .037) * 2);
      const th = 2 + Math.floor(rng() * (4 + centerDistance * 11));
      polygon(lc, [[x, baseY - th], [x - th * .32, baseY], [x + th * .32, baseY]], '#3b4860');
      rect(lc, x, baseY - th, 1, th + 2, '#3b4860');
    }
    rect(lc, 0, horizon, w, 2, '#bd89a0');
    for (let x = 0; x < w; x += 16) rect(lc, x, horizon + 1, 7 + rng() * 12, 1, '#f0b6ac');

    // Deep teal water, with the sky's rose colours gathered around the horizon.
    const waterTop = [116, 102, 135], waterBottom = [24, 52, 65];
    for (let y = horizon + 2; y < h; y++) {
      const t = (y - horizon) / (h - horizon);
      rect(wc, 0, y, w, 1, rgb(mix(waterTop, waterBottom, Math.pow(t, .52))));
      if (y % 2 === 0) {
        for (let j = 0; j < w / (16 + t * 14); j++) {
          const x = rng() * w;
          rect(wc, x, y, 2 + rng() * (3 + t * 14), 1, rgb(mix([163, 122, 153], [41, 69, 82], t)));
        }
      }
    }
    // Reflected mountain masses fade into the lake instead of mirroring perfectly.
    for (let i = 0; i < 125; i++) {
      const y = horizon + 3 + Math.floor(rng() * h * .14);
      const x = rng() * w;
      const edge = Math.abs(x / w - .5);
      if (rng() > edge + .15) continue;
      rect(wc, x, y, 3 + rng() * 19, 1, '#535c7b');
    }
    const ripples = Array.from({ length: Math.round(w * .35) }, () => ({
      x: rng() * w, y: horizon + 4 + rng() * (h - horizon) * .78,
      width: 1 + rng() * 10, phase: rng() * PI * 2, speed: .3 + rng() * .45,
      color: ['#b091b0', '#897d9e', '#6e93a2', '#5e8896'][Math.floor(rng() * 4)]
    }));

    // Small cloud sprites drift a pixel at a time. Their lit tops face the dusk.
    function makeCloud(width, height, seed) {
      const cv = makeCanvas(width, height), c = cv.getContext('2d'), cr = random(seed);
      const lobes = [];
      for (let x = 5; x < width - 6; x += 6 + cr() * 9) {
        const f = Math.sin(x / width * PI);
        lobes.push([x, height * .58 - f * height * .16, 8 + cr() * 15, 2 + f * height * (.20 + cr() * .12)]);
      }
      for (const [x,y,rx,ry] of lobes) ellipse(c, x, y, rx, ry, '#a47399');
      for (const [x,y,rx,ry] of lobes) ellipse(c, x - 2, y - 2, rx * .90, ry * .67, '#c68da9');
      for (const [x,y,rx,ry] of lobes) ellipse(c, x - 3, y - 3, rx * .72, Math.max(1, ry * .39), '#e5acae');
      for (let i = 0; i < width * .35; i++) {
        const x = cr() * width, y = height * .60 + cr() * height * .2;
        rect(c, x, y, 2 + cr() * 13, 1, cr() > .5 ? '#92668f' : '#b17c9d');
      }
      // Finely tapered horizontal wisps at the bottom.
      for (let i = 0; i < 5; i++) rect(c, width * .18 + cr() * width * .30, height * .73 + i, width * .4 * (1 - i / 5), 1, '#a47399');
      return cv;
    }
    const clouds = [
      { cv: makeCloud(small ? 86 : 154, 25, 28), x: w * .22, y: h * .16, speed: .26, alpha: .80 },
      { cv: makeCloud(small ? 63 : 113, 18, 34), x: w * .77, y: h * .325, speed: -.18, alpha: .66 },
      { cv: makeCloud(small ? 95 : 177, 16, 90), x: w * .23, y: h * .345, speed: .16, alpha: .51 }
    ];
    let anchors = {};
    if (globalThis.PixelGarden) anchors = globalThis.PixelGarden.draw(gc, w, h, 1337) || {};
    const petals = Array.from({ length: small ? 19 : 32 }, () => ({
      x: rng() * w, y: rng() * h, vx: 1.7 + rng() * 2.5,
      vy: 1.6 + rng() * 2.8, phase: rng() * PI * 2, size: rng() > .72 ? 2 : 1
    }));
    const fireflies = Array.from({ length: small ? 12 : 22 }, () => ({
      x: rng() * w, y: h * (.73 + rng() * .23), phase: rng() * PI * 2, speed: .4 + rng() * .6
    }));
    function draw(c, time = 0) {
      c.imageSmoothingEnabled = false;
      c.globalAlpha = 1;
      c.drawImage(sky, 0, 0);
      for (const s of stars) {
        const brightness = .5 + .5 * Math.sin(time * s.speed + s.phase);
        c.globalAlpha = .33 + brightness * .67;
        star(c, s.x, s.y, s.size && brightness > .55 ? s.size : 0, brightness > .73 ? '#fff0cf' : '#c1a7c3');
      }
      c.globalAlpha = 1;
      // One soft, occasional comet; it never streaks through the lettering.
      const cometTime = (time + 7) % 32;
      if (cometTime < 1.6) {
        const progress = cometTime / 1.6;
        const x = w * (.43 + progress * .20), y = h * (.07 + progress * .105);
        const fade = Math.sin(progress * PI);
        for (let j = 16; j >= 0; j--) {
          c.globalAlpha = fade * (1 - j / 17) * .7;
          rect(c, x - j * 1.8, y - j * .58, j === 0 ? 2 : 1, 1, '#fff1d5');
        }
      }
      for (const cl of clouds) {
        c.globalAlpha = cl.alpha;
        const travel = Math.sin(time / 75) * 15 * cl.speed;
        c.drawImage(cl.cv, Math.round(cl.x - cl.cv.width / 2 + travel), Math.round(cl.y));
      }
      c.globalAlpha = 1;
      c.drawImage(water, 0, 0);
      c.drawImage(land, 0, 0);
      for (const p of ripples) {
        const intensity = Math.sin(time * p.speed + p.phase);
        if (intensity < -.45) continue;
        c.globalAlpha = .28 + (intensity + 1) * .22;
        rect(c, p.x + Math.sin(time * .26 + p.phase) * 3, p.y, p.width, 1, p.color);
      }
      // A narrow, broken path of moonlight across the lake.
      for (let i = 0; i < 27; i++) {
        const y = horizon + 3 + i * 2;
        if (y > h * .865) break;
        const shift = Math.sin(i * 1.91 + time * .75);
        const width = 1 + (i / 27) * 19 * (.45 + .55 * Math.sin(i * 3.74) ** 2);
        c.globalAlpha = .13 + .13 * Math.sin(i + time * .6) ** 2;
        rect(c, moon.x - width / 2 + shift * (2 + i * .1), y, width, 1, '#ffdbc3');
      }
      c.globalAlpha = 1;
      c.drawImage(garden, 0, 0);
      for (const p of petals) {
        const x = ((p.x + time * p.vx + Math.sin(time * .8 + p.phase) * 4) % (w + 12)) - 6;
        const y = ((p.y + time * p.vy) % (h + 12)) - 6;
        // Keep the title's immediate surroundings quiet.
        if (x > w * .26 && x < w * .74 && y > h * .43 && y < h * .57) continue;
        c.globalAlpha = y < h * .6 ? .52 : .75;
        rect(c, x, y, p.size, 1, '#eab3c6');
        if (p.size > 1 && Math.sin(time * 2 + p.phase) > 0) rect(c, x + 1, y - 1, 1, 1, '#bc809f');
      }
      for (const f of fireflies) {
        const glow = Math.max(0, Math.sin(time * f.speed + f.phase));
        if (glow < .28) continue;
        const x = Math.round(f.x + Math.sin(time * .4 + f.phase) * 4);
        const y = Math.round(f.y + Math.cos(time * .3 + f.phase) * 3);
        c.globalAlpha = glow * .09;
        rect(c, x - 1, y - 1, 3, 3, '#ffe0a0');
        c.globalAlpha = glow * .88;
        rect(c, x, y, 1, 1, '#f8e6ac');
      }
      c.globalAlpha = 1;
    }
    return { draw, width: w, height: h, horizon, anchors };
  }

  globalThis.PixelScene = { create };
})();
