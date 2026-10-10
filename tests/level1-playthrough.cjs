const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const report={clicks:[],errors:[],completed:false};
 page.on('pageerror',e=>report.errors.push(String(e)));
 fs.mkdirSync('playthrough-evidence',{recursive:true});
 try {
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
  await page.getByText('The Broken Spire').waitFor({timeout:25000});
  const canvas=page.locator('canvas').first();
  const bounds=await canvas.boundingBox();
  if(!bounds)throw Error('Canvas missing');
  // Initial Level 1 graph: start -> bridge (rotation required) -> end.
  // Locate hit targets via browser cursor, then search short click sequences.
  const spots=[];
  for(let j=0;j<14;j++)for(let i=0;i<22;i++){
   const x=bounds.x+bounds.width*(.22+.56*i/21);
   const y=bounds.y+bounds.height*(.2+.6*j/13);
   await page.mouse.move(x,y);
   if(await page.evaluate(()=>getComputedStyle(document.body).cursor)==='pointer')spots.push({x:Math.round(x),y:Math.round(y)});
  }
  report.candidates=spots;
  if(!spots.length)throw Error('No interactive targets found');
  // Try ordered short sequences against real browser input. Reinitialize Level 1
  // between trials; do not call the game win handler or alter puzzle state directly.
  let attempts=0;
  outer:for(const first of spots)for(const second of spots)for(const third of spots){
   attempts++;
   if(attempts>2200)break outer;
   await page.evaluate(()=>window.__ASCENSION_QA_GO_TO_LEVEL(1));
   await page.waitForTimeout(80);
   for(const p of [first,second,third]){
    await page.mouse.click(p.x,p.y);
    await page.waitForTimeout(70);
   }
   if(await page.getByText('LEVEL COMPLETE').isVisible().catch(()=>false)){
    report.completed=true;
    report.solution=[first,second,third];
    await page.screenshot({path:'playthrough-evidence/level1-win.png'});
    break outer;
   }
  }
  report.attempts=attempts;
  if(!report.completed)throw Error('No Level 1 completion through tested click sequences; this is inconclusive, not proof of impossible gameplay');
  console.log('LEVEL 1 BROWSER PLAYTHROUGH PASS',JSON.stringify(report.solution));
 }catch(e){
  report.errors.push(String(e));
  await page.screenshot({path:'playthrough-evidence/last-state.png'}).catch(()=>{});
  console.error('LEVEL 1 PLAYTHROUGH NOT VERIFIED:',e.message);
  process.exitCode=1;
 }finally{
  fs.writeFileSync('playthrough-evidence/report.json',JSON.stringify(report,null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
