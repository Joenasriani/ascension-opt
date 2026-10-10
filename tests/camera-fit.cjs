const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const bundle=fs.readFileSync('assets/index-BjuLtVzX.js','utf8');
const levels=JSON.parse(fs.readFileSync('levels_1_21.json','utf8'));
const from=bundle.indexOf('__ascFrame='),to=bundle.indexOf(',W4=',from);
assert(from>=0&&to>from,'Missing level camera fitter');
const fit=vm.runInNewContext('('+bundle.slice(from+11,to)+')',{Math});
assert(bundle.includes('target:e.center'),'Orbit center is not level center');
assert(bundle.includes('enableRotate:!0,enableZoom:!0,enablePan:!0'),'Player controls disabled');
assert(bundle.includes('minZoom:4,maxZoom:500'),'Manual zoom limits not updated');
assert(bundle.includes('e.width*.85/t.spanX,e.height*.79/t.spanY'),'Unexpected camera fit ratios');
const rt=Math.SQRT1_2,viewports=[[1280,800],[1920,1080],[2560,1440],[3440,1440],[390,844],[844,390],[3840,2160],[360,640],[640,360]];
function corners(level){
 const vertices=[];
 for(const b of level.blocks){
  const states=['ROTATOR','SLIDER'].includes(b.type)?[0,1]:[0],p=b.position,s=b.size||{x:1,y:1,z:1};
  for(const st of states){
   const rotated=b.type==='ROTATOR'&&st===1;
   const hx=(rotated?s.z:s.x)/2,hz=(rotated?s.x:s.z)/2,cy=p.y+(b.type==='SLIDER'?2*st:0);
   const add=(x,y,z)=>vertices.push([(x+z)*rt,y,(-x+z)*rt]);
   for(const dx of [-hx,hx])for(const dy of [-s.y/2,s.y/2])for(const dz of [-hz,hz])add(p.x+dx,cy+dy,p.z+dz);
   if(b.id===level.startBlockId||b.id===level.endBlockId)add(p.x,cy+2,p.z);
   if(b.isRotatable||b.isSlideable)add(p.x,cy+s.y/2+.7,p.z);
  }
 }
 return vertices;
}
let points=0;
for(const level of levels){
 const frame=fit(level),v=corners(level);assert(frame.spanX>0&&frame.spanY>0&&frame.center.length===3);
 for(const [w,h] of viewports){
  const zoom=Math.min(w*.85/frame.spanX,h*.79/frame.spanY);
  assert(zoom>0&&Number.isFinite(zoom),'Invalid zoom on level '+level.id);
  assert(zoom<=500,'Initial zoom exceeds OrbitControls maximum');
  const marginX=w*.04,marginY=h*.04;
  for(const p of v){
   const x=p[0]-frame.center[0],y=p[1]-frame.center[1],z=p[2]-frame.center[2];
   const px=w/2+zoom*(x-z)*rt,py=h/2-zoom*(-x+2*y-z)/Math.sqrt(6);
   assert(px>=marginX&&px<=w-marginX&&py>=marginY&&py<=h-marginY,
    'Level '+level.id+' clipped at '+w+'x'+h+': '+[px,py]);
   points++;
  }
 }
 console.log('Level '+String(level.id).padStart(2,'0')+': full initial structure fits');
}
console.log('CAMERA FIT PASS: '+levels.length+' levels / '+viewports.length+' viewports / '+points+' projected points');
console.log('LIMITS: not proof of rendered mesh visibility after arbitrary player orbit/pan.');
