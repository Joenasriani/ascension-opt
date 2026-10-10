const { chromium } = require('playwright');
const fs = require('node:fs');
(async()=>{
  const browser = await chromium.launch({headless:true});
  fs.mkdirSync('camera-evidence',{recursive:true});
  const diagnostics=[];
  const configurations=[
    {width:1280,height:800,levels:[1,14,21]},
    {width:1920,height:1080,levels:[1,14,21]},
    {width:2560,height:1440,levels:[1,21]},
    {width:390,height:844,levels:[1,21]},
    {width:844,height:390,levels:[21]},
    {width:3840,height:2160,levels:[1,21]},
    {width:360,height:640,levels:[21]},
    {width:640,height:360,levels:[21]}
  ];
  let failed = false;
  for (const config of configurations) {
    const page=await browser.newPage({viewport:{width:config.width,height:config.height},deviceScaleFactor:1});
    const problems=[];
    page.on('pageerror',e=>problems.push(String(e)));
    try{
      await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.getByRole('button',{name:'BEGIN JOURNEY'}).click();
      await page.getByText('The Broken Spire').waitFor({timeout:25000});
      for(const level of config.levels){
        await page.evaluate(number=>window.__ASCENSION_QA_GO_TO_LEVEL(number),level);
        await page.waitForTimeout(1000);
        const rect=await page.locator('canvas').first().boundingBox();
        if(!rect||rect.width<config.width*.9||rect.height<config.height*.9)throw Error('Canvas does not fill viewport');
        const image='camera-evidence/level-'+level+'-'+config.width+'x'+config.height+'.png';
        await page.screenshot({path:image});
        diagnostics.push({level,viewport:config.width+'x'+config.height,screenshot:image,errors:[...problems]});
        if(level===21 && config.width===1920 && config.height===1080){
          const cx=config.width/2,cy=config.height/2;
          await page.mouse.move(cx,cy);
          await page.mouse.wheel(0,-500);
          await page.waitForTimeout(350);
          await page.screenshot({path:'camera-evidence/level-21-manual-zoom.png'});
          await page.mouse.move(cx,cy);
          await page.mouse.down();
          await page.mouse.move(cx+160,cy+85,{steps:12});
          await page.mouse.up();
          await page.waitForTimeout(350);
          await page.screenshot({path:'camera-evidence/level-21-manual-orbit.png'});
          await page.mouse.move(cx,cy);
          await page.mouse.down({button:'right'});
          await page.mouse.move(cx+110,cy-75,{steps:10});
          await page.mouse.up({button:'right'});
          await page.waitForTimeout(350);
          await page.screenshot({path:'camera-evidence/level-21-manual-pan.png'});
          diagnostics.push({level,viewport:'1920x1080',manualControls:'wheel, drag, right-drag exercised'});
        }
      }
      if(problems.length)throw Error(problems.join('; '));
    }catch(e){failed=true;diagnostics.push({viewport:config.width+'x'+config.height,error:String(e)});}
    finally{await page.close();}
  }
  fs.writeFileSync('camera-evidence/diagnostics.json',JSON.stringify(diagnostics,null,2));
  await browser.close();
  if(failed)process.exitCode=1;
  else console.log('CAMERA BROWSER CAPTURE PASS: '+diagnostics.length+' viewport-level screenshots');
})().catch(e=>{console.error(e);process.exitCode=1});
