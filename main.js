(() => {
  'use strict';
  const canvas=document.getElementById('scenery');
  if(!canvas)return;
  const container=canvas.parentElement;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context||!globalThis.PixelScene||!globalThis.PixelArt||!globalThis.PixelTypography)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let scene,logical,grid,animation=0,resizeFrame=0,elapsed=0,lastTick=null,previousFrame=null;
  let renderedKey='';
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

  function stopAnimation() {
    if(animation)cancelAnimationFrame(animation);
    animation=0;lastTick=null;previousFrame=null;
  }
  function showFallback() {
    stopAnimation();
    scene=null;logical=null;grid=null;renderedKey='';
    container.classList.remove('is-ready');
  }
  function paint() {
    if(!scene)return false;
    try {
      scene.draw(logical.getContext('2d'),elapsed,{motion:!motion.matches});
      context.imageSmoothingEnabled=false;
      // A source pixel becomes an exact square of whole physical display pixels.
      context.drawImage(logical,0,0,grid.canvasWidth,grid.canvasHeight);
      return true;
    } catch {
      showFallback();return false;
    }
  }
  function startAnimation() {
    if(scene&&!animation&&!motion.matches&&!document.hidden)animation=requestAnimationFrame(tick);
  }
  function tick(now) {
    animation=0;
    if(!scene||document.hidden||motion.matches)return;
    if(previousFrame===null||now-previousFrame>=1000/24) {
      if(lastTick!==null)elapsed+=Math.min((now-lastTick)/1000,.2);
      previousFrame=now;lastTick=now;paint();
    }
    startAnimation();
  }
  function updateMotion() {
    stopAnimation();
    if(motion.matches)elapsed=0;
    paint();
    startAnimation();
  }
  let densityQuery;
  function watchDensity() {
    if(densityQuery)densityQuery.removeEventListener('change',densityChanged);
    densityQuery=window.matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);
    densityQuery.addEventListener('change',densityChanged);
  }
  function densityChanged(){watchDensity();queueResize();}
  function resize() {
    resizeFrame=0;
    const bounds=container.getBoundingClientRect();
    if(bounds.width<=0||bounds.height<=0)return;
    const next=globalThis.PixelArt.layout(bounds.width,bounds.height,window.devicePixelRatio||1);
    const key=[next.physicalWidth,next.physicalHeight,next.dpr].join('|');
    if(scene&&key===renderedKey)return;
    let nextLogical,nextScene;
    try {
      nextLogical=makeCanvas(next.w,next.h);
      nextScene=globalThis.PixelScene.create(next.w,next.h,makeCanvas);
    } catch {
      showFallback();return;
    }
    grid=next;
    canvas.width=grid.canvasWidth;canvas.height=grid.canvasHeight;
    canvas.style.width=`${grid.canvasWidth/grid.dpr}px`;
    canvas.style.height=`${grid.canvasHeight/grid.dpr}px`;
    canvas.style.left=`${grid.left/grid.dpr}px`;canvas.style.top=`${grid.top/grid.dpr}px`;
    logical=nextLogical;scene=nextScene;
    if(paint()) {
      renderedKey=key;
      container.classList.add('is-ready');
      startAnimation();
    }
  }
  function queueResize(){if(!resizeFrame)resizeFrame=requestAnimationFrame(resize);}
  window.addEventListener('resize',queueResize,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(queueResize).observe(container);
  document.addEventListener('visibilitychange',updateMotion);
  motion.addEventListener('change',updateMotion);
  watchDensity();resize();
})();
