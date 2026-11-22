"""Read-only observations in the emulator DEBUG build only. No gameplay setters."""
from pathlib import Path
p=Path('android/app/src/main/assets/assets/index-BjuLtVzX.js')
s=p.read_text()
needle='return ee.jsxs(ee.Fragment,{children:[ee.jsx("color",{attach:"background"'
probe='''const __qa=Ki();window.__ASC_ANDROID_STATE=()=>{__qa.scene.updateMatrixWorld(true);__qa.camera.updateMatrixWorld(true);const points=[];__qa.scene.traverse(o=>{if(o.userData.ascBlock||o.userData.ascHandle){const v=new Q(0,o.userData.ascHandle?.25:o.userData.top,0).applyMatrix4(o.matrixWorld).project(__qa.camera);points.push({id:o.userData.ascBlock||o.userData.ascHandle,kind:o.userData.ascHandle?"handle":"block",x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2})}});return {level:r.id,current:a,busy:stepRef.current.busy,blocks:e,points,width:innerWidth,height:innerHeight}};'''
assert s.count(needle)==1
s=s.replace(needle,probe+needle)
a='"group",{ref:l,position:[r.position.x,r.position.y,r.position.z],children:'
assert s.count(a)==1
s=s.replace(a,'"group",{userData:{ascBlock:r.id,top:C[1]/2+.03},ref:l,position:[r.position.x,r.position.y,r.position.z],children:')
a='"group",{position:L,rotation:F,onClick:A,'
assert s.count(a)==1
s=s.replace(a,'"group",{userData:{ascHandle:r.id},position:L,rotation:F,onClick:A,')
p.write_text(s)
