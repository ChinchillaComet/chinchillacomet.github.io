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

// Art is tested with the native canvas renderer. This harness isolates image
// loading, scheduling, accessibility fallback state, and physical canvas sizing.
function makePage({ width = 1440, height = 900, dpr = 1, reducedMotion = false,
  hidden = false, decode = true, failScene = false, failDraw = false } = {}) {
  const artContext = vm.createContext({});
  vm.runInContext(source('pixel.js'), artContext, { filename: 'pixel.js' });
  vm.runInContext(source('typography.js'), artContext, { filename: 'typography.js' });
  const art = artContext.PixelArt;
  const draws = [], creations = [], copies = [], images = [];
  const raf = new Map(), queries = new Map(), observers = [];
  let nextId = 1;
  function makeCanvas(w = 300, h = 150) {
    const canvas = { width: w, height: h, style: {} };
    const context = {
      imageSmoothingEnabled: true,
      fillRect(...values) { assert.ok(values.every(Number.isInteger)); },
      drawImage(image, x, y, drawWidth, drawHeight) {
        assert.ok([x, y, drawWidth, drawHeight].every(Number.isInteger));
        assert.equal(this.imageSmoothingEnabled, false);
        assert.equal(drawWidth % image.width, 0);
        assert.equal(drawHeight % image.height, 0);
        assert.equal(drawWidth / image.width, drawHeight / image.height);
        copies.push({ image, x, y, width: drawWidth, height: drawHeight });
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
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
    },
  };
  const canvas = makeCanvas(1, 1);
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
  class Image {
    constructor() {
      this.naturalWidth = 0; this.naturalHeight = 0; this.complete = false;
      this.onload = null; this.onerror = null; this.decodeCalls = 0;
      if (decode) {
        this.decoded = new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
        this.decode = () => { this.decodeCalls++; return this.decoded; };
      }
      images.push(this);
    }
    set src(value) { this._src = value; }
    get src() { return this._src; }
    succeed() {
      this.naturalWidth = this.src.includes('portrait') ? 768 : 1536;
      this.naturalHeight = this.src.includes('portrait') ? 1365 : 1024;
      this.complete = true;
      if (decode) this.resolve();
      else this.onload?.();
    }
    fail() {
      this.complete = true;
      if (decode) this.reject(new Error('Simulated image failure'));
      else this.onerror?.();
    }
  }
  const variants = {
    landscape: { id: 'landscape', src: './assets/landscape.png', width: 1536, height: 1024 },
    portrait: { id: 'portrait', src: './assets/portrait.png', width: 768, height: 1365 },
  };
  const context = vm.createContext({
    document, window, ResizeObserver, Image, PixelArt: art, PixelTypography: artContext.PixelTypography,
    PixelScene: {
      variant(w, h) { return w < h ? variants.portrait : variants.landscape; },
      create(w, h, make, image, variant) {
        assert.equal(typeof make, 'function');
        assert.ok(image.naturalWidth > 0 && image.naturalHeight > 0, 'Scene must receive decoded pixels');
        assert.equal(image.src, variant.src);
        if (failScene) throw new Error('Simulated renderer initialization failure');
        const id = creations.length;
        creations.push({ w, h, image, variant });
        return {
          draw(target, time) {
            if (failDraw) throw new Error('Simulated drawing failure');
            draws.push({ id, time });
            target.fillStyle = art.P.sky0;
            target.fillRect(0, 0, w, h);
          },
        };
      },
    },
    requestAnimationFrame(callback) { const id = nextId++; raf.set(id, callback); return id; },
    cancelAnimationFrame(id) { raf.delete(id); },
  });
  vm.runInContext(source('main.js'), context, { filename: 'main.js' });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  function getImage(which) {
    const image = typeof which === 'number' ? images[which] : images.find(image => image.src.includes(which));
    assert.ok(image, `No requested image for ${which}`);
    return image;
  }
  return {
    canvas, container, document, window, draws, creations, copies, images, queries, raf, art,
    ready() { return container.classList.values.has('is-ready'); },
    flush,
    async resolveImage(which = 0) { getImage(which).succeed(); await flush(); },
    async rejectImage(which = 0) { getImage(which).fail(); await flush(); },
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
