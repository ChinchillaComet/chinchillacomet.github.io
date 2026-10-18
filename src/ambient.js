/* Restrained ambient motion on the same native pixel grid as the scenery. */
(() => {
  'use strict';

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const wrap = (value, span) => ((value % span) + span) % span;
  /**
   * One breeze for the whole scene. The displacement is the exact integral of
   * velocity, so a gust carries every petal instead of making sprites jump to
   * unrelated positions. Sway is suitable for a one-native-pixel branch pose.
   */
  function windAt(time) {
    const t = Number.isFinite(time) ? time : 0;
    const phase = t * .32 - 1.3;
    const gust = (Math.sin(phase) + 1) / 2;
    return {
      gust,
      sway: Math.sin(t * .38) * .7 + Math.sin(t * .13 + .8) * .3,
      velocity: .45 + gust * .9,
      displacement: .9 * t - (.45 / .32) * Math.cos(phase),
    };
  }
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
    head: ['#504563', '#ad859e', '#c0cddd', '#e8eeee'],
    trail: ['#c0cddd', '#ad859e', '#79637f', '#504563'],
  });

  function drawMeteor(context, geometry, colors = meteorColors) {
    if (!geometry) return;
    const { head, trail, level } = geometry;
    const dim = 3 - level;
    // A two-cell shoulder narrows into a one-cell taper. All tail segments are
    // historical head positions; the bright leading point is always down-left.
    // Paint the shoulder first so the hot centre line stays continuous.
    if (level >= 2) {
      for (let index = Math.min(2, trail.length - 1); index > 0; index--) {
        const from = trail[index], to = trail[index - 1];
        line(context, from.x, from.y + 1, to.x, to.y + 1,
          colors.trail[Math.min(2, 1 + dim)]);
      }
    }
    for (let index = trail.length - 1; index > 0; index--) {
      const from = trail[index], to = trail[index - 1];
      const tone = Math.min(colors.trail.length - 1,
        Math.floor((index - 1) * colors.trail.length / (trail.length - 1)) + dim);
      line(context, from.x, from.y, to.x, to.y, colors.trail[tone]);
    }
    // The head is a compact wedge, not a cross-shaped sparkle or a round glow.
    if (level >= 2) pixel(context, head.x + 1, head.y, colors.trail[0]);
    pixel(context, head.x, head.y, colors.head[level]);
  }

  const particleColors = Object.freeze({
    petal: ['#865271', '#a36c8d', '#dab5cc'],
    firefly: ['#8b7566', '#ecb779', '#fff1d8', '#fff1d8'],
  });

  /**
   * Particle sources/regions use scene fractions, not CSS coordinates.
   * Their origins follow the authored tree and foreground composition.
   * `exclude` is an optional logical-pixel rectangle around the title.
   */
  function create(width, height, options = {}) {
    const rng = random(options.seed ?? 84071);
    const sources = options.petalSources ?? [[.15, .22], [.86, .17]];
    const flyRegion = options.fireflyRegion ?? [.12, .76, .88, .94];
    const petals = Array.from({ length: options.petalCount ?? (width <= height ? 10 : 16) }, (_, index) => {
      const source = sources[index % sources.length];
      const fall = 1.7 + rng() * 1.55;
      const x = (source[0] + (rng() - .5) * .12) * width;
      const y = source[1] * height + (rng() - .5) * 5;
      const drift = .6 + rng() * .45;
      // Respawn in the canopy after reaching a screen edge. The small margin
      // admits the full fluttering sprite before it is recycled.
      const life = Math.min((height + 4 - y) / fall, (width + 4 - x) / (.9 * drift));
      return {
        x, y, life, fall, drift,
        // Stratifying ages keeps a few petals near the branches as well as
        // farther across the lake, including on the very first moving frame.
        phase: ((index + rng() * .65) / (options.petalCount ?? (width <= height ? 10 : 16))) * life,
        sway: rng() * Math.PI * 2, turn: .95 + rng() * .55,
        lift: 1.5 + rng() * 1.5,
      };
    });
    const flyLocations=[[.08,.35],[.25,.65],[.42,.1],[.60,.51],[.79,.22],
      [.95,.75],[.31,.94],[.66,.87],[.9,.05]];
    const fireflies = Array.from({ length: options.fireflyCount ?? 7 }, (_,i) => ({
      x: (flyRegion[0] + flyLocations[i%flyLocations.length][0] * (flyRegion[2] - flyRegion[0])) * width,
      y: (flyRegion[1] + flyLocations[i%flyLocations.length][1] * (flyRegion[3] - flyRegion[1])) * height,
      phase: i * 1.7, cycle: 6 + (i%3)*.7, glint: i % 4,
    }));
    const excluded = (x, y) => {
      const box = options.exclude;
      return box && x + 1 >= box.x && x - 1 <= box.x + box.width
        && y + 1 >= box.y && y - 1 <= box.y + box.height;
    };
    function particlesAt(time) {
      const wind = windAt(time);
      const petalFrame = petals.map(petal => {
        const age = wrap(time + petal.phase, petal.life);
        const travel = wind.displacement - windAt(time - age).displacement;
        const flutter = Math.sin(age * .78 + petal.sway);
        const x = Math.round(petal.x + travel * petal.drift + flutter * (1.5 + wind.gust));
        const y = Math.round(petal.y + petal.fall * age
          + Math.sin(age * .6 + petal.sway) * (1.3 + wind.gust * 1.4) - wind.gust * petal.lift);
        return { x, y, frame: wrap(Math.floor(age * petal.turn + petal.sway), 8) };
      }).filter(petal => petal.x >= -2 && petal.x < width + 2 && petal.y < height + 2 && !excluded(petal.x, petal.y));
      const flyFrame = fireflies.map(fly => {
        const phase = wrap(time + fly.phase, fly.cycle) / fly.cycle;
        const pulse = (Math.sin(phase * Math.PI * 2)+1)/2;
        return {
          x: Math.round(fly.x + Math.sin(time * .31 + fly.phase) * 2),
          y: Math.round(fly.y + Math.sin(time * .27 + fly.phase) * 2),
          level: Math.min(3, Math.floor(pulse * 4)), glint: fly.glint,
        };
      }).filter(fly => fly.level >= 0 && !excluded(fly.x, fly.y));
      return { petals: petalFrame, fireflies: flyFrame };
    }
    function drawPetals(context, time, colors = particleColors) {
      const frame = particlesAt(time);
      for (const petal of frame.petals) {
        const { x, y, frame: pose } = petal;
        pixel(context, x, y, colors.petal[pose === 4 ? 0 : 1]);
        // Eight sparse poses suggest a curled petal turning through the light.
        // Each mark occupies one native cell; no sprite is scaled or rotated.
        if (pose === 1 || pose === 2) pixel(context, x + 1, y, colors.petal[2]);
        if (pose === 2) pixel(context, x, y + 1, colors.petal[0]);
        if (pose === 3) pixel(context, x, y + 1, colors.petal[2]);
        if (pose === 5 || pose === 6) pixel(context, x - 1, y, colors.petal[2]);
        if (pose === 6) pixel(context, x, y - 1, colors.petal[0]);
        if (pose === 7) pixel(context, x, y - 1, colors.petal[2]);
      }
    }
    function drawFireflies(context,time,colors=particleColors){
      for(const fly of particlesAt(time).fireflies){
        // Three cells at the peak, one between pulses. The two dimmer rim cells
        // form a little warm cluster, avoiding oversized plus-shaped lights.
        const side = fly.glint % 2 ? 1 : -1;
        const vertical = fly.glint < 2 ? 1 : -1;
        if(fly.level>=2) pixel(context,fly.x+side,fly.y,colors.firefly[0]);
        if(fly.level===3) pixel(context,fly.x,fly.y+vertical,colors.firefly[1]);
        pixel(context,fly.x,fly.y,colors.firefly[fly.level]);
      }
    }
    function drawParticles(context,time,colors=particleColors){drawPetals(context,time,colors);drawFireflies(context,time,colors);}
    return Object.freeze({
      meteorAt: time => meteorAt(time, width, height, options.meteor),
      drawMeteor: (context, time, colors) => drawMeteor(context, meteorAt(time, width, height, options.meteor), colors),
      particlesAt, drawParticles, drawPetals, drawFireflies,
      windAt,
    });
  }

  globalThis.PixelAmbient = Object.freeze({
    create, meteorAt, drawMeteor, windAt,
    meteorDefaults, meteorColors, particleColors,
  });
})();
