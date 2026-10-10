// Directly exercise the helper embedded in ASCENSION's shipped runtime.
// This is a static movement-rule regression test, not a browser playthrough.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const bundle=fs.readFileSync('assets/index-BjuLtVzX.js','utf8');
const levels=JSON.parse(fs.readFileSync('levels_1_21.json','utf8'));
const start=bundle.indexOf('bx=2,Jh='),end=bundle.indexOf(',__rotSafe=',start);
const from=bundle.indexOf('__ascStraightPath='),to=bundle.indexOf(',Y4=',from);
assert(start>=0&&end>start&&from>=0&&to>from,'Runtime movement helper missing');
const ctx={
 gt:{ROTATOR:'ROTATOR',SLIDER:'SLIDER',EMPTY:'EMPTY'},
 Q:class Q{constructor(x,y,z){this.x=x;this.y=y;this.z=z}}
};
vm.runInNewContext('var bx,Jh,bE,k4;'+bundle.slice(start,end)+';this.geometry={Jh,k4};',ctx);
ctx.straight=vm.runInNewContext('('+bundle.slice(from+'__ascStraightPath='.length,to)+')',ctx);
const path=(blocks,from,to)=>{const p=ctx.straight(blocks,from,to);return p?Array.from(p):null};
const node=(id,x,z,y=0,links=[],type='WALKABLE',size={x:1,y:1,z:1})=>({id,type,position:{x,y,z},size,links});
const row=[
 node('a',0,0,0,['b']),
 node('b',1,0,0,['a','c']),
 node('c',2,0,0,['b','d']),
 node('d',3,0,0,['c'])
];
assert.deepEqual(path(row,'a','d'),['a','b','c','d'],'Straight cleared route needs a single click');
assert.deepEqual(path(row,'d','a'),['d','c','b','a'],'Reverse straight movement must work');
assert.deepEqual(path(row,'a','c'),['a','b','c'],'Stop at clicked intermediate destination');
assert.equal(path(row,'a','a'),null,'No-op same destination');
assert.equal(path(row,'a','missing'),null,'No route to nonexistent block');
const broken=row.map(b=>({...b,links:[...b.links]}));broken[1].links=['a'];broken[2].links=['d'];
assert.equal(path(broken,'a','d'),null,'Missing graph connection must block passage');
const gap=row.map(b=>({...b,position:{...b.position}}));gap[2].position.x=3;gap[3].position.x=4;
assert.equal(path(gap,'a','d'),null,'Physical gap must block passage');
const elevated=row.map(b=>({...b,position:{...b.position}}));elevated[2].position.y=2;
assert.equal(path(elevated,'a','d'),null,'Elevation difference must block passage');
const corner=[node('a',0,0,0,['b']),node('b',1,0,0,['a','c']),node('c',1,1,0,['b'])];
assert.equal(path(corner,'a','c'),null,'One click must not take an unintended corner');
const detour=[node('a',0,0,0,['side']),node('side',1,1,0,['a','end']),node('end',2,0,0,['side'])];
assert.equal(path(detour,'a','end'),null,'Do not automatically detour off a straight line');
const slider=[node('a',0,0,0,['lift']),node('lift',1,0,0,['a','end'],'SLIDER'),node('end',2,0,0,['lift'])];
slider[1].sliderVal=1;
assert.equal(path(slider,'a','end'),null,'Raised lift must interrupt ground-floor path');
slider[1].sliderVal=0;
assert.deepEqual(path(slider,'a','end'),['a','lift','end'],'Lowered aligned lift must permit traversal');
const l14=JSON.parse(JSON.stringify(levels.find(l=>l.id===14)));
const r3=l14.blocks.find(b=>b.id==='r3');
assert.equal(path(l14.blocks,'h5','end'),null,'Unaligned rotator must block corridor');
r3.rotation=2;
assert.deepEqual(path(l14.blocks,'h5','end'),['h5','r3','h6','final_bridge','end'],'Cleared Level 14 corridor should traverse in one click');
assert(bundle.includes('const direct=(S.links.includes(v)||b.links.includes(a))&&k4(S,b)'),'Keep original adjacent-block click behavior');
assert(bundle.includes('route=direct?[a,v]:__ascStraightPath(e,a,v)'),'Use straight route only when not directly adjacent');
console.log('STRAIGHT-CORRIDOR PASS: 12 targeted assertions and Level 14 multi-block route');
console.log('NOTE: browser click targeting/actor animation still requires live input verification.');
