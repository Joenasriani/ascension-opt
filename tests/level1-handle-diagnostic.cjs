const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const output='playthrough-evidence';fs.mkdirSync(output,{recursive:true});
 const report={hotspots:[],trials:[],errors:[]};
 page.on('pageerror',e=>report.errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
  await page.getByText('The Broken Spire').waitFor({timeout:20000});
  await page.waitForTimeout(750);
  await page.screenshot({path:output+'/hover-initial.png'});
  for(let y=255;y<=340;y+=7)for(let x=696;x<=765;x+=7){
   await page.mouse.move(x,y);
   await page.waitForTimeout(18);
   const cursor=await page.evaluate(()=>getComputedStyle(document.body).cursor);
   if(cursor==='pointer')report.hotspots.push({x,y});
  }
  console.log('LEVEL1 HANDLE HOVER TARGETS:',JSON.stringify(report.hotspots));
  const samples=[...report.hotspots.filter((v,i)=>i%Math.max(1,Math.ceil(report.hotspots.length/5))===0)];
  if(!samples.length){throw Error('No pointer-hover targets in visible handle region');}
  for(let i=0;i<samples.length;i++){
   await page.evaluate(()=>window.__ASCENSION_QA_GO_TO_LEVEL(1));
   await page.waitForTimeout(650);
   const p=samples[i];
   await page.mouse.move(p.x,p.y);
   await page.waitForTimeout(60);
   const cursor=await page.evaluate(()=>getComputedStyle(document.body).cursor);
   await page.mouse.click(p.x,p.y);
   await page.waitForTimeout(850);
   await page.screenshot({path:output+'/handle-attempt-'+i+'.png'});
   report.trials.push({point:p,cursor});
  }
  console.log('LEVEL1 HANDLE DIAGNOSTICS:',JSON.stringify({hoverHits:report.hotspots.length,samples:report.trials}));
 }catch(e){report.errors.push(String(e.stack||e));process.exitCode=1;}
 finally{
  fs.writeFileSync(output+'/handle-diagnostic.json',JSON.stringify(report,null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
