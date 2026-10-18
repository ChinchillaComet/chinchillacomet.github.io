'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const test = require('node:test');
const { createCanvas } = require('@napi-rs/canvas');
const { source } = require('./helpers.cjs');

const scope = vm.createContext({});
for (const name of ['pixel.js', 'art.js']) {
  vm.runInContext(source(name), scope, { filename: name });
}
const { NativeCloudMotion: motion, NativeClouds: sprites } = scope;
const layouts = [[360, 225], [195, 422], [480, 204], [337, 156]];
const expectedNames = ['puff', 'small', 'wide', 'wisp'];
const plain = value => JSON.parse(JSON.stringify(value));

function frame(stream, time) {
  const canvas = createCanvas(stream.width, stream.height);
  stream.draw(canvas.getContext('2d'), time);
  return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
}

// Measure the authored cells rather than trusting the stream's reported box.
// This makes spacing checks sensitive to visible art added at a sprite edge.
const outlines = new Map();
function silhouette(cloud) {
  if (!outlines.has(cloud.name)) {
    const sprite = sprites[cloud.name];
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    for (let y = 0; y < sprite.rows.length; y++) {
      for (let x = 0; x < sprite.rows[y].length; x++) {
        if (!sprite.palette[sprite.rows[y][x]]) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    outlines.set(cloud.name, { left, right, top, bottom });
  }
  const { left, right, top, bottom } = outlines.get(cloud.name);
  return { left: cloud.x + left, right: cloud.x + right,
    top: cloud.y + top, bottom: cloud.y + bottom };
}

function assertLayering(stream, time) {
  const clouds = stream.cloudsAt(time);
  assert.deepEqual(Array.from(clouds, cloud => cloud.depth), [0, 1, 2],
    'the cloud frame must retain its back-to-front drawing order');
  const boxes = Array.from(clouds, cloud => ({ ...silhouette(cloud), plane: cloud.plane }));
  const near = boxes.filter(box => box.plane !== 'rear').sort((a, b) => a.left - b.left);
  assert.equal(near.length, 2);
  const gap = near[1].left - near[0].right - 1;
  assert.ok(gap >= 20,
    `${stream.width}x${stream.height} at ${time}s: nearer clouds must not catch each other (${gap}px)`);
  const rear = boxes.find(box => box.plane === 'rear');
  assert.ok(rear, 'the slower cloud must retain a separate rear plane');
  if (stream.height >= 128) for (const front of near) {
    const separation = Math.abs((rear.top + rear.bottom - front.top - front.bottom) / 2);
    assert.ok(separation >= 13,
      'an allowed overlap needs enough vertical offset to keep its two silhouettes readable');
  }
  assert.ok(Math.max(...boxes.map(box => box.left)) > Math.min(...boxes.map(box => box.right)),
    'all three clouds must never stack over the same horizontal position');
}

test('cloud variation is reproducible from the seed without depending on frame order', () => {
  for (const [width, height] of layouts) {
    const first = motion.create(width, height, createCanvas, { seed: 71 });
    const restored = motion.create(width, height, createCanvas, { seed: 71 });
    const times = [0, 19.25, 360, 1299.75, 3800, 11991, 24000.125];
    const expected = new Map(times.map(time => [time, plain(first.cloudsAt(time))]));
    // Restoring a page or seeking directly into a long session must produce
    // the same sky, without replaying all the earlier animation frames.
    for (const time of [...times].reverse()) {
      assert.deepEqual(plain(restored.cloudsAt(time)), expected.get(time),
        `${width}x${height} at ${time}s must survive an out-of-order sample`);
    }
    assert.deepEqual(frame(first, 3800), frame(restored, 3800));
    const other = motion.create(width, height, createCanvas, { seed: 207 });
    const namesAt = stream => times.slice(2).map(time =>
      Array.from(stream.cloudsAt(time), cloud => cloud.name));
    assert.notDeepEqual(namesAt(first), namesAt(other), 'the seed must vary subsequent cloud forms');
  }
});

test('responsive clouds move slowly leftward on whole native pixels and clear the heading', () => {
  for (const [width, height] of layouts) {
    const stream = motion.create(width, height, createCanvas);
    // Irregularly spaced samples exercise many positions and cycles without
    // assuming a particular starting x-coordinate, lane speed, or sprite size.
    for (let time = 0; time < 14400; time += 17) {
      const before = stream.cloudsAt(time), after = stream.cloudsAt(time + 30);
      assert.equal(before.length, 3, 'the peaceful sky uses three clouds on ordered depth planes');
      for (let index = 0; index < before.length; index++) {
        const a = before[index], b = after[index];
        for (const cloud of [a, b]) {
          for (const key of ['x', 'y', 'width', 'height']) {
            assert.ok(Number.isInteger(cloud[key]), `${key} must remain on the native grid`);
          }
          assert.ok(cloud.width > 0 && cloud.height > 0);
          assert.ok(cloud.y >= 0);
          assert.ok(cloud.y + cloud.height <= Math.floor(height * .44),
            'a cloud must stay above the space reserved for Welcome');
        }
        if (a.cycle !== b.cycle) continue;
        assert.equal(b.name, a.name, 'an in-flight cloud must keep its authored silhouette');
        assert.equal(b.y, a.y, 'an in-flight cloud must not jump between sky lanes');
        const travel = a.x - b.x;
        assert.ok(travel >= 8 && travel <= 22,
          `30 seconds should move a cloud calmly left, not reverse or rush (${travel}px)`);
      }
    }
  }
});

test('cloud speeds vary gently over time and differ between the visible layers', () => {
  const stream = motion.create(360, 225, createCanvas);
  const distances = new Map(), simultaneousDifferences = [];
  for (let time = 0; time < 3000; time += 29) {
    const before = stream.cloudsAt(time), after = stream.cloudsAt(time + 30);
    const measured = [];
    for (let index = 0; index < before.length; index++) {
      const a = before[index], b = after[index];
      if (a.cycle !== b.cycle) continue;
      const travel = a.x - b.x;
      if (!distances.has(a.id)) distances.set(a.id, []);
      distances.get(a.id).push(travel);
      measured.push(travel);
    }
    if (measured.length === before.length) {
      simultaneousDifferences.push(Math.max(...measured) - Math.min(...measured));
    }
  }
  assert.equal(distances.size, 3);
  for (const values of distances.values()) {
    assert.ok(Math.max(...values) - Math.min(...values) >= 2,
      'each cloud should visibly change speed across its gentle wind cycle');
  }
  assert.ok(simultaneousDifferences.some(difference => difference >= 3),
    'the different cloud layers must not all travel at one shared speed');
});

test('intentional rear overlaps remain staggered while nearer clouds stay apart through long sessions', () => {
  const responsive = [...layouts, [160, 284], [185, 350], [256, 144], [720, 225]];
  for (const [width, height] of responsive) for (const seed of [0, 71, 207, 0xffffffff]) {
    const stream = motion.create(width, height, createCanvas, { seed });
    // Long samples catch accumulated catch-up, while direct seeks exercise
    // variant changes without relying on earlier animation frames.
    for (let time = 0; time < 172800; time += 97.375) assertLayering(stream, time);
    for (const time of [604800.125, 31536000.75]) assertLayering(stream, time);
  }
});

test('loop replacements occur fully beyond both viewport edges and all four forms recur', () => {
  assert.deepEqual(Object.keys(sprites).sort(), expectedNames);
  for (const [width, height] of layouts) {
    const stream = motion.create(width, height, createCanvas);
    for (let lane = 0; lane < 3; lane++) {
      let current = stream.cloudsAt(0)[lane];
      const seen = new Set([current.name]);
      for (let cycle = 0; cycle < 32; cycle++) {
        const boundary = current.nextWrap;
        assert.ok(Number.isFinite(boundary) && boundary > 0);
        const before = stream.cloudsAt(boundary - 1 / 24)[lane];
        const after = stream.cloudsAt(boundary + 1 / 24)[lane];
        assert.equal(after.cycle, before.cycle + 1);
        assert.ok(before.x + before.width <= 0,
          'the outgoing sprite must be completely past the left edge before replacement');
        assert.ok(after.x >= width,
          'the incoming sprite must start completely beyond the right edge');
        assert.equal(before.visible, false);
        assert.equal(after.visible, false);
        for (const time of [boundary - 1 / 24, boundary + 1 / 24]) {
          assertLayering(stream, time);
        }
        const entered = stream.cloudsAt(boundary + after.cycleDuration / 4)[lane];
        assert.equal(entered.cycle, after.cycle);
        assert.equal(entered.name, after.name);
        assert.equal(entered.visible, true, 'the replacement must actually enter the sky');
        seen.add(entered.name);
        current = after;
      }
      assert.deepEqual([...seen].sort(), expectedNames,
        `${width}x${height} lane ${lane} must show every authored cloud variation`);
    }
  }
});

test('actual overlapping cells retain the nearer cloud colour and a quieter rear palette', () => {
  const luminance = colour => {
    const rgb = colour.match(/[a-f\d]{2}/gi).map(channel => parseInt(channel, 16));
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const symbol of ['s', 'b', 'l', 'r']) {
    assert.ok(luminance(motion.palettes.rear[symbol]) < luminance(motion.palettes.middle[symbol]));
    assert.ok(luminance(motion.palettes.middle[symbol]) < luminance(motion.palettes.front[symbol]));
  }
  const witnessed = new Set();
  for (const [width, height] of layouts) {
    const stream = motion.create(width, height, createCanvas);
    for (let time = 0; time < 21600; time += 19) {
      const clouds = stream.cloudsAt(time), rear = clouds.find(cloud => cloud.plane === 'rear');
      for (const nearer of clouds.filter(cloud => cloud.plane !== 'rear')) {
        if (witnessed.has(nearer.plane)) continue;
        const backRows = sprites[rear.name].rows, frontRows = sprites[nearer.name].rows;
        const left = Math.max(0, rear.x, nearer.x), right = Math.min(width, rear.x + rear.width, nearer.x + nearer.width);
        const top = Math.max(0, rear.y, nearer.y), bottom = Math.min(height, rear.y + rear.height, nearer.y + nearer.height);
        let rendered;
        for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
          const back = rear.palette[backRows[y - rear.y][x - rear.x]];
          const front = nearer.palette[frontRows[y - nearer.y][x - nearer.x]];
          if (!back || !front || back === front) continue;
          rendered ??= frame(stream, time);
          const expected = [...front.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16)), 255];
          const offset = (y * width + x) * 4;
          assert.deepEqual(Array.from(rendered.subarray(offset, offset + 4)), expected,
            'a nearer opaque cell must cover the rear cloud without blending or reversed drawing order');
          witnessed.add(nearer.plane);
        }
      }
      if (witnessed.size === 2) break;
    }
    if (witnessed.size === 2) break;
  }
  assert.deepEqual([...witnessed].sort(), ['front', 'middle'],
    'the rear cloud should actually pass behind both nearer cloud planes');
});

test('fractional-time cloud renders preserve opaque palette cells without smoothing', () => {
  const palette = new Set([...Object.values(sprites).map(sprite => sprite.palette),
    ...Object.values(motion.palettes)].flatMap(values =>
    Object.values(values).filter(Boolean).map(colour => colour.toLowerCase())));
  for (const [width, height] of layouts) {
    const stream = motion.create(width, height, createCanvas);
    for (const time of [0, 31.125, 721.875, 3100.33]) {
      const pixels = frame(stream, time);
      let visiblePixels = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        const alpha = pixels[offset + 3];
        assert.ok(alpha === 0 || alpha === 255,
          'moving clouds must not introduce partially covered pixels');
        if (!alpha) continue;
        visiblePixels++;
        const colour = '#' + [...pixels.subarray(offset, offset + 3)]
          .map(value => value.toString(16).padStart(2, '0')).join('');
        assert.ok(palette.has(colour), 'cloud edges must not acquire interpolated colours');
      }
      assert.ok(visiblePixels > 0, 'the sampled scene should contain a visible cloud');
    }
  }
});
