'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas}=require('@napi-rs/canvas');

module.exports=function renderAssets(root){
  const scope=vm.createContext({});
  for(const name of ['pixel','typography','caption','ambient','art','scene']){
    vm.runInContext(fs.readFileSync(path.join(root,'src',name+'.js'),'utf8'),scope,{filename:name+'.js'});
  }
  const destination=path.join(root,'assets/releases');fs.mkdirSync(destination,{recursive:true});
  function save(name,canvas){
    const bytes=canvas.toBuffer('image/png'),hash=crypto.createHash('sha256').update(bytes).digest('hex');
    const filename=name+'.'+hash.slice(0,12)+'.png';fs.writeFileSync(path.join(destination,filename),bytes);
    return {path:'assets/releases/'+filename,sha256:hash,width:canvas.width,height:canvas.height,bytes:bytes.length};
  }
  const stills={},previews={};
  for(const asset of Object.values(scope.PixelScene.assets)){
    const scene=scope.PixelScene.create(asset.width,asset.height,createCanvas);
    const frame=createCanvas(asset.width,asset.height);
    scene.draw(frame.getContext('2d'),0,{motion:false,title:false});
    stills[asset.id]=save('still-'+asset.id,frame);
  }
  for(const [id,width,height]of [['desktop',360,225],['phone',195,422]]){
    const caption=scope.PixelCaption.create(width*2,height*2,2,createCanvas);
    const scene=scope.PixelScene.create(width,height,createCanvas,{
      captionBounds:scope.PixelCaption.sceneBounds(caption,{left:0,top:0,scale:2})
    }),frame=createCanvas(width,height);
    // Social previews show one representative native animation frame.
    scene.draw(frame.getContext('2d'),8.3,{motion:true});
    const output=createCanvas(width*2,height*2),ctx=output.getContext('2d');
    ctx.imageSmoothingEnabled=false;ctx.drawImage(frame,0,0,output.width,output.height);
    ctx.drawImage(caption.canvas,caption.x,caption.y);
    previews[id]=save('preview-'+id,output);
  }
  return {stills,previews};
};
