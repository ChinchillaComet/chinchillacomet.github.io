'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const renderAssets=require('./render-assets.cjs');
const root=path.resolve(__dirname,'..'),destination=path.join(root,'assets/releases');
fs.mkdirSync(destination,{recursive:true});
function save(name,extension,content){
  const bytes=Buffer.from(content),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  const file=name+'.'+sha256.slice(0,12)+'.'+extension;
  fs.writeFileSync(path.join(destination,file),bytes);
  return {path:'assets/releases/'+file,sha256,bytes:bytes.length};
}
// All dependencies execute as one deferred resource. A release never assembles
// independently cached versions of the renderer, its art, and its lifecycle.
const modules=['pixel','typography','ambient','art','scene','main'];
const runtime=save('welcome','js',modules.map(name=>
  `/* ${name}.js */\n${fs.readFileSync(path.join(root,'src',name+'.js'),'utf8')}`).join('\n;\n'));
const stylesheet=save('welcome','css',fs.readFileSync(path.join(root,'src/style.css'),'utf8'));
const {stills,previews}=renderAssets(root);
const version=Number(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version.split('.')[0]);
const release={version,runtime,stylesheet,stills,previews};
const replacements={runtime:runtime.path,stylesheet:stylesheet.path,
  landscape:stills.landscape.path,portrait:stills.portrait.path,panorama:stills.panorama.path,
  preview:previews.desktop.path};
const template=fs.readFileSync(path.join(root,'src/index.template.html'),'utf8');
const html=template.replace(/\{\{(\w+)\}\}/g,(_,key)=>{
  if(!replacements[key])throw new Error('Unknown template field '+key);return replacements[key];
});
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'assets/release.json'),JSON.stringify(release,null,2)+'\n');
console.log(JSON.stringify({runtime:runtime.path,stylesheet:stylesheet.path,
  stillBytes:Object.fromEntries(Object.entries(stills).map(([key,value])=>[key,value.bytes]))}));
