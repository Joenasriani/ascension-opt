"""Read-only observations in the emulator DEBUG build only. No gameplay setters."""
from pathlib import Path
p=Path('android/app/src/main/assets/assets/index-BjuLtVzX.js')
s=p.read_text()
needle='return ee.jsxs(ee.Fragment,{children:[ee.jsx("color",{attach:"background"'
probe='''const __qa=Ki();window.__ASC_ANDROID_STATE=()=>{__qa.scene.updateMatrixWorld(true);__qa.camera.updateMatrixWorld(true);const rect=__qa.gl.domElement.getBoundingClientRect();const points=[];__qa.scene.traverse(o=>{if(o.userData.ascBlock||o.userData.ascHandle){const v=new Q(0,o.userData.ascHandle?.25:o.userData.top,0).applyMatrix4(o.matrixWorld).project(__qa.camera);points.push({id:o.userData.ascBlock||o.userData.ascHandle,kind:o.userData.ascHandle?"handle":"block",x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2})}});return {level:r.id,current:a,busy:stepRef.current.busy,blocks:e,points,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,viewport:{scale:visualViewport?.scale||1,offsetLeft:visualViewport?.offsetLeft||0,offsetTop:visualViewport?.offsetTop||0,scrollX,scrollY}}};'''
assert s.count(needle)==1
s=s.replace(needle,probe+needle)
a='"group",{ref:l,position:[r.position.x,r.position.y,r.position.z],children:'
assert s.count(a)==1
s=s.replace(a,'"group",{userData:{ascBlock:r.id,top:C[1]/2+.03},ref:l,position:[r.position.x,r.position.y,r.position.z],children:')
a='"group",{position:L,rotation:F,onClick:A,'
assert s.count(a)==1
s=s.replace(a,'"group",{userData:{ascHandle:r.id},position:L,rotation:F,onClick:A,')
s="""window.__ASC_AUDIO_QA={destinationConnections:0,maxPeak:0};
if(window.AudioNode&&window.AudioDestinationNode){const original=AudioNode.prototype.connect;
AudioNode.prototype.connect=function(target,...args){const result=original.call(this,target,...args);
if(target instanceof AudioDestinationNode){window.__ASC_AUDIO_QA.destinationConnections++;const analyser=this.context.createAnalyser();analyser.fftSize=256;original.call(this,analyser);const data=new Float32Array(256);const timer=setInterval(()=>{analyser.getFloatTimeDomainData(data);for(const v of data)window.__ASC_AUDIO_QA.maxPeak=Math.max(window.__ASC_AUDIO_QA.maxPeak,Math.abs(v))},20);setTimeout(()=>clearInterval(timer),2500)}return result}}
"""+s

# Find a currently visible clickable surface without invoking any event handler.
# A handle can legitimately be hidden behind its bridge after a rotation.
probe_end=';return ee.jsxs(ee.Fragment,{children:[ee.jsx("color",{attach:"background"'
extra='''window.__ASC_ANDROID_TARGET=(id,kind)=>{const st=window.__ASC_ANDROID_STATE();const p=st.points.find(p=>p.id===id&&p.kind===kind);if(!p)return null;const rect=__qa.gl.domElement.getBoundingClientRect();const ray=new __qa.raycaster.constructor();const wanted=(x,y)=>{ray.setFromCamera({x:(x-rect.left)/rect.width*2-1,y:1-(y-rect.top)/rect.height*2},__qa.camera);const hits=ray.intersectObjects(__qa.internal.interaction,true);for(const hit of hits){let o=hit.object;while(o){if(o.userData.ascHandle)return kind==="handle"&&o.userData.ascHandle===id;if(o.userData.ascBlock)return kind==="block"&&o.userData.ascBlock===id;o=o.parent}}return false};for(const radius of [0,4,8,12,16,24]){const offsets=radius===0?[[0,0]]:[[radius,0],[-radius,0],[0,radius],[0,-radius],[radius,radius],[-radius,radius],[radius,-radius],[-radius,-radius]];for(const [dx,dy] of offsets){const x=Math.round((p.x+dx)*devicePixelRatio)/devicePixelRatio,y=Math.round((p.y+dy)*devicePixelRatio)/devicePixelRatio;if(x<2||y<2||x>=innerWidth-2||y>=innerHeight-2)continue;if([[0,0],[2,0],[-2,0],[0,2],[0,-2]].every(([a,b])=>wanted(x+a,y+b)))return{x,y}}}return null};'''
assert s.count(probe_end)==1
s=s.replace(probe_end,';'+extra+probe_end,1)
p.write_text(s)
