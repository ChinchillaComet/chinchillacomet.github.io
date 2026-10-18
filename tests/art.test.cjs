'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const test = require('node:test');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { ROOT, source } = require('./helpers.cjs');

const scope = vm.createContext({});
for (const name of ['pixel.js', 'typography.js', 'caption.js', 'ambient.js', 'art.js', 'scene.js']) {
  vm.runInContext(source(name), scope, { filename: name });
}
const { PixelArt: art, PixelTypography: font, PixelCaption: captions, PixelScene: scenes,
  PixelAmbient: ambient, NativeClouds: clouds, NativeLandscape: landscape } = scope;
const cream = [255, 241, 216, 255];
const compositions = [[360, 225], [195, 422], [480, 204]];

function pixels(canvas) {
  return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
}
function render(scene, time = 0, options = {}) {
  const canvas = createCanvas(scene.width, scene.height);
  scene.draw(canvas.getContext('2d'), time, options);
  return pixels(canvas);
}
function assertOpaquePalette(data, label) {
  const colors = new Set();
  for (let offset = 0; offset < data.length; offset += 4) {
    assert.equal(data[offset + 3], 255, `${label}: every scene pixel must be opaque`);
    colors.add((data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2]);
  }
  assert.ok(colors.size <= 56, `${label}: ${colors.size} colors exceeds the 56-color art budget`);
}
function assertGlyphs(data, scene, mask = font, title = scene.text) {
  for (let row = 0; row < mask.height; row++) {
    for (let column = 0; column < mask.width; column++) {
      const filled = mask.rows[row][column] === '1';
      for (let y = 0; y < title.scale; y++) {
        for (let x = 0; x < title.scale; x++) {
          const offset = ((title.y + row * title.scale + y) * scene.width
            + title.x + column * title.scale + x) * 4;
          const cell = Array.from(data.subarray(offset, offset + 4));
          if (filled) assert.deepEqual(cell, cream, 'Every original glyph cell must remain exact cream');
          else assert.notDeepEqual(cell, cream, 'Letter counters and spacing must not acquire extra cream cells');
        }
      }
    }
  }
}

// Four-neighbor connectivity distinguishes an intact sprite from diagonally
// touching fragments. The same flood fill can find enclosed transparent holes.
function connectedFrom(mask, width, height, starts, value) {
  const visited = new Uint8Array(mask.length);
  const queue = [];
  for (const start of starts) {
    if (mask[start] === value && !visited[start]) { visited[start] = 1; queue.push(start); }
  }
  for (let next = 0; next < queue.length; next++) {
    const index = queue[next], x = index % width, y = Math.floor(index / width);
    for (const neighbor of [x > 0 ? index - 1 : -1, x + 1 < width ? index + 1 : -1,
      y > 0 ? index - width : -1, y + 1 < height ? index + width : -1]) {
      if (neighbor >= 0 && mask[neighbor] === value && !visited[neighbor]) {
        visited[neighbor] = 1; queue.push(neighbor);
      }
    }
  }
  return visited;
}

test('both page labels use exact original font cells and are the only visible document text', () => {
  const mask = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/welcome-mask.json'), 'utf8'));
  assert.equal(font.text, 'Welcome');
  assert.equal(font.width, mask.width);
  assert.equal(font.height, mask.height);
  assert.equal(mask.glyphs.map(glyph => glyph.character).join(''), font.text);
  assert.deepEqual(Array.from(font.rows), mask.rows);
  const binary = fs.readFileSync(path.join(ROOT, 'assets/fonts/PressStart2P-Regular.ttf'));
  assert.equal(crypto.createHash('sha256').update(binary).digest('hex'), mask.fontSha256);
  const brandMask = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/brand-mask.json'), 'utf8'));
  assert.equal(font.brand.text, 'Chinchilla Comet');
  assert.equal(brandMask.glyphs.map(glyph => glyph.character).join(''), font.brand.text);
  assert.equal(brandMask.fontSha256, mask.fontSha256);
  assert.equal(font.brand.width, brandMask.width);
  assert.equal(font.brand.height, brandMask.height);
  assert.deepEqual(Array.from(font.brand.rows), brandMask.rows);
  const body = source('index.html').split('<body>')[1].split('</body>')[0];
  assert.equal(body.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '').trim()
    .replace(/\s+/g, ' '), 'Welcome Chinchilla Comet');
  assert.match(body, /<h1 class="welcome">Welcome<\/h1>/);
  assert.match(body, /<p class="brand">Chinchilla Comet<\/p>/);
});

test('fallback PNGs decode at the native dimensions recorded by the scene', async () => {
  const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/release.json'), 'utf8'));
  for (const asset of Object.values(scenes.assets)) {
    const fallback = release.stills[asset.id];
    assert.ok(fallback, `${asset.id} must have a released fallback`);
    assert.match(fallback.path, /\.png$/);
    assert.equal(fallback.width, asset.width, `${asset.id} manifest width`);
    assert.equal(fallback.height, asset.height, `${asset.id} manifest height`);
    const image = await loadImage(path.join(ROOT, fallback.path));
    assert.equal(image.width, asset.width, `${asset.id} width`);
    assert.equal(image.height, asset.height, `${asset.id} height`);
  }
  assert.equal(scenes.variant(390, 844).id, 'portrait');
  assert.equal(scenes.variant(1440, 900).id, 'landscape');
  assert.equal(scenes.variant(2560, 1080).id, 'panorama');
});

test('responsive still and motion frames cover the display with square pixels and exact centered letters', async t => {
  const viewports = [[320, 568, 1], [320, 568, 1.5], [390, 844, 3], [768, 1024, 2],
    [1440, 900, 1], [1440, 900, 1.25], [1440, 900, 2], [1920, 1080, 1],
    [2560, 1080, 1], [844, 390, 2]];
  for (const [width, height, dpr] of viewports) await t.test(`${width}×${height}, DPR ${dpr}`, () => {
    const grid = art.layout(width, height, dpr);
    for (const key of ['w', 'h', 'scale', 'canvasWidth', 'canvasHeight', 'left', 'top',
      'physicalWidth', 'physicalHeight']) assert.ok(Number.isInteger(grid[key]), key);
    assert.ok(grid.w > 0 && grid.h > 0 && grid.scale > 0);
    assert.equal(grid.canvasWidth, grid.w * grid.scale);
    assert.equal(grid.canvasHeight, grid.h * grid.scale);
    assert.ok(grid.left <= 0 && grid.top <= 0);
    assert.ok(grid.left + grid.canvasWidth >= grid.physicalWidth);
    assert.ok(grid.top + grid.canvasHeight >= grid.physicalHeight);
    assert.ok(grid.canvasWidth - grid.physicalWidth < grid.scale);
    assert.ok(grid.canvasHeight - grid.physicalHeight < grid.scale);
    const caption = captions.create(grid.physicalWidth, grid.physicalHeight, grid.scale, createCanvas);
    const scene = scenes.create(grid.w, grid.h, createCanvas, {
      captionBounds: captions.sceneBounds(caption, grid),
    }), title = scene.text;
    assert.ok(title.x >= 1 && title.x + title.width < grid.w);
    assert.ok(title.y >= 1 && title.y + title.height < grid.h);
    assert.ok(Number.isInteger(title.scale) && title.scale > 0);
    assert.equal(title.width, font.width * title.scale);
    assert.equal(title.height, font.height * title.scale);
    assert.ok(Math.abs(title.x + title.width / 2 - grid.w / 2) <= .5);
    assert.ok(Math.abs(title.y + title.height / 2 - grid.h / 2) <= .5);
    const brand = scene.brand;
    const cell = caption.bounds.scale;
    assert.ok(Number.isInteger(cell) && cell > 0, 'Font pixels must remain whole physical squares');
    assert.equal(cell, Math.max(1, Math.floor(grid.scale / 2)), 'The signature is approximately half its previous size');
    assert.ok(brand.scale <= .5 || grid.scale === 1);
    assert.ok(brand.x >= 1 && brand.x + brand.width < grid.w);
    assert.ok(brand.y > grid.h * .85 && brand.y + brand.height <= grid.h - 8);
    assert.ok(Math.abs(caption.bounds.x + caption.bounds.width / 2 - grid.physicalWidth / 2) <= .5);
    for (const [time, options, label] of [[0, { motion: false }, 'still'], [8.3, {}, 'motion']]) {
      const data = render(scene, time, options);
      assertOpaquePalette(data, label);
      assertGlyphs(data, scene);
      const output = createCanvas(grid.canvasWidth, grid.canvasHeight), out = output.getContext('2d');
      const native = createCanvas(grid.w, grid.h);
      scene.draw(native.getContext('2d'), time, options);
      out.imageSmoothingEnabled = false;
      out.drawImage(native, 0, 0, output.width, output.height);
      out.drawImage(caption.canvas, caption.x - grid.left, caption.y - grid.top);
      assertGlyphs(pixels(output), { width: output.width }, font.brand, {
        ...caption.bounds, x: caption.bounds.x - grid.left, y: caption.bounds.y - grid.top,
      });
    }
  });
});

test('all four cloud sprites have transparent padding and one connected silhouette without cutout holes', () => {
  assert.deepEqual(Object.keys(clouds).sort(), ['puff', 'small', 'wide', 'wisp']);
  for (const [name, cloud] of Object.entries(clouds)) {
    const width = cloud.rows[0].length, height = cloud.rows.length;
    assert.ok(width > 4 && height > 4);
    assert.ok(cloud.rows.every(row => row.length === width), `${name}: rows must share one pixel grid`);
    for (const row of cloud.rows) for (const symbol of row) {
      assert.ok(Object.hasOwn(cloud.palette, symbol), `${name}: unknown palette index ${symbol}`);
    }
    const canvas = createCanvas(width, height);
    art.sprite(canvas.getContext('2d'), cloud.rows, 0, 0, cloud.palette);
    const data = pixels(canvas), mask = new Uint8Array(width * height);
    let solidCount = 0;
    for (let index = 0; index < mask.length; index++) {
      const alpha = data[index * 4 + 3];
      assert.ok(alpha === 0 || alpha === 255, `${name}: sprite edges must not be antialiased`);
      mask[index] = alpha === 255 ? 1 : 0;
      solidCount += mask[index];
      const x = index % width, y = Math.floor(index / width);
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
        assert.equal(alpha, 0, `${name}: complete artwork needs two transparent border pixels`);
      }
    }
    assert.ok(solidCount > 0);
    const body = connectedFrom(mask, width, height, [mask.indexOf(1)], 1);
    assert.equal(body.reduce((sum, value) => sum + value, 0), solidCount,
      `${name}: the cloud must form one solid connected silhouette`);
    const outside = connectedFrom(mask, width, height, [0], 0);
    for (let index = 0; index < mask.length; index++) {
      if (!mask[index]) assert.equal(outside[index], 1, `${name}: no enclosed transparent cutout`);
    }
  }
});

test('the meteor head moves down-left and its tail records earlier head positions', () => {
  for (const [width, height] of compositions) {
    const scene = scenes.create(width, height, createCanvas);
    const earlyTime = 8.05, laterTime = 8.5;
    const early = scene.meteorAt(earlyTime), later = scene.meteorAt(laterTime);
    assert.ok(early && later);
    assert.ok(later.head.x < early.head.x && later.head.y > early.head.y);
    for (const time of [earlyTime, 8.073, laterTime, 8.517]) {
      const frame = scene.meteorAt(time);
      assert.ok(frame.velocity.x < 0 && frame.velocity.y > 0);
      assert.deepEqual([frame.trail[0].x, frame.trail[0].y], [frame.head.x, frame.head.y]);
      for (const [index, point] of frame.trail.entries()) {
        assert.ok(Number.isInteger(point.x) && Number.isInteger(point.y));
        assert.ok(point.x >= frame.head.x && point.y <= frame.head.y);
        if (index > 0) {
          assert.ok(point.x >= frame.trail[index - 1].x && point.y <= frame.trail[index - 1].y,
            'Successive tail points must extend farther up-right');
        }
        const previous = scene.meteorAt(time - index * ambient.meteorDefaults.tailSeconds / (frame.trail.length - 1));
        assert.ok(previous);
        // At a half-pixel boundary, equivalent historical times can differ in
        // their final floating-point bit and round to adjacent native cells.
        assert.ok(Math.abs(point.x - previous.head.x) <= 1 && Math.abs(point.y - previous.head.y) <= 1,
          'A tail cell must match the earlier head within one native rounding cell');
      }
    }
    const repeated = scene.meteorAt(earlyTime + ambient.meteorDefaults.period);
    assert.ok(Math.abs(repeated.head.x - early.head.x) <= 1 && Math.abs(repeated.head.y - early.head.y) <= 1,
      'The next cycle must repeat the trajectory within one native rounding cell');
    assert.equal(scene.meteorAt(0), null);
    assert.equal(scene.meteorAt(10), null);
  }
});

test('reduced-motion rendering stays byte-identical regardless of elapsed time or previous animation', () => {
  for (const [width, height] of compositions) {
    const scene = scenes.create(width, height, createCanvas);
    const baseline = render(scene, 0, { motion: false });
    render(scene, 8.3);
    for (const time of [1.75, 8.3, 123.456]) {
      assert.deepEqual(render(scene, time, { motion: false }), baseline);
    }
  }
});

test('firefly cores remain visible in the initial still and throughout their pulse cycles', () => {
  for (const [width, height] of compositions) {
    const scene = scenes.create(width, height, createCanvas);
    const initial = scene.particlesAt(0).fireflies;
    assert.ok(initial.length > 0, 'The scene must include visible fireflies at startup');
    const levels = Array.from({ length: initial.length }, () => new Set());
    // Eight seconds covers the current pulse cycles. Verify that the samples
    // actually include every light level rather than only their bright phase.
    for (let frame = 0; frame <= 32; frame++) {
      const time = frame / 4;
      const fireflies = scene.particlesAt(time).fireflies;
      assert.equal(fireflies.length, initial.length, 'Fireflies must keep a visible core between pulses');
      const data = render(scene, time, frame === 0 ? { motion: false } : {});
      for (const [index, fly] of fireflies.entries()) {
        assert.ok(Number.isInteger(fly.x) && Number.isInteger(fly.y));
        assert.ok(fly.x >= 0 && fly.x < width && fly.y > scene.horizon && fly.y < height);
        assert.ok(Number.isInteger(fly.level) && fly.level >= 0 && fly.level <= 3);
        levels[index].add(fly.level);
        const color = Number.parseInt(ambient.particleColors.firefly[fly.level].slice(1), 16);
        const offset = (fly.y * width + fly.x) * 4;
        assert.deepEqual(Array.from(data.subarray(offset, offset + 4)),
          [color >>> 16, color >>> 8 & 255, color & 255, 255],
          'The firefly core must survive the complete scene composition');
      }
    }
    for (const observed of levels) assert.deepEqual([...observed].sort(), [0, 1, 2, 3]);
  }
});

test('native lake animation is deterministic and changes pixels only below its horizon', () => {
  for (const [width, height] of compositions) {
    const horizon = Math.round(height * .64), reflectionX = Math.round(width * .78);
    const canvas = createCanvas(width, height), context = canvas.getContext('2d');
    context.fillStyle = '#112233'; context.fillRect(0, 0, width, height);
    landscape.lake(context, width, height, horizon, 0, reflectionX);
    const still = pixels(canvas);
    landscape.lake(context, width, height, horizon, 1.3, reflectionX);
    const moving = pixels(canvas);
    let changed = 0;
    for (let index = 0; index < width * height; index++) {
      const offset = index * 4, row = Math.floor(index / width);
      if (row < horizon) {
        assert.deepEqual(Array.from(moving.subarray(offset, offset + 4)), [17, 34, 51, 255],
          'Lake drawing must leave the entire sky and land region untouched');
      }
      assert.equal(moving[offset + 3], 255);
      if (still[offset] !== moving[offset] || still[offset + 1] !== moving[offset + 1]
        || still[offset + 2] !== moving[offset + 2]) {
        changed++;
        assert.ok(row > horizon, 'Animation cannot move the horizon or any pixel above it');
      }
    }
    assert.ok(changed > 0, 'The lake should contain visible animated wavelets');
    landscape.lake(context, width, height, horizon, 17.6, reflectionX);
    landscape.lake(context, width, height, horizon, 1.3, reflectionX);
    assert.deepEqual(pixels(canvas), moving, 'Drawing other times cannot accumulate changes');
  }
});
