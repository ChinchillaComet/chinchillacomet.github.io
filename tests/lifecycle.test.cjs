'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { makePage } = require('./helpers.cjs');

async function readyPage(options) {
  const page = makePage(options);
  await page.resolveImage();
  page.frame(0);
  assert.ok(page.ready());
  return page;
}

test('only the selected image loads; fallback stays visible until its first decoded frame', async () => {
  const page = makePage();
  assert.equal(page.images.length, 1);
  assert.match(page.images[0].src, /landscape/);
  assert.equal(page.images[0].decodeCalls, 1);
  assert.equal(page.ready(), false);
  assert.equal(page.creations.length, 0);
  assert.equal(page.raf.size, 0, 'An undecoded image must not start an empty animation loop');
  for (let i = 0; i < 20; i++) page.resize(1200 + i, 900);
  assert.equal(page.raf.size, 1);
  page.frame(100);
  assert.equal(page.images.length, 1, 'All pending resizes share one image request');
  assert.equal(page.raf.size, 0);
  await page.resolveImage();
  assert.equal(page.ready(), false, 'Decoding alone must not hide the fallback');
  assert.equal(page.raf.size, 1);
  page.frame(200);
  assert.ok(page.ready());
  assert.equal(page.creations.length, 1);
  assert.equal(page.creations[0].w, page.art.layout(1219, 900, 1).w);
  assert.equal(page.raf.size, 1);
  for (let i = 0; i < 10; i++) {
    page.visibility(false); page.motion(false);
    assert.equal(page.raf.size, 1, 'State notifications must not duplicate the animation loop');
  }
});

test('a stale orientation decode cannot replace the current scene, and both variants are cached', async () => {
  const page = makePage();
  page.resize(390, 844);
  page.frame(100);
  assert.equal(page.images.length, 2);
  await page.resolveImage('portrait');
  page.frame(200);
  assert.equal(page.creations.at(-1).variant.id, 'portrait');
  assert.ok(page.ready());
  await page.resolveImage('landscape');
  page.frame(300);
  assert.equal(page.creations.length, 1, 'A late obsolete decode must not install a stale composition');
  page.resize(1440, 900);
  page.frame(400);
  assert.equal(page.creations.length, 2);
  assert.equal(page.creations.at(-1).variant.id, 'landscape');
  page.resize(390, 844);
  page.frame(500);
  assert.equal(page.creations.at(-1).variant.id, 'portrait');
  assert.equal(page.images.length, 2, 'Previously decoded variants must not be requested again');
});

test('image completion rereads current bounds and DPR instead of installing a captured layout', async () => {
  const page = makePage();
  await page.resolveImage();
  // Simulate a layout change between decode and its queued resize callback.
  page.container.bounds = { width: 1000, height: 650 };
  page.window.devicePixelRatio = 2;
  page.frame(100);
  const expected = page.art.layout(1000, 650, 2);
  assert.equal(page.creations.length, 1);
  assert.equal(page.creations[0].w, expected.w);
  assert.equal(page.creations[0].h, expected.h);
  assert.equal(page.canvas.width, expected.canvasWidth);
  assert.equal(page.canvas.height, expected.canvasHeight);
});

test('decode and legacy image failures preserve the fallback without retries or unhandled rejections', async () => {
  for (const decode of [true, false]) {
    const page = makePage({ decode });
    await page.rejectImage();
    assert.equal(page.ready(), false);
    assert.equal(page.creations.length, 0);
    assert.equal(page.raf.size, 0);
    page.resize(1200, 800);
    page.frame(100);
    assert.equal(page.images.length, 1, 'A failed request must not be retried on every resize');
    assert.equal(page.raf.size, 0);
    page.resize(390, 844);
    page.frame(200);
    assert.equal(page.images.length, 2);
    await page.resolveImage('portrait');
    page.frame(300);
    assert.ok(page.ready(), 'A different successfully loaded composition can still recover');
  }
});

test('browsers without Image.decode can activate the scene after onload', async () => {
  const page = await readyPage({ decode: false });
  assert.equal(page.images[0].decode, undefined);
  assert.equal(page.images[0].onload, null);
  assert.equal(page.images[0].onerror, null);
  assert.equal(page.creations.length, 1);
  assert.equal(page.raf.size, 1);
});

test('renderer initialization or first-frame failure leaves the static picture and heading visible', async () => {
  for (const options of [{ failScene: true }, { failDraw: true }]) {
    const page = makePage(options);
    await page.resolveImage();
    page.frame(100);
    assert.equal(page.ready(), false);
    assert.equal(page.raf.size, 0);
    assert.equal(page.copies.length, 0);
  }
});

test('reduced motion remains a still through decode, resize, and a later preference change', async () => {
  const page = await readyPage({ reducedMotion: true });
  assert.equal(page.raf.size, 0);
  assert.ok(page.draws.every(draw => draw.time === 0));
  page.resize(390, 844);
  page.frame(100);
  assert.equal(page.ready(), false);
  assert.equal(page.raf.size, 0);
  await page.resolveImage('portrait');
  page.frame(200);
  assert.ok(page.ready());
  assert.equal(page.raf.size, 0);
  assert.equal(page.draws.at(-1).time, 0);
  page.motion(false);
  page.frame(300);
  page.frame(400);
  assert.ok(page.draws.at(-1).time > 0);
  page.motion(true);
  assert.equal(page.raf.size, 0);
  assert.equal(page.draws.at(-1).time, 0);
  const count = page.draws.length;
  page.frame(500);
  assert.equal(page.draws.length, count);
});

test('hidden pages decode without animating and resume without charging hidden time', async () => {
  const page = await readyPage({ hidden: true });
  assert.equal(page.raf.size, 0);
  assert.ok(page.draws.every(draw => draw.time === 0));
  page.visibility(false);
  page.frame(100);
  page.frame(200);
  const before = page.draws.at(-1).time;
  assert.ok(before > 0);
  page.visibility(true);
  assert.equal(page.raf.size, 0);
  const count = page.draws.length;
  page.frame(100000);
  assert.equal(page.draws.length, count);
  page.resize(1200, 800);
  page.frame(100100);
  assert.equal(page.raf.size, 0, 'A hidden resize must not restart animation');
  assert.equal(page.draws.at(-1).time, before);
  page.visibility(false);
  page.frame(100200);
  assert.equal(page.draws.at(-1).time, before, 'The first resumed frame must not jump forward');
  page.frame(100300);
  assert.ok(Math.abs(page.draws.at(-1).time - before - .1) < 1e-9);
});

test('ready resize bursts coalesce and preserve elapsed time without duplicating animation', async () => {
  const page = await readyPage();
  page.frame(100);
  page.frame(200);
  const before = page.draws.at(-1).time;
  for (let i = 0; i < 20; i++) page.resize(1200 + (i % 2), 900);
  assert.equal(page.raf.size, 2, 'Only one resize and one animation callback may be pending');
  page.frame(210);
  assert.equal(page.creations.length, 2);
  assert.equal(page.raf.size, 1);
  assert.equal(page.draws.at(-1).time, before);
  page.resize(1201, 900);
  page.frame(220);
  assert.equal(page.creations.length, 2, 'Unchanged bounds must not rebuild the scene');
  page.frame(300);
  assert.ok(page.draws.at(-1).time > before);
  assert.equal(page.images.length, 1);
});

test('DPR changes rebuild the physical grid and replace the resolution listener', async () => {
  const page = await readyPage({ width: 390, height: 844, dpr: 1, reducedMotion: true });
  for (const [index, dpr] of [1.25, 1.5, 2, 3, 1].entries()) {
    const oldDpr = page.window.devicePixelRatio;
    const oldQuery = page.queries.get(`(resolution: ${oldDpr}dppx)`);
    page.density(dpr);
    assert.equal(oldQuery.listeners.get('change').size, 0);
    const newQuery = page.queries.get(`(resolution: ${dpr}dppx)`);
    assert.equal(newQuery.listeners.get('change').size, 1);
    assert.equal(page.raf.size, 1);
    page.frame(100 + index * 100);
    assert.equal(page.raf.size, 0);
    const grid = page.art.layout(390, 844, dpr);
    assert.equal(page.canvas.width, grid.canvasWidth);
    assert.equal(page.canvas.height, grid.canvasHeight);
    assert.ok(Math.abs(Number.parseFloat(page.canvas.style.width) * dpr - page.canvas.width) < 1e-8);
    assert.ok(Math.abs(Number.parseFloat(page.canvas.style.height) * dpr - page.canvas.height) < 1e-8);
    const left = Number.parseFloat(page.canvas.style.left) * dpr;
    const top = Number.parseFloat(page.canvas.style.top) * dpr;
    assert.ok(Math.abs(left - Math.round(left)) < 1e-8);
    assert.ok(Math.abs(top - Math.round(top)) < 1e-8);
    assert.ok(Math.abs(left - grid.left) < 1e-8);
    assert.ok(Math.abs(top - grid.top) < 1e-8);
    assert.equal(page.draws.at(-1).time, 0);
  }
  assert.equal(page.creations.length, 6);
  assert.equal(page.images.length, 1);
});

test('zero-sized viewports defer loading or scene replacement and recover from cached art', async () => {
  const page = makePage({ width: 0, height: 0, reducedMotion: true });
  assert.equal(page.images.length, 0);
  assert.equal(page.raf.size, 0);
  page.resize(390, 844);
  page.frame(100);
  assert.equal(page.images.length, 1);
  page.resize(0, 0);
  page.frame(200);
  await page.resolveImage();
  page.frame(300);
  assert.equal(page.ready(), false);
  assert.equal(page.creations.length, 0);
  page.resize(390, 844);
  page.frame(400);
  assert.ok(page.ready());
  assert.equal(page.creations.length, 1);
  const previousWidth = page.canvas.width;
  page.resize(0, 0);
  page.frame(500);
  assert.equal(page.canvas.width, previousWidth);
  assert.equal(page.creations.length, 1);
  page.resize(320, 568);
  page.frame(600);
  assert.equal(page.creations.length, 2);
  assert.equal(page.images.length, 1);
  assert.equal(page.raf.size, 0);
});

test('animation renders at most 24 frames per second while keeping elapsed time', async () => {
  const page = await readyPage();
  page.frame(100);
  const count = page.draws.length;
  for (let now = 101; now <= 141; now++) page.frame(now);
  assert.equal(page.draws.length, count);
  page.frame(142);
  assert.equal(page.draws.length, count + 1);
  assert.ok(Math.abs(page.draws.at(-1).time - .042) < 1e-9);
  assert.equal(page.raf.size, 1);
});
