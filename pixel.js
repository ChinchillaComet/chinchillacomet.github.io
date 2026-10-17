/* Shared pixel grid and authored colour ramps. No alpha blending or filtered shapes. */
(() => {
  'use strict';
  const P = Object.freeze({
    ink:'#161a2f', deep:'#20243a', slate:'#30364c', stone:'#41455f', midStone:'#555773',
    sky0:'#242340', sky1:'#322b50', sky2:'#433359', sky3:'#583e6b', sky4:'#72507d',
    sky5:'#936689', sky6:'#b67f9a', sky7:'#d69aa9', sky8:'#edb6b4',
    sky011:'#292645', sky012:'#2d284b', sky121:'#382e53', sky122:'#3d3056', sky231:'#4a375f', sky232:'#513a65', sky341:'#614471', sky342:'#694a77', sky451:'#7d5781', sky452:'#885f85', sky561:'#9f6e8f', sky562:'#aa7794', sky671:'#c1889f', sky672:'#cb91a4', sky781:'#dea3ad', sky782:'#e5adb0',
    cream:'#ffedcf', light:'#ffe1bd', mauve:'#694563', bark:'#493448',
    blushShade:'#804967', blushDark:'#a35b7d', blush:'#c87696', pink:'#e99aad', petal:'#f7c0c7',
    teal0:'#203b48', teal1:'#2d5157', teal2:'#416c6a', teal3:'#639084', mist:'#aaa3b2',
    water0:'#303e59', water1:'#42516c', water2:'#60627d', water3:'#83728d',
    lavender:'#bc9cad', amber:'#e9a56c', gold:'#f6cf8f'
  });
  function rect(c,x,y,w,h,color) {
    x=Math.round(x); y=Math.round(y); w=Math.round(w); h=Math.round(h);
    if(w<1||h<1) return;
    c.fillStyle=color; c.fillRect(x,y,w,h);
  }
  function polygon(c,points,color) {
    const pts=points.map(([x,y])=>[Math.round(x),Math.round(y)]);
    const low=Math.min(...pts.map(p=>p[1])), high=Math.max(...pts.map(p=>p[1]));
    for(let y=low;y<high;y++) {
      const hits=[];
      for(let i=0;i<pts.length;i++) {
        const a=pts[i],b=pts[(i+1)%pts.length],scan=y+.5;
        if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan)) hits.push(a[0]+(scan-a[1])/(b[1]-a[1])*(b[0]-a[0]));
      }
      hits.sort((a,b)=>a-b);
      for(let i=0;i+1<hits.length;i+=2) rect(c,Math.ceil(hits[i]),y,Math.ceil(hits[i+1])-Math.ceil(hits[i]),1,color);
    }
  }
  function line(c,x0,y0,x1,y1,color) {
    x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
    const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;
    let e=dx+dy;
    for(;;) {
      rect(c,x0,y0,1,1,color);
      if(x0===x1&&y0===y1)break;
      const twice=e*2;
      if(twice>=dy){e+=dy;x0+=sx;} if(twice<=dx){e+=dx;y0+=sy;}
    }
  }
  function sprite(c,rows,x,y,palette,scale=1) {
    x=Math.round(x);y=Math.round(y);
    for(let j=0;j<rows.length;j++) for(let i=0;i<rows[j].length;i++) {
      const color=palette[rows[j][i]];
      if(color)rect(c,x+i*scale,y+j*scale,scale,scale,color);
    }
  }
  function random(seed) {
    return ()=> {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  }
  function layout(width,height,dpr=1) {
    const physicalWidth=Math.max(1,Math.round(width*dpr)),physicalHeight=Math.max(1,Math.round(height*dpr));
    const target=Math.max(2,Math.min(5,Math.min(width/480,height/270)));
    const scale=Math.max(1,Math.round(target*dpr));
    const w=Math.ceil(physicalWidth/scale),h=Math.ceil(physicalHeight/scale);
    return {w,h,scale,physicalWidth,physicalHeight,canvasWidth:w*scale,canvasHeight:h*scale,
      left:Math.floor((physicalWidth-w*scale)/2),top:Math.floor((physicalHeight-h*scale)/2),dpr};
  }
  globalThis.PixelArt=Object.freeze({P,rect,polygon,line,sprite,random,layout});
})();
