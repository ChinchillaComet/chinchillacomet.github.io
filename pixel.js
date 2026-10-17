/* Native drawing grid. Every scene pixel occupies an integer square of physical
 * display pixels. Resizing changes the composition, never the sprite grid. */
(() => {
  'use strict';
  const P = Object.freeze({ sky0: '#655f91', ink: '#26243e', cream: '#fff1d8',
    moonShade: '#ffddcd', star: '#bca1bb' });
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
    // Start small. This is a native pixel scene, not an illustration reduced to
    // screen size. Integer physical scaling also handles fractional display DPR.
    const target = width <= height ? Math.max(1, Math.min(width / 185, height / 350))
      : Math.max(1, Math.min(width / 360, height / 225));
    const desiredScale = target * dpr;
    const scale = Math.max(1, Math.round(desiredScale));
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
