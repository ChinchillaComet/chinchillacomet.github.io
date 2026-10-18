/* A small native scene: flat palette, authored sprite cells and integer marks.
 * Sky, mountains, garden and type are cached separately; water and cloud motion
 * are redrawn on the same grid. No illustration files are used by the renderer. */
(() => {
  'use strict';
  const {P,rect,sprite}=globalThis.PixelArt;
  const assets=Object.freeze({
    landscape:Object.freeze({id:'landscape',width:360,height:225}),
    portrait:Object.freeze({id:'portrait',width:195,height:422}),
    panorama:Object.freeze({id:'panorama',width:480,height:204}),
  });
  const variant=(w,h)=>w<=h?assets.portrait:w/h>=1.9?assets.panorama:assets.landscape;
  function create(width,height,makeCanvas) {
    const sky=makeCanvas(width,height),ridge=makeCanvas(width,height);
    const garden=makeCanvas(width,height),title=makeCanvas(width,height);
    const sc=sky.getContext('2d'),rc=ridge.getContext('2d');
    const gc=garden.getContext('2d'),tc=title.getContext('2d');
    const portrait=width<=height,horizon=Math.round(height*.64);
    const moon={x:Math.round(width*.78),y:Math.round(height*(portrait?.2:.19))};
    const stars=globalThis.NativeSky.draw(sc,width,height,moon,horizon);
    globalThis.NativeLandscape.mountain(rc,width,horizon);
    globalThis.NativeGarden.tree(gc,width,height);
    globalThis.NativeGarden.foreground(gc,width,height);
    const clouds=[
      {sprite:globalThis.NativeClouds.wide,x:Math.round(width*(portrait?.36:.39)),y:Math.round(height*.25),phase:0},
      {sprite:globalThis.NativeClouds.small,x:width-25,y:Math.round(height*.35),phase:1.4},
      {sprite:globalThis.NativeClouds.small,x:-18,y:Math.round(height*.4),phase:2.8},
    ].map(cloud=>{
      const bitmap=makeCanvas(cloud.sprite.rows[0].length,cloud.sprite.rows.length);
      sprite(bitmap.getContext('2d'),cloud.sprite.rows,0,0,cloud.sprite.palette);
      return {...cloud,bitmap};
    });
    const font=globalThis.PixelTypography;
    const scale=Math.max(1,Math.min(2,Math.floor((width-24)/font.width)));
    const text={x:Math.floor((width-font.width*scale)/2),y:Math.floor((height-font.height*scale)/2),
      width:font.width*scale,height:font.height*scale,scale};
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[1,2]])sprite(tc,font.rows,text.x+dx,text.y+dy,{'1':P.ink},scale);
    sprite(tc,font.rows,text.x,text.y,{'1':P.cream},scale);
    const ambient=globalThis.PixelAmbient.create(width,height,{
      meteor:{start:[.88,.06],end:[portrait?.47:.52,portrait?.28:.30]},
      petalSources:portrait?[[.31,.12],[.45,.16]]:[[.20,.11],[.30,.15]],
      petalCount:portrait?12:16,
      fireflyRegion:portrait?[.10,.76,.66,.94]:[.07,.79,.43,.94],fireflyCount:portrait?7:9,
      exclude:{x:text.x-6,y:text.y-6,width:text.width+12,height:text.height+12},
    });
    function draw(context,time=0,options={}) {
      const t=options.motion===false?0:Math.max(0,time);
      context.imageSmoothingEnabled=false;
      context.drawImage(sky,0,0);
      if(options.motion!==false)for(const star of stars){
        if(Math.sin(t*.5+star.phase)>.92)rect(context,star.x,star.y,1,1,globalThis.NativeSky.palette.light);
      }
      if(options.motion!==false)ambient.drawMeteor(context,t);
      for(const cloud of clouds) {
        const wind=globalThis.PixelAmbient.windAt(t);
        const drift=Math.round(Math.sin(t*.06+cloud.phase)*3+wind.sway);
        context.drawImage(cloud.bitmap,cloud.x+drift,cloud.y);
      }
      context.drawImage(ridge,0,0);
      globalThis.NativeLandscape.lake(context,width,height,horizon,t,moon.x);
      context.drawImage(garden,0,0);
      globalThis.NativeGarden.wind?.(context,width,height,t);
      globalThis.NativeLighting?.draw(context,width,height,t);
      if(options.motion!==false)ambient.drawPetals(context,t);
      ambient.drawFireflies(context,t);
      if(options.title!==false)context.drawImage(title,0,0);
    }
    return Object.freeze({draw,width,height,text,horizon,moon,variant:variant(width,height).id,
      meteorAt:ambient.meteorAt,particlesAt:ambient.particlesAt,sky,ridge,garden});
  }
  globalThis.PixelScene=Object.freeze({assets,variant,create});
})();
