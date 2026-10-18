/* Native artwork: authored opaque cells on one logical pixel grid. */

globalThis.NativeSky = (() => {
  'use strict';
  const P=Object.freeze({deep:'#191c36',mid:'#292a44',sky:'#3e3755',haze:'#594563',
    aura:'#323a53',halo:'#4b5c76',moonShade:'#c0cddd',moon:'#e8eeee',
    star:'#728fa9',light:'#bbc5d8',cream:'#fff1d8'});
  const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  function sky(c,w,h,horizon) {
    rect(c,0,0,w,h,P.deep);
    const bands=[
      [Math.round(horizon*.12),27,P.mid,[-4,-7,-3,1,3,0,-2]],
      [Math.round(horizon*.47),28,P.sky,[5,1,-4,-6,-1,4,6]],
      [Math.round(horizon*.79),24,P.haze,[-1,2,5,3,-2,-4,-1]],
    ];
    for(const [height,depth,color,curve]of bands)for(let x=0;x<w;x++){
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
  function moon(c,x,y) {
    // The aura thins into the existing sky, rather than ending at a solid ring.
    // Its ordered coverage changes; all drawn cells remain fully opaque.
    for(let dy=-24;dy<=24;dy++)for(let dx=-26;dx<=26;dx++){
      const radius=Math.sqrt(dx*dx*.9+dy*dy);
      if(radius<10||radius>25)continue;
      const density=Math.max(0,1-(radius-10)/15);
      const threshold=Math.floor(density*density*13);
      if(bayer[(y+dy+1024)%4][(x+dx+1024)%4]<threshold)
        rect(c,x+dx,y+dy,1,1,radius<12.5?P.halo:P.aura);
    }
    // A small cool ivory disc; short asymmetrical crater groups imply its form.
    const rows=[6,10,14,16,18,18,20,20,20,20,20,20,20,20,18,18,16,14,10,6];
    for(let row=0;row<rows.length;row++)rect(c,x-rows[row]/2,y-10+row,rows[row],1,P.moon);
    for(const [dx,dy,width]of [[-8,3,2],[-8,4,3],[-7,5,2],[-6,6,4],[-5,7,3],
      [3,3,3],[4,4,2],[6,-2,2],[-3,-5,2]])rect(c,x+dx,y+dy,width,1,P.moonShade);
    rect(c,x-2,y-8,4,1,P.cream);rect(c,x+2,y-7,2,1,P.cream);
  }
  const constellations=[
    [.39,.064,1],[.48,.092,0],[.58,.045,1],[.66,.11,0],[.89,.068,1],[.95,.162,0],
    [.38,.19,0],[.47,.22,1],[.59,.168,0],[.67,.245,1],[.88,.28,0],[.95,.36,1],
    [.35,.335,0],[.43,.375,0],[.54,.31,1],[.70,.36,0],[.82,.39,0],
    [.26,.18,0],[.54,.135,0],[.74,.075,0],[.91,.405,0]
  ];
  function stars(c,w,h,position){
    const list=constellations.map(([a,b,bright],i)=>({x:Math.round(w*a),y:Math.round(h*b),bright,phase:i*1.63}));
    const visible=list.filter(star=>(star.x-position.x)**2+(star.y-position.y)**2>28**2);
    for(const star of visible){
      rect(c,star.x,star.y,1,1,star.bright?P.light:P.star);
      if(star.bright&&[0,4].includes(list.indexOf(star))){
        rect(c,star.x-1,star.y,3,1,P.star);rect(c,star.x,star.y-1,1,3,P.star);
        rect(c,star.x,star.y,1,1,P.light);
      }
    }
    return visible;
  }
  function draw(c,w,h,position,horizon=Math.round(h*.64)){
    sky(c,w,h,horizon);moon(c,position.x,position.y);return stars(c,w,h,position);
  }
  return Object.freeze({draw,sky,moon,stars,palette:P});
})();

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
      "s": "#504563",
      "b": "#79637f",
      "l": "#ad859e",
      "r": "#cf9faa"
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
      "s": "#504563",
      "b": "#79637f",
      "l": "#ad859e",
      "r": "#cf9faa"
    }
  },
  "wisp": {
    "rows": [
      "..........................................................................",
      "..........................................................................",
      "....................................rrrrrrrrr.............................",
      "...............................rrrrrrrrrllllllllls........................",
      ".............rrrrrl......rrrrrrrrllllllllllllllllllllls...................",
      "..........rrrrrrllllllllbrrrrrlllllllllllllllllllllllllbbbs...............",
      "........rrrrrllllllllllllllllllblllllllllllllllllllllllbbbbbbbs...........",
      "......ssblllllllllllllllllllllbbbbllllllllllllllllllbbbbbllllllbbss.......",
      "...sssbbllllllllllllllllllllbbbbbbbbbbbllllllllbbbbbbbbblllllllllbbsss....",
      "..sssssbbbbllllllllllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllbbbbsssss..",
      "....sssssssssbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbsssssssss....",
      "........ssssssssssssssbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbssssssssssss........",
      ".............ssssssssssssssssssbbbbbbbbbbbbbbbbssssssssssssss.............",
      "....................ssssssssssssssssssssssssssssssssssss..................",
      "..................................sssssssssssss...........................",
      "..........................................................................",
      ".........................................................................."
    ],
    "palette": {
      ".": null,
      "s": "#504563",
      "b": "#79637f",
      "l": "#ad859e",
      "r": "#cf9faa"
    }
  },
  "puff": {
    "rows": [
      "............................................",
      "............................................",
      "...................rrrrrr...................",
      "................rrrrrrllllls................",
      "..............rrrrrlllllllllls..............",
      "............rrrrrllllllllllllls.............",
      "...........rrrrlllllllllllllllbs............",
      "..........rrrrllllllllllllllllbs............",
      ".......rrrrrrllllllllllllllllbbs............",
      ".....rrrrllllllllllllllllllllbbbbs..........",
      "....sblllllllllllllllllllllllbbbbbs.........",
      "....sbllllllllllllllllllllllbbbbbbbs........",
      "...sbbllllllllbbbllllllllbbbbbbllllbss......",
      "..ssbbblllllllbbbllllllbbbbbbblllllllbss....",
      "..sssbbblllllbbbbbbbbbbbbbbbbbllllllllbss...",
      "...sssbbbbbbbbbbbbbbbbbbbbbbbbbllllllbbss...",
      "...ssssbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbssss...",
      "....ssssbbbbbbbbbbbbbbbbbbbbbbbbbbbbsss.....",
      ".....sssssbbbbbbbbbbbbbbbbbbbbbbbbssss......",
      "......sssssssssbbbbbbbbbbbbbbbssssss........",
      "........sssssssssssbbbbbbbsssssss...........",
      "...........ssssssssssssssssssss.............",
      "................sssssssssss.................",
      "...................ssss.....................",
      "............................................",
      "............................................"
    ],
    "palette": {
      ".": null,
      "s": "#504563",
      "b": "#79637f",
      "l": "#ad859e",
      "r": "#cf9faa"
    }
  }
});

/* Slow depth planes share the same authored sprites. The two nearer clouds
 * have different bounded wind phases around separated positions: they can
 * change relative speed without catching up or crowding their similar rows.
 * A slower cloud passes behind them on a lower, muted plane. Its deliberate
 * vertical offset permits layered overlaps, while the reserved foreground
 * gap prevents all three clouds stacking into a tower. */
globalThis.NativeCloudMotion = (() => {
  'use strict';
  const names = Object.freeze(['wide', 'small', 'wisp', 'puff']);
  const original = globalThis.NativeClouds.wide.palette;
  const sky = globalThis.NativeSky?.palette;
  const palettes = Object.freeze({
    rear: Object.freeze({ '.': null, s: sky?.mid ?? '#292a44',
      b: sky?.sky ?? '#3e3755', l: original.s, r: original.b }),
    middle: Object.freeze({ '.': null, s: sky?.sky ?? '#3e3755',
      b: original.s, l: original.b, r: original.l }),
    front: Object.freeze({ ...original }),
  });
  function mix(value) {
    value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
    return (value ^ (value >>> 15)) >>> 0;
  }
  function create(width, height, makeCanvas, options = {}) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new RangeError('Cloud motion requires positive native canvas dimensions.');
    }
    const seed = (options.seed ?? 0x434c4f55) >>> 0;
    const sprites = globalThis.NativeClouds;
    const bitmaps = new Map(), bounds = new Map();
    for (const name of names) {
      const cloud = sprites[name], w = cloud.rows[0].length, h = cloud.rows.length;
      let left = w, top = h, right = -1, bottom = -1;
      for (const [plane, palette] of Object.entries(palettes)) {
        const bitmap = makeCanvas(w, h), context = bitmap.getContext('2d');
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const colour = palette[cloud.rows[y][x]];
          if (!colour) continue;
          context.fillStyle = colour;
          context.fillRect(x, y, 1, 1);
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        bitmaps.set(`${plane}:${name}`, bitmap);
      }
      bounds.set(name, Object.freeze({ left, top, right, bottom }));
    }
    const maximumWidth = Math.max(...names.map(name => sprites[name].rows[0].length));
    const maximumHeight = Math.max(...names.map(name => sprites[name].rows.length));
    const profiles = Object.freeze({
      rear: { baseSpeed: .31, variation: .03, period: 430, windPhase: 4.2 },
      middle: { baseSpeed: .44, variation: .045, period: 590, windPhase: 2.1 },
      front: { baseSpeed: .44, variation: .05, period: 730, windPhase: .3 },
    });
    const windMargin = Math.ceil(2 * (profiles.middle.variation * profiles.middle.period
      + profiles.front.variation * profiles.front.period) / (Math.PI * 2)) + 1;
    const slotSpacing = Math.max(maximumWidth + 20 + windMargin,
      Math.ceil((width + maximumWidth + 8) / 2));
    const entryX = width + 4, distance = slotSpacing * 2;
    const frontPhase = entryX - Math.round((width - maximumWidth) / 2);
    const lastTop = Math.max(0, Math.floor(height * .44) - maximumHeight);
    const depthStep = Math.min(18, lastTop);
    const frontTop = Math.max(0,
      Math.min(Math.round(height * .25), lastTop - depthStep));
    const lanes = Object.freeze([
      { plane: 'rear', initial: 'small', phase: 29, top: frontTop + depthStep },
      { plane: 'middle', initial: 'small',
        phase: (frontPhase - slotSpacing + distance) % distance,
        top: frontTop + Math.max(0, depthStep - 14) },
      { plane: 'front', initial: 'wide', phase: frontPhase, top: frontTop },
    ].map((lane, index) => {
      const profile = profiles[lane.plane], frequency = Math.PI * 2 / profile.period;
      return Object.freeze({ ...lane, ...profile, id: index, depth: index,
        frequency, amplitude: profile.variation / frequency,
        initialSine: Math.sin(profile.windPhase),
        salt: mix(seed ^ Math.imul(index + 1, 0x9e3779b9)),
      });
    }));
    function distanceAt(lane, time) {
      return lane.baseSpeed * time + lane.amplitude
        * (Math.sin(lane.frequency * time + lane.windPhase) - lane.initialSine);
    }
    // The positive speed bounds make this inverse unique. Its fixed bracket
    // comes from the bounded wind displacement, so direct seeks need no
    // simulation, accumulated frame deltas, or remembered animation history.
    function timeAtDistance(lane, target) {
      let low = (target - 2 * lane.amplitude) / lane.baseSpeed;
      let high = (target + 2 * lane.amplitude) / lane.baseSpeed;
      for (let i = 0; i < 32; i++) {
        const middle = (low + high) / 2;
        if (distanceAt(lane, middle) < target) low = middle;
        else high = middle;
      }
      return (low + high) / 2;
    }
    function cloudsAt(time = 0) {
      const t = Number.isFinite(time) ? Math.max(0, time) : 0;
      return lanes.map(lane => {
        const travel = lane.phase + Math.floor(distanceAt(lane, t));
        const cycle = Math.floor(travel / distance);
        const name = cycle === 0 ? lane.initial
          : names[mix(lane.salt ^ Math.imul(cycle, 0x85ebca6b)) % names.length];
        const bitmap = bitmaps.get(`${lane.plane}:${name}`), body = bounds.get(name);
        const x = entryX - (travel - cycle * distance);
        const y = lane.top + Math.floor((maximumHeight - bitmap.height) / 2);
        const nextWrap = timeAtDistance(lane, (cycle + 1) * distance - lane.phase);
        const previousWrap = timeAtDistance(lane, cycle * distance - lane.phase);
        return Object.freeze({
          id: lane.id, depth: lane.depth, plane: lane.plane, palette: palettes[lane.plane],
          name, x, y, cycle, width: bitmap.width, height: bitmap.height, bounds: body,
          speed: lane.baseSpeed + lane.variation * Math.cos(lane.frequency * t + lane.windPhase),
          visible: x + body.right >= 0 && x + body.left < width,
          cycleDuration: nextWrap - previousWrap, nextWrap,
        });
      });
    }
    function draw(context, time = 0) {
      const frame = cloudsAt(time);
      context.imageSmoothingEnabled = false;
      for (const cloud of frame) {
        if (cloud.visible) context.drawImage(bitmaps.get(`${cloud.plane}:${cloud.name}`), cloud.x, cloud.y);
      }
      return frame;
    }
    return Object.freeze({ width, height, seed, draw, cloudsAt });
  }
  return Object.freeze({ create, palettes });
})();

globalThis.NativeLandscape = (() => {
  'use strict';
  const P = Object.freeze({
    far: '#625979', farShade: '#545373', middle: '#4c4e70',
    middleShade: '#37435d', near: '#233147', water: '#263c55',
    waterGlow: '#2d445d', waterLight: '#45647e', moonWater: '#728fa9',
    lavender: '#c0cddd', pink: '#dab5cc', cream: '#fff1d8',
    amber: '#ecb779', padShadow: '#233c45', pad: '#385b5b',
    padLight: '#608278', lotusShade: '#563750', lotus: '#a36c8d'
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
  // Five small, hand-drawn cedar crowns. Each scanline is a connected native
  // pixel run; unequal bough shelves and narrow necks keep the forest from
  // reading as a row of repeated triangles. None of these profiles is scaled.
  const cedars=Object.freeze([
    [[0,1],[0,1],[-1,2],[-1,2],[-2,3],[-1,2],[-2,3],
      [-3,3],[-2,2],[-2,3],[-3,4],[-2,3],[-1,2],[-1,2]],
    [[0,1],[-1,1],[-1,2],[-2,3],[-1,2],[-2,3],[-3,3],
      [-2,2],[-3,4],[-4,4],[-3,3],[-2,3],[-1,2]],
    [[0,1],[0,1],[-1,2],[0,2],[-1,3],[-2,3],[-1,2],
      [-2,3],[-3,4],[-2,3],[-1,2]],
    [[0,1],[0,1],[-1,2],[-1,2],[-2,3],[-1,2],[-2,3],
      [-1,2],[-1,1]],
    [[0,1],[0,1],[-1,2],[-2,2],[-1,2],[-2,3],[-3,3],
      [-2,3],[-3,4],[-2,3],[-3,4],[-4,5],[-3,4],
      [-3,3],[-2,3],[-1,2]]
  ]);
  function cedar(ctx,x,base,kind,colour,lit=false,mirror=false){
    const rows=cedars[kind],top=base-rows.length;
    for(let row=0;row<rows.length;row++){
      const [left,right]=rows[row];
      rect(ctx,x+(mirror?1-right:left),top+row,right-left,1,colour);
    }
    rect(ctx,x,base-2,1,4,colour);
    if(lit){
      // The lit face is attached to the upper surface of two right boughs.
      // A continuous shadow shelf remains beneath each very short accent.
      for(const row of [Math.floor(rows.length*.43),Math.floor(rows.length*.70)]){
        const [left,right]=rows[row],length=Math.max(1,(mirror?-left:right-1));
        rect(ctx,x,top+row,length,1,P.waterGlow);
      }
    }
  }
  function forest(ctx,w,horizon){
    const edge=Math.floor(w*.32);
    // The back belt is deliberately the darkest, as a sheltered forest behind
    // the moon-facing boughs. Its tightly spaced crowns and high understorey
    // make a continuous wooded slope, rather than isolated trees on a line.
    const backForms=[2,3,1,3,2,1,3,2,3,1,2];
    const backSteps=[5,6,5,7,5,6,6,5,7,5,6];
    const backLevels=[0,1,0,-1,-1,0,1,0,-1,0,0];
    for(let x=-2,index=0;x<edge-2;x+=backSteps[index++%backSteps.length]){
      const phase=index%backForms.length;
      cedar(ctx,x,horizon-8+backLevels[phase],backForms[phase],P.near,false,index%3===1);
    }
    poly(ctx,[[0,horizon-10],[Math.round(edge*.18),horizon-10],
      [Math.round(edge*.35),horizon-9],[Math.round(edge*.57),horizon-9],
      [Math.round(edge*.76),horizon-7],[edge-7,horizon-6],
      [edge,horizon-3],[edge,horizon+1],[0,horizon+1]],P.near);

    // A quieter blue middle layer makes the dark tips behind it readable.
    // Irregularly spaced groups leave narrow views into the rear belt; their
    // lower boughs overlap in depth instead of producing touching identical tips.
    const middleForms=[0,2,1,3,4,2,0,1,3,2,1];
    const middleSteps=[8,7,9,6,8,9,7,8,6,9,8];
    const middleLevels=[0,-1,0,1,0,-1,0,0,1,0,-1];
    for(let x=1,index=0;x<edge-7;x+=middleSteps[index++%middleSteps.length]){
      const phase=index%middleForms.length;
      cedar(ctx,x,horizon-4+middleLevels[phase],middleForms[phase],P.waterGlow,false,index%4===2);
    }
    poly(ctx,[[0,horizon-6],[Math.round(edge*.23),horizon-6],
      [Math.round(edge*.46),horizon-5],[Math.round(edge*.72),horizon-4],
      [edge-10,horizon-3],[edge-3,horizon-1],
      [edge-3,horizon+1],[0,horizon+1]],P.waterGlow);

    // The smallest near crowns step down toward the water at the right edge.
    // Sparse attached highlights describe whole branch faces, without stipple.
    const frontForms=[1,3,2,0,2,1,3,0,2,3];
    const frontSteps=[11,9,10,12,9,11,10,9,12,10];
    for(let x=-3,index=0;x<edge-13;x+=frontSteps[index++%frontSteps.length]){
      const kind=frontForms[index%frontForms.length];
      cedar(ctx,x,horizon-1+(index%3===1?1:0),kind,P.padShadow,index%3===1,index%4===1);
    }
    cedar(ctx,edge-11,horizon-1,3,P.padShadow,false,true);
    // Joined root masses disappear behind the existing wooded shoreline.
    poly(ctx,[[0,horizon-4],[Math.round(edge*.27),horizon-4],
      [Math.round(edge*.52),horizon-3],[Math.round(edge*.74),horizon-3],
      [edge-12,horizon-2],[edge-5,horizon-1],[edge,horizon],
      [edge,horizon+1],[0,horizon+1]],P.padShadow);
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
    forest(ctx,w,horizon);
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
  // The pool of moonlight is a low-contrast, connected reflection. Its broadening
  // contours turn and overlap like water; the brightest marks are kept sparse.
  function moonlight(ctx,w,h,horizon,time,reflectionX) {
    const depth=h-horizon, moon=Math.round(reflectionX);
    const vertical=f=>horizon+Math.round(f*depth);
    // Low-contrast planes spread sideways across the surface. Separate coves
    // of dark water keep the reflection from becoming a filled cone or beam.
    const spill=[
      {x:-4,y:.025,points:[[1,0],[8,0],[8,3],[12,3],[12,5],[9,5],[9,8],[-3,8],[-3,5],[0,5],[0,2]]},
      {x:-12,y:.145,points:[[4,0],[18,0],[18,3],[25,3],[25,5],[16,5],[16,8],[-3,8],[-3,6],[1,6],[1,3],[4,3]]},
      {x:-21,y:.275,points:[[7,0],[28,0],[28,2],[38,2],[38,5],[29,5],[29,7],[15,7],[15,10],[-5,10],[-5,7],[2,7],[2,4],[7,4]]},
      {x:-30,y:.45,points:[[9,0],[37,0],[37,2],[50,2],[50,6],[40,6],[40,9],[13,9],[13,11],[-6,11],[-6,8],[1,8],[1,5],[9,5]]},
      {x:-46,y:.645,points:[[15,0],[60,0],[60,2],[72,2],[72,6],[62,6],[62,8],[34,8],[34,12],[5,12],[5,9],[-4,9],[-4,6],[15,6]]},
      {x:-58,y:.84,points:[[15,0],[61,0],[61,2],[86,2],[86,5],[99,5],[99,8],[88,8],[88,10],[50,10],[50,14],[7,14],[7,12],[-3,12],[-3,9],[19,9],[19,6],[15,6]]}
    ];
    for(const pool of spill)poly(ctx,pool.points.map(([x,y])=>[moon+pool.x+x,vertical(pool.y)+y]),P.waterGlow);
    // Short, asymmetric water planes sit inside the dim reflection. Their
    // heights are fixed native pixels, while their spacing follows perspective.
    // Keeping the planes mostly horizontal avoids a vertical column of light.
    const pools=[
      {x:-3,y:.05,points:[[0,0],[8,0],[6,1],[10,2],[6,3],[-2,3],[-2,1]]},
      {x:-5,y:.16,points:[[0,0],[12,0],[12,1],[7,1],[7,2],[-3,2],[-3,1]]},
      {x:-11,y:.30,points:[[0,0],[15,0],[15,1],[24,1],[24,3],[17,3],[17,4],[-5,4],[-5,2],[0,2]]},
      {x:-17,y:.47,points:[[0,0],[32,0],[32,2],[25,2],[25,3],[34,3],[34,4],[8,4],[8,6],[-7,6],[-7,4],[-2,4],[-2,2]]},
      {x:-29,y:.67,points:[[0,0],[22,0],[22,1],[48,1],[48,3],[40,3],[40,4],[8,4],[8,6],[-3,6],[-3,3],[0,3]]},
      {x:-40,y:.87,points:[[0,0],[36,0],[36,2],[68,2],[68,4],[53,4],[53,5],[20,5],[20,7],[-7,7],[-7,5],[5,5],[5,3],[0,3]]}
    ];
    for(const pool of pools)poly(ctx,pool.points.map(([x,y])=>[moon+pool.x+x,vertical(pool.y)+y]),P.waterLight);
    // Unequal shadow tongues interrupt the edge of the pool; their placement is
    // irregular and never repeats a stripe across its full width.
    const shadows=[[-13,.20,9,1],[6,.30,15,1],[-30,.39,23,2],[7,.49,18,1],
      [-37,.56,21,2],[12,.70,25,1],[-45,.76,29,2],[20,.91,22,1],[-31,.95,38,2]];
    for(const [x,y,width,thickness] of shadows)rect(ctx,moon+x,vertical(y),width,thickness,P.water);
    const sway=[0,0,1,1,0,0,-1,-1],phase=Math.floor(Math.max(time,0)*3)%8;
    // Tiny distant glints open into a few quiet horizontal accents close by.
    const glints=[[-2,.025,4,0],[-4,.072,7,1],[1,.125,4,0],[-6,.16,6,0],
      [-5,.30,8,1],[0,.32,6,0],[-11,.47,10,1],[5,.49,8,0],
      [-21,.67,11,0],[-6,.69,15,1],[-33,.87,14,0],[8,.89,11,0]];
    for(const [i,[x,y,width,bright]]of glints.entries()) {
      const drift=y<.13?0:sway[(phase+i*3)%8];
      rect(ctx,moon+x+drift,vertical(y),width,1,bright?P.lavender:P.moonWater);
    }
    rect(ctx,moon-1,horizon+1,2,1,P.cream);
  }
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
  const smallLotusRows = ['...l...','.llhll.','sllhlls','.sllls.','..ddd..'];
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
  function waterPlants(w,h,horizon,visitorBounds=globalThis.NativeChinchilla?.create(w,h).bounds){
    const depth=h-horizon,portrait=w<=h,smallPortrait=portrait&&w<180;
    const moon=Math.round(w*.78);
    // Broad leaves remain near the viewer. Compact portraits pull the lowest
    // groups into the visible channel before the two banks and animal meet.
    const groups=[
      {x:portrait?Math.min(Math.round(w*.70),w-57):Math.round(w*.61),
        y:smallPortrait?Math.round(h*.80)-8:
          horizon+Math.round(depth*.72),kind:0},
      {x:Math.round(w*.82),
        y:smallPortrait?Math.min(h-64,horizon+Math.round(depth*.47)):
          horizon+Math.round(depth*.47),kind:1},
      {x:Math.round(w*(portrait?.74:.80)),
        y:smallPortrait?Math.round(h*.80)+13:
          Math.min(h-15,horizon+Math.round(depth*.84)),kind:2},
      {x:Math.max(24,moon-35),y:horizon+Math.round(depth*(smallPortrait?.22:.29)),kind:3},
      {x:Math.min(w-16,moon+33),y:horizon+Math.round(depth*.22),kind:4}
    ];
    // These extents include every leaf, flower and submerged shadow cell.
    // The visitor supplies its own bounds, so a taller pose needs no duplicate
    // origin or silhouette dimensions in the water-garden layout.
    const extents=[[-12,-5,18,9],[-10,-3,8,5],[-9,0,8,5],[-6,-4,14,7],[-5,-4,8,5]];
    const bounds=group=>{const [left,top,right,bottom]=extents[group.kind];
      return {x:group.x+left,y:group.y+top,width:right-left+1,height:bottom-top+1};};
    const overlaps=(a,b)=>a.x<=b.x+b.width+1&&a.x+a.width+1>=b.x
      &&a.y<=b.y+b.height+1&&a.y+a.height+1>=b.y;
    const garden=globalThis.NativeGarden;
    const leftBank=garden?.groundGeometry(w,h),rightBank=garden?.rightBankGeometry(w,h);
    const placed=[],relocate=[];
    function fits(group){
      const box=bounds(group),bottom=box.y+box.height-1,right=box.x+box.width-1;
      return box.y>horizon+8&&bottom<h-2&&box.x>1&&right<w-2
        &&box.x>(leftBank?.edgeAt(bottom)??0)+2
        &&right<(rightBank?.edgeAt(bottom)??w)-2
        &&(!visitorBounds||!overlaps(box,visitorBounds))
        &&placed.every(other=>!overlaps(box,bounds(other)));
    }
    // Keep every unobstructed group at its authored location. Recompose only
    // displaced groups, checking both banks and complete leaf/shadow extents;
    // pushing a pad left of the animal alone can strand it on the opposite bank.
    for(const group of groups)(fits(group)?placed:relocate).push(group);
    for(const group of relocate){
      let best=null,bestCost=Infinity;
      for(let up=0;up<=Math.min(120,group.y-horizon-8);up++){
        if(up*up>bestCost)break;
        for(let dx=-72;dx<=72;dx++){
          const cost=dx*dx*1.25+up*up;
          if(cost>=bestCost)continue;
          const candidate={x:group.x+dx,y:group.y-up,kind:group.kind};
          if(fits(candidate)){best=candidate;bestCost=cost;}
        }
      }
      if(best){group.x=best.x;group.y=best.y;}
      placed.push(group);
    }
    return Object.freeze(groups.map(group=>Object.freeze(group)));
  }
  function lilyPads(ctx,w,h,horizon,time,groups=waterPlants(w,h,horizon)) {
    const palette={s:P.lotus,l:P.pink,h:P.cream,d:P.lotusShade,g:P.padShadow};
    const phase=Math.floor(Math.max(time,0)*2)%8;
    const sway=[0,0,1,1,0,0,-1,-1];
    for (const [i,group] of groups.entries()) {
      const {x,y,kind}=group,drift=sway[(phase+i*2)%8];
      // Quiet surface rings sit around stationary leaves and their attached flowers.
      rect(ctx,x-(kind>=3?9:12)-drift,y+7,kind>=3?6:9,1,P.waterLight);
      rect(ctx,x+7+drift,y+8,kind>=3?8:12,1,P.waterLight);
      if(kind===0) {
        leaf(ctx,x+8,y-3,'medium');
        leaf(ctx,x-12,y+4,'small');
        leaf(ctx,x-9,y,'large');
        cells(ctx,lotusRows,x-5,y-5,palette);
        rect(ctx,x-4,y+9,5,1,P.lotusShade);
      } else if(kind===1) {
        leaf(ctx,x-10,y+3,'small');
        leaf(ctx,x-2,y,'medium');
        cells(ctx,budRows,x+1,y-3,palette);
      } else if(kind===2) {
        leaf(ctx,x-9,y,'medium');
        leaf(ctx,x+2,y+3,'small');
      } else if(kind===3) {
        leaf(ctx,x-6,y,'medium');
        leaf(ctx,x+8,y+3,'small');
        cells(ctx,smallLotusRows,x-3,y-4,palette);
        rect(ctx,x-2,y+7,3,1,P.lotusShade);
      } else {
        leaf(ctx,x-5,y,'small');
        leaf(ctx,x+2,y+3,'small');
        cells(ctx,budRows,x-2,y-4,palette);
      }
    }
  }
  function lake(ctx, w, h, horizon, time, reflectionX, options = {}) {
    const depth = h - horizon;
    const centre = Math.round(w / 2);
    rect(ctx, 0, horizon, w, depth, P.water);
    // One crisp horizon glint joins the distant shore; it is not a gradient band.
    rect(ctx, 0, horizon + 1, w, 1, P.middleShade);
    rect(ctx, centre - 24, horizon, 44, 1, P.waterLight);
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
    moonlight(ctx,w,h,horizon,time,reflectionX);
    // The distant lantern leaves only a small warm trace beside its islet.
    const pavilionX=Math.round(w*.71);
    rect(ctx,pavilionX-1,horizon+3,2,1,P.amber);
    rect(ctx,pavilionX-2,horizon+6,4,1,P.waterLight);
    if(options.plants!==false)lilyPads(ctx,w,h,horizon,time);
  }
  function draw(ctx, w, h, time = 0, options = {}) {
    const horizon = options.horizon === undefined ? Math.round(h * .64) : Math.round(options.horizon);
    const reflectionX = options.reflectionX === undefined ? Math.round(w * .78) : Math.round(options.reflectionX);
    mountain(ctx, w, horizon);
    lake(ctx, w, h, horizon, time, reflectionX, options);
  }
  return Object.freeze({ draw, mountain, lake, lilyPads, waterPlants, palette: P });
})();

globalThis.NativeLanterns = (() => {
  'use strict';
  const P=Object.freeze({dark:'#9d4b46',paper:'#db8056',amber:'#ecb779',
    cream:'#fff1d8',dim:'#92715f',ink:'#493043'});
  // A broad folded top and almost straight paper sides distinguish the bags
  // from round balloons. Light gathers toward their open lower rim.
  const sprites=Object.freeze({
    near:[
      '.ddrrrdd.',
      'drrrrrrrd',
      'drrooorrd',
      'drroooord',
      'drroooord',
      'drroooord',
      'drroooord',
      'drroooord',
      'drrohoord',
      'drrohhord',
      '.drorord.',
      '..dkhkd..',
      '...ror...'
    ],
    far:[
      '.ddrdd.',
      'drrrrrd',
      'drroord',
      'drooord',
      'drooord',
      'drohord',
      'drohhod',
      '.dkhkd.',
      '..ror..'
    ]
  });
  const forms=Object.freeze({
    near:{bodyHeight:11,lightY:8,amplitude:3,period:18},
    far:{bodyHeight:7,lightY:5,amplitude:2,period:16}
  });
  const fill=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  // Illumination is contained in the paper panels and open flame. The clean
  // silhouette needs no detached pixels or grey halo around it.
  function create(w,h,horizon,options={}){
    const portrait=w<=h;
    const arrangements=[
      {x:Math.round(w*(portrait?.23:.24)),top:horizon-28,name:'near',phase:.4},
      {x:Math.round(w*.55),top:horizon-19,name:'far',phase:2.2},
      {x:Math.round(w*.87),top:horizon-30,name:'far',phase:4.1}
    ];
    const shore=[
      {x:Math.round(w*.39),base:horizon-2,phase:0},
      {x:Math.round(w*.62),base:horizon-3,phase:2},
      {x:Math.round(w*.91),base:horizon-4,phase:4}
    ];
    // Reserve the whole hover envelope once. A per-frame text clamp would
    // silently flatten the bob where the heading sits close to the horizon.
    const lamps=arrangements.map((lantern,index)=>{
      const rows=sprites[lantern.name],width=rows[0].length,height=rows.length;
      const form=forms[lantern.name],amplitude=form.amplitude,half=Math.floor(width/2);
      const horizontalMargin=half+3+2,box=options.exclude;
      let cx=lantern.x,minY=3+amplitude,maxY=horizon-height-3-amplitude;
      const overlaps=()=>box&&cx-horizontalMargin<=box.x+box.width
        &&cx+horizontalMargin>=box.x;
      if(overlaps()){
        const below=box.y+box.height+5+amplitude;
        if(below<=maxY)minY=Math.max(minY,below);
        else{
          // On a short landscape there is not enough vertical space beneath
          // Welcome. Shift this one lamp past its right edge, preserving room
          // for the other two and its full body margin and side-to-side sway.
          const right=box.x+box.width+horizontalMargin+2;
          const left=box.x-horizontalMargin-2;
          if(right+horizontalMargin<w)cx=right;
          else if(left-horizontalMargin>=0)cx=left;
          else maxY=Math.min(maxY,box.y-height-5-amplitude);
        }
      }
      let top=lantern.top;
      // A raised lamp beside the heading must also read as floating freely,
      // rather than as a flame sitting on the pavilion's upturned roof.
      const pavilionX=Math.round(w*.71);
      if(Math.abs(cx-pavilionX)<22)top=Math.min(top,horizon-31-height);
      const y=Math.max(minY,Math.min(maxY,top));
      return {...lantern,index,cx,y,width,height,rows,form,
        period:form.period+index*1.5};
    });
    function floatingAt(time=0){
      const t=Number.isFinite(time)?Math.max(0,time):0;
      return lamps.map(lantern=>{
        const {rows,width,height,form}=lantern;
        const cx=lantern.cx+Math.round(Math.sin(t*.07+lantern.phase)*2);
        const y=lantern.y+Math.round(Math.sin(t*Math.PI*2/lantern.period+lantern.phase)*form.amplitude);
        const x=cx-Math.floor(width/2);
        const bounds={x:x-3,y:y-3,width:width+6,height:height+5};
        const light={x:cx,y:y+form.lightY};
        return {x,y,cx,width,height,bodyHeight:form.bodyHeight,rows,name:lantern.name,
          phase:lantern.phase,index:lantern.index,light,
          reflectionY:2*horizon-light.y,bounds};
      });
    }
    function drawFloating(c,time=0){
      const colors={d:P.dark,r:P.paper,o:P.amber,h:P.cream,k:P.ink};
      for(const lantern of floatingAt(time)){
        for(let y=0;y<lantern.height;y++)for(let x=0;x<lantern.width;x++){
          const color=colors[lantern.rows[y][x]];
          if(color)fill(c,lantern.x+x,lantern.y+y,1,1,color);
        }
        // One alternate flame cell gives the open base a quiet flicker.
        if(Math.floor(time*3+lantern.phase)%4===1)fill(c,lantern.cx,lantern.y+lantern.height-1,1,1,P.cream);
      }
    }
    function drawShore(c,time=0){
      for(const lamp of shore){
        const x=lamp.x,y=lamp.base;
        // Each post has a cap, warm pane and a visible footing on the dark shore.
        fill(c,x-2,y-7,5,1,P.ink);fill(c,x-1,y-6,3,4,P.dark);
        fill(c,x,y-6,1,3,P.amber);fill(c,x,y-5,1,1,P.cream);
        fill(c,x-2,y-2,5,1,P.ink);fill(c,x,y-1,1,2,P.ink);
        fill(c,x-2,y+1,5,1,P.ink);
        if(Math.floor(time*.8+lamp.phase)%3===0)fill(c,x+1,y-5,1,1,P.amber);
      }
    }
    function drawReflections(c,time=0){
      for(const lamp of shore){
        const shift=Math.round(Math.sin(time*.6+lamp.phase));
        fill(c,lamp.x-1+shift,horizon+3,3,1,P.dim);
        fill(c,lamp.x,horizon+5,1,1,P.amber);
        fill(c,lamp.x-2-shift,horizon+8,4,1,P.dim);
      }
      for(const lantern of floatingAt(time)){
        const y=lantern.reflectionY,x=lantern.cx;
        const sway=Math.round(Math.sin(time*.8+lantern.phase));
        const marks=[[-1,-4,3,P.dim],[-2,-2,5,P.paper],[-1,0,3,P.amber],
          [-3,2,7,P.dim],[0,2,2,P.amber],[-2,5,5,P.paper],[-4,8,8,P.dim]];
        for(const [dx,dy,width,color]of marks){
          const row=y+dy;
          if(row>horizon+1&&row<h)fill(c,x+dx+(dy%2?sway:-sway),row,width,1,color);
        }
      }
    }
    return Object.freeze({floatingAt,drawFloating,drawShore,drawReflections,shore});
  }
  return Object.freeze({create,sprites,palette:P});
})();

globalThis.NativeGarden = (() => {
  'use strict';
  const P = Object.freeze({
    ink:'#1c1e31', barkDark:'#2a2035', bark:'#493043', barkLight:'#755069', barkWarm:'#92715f',
    grassDark:'#172b36', grass:'#2e454a', grassLight:'#526863', grassWarm:'#4c4b3d', grassLit:'#71634c',
    flowerDark:'#35283f', flowerShade:'#563750', flower:'#865271', flowerLight:'#a36c8d', flowerHigh:'#dab5cc',
    stoneDark:'#292e40', stone:'#41495c', stoneLight:'#657185', stoneWarm:'#8b7566',
    amber:'#ecb779', cream:'#fff1d8', fire:'#db8056', ember:'#9d4b46'
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
  // Each spray is drawn at 1:1 native resolution. Their 1–3 px edge steps are
  // deliberately independent of the much larger lighting masses beneath them.
  const sprays = [
    [
      '....mm.....',
      '..mmlmmm...',
      '.mlllllmm..',
      'mmllmlllm..',
      '.mllllmmm..',
      '..mmllm.m..',
      '...mmm.....',
    ],
    [
      '.....mm.....',
      '...mmlmm....',
      '..mmlllm.m..',
      '.mllmllllmm.',
      'mmllllmlmm..',
      '.mmllmmm....',
      '..mmm.mm....',
      '...m........',
    ],
    [
      '...mm.....',
      '..mllmm...',
      '.mlllllm..',
      'mmllmllmm.',
      '.mllllmm..',
      '..mmllm...',
      '...mmm....',
      '....m.....',
    ],
    [
      '.....m.....',
      '...mmllm...',
      '.mmmlllm...',
      'mmllmlllmm.',
      '.mllllmlmm.',
      '..mmmllmm..',
      '....mmm....',
    ],
    [
      '..mm.....',
      '.mllmm...',
      'mmllllmm.',
      '.mllmlmm.',
      '..mllmm..',
      '...mmm...',
      '....m....',
    ],
  ];
  function spray(c,x,y,kind=0,lit=false) {
    const cells=sprays[kind%sprays.length];
    const colors={m:P.flower,l:lit?P.flowerLight:P.flower};
    for(let sy=0;sy<cells.length;sy++)for(let sx=0;sx<cells[sy].length;sx++) {
      const color=colors[cells[sy][sx]];
      if(color)rect(c,x+sx,y+sy,1,1,color);
    }
  }
  function blossom(c,x,y,lit=false) {
    // A few petals and a single warm centre describe a flower without making
    // every leaf clump into an identical high-contrast cross.
    const pink=lit?P.flowerHigh:P.flowerLight;
    rect(c,x+1,y,1,1,pink);rect(c,x,y+1,3,1,pink);
    rect(c,x+1,y+2,1,1,P.flower);rect(c,x+1,y+1,1,1,lit?P.cream:P.flowerHigh);
  }
  function canopy(c,x,y) {
    const shape=(points,color)=>poly(c,points.map(p=>[x+p[0],y+p[1]]),color);
    // The full canopy is connected, including the thin hanging sprays. Fine
    // asymmetric scallops replace the old 6–12 px rectangular staircase.
    shape([[-30,-12],[44,-12],[44,-9],[49,-9],[49,-8],[54,-8],[54,-5],
      [61,-5],[61,-3],[66,-3],[66,-1],[70,-1],[70,2],[76,2],[76,4],
      [81,4],[81,6],[85,6],[85,8],[92,8],[92,10],[97,10],[97,13],
      [101,13],[101,15],[106,15],[106,18],[111,18],[111,21],
      [114,21],[114,24],[118,24],[118,27],[115,27],[115,30],
      [120,30],[120,33],[124,33],[124,36],[127,36],[127,39],
      [130,39],[130,42],[128,42],[128,45],[125,45],[125,48],
      [121,48],[121,50],[117,50],[117,54],[114,54],[114,57],
      [109,57],[109,59],[106,59],[106,63],[103,63],[103,61],
      [99,61],[99,64],[95,64],[95,67],[91,67],[91,70],
      [88,70],[88,67],[84,67],[84,71],[79,71],[79,74],
      [75,74],[75,72],[71,72],[71,75],[65,75],[65,78],
      [61,78],[61,76],[57,76],[57,80],[53,80],[53,83],
      [49,83],[49,80],[45,80],[45,83],[41,83],[41,85],
      [36,85],[36,81],[32,81],[32,83],[27,83],[27,81],
      [23,81],[23,84],[19,84],[19,81],[15,81],[15,78],
      [11,78],[11,80],[7,80],[7,77],[2,77],[2,75],
      [-3,75],[-3,77],[-7,77],[-7,73],[-12,73],[-12,70],
      [-16,70],[-16,72],[-21,72],[-21,68],[-30,68]],P.flowerDark);
    // Shadow leaves follow the actual direction of the supporting limbs. The
    // three broad light planes join smaller sprays, rather than outlining them.
    shape([[-30,-12],[42,-12],[42,-8],[52,-8],[52,-4],[65,-4],[65,0],
      [75,0],[75,5],[85,5],[85,9],[95,9],[95,13],[103,13],[103,17],
      [110,17],[110,22],[115,22],[115,25],[110,25],[110,30],
      [118,30],[118,34],[123,34],[123,38],[126,38],[126,42],
      [122,42],[122,46],[117,46],[117,48],[112,48],[112,51],
      [108,51],[108,55],[102,55],[102,58],[96,58],[96,61],
      [90,61],[90,65],[84,65],[84,63],[78,63],[78,68],
      [72,68],[72,70],[67,70],[67,73],[61,73],[61,70],
      [56,70],[56,75],[49,75],[49,78],[42,78],[42,76],
      [37,76],[37,79],[32,79],[32,76],[28,76],[28,78],
      [21,78],[21,75],[16,75],[16,72],[12,72],[12,74],
      [6,74],[6,70],[1,70],[1,67],[-5,67],[-5,70],
      [-11,70],[-11,65],[-16,65],[-16,62],[-23,62],[-23,65],[-30,65]],P.flowerShade);
    shape([[-28,-10],[40,-10],[40,-5],[50,-5],[50,-1],[61,-1],[61,3],
      [69,3],[69,7],[77,7],[77,10],[85,10],[85,13],[91,13],
      [91,17],[99,17],[99,20],[103,20],[103,23],[97,23],[97,26],
      [90,26],[90,23],[84,23],[84,25],[78,25],[78,21],[72,21],
      [72,18],[66,18],[66,20],[60,20],[60,16],[55,16],[55,13],
      [49,13],[49,15],[44,15],[44,12],[38,12],[38,16],[31,16],
      [31,20],[24,20],[24,17],[18,17],[18,20],[13,20],[13,23],
      [6,23],[6,20],[1,20],[1,23],[-4,23],[-4,26],
      [-11,26],[-11,23],[-17,23],[-17,27],[-24,27],[-24,23],[-28,23]],P.flower);
    shape([[-29,33],[-22,33],[-22,29],[-14,29],[-14,26],[-8,26],
      [-8,29],[-2,29],[-2,32],[3,32],[3,29],[9,29],[9,33],
      [15,33],[15,36],[20,36],[20,40],[23,40],[23,44],[19,44],
      [19,47],[14,47],[14,51],[8,51],[8,54],[1,54],[1,51],
      [-5,51],[-5,54],[-11,54],[-11,57],[-17,57],[-17,53],
      [-22,53],[-22,56],[-29,56]],P.flower);
    shape([[29,29],[34,29],[34,25],[40,25],[40,22],[46,22],
      [46,25],[52,25],[52,28],[58,28],[58,31],[64,31],
      [64,34],[70,34],[70,37],[76,37],[76,40],[72,40],
      [72,44],[67,44],[67,47],[62,47],[62,51],[58,51],
      [58,54],[52,54],[52,59],[46,59],[46,62],[40,62],
      [40,59],[34,59],[34,56],[29,56],[29,53],[24,53],
      [24,49],[28,49],[28,45],[32,45],[32,40],[29,40],
      [29,36],[25,36],[25,33],[29,33]],P.flower);
    shape([[88,35],[93,35],[93,31],[99,31],[99,33],[105,33],
      [105,35],[111,35],[111,38],[117,38],[117,41],[113,41],
      [113,44],[109,44],[109,47],[103,47],[103,50],[98,50],
      [98,53],[94,53],[94,50],[89,50],[89,47],[84,47],
      [84,43],[81,43],[81,39],[88,39]],P.flower);
    // An open bough divides the large left plume from the curved upper crown.
    // It is painted as bark over shadow leaves; no clearing or cutout is used.
    shape([[2,68],[13,62],[26,56],[35,51],[43,44],[47,36],
      [48,28],[47,28],[44,37],[40,44],[31,50],[22,53],
      [12,57],[0,62]],P.barkDark);
    shape([[33,53],[47,51],[60,45],[73,40],[85,31],[89,24],
      [87,25],[82,32],[71,36],[58,41],[44,47],[34,49]],P.barkDark);
    shape([[61,70],[69,61],[79,57],[91,56],[99,51],[97,50],
      [89,53],[78,54],[67,59],[58,68]],P.barkDark);
    // Interlocking middle-value sprays give every plume a consistent fine
    // grain. These placements follow the crown and hanging branches; no random
    // speckling or scaled texture is used to fake blossom density.
    for(const [sx,sy,kind]of [
      [-28,-6,0],[-20,-10,1],[-12,-7,3],[-4,-10,2],[5,-8,0],[14,-9,3],
      [23,-6,1],[31,-8,4],[39,-5,2],[47,-2,0],[55,1,3],
      [-27,3,3],[-19,1,2],[-11,6,0],[-3,3,4],[5,7,1],[14,4,2],
      [22,9,3],[30,5,0],[38,10,1],[46,7,2],[54,13,4],[63,9,1],
      [-28,12,2],[-20,15,0],[-12,12,1],[-4,17,3],[4,14,4],[12,18,0],
      [20,15,2],[28,20,4],[36,16,3],[44,22,0],[53,20,2],[61,18,4],
      [69,15,3],[77,18,0],[85,21,2],[92,24,4],[99,23,1],
      [-27,23,1],[-20,27,3],[-12,24,4],[-4,28,2],[4,25,0],[12,29,1],
      [-28,36,2],[-20,32,0],[-12,37,1],[-4,34,3],[4,38,2],[12,35,4],
      [-27,45,3],[-20,48,4],[-12,44,0],[-4,48,2],[4,45,1],[12,46,0],
      [-23,55,1],[-15,57,4],[-7,54,2],[1,56,0],[9,55,3],[17,51,4],
      [25,28,1],[33,24,4],[41,28,2],[49,26,0],[57,30,1],[65,31,3],
      [23,37,2],[31,34,0],[39,38,3],[47,35,1],[55,39,2],[64,39,4],
      [20,45,0],[28,43,4],[36,47,2],[44,44,3],[52,49,0],[59,46,4],
      [24,53,1],[32,56,0],[40,52,3],[48,57,2],[55,56,4],
      [4,64,3],[12,62,0],[20,66,2],[28,62,1],[35,64,4],[43,65,2],
      [11,70,4],[20,73,2],[27,69,3],[35,73,0],[43,71,4],
      [60,61,0],[68,56,2],[75,61,3],[83,57,4],[88,53,2],
      [78,31,4],[85,35,0],[92,31,1],[100,34,3],[107,31,4],
      [77,41,3],[84,45,2],[92,42,4],[100,45,1],[107,41,2],[113,36,0],
    ])spray(c,x+sx,y+sy,kind,false);
    // Individual sprays are explicitly composed along the lit edges of these
    // branches. All patterns use the same native cells; none is upscaled.
    for(const [sx,sy,kind]of [
      [-20,-2,0],[-10,3,2],[0,1,1],[9,7,0],[17,2,3],[27,5,1],
      [38,-3,0],[47,4,2],[55,8,1],[65,10,3],[74,13,4],[83,18,0],
      [93,19,4],[100,24,2],[111,31,4],[116,37,3],
      [-23,32,1],[-13,35,2],[-4,30,0],[3,35,1],[10,41,4],
      [-18,45,3],[-8,45,4],[0,48,2],
      [30,26,2],[39,27,3],[47,30,0],[56,34,1],[63,37,4],
      [28,40,4],[37,43,3],[48,42,2],[53,48,4],[41,53,0],
      [88,36,4],[96,34,2],[104,39,0],[90,44,1],
      [9,62,0],[17,67,4],[25,62,2],[35,69,3],
      [56,62,4],[64,58,2],[75,58,4],[83,60,3],
    ])spray(c,x+sx,y+sy,kind,true);
    // A handful of tiny blossom groups soften the shadow-facing silhouette.
    for(const [sx,sy,kind]of [
      [-19,57,4],[-7,60,3],[3,65,4],[13,73,0],[29,74,4],
      [45,72,3],[55,68,4],[71,65,0],[91,55,4],[104,50,3],
    ])spray(c,x+sx,y+sy,kind,false);
    for(const [sx,sy,lit]of [[43,4,false],[78,16,true],[102,28,false],
      [7,41,false],[49,47,false],[98,40,true],[66,63,false]])
      blossom(c,x+sx,y+sy,lit);
    // Cool moonward 1 px rims are selective: only a few outer-facing petal tips.
    for(const [sx,sy,len]of [[85,14,2],[97,19,2],[108,25,1],
      [118,34,2],[123,41,1],[114,47,2],[99,54,1],[85,63,2],
      [69,67,2]])rect(c,x+sx,y+sy,len,1,P.flowerHigh);
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
  // Only these four tiny hanging tips move. They are attached to the cached
  // crown by 1 px twigs; the canopy, trunk and ground never translate as a block.
  function wind(c,w,h,time=0) {
    const x=w<=h?-18:-7,y=w<=h?-1:-15;
    const weather=globalThis.PixelAmbient?.windAt?.(time);
    const sway=weather?weather.sway:Math.sin(time*.8)*.7;
    for(const [ax,ay,len,phase]of [[103,61,3,0],[75,72,4,1],[37,82,3,2],[8,77,4,3]]) {
      const dx=Math.round(sway*(phase%2?.8:1));
      rect(c,x+ax,y+ay,1,2,P.barkDark);
      rect(c,x+ax+dx,y+ay+2,1,len-1,P.barkDark);
      rect(c,x+ax+dx-1,y+ay+len,3,2,P.flowerShade);
      rect(c,x+ax+dx,y+ay+len+2,2,1,P.flower);
      rect(c,x+ax+dx+1,y+ay+len,1,1,P.flowerLight);
    }
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
      poly(c,[[x-r+4,y-6],[x-6,y-10],[x-3,y-10],[x-7,y-6],[x-r+6,y-4]],P.stoneWarm);
      rect(c,x-r+2,y-1,3,1,P.stoneWarm);
    } else if(kind===1) {
      poly(c,[[x-r+4,y-6],[x-6,y-10],[x-2,y-10],[x-8,y-5],[x-r+3,y-2]],P.stoneWarm);
    }
    // A broken turf seam covers the bottom plane. The rock is embedded in the
    // bank instead of ending in a dark outline suspended above the water.
    poly(c,[[x-r+1,y+5],[x-r+5,y+4],[x-r+9,y+5],[x-5,y+5],
      [x-3,y+6],[x+5,y+6],[x+8,y+5],[x+r-4,y+4],[x+r-2,y+5],
      [x+r-5,y+7],[x-r+1,y+7]],P.grassDark);
    rect(c,x-r+5,y+5,4,1,P.grass);
    rect(c,x+r-7,y+5,3,1,P.grass);
    tuft(c,x-r+8,y+7,3,P.grass);
    if(kind!==2)tuft(c,x+7,y+7,2,P.grass);
  }
  const groundLevel=h=>Math.round(h*.80);
  function groundGeometry(w,h) {
    const bank=groundLevel(h);
    // One monotonic shoreline continues to the actual bottom of the viewport.
    // The old polygon turned back through vertices below short canvases; rocks
    // also had fixed x positions unrelated to its visible edge.
    const profile=[[-5,13],[-3,25],[-2,40],[0,54],[4,66],[10,77],
      [18,88],[28,99],[39,108],[53,116],[69,126],[86,140],[104,152]];
    function nativeEdge(y) {
      const offset=y-bank;
      if(offset<profile[0][0])return 0;
      for(let i=1;i<profile.length;i++) {
        const [a,x]=profile[i-1],[b,next]=profile[i];
        if(offset<=b)return x+(next-x)*(offset-a)/(b-a);
      }
      return profile.at(-1)[1]+(offset-profile.at(-1)[0])*.6;
    }
    const rawEnd=nativeEdge(h),limit=Math.min(w-12,Math.round(w*(w<=h?.72:.46)));
    // Preserve the room beside the hearth on narrow tall screens. Only the
    // lower curve contracts; squeezing the whole bank would push its rear
    // boulder into the fire ring.
    const hinge=Math.min(88,limit-1);
    const squeeze=Math.min(1,(limit-hinge)/Math.max(1,rawEnd-hinge));
    function edgeAt(y) {
      if(y<bank-5)return 0;
      const edge=nativeEdge(y);
      return Math.max(0,Math.min(w,Math.floor(edge<=hinge?edge:hinge+(edge-hinge)*squeeze)));
    }
    const rocks=[];
    const secondY=Math.min(bank+35,h-8);
    for(const [kind,y,preferredX]of [[0,bank+16,68],[1,secondY,94],[2,bank+61,112]]) {
      if(y+7>=h || (kind===2&&y+10>=h))continue;
      const radius=[16,19,15][kind];
      // Reserve a grass margin outside the entire contact shadow, not just its
      // centre. The widest shadow cell is three cells beyond the rock radius.
      const x=Math.min(preferredX,edgeAt(y+2)-radius-6);
      rocks.push(Object.freeze({x,y,kind,radius}));
    }
    return Object.freeze({bank,edgeAt,rocks:Object.freeze(rocks)});
  }
  function ground(c,w,h,geometry=groundGeometry(w,h)) {
    const {bank,edgeAt}=geometry;
    for(let y=bank-5;y<h;y++) {
      const edge=edgeAt(y),inner=edgeAt(y-6);
      rect(c,0,y,edge,1,P.grassDark);
      if(edge>inner)rect(c,inner,y,edge-inner,1,P.grass);
    }
  }
  function rightBankGeometry(w,h){
    // The moonward shelf supports both long hind feet, with a grass margin
    // in front of their toes. This same contour also bounds the water garden.
    const profile=[[-26,-36],[-25,-45],[-23,-50],[-21,-55],[-17,-58],
      [-12,-63],[-8,-68],[-4,-73],[0,-78]];
    function edgeAt(y){
      const offset=y-h;
      if(offset<profile[0][0])return w;
      for(let i=1;i<profile.length;i++){
        const [a,x]=profile[i-1],[b,next]=profile[i];
        if(offset<b)return w+Math.ceil(x+(next-x)*(offset+.5-a)/(b-a)-.5);
      }
      return w+profile.at(-1)[1];
    }
    const outline=Object.freeze([...profile.slice().reverse().map(([dy,dx])=>[w+dx,h+dy]),
      [w-23,h-25],[w-12,h-23],[w,h-20],[w,h]].map(point=>Object.freeze(point)));
    return Object.freeze({edgeAt,outline});
  }
  function firePosition(w,h) { return {x:38,y:groundLevel(h)+12}; }
  // Six authored flame poses share the same base. Each mark is one scene pixel;
  // the fire curls slowly between connected silhouettes rather than scaling.
  const flameFrames = [
    [
      '.......o.....',
      '......oo.....',
      '......ao.....',
      '.....oao.....',
      '.....oao.....',
      '..o..oaao....',
      '..oo.oaao....',
      '..oaaoaao.o..',
      '..oaahaaooo..',
      '.ooaahhaaoo..',
      '.oaaahhaaoo..',
      '.oaaahhaaao..',
      '.ooaaahhaao..',
      '..oaahhaaoo..',
      '..coaaaaooc..',
      '...ccooocc...',
    ],
    [
      '......o......',
      '......oo.....',
      '.....oao.....',
      '.....oao.....',
      '....oaao.....',
      '....oaao.o...',
      '..o.oaaooo...',
      '..ooaahaao...',
      '..oaahhaao...',
      '.ooaahhaaoo..',
      '.oaaahhaaoo..',
      '.oaahhhaaao..',
      '.ooaahhaaao..',
      '..oaahhaaoo..',
      '..coaaaaooc..',
      '...ccooocc...',
    ],
    [
      '.............',
      '.....o.......',
      '.....oo......',
      '.....oa......',
      '.....oao.....',
      '.....oao.....',
      '..o..oaao....',
      '..oo.oaao....',
      '..oaaoaao.o..',
      '.ooaahhaooo..',
      '.oaahhhaaoo..',
      '.oaahhhaaoo..',
      '.ooaahhaaao..',
      '..oaahhaaoo..',
      '..coaaaaooc..',
      '...ccooocc...',
    ],
    [
      '.............',
      '.......o.....',
      '......oo.....',
      '......ao.....',
      '..o..oao.....',
      '..oo.oaao....',
      '..oaaoaao....',
      '..oaahaao.o..',
      '.ooaahhaooo..',
      '.oaaahhaaoo..',
      '.oaaahhaaao..',
      '.oaahhhaaao..',
      '.ooahhhaaao..',
      '..oaahhaaoo..',
      '..coaaaaooc..',
      '...ccooocc...',
    ],
    [
      '......o......',
      '.....oo......',
      '.....ao......',
      '.....ao......',
      '....oao......',
      '....oaao.o...',
      '...oaahaao...',
      '...oaahaao...',
      '..ooaahhaoo..',
      '..oaahhhaoo..',
      '.ooaahhaaao..',
      '.oaahhhaaao..',
      '.oaahhaaaoo..',
      '..oaahhaaoo..',
      '..coaaaaooc..',
      '...ccooocc...',
    ],
    [
      '.............',
      '......o......',
      '......oo.....',
      '.....oao.....',
      '.....oao.....',
      '..o..oaao....',
      '..oo.oaao....',
      '..oaaoaao....',
      '..oaahaaoo...',
      '.ooaahhaao...',
      '.oaaahhaaoo..',
      '.oaaahhaaao..',
      '.ooaahhaaao..',
      '..oaahhaaoo..',
      '..coaaaaooc..',
      '...ccooocc...',
    ]
  ];
  function hearth(c,w,h) {
    const {x,y}=firePosition(w,h);
    // A shallow oval depression seats the logs inside a small broken stone ring.
    // The front lip overlaps the logs; no fire or stones float over the grass.
    poly(c,[[x-14,y+1],[x-10,y-2],[x+9,y-2],[x+14,y+1],
      [x+13,y+5],[x+8,y+7],[x-9,y+7],[x-14,y+4]],P.grassDark);
    poly(c,[[x-11,y],[x-8,y-2],[x+8,y-2],[x+11,y+1],[x+9,y+4],
      [x-9,y+4]],P.barkDark);
    // Back rim stones sit behind the fuel, with only the fire-facing edge warm.
    for(const [sx,sy,width]of [[-11,-2,5],[-5,-3,5],[2,-3,5],[8,-1,4]]) {
      rect(c,x+sx,y+sy,width,3,P.stoneDark);
      rect(c,x+sx+1,y+sy,width-1,1,P.stoneWarm);
      rect(c,x+sx+1,y+sy+1,width-2,1,P.stone);
    }
    // Two short split logs cross at the hot centre. End grain is a single cell.
    poly(c,[[x-9,y-1],[x-6,y-3],[x+9,y+2],[x+7,y+5]],P.barkDark);
    poly(c,[[x-8,y-1],[x-6,y-2],[x+8,y+3],[x+7,y+4]],P.bark);
    rect(c,x-8,y-1,2,2,P.barkWarm);rect(c,x+7,y+2,2,2,P.barkWarm);
    poly(c,[[x-8,y+3],[x-7,y+1],[x+7,y-3],[x+10,y-1],[x-6,y+5]],P.barkDark);
    poly(c,[[x-7,y+2],[x+7,y-2],[x+8,y-1],[x-6,y+4]],P.bark);
    rect(c,x-7,y+2,2,2,P.barkWarm);rect(c,x+7,y-2,2,2,P.barkWarm);
    rect(c,x-3,y,7,2,P.ember);rect(c,x-2,y,2,1,P.fire);
    rect(c,x+2,y+1,2,1,P.amber);
    // The visible front half is lower and cooler than the inner heated faces.
    for(const [sx,sy,width]of [[-13,2,4],[-9,5,5],[-3,6,5],[4,5,5],[10,2,4]]) {
      rect(c,x+sx,y+sy,width,2,P.stoneDark);
      rect(c,x+sx,y+sy,width-1,1,P.stone);
      rect(c,x+sx+1,y+sy,width-2,1,P.stoneWarm);
    }
  }
  function campfire(c,w,h,time=0) {
    const {x,y}=firePosition(w,h),t=Math.max(0,time);
    const pose=Math.floor(t*6)%flameFrames.length;
    const colors={c:P.ember,o:P.fire,a:P.amber,h:P.cream};
    const rows=flameFrames[pose];
    for(let yy=0;yy<rows.length;yy++)for(let xx=0;xx<rows[yy].length;xx++) {
      const color=colors[rows[yy][xx]];
      if(color)rect(c,x-6+xx,y-16+yy,1,1,color);
    }
    // One ember rises at a time, plus a second brief glint. Both use a slow
    // repeating path and disappear before crossing the tree or the page title.
    const rise=(t%3.8)/3.8;
    if(rise<.7) {
      const ex=x+3-Math.round(rise*6),ey=y-17-Math.round(rise*15);
      rect(c,ex,ey,1,1,rise<.28?P.amber:P.ember);
    }
    const second=((t+1.7)%5.4)/5.4;
    if(second<.25)rect(c,x-4-Math.round(second*5),y-15-Math.round(second*28),1,1,P.fire);
  }
  function foreground(c,w,h) {
    const geometry=groundGeometry(w,h),{bank,edgeAt,rocks}=geometry;
    // 1. A continuous soil mass and one connected grass lip share the same edge
    // used to place every boulder and plant. No prop creates its own land patch.
    ground(c,w,h,geometry);
    // 2. Ground remains in its unlit material colours. The hearth contains its
    // own small charred centre, and the animated light draws the surrounding pool.
    // 3. Tall plants behind the stones. Stone faces will occlude them next.
    for(const [desiredX,dy,height]of [[6,-4,5],[25,-1,3],[66,6,5],[86,20,5],[116,43,5]]) {
      const y=bank+dy,x=Math.min(desiredX,edgeAt(y)-6);
      if(y<h&&x>4)tuft(c,x,y,height,x<65?P.grassLight:P.grass);
    }
    // 4. Stones are ordered from the rear lip toward the viewer.
    for(const rock of rocks)stone(c,rock.x,rock.y,rock.kind);
    // 5. Short foreground plants only touch open ground or stone bases.
    for(const [x,dy,height]of [[7,14,4],[20,25,3],[53,30,3],[75,42,3],[108,62,3]])
      if(bank+dy<h&&x+4<edgeAt(bank+dy))tuft(c,x,bank+dy,height,x<48?P.grassLight:P.grass);
    for(const [x,dy,lit]of [[10,26,false],[32,36,true],[7,51,false],[58,49,false]])
      if(bank+dy<h-1)flower(c,x,bank+dy,lit);
    // Fallen petals sit flat on the bank instead of appearing to grow from rocks.
    for(const [x,dy]of [[13,8],[19,21],[47,26],[17,39],[50,40]])
      if(bank+dy<h-1)rect(c,x,bank+dy,2,1,P.flower);
    // 6. The quiet stone-and-log hearth is cached; its six flame poses are not.
    hearth(c,w,h);
    // A wider seated shelf gives the forward-pointing feet real ground.
    // The grass lip stays behind the contact shadow and curves into the bank.
    poly(c,rightBankGeometry(w,h).outline,P.grassDark);
    poly(c,[[w-72,h-5],[w-67,h-9],[w-62,h-13],[w-57,h-18],
      [w-55,h-21],[w-50,h-23],[w-45,h-25],[w-36,h-26],[w-23,h-25],
      [w-12,h-23],[w,h-20],[w,h-17],[w-13,h-20],[w-24,h-22],
      [w-36,h-23],[w-44,h-22],[w-50,h-20],[w-54,h-17],[w-60,h-11],
      [w-65,h-7]],P.grass);
    rect(c,w-48,h-23,5,1,P.grassLight);
    rect(c,w-18,h-23,4,1,P.grassLight);
    tuft(c,w-61,h-11,3,P.grass);
    tuft(c,w-8,h-20,3,P.grassLight);
    tuft(c,w-4,h-8,4,P.grass);
  }
  return Object.freeze({tree,foreground,ground,groundGeometry,rightBankGeometry,wind,campfire,firePosition,palette:P});
})();

/* Seated pose observed from Lee Richardson Zoo's Mitzi portrait; see ARTWORK.md.
 * Ears, arms and folded hind legs share one left three-quarter viewpoint.
 * The seven whole-tail cels keep only the tucked pelvic attachment fixed. */
globalThis.NativeChinchillaTail = (() => {
  'use strict';
  const width=60,height=48,period=16.8,start=10.1;
  const palette=Object.freeze({"d":"#292e40","s":"#41495c","m":"#657185","b":"#8b95a4","l":"#bbc5d8","h":"#c0cddd","p":"#a36c8d","q":"#755069","e":"#1c1e31","g":"#172b36"});
  const tailFrames=Object.freeze([
  [
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "...................................................ss.......",
    "..................................................sbms......",
    ".................................................sbbmmms....",
    ".................................................sbbmmmms...",
    "................................................sbbmmmmds...",
    "................................................sbbmmmdds...",
    "...............................................sbbmmmmds....",
    "..............................................sbbmmmmdds....",
    ".............................................sbbmmmmds......",
    "...........................................smbbbmmddds......",
    ".........................................smbbbbmmdds........",
    ".......................................smbbbbmmmds..........",
    "......................................sbbbbmmmds............",
    ".....................................smmmmdds...............",
    "......................................sdds..................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................"
  ],
  [
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    ".....................................................ss.....",
    "....................................................sbms....",
    "...................................................sbbmmd...",
    "...................................................sbbmmmds.",
    "..................................................sbbmmmmds.",
    "..................................................sbbmmmmds.",
    ".................................................sbbmmmmdds.",
    "................................................sbbmmmmdds..",
    "...............................................sbbmmmmdds...",
    ".............................................smbbbmddds.....",
    "...........................................smbbbbmdss.......",
    "......................................sbbbbmmmmddds.........",
    ".....................................smmmmmmmdds............",
    "......................................smmmdds...............",
    "......................................sdds..................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................"
  ],
  [
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "................................................sss.........",
    "...............................................sbbms........",
    "...............................................sbbmmms......",
    "..............................................sbbmmmds......",
    "..............................................sbbmmmmds.....",
    ".............................................sbbmmmmds......",
    ".............................................sbbmmmdds......",
    "............................................sbbmmmmds.......",
    "............................................sbbmmmdds.......",
    "...........................................sbbmmmdds........",
    "..........................................sbbmmmdds.........",
    ".........................................sbbmmmds...........",
    "........................................sbbmmds.............",
    ".......................................sbbbds...............",
    "......................................sbbms.................",
    "......................................sbms..................",
    ".....................................smms...................",
    "......................................ss....................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................"
  ],
  [
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "...............................................sms..........",
    "..............................................sbbmms........",
    ".............................................sbbmmmmds......",
    "............................................sbbmmmmmds......",
    "............................................sbbmmmmmds......",
    "............................................sbbmmmmds.......",
    "............................................sbbmmmmds.......",
    "...........................................sbbmmmdds........",
    "...........................................sbbmmdds.........",
    "...........................................sbbmmds..........",
    "..........................................sbbmmds...........",
    "..........................................sbbmmds...........",
    ".........................................sbbbmds............",
    ".......................................sbbbbmds.............",
    "......................................sbbbmds...............",
    ".....................................smmmss.................",
    "......................................sds...................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................"
  ],
  [
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "..................................................ss........",
    ".................................................sbms.......",
    "................................................sbbmmms.....",
    "................................................sbbmmmds....",
    "................................................sbbmmmds....",
    "...............................................sbbmmmmds....",
    "..............................................sbbmmmmdss....",
    "..............................................sbbmmmmds.....",
    ".............................................sbbmmmmdss.....",
    "............................................sbbmmmmdss......",
    "...........................................sbbmmmdss........",
    ".........................................smbbbmdds..........",
    ".......................................smbbbmdds............",
    "......................................sbbbmdss..............",
    ".....................................smmmmss................",
    "......................................sdds..................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................"
  ],
  [
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "......................................................sss...",
    ".....................................................sbbms..",
    "....................................................sbbmmmds",
    "...................................................sbbmmmmds",
    "..................................................sbbmmmmds.",
    ".................................................sbbmmmmmdss",
    "................................................smbbbmmmdds.",
    "...............................................smbbbbmmmdds.",
    "............................................smbbbbmmmdds....",
    "......................................sbbbbmmmmmmddds.......",
    ".....................................smmmmmmmmdds...........",
    ".....................................smmmmmdds..............",
    "......................................sdds..................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................"
  ],
  [
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    ".....................................................sm.....",
    "...................................................smbms....",
    "..................................................sbbmmds...",
    "..................................................sbbmmmms..",
    ".................................................sbbmmmmds..",
    ".................................................sbbmmmmmds.",
    "................................................sbbmmmmdss..",
    "................................................sbbmmmmds...",
    "...............................................sbbmmmmdss...",
    ".............................................smbbbbmmmdds...",
    "...........................................smbbbbmmdds......",
    ".........................................smbbbbmmdds........",
    "......................................sbbbbmmmds............",
    ".....................................smmmmdds...............",
    "......................................sdds..................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................",
    "............................................................"
  ]
].map(rows=>Object.freeze(rows)));
  const labels=Object.freeze(["rest","prepare","lift","follow","halfLift","outward","halfOut"]);
  const root=Object.freeze({x:39,y:39});
  const anchor=Object.freeze({x:38,y:39});
  const landmarks=Object.freeze([
  {
    "anchor": [
      38,
      39
    ],
    "proximal": [
      43,
      38
    ],
    "middle": [
      49,
      34
    ],
    "tip": [
      51,
      29
    ]
  },
  {
    "anchor": [
      38,
      39
    ],
    "proximal": [
      43,
      40
    ],
    "middle": [
      51,
      35
    ],
    "tip": [
      53,
      30
    ]
  },
  {
    "anchor": [
      38,
      39
    ],
    "proximal": [
      41,
      36
    ],
    "middle": [
      46,
      31
    ],
    "tip": [
      49,
      26
    ]
  },
  {
    "anchor": [
      38,
      39
    ],
    "proximal": [
      42,
      37
    ],
    "middle": [
      46,
      31
    ],
    "tip": [
      48,
      27
    ]
  },
  {
    "anchor": [
      38,
      39
    ],
    "proximal": [
      42,
      37
    ],
    "middle": [
      48,
      33
    ],
    "tip": [
      50,
      28
    ]
  },
  {
    "anchor": [
      38,
      39
    ],
    "proximal": [
      44,
      40
    ],
    "middle": [
      53,
      36
    ],
    "tip": [
      56,
      32
    ]
  },
  {
    "anchor": [
      38,
      39
    ],
    "proximal": [
      44,
      39
    ],
    "middle": [
      50,
      35
    ],
    "tip": [
      52,
      30
    ]
  }
].map(pose=>Object.freeze(Object.fromEntries(Object.entries(pose).map(([key,xy])=>[key,Object.freeze(xy)])))));
  const schedule=Object.freeze([
  {
    "pose": 1,
    "duration": 0.1
  },
  {
    "pose": 0,
    "duration": 0.07
  },
  {
    "pose": 4,
    "duration": 0.08
  },
  {
    "pose": 2,
    "duration": 0.09
  },
  {
    "pose": 3,
    "duration": 0.1
  },
  {
    "pose": 2,
    "duration": 0.07
  },
  {
    "pose": 4,
    "duration": 0.08
  },
  {
    "pose": 0,
    "duration": 0.09
  },
  {
    "pose": 6,
    "duration": 0.08
  },
  {
    "pose": 5,
    "duration": 0.1
  },
  {
    "pose": 6,
    "duration": 0.08
  },
  {
    "pose": 0,
    "duration": 0.09
  },
  {
    "pose": 4,
    "duration": 0.07
  },
  {
    "pose": 0,
    "duration": 0.12
  }
].map(step=>Object.freeze(step)));
  const activeDuration=schedule.reduce((sum,step)=>sum+step.duration,0);
  function poseAt(time=0){const t=Number.isFinite(time)?Math.max(0,time):0,local=t%period;let elapsed=local-start;const active=elapsed>=0&&elapsed<activeDuration;let pose=0;if(active){for(const step of schedule){if(elapsed<step.duration){pose=step.pose;break;}elapsed-=step.duration;}}return Object.freeze({pose,active,cycle:Math.floor(t/period)});}
  return Object.freeze({width,height,period,start,activeDuration,palette,tailFrames,labels,root,anchor,landmarks,schedule,poseAt});
})();

globalThis.NativeChinchilla = (() => {
  'use strict';
  const tail=globalThis.NativeChinchillaTail;
  const {palette,tailFrames,poseAt}=tail;
  const bodyRows=Object.freeze([
  "...........................lll..............................",
  ".........................mbblllm............................",
  "..............bbbs......mbbbbbllm...........................",
  "............bbbmmms....mbbbpppqqlm..........................",
  "...........sbbmmmmms..mbbqpppppqql..........................",
  "...........sbmmmmmms..mbqppppppqqbl.........................",
  "...........sbmmmmmms..mbqpppppqqqqm.........................",
  "............sbmmmmms..mbqppppqqqqbm.........................",
  "............smmmmms...mssqqqqqqqbm..........................",
  ".............smmsms...msssqqqqqbbm..........................",
  "..............smmbbbbbmmdsqqqqbbm...........................",
  ".............mllllllbbbmsdsqqbbm............................",
  "...........mlllllbbbbbbbmbbbbbm.............................",
  "..........mlllbbbbbbbbbbmmbbbm..............................",
  ".........mlbbbbbbbbbbbbbbmmm................................",
  "........mbbbbbbbbbbbbbbbbmmm................................",
  "........mbbbbbbbbbbbbbbbbmmmm...............................",
  ".......mbbbbbheebbbbbbbbbmmmm...............................",
  ".......mbbbbeeeebbbbbbbbbmmmm...............................",
  "......mbbbbbbeeebbbbbbbbmmmmm...............................",
  "...mmmmbbbbbbbbbbbbbbbbbmmmmbms.............................",
  ".....ebbbbbbbbbbbbbbbbbmmmmmbbmms...........................",
  ".....mebbbbbbbbbbbbbbbbmmmmmbbmmms..........................",
  "..mmmmmsllllbbbbbbbbbbmmmmmbbmmmmms.........................",
  ".......mslllllbbbbbbbbmmmmmbmmmmmmms........................",
  ".....mmmmbllllllbbbbbmmmmmmmmmmmmmsss.......................",
  ".........mbbllllllbbmmmmmmmmbbmmmmmsss......................",
  "...........mbbbbbbbmmmmmmmmblbmmmmmmsss.....................",
  "..............mbbbbbbmbbmmmbbbmmmmmmsss.....................",
  "..............mmsllllbbbmmmmbbmsmmmmmsss....................",
  ".............mmbslllllbbbmmmmbmsmmmmmsss....................",
  ".............mbmslllllbbbbmmbbmsmmmmmmsss...................",
  ".............smmslllllbbbbmbbmsmmmmmmmsss...................",
  ".............sbbsllllbbbbmbbmsmmmmmmmmsss...................",
  "..............blqlllbbbbmbllsmmmmbbbmssss...................",
  "..............msqlllbbbbbllqsmmbbbmmmssss...................",
  "...............blllbbbbbbmqqmmbbmmmmssss....................",
  "...............sbllbbbbbbbbbmmbmmmmsssss....................",
  "................bbbbbbbbbbbbmsbmmmssssss....................",
  ".................bbbbbbbbbbmmsmmmssssss.....................",
  "..................bbbbbbbbmmmmsssssssd......................",
  "...................bbbbbbbmmmsssssssd.......................",
  "....................bbbbbbmssssmmmmd........................",
  "...............ssmmmssssssssssmmmss.........................",
  "..............smbbbmms.....mmbbbmms.........................",
  ".............sbbmmbbms..mmbbbbbmmms.........................",
  "............smmmsmmmd..bblbblmmmmd..........................",
  "........................ssmssmddd..........................."
]);
  function drawRows(ctx,rows,x,y){
    for(let yy=0;yy<rows.length;yy++)for(let xx=0;xx<rows[yy].length;xx++){
      const colour=palette[rows[yy][xx]];
      if(!colour)continue;
      ctx.fillStyle=colour;ctx.fillRect(x+xx,y+yy,1,1);
    }
  }
  function create(w,h){
    const x=w-62,y=h-69;
    const bounds=Object.freeze({x,y,width:60,height:48});
    const feet=Object.freeze([{x:x+12,y:y+46,width:9},{x:x+24,y:y+47,width:9}]
      .map(foot=>Object.freeze(foot)));
    function draw(ctx,time=0){
      ctx.fillStyle=palette.g;ctx.fillRect(x+12,y+47,25,1);
      drawRows(ctx,tailFrames[poseAt(time).pose],x,y);
      drawRows(ctx,bodyRows,x,y);
    }
    return Object.freeze({draw,poseAt,bounds,feet,tailRoot:tail.root});
  }
  return Object.freeze({create,poseAt,palette,bodyRows,tailFrames,
    tailRows:tailFrames[0],tailRoot:tail.root});
})();

globalThis.NativeLighting = (() => {
  'use strict';
  const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  const toRGB=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  const toKey=hex=>parseInt(hex.slice(1),16);
  let cachedGarden=null,cachedLandscape=null,ramps;
  function palette(){
    const g=globalThis.NativeGarden.palette,l=globalThis.NativeLandscape.palette;
    if(g===cachedGarden&&l===cachedLandscape)return ramps;
    cachedGarden=g;cachedLandscape=l;ramps=new Map();
    const add=(source,dim,light)=>ramps.set(toKey(source),[null,toRGB(dim),toRGB(light)]);
    // Material shadows stay attached. Only facing colours advance in their ramp.
    add(g.grassDark,g.grass,g.grassWarm);add(g.grass,g.grassWarm,g.grassLit);
    add(g.grassLight,g.grassLit,g.grassLit);add(g.grassWarm,g.grassWarm,g.grassLit);
    add(g.bark,g.barkWarm,g.barkWarm);add(g.barkLight,g.barkWarm,g.barkWarm);
    add(g.stone,g.stoneWarm,g.stoneWarm);add(g.stoneLight,g.stoneWarm,g.stoneWarm);
    add(l.water,'#324352','#555155');add(l.waterLight,'#555155',g.stoneWarm);
    add(l.middleShade,'#324352','#555155');
    return ramps;
  }
  function draw(ctx,w,h,time=0){
    const fire=globalThis.NativeGarden.firePosition(w,h);
    const x=fire.x,y=fire.y-7,radius=39;
    const left=Math.max(0,x-radius),top=Math.max(0,y-radius);
    const width=Math.min(w-left,radius*2+1),height=Math.min(h-top,radius*2+1);
    if(width<=0||height<=0)return;
    const frame=ctx.getImageData(left,top,width,height),data=frame.data,colors=palette();
    // This modest variation follows the six hand-authored flame poses. The
    // nearest surfaces stay warm while only the dithered fringe gently changes.
    const flicker=[.05,.12,-.03,.08,0,.04][Math.floor(Math.max(0,time)*6)%6];
    for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
      const dx=left+xx-x,dy=(top+yy-y)*1.12,dist=Math.sqrt(dx*dx+dy*dy);
      const energy=Math.max(0,1-dist/radius),strength=Math.min(2,energy*energy*(3.3+flicker));
      const base=Math.floor(strength),fraction=strength-base;
      const level=Math.min(2,base+(bayer[(top+yy)%4][(left+xx)%4]<fraction*16?1:0));
      if(level===0)continue;
      const offset=(yy*width+xx)*4,key=(data[offset]<<16)|(data[offset+1]<<8)|data[offset+2];
      const color=colors.get(key)?.[level];if(!color)continue;
      data[offset]=color[0];data[offset+1]=color[1];data[offset+2]=color[2];
    }
    ctx.putImageData(frame,left,top);
  }
  return Object.freeze({draw});
})();
