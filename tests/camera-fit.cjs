// Verify the production bundle's initial orthographic camera fit for every level.
// This is a geometric projection test, not a browser rendering certification.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const bundle = fs.readFileSync('assets/index-BjuLtVzX.js', 'utf8');
const levels = JSON.parse(fs.readFileSync('levels_1_21.json', 'utf8'));
const begin = bundle.indexOf('__ascFrame=');
const finish = bundle.indexOf(',W4=', begin);
assert(begin >= 0 && finish > begin, 'Adaptive camera routine not found in shipped runtime');
const computeFrame = vm.runInNewContext('(' + bundle.slice(begin + '__ascFrame='.length, finish) + ')', { Math });
assert(bundle.includes('target:e.center'), 'OrbitControls must rotate around the level center');
assert(bundle.includes('enableRotate:!0,enableZoom:!0,enablePan:!0'), 'Player camera controls must remain available');

const rt = Math.SQRT1_2;
const viewports = [[1280,800], [1920,1080], [2560,1440], [3440,1440], [390,844], [844,390]];
let checked = 0;

function vertices(level) {
  const corners = [];
  for (const block of level.blocks) {
    const states = ['ROTATOR','SLIDER'].includes(block.type) ? [0,1] : [0];
    const p = block.position;
    const sz = block.size || {x:1,y:1,z:1};
    for (const state of states) {
      const rotated = block.type === 'ROTATOR' && state === 1;
      const dx = (rotated ? sz.z : sz.x) / 2, dy = sz.y / 2, dz = (rotated ? sz.x : sz.z) / 2;
      for (const x of [-dx,dx]) for (const y of [-dy,dy]) for (const z of [-dz,dz]) {
        const px = p.x + x, py = p.y + y + (block.type === 'SLIDER' ? 2*state : 0), pz = p.z + z;
        // Actual scene rotation is +PI/4 around Three.js Y.
        corners.push([(px+pz)*rt, py, (-px+pz)*rt]);
      }
    }
  }
  return corners;
}

for (const level of levels) {
  const frame = computeFrame(level);
  assert(frame.spanX > 0 && frame.spanY > 0);
  assert.equal(frame.center.length, 3);
  const points = vertices(level);
  for (const [width,height] of viewports) {
    const zoom = Math.min(width*.78/frame.spanX,height*.72/frame.spanY);
    assert(zoom > 0 && Number.isFinite(zoom));
    for (const point of points) {
      const relative = point.map((v,i)=>v-frame.center[i]);
      const horizontal = (relative[0]-relative[2])*rt;
      const vertical = (-relative[0]+2*relative[1]-relative[2])/Math.sqrt(6);
      const screenX = width/2 + horizontal*zoom;
      const screenY = height/2 - vertical*zoom;
      assert(screenX >= width*.05 && screenX <= width*.95,
        'Level '+level.id+' clips horizontally at '+width+'x'+height+': '+screenX);
      assert(screenY >= height*.05 && screenY <= height*.95,
        'Level '+level.id+' clips vertically at '+width+'x'+height+': '+screenY);
      checked++;
    }
  }
  console.log('Level '+String(level.id).padStart(2,'0')+': initial camera geometry fits all '+viewports.length+' viewports');
}
console.log('CAMERA FIT PASS: '+levels.length+' levels, '+viewports.length+' viewport shapes, '+checked+' transformed corners');
console.log('Note: camera geometry validation is not equivalent to actual screenshot-backed browser QA.');
