/* A dusk sky painted with four swatches and ordered native-pixel transitions. */
globalThis.NativeSky = (() => {
  'use strict';
  const P=Object.freeze({deep:'#3d3757',mid:'#4e4267',sky:'#60527c',haze:'#7e6b93',
    halo:'#837fae',star:'#bca1bb',light:'#ffddcd',cream:'#fff1d8'});
  const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function sky(c,w,h,horizon) {
    rect(c,0,0,w,h,P.deep);
    const bands=[
      [Math.round(horizon*.16),24,P.mid,[-3,-6,-4,1,3,0,-2]],
      [Math.round(horizon*.49),28,P.sky,[4,1,-3,-5,-1,3,5]],
      [Math.round(horizon*.79),20,P.haze,[-2,1,4,2,-2,-4,-1]],
    ];
    for(const [height,depth,color,curve]of bands){
      for(let x=0;x<w;x++){
        const position=x/Math.max(1,w-1)*(curve.length-1),left=Math.floor(position);
        const offset=curve[left]+(curve[Math.min(left+1,curve.length-1)]-curve[left])*(position-left);
        const boundary=height+Math.round(offset),span=depth+Math.round(offset/2);
        rect(c,x,boundary+span,1,h-boundary-span,color);
        for(let y=boundary;y<boundary+span;y++){
          const count=Math.floor((y-boundary+1)/span*16);
          if(bayer[(y+1024)%4][x%4]<count)rect(c,x,y,1,1,color);
        }
      }
    }
  }
  function moon(c,x,y) {
    // Two connected light bands keep the moon's silhouette calm and readable.
    for(let dy=-16;dy<=16;dy++)for(let dx=-16;dx<=16;dx++){
      const distance=dx*dx+dy*dy;
      if(distance<=13*13)rect(c,x+dx,y+dy,1,1,P.halo);
      else if(distance<=16*16)rect(c,x+dx,y+dy,1,1,P.sky);
    }
    const rows=[6,10,14,16,18,18,20,20,20,20,20,20,20,20,18,18,16,14,10,6];
    for(let row=0;row<rows.length;row++)rect(c,x-rows[row]/2,y-10+row,rows[row],1,P.cream);
    // A shaded rim and two small craters; the disc is still one clear silhouette.
    for(const [a,b,width]of [[4,7,3],[6,5,2],[7,2,2],[3,3,3],[-4,-4,2]])rect(c,x+a,y+b,width,1,P.light);
  }
  const constellations=[
    [.39,.064,1],[.48,.092,0],[.58,.045,1],[.66,.11,0],[.89,.068,1],[.95,.162,0],
    [.38,.19,0],[.47,.22,1],[.59,.168,0],[.67,.245,1],[.88,.28,0],[.95,.36,1],
    [.35,.335,0],[.43,.375,0],[.54,.31,1],[.70,.36,0],[.82,.39,0]
  ];
  function stars(c,w,h,moonPosition) {
    const list=constellations.map(([a,b,bright],i)=>({x:Math.round(w*a),y:Math.round(h*b),bright,phase:i*1.63}));
    const visible=list.filter(star=>(star.x-moonPosition.x)**2+(star.y-moonPosition.y)**2>26**2);
    for(const star of visible) {
      rect(c,star.x,star.y,1,1,star.bright?P.light:P.star);
      // Two larger stars give the field a hierarchy without carpeting it in noise.
      if(star.bright&&[0,4].includes(list.indexOf(star))){
        rect(c,star.x-1,star.y,3,1,P.star);rect(c,star.x,star.y-1,1,3,P.star);
        rect(c,star.x,star.y,1,1,P.cream);
      }
    }
    return visible;
  }
  function draw(c,w,h,moonPosition,horizon=Math.round(h*.64)) {
    sky(c,w,h,horizon);moon(c,moonPosition.x,moonPosition.y);
    return stars(c,w,h,moonPosition);
  }
  return Object.freeze({draw,sky,moon,stars,palette:P});
})();

/* Authored, fixed-grid cloud sprites. Dot means transparent; other cells index palette. */
globalThis.NativeClouds = Object.freeze({
  "wide": {
    "rows": [
      "................................................................................",
      "................................................................................",
      "....................................rrrrrrrr....................................",
      ".................................rrrrrrrrrrrrrrl................................",
      "...............................rrrrlllllllllllllll..............................",
      "..............................rrrllllllllllllllllllb............................",
      ".............................rrlllllllllllllllllllllb...........................",
      "...................rrrrr....llllllllllllllllllllllllbb..........................",
      "................rrrrrllllll.lllllllllllllllllllllllllbb.........................",
      "..............rrrllllllllllllllllllllllllllllllllllllbbs........................",
      ".............rrllllllllllllllbblllllllllllllllllllllbbbs......rrrrr.............",
      "............llllllllllllllllllbbbblllllllllllllllbbbbbbbs..srrrlllllls..........",
      "............llllllllllllllllllbbbbbbbbllllllbbbbbbbbbbbbbsslllllllllllbs........",
      "...........blllllllllllllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllllllllbs.......",
      "......llllbbbblllllllllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllllllbbss......",
      "....slllllllbbbbbllllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllbbbbss.....",
      "...slllllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbss....",
      "..sblllllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbssss...",
      "..ssbbllllllbbbbbbbbbbbbssbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbssssss...",
      "...sssbbbbbbbbbbbbbbbssssssssbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbssssssss....",
      "....ssssssbbbbbbbbsssssssssssssssbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbsssssssssss.....",
      "......sssssssssssssssssssssssssssssssbbbbbbbbbbbbbbbbbbbbssssssssssssssss.......",
      "..........sssssssssssssssss..ssssssssssssssssssssssssssssssssssssssss...........",
      "..............ssssssssss..........ssssssssssssssssssssssssssssss................",
      "........................................ssssssssssssssss........................",
      "................................................................................",
      "................................................................................"
    ],
    "palette": {
      ".": null,
      "s": "#aa89ba",
      "b": "#d49cbd",
      "l": "#efb4c4",
      "r": "#ffddcd"
    }
  },
  "small": {
    "rows": [
      "................................................",
      "................................................",
      "......................rrrrrr....................",
      "...................rrrrrlllllll.................",
      ".................rrrllllllllllllb...............",
      "................rrllllllllllllllbb..............",
      ".........rrrr..blllllllllllllllllbb.............",
      ".......rrrlllllbblllllllllllllllbbb.............",
      "......llllllllllbblllllllllllllbbbbs............",
      ".....llllllllllllbbblllllllllbbbbbbbbllls.......",
      "....bllllllllllllbbbbbbllllbbbbbbbbblllllbs.....",
      "...sbblllllllllbbbbbbbbbbbbbbbbbbbbbllllllbs....",
      "...ssbbbblllbbbbbbbbbbbbbbbbbbbbbbbbbllllssss...",
      "....sssbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbssssss...",
      ".....sssssbbbbbbbbbbbbbbbbbbbbbbbbbsssssssss....",
      ".......ssssssssssbbbbbbbbbbbbbssssssssssss......",
      "..........ssssssssssssssssssssssssssss..........",
      "................sssssssssssssss.................",
      "................................................",
      "................................................"
    ],
    "palette": {
      ".": null,
      "s": "#aa89ba",
      "b": "#d49cbd",
      "l": "#efb4c4",
      "r": "#ffddcd"
    }
  }
});


/* Native 1:1 pixel scenery. All contours, reflection groups and wavelets are authored.
 * The landscape stays at one pixel scale when the viewport changes; it is cropped,
 * never stretched. Optional fifth argument: { horizon, reflectionX }.
 */
globalThis.NativeLandscape = (() => {
  'use strict';
  const P = Object.freeze({
    far: '#9b8ebc', farShade: '#837fae', middle: '#656d99',
    middleShade: '#4a597e', near: '#3f536f', water: '#526c8c',
    waterLight: '#7592aa', lavender: '#bca1bb', pink: '#efb4c4',
    cream: '#ffddcd', amber: '#edb781', padShadow: '#3d5960',
    pad: '#52786f', padLight: '#7ca28b', lotusShade: '#a45c86', lotus: '#c87a9b'
  });
  function rect(ctx, x, y, width, height, colour) {
    ctx.fillStyle = colour;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
  // An integer scanline fill preserves the explicitly drawn pixel staircases.
  function poly(ctx, points, colour) {
    const first = Math.min(...points.map(p => p[1]));
    const last = Math.max(...points.map(p => p[1]));
    ctx.fillStyle = colour;
    for (let y = first; y < last; y++) {
      const cut = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          cut.push(a[0] + (y + .5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
      }
      cut.sort((a, b) => a - b);
      for (let i = 0; i + 1 < cut.length; i += 2) {
        const left = Math.ceil(cut[i] - .5), right = Math.ceil(cut[i + 1] - .5);
        if (right > left) ctx.fillRect(left, y, right - left, 1);
      }
    }
  }
  // Coordinates are relative to the centre of a 320 px landscape and its shore.
  const farRidge = [
    [-240,-15],[-218,-18],[-204,-23],[-189,-25],[-176,-29],[-162,-29],
    [-154,-32],[-142,-31],[-133,-27],[-123,-26],[-114,-21],[-104,-22],
    [-95,-27],[-86,-29],[-78,-34],[-70,-35],[-62,-33],[-57,-35],
    [-49,-38],[-41,-38],[-32,-34],[-23,-32],[-14,-27],[-4,-26],
    [5,-29],[13,-30],[22,-27],[29,-26],[35,-22],[47,-20],[59,-18],
    [70,-21],[80,-26],[87,-27],[96,-33],[105,-34],[113,-31],
    [120,-32],[126,-37],[132,-38],[139,-36],[147,-31],[154,-29],
    [166,-26],[176,-27],[188,-23],[199,-21],[210,-23],[224,-19],[240,-15]
  ];
  const middleRidge = [
    [-240,-13],[-218,-17],[-204,-16],[-190,-21],[-178,-24],[-166,-24],
    [-157,-26],[-150,-25],[-140,-24],[-128,-21],[-119,-22],[-110,-18],
    [-103,-18],[-96,-14],[-83,-12],[-77,-10],[-66,-10],[-59,-8],
    [-47,-7],[-42,-5],[-31,-5],[-23,-3],[-13,-3],[-5,-1],
    [5,-1],[16,-2],[24,-4],[35,-5],[44,-8],[52,-9],[59,-12],[67,-12],
    [73,-14],[82,-14],[90,-18],[100,-20],[106,-23],[111,-23],[117,-26],
    [124,-26],[132,-24],[139,-24],[148,-20],[157,-18],[170,-19],
    [181,-17],[196,-16],[209,-12],[225,-13],[240,-11]
  ];
  function contour(ctx, points, x, horizon, colour) {
    const left = Math.min(0, points[0][0] + x);
    const right = Math.max(ctx.canvas.width, points[points.length - 1][0] + x);
    poly(ctx, [[left, horizon + 1], [left, points[0][1] + horizon],
      ...points.map(p => [p[0] + x, p[1] + horizon]),
      [right, points[points.length - 1][1] + horizon], [right, horizon + 1]], colour);
  }
  function pavilion(ctx, w, horizon) {
    const x = Math.round(w * .71), y = horizon - 2;
    // A small, continuous rocky islet carries one open lakeside pavilion.
    poly(ctx, [[x-18,y+2],[x-15,y],[x-9,y-1],[x-4,y-2],[x+8,y-2],
      [x+13,y],[x+18,y+1],[x+18,y+2]], P.near);
    rect(ctx,x-10,y-2,21,1,P.middleShade);
    rect(ctx,x-8,y-8,2,7,P.near);
    rect(ctx,x+6,y-8,2,7,P.near);
    rect(ctx,x-8,y-3,16,1,P.middleShade);
    rect(ctx,x-11,y-1,22,1,P.near);
    // Upturned eaves, one roof plane, and a tiny warm suspended lantern.
    poly(ctx,[[x-12,y-9],[x-12,y-11],[x-9,y-9],[x-5,y-11],[x-1,y-14],
      [x+1,y-14],[x+5,y-11],[x+9,y-9],[x+12,y-11],[x+12,y-9],
      [x+9,y-7],[x-9,y-7]],P.near);
    poly(ctx,[[x-9,y-9],[x-5,y-11],[x-1,y-14],[x+1,y-14],
      [x+5,y-11],[x+9,y-9]],P.middleShade);
    rect(ctx,x-1,y-7,1,1,P.near);
    rect(ctx,x-2,y-6,3,3,P.amber);
    rect(ctx,x-1,y-6,1,2,P.cream);
    rect(ctx,x-2,y-3,3,1,P.near);
  }
  function mountain(ctx, w, horizon) {
    const x = Math.round(w / 2);
    contour(ctx, farRidge, x, horizon, P.far);
    // Broad ridge-facing planes follow a mountain's shoulder, rather than noise.
    for (const plane of [
      [[-49,-38],[-41,-38],[-31,-31],[-23,-28],[-10,-16],[-34,-21],[-38,-28]],
      [[-78,-34],[-70,-35],[-61,-28],[-48,-22],[-60,-21],[-69,-27]],
      [[126,-37],[132,-38],[139,-36],[146,-27],[160,-21],[140,-23],[135,-28]],
      [[96,-33],[105,-34],[114,-28],[126,-23],[112,-24],[103,-29]],
      [[-176,-29],[-162,-29],[-151,-24],[-139,-21],[-163,-22]]
    ]) poly(ctx, plane.map(p => [x + p[0], horizon + p[1]]), P.farShade);
    contour(ctx, middleRidge, x, horizon, P.middle);
    for (const plane of [
      [[-157,-26],[-150,-25],[-147,-17],[-135,-10],[-105,-3],[-141,-4],[-158,-15]],
      [[-119,-22],[-110,-18],[-103,-18],[-100,-12],[-89,-7],[-105,-8]],
      [[117,-26],[124,-26],[127,-18],[141,-11],[162,-6],[126,-8],[117,-15]],
      [[82,-14],[90,-18],[100,-20],[100,-12],[110,-7],[87,-6]]
    ]) poly(ctx, plane.map(p => [x + p[0], horizon + p[1]]), P.middleShade);
    // The distant wooded shore is deliberately small: two connected silhouettes.
    const shoreline = [
      [-240,-3],[-208,-4],[-177,-4],[-168,-5],[-151,-5],[-141,-4],[-135,-5],
      [-116,-3],[-105,-3],[-92,-4],[-87,-3],[-68,-3],[-58,-2],[-44,-2],[-30,0],
      [15,0],[29,-1],[38,-2],[44,-3],[62,-3],[71,-4],[86,-4],[100,-5],
      [114,-6],[134,-6],[144,-5],[151,-6],[172,-5],[180,-3],[206,-4],[240,-2]
    ];
    contour(ctx, shoreline, x, horizon, P.near);
    // Sparse conifers interrupt the shoreline silhouette without stipple.
    const trees = [[-145,4],[-134,3],[-113,3],[-91,4],[-66,2],[46,2],
      [58,3],[75,3],[82,5],[101,3],[118,5],[131,4],[145,3],[163,4]];
    for (const [tx, th] of trees) {
      const shore = horizon - (tx > 95 ? 4 : tx < -120 ? 3 : 2);
      rect(ctx, x + tx, shore - th, 1, th + 1, P.near);
      if (th > 2) rect(ctx, x + tx - 1, shore - th + 2, 3, th - 1, P.near);
    }
    pavilion(ctx,w,horizon);
  }
  const openWater = [
    // Fixed pixel distances keep three distant groups close to the horizon.
    // Fractional distances place the fewer, broader foreground strokes.
    // x relative to centre, distance, length, thickness, tone
    [-106,5,39,1,'waterLight'],[-97,7,18,1,'waterLight'],
    [-40,8,31,1,'waterLight'],[-29,10,12,1,'waterLight'],
    [36,4,35,1,'waterLight'],[46,6,18,1,'waterLight'],
    [-74,.24,36,1,'waterLight'],
    [-27,.46,42,1,'waterLight'],
    [-102,.72,61,1,'middleShade'],
    [2,.83,47,1,'waterLight'],
    [79,.95,58,2,'middleShade']
  ];
  const reflection = [
    // A close, broken stem opens into three asymmetric groups. Fixed small
    // offsets inside each group prevent tall screens turning it into a ladder.
    // x from moon, distance, extra pixel offset, length, thickness, tone
    [-2,3,0,5,1,'pink'],[-1,3,0,2,1,'cream'],
    [-3,5,0,3,1,'lavender'],[1,6,0,3,1,'pink'],
    [-4,9,0,8,1,'lavender'],[-2,11,0,5,1,'waterLight'],
    [-5,.27,0,9,1,'lavender'],[-1,.27,0,3,1,'pink'],[6,.27,2,7,1,'waterLight'],
    [-12,.48,0,17,1,'waterLight'],[1,.48,2,11,1,'lavender'],
    [-20,.69,0,25,1,'waterLight'],[-6,.69,0,8,1,'lavender'],
    [10,.69,3,17,1,'waterLight'],
    [-29,.91,0,23,1,'waterLight'],[-1,.91,3,35,1,'waterLight'],
    [1,.91,3,11,1,'lavender']
  ];
  const pads = Object.freeze({
    large: [
      '.....lllllll.....',
      '...llggggggggg...',
      '.llggggggggggggg.',
      'lgggggggggggggggl',
      'sggggggg.gggggggs',
      '.sggggg...gggggs.',
      '...sss.....sss...'
    ],
    medium: [
      '...lllll...',
      '.llggggggg.',
      'lgggggggggl',
      'sgggg.ggggs',
      '.sss...sss.'
    ],
    small: ['..lll..','lgggggl','.ss.ss.']
  });
  const lotusRows = [
    '....l....',
    '.l.lhl.l.',
    '.sllhlls.',
    'ssllhllss',
    '.sslllss.',
    '..ddddd..',
    '....g....'
  ];
  const budRows = ['..l..','.lll.','.sls.','..d..','..g..'];
  function cells(ctx, rows, x, y, palette) {
    for (let yy = 0; yy < rows.length; yy++) {
      for (let xx = 0; xx < rows[yy].length; xx++) {
        const colour = palette[rows[yy][xx]];
        if (colour) rect(ctx,x+xx,y+yy,1,1,colour);
      }
    }
  }
  function leaf(ctx, x, y, size) {
    const rows = pads[size], width = rows[0].length, height = rows.length;
    // The submerged shadow and the lower leaf rim stay attached to the pad.
    rect(ctx,x+2,y+height-1,width-3,1,P.near);
    rect(ctx,x+4,y+height,width-7,1,P.near);
    cells(ctx,rows,x,y,{s:P.padShadow,g:P.pad,l:P.padLight});
  }
  function lilyPads(ctx,w,h,horizon,time) {
    const depth=h-horizon,portrait=w<=h;
    const groups=[
      {x:Math.round(w*(portrait?.70:.61)),y:horizon+Math.round(depth*.72),kind:0},
      {x:Math.round(w*.82),y:horizon+Math.round(depth*.47),kind:1},
      {x:Math.round(w*(portrait?.84:.80)),
        y:Math.min(h-15,horizon+Math.round(depth*.84)),kind:2}
    ];
    const palette={s:P.lotus,l:P.pink,h:P.cream,d:P.lotusShade,g:P.padShadow};
    const phase=Math.floor(Math.max(time,0)*2)%8;
    const sway=[0,0,1,1,0,0,-1,-1];
    for (const [i,group] of groups.entries()) {
      const {x,y,kind}=group,drift=sway[(phase+i*2)%8];
      // Quiet surface rings sit around stationary leaves and their attached flowers.
      rect(ctx,x-12-drift,y+7,9,1,P.waterLight);
      rect(ctx,x+7+drift,y+8,12,1,P.waterLight);
      if(kind===0) {
        leaf(ctx,x+8,y-3,'medium');
        leaf(ctx,x-12,y+4,'small');
        leaf(ctx,x-9,y,'large');
        cells(ctx,lotusRows,x-5,y-5,palette);
        rect(ctx,x-4,y+9,5,1,P.lavender);
      } else if(kind===1) {
        leaf(ctx,x-10,y+3,'small');
        leaf(ctx,x-2,y,'medium');
        cells(ctx,budRows,x+1,y-3,palette);
      } else {
        leaf(ctx,x-9,y,'medium');
        leaf(ctx,x+2,y+3,'small');
      }
    }
  }
  function lake(ctx, w, h, horizon, time, reflectionX) {
    const depth = h - horizon;
    const centre = Math.round(w / 2);
    rect(ctx, 0, horizon, w, depth, P.water);
    // One crisp horizon glint joins the distant shore; it is not a gradient band.
    rect(ctx, 0, horizon + 1, w, 1, P.waterLight);
    rect(ctx, centre - 24, horizon, 44, 1, P.lavender);
    rect(ctx, centre - 77, horizon + 3, 23, 1, P.middleShade);
    rect(ctx, centre + 30, horizon + 3, 27, 1, P.middleShade);
    rect(ctx, 0, horizon + 2, Math.max(0, centre - 92), 2, P.middleShade);
    rect(ctx, centre + 103, horizon + 2, w, 2, P.middleShade);
    // Reflected banks break into successively shorter ribbons away from shore.
    for (const [x, y, length] of [[-160,5,54],[-154,7,35],[-148,10,19],
      [110,5,50],[122,8,38],[139,11,21]]) {
      rect(ctx, centre + x, horizon + y, length, 1, P.middleShade);
    }
    const sway = [0,0,1,1,0,0,-1,-1];
    const phase = Math.floor(Math.max(time, 0) * 3) % sway.length;
    for (let i = 0; i < openWater.length; i++) {
      const [x, y, length, thickness, tone] = openWater[i];
      const yy = horizon + (y < 1 ? Math.round(y * depth) : y);
      const drift = y >= 1 ? 0 : sway[(phase + i * 3) % sway.length];
      rect(ctx, centre + x + drift, yy, length, thickness, P[tone]);
      if (i === 7) {
        rect(ctx, centre + x + 11 - drift, yy + 2, 18, 1, P[tone]);
      }
    }
    for (let i = 0; i < reflection.length; i++) {
      const [x, y, extra, length, thickness, tone] = reflection[i];
      const yy = horizon + (y < 1 ? Math.round(y * depth) : y) + extra;
      const drift = y >= 1 ? 0 : sway[(phase + i * 2) % sway.length];
      rect(ctx, reflectionX + x + drift, yy, length, thickness, P[tone]);
    }
    // The distant lantern leaves only a small warm trace beside its islet.
    const pavilionX=Math.round(w*.71);
    rect(ctx,pavilionX-1,horizon+3,2,1,P.amber);
    rect(ctx,pavilionX-2,horizon+6,4,1,P.lavender);
    lilyPads(ctx,w,h,horizon,time);
  }
  function draw(ctx, w, h, time = 0, options = {}) {
    const horizon = options.horizon === undefined ? Math.round(h * .64) : Math.round(options.horizon);
    const reflectionX = options.reflectionX === undefined ? Math.round(w * .78) : Math.round(options.reflectionX);
    mountain(ctx, w, horizon);
    lake(ctx, w, h, horizon, time, reflectionX);
  }
  return Object.freeze({ draw, mountain, lake, lilyPads, palette: P });
})();

/* Native pixel garden: deliberate clusters and explicit depth ordering. */
globalThis.NativeGarden = (() => {
  'use strict';
  const P = Object.freeze({
    ink:'#272138', barkDark:'#3c293e', bark:'#684052', barkLight:'#985c64', barkWarm:'#bd8368',
    grassDark:'#243842', grass:'#3b514f', grassLight:'#64735d', grassWarm:'#867754', grassLit:'#b39a68',
    flowerDark:'#74456f', flowerShade:'#a65c86', flower:'#cf81a0', flowerLight:'#edabb8', flowerHigh:'#ffd5ba',
    stoneDark:'#393947', stone:'#565568', stoneLight:'#7a7080', stoneWarm:'#a58a78',
    amber:'#eab77d', cream:'#fff1d8'
  });
  function rect(c,x,y,w,h,color) { c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
  function poly(c,points,color) {
    const top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
    c.fillStyle=color;
    for(let y=top;y<bottom;y++) {
      const cuts=[];
      for(let i=0;i<points.length;i++) {
        const a=points[i],b=points[(i+1)%points.length];
        if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y)) cuts.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      cuts.sort((a,b)=>a-b);
      for(let i=0;i+1<cuts.length;i+=2) {
        const x=Math.ceil(cuts[i]-.5),r=Math.ceil(cuts[i+1]-.5);
        if(r>x)c.fillRect(x,y,r-x,1);
      }
    }
  }
  function ribbon(c,points,color) {
    poly(c,[...points.map(([x,y,r])=>[x-r,y]),...points.slice().reverse().map(([x,y,r])=>[x+r,y])],color);
  }
  function bloom(c,x,y,light=true) {
    const petal=light?P.flowerLight:P.flower, centre=light?P.flowerHigh:P.flowerLight;
    rect(c,x+1,y,2,1,petal);rect(c,x,y+1,4,2,petal);rect(c,x+1,y+3,2,1,petal);
    rect(c,x+1,y+1,1,1,centre);
  }
  function canopy(c,x,y) {
    const shape=(points,color)=>poly(c,points.map(p=>[x+p[0],y+p[1]]),color);
    // The back silhouette carries every foreground mass. Nothing is erased.
    shape([[-30,-12],[46,-12],[46,-7],[62,-7],[62,-2],[77,-2],[77,3],
      [86,3],[86,8],[98,8],[98,13],[108,13],[108,19],[115,19],[115,25],
      [121,25],[121,31],[116,31],[116,35],[124,35],[124,41],[129,41],
      [129,47],[124,47],[124,53],[116,53],[116,58],[109,58],[109,63],
      [101,63],[101,60],[96,60],[96,67],[87,67],[87,72],[77,72],[77,69],
      [70,69],[70,75],[59,75],[59,80],[48,80],[48,84],[37,84],[37,80],
      [31,80],[31,85],[17,85],[17,80],[7,80],[7,77],[-5,77],[-5,72],
      [-16,72],[-16,68],[-30,68]],P.flowerDark);
    // Large mid-tone masses merge, while the hanging lower edges stay shaded.
    shape([[-30,-12],[46,-12],[46,-7],[62,-7],[62,-2],[77,-2],[77,3],
      [86,3],[86,8],[98,8],[98,13],[108,13],[108,19],[115,19],[115,24],
      [119,24],[119,28],[113,28],[113,34],[120,34],[120,39],[124,39],
      [124,44],[119,44],[119,49],[111,49],[111,54],[101,54],[101,58],
      [91,58],[91,63],[83,63],[83,65],[70,65],[70,70],[56,70],[56,75],
      [45,75],[45,78],[36,78],[36,75],[29,75],[29,79],[19,79],[19,74],
      [9,74],[9,70],[-2,70],[-2,65],[-14,65],[-14,61],[-30,61]],P.flowerShade);
    // A few interlocking rose forms give the crown a branching rhythm. Their
    // edges differ in size; there is no tiled tuft, outline, or texture noise.
    shape([[-30,-12],[16,-12],[16,-8],[27,-8],[27,-4],[35,-4],[35,2],
      [42,2],[42,8],[39,8],[39,13],[31,13],[31,18],[24,18],[24,22],
      [14,22],[14,19],[6,19],[6,24],[-4,24],[-4,21],[-16,21],[-16,26],[-30,26]],P.flower);
    shape([[26,-9],[45,-9],[45,-4],[58,-4],[58,1],[71,1],[71,5],
      [81,5],[81,10],[91,10],[91,15],[102,15],[102,20],[109,20],
      [109,25],[102,25],[102,30],[93,30],[93,34],[84,34],[84,30],
      [77,30],[77,26],[68,26],[68,22],[60,22],[60,18],[49,18],[49,14],
      [40,14],[40,9],[34,9],[34,2],[26,2]],P.flower);
    shape([[-30,30],[-19,30],[-19,26],[-8,26],[-8,23],[3,23],[3,27],
      [15,27],[15,32],[24,32],[24,36],[30,36],[30,43],[26,43],
      [26,49],[19,49],[19,54],[7,54],[7,59],[-4,59],[-4,55],
      [-13,55],[-13,59],[-22,59],[-22,54],[-30,54]],P.flower);
    shape([[28,22],[38,22],[38,18],[47,18],[47,22],[56,22],[56,28],
      [65,28],[65,32],[72,32],[72,37],[80,37],[80,41],[74,41],
      [74,47],[66,47],[66,53],[59,53],[59,59],[47,59],[47,64],
      [35,64],[35,59],[28,59],[28,53],[22,53],[22,47],[28,47],
      [28,42],[24,42],[24,35],[28,35]],P.flower);
    shape([[87,34],[96,34],[96,31],[106,31],[106,35],[115,35],[115,40],
      [122,40],[122,44],[116,44],[116,48],[109,48],[109,52],[102,52],
      [102,56],[94,56],[94,52],[86,52],[86,47],[81,47],[81,41],[87,41]],P.flower);
    shape([[4,60],[14,60],[14,56],[25,56],[25,60],[34,60],[34,64],
      [42,64],[42,69],[36,69],[36,74],[29,74],[29,71],[22,71],
      [22,75],[14,75],[14,71],[7,71],[7,67],[1,67],[1,63]],P.flower);
    // Smaller light clusters follow the upper/right-facing surfaces of each
    // larger mass. Their irregular shapes leave breathing room between flowers.
    const lightGroups=[
      [[-11,-3],[-2,-3],[-2,-6],[7,-6],[7,-3],[13,-3],[13,1],[20,1],
        [20,5],[16,5],[16,9],[8,9],[8,12],[1,12],[1,9],[-7,9],[-7,5],[-11,5]],
      [[27,-3],[34,-3],[34,-5],[43,-5],[43,-1],[50,-1],[50,3],[57,3],
        [57,7],[53,7],[53,10],[46,10],[46,7],[39,7],[39,4],[32,4],[32,1],[27,1]],
      [[63,5],[70,5],[70,8],[77,8],[77,11],[85,11],[85,15],[91,15],
        [91,19],[86,19],[86,22],[79,22],[79,18],[73,18],[73,14],[67,14],[67,10],[63,10]],
      [[93,22],[100,22],[100,25],[105,25],[105,28],[100,28],[100,31],
        [94,31],[94,28],[90,28],[90,25],[93,25]],
      [[-15,30],[-6,30],[-6,27],[2,27],[2,31],[8,31],[8,35],[14,35],
        [14,40],[9,40],[9,43],[2,43],[2,46],[-5,46],[-5,42],[-12,42],[-12,38],[-15,38]],
      [[33,26],[40,26],[40,23],[47,23],[47,27],[54,27],[54,31],[59,31],
        [59,35],[64,35],[64,39],[58,39],[58,43],[51,43],[51,46],
        [45,46],[45,42],[38,42],[38,38],[33,38],[33,33],[30,33],[30,29],[33,29]],
      [[47,48],[54,48],[54,45],[60,45],[60,48],[65,48],[65,51],[59,51],
        [59,55],[52,55],[52,58],[46,58],[46,54],[41,54],[41,51],[47,51]],
      [[96,37],[102,37],[102,35],[108,35],[108,39],[113,39],[113,43],
        [107,43],[107,46],[100,46],[100,43],[94,43],[94,40],[96,40]],
      [[10,60],[17,60],[17,58],[23,58],[23,62],[29,62],[29,65],[23,65],
        [23,68],[16,68],[16,65],[10,65]],
    ];
    for(const group of lightGroups)shape(group,P.flowerLight);
    // Recognisable four-petal blossom marks, deliberately placed on lit ridges
    // and hanging edges. These are accents, never a random fill.
    for(const [bx,by]of [[2,-2],[14,4],[36,-1],[48,3],[69,8],[80,15],
      [96,24],[-4,31],[5,36],[39,27],[51,32],[57,46],[47,51],
      [100,38],[108,42],[16,60],[25,65]]) bloom(c,x+bx,y+by,true);
    for(const [bx,by]of [[17,18],[55,16],[77,28],[110,31],[-7,53],
      [21,44],[37,63],[70,54],[85,58],[12,72],[52,70]]) bloom(c,x+bx,y+by,false);
    // Tiny exposed twigs support two edge flowers; they grow out of the crown.
    rect(c,x+106,y+56,5,1,P.barkDark);rect(c,x+110,y+54,1,3,P.barkDark);
    bloom(c,x+109,y+52,false);
  }
  function tree(c,w,h) {
    const portrait=w<=h, bank=Math.round(h*.84);
    if(portrait) {
      const entry=Math.round(h*.37);
      const stem=[[-20,entry+17,13],[-4,entry-10,11],[8,118,9],[20,96,7],
        [36,78,6],[54,61,4],[69,43,2],[78,27,1]];
      ribbon(c,stem,P.barkDark);
      ribbon(c,[[-11,entry+3,3],[1,entry-14,3],[12,119,3],[24,98,2],
        [39,79,2],[55,63,1]],P.bark);
      poly(c,[[12,113],[26,89],[41,80],[58,81],[74,75],[91,64],[103,47],
        [101,45],[88,59],[72,67],[58,70],[41,69],[26,78],[9,104]],P.barkDark);
      poly(c,[[18,105],[30,87],[44,79],[58,78],[44,75],[29,82]],P.bark);
      rect(c,8,125,1,8,P.barkLight);rect(c,11,116,1,5,P.barkLight);
    } else {
      const stem=[[19,bank+3,12],[23,bank-10,8],[18,Math.round(bank*.80),8],
        [11,Math.round(bank*.66),8],[12,Math.round(bank*.51),7],
        [23,Math.round(bank*.37),6],[43,47,4],[62,29,1]];
      ribbon(c,stem,P.barkDark);
      ribbon(c,[[22,bank+1,4],[27,bank-12,3],[22,Math.round(bank*.80),3],
        [15,Math.round(bank*.66),3],[16,Math.round(bank*.51),3],
        [27,Math.round(bank*.37),2],[45,48,1]],P.bark);
      poly(c,[[10,101],[23,82],[39,75],[55,77],[71,70],[87,59],[100,43],
        [97,41],[84,55],[69,64],[55,69],[38,66],[23,73],[10,93]],P.barkDark);
      poly(c,[[16,90],[10,78],[0,64],[-5,53],[-8,54],[-4,68],[7,86],[13,97]],P.barkDark);
      poly(c,[[23,bank-29],[27,bank-18],[27,bank-9],[22,bank-2],[29,bank-4],
        [31,bank-11],[29,bank-21],[25,bank-31]],P.barkWarm);
      poly(c,[[7,bank+2],[15,bank-4],[22,bank-9],[22,bank-4],[16,bank+2],
        [32,bank+7],[28,bank+8],[17,bank+5],[2,bank+7]],P.bark);
      rect(c,16,Math.round(bank*.60),1,8,P.barkLight);
    }
    canopy(c,portrait?-18:-7,portrait?-1:-15);
  }
  function tuft(c,x,y,height=4,color=P.grassLight) {
    // All tuft geometry grows upward from an explicit ground anchor.
    poly(c,[[x-3,y],[x-4,y-2],[x-3,y-2],[x-2,y-1],[x-2,y-height],
      [x-1,y-height],[x,y-1],[x+2,y-height+1],[x+3,y-height+1],
      [x+2,y-1],[x+4,y-2],[x+3,y]],color);
  }
  function flower(c,x,y,light=false) {
    rect(c,x,y-4,1,4,P.grassLight);rect(c,x-2,y-2,2,1,P.grassLight);
    bloom(c,x-1,y-7,light);
  }
  function stone(c,x,y,kind=0) {
    const widths=[16,19,15],r=widths[kind];
    poly(c,[[x-r-2,y+4],[x-r+2,y+2],[x+r-1,y+2],[x+r+3,y+5],
      [x+r-3,y+7],[x-r+1,y+7]],P.grassDark);
    poly(c,[[x-r,y-1],[x-r+3,y-6],[x-6,y-10],[x+3,y-10],[x+r-4,y-6],
      [x+r,y],[x+r-2,y+4],[x+6,y+6],[x-6,y+5],[x-r+1,y+3]],P.stoneDark);
    poly(c,[[x-r+1,y-1],[x-r+4,y-6],[x-6,y-10],[x+3,y-10],[x+r-4,y-6],
      [x+7,y-2],[x+3,y+3],[x-7,y+3],[x-r+2,y+1]],P.stone);
    poly(c,[[x-r+4,y-6],[x-6,y-10],[x+3,y-10],[x+r-4,y-6],[x+5,y-3],
      [x-2,y-4],[x-6,y-2],[x-r+3,y-2]],kind===0?P.stoneWarm:P.stoneLight);
    if(kind===0) {
      poly(c,[[x-r+4,y-6],[x-6,y-10],[x-3,y-10],[x-7,y-6],[x-r+6,y-4]],P.amber);
      rect(c,x-r+2,y-1,3,1,P.stoneWarm);
    } else if(kind===1) {
      poly(c,[[x-r+4,y-6],[x-6,y-10],[x-2,y-10],[x-8,y-5],[x-r+3,y-2]],P.stoneWarm);
    }
    // Only low two-pixel occluding blades cross the rock's seated bottom edge.
    tuft(c,x-r+7,y+7,2,P.grass);
    if(kind!==2)tuft(c,x+7,y+7,2,P.grass);
  }
  function lantern(c,x,y) {
    // y is the ground plane. The emitted light stays inside discrete pixel forms.
    poly(c,[[x-11,y+7],[x-8,y+5],[x+8,y+5],[x+11,y+7],[x+10,y+9],[x-10,y+9]],P.stoneDark);
    rect(c,x-4,y,9,6,P.stone);rect(c,x-3,y,3,5,P.stoneWarm);
    rect(c,x-8,y-13,17,14,P.barkDark);
    rect(c,x-6,y-11,13,10,P.amber);rect(c,x-4,y-10,9,7,P.cream);
    rect(c,x-7,y-12,2,13,P.stoneDark);rect(c,x+6,y-12,2,13,P.stoneDark);
    rect(c,x,y-11,1,11,P.bark);rect(c,x-7,y-1,15,2,P.stoneWarm);
    poly(c,[[x-12,y-13],[x-10,y-15],[x-6,y-15],[x-4,y-18],
      [x-2,y-18],[x-1,y-20],[x+2,y-20],[x+3,y-18],[x+5,y-18],
      [x+7,y-15],[x+10,y-15],[x+12,y-13]],P.ink);
    rect(c,x-5,y-16,11,1,P.stoneLight);rect(c,x-3,y-18,6,1,P.stone);
    rect(c,x-9,y-13,19,1,P.barkLight);
  }
  function foreground(c,w,h) {
    const portrait=w<=h, bank=Math.round(h*.84);
    const reach=Math.min(w-12,Math.round(w*(portrait?.68:.45)));
    // 1. Solid bank and its receding lip. Every later object has ground beneath it.
    poly(c,[[0,bank-5],[13,bank-5],[23,bank-3],[37,bank-2],[48,bank],
      [60,bank+4],[72,bank+8],[83,bank+14],[95,bank+21],[108,bank+34],
      [120,bank+49],[reach,h],[0,h]],P.grassDark);
    poly(c,[[0,bank-5],[13,bank-5],[23,bank-3],[37,bank-2],[48,bank],
      [60,bank+4],[72,bank+8],[83,bank+14],[95,bank+21],[108,bank+34],
      [103,bank+33],[91,bank+25],[80,bank+21],[72,bank+15],[61,bank+12],
      [50,bank+7],[37,bank+5],[26,bank+3],[14,bank+2],[0,bank+3]],P.grass);
    // 2. Lantern-facing ground is lit as two irregular opaque facets.
    poly(c,[[16,bank-1],[27,bank-2],[41,bank-1],[53,bank+2],[62,bank+6],
      [74,bank+10],[69,bank+15],[57,bank+16],[47,bank+19],[35,bank+16],
      [27,bank+11],[17,bank+9],[11,bank+5]],P.grassWarm);
    poly(c,[[30,bank+1],[42,bank],[53,bank+3],[59,bank+7],[56,bank+10],
      [48,bank+11],[39,bank+9],[32,bank+10],[25,bank+6]],P.grassLit);
    // 3. Tall plants behind the stones. Stone faces will occlude them next.
    for(const [x,dy,height]of [[6,-4,5],[28,1,4],[61,7,5],[81,18,5],[111,39,5]])
      tuft(c,x,bank+dy,height,x<65?P.grassLight:P.grass);
    // 4. Stones are ordered from the rear lip toward the viewer.
    stone(c,68,bank+10,0);stone(c,92,bank+27,1);stone(c,119,bank+47,2);
    // 5. Short foreground plants only touch open ground or stone bases.
    for(const [x,dy,height]of [[7,14,4],[24,20,3],[47,27,3],[72,38,3],[106,58,3]])
      if(bank+dy<h)tuft(c,x,bank+dy,height,x<48?P.grassLight:P.grass);
    for(const [x,dy,lit]of [[10,22,false],[32,32,true],[7,47,false],[58,45,false]])
      if(bank+dy<h-1)flower(c,x,bank+dy,lit);
    // Fallen petals sit flat on the bank instead of appearing to grow from rocks.
    for(const [x,dy]of [[18,9],[27,17],[45,21],[17,36],[50,37]])
      if(bank+dy<h-1)rect(c,x,bank+dy,2,1,P.flower);
    // 6. The lantern is separate from the stone group, so their silhouettes do not
    // ambiguously cross. Its stone base sits inside the illuminated grass patch.
    lantern(c,39,bank-1);
    // A low far-right bank balances the large tree without another focal object.
    poly(c,[[w-36,h],[w-29,h-4],[w-21,h-7],[w-14,h-7],[w-8,h-10],[w,h-9],[w,h]],P.grassDark);
    poly(c,[[w-27,h-4],[w-21,h-7],[w-14,h-7],[w-8,h-10],[w,h-9],[w,h-7],
      [w-11,h-6],[w-19,h-4]],P.grass);
    tuft(c,w-12,h-7,4,P.grass);
  }
  return Object.freeze({tree,foreground,palette:P});
})();
