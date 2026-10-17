'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
for(const name of ['pixel','typography','ambient','art','scene']){
  vm.runInThisContext(fs.readFileSync(path.join(root,name+'.js'),'utf8'),{filename:name+'.js'});
}
// These tiny lossless stills are fallbacks. The running page draws native art
// directly and makes no image request as a prerequisite to its first frame.
for(const asset of Object.values(PixelScene.assets)){
  const scene=PixelScene.create(asset.width,asset.height,createCanvas);
  const frame=createCanvas(asset.width,asset.height);
  scene.draw(frame.getContext('2d'),0,{motion:false,title:false});
  fs.writeFileSync(path.join(root,asset.src.split('?')[0]),frame.toBuffer('image/png'));
}
for(const [name,width,height,scale]of [['preview.png',360,225,2],['preview-mobile.png',195,422,2]]){
  const scene=PixelScene.create(width,height,createCanvas),frame=createCanvas(width,height);
  scene.draw(frame.getContext('2d'),0,{motion:false});
  const output=createCanvas(width*scale,height*scale),ctx=output.getContext('2d');
  ctx.imageSmoothingEnabled=false;ctx.drawImage(frame,0,0,output.width,output.height);
  fs.writeFileSync(path.join(root,'assets',name),output.toBuffer('image/png'));
}
console.log('Rendered lossless native-grid fallbacks and desktop/phone previews.');
