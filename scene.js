/* Moon garden: designed silhouettes, connected colour clusters, discrete animation. */
(() => {
  'use strict';
  const {P,rect,polygon,line,sprite,random}=globalThis.PixelArt;

  // Complete masks with transparent padding: cloud marks cannot hit their own bounds.
  function cloudSprites(makeCanvas) {
    const wide=makeCanvas(164,42),c=wide.getContext('2d');
    polygon(c,[[5,27],[10,27],[10,24],[18,24],[18,20],[26,20],[26,15],[33,15],[33,10],[40,10],[40,7],[51,7],[51,5],[61,5],[61,7],[67,7],[67,11],[72,11],[72,15],[79,15],[79,13],[86,13],[86,10],[95,10],[95,12],[104,12],[104,16],[110,16],[110,19],[120,19],[120,22],[127,22],[127,25],[137,25],[137,28],[147,28],[147,30],[157,30],[157,32],[148,32],[148,34],[125,34],[125,36],[97,36],[97,35],[68,35],[68,37],[36,37],[36,35],[18,35],[18,32],[5,32]],P.sky4);
    polygon(c,[[11,27],[19,27],[19,23],[27,23],[27,18],[35,18],[35,12],[42,12],[42,9],[52,9],[52,7],[60,7],[60,9],[65,9],[65,13],[70,13],[70,17],[79,17],[79,16],[86,16],[86,13],[95,13],[95,15],[103,15],[103,19],[112,19],[112,22],[122,22],[122,25],[135,25],[135,29],[147,29],[147,31],[110,31],[110,29],[92,29],[92,31],[67,31],[67,29],[43,29],[43,31],[22,31],[22,29],[11,29]],P.sky6);
    polygon(c,[[26,22],[29,18],[37,18],[37,13],[44,13],[44,10],[53,10],[53,8],[59,8],[59,10],[64,10],[64,14],[68,14],[68,17],[60,17],[60,15],[48,15],[48,18],[40,18],[40,22]],P.sky8);
    polygon(c,[[78,21],[84,21],[84,18],[90,18],[90,15],[95,15],[95,17],[102,17],[102,20],[107,20],[107,22],[96,22],[96,20],[87,20],[87,23],[78,23]],P.sky7);
    rect(c,48,23,20,2,P.sky7);rect(c,55,25,21,1,P.sky7);
    rect(c,113,27,16,1,P.sky7);rect(c,31,33,22,1,P.sky5);rect(c,93,33,22,1,P.sky5);
    const thin=makeCanvas(116,25),t=thin.getContext('2d');
    polygon(t,[[4,16],[12,16],[12,13],[24,13],[24,10],[36,10],[36,7],[47,7],[47,5],[57,5],[57,7],[68,7],[68,10],[81,10],[81,13],[92,13],[92,16],[105,16],[105,18],[112,18],[112,20],[91,20],[91,22],[53,22],[53,21],[24,21],[24,19],[4,19]],P.sky5);
    polygon(t,[[13,15],[25,15],[25,12],[37,12],[37,9],[48,9],[48,7],[56,7],[56,9],[66,9],[66,12],[80,12],[80,15],[92,15],[92,17],[75,17],[75,16],[60,16],[60,14],[40,14],[40,16],[13,16]],P.sky7);
    rect(t,39,11,15,1,P.sky8);rect(t,27,18,24,1,P.sky6);rect(t,65,19,23,1,P.sky6);
    return {wide,thin};
  }
  function cross(c,x,y,size,color) {
    rect(c,x,y-size,1,2*size+1,color);rect(c,x-size,y,2*size+1,1,color);
  }
  const moonRows=[
    '.............aa.............','..........aaab..............','........aabbb...............',
    '......aabbbb................','.....abbbbb.................','....abbbbbb.................',
    '...abbbbbb..................','..abbbbbbb..................','..abbbbbbb..................',
    '.abbbbbbbb..................','.abbbbbbbb..................','.abbbbbbbbb.................',
    'abbbbbbbbbb.................','abbbbbbbbbbb................','abbbbbbbbbbbb...............',
    'abbbbbbbbbbbbb..............','abbbbbbbbbbbbbbb............','.abbbbbbbbbbbbbbbb..........',
    '.abbbbbbbbbbbbbbbbbbb.......','.abbbbbbbbbbbbbbbbbbbbbbbba.','..abbbbbbbbbbbbbbbbbbbbbaa..',
    '...abbbbbbbbbbbbbbbbbbaa....','....aabbbbbbbbbbbbbbaa......','......aabbbbbbbbbbaa........',
    '........aaabbbbaaa..........','...........aaaa.............'
  ];
  function create(w,h,makeCanvas) {
    const portrait=w/h<.85,horizon=Math.round(h*(portrait?.635:.625));
    const rng=random(93811),layer=()=>makeCanvas(w,h);
    const sky=layer(),land=layer(),water=layer(),garden=layer(),title=layer();
    const sc=sky.getContext('2d'),lc=land.getContext('2d'),wc=water.getContext('2d'),gc=garden.getContext('2d'),tc=title.getContext('2d');
    // Ordered interpolation between adjacent palette entries softens the sky without
    // introducing filtered colours. Foliage, clouds and other forms remain solid clusters.
    const skyRamp=[P.sky0,P.sky011,P.sky012,P.sky1,P.sky121,P.sky122,P.sky2,P.sky231,P.sky232,P.sky3,P.sky341,P.sky342,P.sky4,P.sky451,P.sky452,P.sky5,P.sky561,P.sky562,P.sky6,P.sky671,P.sky672,P.sky7,P.sky781,P.sky782,P.sky8];
    const dither=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
    for(let y=0;y<=horizon;y++) {
      const position=Math.pow(y/horizon,1.18)*(skyRamp.length-1);
      const index=Math.min(skyRamp.length-2,Math.floor(position)),threshold=(position-index)*16;
      rect(sc,0,y,w,1,skyRamp[index]);
      for(let x=0;x<w;x++)if(dither[y%4][x%4]<threshold)rect(sc,x,y,1,1,skyRamp[index+1]);
    }
    const moon={x:Math.round(w*(portrait?.73:.76)),y:Math.round(h*(portrait?.205:.17))};
    sprite(sc,moonRows,moon.x-14,moon.y-13,{a:P.light,b:P.cream});
    const stars=Array.from({length:Math.round(w/12)},(_,i)=>({x:Math.floor(rng()*w),y:Math.floor(rng()*h*.37),phase:i%8,size:i%11===0?1:0}));
    // A central saddle keeps the lettering clear; ridges have no random perturbation.
    const relief=portrait?.58:Math.min(1,h/270);
    const point=([x,depth])=>[Math.round(x*w),Math.round(horizon-depth*relief)];
    function ridge(points,color,facets) {
      polygon(lc,[...points.map(point),[w,horizon],[0,horizon]],color);
      for(const [outline,tint]of facets)polygon(lc,outline.map(point),tint);
    }
    ridge([[0,38],[.06,43],[.115,58],[.16,72],[.20,68],[.25,49],[.29,43],[.345,27],[.40,22],[.47,14],[.53,18],[.60,26],[.655,39],[.71,51],[.77,81],[.795,77],[.84,64],[.88,57],[.94,45],[1,52]],P.sky5,[
      [[[.16,72],[.178,57],[.17,52],[.204,42],[.22,33],[.207,28],[.25,5],[.32,0],[.30,35],[.25,49],[.20,68]],P.sky4],
      [[[.77,81],[.79,68],[.78,61],[.806,54],[.81,45],[.85,37],[.83,28],[.88,9],[.99,0],[.94,45],[.88,57],[.84,64],[.795,77]],P.sky4],
      [[[.16,72],[.12,57],[.135,59],[.148,62],[.15,60],[.162,65]],P.sky6],
      [[[.77,81],[.733,63],[.748,68],[.752,65],[.766,71]],P.sky6]
    ]);
    ridge([[0,37],[.055,33],[.12,48],[.18,34],[.25,31],[.30,22],[.37,13],[.45,9],[.53,13],[.59,20],[.635,32],[.67,43],[.71,40],[.77,29],[.81,23],[.88,36],[.93,28],[1,34]],P.midStone,[
      [[[.12,48],[.15,26],[.145,19],[.185,11],[.25,0],[.31,0],[.25,31],[.18,34]],P.stone],
      [[[.67,43],[.685,31],[.68,26],[.718,16],[.742,8],[.82,0],[.81,23],[.77,29],[.71,40]],P.stone]
    ]);
    ridge([[0,16],[.09,20],[.16,18],[.22,12],[.31,10],[.38,5],[.48,3],[.56,6],[.65,10],[.75,13],[.82,17],[.91,15],[1,19]],P.water0,[]);
    for(let x=0,i=0;x<w;x+=5,i++) {
      const th=[4,7,3,5,8,4,6,3][i%8],base=horizon-1;
      rect(lc,x,base-th,1,th,P.teal0);
      for(let j=2;j<th;j+=2)rect(lc,x-Math.floor(j/3),base-th+j,1+2*Math.floor(j/3),1,P.teal0);
    }
    rect(lc,0,horizon-1,w,1,P.water2);
    rect(wc,0,horizon,w,h-horizon,P.water0);
    rect(wc,0,horizon,w,4,P.water2);
    rect(wc,0,horizon,w,1,P.water3);
    // Interrupted horizontal planes, getting sparser towards the near water.
    const waterPlanes=[
      [4,0,.33],[4,.37,.63],[5,.08,.71],[6,0,.22],[6,.30,.38],[6,.77,.23],
      [8,.03,.42],[8,.52,.48],[10,0,.18],[10,.24,.51],[10,.84,.16],
      [12,.04,.24],[12,.34,.27],[12,.72,.25],[14,0,.13],[14,.20,.37],[14,.67,.33],
      [17,.02,.21],[17,.28,.24],[17,.65,.31],[20,.09,.27],[20,.44,.16],[20,.77,.20],
      [24,.03,.14],[24,.22,.17],[24,.57,.21],[24,.88,.12],
      [29,.12,.13],[29,.35,.10],[29,.62,.19],[34,.01,.17],[34,.45,.10],[34,.83,.11]
    ];
    for(const [y,x,length]of waterPlanes)rect(wc,x*w,horizon+y,length*w,y<14?2:1,y<8?P.water2:P.water1);
    for(const [x,len]of [[.02,12],[.13,18],[.21,9],[.34,15],[.48,10],[.58,7],[.68,17],[.82,11],[.94,8]])rect(wc,w*x,horizon+2,len,1,P.sky6);
    const ripples=[
      [.06,.07,8],[.18,.10,10],[.27,.05,5],[.37,.09,14],[.51,.06,7],[.61,.12,9],[.90,.07,13],
      [.10,.19,12],[.29,.22,17],[.44,.18,9],[.57,.26,13],[.86,.22,12],[.96,.17,7],
      [.04,.36,19],[.20,.32,10],[.35,.41,16],[.49,.35,14],[.64,.40,9],[.91,.38,18],
      [.14,.53,15],[.26,.62,22],[.42,.56,13],[.58,.60,21],[.79,.55,11],
      [.36,.74,24],[.51,.78,12],[.64,.73,17]
    ].map(([x,y,len],i)=>({x:Math.round(x*w),y:horizon+Math.round(y*(h-horizon)),len,phase:i%6}));
    const clouds=cloudSprites(makeCanvas);
    const cloudPositions=[
      {image:clouds.wide,x:Math.round(w*(portrait?.15:.43)-82),y:Math.round(h*(portrait?.095:.205)),direction:1},
      {image:clouds.thin,x:Math.round(w*.84-58),y:Math.round(h*.31),direction:-1}
    ];
    const anchors=globalThis.PixelGarden.draw(gc,w,h,1337)||{};
    const font=globalThis.PixelTypography,ts=w>=760?3:w>=font.width*2+16?2:1;
    const text={x:Math.floor((w-font.width*ts)/2),y:Math.floor((h-font.height*ts)/2),width:font.width*ts,height:font.height*ts,scale:ts};
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[1,2]])sprite(tc,font.rows,text.x+dx,text.y+dy,{'1':P.sky2},ts);
    sprite(tc,font.rows,text.x,text.y,{'1':P.cream},ts);
    const petals=Array.from({length:portrait?10:17},(_,i)=>({x:rng()*w,y:rng()*h,phase:i*1.71,speed:1.5+rng()*2}));
    const fireflies=Array.from({length:portrait?8:12},(_,i)=>({x:Math.round(rng()*w),y:Math.round(h*(.77+rng()*.16)),phase:i*1.91}));
    function draw(c,time=0,options={}) {
      c.imageSmoothingEnabled=false;c.drawImage(sky,0,0);
      for(const s of stars) {
        const phase=(Math.floor(time*.6)+s.phase)%8;
        const color=[P.sky4,P.sky5,P.lavender,P.petal,P.light,P.lavender,P.sky5,P.sky4][phase];
        cross(c,s.x,s.y,s.size&&phase>=2&&phase<=5?1:0,color);
      }
      const comet=(time+9)%37;
      if(comet<1.7) {
        const x=Math.round(w*(.38+.22*comet/1.7)),y=Math.round(h*(.075+.09*comet/1.7));
        const colors=[P.cream,P.light,P.lavender,P.sky5,P.sky4];
        for(let i=4;i>=0;i--)line(c,x-i*4,y-i*2,x-i*4-3,y-i*2-1,colors[i]);
      }
      for(const cl of cloudPositions)c.drawImage(cl.image,cl.x+Math.round(Math.sin(time/30)*5)*cl.direction,cl.y);
      c.drawImage(water,0,0);c.drawImage(land,0,0);
      for(const r of ripples) {
        const frame=(Math.floor(time*.75)+r.phase)%6,shift=[0,1,1,0,-1,-1][frame];
        const color=r.y<horizon+17?P.water3:r.y<horizon+40?P.water2:P.water1;
        rect(c,r.x+shift,r.y,r.len,1,color);
        if(frame===1||frame===2)rect(c,r.x+r.len-3,r.y+2,5,1,color);
      }
      const reflection=[[3,-6,7],[5,-3,11],[8,-8,14],[12,-5,10],[17,-9,17],[23,-4,12],[30,-11,19],[38,-5,14],[47,-12,22],[58,-5,16],[70,-10,21]];
      for(let i=0;i<reflection.length;i++) {
        const [dy,dx,len]=reflection[i];if(horizon+dy>h*.89)continue;
        const phase=(Math.floor(time*.8)+i)%4;
        const tone=i<4?(phase===0||phase===1?P.lavender:P.sky6):i<7?(phase===1?P.lavender:P.water3):(phase===1?P.water3:P.water2);
        rect(c,moon.x+dx+(phase===1?1:0),horizon+dy,len,1,tone);
        if(i>3&&phase===2)rect(c,moon.x+dx+len+3,horizon+dy+1,3,1,P.water2);
      }
      c.drawImage(garden,0,0);
      for(const p of petals) {
        const x=Math.floor((p.x+time*p.speed+Math.sin(time*.7+p.phase)*3)%(w+12))-6;
        const y=Math.floor((p.y+time*(1.5+p.speed*.3))%(h+12))-6;
        if(x>text.x-8&&x<text.x+text.width+8&&y>text.y-9&&y<text.y+text.height+9)continue;
        const phase=Math.floor(time+p.phase)%3;
        rect(c,x,y,phase===1?1:2,1,y<h*.65?P.sky7:P.pink);
        if(phase===2)rect(c,x+1,y-1,1,1,P.blush);
      }
      for(const f of fireflies) {
        const phase=(Math.floor(time*.7+f.phase)%8+8)%8;if(phase>4)continue;
        const x=f.x+Math.round(Math.sin(time*.35+f.phase)*3),y=f.y+Math.round(Math.cos(time*.3+f.phase)*2);
        if(phase===2)cross(c,x,y,1,P.teal2);
        rect(c,x,y,1,1,phase===2?P.gold:phase===1||phase===3?P.teal3:P.teal2);
      }
      if(options.title!==false)c.drawImage(title,0,0);
    }
    return {draw,width:w,height:h,horizon,text,clouds,anchors};
  }
  globalThis.PixelScene=Object.freeze({create,cloudSprites});
})();
