const { chromium } = require('playwright');
const fs = require('fs');
const crypto = require('crypto');
(async () => {
 const browser = await chromium.launch({headless:true});
 const page = await browser.newPage({viewport:{width:1280,height:800}});
 fs.mkdirSync('level1-evidence',{recursive:true});
 const result={attempts:[],issues:[],completionObserved:false};
 page.on('pageerror',e=>result.issues.push('pageerror: '+String(e)));
 try {
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
  await page.getByText('The Broken Spire').waitFor({timeout:25000});
  const canvas=page.locator('canvas').first();
  const bounds=await canvas.boundingBox(); if(!bounds)throw Error('No rendered canvas');
  const sample=async()=>{const buf=await canvas.screenshot();return crypto.createHash('sha256').update(buf).digest('hex');};
  const isComplete=async()=>await page.getByText('LEVEL COMPLETE').isVisible().catch(()=>false);
  const discover=async()=>{
   const spots=[];
   for(let j=0;j<16;j++)for(let i=0;i<24;i++){
    const x=bounds.x+bounds.width*(.2+.6*i/23),y=bounds.y+bounds.height*(.15+.7*j/15);
    await page.mouse.move(x,y);
    const cursor=await page.evaluate(()=>getComputedStyle(document.body).cursor);
    if(cursor==='pointer')spots.push({x:Math.round(x),y:Math.round(y)});
   }
   return spots;
  };
  const spots=await discover();
  result.candidates=spots;
  const base=await sample();
  for(let i=0;i<spots.length;i++){
   await page.evaluate(()=>window.__ASCENSION_QA_GO_TO_LEVEL(1));
   await page.waitForTimeout(450);
   const before=await sample();
   await page.mouse.click(spots[i].x,spots[i].y);
   await page.waitForTimeout(600);
   const after=await sample();
   const complete=await isComplete();
   result.attempts.push({coordinate:spots[i],visualChange:before!==after,completion:complete});
   if(complete){result.completionObserved=true;break;}
  }
  await page.screenshot({path:'level1-evidence/after-probes.png'});
  result.baseImageHash=base;
  console.log('LEVEL1 CLICK PROBE:',JSON.stringify({candidates:spots.length,changed:result.attempts.filter(x=>x.visualChange).length,completed:result.completionObserved}));
 }catch(e){result.issues.push(String(e.stack||e));process.exitCode=1;}
 finally {fs.writeFileSync('level1-evidence/results.json',JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
