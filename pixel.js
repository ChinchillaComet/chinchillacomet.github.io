/* Shared display grid. Artwork and type are rasterized once, then enlarged by
 * a whole number of physical display pixels. There is no filtered CSS zoom. */
(() => {
  'use strict';
  const P = Object.freeze({ sky0: '#242340', ink: '#302645', cream: '#fff1db' });
  function rect(context, x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
  function sprite(context, rows, x, y, palette, scale = 1) {
    for (let row = 0; row < rows.length; row++) {
      for (let column = 0; column < rows[row].length; column++) {
        const color = palette[rows[row][column]];
        if (color) rect(context, x + column * scale, y + row * scale, scale, scale, color);
      }
    }
  }
  function layout(width, height, dpr = 1) {
    dpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
    const physicalWidth = Math.max(1, Math.round(width * dpr));
    const physicalHeight = Math.max(1, Math.round(height * dpr));
    // A phone keeps a full CSS-pixel grid, instead of the former 195 columns.
    const target = width <= height ? Math.max(1, Math.min(width / 440, height / 880))
      : Math.max(1, Math.min(width / 800, height / 500));
    const desiredScale = target * dpr;
    const scale = Math.max(1, width <= height ? Math.floor(desiredScale) : Math.round(desiredScale));
    const w = Math.ceil(physicalWidth / scale), h = Math.ceil(physicalHeight / scale);
    const canvasWidth = w * scale, canvasHeight = h * scale;
    return {
      w, h, scale, dpr, physicalWidth, physicalHeight, canvasWidth, canvasHeight,
      left: Math.floor((physicalWidth - canvasWidth) / 2),
      top: Math.floor((physicalHeight - canvasHeight) / 2),
    };
  }
  globalThis.PixelArt = Object.freeze({ P, rect, sprite, layout });
})();
