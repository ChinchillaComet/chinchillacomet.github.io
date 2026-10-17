'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  dispatch(name) {
    for (const callback of [...(this.listeners.get(name) || [])]) callback({ type: name, matches: this.matches });
  }
}

// Art is tested with the native canvas renderer. This harness isolates direct
// scene initialization, frame scheduling, fallback state, and physical sizing.
function makePage({ width = 1440, height = 900, dpr = 1, reducedMotion = false,
  hidden = false, failScene = false, failDraw = false, failCopy = false,
  contextAvailable = true, sceneAvailable = true } = {}) {
  const artContext = vm.createContext({});
  vm.runInContext(source('pixel.js'), artContext, { filename: 'pixel.js' });
  vm.runInContext(source('typography.js'), artContext, { filename: 'typography.js' });
  const art = artContext.PixelArt;
  const draws = [], creations = [], copies = [];
  const faults = { scene: failScene, draw: failDraw, copy: failCopy };
  const raf = new Map(), queries = new Map(), observers = [];
  let nextId = 1;
  function makeCanvas(w = 300, h = 150) {
    const canvas = { width: w, height: h, style: {} };
    const context = {
      imageSmoothingEnabled: true,
      fillRect(...values) { assert.ok(values.every(Number.isInteger)); },
      drawImage(image, x, y, drawWidth, drawHeight) {
        if (faults.copy) throw new Error('Simulated canvas copy failure');
        assert.ok([x, y, drawWidth, drawHeight].every(Number.isInteger));
        assert.equal(this.imageSmoothingEnabled, false);
        assert.equal(drawWidth % image.width, 0);
        assert.equal(drawHeight % image.height, 0);
        assert.equal(drawWidth / image.width, drawHeight / image.height);
        copies.push({ image, x, y, width: drawWidth, height: drawHeight,
          readyBeforeCopy: container.classList.values.has('is-ready') });
      },
    };
    canvas.getContext = kind => { assert.equal(kind, '2d'); return context; };
    return canvas;
  }
  const container = {
    bounds: { width, height },
    getBoundingClientRect() { return this.bounds; },
    classList: {
      values: new Set(),
      add(value) {
        if (value === 'is-ready') assert.ok(copies.length > 0, 'Fallback must remain until a frame reaches the display canvas');
        this.values.add(value);
      },
      remove(value) { this.values.delete(value); },
    },
  };
  const canvas = makeCanvas(1, 1);
  if (!contextAvailable) canvas.getContext = () => null;
  canvas.parentElement = container;
  const document = new Events();
  document.hidden = hidden;
  document.getElementById = id => { assert.equal(id, 'scenery'); return canvas; };
  document.createElement = tag => { assert.equal(tag, 'canvas'); return makeCanvas(); };
  const window = new Events();
  window.devicePixelRatio = dpr;
  window.matchMedia = query => {
    if (!queries.has(query)) {
      const media = new Events();
      media.media = query;
      media.matches = query.includes('prefers-reduced-motion') ? reducedMotion : true;
      queries.set(query, media);
    }
    return queries.get(query);
  };
  class ResizeObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(element) { assert.equal(element, container); }
  }
  window.ResizeObserver = ResizeObserver;
  const sceneApi = {
    create(w, h, make) {
      assert.equal(arguments.length, 3, 'Scene construction must not require external image assets');
      assert.equal(typeof make, 'function');
      if (faults.scene) throw new Error('Simulated scene initialization failure');
      const id = creations.length;
      creations.push({ w, h });
      return {
        draw(target, time, options) {
          if (faults.draw) throw new Error('Simulated drawing failure');
          draws.push({ id, time, motion: options.motion });
          target.fillStyle = art.P.sky0;
          target.fillRect(0, 0, w, h);
        },
      };
    },
  };
  const context = vm.createContext({
    document, window, ResizeObserver, PixelArt: art, PixelTypography: artContext.PixelTypography,
    PixelScene: sceneAvailable ? sceneApi : undefined,
    requestAnimationFrame(callback) { const id = nextId++; raf.set(id, callback); return id; },
    cancelAnimationFrame(id) { raf.delete(id); },
  });
  vm.runInContext(source('main.js'), context, { filename: 'main.js' });
  return {
    canvas, container, document, window, draws, creations, copies, queries, raf, art,
    ready() { return container.classList.values.has('is-ready'); },
    setFault(name, active) { faults[name] = active; },
    frame(now) {
      for (const id of [...raf.keys()]) {
        if (!raf.has(id)) continue;
        const callback = raf.get(id);
        raf.delete(id);
        callback(now);
      }
    },
    resize(nextWidth, nextHeight) {
      container.bounds = { width: nextWidth, height: nextHeight };
      window.dispatch('resize');
      for (const observer of observers) observer.callback();
    },
    motion(matches) {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      media.matches = matches;
      media.dispatch('change');
    },
    visibility(isHidden) { document.hidden = isHidden; document.dispatch('visibilitychange'); },
    density(nextDpr) {
      const previous = queries.get(`(resolution: ${window.devicePixelRatio}dppx)`);
      window.devicePixelRatio = nextDpr;
      previous.matches = false;
      previous.dispatch('change');
    },
  };
}

module.exports = { ROOT, source, makePage };
