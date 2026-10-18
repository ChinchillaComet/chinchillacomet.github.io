/* The small signature preserves every original font cell. Its separate display
 * grid is half the scenery scale, rounded down to whole physical pixels. */
(() => {
  'use strict';
  const {P,sprite}=globalThis.PixelArt;
  const font=globalThis.PixelTypography.brand;
  function create(width,height,artScale,makeCanvas) {
    const scale=Math.max(1,Math.floor(artScale/2));
    const bounds=Object.freeze({x:Math.floor((width-font.width*scale)/2),
      y:height-font.height*scale-10*artScale,
      width:font.width*scale,height:font.height*scale,scale});
    const canvas=makeCanvas((font.width+2)*scale,(font.height+3)*scale);
    const context=canvas.getContext('2d');
    context.imageSmoothingEnabled=false;
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[1,2]])
      sprite(context,font.rows,(1+dx)*scale,(1+dy)*scale,{'1':P.ink},scale);
    sprite(context,font.rows,scale,scale,{'1':P.cream},scale);
    return Object.freeze({canvas,bounds,x:bounds.x-scale,y:bounds.y-scale});
  }
  function sceneBounds(caption,grid) {
    const {bounds}=caption;
    return {x:(bounds.x-grid.left)/grid.scale,y:(bounds.y-grid.top)/grid.scale,
      width:bounds.width/grid.scale,height:bounds.height/grid.scale,
      scale:bounds.scale/grid.scale};
  }
  globalThis.PixelCaption=Object.freeze({create,sceneBounds});
})();
