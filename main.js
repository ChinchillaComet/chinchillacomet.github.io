(() => {
  'use strict';
  const canvas = document.getElementById('scenery');
  const heading = document.querySelector('.welcome');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context || !globalThis.PixelScene) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scene, frame = 0, lastTime = 0, elapsed = 0, previousFrame = 0;
  let width = 0, height = 0;
  const makeCanvas = (w, h) => {
    const result = document.createElement('canvas');
    result.width = w; result.height = h;
    return result;
  };

  function draw() { if (scene) scene.draw(context, elapsed); }

  function animate(now) {
    frame = 0;
    if (document.hidden || motion.matches) return;
    // A small, capped frame rate is intentional: the artwork moves in pixel steps.
    if (now - previousFrame >= 1000 / 12) {
      if (lastTime) elapsed += Math.min((now - lastTime) / 1000, .2);
      lastTime = now;
      previousFrame = now;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }

  function updateMotion() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = 0; previousFrame = 0;
    if (motion.matches) elapsed = 0;
    draw();
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
  }

  function resize() {
    const bounds = canvas.parentElement.getBoundingClientRect();
    const nextWidth = Math.round(bounds.width), nextHeight = Math.round(bounds.height);
    if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
    width = nextWidth; height = nextHeight;
    const scale = Math.max(2, Math.round(Math.min(width / 480, height / 300)));
    const w = Math.ceil(width / scale), h = Math.ceil(height / scale);
    canvas.width = w; canvas.height = h;
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${h * scale}px`;
    canvas.style.left = `${Math.floor((width - w * scale) / 2)}px`;
    canvas.style.top = `${Math.floor((height - h * scale) / 2)}px`;
    const letterPixel = Math.max(2, Math.min(11, Math.floor(3 + width / 360), Math.floor(width * .8 / 57)));
    document.documentElement.style.setProperty('--letter-pixel', `${letterPixel}px`);
    // Integer placement keeps the lettering as crisp as the landscape underneath it.
    heading.style.left = `${Math.floor((width - 57 * letterPixel) / 2)}px`;
    heading.style.top = `${Math.floor((height - 15 * letterPixel) / 2)}px`;
    heading.style.transform = 'none';
    scene = globalThis.PixelScene.create(w, h, makeCanvas);
    draw();
  }

  window.addEventListener('resize', resize, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas.parentElement);
  document.addEventListener('visibilitychange', updateMotion);
  motion.addEventListener('change', updateMotion);
  resize();
  updateMotion();
})();
