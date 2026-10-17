'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const test = require('node:test');
const {createCanvas, loadImage} = require('@napi-rs/canvas');
const {ROOT, source} = require('./helpers.cjs');
const scope = vm.createContext({});
for (const name of ['pixel.js','typography.js','ambient.js','scene.js']) {
  vm.runInContext(source(name),scope,{filename:name});
}
const {PixelArt:art,PixelTypography:font,PixelScene:scenes,PixelAmbient:ambient}=scope;
const imageCache = new Map();
function imageFor(asset) {
  if(!imageCache.has(asset.id))imageCache.set(asset.id,loadImage(path.join(ROOT,asset.src.split('?')[0])));
  return imageCache.get(asset.id);
}
async function makeScene(width,height) {
  const asset=scenes.variant(width,height);
  return scenes.create(width,height,createCanvas,await imageFor(asset),asset);
}
function pixels(canvas) {return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;}

test('Welcome retains the exact font glyphs and is the only visible document text',()=>{
  const mask=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/welcome-mask.json'),'utf8'));
  assert.equal(font.text,'Welcome');
  assert.equal(mask.glyphs.map(g=>g.character).join(''),font.text);
  assert.deepEqual(Array.from(font.rows),mask.rows);
  const binary=fs.readFileSync(path.join(ROOT,'assets/fonts/PressStart2P-Regular.ttf'));
  assert.equal(crypto.createHash('sha256').update(binary).digest('hex'),mask.fontSha256);
  const body=source('index.html').split('<body>')[1].split('</body>')[0];
  assert.equal(body.replace(/<[^>]*>/g,'').trim(),'Welcome');
  assert.match(body,/<h1 class="welcome">Welcome<\/h1>/);
});

test('all three complete artwork assets decode at the recorded dimensions',async()=>{
  for(const asset of Object.values(scenes.assets)){
    const image=await imageFor(asset);
    assert.equal(image.width,asset.width,asset.id);
    assert.equal(image.height,asset.height,asset.id);
  }
  assert.equal(scenes.variant(390,844).id,'portrait');
  assert.equal(scenes.variant(1440,900).id,'landscape');
  assert.equal(scenes.variant(2560,1080).id,'panorama');
});

test('responsive frames cover the display and preserve square pixels and centred glyphs',async t=>{
  const cases=[[320,568,1],[320,568,1.5],[390,844,3],[768,1024,2],
    [1440,900,1],[1440,900,1.25],[1440,900,2],[1920,1080,1],[2560,1080,1],[844,390,2]];
  for(const [width,height,dpr]of cases)await t.test(`${width}x${height} at ${dpr} density`,async()=>{
    const grid=art.layout(width,height,dpr);
    for(const key of ['w','h','scale','canvasWidth','canvasHeight','left','top'])assert.ok(Number.isInteger(grid[key]),key);
    assert.equal(grid.canvasWidth/grid.w,grid.scale);
    assert.equal(grid.canvasHeight/grid.h,grid.scale);
    assert.ok(grid.left<=0&&grid.top<=0);
    assert.ok(grid.left+grid.canvasWidth>=grid.physicalWidth);
    assert.ok(grid.top+grid.canvasHeight>=grid.physicalHeight);
    if(width<=height&&width<=440)assert.ok(grid.w>=width,'Keep phone detail on fractional-density displays');
    const scene=await makeScene(grid.w,grid.h),title=scene.text;
    assert.ok(title.x>=1&&title.x+title.width<grid.w);
    assert.ok(Math.abs(title.x+title.width/2-grid.w/2)<=.5);
    assert.ok(Math.abs(title.y+title.height/2-grid.h/2)<=.5);
    assert.ok(scene.fit.x<=0&&scene.fit.y<=0);
    assert.ok(scene.fit.x+scene.fit.width>=grid.w&&scene.fit.y+scene.fit.height>=grid.h);
    const canvas=createCanvas(grid.w,grid.h);
    scene.draw(canvas.getContext('2d'),0,{motion:false});
    const data=pixels(canvas);
    for(const offset of [0,(grid.w-1)*4,((grid.h-1)*grid.w)*4,(grid.w*grid.h-1)*4])assert.equal(data[offset+3],255,'No transparent corner');
    for(let row=0;row<font.height;row++)for(let col=0;col<font.width;col++){
      if(font.rows[row][col]!=='1')continue;
      for(let y=0;y<title.scale;y++)for(let x=0;x<title.scale;x++){
        const i=((title.y+row*title.scale+y)*grid.w+title.x+col*title.scale+x)*4;
        assert.deepEqual(Array.from(data.subarray(i,i+4)),[255,241,219,255],'Glyph must survive compositing exactly');
      }
    }
  });
});

test('the shooting star leads its trail down-left in every composition',async()=>{
  for(const [width,height]of [[720,450],[390,844],[1280,540]]){
    const scene=await makeScene(width,height);
    const early=scene.meteorAt(7.85),later=scene.meteorAt(8.3);
    assert.ok(early&&later);
    assert.ok(later.head.x<early.head.x&&later.head.y>early.head.y,'Head moves down-left');
    for(const frame of [early,later])for(const p of frame.trail){
      assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));
      assert.ok(p.x>=frame.head.x&&p.y<=frame.head.y,'Tail must stay up-right of its head');
    }
    assert.equal(scene.meteorAt(0),null);
    assert.equal(scene.meteorAt(10),null);
  }
});

test('lake motion never changes pixels outside its reviewed open-water region',async()=>{
  for(const [width,height]of [[720,450],[390,844],[1280,540]]){
    const scene=await makeScene(width,height),before=pixels(scene.background);
    const target=createCanvas(width,height),ctx=target.getContext('2d');
    ctx.imageSmoothingEnabled=false;ctx.drawImage(scene.background,0,0);
    ambient.drawWater(ctx,scene.background,scene.waterBands,2.3);
    const after=pixels(target),allowed=new Uint8Array(width*height);
    for(const band of scene.waterBands){
      assert.ok(band.x>=2&&band.x+band.width<=width-2,'Leave a sample margin');
      allowed.fill(1,band.y*width+band.x,band.y*width+band.x+band.width);
    }
    let changed=0;
    for(let pixel=0;pixel<width*height;pixel++){
      const i=pixel*4;
      const different=before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2];
      if(different){changed++;assert.equal(allowed[pixel],1,'The bank and all non-water artwork must remain still');}
    }
    assert.ok(changed>100,'Water should visibly change');
    assert.deepEqual(pixels(scene.background),before,'Animation cannot accumulate distortion into its source');
  }
});
