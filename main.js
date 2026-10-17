(() => {
  'use strict';
  const canvas=document.getElementById('scenery');
  const container=canvas.parentElement;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context||!globalThis.PixelScene||!globalThis.PixelTypography)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let scene,logical,grid,animation=0,resizeFrame=0,elapsed=0,lastTick=0,previousFrame=0;
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  function paint() {
    if(!scene)return;
    scene.draw(logical.getContext('2d'),elapsed);
    context.imageSmoothingEnabled=false;
    // A source pixel always becomes an exact square of whole physical display pixels.
    context.drawImage(logical,0,0,grid.canvasWidth,grid.canvasHeight);
  }
  function tick(now) {
    animation=0;
    if(document.hidden||motion.matches)return;
    if(now-previousFrame>=1000/12) {
      if(lastTick)elapsed+=Math.min((now-lastTick)/1000,.2);
      previousFrame=now;lastTick=now;paint();
    }
    animation=requestAnimationFrame(tick);
  }
  function updateMotion() {
    if(animation)cancelAnimationFrame(animation);
    animation=0;lastTick=0;previousFrame=0;
    if(motion.matches)elapsed=0;
    paint();
    if(!motion.matches&&!document.hidden)animation=requestAnimationFrame(tick);
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
    if(grid&&next.physicalWidth===grid.physicalWidth&&next.physicalHeight===grid.physicalHeight&&next.dpr===grid.dpr)return;
    grid=next;
    canvas.width=grid.canvasWidth;canvas.height=grid.canvasHeight;
    canvas.style.width=`${grid.canvasWidth/grid.dpr}px`;
    canvas.style.height=`${grid.canvasHeight/grid.dpr}px`;
    canvas.style.left=`${grid.left/grid.dpr}px`;canvas.style.top=`${grid.top/grid.dpr}px`;
    logical=makeCanvas(grid.w,grid.h);
    scene=globalThis.PixelScene.create(grid.w,grid.h,makeCanvas);
    paint();
    container.classList.add('is-ready');
  }
  function queueResize(){if(!resizeFrame)resizeFrame=requestAnimationFrame(resize);}
  window.addEventListener('resize',queueResize,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(queueResize).observe(container);
  document.addEventListener('visibilitychange',updateMotion);
  motion.addEventListener('change',updateMotion);
  watchDensity();resize();updateMotion();
})();
