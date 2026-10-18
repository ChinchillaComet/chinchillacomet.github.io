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

test('responsive cloud streams move slowly leftward on whole native pixels and clear the heading', () => {
  for (const [width, height] of layouts) {
    const stream = motion.create(width, height, createCanvas);
    // Irregularly spaced samples exercise many positions and cycles without
    // assuming a particular starting x-coordinate, lane speed, or sprite size.
    for (let time = 0; time < 14400; time += 17) {
      const before = stream.cloudsAt(time), after = stream.cloudsAt(time + 30);
      assert.equal(before.length, 3, 'the peaceful sky uses three independent streams');
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
        const entered = stream.cloudsAt(boundary + 60)[lane];
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

test('fractional-time cloud renders preserve opaque palette cells without smoothing', () => {
  const palette = new Set(Object.values(sprites).flatMap(sprite =>
    Object.values(sprite.palette).filter(Boolean).map(colour => colour.toLowerCase())));
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
