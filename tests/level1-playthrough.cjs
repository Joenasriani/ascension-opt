const {chromium}=require('playwright');
const fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path');
(async()=>{
 const output='playthrough-evidence';fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[],attempts=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
 const bundle=fs.readFileSync('assets/index-BjuLtVzX.js','utf8');
 const start=bundle.indexOf('__ascFrame='),finish=bundle.indexOf(',W4=',start);
 if(start<0||finish<0)throw Error('Adaptive camera framing helper missing');
 const frameFn=vm.runInNewContext('('+bundle.slice(start+'__ascFrame='.length,finish)+')',{Math});
 const level=JSON.parse(fs.readFileSync('levels_1_21.json','utf8'))[0];
 const frame=frameFn(level),w=1280,h=800,rt=Math.SQRT1_2;
 const zoom=Math.min(w*.85/frame.spanX,h*.79/frame.spanY);
 const project=(x,y,z)=>{
  const xx=(x+z)*rt,zz=(-x+z)*rt,p=[xx-frame.center[0],y-frame.center[1],zz-frame.center[2]];
  return {x:Math.round(w/2+zoom*(p[0]-p[2])*rt),y:Math.round(h/2-zoom*(-p[0]+2*p[1]-p[2])/Math.sqrt(6))};
 };
 const lever=(quarter,reach,y)=>{const angle=quarter*Math.PI/2;return project(Math.sin(angle)*reach,y,Math.cos(angle)*reach)};
 const click=async(coord,label,shots)=>{await page.mouse.move(coord.x,coord.y);await page.mouse.click(coord.x,coord.y);await page.waitForTimeout(450);if(shots)await page.screenshot({path:path.join(output,label+'.png')});};
 const won=()=>page.getByText('LEVEL COMPLETE').isVisible().catch(()=>false);
 const trials=[
  {r:.83,hy:0,walkX:-1,walkY:.52,endX:0,endY:.52},
  {r:.83,hy:.2,walkX:-.8,walkY:.52,endX:.25,endY:.52},
  {r:.67,hy:0,walkX:-1.1,walkY:.52,endX:-.25,endY:.52},
  {r:.95,hy:0,walkX:-.8,walkY:.52,endX:0,endY:.52},
  {r:.83,hy:0,walkX:0,walkY:.52,endX:0,endY:.52},
  {r:.95,hy:.2,walkX:0,walkY:.52,endX:.25,endY:.52},
  {r:.75,hy:-.1,walkX:-.8,walkY:.65,endX:-.25,endY:.65},
  {r:.83,hy:0,walkX:-.8,walkY:.7,endX:.2,endY:.7}
 ];
 try{
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
  await page.getByText('The Broken Spire').waitFor({timeout:25000});
  await page.waitForTimeout(850);
  await page.screenshot({path:path.join(output,'initial.png')});
  for(let i=0;i<trials.length;i++){
   const trial=trials[i],shots=i===0;
   await page.evaluate(()=>window.__ASCENSION_QA_GO_TO_LEVEL(1));
   await page.waitForTimeout(600);
   const moves=[
    {name:'rotate-to-start',at:lever(1,trial.r,trial.hy)},
    {name:'walk-to-bridge',at:project(trial.walkX,trial.walkY,0)},
    {name:'rotate-to-exit',at:lever(2,trial.r,trial.hy)},
    {name:'walk-to-exit',at:project(trial.endX,trial.endY,2)}
   ];
   for(const move of moves){
    await click(move.at,'trial'+i+'-'+move.name,shots);
    if(await won())break;
   }
   await page.waitForTimeout(1100);
   const success=await won();
   attempts.push({trial:i,parameters:trial,moves,success});
   console.log('LEVEL1 TRY '+i+': '+(success?'WIN':'not completed')+' '+JSON.stringify(moves.map(m=>m.at)));
   if(success){
     await page.screenshot({path:path.join(output,'level1-win.png')});
     console.log('LEVEL 1 PLAYTHROUGH PASS – 4 genuine mouse interactions');
     break;
   }
  }
  if(!attempts.some(a=>a.success))throw Error('No completion after '+attempts.length+' exact projected click sequences; investigate click targets and handle occlusion');
 }catch(e){
  errors.push(String(e.stack||e));
  await page.screenshot({path:path.join(output,'not-completed.png')}).catch(()=>{});
  console.error('LEVEL 1 PLAYTHROUGH UNVERIFIED:',e.message);
  process.exitCode=1;
 }finally{
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({frame,zoom,attempts,errors},null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
