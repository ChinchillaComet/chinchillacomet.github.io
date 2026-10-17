'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { makePage } = require('./helpers.cjs');

test('startup and repeated state events keep exactly one animation loop', () => {
  const page = makePage();
  assert.equal(page.creations.length, 1);
  assert.ok(page.container.classList.values.has('is-ready'));
  assert.equal(page.raf.size, 1);
  for (let i = 0; i < 12; i++) {
    page.visibility(false);
    page.motion(false);
    assert.equal(page.raf.size, 1, 'Repeated notifications must replace, not duplicate, the animation frame');
    page.frame(100 + i * 100);
    assert.equal(page.raf.size, 1);
  }
});

test('reduced motion renders a still, cancels motion and remains still through resize', () => {
  const page = makePage({ reducedMotion: true });
  assert.equal(page.raf.size, 0);
  assert.ok(page.draws.length > 0);
  assert.ok(page.draws.every(draw => draw.time === 0));
  page.resize(390, 844);
  assert.equal(page.raf.size, 1, 'A one-time resize paint may be scheduled');
  page.frame(100);
  assert.equal(page.raf.size, 0, 'Resize must not start an animation loop');
  assert.equal(page.creations.length, 2);
  assert.equal(page.draws.at(-1).time, 0);

  page.motion(false);
  assert.equal(page.raf.size, 1);
  page.frame(200);
  page.frame(300);
  assert.ok(page.draws.at(-1).time > 0);
  page.motion(true);
  assert.equal(page.raf.size, 0);
  assert.equal(page.draws.at(-1).time, 0);
  const drawCount = page.draws.length;
  page.frame(400);
  assert.equal(page.draws.length, drawCount);
});

test('hidden pages pause and resume without charging hidden time to the animation', () => {
  const hiddenAtStartup = makePage({ hidden: true });
  assert.equal(hiddenAtStartup.raf.size, 0);
  assert.ok(hiddenAtStartup.draws.every(draw => draw.time === 0));
  const page = makePage();
  page.frame(100);
  page.frame(200);
  const before = page.draws.at(-1).time;
  assert.ok(before > 0);
  page.visibility(true);
  assert.equal(page.raf.size, 0);
  const count = page.draws.length;
  page.frame(100000);
  assert.equal(page.draws.length, count);
  page.resize(844, 390);
  page.frame(100100);
  assert.equal(page.raf.size, 0, 'A hidden resize must not restart animation');
  assert.equal(page.draws.at(-1).time, before);

  page.visibility(false);
  assert.equal(page.raf.size, 1);
  page.frame(100200);
  assert.equal(page.draws.at(-1).time, before, 'The first resumed frame must not jump forward');
  page.frame(100300);
  assert.ok(Math.abs(page.draws.at(-1).time - before - 0.1) < 1e-9);
});

test('resize bursts coalesce, preserve elapsed time and keep one ongoing animation', () => {
  const page = makePage();
  page.frame(100);
  page.frame(200);
  const before = page.draws.at(-1).time;
  for (let i = 0; i < 20; i++) page.resize(600 + (i % 2), 900);
  assert.equal(page.raf.size, 2, 'Only one resize and one animation callback may be pending');
  page.frame(210);
  assert.equal(page.creations.length, 2);
  assert.equal(page.raf.size, 1);
  assert.equal(page.draws.at(-1).time, before);
  page.resize(601, 900);
  page.frame(220);
  assert.equal(page.creations.length, 2, 'Unchanged bounds must not rebuild the scene');
  page.frame(310);
  assert.ok(page.draws.at(-1).time > before);
});

test('DPR changes rebuild the physical grid and replace the resolution listener', () => {
  const page = makePage({ width: 390, height: 844, dpr: 1, reducedMotion: true });
  for (const dpr of [1.25, 1.5, 2, 3, 1]) {
    const oldDpr = page.window.devicePixelRatio;
    const oldQuery = page.queries.get(`(resolution: ${oldDpr}dppx)`);
    page.density(dpr);
    assert.equal(oldQuery.listeners.get('change').size, 0, 'The obsolete density listener must be removed');
    const newQuery = page.queries.get(`(resolution: ${dpr}dppx)`);
    assert.equal(newQuery.listeners.get('change').size, 1);
    assert.equal(page.raf.size, 1);
    page.frame(100);
    assert.equal(page.raf.size, 0);
    const grid = page.art.layout(390, 844, dpr);
    assert.equal(page.canvas.width, grid.canvasWidth);
    assert.equal(page.canvas.height, grid.canvasHeight);
    assert.ok(Math.abs(Number.parseFloat(page.canvas.style.width) * dpr - page.canvas.width) < 1e-8);
    assert.ok(Math.abs(Number.parseFloat(page.canvas.style.height) * dpr - page.canvas.height) < 1e-8);
    const physicalLeft = Number.parseFloat(page.canvas.style.left) * dpr;
    const physicalTop = Number.parseFloat(page.canvas.style.top) * dpr;
    assert.ok(Math.abs(physicalLeft - Math.round(physicalLeft)) < 1e-8, 'The canvas origin must align to a physical pixel');
    assert.ok(Math.abs(physicalTop - Math.round(physicalTop)) < 1e-8, 'The canvas origin must align to a physical pixel');
    assert.ok(Math.abs(physicalLeft - grid.left) < 1e-8);
    assert.ok(Math.abs(physicalTop - grid.top) < 1e-8);
    assert.equal(page.draws.at(-1).time, 0);
  }
  assert.equal(page.creations.length, 6);
});

test('a temporarily zero-sized viewport keeps the current scene and recovers', () => {
  const page = makePage({ reducedMotion: true });
  const previousWidth = page.canvas.width;
  page.resize(0, 0);
  page.frame(100);
  assert.equal(page.creations.length, 1);
  assert.equal(page.canvas.width, previousWidth);
  page.resize(320, 568);
  page.frame(200);
  assert.equal(page.creations.length, 2);
  assert.equal(page.raf.size, 0);
});
