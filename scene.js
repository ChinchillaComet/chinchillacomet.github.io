/* The illustration supplies the forms, light and fine detail. Animation samples
 * the original lake, while the shoreline, clouds and trees remain intact. */
(() => {
  'use strict';
  const { P, rect, sprite } = globalThis.PixelArt;
  const assets = Object.freeze({
    landscape: Object.freeze({
      id: 'landscape', src: './assets/artwork/landscape.webp?v=3', width: 768, height: 512,
      water: [[.615,.22,1],[.65,.245,1],[.69,.30,1],[.73,.36,1],[.77,.43,1],
        [.81,.52,.97],[.85,.55,.90],[.88,.56,.86],[.91,.62,.80],[.96,.68,.77]],
      meteor: { start: [.69,.055], end: [.52,.275] },
      petals: [[.38,.22],[.44,.34],[.93,.13]],
      flies: [.14,.72,.68,.92],
      stars: [[.687,.081],[.780,.122],[.641,.157],[.638,.027],[.739,.225]],
    }),
    portrait: Object.freeze({
      id: 'portrait', src: './assets/artwork/portrait.webp?v=3', width: 444, height: 888,
      water: [[.645,.25,1],[.67,.28,1],[.70,.36,1],[.74,.53,1],[.78,.59,1],
        [.82,.63,1],[.855,.69,.99],[.875,.75,.97]],
      meteor: { start: [.89,.31], end: [.59,.405] },
      petals: [[.51,.15],[.54,.26],[.37,.40],[.92,.07]],
      flies: [.15,.72,.66,.91],
      stars: [[.827,.061],[.789,.176],[.879,.306],[.705,.331],[.847,.354]],
    }),
    panorama: Object.freeze({
      id: 'panorama', src: './assets/artwork/panorama.webp?v=3', width: 956, height: 412,
      water: [[.651,.15,1],[.69,.19,1],[.74,.26,1],[.80,.35,1],[.84,.42,1],
        [.88,.45,.97],[.92,.53,.91],[.96,.57,.86],[.985,.60,.83]],
      meteor: { start: [.67,.065], end: [.505,.29] },
      petals: [[.33,.20],[.39,.31],[.91,.11]],
      flies: [.13,.77,.73,.95],
      stars: [[.654,.060],[.614,.162],[.605,.263],[.515,.217],[.84,.029]],
    }),
  });

  function variant(width, height) {
    return width <= height ? assets.portrait : width / height >= 1.9 ? assets.panorama : assets.landscape;
  }

  function placement(width, height, imageWidth, imageHeight) {
    const scale = Math.max(width / imageWidth, height / imageHeight);
    const drawWidth = Math.ceil(imageWidth * scale), drawHeight = Math.ceil(imageHeight * scale);
    return {
      x: -Math.floor((drawWidth - width) / 2), y: -Math.floor((drawHeight - height) / 2),
      width: drawWidth, height: drawHeight,
    };
  }

  // These boundaries sit inside open water. They do not cut a hole in the art:
  // the entire original background is drawn before every animated frame.
  function waterSpan(points, sourceY) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (sourceY >= a[0] && sourceY <= b[0]) {
        const t = (sourceY - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      }
    }
    return null;
  }

  function create(width, height, makeCanvas, image, selected = variant(width, height)) {
    if (!image || !image.width || !image.height) throw new Error('Decoded artwork is required.');
    const background = makeCanvas(width, height), title = makeCanvas(width, height);
    const bc = background.getContext('2d'), tc = title.getContext('2d');
    const fit = placement(width, height, image.width, image.height);
    bc.imageSmoothingEnabled = false;
    bc.drawImage(image, fit.x, fit.y, fit.width, fit.height);
    const point = (x, y) => [Math.round(fit.x + x * fit.width), Math.round(fit.y + y * fit.height)];

    const font = globalThis.PixelTypography;
    const portrait = width <= height;
    const typeScale = Math.max(1, Math.round(width * (portrait ? .53 : .235) / font.width));
    const text = {
      x: Math.floor((width - font.width * typeScale) / 2),
      y: Math.floor((height - font.height * typeScale) / 2),
      width: font.width * typeScale, height: font.height * typeScale, scale: typeScale,
    };
    const edge = Math.max(1, Math.round(typeScale / 3));
    for (const [dx,dy] of [[edge,2*edge],[-edge,0],[edge,0],[0,-edge],[0,edge]]) {
      sprite(tc, font.rows, text.x + dx, text.y + dy, {'1': P.ink}, typeScale);
    }
    sprite(tc, font.rows, text.x, text.y, {'1': P.cream}, typeScale);

    const waterBands = [];
    for (let y = 0; y < height; y++) {
      const span = waterSpan(selected.water, (y - fit.y) / fit.height);
      if (!span) continue;
      const left = Math.max(2, Math.ceil(fit.x + span[0] * fit.width) + 2);
      const right = Math.min(width - 2, Math.floor(fit.x + span[1] * fit.width) - 2);
      if (right > left) waterBands.push({x: left, y, width: right - left, height: 1});
    }

    const asFraction = pair => { const p = point(...pair); return [p[0]/width,p[1]/height]; };
    const flyStart = asFraction(selected.flies.slice(0,2)), flyEnd = asFraction(selected.flies.slice(2));
    const ambient = globalThis.PixelAmbient.create(width, height, {
      meteor: {...selected.meteor, start: asFraction(selected.meteor.start), end: asFraction(selected.meteor.end)},
      petalSources: selected.petals.map(asFraction),
      petalCount: portrait ? 12 : 18,
      fireflyRegion: [...flyStart,...flyEnd], fireflyCount: portrait ? 5 : 8,
      exclude: {x:text.x-8,y:text.y-8,width:text.width+16,height:text.height+16},
    });
    const stars = selected.stars.map((s,i) => ({point:point(...s),phase:i*1.83}));

    function draw(context, time = 0, options = {}) {
      context.imageSmoothingEnabled = false;
      context.drawImage(background, 0, 0);
      if (options.motion !== false) {
        globalThis.PixelAmbient.drawWater(context, background, waterBands, time);
        for (const star of stars) {
          const brightness = Math.sin(time * .72 + star.phase);
          if (brightness < .65) continue;
          const [x,y] = star.point;
          rect(context,x,y,1,1,brightness > .93 ? '#f8dcec' : '#c7b3ea');
        }
        ambient.drawMeteor(context,time);
        ambient.drawParticles(context,time);
      }
      if (options.title !== false) context.drawImage(title, 0, 0);
    }
    return Object.freeze({
      draw, width, height, text, fit, variant: selected.id, waterBands, background,
      meteorAt: ambient.meteorAt,
    });
  }
  globalThis.PixelScene = Object.freeze({ assets, variant, placement, waterSpan, create });
})();
