'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createCanvas } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
for (const name of ['pixel', 'typography', 'garden', 'scene']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, name + '.js'), 'utf8'), { filename: name + '.js' });
}
for (const [name, width, height] of [['still.png', 480, 300], ['still-mobile.png', 240, 480]]) {
  const scene = PixelScene.create(width, height, createCanvas);
  const canvas = createCanvas(width, height);
  scene.draw(canvas.getContext('2d'), 0, { title: false });
  fs.writeFileSync(path.join(root, 'assets', name), canvas.toBuffer('image/png'));
  if (name === 'still.png') {
    scene.draw(canvas.getContext('2d'), 0);
    const preview = createCanvas(width * 3, height * 3);
    const context = preview.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0, preview.width, preview.height);
    fs.writeFileSync(path.join(root, 'assets', 'preview.png'), preview.toBuffer('image/png'));
  }
}
console.log('Updated desktop and portrait fallback art and the full-page preview.');
