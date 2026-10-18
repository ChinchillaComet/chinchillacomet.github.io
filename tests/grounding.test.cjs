'use strict';

const assert=require('node:assert/strict');
const vm=require('node:vm');
const test=require('node:test');
const {createCanvas}=require('@napi-rs/canvas');
const {source}=require('./helpers.cjs');

const scope=vm.createContext({});
vm.runInContext(source('art.js'),scope,{filename:'art.js'});
const {NativeGarden:garden,NativeLandscape:landscape}=scope;
const compositions=[[160,284],[160,320],[160,400],[195,422],[360,225],[422,195],[512,216]];
function pixels(canvas) {
  return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
}
function color(data,offset) {
  return (data[offset]<<16)|(data[offset+1]<<8)|data[offset+2];
}

test('each visible boulder and its contact shadow have continuous soil and a grass margin beneath them',()=>{
  const stoneColors=new Set(['stoneDark','stone','stoneLight','stoneWarm']
    .map(name=>parseInt(garden.palette[name].slice(1),16)));
  for(const [w,h]of compositions) {
    const soilCanvas=createCanvas(w,h),gardenCanvas=createCanvas(w,h);
    garden.ground(soilCanvas.getContext('2d'),w,h);
    garden.foreground(gardenCanvas.getContext('2d'),w,h);
    const soil=pixels(soilCanvas),props=pixels(gardenCanvas);
    const geometry=garden.groundGeometry(w,h),label=`${w}×${h}`;
    const supported=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&soil[(y*w+x)*4+3]===255;
    assert.ok(geometry.rocks.length>=2,`${label}: the near bank should retain its boulders`);
    for(const rock of geometry.rocks) {
      assert.ok(rock.y+7<h,`${label}: a boulder must not be cropped before its seated base`);
      // Inspect rendered rock columns, not only the coordinates of their centre.
      // Four cells of soil below the visible bottom prevent the old suspended
      // outline, including at slanted corners and around occluding grass blades.
      let visibleColumns=0;
      for(let x=rock.x-rock.radius;x<=rock.x+rock.radius;x++) {
        let bottom=-1;
        for(let y=rock.y-10;y<=rock.y+6;y++) {
          const offset=(y*w+x)*4;
          if(props[offset+3]===255&&stoneColors.has(color(props,offset)))bottom=y;
        }
        if(bottom<0)continue;
        visibleColumns++;
        for(let y=bottom+1;y<=Math.min(h-1,bottom+4);y++)
          assert.ok(supported(x,y),`${label}: rock ${rock.kind} floats at ${x},${y}`);
      }
      assert.ok(visibleColumns>rock.radius,`${label}: the test must inspect the actual boulder faces`);
      // The whole contact-shadow envelope has earth beneath it, plus three
      // unobstructed cells toward the water. Its dark fringe cannot invent land.
      for(let y=rock.y+2;y<=rock.y+6;y++)
        for(let x=rock.x-rock.radius-2;x<=rock.x+rock.radius+5;x++)
          assert.ok(supported(x,y),`${label}: rock ${rock.kind} contact margin reaches the lake at ${x},${y}`);
    }
  }
});

test('the near shoreline remains one uninterrupted bank without covering the water-garden centres',()=>{
  for(const [w,h]of compositions) {
    const canvas=createCanvas(w,h);garden.ground(canvas.getContext('2d'),w,h);
    const data=pixels(canvas),{bank}=garden.groundGeometry(w,h);
    let previousEdge=0;
    for(let y=bank-5;y<h;y++) {
      let edge=0;
      while(edge<w&&data[(y*w+edge)*4+3]===255)edge++;
      assert.ok(edge>=previousEdge,`${w}×${h}: the bank cannot fold inward below a rock`);
      for(let x=edge;x<w;x++)assert.equal(data[(y*w+x)*4+3],0,
        `${w}×${h}: a detached patch must not stand in for continuous ground`);
      previousEdge=edge;
    }
    for(const plant of landscape.waterPlants(w,h,Math.round(h*.64))) {
      assert.equal(data[(plant.y*w+plant.x)*4+3],0,
        `${w}×${h}: adding support for rocks must keep the lake plants in water`);
    }
  }
});
