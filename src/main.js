/* Native scene startup and lifecycle recovery. No reloads, asset requests, or polling. */
(() => {
  'use strict';
  let canvas,container,context,motion,scene,logical,caption,grid,densityQuery;
  let initialized=false,pageHidden=false,frozen=false;
  let animation=0,resizeFrame=0,elapsed=0,lastTick=null,previousFrame=null;
  let renderedKey='',retryBudget=1;
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const suspended=()=>pageHidden||frozen;
  const canAnimate=()=>scene&&!motion.matches&&!document.hidden&&!document.prerendering&&!suspended();

  function stopAnimation() {
    if(animation)cancelAnimationFrame(animation);
    animation=0;lastTick=null;previousFrame=null;
  }
  function cancelResize() {
    if(resizeFrame)cancelAnimationFrame(resizeFrame);
    resizeFrame=0;
  }
  function suspend() {stopAnimation();cancelResize();}
  function showFallback() {
    stopAnimation();
    scene=null;logical=null;caption=null;grid=null;renderedKey='';
    container.classList.remove('is-ready');
    // One next-frame retry can recover a transient drawing failure. Persistent
    // failures then wait for a real load, visibility, restore, or resize event.
    if(retryBudget>0&&!document.hidden&&!document.prerendering&&!suspended()) {
      retryBudget--;queueResize();
    }
  }
  function paint() {
    if(!scene)return false;
    try {
      scene.draw(logical.getContext('2d'),elapsed,{motion:!motion.matches});
      context.imageSmoothingEnabled=false;
      // A source pixel becomes an exact square of whole physical display pixels.
      context.drawImage(logical,0,0,grid.canvasWidth,grid.canvasHeight);
      context.drawImage(caption.canvas,caption.x-grid.left,caption.y-grid.top,
        caption.canvas.width,caption.canvas.height);
      retryBudget=1;
      return true;
    } catch {
      showFallback();return false;
    }
  }
  function startAnimation() {
    if(!animation&&canAnimate())animation=requestAnimationFrame(tick);
  }
  function tick(now) {
    animation=0;
    if(!canAnimate())return;
    if(previousFrame===null||now-previousFrame>=1000/24) {
      if(lastTick!==null)elapsed+=Math.min((now-lastTick)/1000,.2);
      previousFrame=now;lastTick=now;paint();
    }
    startAnimation();
  }
  function watchDensity() {
    if(densityQuery)densityQuery.removeEventListener('change',densityChanged);
    densityQuery=window.matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);
    densityQuery.addEventListener('change',densityChanged);
  }
  function densityChanged(){watchDensity();queueResize();}
  function resize() {
    resizeFrame=0;
    if(!initialized||suspended())return;
    const bounds=container.getBoundingClientRect();
    if(bounds.width<=0||bounds.height<=0)return;
    let next,key,nextLogical,nextCaption,nextScene;
    try {
      next=globalThis.PixelArt.layout(bounds.width,bounds.height,window.devicePixelRatio||1);
      key=[next.physicalWidth,next.physicalHeight,next.dpr].join('|');
      if(scene&&key===renderedKey)return;
      nextLogical=makeCanvas(next.w,next.h);
      nextCaption=globalThis.PixelCaption.create(next.physicalWidth,next.physicalHeight,next.scale,makeCanvas);
      nextScene=globalThis.PixelScene.create(next.w,next.h,makeCanvas,{
        captionBounds:globalThis.PixelCaption.sceneBounds(nextCaption,next)
      });
      canvas.width=next.canvasWidth;canvas.height=next.canvasHeight;
      canvas.style.width=`${next.canvasWidth/next.dpr}px`;
      canvas.style.height=`${next.canvasHeight/next.dpr}px`;
      canvas.style.left=`${next.left/next.dpr}px`;canvas.style.top=`${next.top/next.dpr}px`;
    } catch {
      showFallback();return;
    }
    grid=next;logical=nextLogical;caption=nextCaption;scene=nextScene;
    if(paint()) {
      renderedKey=key;
      container.classList.add('is-ready');
      startAnimation();
    }
  }
  function queueResize(){if(initialized&&!resizeFrame&&!suspended())resizeFrame=requestAnimationFrame(resize);}
  function initialize() {
    if(initialized)return true;
    if(document.readyState==='loading')return false;
    const target=document.getElementById('scenery');
    if(!target||!globalThis.PixelScene||!globalThis.PixelArt||!globalThis.PixelTypography
      ||!globalThis.PixelCaption)return false;
    let drawingContext;
    try {drawingContext=target.getContext('2d',{alpha:false});}catch{return false;}
    if(!drawingContext)return false;
    canvas=target;container=canvas.parentElement;context=drawingContext;
    motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    initialized=true;
    window.addEventListener('resize',queueResize,{passive:true});
    if('ResizeObserver'in window)new ResizeObserver(queueResize).observe(container);
    motion.addEventListener('change',recover);
    return true;
  }
  function recover() {
    // A restored page can retain old callback IDs. Reconcile both queues even
    // when its dimensions and visibility appear unchanged.
    suspend();
    if(suspended())return;
    const first=!initialized;
    if(!initialize())return;
    watchDensity();
    if(motion.matches)elapsed=0;
    if(document.hidden&&!first) {
      if(scene&&motion.matches)paint();
      return;
    }
    retryBudget=1;
    const previous=scene;
    resize();
    if(scene&&scene===previous&&paint())startAnimation();
  }

  // These hooks recover startup and browser-restored pages without depending
  // on a resize event or assuming that pageshow means the tab is visible.
  document.addEventListener('DOMContentLoaded',recover,{once:true});
  window.addEventListener('load',recover,{once:true});
  window.addEventListener('pageshow',()=>{pageHidden=false;frozen=false;recover();});
  window.addEventListener('pagehide',()=>{pageHidden=true;suspend();});
  document.addEventListener('freeze',()=>{frozen=true;suspend();});
  document.addEventListener('resume',()=>{frozen=false;recover();});
  document.addEventListener('visibilitychange',recover);
  document.addEventListener('prerenderingchange',recover);
  if(document.readyState!=='loading')recover();
})();
