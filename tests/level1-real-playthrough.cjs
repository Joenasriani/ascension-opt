const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  fs.mkdirSync('level1-play-evidence', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: {width:1280, height:800} });
  const events = [];
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if(msg.type() === 'error')errors.push(msg.text()); });
  const capture = async label => page.screenshot({path:`level1-play-evidence/${label}.png`});
  try {
    await page.goto('http://127.0.0.1:8080/', {waitUntil:'domcontentloaded',timeout:30000});
    await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
    await page.getByText('The Broken Spire').waitFor({timeout:20000});
    await page.waitForTimeout(900);
    await capture('start');
    // Coordinates derive from the current 1280x800 orthographic scene:
    // group yaw=45°, camera=(20,20,20) looking at origin, zoom≈48.
    // Level 1: start=(-2,0,0), bridge=(0,0,0), end=(0,0,2).
    // The bridge needs two quarter-turns: first align with start,
    // walk onto bridge, then align with the end.
    const actions = [
      {label:'rotate-first',x:669,y:401},
      {label:'walk-bridge',x:640,y:400},
      {label:'rotate-second',x:640,y:380},
      {label:'walk-exit',x:640,y:456}
    ];
    for(const action of actions){
      const marker = await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x:action.x,y:action.y});
      await page.mouse.click(action.x,action.y);
      await page.waitForTimeout(800);
      events.push({...action,hitElement:marker});
      await capture(action.label);
      if(await page.getByText('LEVEL COMPLETE').isVisible().catch(()=>false))break;
    }
    const completed = await page.getByText('LEVEL COMPLETE').isVisible().catch(()=>false);
    if(!completed) throw Error('Level 1 completion was not observed after the planned real mouse sequence');
    if(errors.length)throw Error('Console or page errors: '+errors.join(' | '));
    console.log('LEVEL 1 REAL MOUSE PLAYTHROUGH PASS');
  } catch(err){
    events.push({failure:String(err)});
    await capture('failure').catch(()=>{});
    process.exitCode=1;
    console.error('LEVEL 1 PLAYTHROUGH FAIL:',err);
  } finally {
    fs.writeFileSync('level1-play-evidence/result.json',JSON.stringify({events,errors},null,2));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
