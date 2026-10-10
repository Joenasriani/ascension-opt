const { chromium } = require('playwright');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const report = {checks:[],errors:[],failedRequests:[],interactionCandidates:[]};
  page.on('pageerror', e=>report.errors.push(String(e)));
  page.on('requestfailed', r=>report.failedRequests.push({url:r.url(),reason:r.failure()?.errorText}));
  fs.mkdirSync('gameplay-evidence',{recursive:true});
  const check=(name,pass,detail)=>report.checks.push({name,pass,detail});
  try {
    await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
    await page.getByText('The Broken Spire').waitFor({timeout:20000});
    const canvas=page.locator('canvas').first();
    const bounds=await canvas.boundingBox();
    if(!bounds)throw Error('No canvas bounding box');
    check('rendered canvas',bounds.width>500&&bounds.height>400,bounds);
    // Probe the first puzzle's central region without mutating game state.
    // Hover samples identify where R3F reports an interactive target.
    const points=[];
    for(let yi=0;yi<16;yi++){
      for(let xi=0;xi<24;xi++){
        const x=bounds.x+bounds.width*(.2+.6*xi/23);
        const y=bounds.y+bounds.height*(.15+.7*yi/15);
        await page.mouse.move(x,y);
        const cursor=await page.evaluate(()=>getComputedStyle(document.body).cursor);
        if(cursor==='pointer')points.push({x:Math.round(x),y:Math.round(y)});
      }
    }
    report.interactionCandidates=points;
    check('interactive targets discovered',points.length>0,{count:points.length});
    await page.screenshot({path:'gameplay-evidence/level1-targets.png'});
    // This pass deliberately does NOT fabricate a solved-level assertion.
    // The coordinates are reconnaissance for a subsequent deterministic
    // click-path test validated against screenshots.
    console.log('INTERACTION DIAGNOSTIC:',JSON.stringify(report.checks));
    if(!points.length)process.exitCode=1;
  }catch(e){
    report.errors.push(String(e.stack||e));
    await page.screenshot({path:'gameplay-evidence/failure.png'}).catch(()=>{});
    process.exitCode=1;
  }finally{
    fs.writeFileSync('gameplay-evidence/interaction-report.json',JSON.stringify(report,null,2));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
