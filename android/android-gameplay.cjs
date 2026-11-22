// Real compiled Android WebView: observe state, drive native ADB touch input.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const adb=(...a)=>execFileSync('adb',a,{timeout:45000}).toString();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function route(level){
 const blocks=level.blocks, ids=new Map(blocks.map((b,i)=>[b.id,i]));
 const moves=blocks.map((b,i)=>({b,i})).filter(x=>['ROTATOR','SLIDER'].includes(x.b.type));
 const mi=new Map(moves.map((m,j)=>[m.i,j]));
 const init=moves.reduce((a,{b},j)=>a|((((b.type==='ROTATOR'?b.rotation:b.sliderVal)||0)%2)<<j),0);
 const val=(i,bits)=>mi.has(i)?(bits>>mi.get(i))&1:(blocks[i].rotation||blocks[i].sliderVal||0)%2;
 const geo=(i,bits)=>{const b=blocks[i],v=val(i,bits),s=b.size||{x:1,y:1,z:1};return {p:[b.position.x,b.position.y+(b.type==='SLIDER'?2*v:0),b.position.z],s:b.type==='ROTATOR'&&v?[s.z,s.y,s.x]:[s.x,s.y,s.z]}};
 const aligned=(i,j,bits)=>{const a=geo(i,bits),b=geo(j,bits);return Math.abs(a.p[1]-b.p[1])<=.1&&[0,2].every(k=>Math.abs(a.p[k]-b.p[k])<=(a.s[k]+b.s[k])/2+.1)};
 const safe=(i,bits)=>blocks.every((_,j)=>{if(i===j)return true;const a=geo(i,bits),b=geo(j,bits);return ![0,1,2].every(k=>Math.abs(a.p[k]-b.p[k])<(a.s[k]+b.s[k])/2-.02)});
 const start=ids.get(level.startBlockId),end=ids.get(level.endBlockId),key=(i,b)=>`${i}:${b}`;
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
(async()=>{
 const report={kind:'Android native-touch gameplay',levels:[],errors:[],network:[],limits:['Debug build has read-only scene observations. No gameplay setters are invoked.','Audio output needs separate audible verification.']};
 let browser;
 try{
  const appPid=adb('shell','pidof','com.joenasr.ascension').trim().split(/\s+/)[0];
  if(!appPid)throw Error('ASCENSION process absent');
  let socket;
  for(let i=0;i<20;i++){socket=adb('shell','cat','/proc/net/unix').split('\n').find(l=>l.trim().endsWith('@webview_devtools_remote_'+appPid));if(socket)break;await pause(1000)}
  if(!socket)throw Error('WebView debug socket unavailable');
  socket=socket.trim().split(/\s+/).pop().replace(/^@/,'');adb('forward','tcp:9222','localabstract:'+socket);
  const pages=await (await fetch('http://127.0.0.1:9222/json/list')).json();
  report.webViewTargets=pages.map(p=>({type:p.type,url:p.url,title:p.title}));
  const target=pages.find(p=>p.type==='page'&&p.url.includes('appassets.androidplatform.net'));
  if(!target)throw Error('No local game WebView page');
  const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  let seq=0;const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Network.requestWillBeSent')report.network.push(m.params.request.url);else if(m.method==='Runtime.exceptionThrown')report.errors.push(JSON.stringify(m.params))};
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},30000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
  browser={close:async()=>ws.close()};
  await cdp('Runtime.enable');await cdp('Network.enable');
  const wait=async(expression,timeout=15000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(expression))return;await pause(250)}throw Error('Condition timed out: '+expression)};
  const page={evaluate:fn=>evaluate('('+fn.toString()+')()')};
  report.initialResources=await evaluate('performance.getEntriesByType("resource").map(r=>r.name)');
  const state=()=>page.evaluate(()=>window.__ASC_ANDROID_STATE?.());
  const touch=async p=>{const s=await state();adb('shell','input','tap',String(Math.round(p.x*480/s.width)),String(Math.round(p.y*854/s.height)));await pause(1300)};
  const capture=name=>fs.writeFileSync('android-evidence/'+name+'.png',execFileSync('adb',['exec-out','screencap','-p'],{timeout:45000}));
  const levels=JSON.parse(fs.readFileSync('levels_1_21.json'));
  let s=await state();if(!s||s.level!==1)throw Error('Level 1 not active: '+JSON.stringify(s));
  for(const level of levels){
   await wait('window.__ASC_ANDROID_STATE?.().level==='+level.id);await pause(2000);
   const actions=route(level),item={id:level.id,actions:[],completed:false};report.levels.push(item);capture('level-'+level.id+'-start');
   for(const action of actions){
    let ok=false;
    for(let attempt=0;attempt<3;attempt++){
     s=await state();const p=s.points.find(p=>p.id===action.id&&p.kind===action.kind);if(!p)throw Error('Missing target '+JSON.stringify(action));
     await touch({...p,x:p.x+(attempt===1?5:attempt===2?-5:0)});const after=await state();
     ok=action.kind==='block'?after.current===action.id:((action.type==='ROTATOR'?after.blocks.find(b=>b.id===action.id).rotation:after.blocks.find(b=>b.id===action.id).sliderVal)||0)%2===action.value;
     item.actions.push({action,point:p,attempt,after:{current:after.current,blocks:after.blocks.map(b=>({id:b.id,rotation:b.rotation,sliderVal:b.sliderVal}))},pass:ok});if(ok)break;
    }
    if(!ok)throw Error('Native touch did not perform '+JSON.stringify(action)+' in level '+level.id);
   }
   await wait('Array.from(document.querySelectorAll("h2")).some(e=>e.textContent==="LEVEL COMPLETE")');item.completed=true;console.log('PASS native Android level '+level.id+' ('+actions.length+' actions)');capture('level-'+level.id+'-complete');
   if(level.id<21){
    const box=await evaluate(`(()=>{const buttons=Array.from(document.querySelectorAll('button')).filter(e=>/^(CONTINUE|ASCEND)/i.test(e.textContent.trim())&&e.getBoundingClientRect().width>0);if(buttons.length!==1)return null;const b=buttons[0].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
    if(!box)throw Error('Next-level control not uniquely visible');await touch(box);
   }
  }
  console.log('PASS: completed all 21 levels through native Android touch input');
 }catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1;}
 finally{fs.writeFileSync('android-evidence/gameplay-report.json',JSON.stringify(report,null,2));if(browser)await browser.close();}
})();
