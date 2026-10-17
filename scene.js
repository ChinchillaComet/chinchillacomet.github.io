/* A small native scene: flat palette, authored sprite cells and integer marks.
 * Sky, mountains, garden and type are cached separately; water and cloud motion
 * are redrawn on the same grid. No illustration files are used by the renderer. */
(() => {
  'use strict';
  const {P,rect,sprite}=globalThis.PixelArt;
  const assets=Object.freeze({
    landscape:Object.freeze({id:'landscape',src:'./assets/still-landscape.png?v=4',width:360,height:225}),
    portrait:Object.freeze({id:'portrait',src:'./assets/still-portrait.png?v=4',width:195,height:422}),
    panorama:Object.freeze({id:'panorama',src:'./assets/still-panorama.png?v=4',width:480,height:204}),
  });
  const variant=(w,h)=>w<=h?assets.portrait:w/h>=1.9?assets.panorama:assets.landscape;
  const moonRows=[6,10,14,16,18,18,20,20,20,20,20,20,20,20,18,18,16,14,10,6];
  function create(width,height,makeCanvas) {
    const sky=makeCanvas(width,height),ridge=makeCanvas(width,height);
    const garden=makeCanvas(width,height),title=makeCanvas(width,height);
    const sc=sky.getContext('2d'),rc=ridge.getContext('2d');
    const gc=garden.getContext('2d'),tc=title.getContext('2d');
    const portrait=width<=height,horizon=Math.round(height*.64);
    const moon={x:Math.round(width*.78),y:Math.round(height*(portrait?.2:.19))};
    rect(sc,0,0,width,height,P.sky0);
    for(let y=0;y<moonRows.length;y++)rect(sc,moon.x-moonRows[y]/2,moon.y-10+y,moonRows[y],1,P.cream);
    rect(sc,moon.x+3,moon.y+4,3,1,P.moonShade);
    rect(sc,moon.x+5,moon.y,2,2,P.moonShade);
    const stars=[[.40,.07],[.54,.14],[.65,.04],[.91,.10],[.93,.28],
      [.67,.33],[.43,.29],[.57,.37]].map(([x,y],i)=>({x:Math.round(x*width),y:Math.round(y*height),phase:i*1.83}));
    for(const star of stars)rect(sc,star.x,star.y,1,1,P.star);
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
      petalCount:portrait?5:7,
      fireflyRegion:[.04,.81,.27,.96],fireflyCount:3,
      exclude:{x:text.x-6,y:text.y-6,width:text.width+12,height:text.height+12},
    });
    function draw(context,time=0,options={}) {
      const t=options.motion===false?0:Math.max(0,time);
      context.imageSmoothingEnabled=false;
      context.drawImage(sky,0,0);
      if(options.motion!==false)for(const star of stars){
        if(Math.sin(t*.5+star.phase)>.92)rect(context,star.x,star.y,1,1,P.moonShade);
      }
      if(options.motion!==false)ambient.drawMeteor(context,t);
      for(const cloud of clouds) {
        const drift=Math.round(Math.sin(t*.06+cloud.phase)*3);
        context.drawImage(cloud.bitmap,cloud.x+drift,cloud.y);
      }
      context.drawImage(ridge,0,0);
      globalThis.NativeLandscape.lake(context,width,height,horizon,t,moon.x);
      context.drawImage(garden,0,0);
      if(options.motion!==false)ambient.drawParticles(context,t);
      if(options.title!==false)context.drawImage(title,0,0);
    }
    return Object.freeze({draw,width,height,text,horizon,moon,variant:variant(width,height).id,
      meteorAt:ambient.meteorAt,sky,ridge,garden});
  }
  globalThis.PixelScene=Object.freeze({assets,variant,create});
})();
