'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
for(const name of ['pixel','typography','ambient','scene']){
  vm.runInThisContext(fs.readFileSync(path.join(root,name+'.js'),'utf8'),{filename:name+'.js'});
}
(async()=>{
  for(const [filename,width,height]of [['preview.webp',1440,900],['preview-mobile.webp',390,844]]){
    const grid=PixelArt.layout(width,height,1),asset=PixelScene.variant(grid.w,grid.h);
    const image=await loadImage(path.join(root,asset.src.split('?')[0]));
    const scene=PixelScene.create(grid.w,grid.h,createCanvas,image,asset);
    const frame=createCanvas(grid.w,grid.h);
    scene.draw(frame.getContext('2d'),0);
    fs.writeFileSync(path.join(root,'assets',filename),frame.toBuffer('image/webp',95));
  }
  console.log('Rendered desktop and phone previews from the actual page renderer.');
})().catch(error=>{console.error(error);process.exitCode=1;});
