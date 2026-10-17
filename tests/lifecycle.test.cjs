'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { makePage } = require('./helpers.cjs');

test('startup renders directly and hides the fallback only after the first successful display copy', () => {
  const page = makePage();
  assert.equal(page.creations.length, 1);
  assert.equal(page.draws.length, 1, 'Startup needs one complete native scene render');
  assert.equal(page.copies.length, 1);
  assert.equal(page.copies[0].readyBeforeCopy, false);
  assert.ok(page.ready());
  assert.equal(page.raf.size, 1);
  for (let i = 0; i < 10; i++) {
    page.visibility(false); page.motion(false);
    assert.equal(page.raf.size, 1, 'Repeated state notifications must not duplicate the animation loop');
  }
});

test('unavailable canvas or scene support leaves the static fallback intact', () => {
  for (const options of [{ contextAvailable: false }, { sceneAvailable: false }]) {
    const page = makePage(options);
    assert.equal(page.ready(), false);
    assert.equal(page.creations.length, 0);
    assert.equal(page.raf.size, 0);
  }
});

test('initialization, drawing, and display-copy failures preserve fallback and allow a later retry', () => {
  for (const [fault, option] of [['scene', 'failScene'], ['draw', 'failDraw'], ['copy', 'failCopy']]) {
    const page = makePage({ [option]: true });
    assert.equal(page.ready(), false);
    assert.equal(page.raf.size, 0);
    assert.equal(page.copies.length, 0);
    page.setFault(fault, false);
    page.resize(1440, 900);
    page.frame(100);
    assert.ok(page.ready(), 'A later successful resize must recover from a transient renderer failure');
    assert.equal(page.raf.size, 1);
    assert.equal(page.copies.at(-1).readyBeforeCopy, false);
  }
});

test('a runtime drawing failure restores fallback and stops the failed animation loop', () => {
  const page = makePage();
  page.frame(100);
  page.setFault('draw', true);
  page.frame(200);
  assert.equal(page.ready(), false);
  assert.equal(page.raf.size, 0);
  const count = page.draws.length;
  page.frame(300);
  assert.equal(page.draws.length, count);
  page.setFault('draw', false);
  page.resize(390, 844);
  page.frame(400);
  assert.ok(page.ready());
  assert.equal(page.raf.size, 1);
});

test('reduced motion renders a still through resize and switches safely when the preference changes', () => {
  const page = makePage({ reducedMotion: true });
  assert.ok(page.ready());
  assert.equal(page.raf.size, 0);
  assert.ok(page.draws.every(draw => draw.time === 0 && draw.motion === false));
  page.resize(390, 844);
  assert.equal(page.raf.size, 1, 'A reduced-motion resize may schedule one repaint');
  page.frame(100);
  assert.ok(page.ready());
  assert.equal(page.creations.length, 2);
  assert.equal(page.raf.size, 0);
  assert.equal(page.draws.at(-1).time, 0);
  assert.equal(page.draws.at(-1).motion, false);
  page.motion(false);
  page.frame(200);
  page.frame(300);
  assert.ok(page.draws.at(-1).time > 0);
  assert.equal(page.draws.at(-1).motion, true);
  page.motion(true);
  assert.equal(page.raf.size, 0);
  assert.equal(page.draws.at(-1).time, 0);
  assert.equal(page.draws.at(-1).motion, false);
  const count = page.draws.length;
  page.frame(400);
  assert.equal(page.draws.length, count);
});

test('hidden pages render once and resume without adding hidden time to the scene clock', () => {
  const page = makePage({ hidden: true });
  assert.ok(page.ready());
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

test('resize bursts render the latest dimensions once and preserve the running scene clock', () => {
  const page = makePage();
  page.frame(100);
  page.frame(200);
  const before = page.draws.at(-1).time;
  for (let i = 0; i < 20; i++) page.resize(i % 2 ? 390 : 1200, i % 2 ? 844 : 900);
  assert.equal(page.raf.size, 2, 'Only one resize and one animation callback may be pending');
  page.frame(210);
  assert.equal(page.creations.length, 2);
  const expected = page.art.layout(390, 844, 1);
  assert.equal(page.creations.at(-1).w, expected.w);
  assert.equal(page.creations.at(-1).h, expected.h);
  assert.equal(page.raf.size, 1);
  assert.equal(page.draws.at(-1).time, before);
  page.resize(390, 844);
  page.frame(220);
  assert.equal(page.creations.length, 2, 'Unchanged bounds must not rebuild the scene');
  page.frame(300);
  assert.ok(page.draws.at(-1).time > before);
});

test('DPR changes preserve whole physical pixels and replace the obsolete resolution listener', () => {
  const page = makePage({ width: 390, height: 844, dpr: 1, reducedMotion: true });
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
});

test('zero-sized viewports defer initialization, retain a valid existing canvas, and recover', () => {
  const page = makePage({ width: 0, height: 0, reducedMotion: true });
  assert.equal(page.creations.length, 0);
  assert.equal(page.ready(), false);
  assert.equal(page.raf.size, 0);
  page.resize(390, 844);
  page.frame(100);
  assert.ok(page.ready());
  assert.equal(page.creations.length, 1);
  const previousWidth = page.canvas.width;
  page.resize(0, 0);
  page.frame(200);
  assert.equal(page.canvas.width, previousWidth);
  assert.equal(page.creations.length, 1);
  page.resize(320, 568);
  page.frame(300);
  assert.equal(page.creations.length, 2);
  assert.equal(page.raf.size, 0);
});

test('animation renders at most 24 frames per second while advancing elapsed time', () => {
  const page = makePage();
  page.frame(100);
  const count = page.draws.length;
  for (let now = 101; now <= 141; now++) page.frame(now);
  assert.equal(page.draws.length, count);
  page.frame(142);
  assert.equal(page.draws.length, count + 1);
  assert.ok(Math.abs(page.draws.at(-1).time - .042) < 1e-9);
  assert.equal(page.raf.size, 1);
});
