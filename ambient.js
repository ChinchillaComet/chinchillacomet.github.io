/* Restrained ambient motion, snapped to the illustration's display grid. */
(() => {
  'use strict';

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const wrap = (value, span) => ((value % span) + span) % span;
  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function pixel(context, x, y, color, width = 1, height = 1) {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
  function line(context, x0, y0, x1, y1, color) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    for (;;) {
      pixel(context, x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const doubled = error * 2;
      if (doubled >= dy) { error += dy; x0 += sx; }
      if (doubled <= dx) { error += dx; y0 += sy; }
    }
  }

  const meteorDefaults = Object.freeze({
    // Screen coordinates: increasing y is down. Head travels down-left.
    start: [.80, .095], end: [.35, .25],
    period: 29, delay: 7.5, duration: 1.65, tailSeconds: .34,
  });

  /**
   * Pure geometry, independent of drawing or mutable frame state.
   * start/end are fractions of the logical image. The trail consists of the
   * head's earlier positions, so it always extends up-right behind the head.
   */
  function meteorAt(time, width, height, options = {}) {
    const config = { ...meteorDefaults, ...options };
    if (!Number.isFinite(time) || time < config.delay || width <= 0 || height <= 0) return null;
    const age = wrap(time - config.delay, config.period);
    if (age >= config.duration) return null;
    const fade = clamp(Math.min(age / .12, (config.duration - age) / .24), 0, 1);
    const level = Math.min(3, Math.floor(fade * 4));
    if (fade < .08) return null;
    const startX = config.start[0] * width, startY = config.start[1] * height;
    const vx = (config.end[0] * width - startX) / config.duration;
    const vy = (config.end[1] * height - startY) / config.duration;
    const at = lag => ({
      x: Math.round(startX + vx * Math.max(0, age - lag)),
      y: Math.round(startY + vy * Math.max(0, age - lag)),
    });
    const head = at(0);
    const trail = Array.from({ length: 9 }, (_, index) => at(index * config.tailSeconds / 8));
    return { head, trail, level, age, velocity: { x: vx, y: vy } };
  }

  const meteorColors = Object.freeze({
    head: ['#ae8fb9', '#e2bdd3', '#ffe6d8', '#fff8e7'],
    trail: ['#f7ddde', '#e8c0d7', '#d5a3cf', '#b583bd', '#936aab', '#795898'],
  });

  function drawMeteor(context, geometry, colors = meteorColors) {
    if (!geometry) return;
    const { head, trail, level } = geometry;
    const dim = 3 - level;
    // Tail first; its brightest and widest point is immediately behind the head.
    for (let index = trail.length - 1; index > 0; index--) {
      const from = trail[index], to = trail[index - 1];
      const tone = Math.min(colors.trail.length - 1,
        Math.floor((index - 1) * colors.trail.length / (trail.length - 1)) + dim);
      line(context, from.x, from.y, to.x, to.y, colors.trail[tone]);
    }
    if (level >= 2) {
      pixel(context, head.x + 1, head.y, colors.trail[0]);
      pixel(context, head.x, head.y - 1, colors.trail[0]);
    }
    pixel(context, head.x, head.y, colors.head[level]);
  }

  const particleColors = Object.freeze({
    petal: ['#bc7aaa', '#df9fc0', '#ffd1da'],
    firefly: ['#778b95', '#b8c59c', '#f3e4aa', '#fff1c5'],
  });

  /**
   * Particle sources/regions use image fractions, not CSS coordinates.
   * Tune them to the actual tree and foreground after selecting the illustration.
   * `exclude` is an optional logical-pixel rectangle around the title.
   */
  function create(width, height, options = {}) {
    const rng = random(options.seed ?? 84071);
    const sources = options.petalSources ?? [[.15, .22], [.86, .17]];
    const flyRegion = options.fireflyRegion ?? [.12, .76, .88, .94];
    const petals = Array.from({ length: options.petalCount ?? 11 }, (_, index) => {
      const source = sources[index % sources.length];
      const fall = 1.3 + rng() * 1.8;
      const life = (height * (1.05 - source[1])) / fall;
      return {
        x: (source[0] + (rng() - .5) * .10) * width,
        y: source[1] * height,
        phase: rng() * life, life, fall,
        wind: source[0] > .75 ? -.35 - rng() * .55 : .35 + rng() * .65,
        sway: rng() * Math.PI * 2,
      };
    });
    const fireflies = Array.from({ length: options.fireflyCount ?? 7 }, () => ({
      x: (flyRegion[0] + rng() * (flyRegion[2] - flyRegion[0])) * width,
      y: (flyRegion[1] + rng() * (flyRegion[3] - flyRegion[1])) * height,
      phase: rng() * 10, cycle: 7 + rng() * 5,
    }));
    const excluded = (x, y) => {
      const box = options.exclude;
      return box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    };
    function particlesAt(time) {
      const petalFrame = petals.map(petal => {
        const age = wrap(time + petal.phase, petal.life);
        const x = Math.round(petal.x + petal.wind * age + Math.sin(age * .55 + petal.sway) * 2);
        const y = Math.round(petal.y + petal.fall * age);
        return { x, y, frame: Math.floor(age * 1.3 + petal.sway) % 4 };
      }).filter(petal => petal.x >= -2 && petal.x < width + 2 && petal.y < height + 2 && !excluded(petal.x, petal.y));
      const flyFrame = fireflies.map(fly => {
        const phase = wrap(time + fly.phase, fly.cycle) / fly.cycle;
        const pulse = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 2);
        return {
          x: Math.round(fly.x + Math.sin(time * .31 + fly.phase) * 2),
          y: Math.round(fly.y + Math.sin(time * .27 + fly.phase) * 2),
          level: pulse < .08 ? -1 : Math.min(3, Math.floor(pulse * 4)),
        };
      }).filter(fly => fly.level >= 0 && !excluded(fly.x, fly.y));
      return { petals: petalFrame, fireflies: flyFrame };
    }
    function drawParticles(context, time, colors = particleColors) {
      const frame = particlesAt(time);
      for (const petal of frame.petals) {
        pixel(context, petal.x, petal.y, colors.petal[1]);
        if (petal.frame === 1 || petal.frame === 2) pixel(context, petal.x + 1, petal.y, colors.petal[2]);
        if (petal.frame === 2) pixel(context, petal.x, petal.y + 1, colors.petal[0]);
      }
      for (const fly of frame.fireflies) {
        // One quiet light, with a two-pixel glint only at the top of its pulse.
        if (fly.level === 3) pixel(context, fly.x - 1, fly.y, colors.firefly[0]);
        pixel(context, fly.x, fly.y, colors.firefly[fly.level]);
      }
    }
    return Object.freeze({
      meteorAt: time => meteorAt(time, width, height, options.meteor),
      drawMeteor: (context, time, colors) => drawMeteor(context, meteorAt(time, width, height, options.meteor), colors),
      particlesAt, drawParticles,
    });
  }

  /**
   * Pure ±1 pixel offsets for copying original lake scanlines. The bands passed
   * to drawWater must already sit wholly inside the painted water, with a margin
   * of at least two source pixels from every shoreline, rock, and reflection edge
   * that should stay fixed. The source canvas must remain immutable.
   *
   * Each band: {x, y, width, height, phase?}. Never use the output as the source.
   */
  function waterOffsetAt(time, y, phase = 0) {
    return Math.round(Math.sin(time * .8 + y * .13 + phase));
  }
  function drawWater(context, source, bands, time) {
    context.imageSmoothingEnabled = false;
    for (const band of bands) {
      const dx = waterOffsetAt(time, band.y, band.phase ?? 0);
      // The containing scene has already drawn source once this frame. Shifted
      // sampling stays inside the lake and cannot drag the shore into the water.
      context.drawImage(source, band.x + dx, band.y, band.width, band.height,
        band.x, band.y, band.width, band.height);
    }
  }

  globalThis.PixelAmbient = Object.freeze({
    create, meteorAt, drawMeteor, waterOffsetAt, drawWater,
    meteorDefaults, meteorColors, particleColors,
  });
})();
