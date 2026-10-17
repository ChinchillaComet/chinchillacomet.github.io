/*
 * The garden is painted on the scene's small, integer-resolution canvas.
 * Every mark is a hard-edged pixel rectangle: no paths or antialiasing.
 */
(() => {
  'use strict';

  const PALETTE = {
    ink: '#191c32',
    earth: '#24263b',
    rock: '#303348',
    rockFace: '#3c4054',
    rockLight: '#535269',
    moss: '#344b50',
    mossLight: '#496368',
    grass: '#355d61',
    grassLight: '#5c807b',
    grassDark: '#263d49',
    bark: '#33283e',
    barkMid: '#574157',
    barkLight: '#80617a',
    flowerShadow: '#674365',
    flowerDark: '#855176',
    flowerMid: '#a2668e',
    flowerLight: '#c688a6',
    petal: '#ddaabd',
    petalLight: '#f1c9ce',
    lilac: '#a4a8c3',
    flowerStem: '#4e746d'
  };

  function makeRandom(seed) {
    let value = typeof seed === 'number' ? seed >>> 0 : 0x434f4d45;
    if (typeof seed === 'string') {
      for (let i = 0; i < seed.length; i++) {
        value = Math.imul(value ^ seed.charCodeAt(i), 16777619) >>> 0;
      }
    }
    return () => {
      value += 0x6d2b79f5;
      let n = value;
      n = Math.imul(n ^ (n >>> 15), n | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  }

  function draw(ctx, w, h, seed = 1729) {
    w = Math.round(w);
    h = Math.round(h);
    const random = makeRandom(seed);
    const scale = Math.max(0.62, Math.min(1.65, Math.min(w / 480, h / 300)));
    const P = PALETTE;
    const blossoms = [];
    const r = (lo, hi) => lo + random() * (hi - lo);
    const choose = values => values[Math.floor(random() * values.length)];
    const point = (x, y) => [Math.round(x * w), Math.round(y * h)];

    function rect(x, y, width, height, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
    }

    function line(x0, y0, x1, y1, color, thickness = 1) {
      x0 = Math.round(x0); y0 = Math.round(y0);
      x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0);
      const sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y0);
      const sy = y0 < y1 ? 1 : -1;
      let error = dx + dy;
      const size = Math.max(1, Math.round(thickness));
      const offset = Math.floor(size / 2);
      while (true) {
        rect(x0 - offset, y0 - offset, size, size, color);
        if (x0 === x1 && y0 === y1) break;
        const twice = error * 2;
        if (twice >= dy) { error += dy; x0 += sx; }
        if (twice <= dx) { error += dx; y0 += sy; }
      }
    }

    function polygon(points, color) {
      const pts = points.map(p => [Math.round(p[0]), Math.round(p[1])]);
      const first = Math.max(0, Math.min(...pts.map(p => p[1])));
      const last = Math.min(h - 1, Math.max(...pts.map(p => p[1])));
      ctx.fillStyle = color;
      for (let y = first; y <= last; y++) {
        const intersections = [];
        const scan = y + 0.5;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          if ((a[1] <= scan && b[1] > scan) || (b[1] <= scan && a[1] > scan)) {
            intersections.push(a[0] + (scan - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
          }
        }
        intersections.sort((a, b) => a - b);
        for (let i = 0; i + 1 < intersections.length; i += 2) {
          const left = Math.max(0, Math.ceil(intersections[i]));
          const right = Math.min(w, Math.ceil(intersections[i + 1]));
          if (right > left) ctx.fillRect(left, y, right - left, 1);
        }
      }
    }

    function taperedLine(a, b, wide, narrow, color) {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      polygon([
        [a[0] + nx * wide / 2, a[1] + ny * wide / 2],
        [b[0] + nx * narrow / 2, b[1] + ny * narrow / 2],
        [b[0] - nx * narrow / 2, b[1] - ny * narrow / 2],
        [a[0] - nx * wide / 2, a[1] - ny * wide / 2]
      ], color);
      line(a[0], a[1], b[0], b[1], color, Math.min(narrow, 2));
    }

    function branch(nodes, width, light = true) {
      const pts = nodes.map(p => point(p[0], p[1]));
      for (let i = 0; i < pts.length - 1; i++) {
        const fromWidth = Math.max(1, width * (1 - i / pts.length) * scale);
        const toWidth = Math.max(1, width * (1 - (i + 1) / pts.length) * scale);
        taperedLine(pts[i], pts[i + 1], fromWidth, toWidth, P.bark);
      }
      if (light) {
        for (let i = 0; i < pts.length - 1; i++) {
          const widthHere = Math.max(1, width * (1 - i / pts.length) * scale);
          const dx = Math.max(1, Math.round(widthHere * 0.21));
          taperedLine(
            [pts[i][0] - dx, pts[i][1]],
            [pts[i + 1][0] - dx, pts[i + 1][1]],
            widthHere * 0.32,
            Math.max(1, widthHere * 0.19),
            P.barkMid
          );
        }
      }
    }

    // The low, irregular banks leave a broad, uninterrupted pool in the middle.
    const shore = [
      [0, .803], [.035, .797], [.074, .806], [.105, .815], [.146, .832],
      [.177, .844], [.205, .861], [.248, .876], [.291, .894], [.339, .905],
      [.385, .920], [.438, .925], [.498, .931], [.552, .925], [.611, .909],
      [.649, .895], [.689, .875], [.735, .849], [.775, .817], [.809, .782],
      [.838, .751], [.866, .730], [.901, .719], [.949, .714], [1, .708]
    ].map(p => point(p[0], p[1]));
    polygon([...shore, [w, h], [0, h]], P.earth);
    for (let i = 0; i < shore.length - 1; i++) {
      const a = shore[i], b = shore[i + 1];
      line(a[0], a[1] + 1, b[0], b[1] + 1, i % 3 === 0 ? '#5b606f' : '#424953');
      line(a[0] + 2, a[1] + 3, b[0] - 1, b[1] + 3, '#303d47', 2);
    }

    function shoreY(x) {
      for (let i = 0; i < shore.length - 1; i++) {
        if (x >= shore[i][0] && x <= shore[i + 1][0]) {
          const t = (x - shore[i][0]) / Math.max(1, shore[i + 1][0] - shore[i][0]);
          return shore[i][1] + (shore[i + 1][1] - shore[i][1]) * t;
        }
      }
      return h * .80;
    }

    // Faceted stones and cool lichen break up the shore's silhouette.
    function stone(x, y, size, light = false) {
      const wide = Math.max(3, size * 1.5);
      const tall = Math.max(2, size * .68);
      polygon([
        [x - wide, y], [x - wide * .63, y - tall * .7],
        [x - wide * .16, y - tall], [x + wide * .55, y - tall * .78],
        [x + wide, y - tall * .17], [x + wide * .85, y + tall * .39],
        [x - wide * .72, y + tall * .41]
      ], P.rock);
      polygon([
        [x - wide * .79, y - tall * .16], [x - wide * .63, y - tall * .7],
        [x - wide * .16, y - tall], [x + wide * .55, y - tall * .78],
        [x + wide * .26, y - tall * .12]
      ], light ? P.rockLight : P.rockFace);
      line(x - wide * .55, y - tall * .61, x - wide * .16, y - tall * .82, P.mossLight);
      if (size > 6 * scale) {
        line(x + wide * .23, y - tall * .1, x + wide * .42, y + tall * .3, P.earth);
      }
    }

    for (let i = 0; i < Math.round(w / 6); i++) {
      const x = r(-8, w + 8);
      const edge = shoreY(x);
      const y = edge + r(3, Math.max(6, h - edge));
      const size = r(2.4, 6.3) * scale;
      if (random() > .34) stone(x, y, size, y < edge + 8);
      else rect(x, y, r(2, 6) * scale, 1, choose([P.moss, P.rock, P.rockFace]));
    }
    stone(w * .151, h * .846, 9 * scale, true);
    stone(w * .791, h * .834, 11 * scale, true);
    stone(w * .844, h * .796, 8 * scale, true);
    stone(w * .934, h * .760, 14 * scale, false);

    // A leaning, split cherry trunk. Branches remain visible between blossoms.
    branch([[.115,.850],[.103,.774],[.093,.672],[.077,.572],[.054,.465],[.040,.361],[.069,.264],[.115,.205]], 13);
    branch([[.072,.555],[.091,.445],[.122,.361],[.178,.287],[.253,.237],[.287,.220]], 7.2);
    branch([[.041,.370],[.017,.302],[.017,.239],[-.016,.179]], 6);
    branch([[.062,.277],[.088,.203],[.133,.150],[.178,.113]], 5.8);
    branch([[.092,.445],[.152,.413],[.188,.372],[.221,.340]], 3.9);
    branch([[.126,.359],[.136,.294],[.173,.247],[.205,.209]], 3.7);
    branch([[.177,.287],[.204,.296],[.246,.282],[.286,.266]], 2.8);
    branch([[.091,.208],[.059,.175],[.045,.139]], 3);
    branch([[.115,.850],[.149,.856],[.179,.868]], 8, false);
    branch([[.111,.840],[.080,.839],[.048,.826]], 7, false);
    line(w * .096, h * .70, w * .102, h * .76, P.barkLight, 1);
    line(w * .064, h * .505, w * .075, h * .548, P.barkLight, 1);
    line(w * .067, h * .365, w * .084, h * .327, '#786277', 1);
    rect(w * .092, h * .737, 2 * scale, 5 * scale, '#302738');
    rect(w * .092, h * .731, 3 * scale, 1, '#776078');

    // Each tuft has a stepped outline, a shadow underneath, and irregular lit petals.
    function flowerTuft(x, y, rx, ry, palette, variation) {
      const v = variation;
      const outline = [
        [-1,-.13],[-.91,-.45],[-.62,-.45],[-.62,-.75],[-.30,-.75],
        [-.22,-.97],[.18,-.97],[.18,-.82],[.52,-.82],[.52,-.58],
        [.81,-.58],[.81,-.30],[1,-.18],[1,.19],[.84,.19],[.84,.52],
        [.56,.52],[.56,.77],[.21,.77],[.21,.93],[-.19,.93],
        [-.19,.79],[-.49,.79],[-.49,.58],[-.79,.58],[-.79,.30],[-1,.30]
      ];
      polygon(outline.map(([a,b]) => [x + a * rx, y + b * ry]), palette[0]);
      rect(x - rx * .78, y - ry * .38, rx * 1.5, ry * .77, palette[1]);
      rect(x - rx * .45, y - ry * .67, rx * .95, ry * .87, palette[1]);
      rect(x - rx * .78, y - ry * .31, rx * .31, ry * .46, palette[2]);
      rect(x - rx * .42, y - ry * .76, rx * .53, ry * .51, palette[2]);
      rect(x + rx * .03, y - ry * .59, rx * .49, ry * .50, palette[2]);
      rect(x + rx * .35, y - ry * .16, rx * .35, ry * .38, palette[2]);
      const count = Math.max(3, Math.round(rx * ry / 9));
      for (let j = 0; j < count; j++) {
        const px = x + r(-.70, .68) * rx;
        const py = y + r(-.72, .40) * ry;
        const color = choose([palette[2], palette[3], palette[3], palette[4]]);
        rect(px, py, random() > .48 ? 2 : 1, 1, color);
        if (random() > .71) rect(px - 1, py + 1, 1, 1, palette[2]);
      }
      if (v > .72) {
        rect(x + rx * .20, y + ry * .60, 1, 2, palette[1]);
        rect(x - rx * .13, y + ry * .88, 1, 1, palette[2]);
      }
    }

    const blossomPalette = [P.flowerShadow, P.flowerDark, P.flowerMid, P.flowerLight, P.petal];
    const lightPalette = [P.flowerDark, P.flowerMid, P.flowerLight, P.petal, P.petalLight];

    function floweringMasses(masses, density = 1, muted = false) {
      const tufts = [];
      for (const [cx, cy, ex, ey] of masses) {
        const radiusX = ex * w;
        const radiusY = ey * h;
        const count = Math.max(7, Math.round(radiusX * radiusY / (45 * scale * scale) * density));
        for (let i = 0; i < count; i++) {
          const angle = random() * Math.PI * 2;
          const distance = Math.sqrt(random()) * .95;
          const x = cx * w + Math.cos(angle) * distance * radiusX;
          const y = cy * h + Math.sin(angle) * distance * radiusY;
          const rx = r(5.0, 10.2) * scale;
          const ry = rx * r(.57, .88);
          // Leave generous air around the centred welcome lettering.
          if (y + ry > h * .347 && y - ry < h * .60 && x + rx > w * .265 && x - rx < w * .735) continue;
          tufts.push({ x, y, rx, ry, bright: random() > (muted ? .84 : .69), variation: random() });
        }
      }
      tufts.sort((a, b) => a.y - b.y);
      for (const t of tufts) {
        flowerTuft(t.x, t.y, t.rx, t.ry, t.bright ? lightPalette : blossomPalette, t.variation);
        if (t.x > w * .085 && random() > .82) blossoms.push({ x: Math.round(t.x), y: Math.round(t.y) });
      }
    }

    floweringMasses([
      [.017,.236,.074,.061], [.055,.185,.082,.061], [.112,.135,.084,.057],
      [.177,.130,.085,.057], [.238,.181,.066,.059], [.273,.246,.053,.044],
      [.212,.275,.067,.054], [.156,.321,.068,.054], [.093,.361,.070,.061],
      [.032,.385,.070,.064], [.002,.455,.064,.050], [.041,.490,.047,.045]
    ], 1.12);

    // Small drooping blossom sprigs keep the canopy edge delicate.
    for (const [nx, ny, direction] of [[.212,.328,1],[.251,.290,1],[.292,.273,1],[.098,.412,-1],[.055,.542,1],[.157,.376,1]]) {
      const x = nx * w, y = ny * h;
      line(x, y - 5 * scale, x + direction * 2 * scale, y + 3 * scale, P.barkMid);
      rect(x + direction * 2 * scale, y + 3 * scale, 2, 2, P.flowerLight);
      rect(x - scale, y, 2, 1, P.petal);
      rect(x + direction * 3 * scale, y + 6 * scale, 1, 2, P.flowerMid);
    }

    // A shorter flowering tree and ferny undergrowth frame the opposite bank.
    branch([[.966,.783],[.949,.717],[.938,.653],[.913,.610],[.891,.584]], 7.5);
    branch([[.941,.669],[.975,.632],[1.012,.604]], 4.3);
    branch([[.948,.716],[.903,.683],[.872,.655],[.846,.649]], 3.7);
    branch([[.922,.628],[.927,.581],[.951,.552]], 3.5);
    floweringMasses([
      [.969,.571,.058,.031], [.922,.606,.058,.036], [.882,.645,.050,.028],
      [1.005,.627,.056,.044], [.973,.670,.053,.034]
    ], .90, true);

    function grass(x, y, height, light = false) {
      const color = light ? P.grassLight : choose([P.grass, P.grassDark, P.moss]);
      line(x, y, x - height * .20, y - height, color);
      line(x - 1, y, x - height * .55, y - height * .65, color);
      line(x + 1, y, x + height * .32, y - height * .92, color);
      line(x + 1, y, x + height * .70, y - height * .47, light ? P.grass : color);
    }

    function fern(x, y, height, lean) {
      line(x, y, x + lean * height * .40, y - height, P.grassLight);
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const bx = x + lean * height * .40 * t;
        const by = y - height * t;
        const leafSize = height * .23 * (1 - t * .56);
        line(bx, by, bx - leafSize, by - leafSize * .63, P.grass, 2 * scale);
        line(bx, by, bx + leafSize, by - leafSize * .45, P.grassLight, scale);
      }
    }

    function littleFlower(x, y, height, warm) {
      const top = Math.round(y - height);
      const tilt = choose([-1, 1]);
      line(x, y, x + tilt, top + 1, P.flowerStem);
      rect(x - 2, y - height * .38, 2, 1, P.grassLight);
      rect(x + 1, y - height * .60, 2, 1, P.mossLight);
      const shade = warm ? P.flowerLight : '#7d94ac';
      const light = warm ? P.petal : '#b8b6cc';
      rect(x + tilt - 1, top - 1, 3, 1, shade);
      rect(x + tilt - 2, top, 5, 1, shade);
      rect(x + tilt - 1, top + 1, 3, 1, light);
      rect(x + tilt, top, 1, 1, '#e1c9af');
    }

    // Plant in small groups, leaving stone, shadow, and breathing space between them.
    for (let i = 0; i < Math.round(w / 5.6); i++) {
      const x = r(-3, w + 3);
      const edge = shoreY(x);
      const y = r(edge + 3 * scale, h + 7 * scale);
      if (y > h) continue;
      const depth = (y - edge) / Math.max(1, h - edge);
      const height = r(3, 10) * scale * (.7 + depth * .4);
      grass(x, y, height, random() > .82);
      if (random() > .71) grass(x + r(2, 5) * scale, y + scale, height * .71);
      if (random() > .78 && (x < w * .30 || x > w * .73)) {
        littleFlower(x, y - scale, height + 3 * scale, random() > .43);
      }
    }
    fern(w * .030, h * .940, 18 * scale, 1);
    fern(w * .054, h * .978, 17 * scale, -1);
    fern(w * .198, h * .942, 12 * scale, 1);
    fern(w * .922, h * .924, 17 * scale, -1);
    fern(w * .973, h * .870, 19 * scale, -1);
    fern(w * .822, h * .934, 12 * scale, 1);

    // A handful of pale petals catch on the stones near the water.
    for (let i = 0; i < Math.round(w / 8); i++) {
      const x = i % 3 ? r(0, w * .30) : r(w * .76, w);
      const edge = shoreY(x);
      const y = edge + r(2, 20) * scale;
      if (y < h) rect(x, y, random() > .6 ? 2 : 1, 1, choose([P.flowerMid, P.flowerLight, '#8c718c']));
    }

    function mushroom(x, y, size) {
      const s = Math.max(1, Math.round(size));
      rect(x, y - s * 3, s, s * 3, '#b398a7');
      rect(x - s * 2, y - s * 4, s * 5, s, '#89556e');
      rect(x - s, y - s * 5, s * 3, s, '#b4778b');
      rect(x - s * 2, y - s * 3, s * 5, 1, '#e0b6b9');
      rect(x - s, y - s * 4, 1, 1, '#e6c6c5');
      rect(x + s, y - s * 5, 1, 1, '#d3a7b2');
    }
    mushroom(w * .167, h * .964, scale * 1.4);
    mushroom(w * .180, h * .969, scale);
    mushroom(w * .853, h * .957, scale);

    // One quiet pool of amber, with a little timber bracket above the lantern.
    const lanternX = Math.round(w * .859);
    const lanternY = Math.round(h * .767);
    const lampScale = Math.max(1, Math.round(scale));
    const lx = lanternX, ly = lanternY;
    line(lx + 6 * lampScale, ly + 11 * lampScale, lx + 6 * lampScale, ly - 10 * lampScale, '#393345', 2 * lampScale);
    line(lx + 6 * lampScale, ly - 10 * lampScale, lx, ly - 10 * lampScale, '#65516a', lampScale);
    line(lx, ly - 10 * lampScale, lx, ly - 5 * lampScale, '#64536a');
    rect(lx - 5 * lampScale, ly - 3 * lampScale, 10 * lampScale, 9 * lampScale, 'rgba(238, 176, 122, 0.035)');
    rect(lx - 4 * lampScale, ly - 2 * lampScale, 8 * lampScale, 7 * lampScale, 'rgba(247, 188, 125, 0.055)');
    rect(lx - 3 * lampScale, ly - 4 * lampScale, 6 * lampScale, lampScale, '#3a3042');
    rect(lx - 2 * lampScale, ly - 5 * lampScale, 4 * lampScale, lampScale, '#705663');
    rect(lx - 3 * lampScale, ly - 3 * lampScale, 6 * lampScale, 6 * lampScale, '#78545c');
    rect(lx - 2 * lampScale, ly - 3 * lampScale, 4 * lampScale, 5 * lampScale, '#e0a775');
    rect(lx - lampScale, ly - 2 * lampScale, 2 * lampScale, 4 * lampScale, '#ffe0a3');
    rect(lx - 3 * lampScale, ly + 3 * lampScale, 6 * lampScale, lampScale, '#4b3b4d');
    rect(lx, ly - 3 * lampScale, lampScale, 6 * lampScale, '#a77364');

    // Near-camera blades are almost silhouettes, keeping the image grounded.
    for (let i = 0; i < Math.round(w / 8); i++) {
      const x = r(-5, w + 5);
      const tall = r(3, 11) * scale;
      line(x, h + 1, x - r(1, 4) * scale, h - tall, P.ink, 2 * scale);
      line(x + 1, h + 2, x + r(2, 7) * scale, h - tall * .66, P.ink, scale);
    }

    return {
      lantern: { x: lanternX, y: lanternY, radius: 12 * scale },
      blossoms,
      shore: shore.map(([x, y]) => ({ x, y }))
    };
  }

  globalThis.PixelGarden = { draw };
})();
