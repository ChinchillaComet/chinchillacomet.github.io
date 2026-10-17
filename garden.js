/*
 * Authored pixel scenery. Connected, stepped colour planes replace circular
 * tufts and random dots. Every raster mark is opaque and integer aligned.
 */
(() => {
  'use strict';
  const P = {
    ink:'#161a2f',deep:'#20243a',slate:'#30364c',stone:'#41455f',midStone:'#555773',
    mauve:'#694563',bark:'#493448',blushShade:'#804967',blushDark:'#a35b7d',
    blush:'#c87696',pink:'#e99aad',petal:'#f7c0c7',cream:'#ffedcf',light:'#ffe1bd',
    teal0:'#203b48',teal1:'#2d5157',teal2:'#416c6a',teal3:'#639084',
    lavender:'#bc9cad',amber:'#e9a56c',gold:'#f6cf8f'
  };
  function draw(ctx,width,height) {
    const w=Math.round(width),h=Math.round(height);
    const portrait=h>w*1.25,short=h<205,blossoms=[];
    const rect=(x,y,rw,rh,color)=>{
      ctx.fillStyle=color;
      ctx.fillRect(Math.round(x),Math.round(y),Math.round(rw),Math.round(rh));
    };
    function polygon(points,color) {
      const pts=points.map(([x,y])=>[Math.round(x),Math.round(y)]);
      const top=Math.max(0,Math.min(...pts.map(p=>p[1])));
      const bottom=Math.min(h-1,Math.max(...pts.map(p=>p[1])));
      ctx.fillStyle=color;
      for(let y=top;y<=bottom;y++) {
        const edges=[];
        for(let i=0;i<pts.length;i++) {
          const a=pts[i],b=pts[(i+1)%pts.length];
          if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5)) {
            edges.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
          }
        }
        edges.sort((a,b)=>a-b);
        for(let i=0;i+1<edges.length;i+=2) {
          const left=Math.max(0,Math.ceil(edges[i])),right=Math.min(w,Math.ceil(edges[i+1]));
          if(right>left)ctx.fillRect(left,y,right-left,1);
        }
      }
    }
    function line(x0,y0,x1,y1,color) {
      x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
      const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;
      let error=dx+dy;
      while(true) {
        rect(x0,y0,1,1,color);
        if(x0===x1&&y0===y1)break;
        const e=error*2;
        if(e>=dy){error+=dy;x0+=sx;}if(e<=dx){error+=dx;y0+=sy;}
      }
    }
    function sprite(rows,x,y,palette) {
      x=Math.round(x);y=Math.round(y);
      for(let sy=0;sy<rows.length;sy++)for(let sx=0;sx<rows[sy].length;sx++) {
        const color=palette[rows[sy][sx]];
        if(color)rect(x+sx,y+sy,1,1,color);
      }
    }
    function at(x,y) {
      return {
        shape:(pts,color)=>polygon(pts.map(([px,py])=>[px+x,py+y]),color),
        box:(px,py,rw,rh,color)=>rect(px+x,py+y,rw,rh,color),
        stroke:(x0,y0,x1,y1,color)=>line(x+x0,y+y0,x+x1,y+y1,color)
      };
    }

    // Terrain adapts to the viewport. Illustrated objects retain fixed pixel
    // dimensions. Broad, untextured planes leave the lake calm and readable.
    const bank=(portrait?[
      [0,.817],[.08,.819],[.16,.840],[.25,.866],[.36,.905],[.45,.934],
      [.57,.946],[.66,.929],[.73,.891],[.80,.847],[.88,.815],[1,.806]
    ]:[
      [0,.799],[.04,.802],[.09,.814],[.15,.838],[.20,.866],[.27,.895],
      [.34,.919],[.43,.937],[.53,.937],[.60,.918],[.66,.882],[.72,.838],
      [.77,.790],[.82,.754],[.89,.726],[1,.718]
    ]).map(([x,y])=>[Math.round(x*w),Math.round(y*h)]);
    polygon([...bank,[w,h],[0,h]],P.deep);
    polygon([[0,Math.round(h*.91)],[Math.round(w*.12),Math.round(h*.90)],
      [Math.round(w*.30),Math.round(h*.97)],[Math.round(w*.60),h],
      [Math.round(w*.83),Math.round(h*.88)],[w,Math.round(h*.84)],[w,h],[0,h]],P.ink);
    function shoreY(x) {
      for(let i=0;i<bank.length-1;i++) {
        const a=bank[i],b=bank[i+1];
        if(x>=a[0]&&x<=b[0])return Math.round(a[1]+(b[1]-a[1])*(x-a[0])/Math.max(1,b[0]-a[0]));
      }
      return bank[x<0?0:bank.length-1][1];
    }
    for(let i=0;i<bank.length-1;i++) {
      const a=bank[i],b=bank[i+1];
      line(a[0],a[1],b[0],b[1],i>9?P.stone:P.slate);
      if([0,2,4,8,11,13].includes(i)) {
        rect(a[0]+2,a[1]+2,Math.max(3,Math.floor((b[0]-a[0])*.68)),2,P.teal0);
      }
    }
    const ROCK=[
      '.....aaaaaa.......','...aabbbbbbaaa....','..abbbbccbbbbbba..',
      '.abcccccbbbbbbbba.','abcccccbbbddddddba','abbbbbbbddddddddea',
      '.adddddddddddeeea.','..aaaaaaaaaaaaaa..'
    ];
    const rockPalette={a:P.deep,b:P.stone,c:P.midStone,d:P.slate,e:P.ink};
    function rock(x,y,large=false) {
      if(large) {
        const q=at(x,y);
        q.shape([[0,0],[3,-6],[12,-10],[23,-10],[31,-5],[33,2],[27,6],[7,6]],P.slate);
        q.shape([[1,-1],[4,-6],[12,-9],[23,-9],[28,-5],[18,-3],[15,0]],P.stone);
        q.shape([[5,-6],[12,-9],[20,-9],[18,-7],[10,-5]],P.midStone);
        q.shape([[18,-2],[29,-5],[32,1],[27,4],[19,4]],P.deep);
        q.box(7,-8,8,1,P.teal2);q.box(6,-7,4,1,P.teal1);q.box(24,3,7,1,P.ink);
      } else sprite(ROCK,x,y-7,rockPalette);
    }

    // The three sections of the crown are authored planes, with broad lit
    // surfaces, smaller rose facets, and a consistent violet underside.
    const rootX=portrait?18:Math.round(w*.088);
    const rootY=shoreY(rootX)+(short?6:13);
    function canopy(x,y) {
      const q=at(x,y);
      // Keep the already drawn branches and landscape beneath this crown.
      // The authored cutouts below open gaps between the boughs, with exact
      // pixel masks, rather than erasing the scene or introducing alpha.
      const beneath=ctx.getImageData(0,0,w,h);
      q.shape([
        [-24,38],[-17,38],[-17,31],[-7,31],[-7,23],[7,23],[7,16],[20,16],
        [20,10],[35,10],[35,5],[49,5],[49,1],[68,1],[68,4],[83,4],[83,8],
        [97,8],[97,13],[111,13],[111,19],[123,19],[123,26],[136,26],[136,34],
        [146,34],[146,43],[154,43],[154,53],[160,53],[160,61],[156,61],
        [156,68],[146,68],[146,73],[133,73],[133,76],[118,76],[118,73],
        [106,73],[106,68],[95,68],[95,72],[81,72],[81,77],[65,77],
        [65,73],[52,73],[52,79],[39,79],[39,84],[24,84],[24,89],[7,89],
        [7,93],[-8,93],[-8,87],[-21,87],[-21,76],[-28,76],[-28,56],[-24,56]
      ],P.mauve);
      q.shape([
        [-22,38],[-15,38],[-15,31],[-5,31],[-5,24],[8,24],[8,17],[22,17],
        [22,11],[36,11],[36,6],[50,6],[50,2],[67,2],[67,5],[83,5],[83,9],
        [97,9],[97,14],[109,14],[109,20],[121,20],[121,27],[134,27],[134,36],
        [143,36],[143,44],[151,44],[151,54],[155,54],[155,60],[148,60],
        [148,65],[135,65],[135,69],[122,69],[122,64],[111,64],[111,58],
        [99,58],[99,62],[88,62],[88,67],[74,67],[74,63],[59,63],[59,68],
        [46,68],[46,75],[33,75],[33,78],[22,78],[22,84],[8,84],[8,87],
        [-5,87],[-5,80],[-18,80],[-18,71],[-24,71],[-24,53],[-22,53]
      ],P.blushDark);
      q.shape([
        [-15,36],[-4,36],[-4,28],[11,28],[11,20],[25,20],[25,13],[39,13],
        [39,8],[52,8],[52,4],[67,4],[67,7],[81,7],[81,11],[95,11],
        [95,17],[106,17],[106,23],[116,23],[116,30],[126,30],[126,37],
        [135,37],[135,43],[129,43],[129,47],[117,47],[117,43],[110,43],
        [110,39],[98,39],[98,44],[84,44],[84,48],[70,48],[70,43],[62,43],
        [62,46],[49,46],[49,51],[37,51],[37,58],[23,58],[23,64],[8,64],
        [8,72],[-3,72],[-3,67],[-15,67],[-15,59],[-20,59],[-20,45],[-15,45]
      ],P.blush);
      q.shape([
        [3,31],[13,31],[13,22],[27,22],[27,15],[40,15],[40,10],[54,10],
        [54,6],[67,6],[67,9],[79,9],[79,14],[88,14],[88,20],[99,20],
        [99,25],[91,25],[91,29],[79,29],[79,26],[70,26],[70,30],[57,30],
        [57,35],[45,35],[45,30],[37,30],[37,34],[25,34],[25,39],[14,39],
        [14,43],[3,43],[-3,39],[-3,35],[3,35]
      ],P.pink);
      q.shape([[38,15],[42,15],[42,11],[55,11],[55,8],[65,8],[65,12],
        [60,12],[60,16],[49,16],[49,19],[39,19],[39,17],[35,17],[35,15]],P.petal);
      q.shape([[14,26],[19,26],[19,23],[27,23],[27,26],[23,26],[23,29],
        [16,29],[16,31],[11,31],[11,28],[14,28]],P.petal);
      q.shape([[71,15],[78,15],[78,18],[83,18],[83,21],[77,21],[77,23],
        [71,23],[71,20],[67,20],[67,17],[71,17]],P.petal);
      q.shape([[-16,47],[-9,47],[-9,43],[-1,43],[-1,46],[8,46],[8,50],
        [2,50],[2,55],[-8,55],[-8,58],[-17,58],[-17,52]],P.pink);
      q.shape([[101,28],[109,28],[109,32],[118,32],[118,36],[111,36],
        [111,39],[103,39],[103,35],[97,35],[97,31],[101,31]],P.pink);
      q.shape([[128,48],[137,48],[137,52],[147,52],[147,57],[140,57],
        [140,60],[128,60],[128,57],[121,57],[121,52],[128,52]],P.blush);
      q.box(130,49,6,2,P.pink);q.box(137,53,5,2,P.pink);
      q.box(-8,48,6,2,P.petal);q.box(103,29,5,2,P.petal);
      // An asymmetric lower bough leaves a real opening above its right edge.
      q.shape([[-28,76],[-17,76],[-17,71],[-3,71],[-3,67],[11,67],[11,71],
        [23,71],[23,75],[36,75],[36,80],[49,80],[49,86],[58,86],[58,94],
        [65,94],[65,102],[58,102],[58,109],[48,109],[48,114],[37,114],
        [37,118],[26,118],[26,114],[13,114],[13,119],[1,119],[1,115],
        [-11,115],[-11,109],[-23,109],[-23,101],[-29,101]],P.mauve);
      q.shape([[-26,76],[-15,76],[-15,72],[-2,72],[-2,69],[10,69],[10,73],
        [22,73],[22,77],[34,77],[34,82],[47,82],[47,88],[56,88],[56,95],
        [60,95],[60,101],[52,101],[52,106],[41,106],[41,110],[28,110],
        [28,105],[17,105],[17,110],[3,110],[3,106],[-10,106],[-10,100],
        [-22,100],[-22,91],[-26,91]],P.blushDark);
      q.shape([[-22,79],[-13,79],[-13,75],[0,75],[0,72],[10,72],[10,76],
        [21,76],[21,81],[32,81],[32,85],[42,85],[42,91],[49,91],[49,96],
        [41,96],[41,100],[32,100],[32,96],[21,96],[21,100],[9,100],
        [9,96],[-2,96],[-2,91],[-14,91],[-14,87],[-22,87]],P.blush);
      q.shape([[-16,79],[-9,79],[-9,76],[1,76],[1,75],[9,75],[9,79],
        [18,79],[18,83],[26,83],[26,88],[20,88],[20,91],[11,91],
        [11,87],[2,87],[2,89],[-7,89],[-7,85],[-16,85]],P.pink);
      q.shape([[-8,79],[0,79],[0,78],[7,78],[7,81],[3,81],[3,84],
        [-5,84],[-5,82],[-8,82]],P.petal);
      q.box(25,85,7,2,P.pink);q.box(32,88,4,2,P.pink);
      for(const [px,py]of[[46,113],[35,120],[4,120],[144,73],[129,78],[77,77]]) {
        q.box(px,py,2,2,P.blush);q.box(px+1,py+3,1,2,P.pink);
        if(x+px>0&&x+px<w)blossoms.push({x:x+px,y:y+py});
      }
      // Three openings expose the branch structure. Each entry is an exact
      // horizontal span of sky/wood restored from before the foliage pass.
      const gaps=[
        // The upper silhouette has separate rising tips, not a smooth dome.
        [70,0,24,5],[73,5,19,3],[77,8,15,3],[80,11,9,3],[82,14,5,2],
        [106,0,34,14],[111,14,22,3],[115,17,17,3],[118,20,13,3],
        [121,23,7,3],[122,26,4,3],
        [96,37,3,2],[95,39,6,2],[94,41,8,2],[92,43,10,2],[91,45,13,2],
        [88,47,17,3],[86,50,18,2],[84,52,23,3],[82,55,28,3],
        [80,58,31,3],[78,61,35,3],[76,64,39,3],[75,67,42,4],[74,71,45,9],
        [32,64,3,2],[30,66,6,2],[28,68,9,2],[26,70,13,2],[23,72,18,2],
        [21,74,24,3],[22,77,27,3],[29,80,24,3],[38,83,19,3],[47,86,15,3],
        [-28,53,18,2],[-28,55,23,2],[-28,57,31,2],[-28,59,33,2],
        [-28,61,28,2],[-28,63,18,3],
        // Tiny edge breaks replace the coarse right-angle corners.
        [49,1,2,1],[35,5,2,1],[35,6,1,1],[20,10,2,1],[20,11,1,1],
        [7,16,2,1],[7,17,1,1],[-7,23,2,1],[-17,31,2,1],
        [81,4,2,1],[95,8,2,1],[109,13,2,1],[121,19,2,1],
        [134,26,2,1],[144,34,2,1],[152,43,2,1],[158,53,2,1],
        [156,59,4,2],[152,66,4,2],[140,73,6,2],[127,76,6,2],
        [-3,67,2,1],[21,71,2,1],[34,75,2,1],[47,80,2,1],
        [56,86,2,1],[63,94,2,2],[60,99,5,3],[52,108,6,1],
        [42,113,6,1],[31,117,6,1],[7,117,6,2]
      ];
      for(const[gx,gy,gw,gh]of gaps) {
        const px=Math.max(0,x+gx),py=Math.max(0,y+gy);
        const pw=Math.min(w,x+gx+gw)-px,ph=Math.min(h,y+gy+gh)-py;
        if(pw>0&&ph>0)ctx.putImageData(beneath,0,0,px,py,pw,ph);
      }
      // Light meets the outer contour on the upper-left faces, preventing
      // parallel dark bands around every mass.
      q.shape([[36,6],[48,6],[48,4],[52,4],[52,2],[66,2],[66,5],
        [60,5],[60,9],[48,9],[48,12],[39,12],[39,10],[35,10]],P.pink);
      q.shape([[8,17],[19,17],[19,13],[25,13],[25,16],[22,16],[22,21],
        [14,21],[14,24],[8,24],[8,21],[5,21],[5,19],[8,19]],P.pink);
      q.box(50,3,10,2,P.petal);q.box(40,7,8,2,P.petal);
      q.box(11,18,7,2,P.petal);q.box(22,13,3,2,P.petal);
      q.shape([[89,15],[93,15],[93,12],[98,12],[98,10],[102,10],
        [102,13],[106,13],[106,17],[109,17],[109,20],[101,20],
        [101,24],[94,24],[94,21],[89,21]],P.blush);
      q.box(96,14,6,2,P.pink);q.box(100,16,5,2,P.pink);
      // Specific blossom sprays: each is a different hand-authored connected
      // cluster. They concentrate at plane transitions and branch tips; broad
      // areas between them remain quiet. All details share the 1 px grid.
      const sprays=[
        ['....cc......','..cccccc....','.cccbcccc...','bbbbcbccbb..','..bbbbbbba..','....aaaba...','.......a....'],
        ['...cc.......','.cccc..cc...','cccbcccccc..','.bbbcbbbcc..','...bbbbbb...','....aabb....'],
        ['......cc....','...cccccc...','.ccccbbccc..','bbbbbbbcc...','..bbbabbb...','....aa......'],
        ['..cc.......','cccccc.....','.cccbcccc..','..bbbbccbb.','....bbbba..','......aa...'],
        ['.....cc.....','..ccccc.....','ccccbbccc...','.bbbbbbcccc.','...aabbbbc..','.....aabb...'],
        ['..cccc......','ccccbbcc....','.bbbcbbcccc.','..bbbbbbc...','....aabba...','.......a....'],
        ['....cc......','..ccccccc...','cccbccccb...','.bbbbbcbbb..','...babbb....','....aaa.....'],
        ['..cc........','cccccc..cc..','.bccbbcccc..','..bbbbbbbcc.','....abbbb...','......aa....']
      ];
      const rose={a:P.blushDark,b:P.blush,c:P.pink};
      const lit={a:P.blush,b:P.pink,c:P.petal};
      const shaded={a:P.mauve,b:P.blushDark,c:P.blush};
      const placements=[
        [0,24,23,lit],[1,54,13,lit],[2,73,22,rose],[3,6,36,rose],
        [4,38,32,rose],[5,60,37,rose],[6,104,22,rose],[7,116,37,rose],
        [3,143,49,rose],[6,125,60,shaded],[2,48,51,shaded],[1,12,56,shaded],
        [4,-16,34,rose],[5,-13,72,rose],[0,3,77,lit],[7,18,85,rose],
        [2,34,94,rose],[3,46,101,shaded],[6,8,101,shaded],[1,-15,95,shaded]
      ];
      for(const[index,px,py,palette]of placements)sprite(sprays[index],x+px,y+py,palette);
      // Short shadow clefts and a few one-pixel flower centres add definition
      // without checkerboard dithering or evenly distributed stippling.
      q.shape([[39,44],[44,44],[44,41],[48,41],[48,43],[46,43],
        [46,46],[41,46],[41,49],[34,49],[34,47],[39,47]],P.blushDark);
      q.shape([[65,55],[70,55],[70,52],[73,52],[73,56],[70,56],
        [70,59],[64,59],[64,61],[59,61],[59,59],[65,59]],P.blushDark);
      q.box(33,26,1,1,P.petal);q.box(61,16,1,1,P.petal);
      q.box(119,40,1,1,P.petal);q.box(20,89,1,1,P.petal);
      // Small scallops at the open branch tips share the smaller cluster scale.
      sprite(['.bb....','bbbbcc.','.bbccc.','..aab..','...a...'],x+85,y+45,shaded);
      sprite(['..cc...','.cccc..','bbcccc.','.bbbb..','..aa...'],x+105,y+50,rose);
      sprite(['..bb...','bbbbcc.','.bbccc.','..aab..'],x+29,y+62,shaded);
    }
    if(!short) {
      const treeHeight=portrait?292:h<285?203:224;
      const ox=portrait?-23:rootX-38,oy=rootY-treeHeight;
      const q=at(ox,oy),bottom=treeHeight;
      // Alternate, deliberately drawn trunk profiles keep the canopy fixed.
      q.shape([[24,bottom],[59,bottom],[51,bottom-4],[45,bottom-9],
        [41,bottom-39],[32,158],[25,138],[22,115],[27,99],[44,84],[59,78],
        [87,72],[117,62],[147,50],[145,45],[114,55],[87,63],[62,66],
        [70,49],[91,28],[87,25],[65,43],[54,60],[39,70],[22,85],
        [21,67],[29,47],[44,29],[40,26],[24,42],[15,58],[12,80],
        [14,99],[9,80],[1,64],[-12,55],[-16,59],[-4,70],[1,91],
        [9,117],[13,144],[22,170],[28,bottom-33],[31,bottom-7]],P.ink);
      q.shape([[30,bottom-3],[49,bottom-3],[40,bottom-13],[36,bottom-40],
        [28,158],[20,137],[18,115],[23,97],[40,81],[57,74],[86,68],
        [112,60],[90,65],[60,69],[51,76],[37,80],[22,93],[17,99],
        [17,82],[16,77],[17,102],[14,109],[17,138],[25,164],
        [31,bottom-36],[34,bottom-8]],P.bark);
      q.shape([[34,bottom-12],[35,bottom-34],[30,172],[23,152],[20,138],
        [18,119],[21,102],[28,94],[24,93],[17,101],[15,117],[17,140],
        [21,156],[26,174],[31,bottom-32],[31,bottom-13]],P.mauve);
      q.stroke(21,124,23,139,P.blushShade);q.stroke(28,164,31,177,P.blushShade);
      q.stroke(37,bottom-22,37,bottom-12,P.blushShade);
      q.box(27,159,2,7,P.ink);q.box(29,167,2,3,P.ink);
      q.shape([[32,bottom-5],[19,bottom-2],[6,bottom],[25,bottom+2],
        [37,bottom],[54,bottom+2],[72,bottom+1],[53,bottom-2],[44,bottom-6]],P.bark);
      q.stroke(21,bottom-1,32,bottom-3,P.mauve);
      q.stroke(28,106,62,96,P.bark);q.stroke(61,96,88,85,P.bark);
      q.stroke(62,96,70,84,P.bark);q.stroke(90,67,112,76,P.bark);
      canopy(ox,oy);
    } else {
      // An independently authored 112 × 125 tree for shallow windows.
      const q=at(rootX-24,rootY-123);
      q.shape([[16,123],[37,123],[31,116],[28,91],[21,76],[20,62],
        [36,47],[65,40],[90,29],[88,26],[64,36],[36,41],[42,24],
        [38,23],[30,40],[18,52],[14,33],[10,35],[14,58],[12,69],
        [18,88],[21,116]],P.ink);
      q.shape([[21,119],[30,119],[25,90],[18,72],[18,57],[16,59],
        [15,71],[21,92]],P.bark);q.stroke(18,79,24,99,P.mauve);
      const miniBeneath=ctx.getImageData(0,0,w,h);
      q.shape([[-25,25],[-18,25],[-18,18],[-6,18],[-6,12],[8,12],[8,7],
        [21,7],[21,3],[38,3],[38,7],[51,7],[51,13],[64,13],[64,18],
        [77,18],[77,25],[91,25],[91,33],[101,33],[101,42],[96,42],
        [96,48],[82,48],[82,53],[66,53],[66,49],[52,49],[52,54],
        [38,54],[38,59],[23,59],[23,68],[10,68],[10,74],[-4,74],
        [-4,69],[-16,69],[-16,61],[-25,61]],P.mauve);
      q.shape([[-23,26],[-16,26],[-16,19],[-4,19],[-4,13],[10,13],
        [10,8],[23,8],[23,4],[37,4],[37,9],[50,9],[50,15],[62,15],
        [62,20],[75,20],[75,27],[88,27],[88,35],[97,35],[97,41],
        [87,41],[87,46],[72,46],[72,42],[59,42],[59,47],[43,47],
        [43,52],[29,52],[29,58],[16,58],[16,64],[3,64],[3,69],
        [-8,69],[-8,62],[-20,62],[-20,51],[-23,51]],P.blushDark);
      q.shape([[-19,26],[-12,26],[-12,21],[-1,21],[-1,15],[12,15],
        [12,10],[25,10],[25,6],[36,6],[36,11],[46,11],[46,17],[58,17],
        [58,23],[69,23],[69,29],[79,29],[79,35],[66,35],[66,32],
        [54,32],[54,36],[39,36],[39,41],[25,41],[25,47],[12,47],
        [12,54],[-1,54],[-1,59],[-13,59],[-13,49],[-21,49],[-21,36],[-19,36]],P.blush);
      q.shape([[-7,25],[2,25],[2,18],[14,18],[14,12],[26,12],[26,9],
        [35,9],[35,14],[42,14],[42,20],[51,20],[51,26],[40,26],
        [40,29],[29,29],[29,25],[20,25],[20,30],[9,30],[9,34],[-7,34]],P.pink);
      q.box(16,15,8,2,P.petal);q.box(24,12,8,2,P.petal);
      q.box(1,26,8,2,P.petal);q.box(30,21,6,2,P.petal);
      q.box(-10,45,7,3,P.pink);q.box(68,32,7,2,P.pink);
      const miniCuts=[
        [43,0,20,12],[46,12,13,3],[49,15,9,3],[51,18,5,2],
        [55,27,2,2],[54,29,4,2],[51,31,8,3],[47,34,13,3],
        [43,37,20,3],[39,40,28,5],[37,45,32,12],
        [21,3,2,1],[8,7,2,1],[-6,12,2,1],[-18,18,2,1],
        [89,25,2,1],[99,33,2,1],[93,45,3,3]
      ];
      for(const[gx,gy,gw,gh]of miniCuts) {
        const px=Math.max(0,rootX-24+gx),py=Math.max(0,rootY-123+gy);
        const pw=Math.min(w,rootX-24+gx+gw)-px;
        const ph=Math.min(h,rootY-123+gy+gh)-py;
        if(pw>0&&ph>0)ctx.putImageData(miniBeneath,0,0,px,py,pw,ph);
      }
      q.shape([[10,8],[22,8],[22,5],[29,5],[29,8],[25,8],[25,11],
        [19,11],[19,14],[12,14],[12,11],[9,11]],P.pink);
      q.box(22,6,5,1,P.petal);
      const miniPalette={a:P.blushDark,b:P.blush,c:P.pink};
      const miniLight={a:P.blush,b:P.pink,c:P.petal};
      const miniA=['....cc....','..cccccc..','bbbbccbbb.','.bbbbbb...','...aa.....'];
      const miniB=['..cc.....','ccccc.cc.','.bbcccccc','..bbbbbb.','....aa...'];
      for(const[px,py,rows,colors]of[
        [16,16,miniA,miniLight],[33,27,miniB,miniPalette],[68,26,miniA,miniPalette],
        [83,37,miniB,miniPalette],[-7,38,miniA,miniPalette],[7,48,miniB,miniPalette],
        [16,57,miniA,miniPalette]
      ])sprite(rows,rootX-24+px,rootY-123+py,colors);
      blossoms.push({x:rootX+59,y:rootY-73},{x:rootX-17,y:rootY-51});
    }

    // A fixed-size lower-right flowering bough, cropped at the outer edge.
    const bushX=w-(portrait?52:72),bushY=shoreY(w-16)-(short?39:52);
    const b=at(bushX,bushY);
    b.shape([[56,63],[69,65],[65,58],[60,43],[58,31],[43,21],[23,14],
      [21,16],[40,25],[48,31],[53,42],[39,36],[23,32],[7,32],
      [8,35],[23,35],[40,42],[55,49],[58,60]],P.ink);
    b.stroke(59,57,54,35,P.bark);b.stroke(53,34,41,25,P.bark);
    b.stroke(54,38,68,27,P.bark);b.stroke(68,27,80,21,P.bark);
    b.shape([[11,9],[19,9],[19,5],[30,5],[30,1],[42,1],[42,5],[54,5],
      [54,10],[64,10],[64,16],[75,16],[75,21],[87,21],[87,31],[80,31],
      [80,37],[69,37],[69,41],[57,41],[57,36],[44,36],[44,30],[33,30],
      [33,25],[21,25],[21,22],[12,22],[12,17],[6,17],[6,13],[11,13]],P.mauve);
    b.shape([[13,10],[20,10],[20,6],[31,6],[31,2],[41,2],[41,6],[52,6],
      [52,11],[62,11],[62,17],[73,17],[73,22],[84,22],[84,29],[75,29],
      [75,34],[63,34],[63,30],[52,30],[52,25],[39,25],[39,20],[25,20],
      [25,17],[14,17]],P.blushDark);
    b.shape([[20,10],[25,10],[25,7],[32,7],[32,4],[40,4],[40,8],[49,8],
      [49,13],[57,13],[57,18],[65,18],[65,23],[55,23],[55,20],[44,20],
      [44,17],[33,17],[33,14],[20,14]],P.blush);
    b.shape([[27,9],[33,9],[33,6],[39,6],[39,10],[45,10],[45,13],
      [37,13],[37,11],[27,11]],P.pink);
    b.box(32,7,5,1,P.petal);b.box(50,16,5,2,P.pink);
    b.shape([[-8,30],[0,30],[0,26],[11,26],[11,24],[22,24],[22,29],
      [33,29],[33,35],[43,35],[43,42],[35,42],[35,47],[23,47],[23,44],
      [12,44],[12,48],[1,48],[1,44],[-8,44],[-8,40],[-14,40],[-14,35],[-8,35]],P.mauve);
    b.shape([[-6,31],[1,31],[1,27],[10,27],[10,26],[21,26],[21,31],
      [31,31],[31,36],[39,36],[39,40],[30,40],[30,43],[21,43],[21,39],
      [12,39],[12,43],[2,43],[2,39],[-8,39],[-8,35],[-6,35]],P.blushDark);
    b.shape([[0,32],[5,32],[5,29],[10,29],[10,28],[18,28],[18,32],
      [24,32],[24,36],[17,36],[17,34],[9,34],[9,37],[0,37]],P.blush);
    b.box(8,30,7,2,P.pink);b.box(13,29,3,1,P.petal);
    // Light breaks the near bush's upper contour in selected places.
    b.box(31,2,9,2,P.blush);b.box(30,4,5,2,P.pink);
    b.box(21,6,6,2,P.blush);b.box(12,25,8,2,P.blush);
    sprite(['...cc.....','.ccccccc..','bbbbccbbb.','..bbbbb...','....aa....'],
      bushX+39,bushY+13,{a:P.blushDark,b:P.blush,c:P.pink});
    sprite(['..bb....','bbbbcc..','.bbcccc.','..bbb...','...aa...'],
      bushX+17,bushY+34,{a:P.mauve,b:P.blushDark,c:P.blush});
    blossoms.push({x:bushX+33,y:bushY+45});

    // Hand-drawn plant and rock sprites, grouped with plenty of breathing room.
    const grassRows=[
      '.......b.....','..a....b..a..','...a..bb..a..','.a.a..b..a...',
      '..a.a.b.aa.b.','..aa.ab.a.b..','...a.ab.a.b..','....aaaba.b..',
      '.....aaaaa...','......aaa....'
    ];
    const fernRows=[
      '..........c.....','........cc......','.....b...c..b...','......bbbcbb....',
      '........cc......','...bb...c...b...','.....bbbcbbb....','.......cc.......',
      '.bb....c....bb..','...bbbacbbbb....','......ac........','bb....a.....bb..',
      '..bbaaabbbbb....','.....aa.........','.....a..........','.....a..........'
    ];
    const plantPalette={a:P.teal0,b:P.teal1,c:P.teal2};
    function grass(x,y,lit=false){sprite(grassRows,x-6,y-9,lit?{a:P.teal1,b:P.teal2}:plantPalette);}
    function fern(x,y){sprite(fernRows,x-5,y-15,plantPalette);}
    function flowers(x,y) {
      sprite(['..p........','.ppg....l..','..s....llg.','..s.....s..','..s.a...s..',
        '.asaaa..sa.','..sa...as..','..ss...ss..','...s...s...'],x,y-8,
      {p:P.pink,l:P.lavender,g:P.gold,s:P.teal1,a:P.teal2});
    }
    const leftStone=portrait?27:Math.round(w*.15);
    rock(leftStone,shoreY(leftStone)+8,true);
    const rightStone=Math.round(w*.79);
    rock(rightStone,shoreY(rightStone)+7,true);rock(w-25,shoreY(w-25)+16);
    const lampX=portrait?w-47:Math.round(w*.855),lampGround=shoreY(lampX)+10;
    // A small amber-lit patch connects the lantern to the ground, with a
    // warm-facing edge on the nearest rock. No translucent glow is needed.
    polygon([[lampX-7,lampGround-1],[lampX+4,lampGround-2],[lampX+14,lampGround],
      [lampX+18,lampGround+2],[lampX+11,lampGround+4],[lampX-1,lampGround+4],
      [lampX-9,lampGround+2]],P.bark);
    rect(lampX-3,lampGround,11,1,P.mauve);
    rect(lampX+1,lampGround+2,6,1,P.blushShade);
    rect(lampX+2,lampGround,2,1,P.amber);
    const rockY=shoreY(rightStone)+7;
    if(portrait) {
      polygon([[rightStone+4,rockY-6],[rightStone+11,rockY-9],
        [rightStone+14,rockY-9],[rightStone+10,rockY-6],
        [rightStone+5,rockY-4],[rightStone+2,rockY-1]],P.mauve);
      rect(rightStone+8,rockY-6,2,1,P.blushShade);
    } else {
      polygon([[rightStone+22,rockY-9],[rightStone+26,rockY-7],
        [rightStone+29,rockY-4],[rightStone+27,rockY-3],[rightStone+25,rockY-6],
        [rightStone+21,rockY-7]],P.mauve);
      rect(rightStone+25,rockY-6,2,1,P.blushShade);
    }
    if(!portrait)rock(Math.round(w*.29),shoreY(Math.round(w*.29))+9);
    const groups=portrait?[[6,6],[.20*w,21],[.39*w,18],[.73*w,20],[w-13,31]]:
      [[8,16],[.075*w,18],[.22*w,12],[.34*w,18],[.64*w,19],[.76*w,23],[w-21,34]];
    for(const[rawX,dy]of groups) {
      const x=Math.round(rawX),y=shoreY(x)+dy;
      if(y<h+5)grass(x,y,x>w*.70);
    }
    fern(10,Math.min(h-5,shoreY(10)+39));fern(w-12,Math.min(h-5,shoreY(w-12)+38));
    if(!short) {
      fern(Math.round(w*.21),Math.min(h-2,shoreY(Math.round(w*.21))+27));
      flowers(Math.round(w*.12),Math.min(h-5,shoreY(Math.round(w*.12))+26));
      flowers(w-36,Math.min(h-5,shoreY(w-36)+34));
    }
    for(const[x,dy]of[[rootX-13,7],[rootX+8,12],[rootX+28,15],
      [rootX+35,12],[rootX+50,20],[w-45,15],[w-31,12]]) {
      const y=shoreY(x)+dy;rect(x,y,2,1,P.blushDark);
      if(x===rootX+28)rect(x+4,y+2,2,1,P.pink);
    }
    const fallen={a:P.blushDark,b:P.blush,c:P.pink};
    sprite(['....aa.......','..aaaa..bb...','.aabbbaabb...',
      '...aabb..aaaa','......aa..aa.'],rootX+8,shoreY(rootX+8)+14,fallen);
    sprite(['...aa.......','.aabb..aa...','..abbbaabbb.','....aa...aa.'],
      w-39,shoreY(w-39)+17,fallen);
    // A few petals caught on the lit top of the left stone.
    rect(leftStone+12,shoreY(leftStone)-1,2,1,P.blush);
    rect(leftStone+16,shoreY(leftStone)+1,2,1,P.pink);
    rect(leftStone+23,shoreY(leftStone)+3,2,1,P.blushDark);

    // The metal lantern uses three solid light colours, on the same pixel grid.
    const lanternX=portrait?w-47:Math.round(w*.855);
    const lanternGround=shoreY(lanternX)+10,lanternY=lanternGround-18;
    const l=at(lanternX,lanternY);
    l.box(8,-15,2,34,P.ink);l.box(8,-14,1,29,P.bark);
    l.box(-1,-16,11,2,P.ink);l.box(0,-15,8,1,P.mauve);
    l.box(-1,-14,1,7,P.mauve);l.box(-2,-8,3,1,P.mauve);
    sprite(['...aaa...','..abbba..','.abbbbba.','aaaaaaaaa','.acddca..',
      '.acgeca..','.acgeca..','.acgeca..','.accdca..','.aaaaaa..','..abba...',
      '...aa....'],lanternX-4,lanternY-7,
    {a:P.ink,b:P.mauve,c:P.amber,d:P.gold,e:P.light,g:P.cream});
    rect(lanternX+5,lanternGround+1,10,2,P.slate);
    rect(lanternX+7,lanternGround,5,1,P.stone);
    const silhouette={a:P.ink,b:P.ink};
    sprite(grassRows,Math.round(w*.06),h-7,silhouette);
    sprite(grassRows,Math.round(w*.84),h-6,silhouette);
    return {
      lantern:{x:lanternX,y:lanternY,radius:10},
      blossoms:blossoms.filter(p=>p.x>=0&&p.x<w&&p.y>=0&&p.y<h),
      shore:bank.map(([x,y])=>({x,y}))
    };
  }
  globalThis.PixelGarden={draw};
})();
