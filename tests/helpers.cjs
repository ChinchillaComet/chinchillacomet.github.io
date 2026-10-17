'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const colorValue = value => (0xff000000 | Number.parseInt(value.slice(1), 16)) >>> 0;

// A deliberately small opaque raster, sufficient for the production renderer's
// rectangles, exact pixel masks and unfiltered image copies. Invalid operations fail where
// they happen, rather than being silently rounded by the browser.
function makeRasterFactory({ rasterize = true } = {}) {
  const audit = { palette: null, operations: 0, copies: 0 };
  class Canvas {
    constructor(width = 300, height = 150) {
      this._width = width;
      this._height = height;
      this.style = {};
      this.context = new Context(this);
      this.reset();
    }
    reset() { this.pixels = rasterize ? new Uint32Array(this._width * this._height) : null; }
    get width() { return this._width; }
    set width(value) { this._width = value; this.reset(); }
    get height() { return this._height; }
    set height(value) { this._height = value; this.reset(); }
    getContext(kind) { assert.equal(kind, '2d'); return this.context; }
  }
  function integers(values, operation) {
    for (const value of values) {
      assert.ok(Number.isFinite(value) && Number.isInteger(value), `${operation}: expected a finite integer, received ${value}`);
    }
  }
  class Context {
    constructor(canvas) {
      this.canvas = canvas;
      this.fillStyle = '#000000';
      this.globalAlpha = 1;
      this.imageSmoothingEnabled = true;
    }
    fillRect(x, y, width, height) {
      integers([x, y, width, height], 'fillRect');
      assert.equal(this.globalAlpha, 1, 'Pixels must be opaque; alpha would create unplanned colours');
      assert.match(this.fillStyle, /^#[0-9a-f]{6}$/i, 'Fill colours must be explicit opaque RGB values');
      if (audit.palette) assert.ok(audit.palette.has(this.fillStyle.toLowerCase()), `Unexpected colour ${this.fillStyle}`);
      audit.operations++;
      if (!rasterize) return;
      const left = Math.max(0, Math.min(x, x + width));
      const right = Math.min(this.canvas.width, Math.max(x, x + width));
      const top = Math.max(0, Math.min(y, y + height));
      const bottom = Math.min(this.canvas.height, Math.max(y, y + height));
      if (right <= left || bottom <= top) return;
      const color = colorValue(this.fillStyle);
      for (let row = top; row < bottom; row++) this.canvas.pixels.fill(color, row * this.canvas.width + left, row * this.canvas.width + right);
    }
    getImageData(x, y, width, height) {
      integers([x, y, width, height], 'getImageData');
      assert.ok(width > 0 && height > 0);
      const data = new Uint8ClampedArray(width * height * 4);
      for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
        const sourceX = x + col, sourceY = y + row;
        if (sourceX < 0 || sourceY < 0 || sourceX >= this.canvas.width || sourceY >= this.canvas.height) continue;
        const pixel = this.canvas.pixels[sourceY * this.canvas.width + sourceX];
        const offset = (row * width + col) * 4;
        data[offset] = pixel >>> 16 & 255;
        data[offset + 1] = pixel >>> 8 & 255;
        data[offset + 2] = pixel & 255;
        data[offset + 3] = pixel >>> 24;
      }
      return { data, width, height };
    }
    putImageData(image, x, y, dirtyX = 0, dirtyY = 0, dirtyWidth = image.width, dirtyHeight = image.height) {
      integers([x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight], 'putImageData');
      audit.operations++;
      const top = Math.max(0, dirtyY), bottom = Math.min(image.height, dirtyY + dirtyHeight);
      const left = Math.max(0, dirtyX), right = Math.min(image.width, dirtyX + dirtyWidth);
      for (let row = top; row < bottom; row++) for (let col = left; col < right; col++) {
        const destinationX = x + col, destinationY = y + row;
        if (destinationX < 0 || destinationY < 0 || destinationX >= this.canvas.width || destinationY >= this.canvas.height) continue;
        const offset = (row * image.width + col) * 4;
        const [red, green, blue, alpha] = image.data.subarray(offset, offset + 4);
        assert.ok(alpha === 0 || alpha === 255, 'Restored masks must have binary transparency');
        const pixel = ((alpha << 24) | (red << 16) | (green << 8) | blue) >>> 0;
        if (alpha && audit.palette) {
          const rgb = `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0')}`;
          assert.ok(audit.palette.has(rgb), `Restored mask contains an unexpected colour ${rgb}`);
        }
        if (rasterize) this.canvas.pixels[destinationY * this.canvas.width + destinationX] = alpha ? pixel : 0;
      }
    }
    drawImage(image, ...args) {
      integers(args, 'drawImage');
      assert.equal(this.globalAlpha, 1, 'Image copies must not blend palette colours');
      assert.equal(this.imageSmoothingEnabled, false, 'Image copies must disable interpolation');
      assert.ok(args.length === 2 || args.length === 4, 'This renderer uses full sprites only');
      const [x, y, width = image.width, height = image.height] = args;
      assert.ok(width > 0 && height > 0, 'Image copies must have positive dimensions');
      assert.equal(width % image.width, 0, 'Horizontal scale must be a whole number');
      assert.equal(height % image.height, 0, 'Vertical scale must be a whole number');
      assert.equal(width / image.width, height / image.height, 'A source pixel must remain square');
      audit.copies++;
      if (!rasterize) return;
      const scale = width / image.width;
      const left = Math.max(0, x), right = Math.min(this.canvas.width, x + width);
      const top = Math.max(0, y), bottom = Math.min(this.canvas.height, y + height);
      for (let row = top; row < bottom; row++) {
        const sourceRow = Math.floor((row - y) / scale) * image.width;
        for (let col = left; col < right; col++) {
          const color = image.pixels[sourceRow + Math.floor((col - x) / scale)];
          if (color) this.canvas.pixels[row * this.canvas.width + col] = color;
        }
      }
    }
  }
  return { makeCanvas: (w, h) => new Canvas(w, h), audit };
}

function loadArt(factory = makeRasterFactory()) {
  const context = vm.createContext({});
  for (const name of ['pixel.js', 'typography.js', 'garden.js', 'scene.js']) vm.runInContext(source(name), context, { filename: name });
  factory.audit.palette = new Set(Object.values(context.PixelArt.P).map(value => value.toLowerCase()));
  return { ...factory, context, art: context.PixelArt, font: context.PixelTypography, scenes: context.PixelScene };
}

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  dispatch(name) { for (const callback of [...(this.listeners.get(name) || [])]) callback({ type: name, matches: this.matches }); }
}

// The scene is replaced only in lifecycle tests: their contract is scheduling,
// elapsed time and grid changes, rather than the artwork tested independently.
function makePage({ width = 1440, height = 900, dpr = 1, reducedMotion = false, hidden = false } = {}) {
  const factory = makeRasterFactory({ rasterize: false });
  const art = loadArt(factory);
  const draws = [], creations = [], raf = new Map(), queries = new Map(), observers = [];
  let nextId = 1;
  const container = {
    bounds: { width, height },
    getBoundingClientRect() { return this.bounds; },
    classList: { values: new Set(), add(value) { this.values.add(value); } }
  };
  const canvas = factory.makeCanvas(1, 1);
  canvas.parentElement = container;
  const document = new Events();
  document.hidden = hidden;
  document.getElementById = id => { assert.equal(id, 'scenery'); return canvas; };
  document.createElement = tag => { assert.equal(tag, 'canvas'); return factory.makeCanvas(300, 150); };
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
  const context = vm.createContext({
    document, window, ResizeObserver, PixelArt: art.art, PixelTypography: art.font,
    PixelScene: {
      create(w, h) {
        const id = creations.length;
        creations.push({ w, h });
        return {
          draw(target, time) {
            draws.push({ id, time });
            target.fillStyle = art.art.P.sky0;
            target.fillRect(0, 0, w, h);
          }
        };
      }
    },
    requestAnimationFrame(callback) { const id = nextId++; raf.set(id, callback); return id; },
    cancelAnimationFrame(id) { raf.delete(id); }
  });
  vm.runInContext(source('main.js'), context, { filename: 'main.js' });
  return {
    canvas, container, document, window, draws, creations, queries, raf, art: art.art,
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
    }
  };
}

module.exports = { ROOT, source, colorValue, makeRasterFactory, loadArt, makePage };
