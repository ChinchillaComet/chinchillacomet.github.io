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
    cream: '#ffddcd'
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
    [-2,3,0,5,1,'pink'],[-3,5,0,3,1,'lavender'],[1,6,0,3,1,'pink'],
    [-4,9,0,8,1,'lavender'],[-2,11,0,5,1,'waterLight'],
    [-5,.27,0,9,1,'lavender'],[6,.27,2,7,1,'waterLight'],
    [-12,.48,0,17,1,'waterLight'],[1,.48,2,11,1,'lavender'],
    [-20,.69,0,25,1,'waterLight'],[10,.69,3,17,1,'waterLight'],
    [-29,.91,0,23,1,'waterLight'],[-1,.91,3,35,1,'waterLight']
  ];
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
  }
  function draw(ctx, w, h, time = 0, options = {}) {
    const horizon = options.horizon === undefined ? Math.round(h * .64) : Math.round(options.horizon);
    const reflectionX = options.reflectionX === undefined ? Math.round(w * .78) : Math.round(options.reflectionX);
    mountain(ctx, w, horizon);
    lake(ctx, w, h, horizon, time, reflectionX);
  }
  return Object.freeze({ draw, mountain, lake, palette: P });
})();

/* Native pixel garden. Fixed silhouettes and colour clusters, no texture pass. */
globalThis.NativeGarden = (() => {
  'use strict';
  const P = Object.freeze({
    ink:'#26243e', barkDark:'#44304d', bark:'#724255', barkLight:'#a96669',
    grassDark:'#243c48', grass:'#3d5960', grassLight:'#668073', grassHigh:'#9b9b81',
    flowerShade:'#a45c86', flower:'#c87a9b', flowerLight:'#efb4c4', flowerHigh:'#ffddcd',
    stone:'#5b586d', stoneLight:'#8a8390', amber:'#edb781', cream:'#fff1d8'
  });
  function rect(c,x,y,w,h,color) { c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
  function poly(c,points,color) {
    c.fillStyle=color;
    const top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
    for(let y=top;y<bottom;y++) {
      const cuts=[];
      for(let i=0;i<points.length;i++) {
        const a=points[i],b=points[(i+1)%points.length];
        if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))cuts.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      cuts.sort((a,b)=>a-b);
      for(let i=0;i+1<cuts.length;i+=2){const x=Math.ceil(cuts[i]-.5),r=Math.ceil(cuts[i+1]-.5);if(r>x)c.fillRect(x,y,r-x,1);}
    }
  }
  function tree(c,w,h) {
    const portrait=w<=h;
    const base=Math.round(h*.87), shoulder=portrait?Math.round(h*.27):56;
    const crownY=portrait?8:-10;
    // One continuous trunk with an outward sweep. Branches are connected forms.
    if(portrait) {
      const exit=Math.round(h*.43);
      poly(c,[[-24,exit+20],[-4,exit-7],[9,132],[16,110],[31,84],[50,59],
        [62,45],[56,42],[41,54],[23,77],[8,104],[-1,129],[-14,exit-9]],P.barkDark);
      poly(c,[[-17,exit+9],[-3,exit-9],[7,131],[14,110],[29,85],[48,60],
        [33,85],[18,112],[11,134],[1,exit-6]],P.bark);
      poly(c,[[-6,exit-11],[5,132],[13,110],[9,132],[-3,exit-8]],P.barkLight);
      poly(c,[[16,107],[36,79],[59,70],[76,59],[85,44],[81,42],[72,54],[56,63],
        [32,71],[9,101]],P.barkDark);
    } else {
    poly(c,[[0,base+7],[22,base+7],[31,base-8],[29,base-28],[24,base-49],
      [26,shoulder+36],[37,shoulder+12],[54,crownY+49],[68,crownY+34],
      [62,crownY+30],[44,crownY+43],[29,shoulder+3],[18,shoulder+29],
      [15,base-48],[20,base-22],[15,base-5]],P.barkDark);
    poly(c,[[16,base+1],[25,base-7],[23,base-27],[18,base-49],[20,shoulder+32],
      [31,shoulder+10],[47,crownY+47],[60,crownY+37],[45,crownY+51],
      [26,shoulder+16],[23,shoulder+37],[21,base-49],[27,base-27],[29,base-8],[22,base+1]],P.bark);
    poly(c,[[23,base-8],[24,base-24],[20,base-46],[22,shoulder+39],[26,shoulder+29],
      [24,shoulder+44],[23,base-47],[28,base-25],[27,base-10]],P.barkLight);
    // Long side branch supports the canopy tip, instead of cutting gaps from it.
    poly(c,[[31,shoulder+15],[47,crownY+59],[65,crownY+57],[88,crownY+44],
      [100,crownY+31],[97,crownY+29],[84,crownY+40],[63,crownY+51],
      [45,crownY+53],[37,shoulder+9]],P.barkDark);
    poly(c,[[19,shoulder+33],[10,shoulder+13],[0,crownY+49],[0,crownY+40],
      [15,shoulder+10],[24,shoulder+23]],P.barkDark);
    }
    const x=portrait?-17:-7, y=crownY;
    const shape=(points,color)=>poly(c,points.map(p=>[p[0]+x,p[1]+y]),color);
    // Broad connected foliage masses, with asymmetric scallops and small rim
    // accents. The shadow is a continuous underside, never a cut-out.
    shape([[-15,-5],[19,-5],[19,-8],[38,-8],[38,-5],[51,-5],[51,-7],
      [66,-7],[66,-3],[77,-3],[77,1],[88,1],[88,3],[94,3],[94,8],
      [103,8],[103,12],[111,12],[111,16],[116,16],[116,21],[113,21],
      [113,24],[120,24],[120,28],[124,28],[124,32],[119,32],[119,37],
      [124,37],[124,41],[117,41],[117,46],[108,46],[108,50],[99,50],
      [99,53],[90,53],[90,57],[78,57],[78,61],[69,61],[69,63],
      [62,63],[62,67],[49,67],[49,71],[37,71],[37,68],[24,68],
      [24,71],[13,71],[13,67],[2,67],[2,63],[-9,63],[-9,59],[-15,59]],P.flowerShade);
    shape([[-15,-5],[19,-5],[19,-8],[38,-8],[38,-5],[51,-5],[51,-7],
      [66,-7],[66,-3],[77,-3],[77,1],[88,1],[88,3],[94,3],[94,8],
      [103,8],[103,12],[111,12],[111,16],[116,16],[116,20],[110,20],
      [110,25],[118,25],[118,29],[122,29],[122,32],[115,32],[115,36],
      [119,36],[119,39],[111,39],[111,44],[101,44],[101,48],[90,48],
      [90,49],[78,49],[78,53],[66,53],[66,58],[56,58],[56,63],
      [42,63],[42,60],[33,60],[33,65],[21,65],[21,61],[10,61],
      [10,58],[-2,58],[-2,55],[-10,55],[-10,51],[-15,51]],P.flower);
    shape([[-15,-5],[20,-5],[20,-8],[37,-8],[37,-5],[43,-5],
      [43,0],[48,0],[48,6],[45,6],[45,10],[39,10],[39,13],[32,13],
      [32,17],[21,17],[21,15],[15,15],[15,20],[5,20],[5,17],[-3,17],
      [-3,21],[-12,21],[-12,18],[-15,18]],P.flowerLight);
    shape([[54,-4],[65,-4],[65,-1],[72,-1],[72,2],[82,2],[82,5],
      [90,5],[90,9],[99,9],[99,13],[107,13],[107,16],[111,16],[111,19],
      [106,19],[106,23],[99,23],[99,26],[90,26],[90,23],[84,23],[84,21],
      [78,21],[78,16],[72,16],[72,12],[64,12],[64,8],[58,8],[58,3],[54,3]],P.flowerLight);
    shape([[-15,30],[-6,30],[-6,27],[3,27],[3,24],[12,24],[12,27],
      [17,27],[17,31],[24,31],[24,35],[29,35],[29,39],[26,39],
      [26,44],[19,44],[19,48],[10,48],[10,45],[3,45],[3,48],
      [-5,48],[-5,44],[-12,44],[-12,40],[-15,40]],P.flowerLight);
    shape([[35,25],[43,25],[43,22],[51,22],[51,25],[59,25],[59,29],
      [66,29],[66,31],[74,31],[74,35],[81,35],[81,39],[75,39],[75,43],
      [68,43],[68,46],[62,46],[62,51],[51,51],[51,55],[42,55],[42,52],
      [34,52],[34,48],[29,48],[29,43],[34,43],[34,38],[31,38],[31,32],[35,32]],P.flowerLight);
    shape([[94,32],[100,32],[100,30],[106,30],[106,33],[111,33],
      [111,36],[106,36],[106,39],[99,39],[99,37],[94,37]],P.flowerLight);
    // Sparse smaller clusters follow the main masses rather than forming a
    // uniform texture. Their sizes deliberately differ from the broad lights.
    for(const [a,b,width,height]of [[7,52,5,2],[21,55,3,1],[51,59,4,1],
      [77,46,5,1],[83,43,2,2],[102,44,3,1],[67,19,3,2],[24,21,3,1]])
      rect(c,x+a,y+b,width,height,P.flowerLight);
    for(const [a,b]of [[60,-1],[85,7],[43,25],[10,27]]) {
      rect(c,x+a,y+b,3,1,P.flowerHigh);
      rect(c,x+a,y+b+1,1,1,P.flowerHigh);
    }
  }
  function flower(c,x,y,colour=P.flowerLight) {
    rect(c,x,y,1,5,P.grassLight);
    rect(c,x-2,y+3,2,1,P.grassLight);
    rect(c,x+1,y+2,2,1,P.grassLight);
    rect(c,x-1,y-2,3,1,colour);rect(c,x-2,y-1,5,1,colour);
    rect(c,x-1,y,3,1,colour);rect(c,x,y-1,1,1,P.cream);
  }
  function tuft(c,x,y,tall=6) {
    poly(c,[[x-4,y],[x-5,y-4],[x-2,y-2],[x-2,y-tall],[x,y-3],[x+3,y-tall+1],
      [x+2,y-1],[x+5,y-3],[x+4,y]],P.grassLight);
  }
  function foreground(c,w,h) {
    const portrait=w<=h;
    const bank=Math.round(h*.84);
    const reach=Math.min(w-12,Math.round(w*(portrait?.68:.44)));
    poly(c,[[0,bank-5],[17,bank-6],[27,bank-3],[42,bank-2],[53,bank+3],
      [67,bank+5],[79,bank+11],[91,bank+15],[reach, h-2],[reach+12,h],[0,h]],P.grassDark);
    poly(c,[[0,bank-7],[15,bank-7],[24,bank-5],[37,bank-5],[43,bank-2],[54,bank],
      [55,bank+3],[67,bank+3],[73,bank+6],[67,bank+8],[56,bank+8],[51,bank+5],
      [38,bank+3],[31,bank+1],[17,bank+1],[10,bank+3],[0,bank+2]],P.grass);
    poly(c,[[0,bank-7],[15,bank-7],[24,bank-5],[37,bank-5],[43,bank-2],[34,bank-2],
      [26,bank-3],[20,bank-2],[12,bank-4],[0,bank-3]],P.grassLight);
    // Three shoreline stones, each with a single lit plane.
    for(const [x,y,size]of [[60,bank+9,13],[81,bank+18,17],[102,Math.min(h-4,bank+27),14]]) {
      poly(c,[[x-size,y],[x-size+2,y-4],[x-5,y-7],[x+2,y-7],[x+size-4,y-4],
        [x+size,y],[x+size-2,y+3],[x-7,y+4]],P.stone);
      poly(c,[[x-size+2,y-4],[x-5,y-7],[x+2,y-7],[x+size-4,y-4],[x+3,y-3],
        [x-5,y-1],[x-size+3,y-1]],P.stoneLight);
    }
    for(const [x,offset,tall]of [[7,-7,6],[40,-2,6],[54,2,5],[72,9,4],[16,12,8],
      [37,21,5],[66,25,6],[91,32,5]])tuft(c,x,Math.min(h-1,bank+offset),tall);
    for(const [x,offset,tone]of [[8,4,P.flower],[36,7,P.flowerLight],[48,15,P.flower],
      [24,25,P.flowerLight],[57,30,P.flowerLight]]) {
      if(bank+offset<h-3)flower(c,x,bank+offset,tone);
    }
    // A small garden lantern: opaque warm pixels, no bloom or blur.
    const lx=45,ly=bank-11;
    rect(c,lx-2,ly+10,5,5,P.ink);rect(c,lx-4,ly+14,9,2,P.stone);
    rect(c,lx-4,ly+1,9,9,P.barkDark);rect(c,lx-2,ly+3,5,5,P.amber);
    rect(c,lx-1,ly+3,3,3,P.cream);rect(c,lx,ly+3,1,6,P.barkDark);
    poly(c,[[lx-7,ly+2],[lx-6,ly],[lx-3,ly],[lx-2,ly-2],[lx+2,ly-2],[lx+3,ly],
      [lx+6,ly],[lx+7,ly+2]],P.ink);
    rect(c,lx-3,ly,7,1,P.stoneLight);
    // A low right bank balances the tree while leaving the lake open.
    poly(c,[[w-42,h],[w-31,h-4],[w-27,h-7],[w-16,h-9],[w-9,h-11],[w,h-10],[w,h]],P.grassDark);
    poly(c,[[w-27,h-7],[w-16,h-9],[w-9,h-11],[w,h-10],[w,h-8],[w-12,h-7],[w-20,h-5]],P.grass);
    tuft(c,w-12,h-9,5);
    flower(c,w-6,h-8,P.flowerLight);
  }
  return Object.freeze({tree,foreground,palette:P});
})();
