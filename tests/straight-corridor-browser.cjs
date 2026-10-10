const {chromium}=require('playwright');
const fs=require('node:fs');
const vm=require('node:vm');

(async()=>{
 const output='corridor-evidence';
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
 const report={target:'Level 5: start → r1 → h1',hits:[],errors:[],success:false,steps:[]};
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 const bytes=fs.readFileSync('assets/index-BjuLtVzX.js','utf8');
 const needle='return ee.jsxs(ee.Fragment,{children:[ee.jsx("color",{attach:"background"';
 if(bytes.split(needle).length!==2)throw Error('Expected exactly one game-scene return for nonintrusive observation');
 await page.route('**/assets/index-BjuLtVzX.js',async route=>{
   const res=await route.fetch();
   const text=await res.text();
   if(text.split(needle).length!==2)throw Error('Unexpected runtime bundle when installing test-only observation');
   const probe='window.__ASC_TEST_GET_STATE=()=>({level:r.id,current:a,blocks:e.map(b=>({id:b.id,rotation:b.rotation,sliderVal:b.sliderVal}))});';
   await route.fulfill({response:res,body:text.replace(needle,probe+needle)});
 });
 const state=()=>page.evaluate(()=>window.__ASC_TEST_GET_STATE?.());
 try{
   await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:30000});
   await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
   await page.getByText('The Broken Spire').waitFor({timeout:30000});
   await page.evaluate(()=>window.__ASCENSION_QA_GO_TO_LEVEL(5));
   await page.getByText('The Bent Causeway').waitFor({timeout:15000});
   await page.waitForFunction(()=>window.__ASC_TEST_GET_STATE?.().level===5);
   await page.waitForTimeout(750);
   const initial=await state();
   if(initial.current!=='start')throw Error('Start current mismatch: '+initial.current);
   report.initial=initial;
   await page.screenshot({path:output+'/before.png'});
   const rt=Math.SQRT1_2;
   const a=bytes.indexOf('__ascFrame='),z=bytes.indexOf(',W4=',a);
   if(a<0||z<0)throw Error('Camera-fit helper not found');
   const frame=vm.runInNewContext('('+bytes.slice(a+'__ascFrame='.length,z)+')',{Math})(
     JSON.parse(fs.readFileSync('levels_1_21.json','utf8')).find(l=>l.id===5));
   const zoom=Math.min(1280*.85/frame.spanX,800*.79/frame.spanY);
   const predict=(x,y,z)=>{
    const xx=(x+z)*rt,zz=(-x+z)*rt,px=xx-frame.center[0],py=y-frame.center[1],pz=zz-frame.center[2];
    return{x:Math.round(640+zoom*(px-pz)*rt),y:Math.round(400-zoom*(-px+2*py-pz)/Math.sqrt(6))};
   };
   const center=predict(0,.5,4);
   report.predictedCenter=center;
   const candidates=[];
   for(let radius=0;radius<=140;radius+=14){
     if(!radius){candidates.push(center);continue;}
     for(let offset=-radius;offset<=radius;offset+=14){
       candidates.push({x:center.x+offset,y:center.y-radius},{x:center.x+offset,y:center.y+radius});
       if(Math.abs(offset)!==radius)candidates.push({x:center.x-radius,y:center.y+offset},{x:center.x+radius,y:center.y+offset});
     }
   }
   let tries=0;
   for(const candidate of candidates){
     if(candidate.x<240||candidate.x>1200||candidate.y<120||candidate.y>720)continue;
     await page.mouse.move(candidate.x,candidate.y);
     const cursor=await page.evaluate(()=>getComputedStyle(document.body).cursor);
     if(cursor!=='pointer')continue;
     await page.evaluate(()=>window.__ASCENSION_QA_GO_TO_LEVEL(5));
     await page.waitForFunction(()=>window.__ASC_TEST_GET_STATE?.().current==='start');
     await page.waitForTimeout(120);
     const before=await state();
     await page.mouse.click(candidate.x,candidate.y);
     await page.waitForTimeout(180);
     const intermediate=await state();
     await page.waitForTimeout(1320);
     const after=await state();
     report.hits.push({point:candidate,cursor,before:before.current,intermediate:intermediate.current,after:after.current});
     tries++;
     if(after.current==='h1'&&intermediate.current==='r1'){
       report.success=true;report.hitPoint=candidate;
       await page.screenshot({path:output+'/after-click.png'});
       await page.waitForTimeout(900);
       await page.screenshot({path:output+'/after-animation.png'});
       break;
     }
     if(tries>=90)break;
   }
   report.attempts=tries;
   if(!report.success)throw Error('No click traversed start -> r1 -> h1 stepwise; inspect hit reports and visual evidence');
   const final=await state();
   if(final.current!=='h1')throw Error('Actor did not remain at clicked destination');
   const r1=initial.blocks.find(b=>b.id==='r1'),r2=final.blocks.find(b=>b.id==='r1');
   if((r1.rotation||0)!==(r2.rotation||0))throw Error('Straight movement unexpectedly rotated bridge');
   console.log('REAL-CLICK CORRIDOR PASS: Level 5 start -> h1 in one click via r1; click='+JSON.stringify(report.hitPoint));
 }catch(e){
   report.errors.push(String(e.stack||e));
   await page.screenshot({path:output+'/failure.png'}).catch(()=>{});
   console.error('REAL-CLICK CORRIDOR NOT VERIFIED:',e.message);
   process.exitCode=1;
 }finally{
   fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));
   await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
