// Real compiled Android WebView: observe state, drive native ADB touch input.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const adb=(...a)=>execFileSync('adb',a,{timeout:45000}).toString();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function route(level,observed){
 const blocks=observed?level.blocks.map(b=>({...b,...observed.blocks.find(x=>x.id===b.id)})):level.blocks, ids=new Map(blocks.map((b,i)=>[b.id,i]));
 const moves=blocks.map((b,i)=>({b,i})).filter(x=>['ROTATOR','SLIDER'].includes(x.b.type));
 const mi=new Map(moves.map((m,j)=>[m.i,j]));
 const init=moves.reduce((a,{b},j)=>a|((((b.type==='ROTATOR'?b.rotation:b.sliderVal)||0)%2)<<j),0);
 const val=(i,bits)=>mi.has(i)?(bits>>mi.get(i))&1:(blocks[i].rotation||blocks[i].sliderVal||0)%2;
 const geo=(i,bits)=>{const b=blocks[i],v=val(i,bits),s=b.size||{x:1,y:1,z:1};return {p:[b.position.x,b.position.y+(b.type==='SLIDER'?2*v:0),b.position.z],s:b.type==='ROTATOR'&&v?[s.z,s.y,s.x]:[s.x,s.y,s.z]}};
 const aligned=(i,j,bits)=>{const a=geo(i,bits),b=geo(j,bits);return Math.abs(a.p[1]-b.p[1])<=.1&&[0,2].every(k=>Math.abs(a.p[k]-b.p[k])<=(a.s[k]+b.s[k])/2+.1)};
 const safe=(i,bits)=>blocks.every((_,j)=>{if(i===j)return true;const a=geo(i,bits),b=geo(j,bits);return ![0,1,2].every(k=>Math.abs(a.p[k]-b.p[k])<(a.s[k]+b.s[k])/2-.02)});
 const start=ids.get(observed?.current||level.startBlockId),end=ids.get(level.endBlockId),key=(i,b)=>`${i}:${b}`;
 const q=[[start,init]], parents=new Map([[key(start,init),null]]);
 for(let n=0;n<q.length;n++){
  const [i,bits]=q[n],k=key(i,bits);
  if(i===end){const path=[];let c=k;while(parents.get(c)){const z=parents.get(c);path.unshift(z.action);c=z.prev}return path;}
  const add=(j,b,action)=>{const c=key(j,b);if(!parents.has(c)){parents.set(c,{prev:k,action});q.push([j,b]);}};
  for(let j=0;j<blocks.length;j++)if(((blocks[i].links||[]).includes(blocks[j].id)||(blocks[j].links||[]).includes(blocks[i].id))&&aligned(i,j,bits))add(j,bits,{kind:'block',id:blocks[j].id});
  moves.forEach(({b,i:j},m)=>{const next=bits^(1<<m);if(b.type!=='ROTATOR'||safe(j,next))add(i,next,{kind:'handle',id:b.id,type:b.type,value:val(j,next)});});
 }
 throw Error('No modeled route for '+level.id);
}
async function attachWebView(report){
  console.log('QA: attaching to ASCENSION WebView');
  const appPid=adb('shell','pidof','com.joenasr.ascension').trim().split(/\s+/)[0];
  if(!appPid)throw Error('ASCENSION process absent');
  let socket;
  for(let i=0;i<20;i++){socket=adb('shell','cat','/proc/net/unix').split('\n').find(l=>l.trim().endsWith('@webview_devtools_remote_'+appPid));if(socket)break;await pause(1000)}
  if(!socket)throw Error('WebView debug socket unavailable');
  socket=socket.trim().split(/\s+/).pop().replace(/^@/,'');adb('forward','tcp:9222','localabstract:'+socket);
  let pages;for(let attempt=0;attempt<6;attempt++){try{pages=await (await fetch('http://127.0.0.1:9222/json/list',{signal:AbortSignal.timeout(10000)})).json();break}catch(e){if(attempt===2)throw e;await pause(1000)}}
  console.log('QA: inspected ASCENSION debug targets');
  report.webViewTargets=pages.map(p=>({type:p.type,url:p.url,title:p.title}));
  const target=pages.find(p=>p.type==='page'&&p.url.includes('appassets.androidplatform.net'));
  if(!target)throw Error('No local game WebView page');
  const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.close();reject(Error('WebView websocket open timeout'))},10000);ws.onopen=()=>{clearTimeout(timer);resolve()};ws.onerror=e=>{clearTimeout(timer);reject(Error('WebView websocket connection failed'))}});
  console.log('QA: connected to ASCENSION renderer');
  let seq=0;const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Network.requestWillBeSent')report.network.push(m.params.request.url);else if(m.method==='Runtime.exceptionThrown')report.errors.push(JSON.stringify(m.params))};
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},30000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
  await cdp('Runtime.enable');await cdp('Network.enable');console.log('QA: renderer observations enabled');
  const wait=async(expression,timeout=15000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(expression))return;await pause(250)}throw Error('Condition timed out: '+expression)};
  return {cdp,evaluate,wait,close:async()=>ws.close()};
}
(async()=>{
 const report={lifecycle:[],kind:'Android native-touch gameplay',scope:process.env.ASCENSION_QA_SCOPE||'full',levels:[],errors:[],network:[],limits:['Debug build has read-only scene observations. No gameplay setters are invoked.','Native PCM evidence is separate from playback state; no physical-device listening test is claimed.']};
 let browser;
 try{
  browser=await attachWebView(report);
  const evaluate=expression=>browser.evaluate(expression);
  const wait=(expression,timeout)=>browser.wait(expression,timeout);
  const page={evaluate:fn=>evaluate('('+fn.toString()+')()')};
  report.initialResources=await evaluate('performance.getEntriesByType("resource").map(r=>r.name)');
  report.api=adb('shell','getprop','ro.build.version.sdk').trim();
  report.routes=adb('shell','ip','route');report.offline=!report.routes.includes('default');
  const state=()=>page.evaluate(()=>window.__ASC_ANDROID_STATE?.());
  const stableTarget=async action=>{let last=null,stable=0;for(let k=0;k<32;k++){const st=await state(),v=st.viewport; if(v&&(Math.abs(v.scale-1)>.01||Math.abs(v.offsetLeft)>1||Math.abs(v.offsetTop)>1||Math.abs(v.scrollX)>1||Math.abs(v.scrollY)>1))throw Error('Android page viewport shifted: '+JSON.stringify(v));const p=st.points.find(p=>p.id===action.id&&p.kind===action.kind);if(p&&last&&Math.hypot(p.x-last.x,p.y-last.y)<.15)stable++;else stable=0;if(stable>=2)return evaluate('window.__ASC_ANDROID_TARGET('+JSON.stringify(action.id)+','+JSON.stringify(action.kind)+')');last=p;await pause(250)}throw Error('Camera/target did not settle: '+JSON.stringify(action))};
  const touch=async p=>{const s=await state();adb('shell','input','tap',String(Math.round(p.x*s.dpr)),String(Math.round(p.y*s.dpr)));await pause(1300)};
  const capture=name=>fs.writeFileSync('android-evidence/'+name+'.png',execFileSync('adb',['exec-out','screencap','-p'],{timeout:45000}));
  const media=async()=>{const proto=await browser.cdp('Runtime.evaluate',{expression:'HTMLAudioElement.prototype'});const objects=await browser.cdp('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});const result=await browser.cdp('Runtime.callFunctionOn',{objectId:objects.objects.objectId,functionDeclaration:'function(){return Array.from(this).map(a=>({src:a.currentSrc,paused:a.paused,currentTime:a.currentTime,readyState:a.readyState,volume:a.volume,error:a.error?.message||null}))}',returnByValue:true});return result.result.value};
  const control=async label=>{const p=await evaluate(`(()=>{const e=Array.from(document.querySelectorAll("button")).find(e=>e.getAttribute("aria-label")===${JSON.stringify(label)});if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(!p)throw Error("Missing control "+label);await touch(p)};
  console.log('QA: checking native music playback');
  const beginPoint=await evaluate(`(()=>{const e=Array.from(document.querySelectorAll('button')).find(e=>e.textContent==='BEGIN JOURNEY');if(!e)return null;const r=e.getBoundingClientRect();return r.width?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);if(beginPoint){await touch(beginPoint);await pause(3000);report.beginRetriedThroughNativeUI=true;}
  report.musicInitial=await media();
  if(!report.musicInitial.some(a=>!a.paused&&a.currentTime>0&&!a.error)){
   const on=await evaluate(`!!document.querySelector('[aria-label="Turn music off"]')`);if(on)await control('Turn music off');await control('Turn music on');report.musicNeededExplicitUserToggle=true;
  }
  report.musicPlaying=await media();if(!report.musicPlaying.some(a=>!a.paused&&a.currentTime>0&&!a.error))throw Error('Music did not play after native user control');
  const nativePath=process.env.ASCENSION_NATIVE_AUDIO||'/tmp/ascension-native-output.wav';
  const markAudio=()=>{try{return fs.statSync(nativePath).size}catch{return null}};
  const captureNative=(file,mark)=>{try{if(mark===null)throw Error('Native WAV backend was not available at capture start');const src=fs.readFileSync(nativePath);const raw=process.env.ASCENSION_NATIVE_AUDIO_FORMAT==='s16le';if(!raw&&(src.toString('ascii',0,4)!=='RIFF'||src.readUInt16LE(20)!==1||src.readUInt16LE(34)!==16))throw Error('Unexpected native PCM format');const channels=raw?2:src.readUInt16LE(22),rate=raw?48000:src.readUInt32LE(24),offset=raw?0:44,frame=channels*2,start=offset+Math.ceil((Math.max(mark,offset)-offset)/frame)*frame,end=offset+Math.floor((src.length-offset)/frame)*frame,data=src.subarray(start,end);const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+data.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(channels,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*frame,28);h.writeUInt16LE(frame,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);fs.writeFileSync('android-evidence/'+file,Buffer.concat([h,data]));let peak=0,sum=0;for(let i=0;i+1<data.length;i+=2){const v=data.readInt16LE(i);peak=Math.max(peak,Math.abs(v));sum+=v*v}const rms=data.length?Math.sqrt(sum/(data.length/2)):0;return {pass:data.length>=rate*frame*2&&peak>=16&&rms>=3,bytes:data.length,peak,rms,seconds:data.length/frame/rate,sourceStartByte:start,sourceEndByte:end}}catch(e){let header=null,bytes=null;try{const raw=fs.readFileSync(nativePath);header=raw.subarray(0,64).toString('hex');bytes=raw.length}catch{}return {pass:false,error:String(e.message),sourceHeaderHex:header,sourceBytes:bytes,startMark:mark}}};
  const musicStart=markAudio();await pause(8000);report.nativeMusic=captureNative('native-music.wav',musicStart);
  await control('Turn music off');report.musicOff=await media();if(!report.musicOff.every(a=>a.paused))throw Error('Music toggle did not pause playback');
  await control('Turn music on');report.musicResumed=await media();if(!report.musicResumed.some(a=>!a.paused))throw Error('Music toggle did not resume');
  const beforeResume=await state();adb('shell','input','keyevent','KEYCODE_HOME');await pause(2000);adb('shell','am','start','-W','-n','com.joenasr.ascension/.MainActivity');await pause(2000);const afterResume=await state();
  if(beforeResume.level!==afterResume.level||beforeResume.current!==afterResume.current)throw Error('Background/resume changed gameplay state');report.lifecycle.push({check:'background/resume',pass:true});capture('resumed');
  const levels=JSON.parse(fs.readFileSync('levels_1_21.json'));
  let s=await state();if(!s||s.level!==1)throw Error('Level 1 not active: '+JSON.stringify(s));
  let sfxStart;
  for(const level of levels){
   await wait('window.__ASC_ANDROID_STATE?.().level==='+level.id);await pause(2000);
   if(level.id===1){await control('Turn music off');sfxStart=markAudio();}
   const actions=route(level),item={id:level.id,actions:[],completed:false};report.levels.push(item);
   item.header=await evaluate(`(()=>{const heading=document.querySelector('h2');if(!heading)return null;const e=heading.parentElement,p=e.querySelector('p'),r=e.getBoundingClientRect();return {left:r.left,right:r.right,viewport:innerWidth,hintFits:p.scrollWidth<=p.clientWidth+1,color:getComputedStyle(e).color}})()`);
   if(!item.header||item.header.left<0||item.header.right>item.header.viewport+1||!item.header.hintFits)throw Error('Portrait header overflows in level '+level.id);
   if(level.id===21&&item.header.color!=='rgb(248, 250, 252)')throw Error('Dark-theme header contrast fix absent');
   capture('level-'+level.id+'-start');
   let actionCount=0;
   while(true){
    await wait("window.__ASC_ANDROID_STATE?.().busy===false");
    const remaining=route(level,await state());if(!remaining.length)break;
    if(++actionCount>120)throw Error("Native route recovery exceeded 120 actions in level "+level.id);
    const action=remaining[0];
    let ok=false;
    for(let attempt=0;attempt<6;attempt++){
     if(attempt){if(attempt%2===1)adb('shell','input','swipe','420','700','120','700','600');else adb('shell','input','swipe','420','550','420','730','600');await pause(1000);report.cameraGestures=(report.cameraGestures||0)+1;}
     s=await state();let p=await stableTarget(action);
     for(let view=0;!p&&view<4;view++){adb('shell','input','swipe','420','700','120','700','600');await pause(1000);p=await stableTarget(action);report.cameraGestures=(report.cameraGestures||0)+1;}
     if(!p)throw Error('Target remains occluded after native camera orbit: '+JSON.stringify(action));
     await touch(p);await wait("window.__ASC_ANDROID_STATE?.().busy===false");const after=await state();
     ok=action.kind==='block'?after.current===action.id:((action.type==='ROTATOR'?after.blocks.find(b=>b.id===action.id).rotation:after.blocks.find(b=>b.id===action.id).sliderVal)||0)%2===action.value;
     item.actions.push({action,point:p,attempt,after:{current:after.current,viewport:after.viewport,blocks:after.blocks.map(b=>({id:b.id,rotation:b.rotation,sliderVal:b.sliderVal}))},pass:ok});if(ok)break;
     if(after.current!==s.current||after.blocks.some(b=>{const before=s.blocks.find(x=>x.id===b.id);return before.rotation!==b.rotation||before.sliderVal!==b.sliderVal})){item.actions[item.actions.length-1].replanFromObservedState=true;ok=true;break;}
    }
    if(!ok)throw Error('Native touch did not perform '+JSON.stringify(action)+' in level '+level.id);
   }
   await wait('Array.from(document.querySelectorAll("h2")).some(e=>e.textContent==="LEVEL COMPLETE")');item.completed=true;console.log('PASS native Android level '+level.id+' ('+actions.length+' actions)');capture('level-'+level.id+'-complete');
   if(level.id===1){report.nativeSfx=captureNative('native-sfx.wav',sfxStart);if(report.scope==='audio')break;}
   if(level.id<21){
    if(level.id===1){
     const reflection=await evaluate(`(()=>{const e=Array.from(document.querySelectorAll('button')).find(e=>e.textContent==='SEEK REFLECTION');if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
     if(!reflection)throw Error('Reflection control missing');await touch(reflection);
     await wait(`Array.from(document.querySelectorAll('button')).some(e=>e.textContent==='ASCEND')`);
     report.reflectionText=await evaluate(`Array.from(document.querySelectorAll('p')).map(e=>e.textContent).find(t=>t.startsWith('"'))`);
     if(!report.reflectionText||report.reflectionText.length<10)throw Error('Offline reflection text missing');
    }
    const box=await evaluate(`(()=>{const buttons=Array.from(document.querySelectorAll('button')).filter(e=>/^(CONTINUE|ASCEND)/i.test(e.textContent.trim())&&e.getBoundingClientRect().width>0);if(buttons.length!==1)return null;const b=buttons[0].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
    if(!box)throw Error('Next-level control not uniquely visible');await touch(box);if(level.id===1)await control('Turn music on');
   }
  }
  report.sfx=await evaluate('window.__ASC_AUDIO_QA');if(!report.sfx||report.sfx.destinationConnections<1||report.sfx.maxPeak<=0)throw Error('No nonzero synthesized SFX samples observed');
  await browser.close();adb('shell','am','force-stop','com.joenasr.ascension');adb('shell','am','start','-W','-n','com.joenasr.ascension/.MainActivity');await pause(5000);browser=await attachWebView(report);
  const restored=report.scope==='audio'?1:21;await wait('window.__ASC_ANDROID_STATE?.().level==='+restored);report.lifecycle.push({check:'cold restart restores level '+restored,pass:true});
  const begin=await evaluate(`(()=>{const e=Array.from(document.querySelectorAll('button')).find(e=>e.textContent==='BEGIN JOURNEY');if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);if(!begin)throw Error('Cold restart start screen missing');await touch(begin);await pause(3000);capture('cold-restart-level'+restored);
  if(report.scope==='audio'){
   for(let k=0;k<2;k++){adb('shell','input','swipe','420','700','120','700','600');await pause(1000);await stableTarget({kind:'block',id:'start'});}
   report.cameraViewport=(await state()).viewport;capture('viewport-after-native-camera-gestures');
  }
  if(report.scope==='full'){
   adb('shell','wm','size','480x1040');await pause(3000);
   const tall=await state();if(tall.level!==21||tall.height<=tall.width)throw Error('Tall portrait resize failed');
   report.tallPortrait={width:tall.width,height:tall.height,level:tall.level};capture('portrait-tall-level21');
   adb('shell','wm','size','480x854');await pause(2000);
  }
  console.log('PASS: completed '+report.levels.length+' levels through native Android touch input ('+report.scope+')');
  if(!report.nativeMusic.pass||!report.nativeSfx.pass)throw Error('Native audio recording did not pass; gameplay completion is recorded separately');
 }catch(e){report.errors.push(String(e.stack||e));try{fs.writeFileSync('android-evidence/failure.png',execFileSync('adb',['exec-out','screencap','-p'],{timeout:45000}))}catch{}console.error(e);process.exitCode=1;}
 finally{fs.writeFileSync('android-evidence/gameplay-report.json',JSON.stringify(report,null,2));if(browser)await browser.close();}
})();
