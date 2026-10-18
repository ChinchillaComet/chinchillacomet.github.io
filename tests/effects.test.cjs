'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const test = require('node:test');
const { createCanvas } = require('@napi-rs/canvas');
const { source } = require('./helpers.cjs');

const scope = vm.createContext({});
for (const name of ['pixel.js', 'typography.js', 'ambient.js', 'art.js', 'scene.js']) {
  vm.runInContext(source(name), scope, { filename: name });
}
const { PixelAmbient: ambient, PixelScene: scenes, NativeGarden: garden } = scope;
const compositions = [[360, 225], [195, 422], [480, 204]];
const pixels = canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
const colorAt = (data, width, x, y) => {
  const at = (y * width + x) * 4;
  return `#${((data[at] << 16) | (data[at + 1] << 8) | data[at + 2]).toString(16).padStart(6, '0')}`;
};
const intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x
  && a.y < b.y + b.height && a.y + a.height > b.y;
const render = (scene, time) => {
  const canvas = createCanvas(scene.width, scene.height);
  scene.draw(canvas.getContext('2d'), time);
  return pixels(canvas);
};

// Exercise the two sources independently, including out-of-order sampling.
// Altering the petal count must not change a firefly's birth or pulse sequence.
test('fireflies and petals have independent deterministic samplers and distinct colours', () => {
  const options = { petalCount: 16, fireflyCount: 9,
    fireflyRegion: [.08, .72, .89, .94], petalSources: [[.18, .15], [.27, .20]] };
  const together = ambient.create(360, 225, options);
  const fliesOnly = ambient.create(360, 225, { ...options, petalCount: 0 });
  const petalsOnly = ambient.create(360, 225, { ...options, fireflyCount: 0 });
  for (const time of [0, 8.3, .15, 127.8, 2.4, 8.3]) {
    assert.deepEqual(together.firefliesAt(time), fliesOnly.firefliesAt(time));
    assert.deepEqual(together.petalsAt(time), petalsOnly.petalsAt(time));
    assert.deepEqual(together.particlesAt(time).fireflies, together.firefliesAt(time));
    assert.deepEqual(together.particlesAt(time).petals, together.petalsAt(time));
  }
  const flyColors = new Set([...ambient.particleColors.firefly, ...ambient.particleColors.fireflyHalo]);
  for (const color of ambient.particleColors.petal) {
    assert.ok(!flyColors.has(color), 'The hovering lights must not borrow the falling petals’ palette');
  }
});

test('each firefly retains an opaque core and a small connected glow entirely on native cells', () => {
  const width = 64, height = 48;
  const effect = ambient.create(width, height, {
    petalCount: 0, fireflyCount: 1, fireflyRegion: [.4, .4, .6, .6],
  });
  const levels = new Set();
  let foundHalo = false;
  for (let frame = 0; frame <= 96; frame++) {
    const time = frame / 12;
    const [fly] = effect.firefliesAt(time);
    assert.ok(fly);
    levels.add(fly.level);
    for (const value of [fly.x, fly.y, ...Object.values(fly.bounds)]) assert.ok(Number.isInteger(value));
    const canvas = createCanvas(width, height);
    effect.drawFireflies(canvas.getContext('2d'), time);
    const data = pixels(canvas), occupied = new Set();
    assert.equal(colorAt(data, width, fly.x, fly.y), ambient.particleColors.firefly[fly.level]);
    assert.equal(data[(fly.y * width + fly.x) * 4 + 3], 255, 'The core cannot disappear between pulses');
    for (let index = 0; index < width * height; index++) {
      const alpha = data[index * 4 + 3];
      assert.ok(alpha === 0 || alpha === 255, 'Glow cells must never be antialiased or alpha blended');
      if (!alpha) continue;
      const x = index % width, y = Math.floor(index / width);
      assert.ok(x >= fly.bounds.x && x < fly.bounds.x + fly.bounds.width
        && y >= fly.bounds.y && y < fly.bounds.y + fly.bounds.height);
      occupied.add(index);
    }
    assert.ok(fly.bounds.width <= 5 && fly.bounds.height <= 3);
    foundHalo ||= occupied.size > 1;
    const visited = new Set([fly.y * width + fly.x]), queue = [...visited];
    for (let next = 0; next < queue.length; next++) {
      const at = queue[next];
      for (const neighbor of [at - 1, at + 1, at - width, at + width]) {
        if (occupied.has(neighbor) && !visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
      }
    }
    assert.equal(visited.size, occupied.size, 'Every glow cell must connect to the visible core');
  }
  assert.deepEqual([...levels].sort(), [0, 1, 2, 3]);
  assert.ok(foundHalo, 'The fireflies need an actual glow in addition to a bright single-pixel core');
});

test('local light exclusions relocate firefly births without changing their number during motion', () => {
  const width = 80, height = 60;
  const light = { x: 23, y: 20, width: 28, height: 26 };
  // Every requested birth begins inside the light. The whole hover envelope,
  // including its glow, must be moved somewhere safe before animation begins.
  const effect = ambient.create(width, height, {
    petalCount: 0, fireflyCount: 7, fireflyRegion: [.4, .45, .6, .65], fireflyExclude: [light],
  });
  for (let frame = 0; frame <= 256; frame++) {
    const flies = effect.firefliesAt(frame / 2);
    assert.equal(flies.length, 7, 'Approaching a light cannot remove and respawn a firefly');
    for (const fly of flies) {
      assert.ok(!intersects(fly.bounds, light), 'The glow must stay clear throughout the hover');
      assert.ok(fly.bounds.x >= 0 && fly.bounds.y >= 0);
      assert.ok(fly.bounds.x + fly.bounds.width <= width && fly.bounds.y + fly.bounds.height <= height);
    }
  }
});

test('production fireflies stay beside the water plants and clear of labels, campfire, and chinchilla', () => {
  assert.equal(typeof garden.firePosition, 'function', 'The scene must expose its actual hearth position');
  for (const [width, height] of [...compositions, [160, 284], [422, 195]]) {
    const scene = scenes.create(width, height, createCanvas);
    const fire = garden.firePosition(width, height);
    const hearth = { x: fire.x - 14, y: fire.y - 29, width: 28, height: 38 };
    const heading = { x: scene.text.x - 6, y: scene.text.y - 6,
      width: scene.text.width + 12, height: scene.text.height + 12 };
    const caption = { x: scene.brand.x - 3, y: scene.brand.y - 3,
      width: scene.brand.width + 6, height: scene.brand.height + 6 };
    const expected = width <= height ? 7 : 9;
    for (let frame = 0; frame <= 512; frame++) {
      const flies = scene.firefliesAt(frame / 4);
      assert.equal(flies.length, expected);
      for (const fly of flies) {
        assert.ok(scene.waterPlants.some(plant => Math.hypot(fly.x - plant.x, fly.y - plant.y) <= 24),
          'The insect habitat must follow actual lotus and lily-pad positions at every layout');
        assert.ok(!intersects(fly.bounds, scene.chinchillaBounds), 'Glows must not paint over the seated character');
        assert.ok(!intersects(fly.bounds, hearth), 'Green insects must not be confused with orange hearth embers');
        assert.ok(!intersects(fly.bounds, heading), 'The full halo must stay out of the Welcome area');
        assert.ok(!intersects(fly.bounds, caption), 'The full halo must stay clear of the bottom caption');
        assert.ok(fly.bounds.x >= 0 && fly.bounds.y >= 0
          && fly.bounds.x + fly.bounds.width <= width && fly.bounds.y + fly.bounds.height <= height);
      }
    }
    // Check complete renders as well as geometry: another layer or glow must
    // not erase the core once the scene is composed.
    for (const time of [0, 1.9, 8.3, 9.45, 39.2, 127.5]) {
      const data = render(scene, time);
      for (const fly of scene.firefliesAt(time)) {
        assert.equal(colorAt(data, width, fly.x, fly.y), ambient.particleColors.firefly[fly.level]);
      }
    }
  }
});

test('the meteor leaves a brief deterministic afterglint only after its moving trail has departed', () => {
  for (const [width, height] of compositions) {
    const scene = scenes.create(width, height, createCanvas);
    assert.equal(scene.twinkleAt(8.3), null);
    assert.equal(scene.twinkleAt(9.12), null);
    assert.ok(scene.twinkleAt(9.3));
    assert.ok(scene.twinkleAt(9.7));
    assert.equal(scene.twinkleAt(10.2), null);
    assert.equal(scene.meteorAt(10), null);
    let visibleFrames = 0;
    for (let frame = 0; frame <= 105; frame++) {
      const time = 7 + frame / 30, glint = scene.twinkleAt(time);
      if (!glint) continue;
      visibleFrames++;
      assert.equal(scene.meteorAt(time), null, 'A twinkle must not compete with the departing trail');
      assert.deepEqual(glint, scene.twinkleAt(time), 'The afterglint must not depend on previous frames');
      assert.ok(glint.sparkles.length > 0 && glint.sparkles.length <= 3);
      const repeated = scene.twinkleAt(time + ambient.meteorDefaults.period);
      assert.deepEqual(glint.sparkles, repeated.sparkles, 'Each meteor cycle keeps the same small exit sparkle');
      for (const spark of glint.sparkles) {
        assert.ok(Number.isInteger(spark.x) && Number.isInteger(spark.y));
        assert.ok(Math.abs(spark.x - glint.x) <= 5 && Math.abs(spark.y - glint.y) <= 4);
      }
    }
    assert.ok(visibleFrames >= 15 && visibleFrames <= 30, 'The afterglint should last about half to one second');
    for (const time of [9.25, 9.4, 9.55, 9.9]) {
      const glint = scene.twinkleAt(time), data = render(scene, time);
      for (const spark of glint.sparkles) {
        const expected = spark.level === 2 ? ambient.meteorColors.head[3]
          : spark.level === 1 ? ambient.meteorColors.trail[0] : ambient.meteorColors.trail[2];
        assert.equal(colorAt(data, width, spark.x, spark.y), expected,
          'The cloud and garden composition must not conceal the exit sparkle');
      }
    }
  }
});
