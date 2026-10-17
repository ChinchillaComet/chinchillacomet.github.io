'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');
const { ROOT, colorValue, loadArt } = require('./helpers.cjs');

const viewports = [
  [320, 568], [390, 844], [600, 900], [601, 900],
  [1440, 900], [1920, 1080], [844, 390]
];
const densities = [1, 1.25, 1.5, 2, 3];

test('the shipped lettering matches the native font mask and recorded font file', () => {
  const { font } = loadArt();
  const mask = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/welcome-mask.json'), 'utf8'));
  assert.equal(font.text, 'Welcome');
  assert.equal(mask.glyphs.map(glyph => glyph.character).join(''), font.text);
  assert.equal(font.width, mask.width);
  assert.equal(font.height, mask.height);
  assert.deepEqual(Array.from(font.rows), mask.rows);
  assert.equal(font.rows.length, font.height);
  for (const row of font.rows) {
    assert.equal(row.length, font.width, 'The glyph mask must be rectangular');
    assert.match(row, /^[01]+$/, 'The mask must contain only binary pixels');
  }
  const originalFont = fs.readFileSync(path.join(ROOT, 'assets/fonts/PressStart2P-Regular.ttf'));
  assert.equal(crypto.createHash('sha256').update(originalFont).digest('hex'), mask.fontSha256);
});

test('every cloud has a transparent perimeter, so its own sprite cannot cut off the art', () => {
  const { scenes, makeCanvas } = loadArt();
  for (const [name, cloud] of Object.entries(scenes.cloudSprites(makeCanvas))) {
    let marked = 0;
    for (let y = 0; y < cloud.height; y++) for (let x = 0; x < cloud.width; x++) {
      const pixel = cloud.pixels[y * cloud.width + x];
      if (pixel) marked++;
      if (x === 0 || y === 0 || x === cloud.width - 1 || y === cloud.height - 1) {
        assert.equal(pixel, 0, `${name} touches its own boundary at ${x},${y}`);
      }
    }
    assert.ok(marked > 0, `${name} must contain visible artwork`);
  }
});

test('fractional device density cannot halve the narrow-screen title', () => {
  const { art, scenes, makeCanvas } = loadArt();
  const titles = densities.map(dpr => {
    const grid = art.layout(320, 568, dpr);
    const title = scenes.create(grid.w, grid.h, makeCanvas).text;
    return { dpr, glyphScale: title.scale, cssWidth: title.width * grid.scale / dpr };
  });
  const baseline = titles[0];
  for (const title of titles) {
    assert.equal(title.glyphScale, baseline.glyphScale, `DPR ${title.dpr} must preserve the same native glyph enlargement`);
    // A small size adjustment is inherent to whole physical pixels. A jump to
    // half-sized lettering is not: the viewport still has room for the word.
    assert.ok(title.cssWidth / baseline.cssWidth >= 0.8 && title.cssWidth / baseline.cssWidth <= 1.25);
  }
});

test('responsive scenes keep integer square pixels, an opaque palette and a correctly centred title', async t => {
  const { art, font, scenes, makeCanvas, audit } = loadArt();
  const palette = new Set(Object.values(art.P).map(colorValue));
  const cream = colorValue(art.P.cream);
  for (const [width, height] of viewports) for (const dpr of densities) {
    await t.test(`${width}×${height} at ${dpr}× density`, () => {
      const grid = art.layout(width, height, dpr);
      for (const key of ['w', 'h', 'scale', 'physicalWidth', 'physicalHeight', 'canvasWidth', 'canvasHeight', 'left', 'top']) {
        assert.ok(Number.isFinite(grid[key]) && Number.isInteger(grid[key]), `${key} must be a finite physical-pixel integer`);
      }
      assert.ok(grid.scale >= 1 && grid.w > 0 && grid.h > 0);
      assert.equal(grid.canvasWidth / grid.w, grid.scale);
      assert.equal(grid.canvasHeight / grid.h, grid.scale);
      assert.ok(grid.left <= 0 && grid.top <= 0);
      assert.ok(grid.left + grid.canvasWidth >= grid.physicalWidth, 'No uncovered strip on the right');
      assert.ok(grid.top + grid.canvasHeight >= grid.physicalHeight, 'No uncovered strip along the bottom');
      assert.ok(Math.abs(grid.left + grid.canvasWidth / 2 - grid.physicalWidth / 2) <= 0.5);
      assert.ok(Math.abs(grid.top + grid.canvasHeight / 2 - grid.physicalHeight / 2) <= 0.5);

      const scene = scenes.create(grid.w, grid.h, makeCanvas);
      const title = scene.text;
      for (const value of [title.x, title.y, title.width, title.height, title.scale]) assert.ok(Number.isInteger(value));
      assert.ok(title.scale >= 1);
      assert.equal(title.width, font.width * title.scale);
      assert.equal(title.height, font.height * title.scale);
      assert.ok(title.x >= 1 && title.y >= 1, 'Title outline needs a safe margin');
      assert.ok(title.x + title.width + 1 <= grid.w && title.y + title.height + 2 <= grid.h, 'The complete title and shadow must fit');
      assert.ok(Math.abs(title.x + title.width / 2 - grid.w / 2) <= 0.5);
      assert.ok(Math.abs(title.y + title.height / 2 - grid.h / 2) <= 0.5);
      // Centring stays within one authored pixel after the viewport crop too.
      assert.ok(Math.abs(grid.left + (title.x + title.width / 2) * grid.scale - grid.physicalWidth / 2) <= grid.scale);
      assert.ok(Math.abs(grid.top + (title.y + title.height / 2) * grid.scale - grid.physicalHeight / 2) <= grid.scale);

      const withTitle = makeCanvas(grid.w, grid.h);
      const withoutTitle = makeCanvas(grid.w, grid.h);
      scene.draw(withTitle.getContext('2d'), 0);
      scene.draw(withoutTitle.getContext('2d'), 0, { title: false });
      const expectedLetters = new Set();
      for (let row = 0; row < font.height; row++) for (let col = 0; col < font.width; col++) {
        if (font.rows[row][col] !== '1') continue;
        for (let dy = 0; dy < title.scale; dy++) for (let dx = 0; dx < title.scale; dx++) {
          const offset = (title.y + row * title.scale + dy) * grid.w + title.x + col * title.scale + dx;
          expectedLetters.add(offset);
          assert.equal(withTitle.pixels[offset], cream, 'Every foreground glyph pixel must survive compositing');
        }
      }
      for (let offset = 0; offset < withTitle.pixels.length; offset++) {
        const pixel = withTitle.pixels[offset];
        assert.ok(palette.has(pixel), `Every frame pixel must be opaque and in the shared palette: ${pixel.toString(16)}`);
        if (pixel !== withoutTitle.pixels[offset] && pixel === cream) {
          assert.ok(expectedLetters.has(offset), 'The title must not gain stray foreground pixels');
        }
      }
      // These timestamps exercise comet, cloud drift, petals and all animation
      // phases without coupling assertions to a particular frame's composition.
      for (const time of [1.5, 9, 28.5, 75, 3700]) scene.draw(withTitle.getContext('2d'), time);
      assert.ok(audit.operations > 0 && audit.copies > 0);
    });
  }
});
