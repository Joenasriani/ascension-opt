const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const failures = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => failures.push(r.url() + ' : ' + r.failure()?.errorText));
  fs.mkdirSync('browser-evidence', { recursive: true });

  try {
    const response = await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (response?.status() !== 200) throw Error('Unexpected HTTP response: ' + response?.status());
    await page.getByRole('button', { name: 'BEGIN JOURNEY' }).waitFor({ timeout: 60000 });
    await page.screenshot({ path: 'browser-evidence/start.png' });

    await page.getByRole('button', { name: 'BEGIN JOURNEY' }).click();
    await page.getByText('The Broken Spire').waitFor({ timeout: 20000 });
    await page.screenshot({ path: 'browser-evidence/level1.png' });

    const count = await page.evaluate(() => window.__ASCENSION_LEVEL_COUNT);
    if (count !== 21) throw Error('Runtime level count is ' + count + ', expected 21');

    const musicControl = page.getByRole('button', { name: /Turn music (on|off)/ });
    await musicControl.waitFor({ timeout: 10000 });
    await musicControl.click();

    const goToLevel = await page.evaluate(() => typeof window.__ASCENSION_QA_GO_TO_LEVEL === 'function');
    if (!goToLevel) throw Error('QA level selection hook missing');

    await page.evaluate(() => window.__ASCENSION_QA_GO_TO_LEVEL(14));
    await page.getByText('The Stepped Circuit').waitFor({ timeout: 15000 });
    await page.screenshot({ path: 'browser-evidence/level14.png' });
    await page.evaluate(() => window.__ASCENSION_QA_GO_TO_LEVEL(21));
    await page.getByText('The Upper Mandala').waitFor({ timeout: 15000 });
    await page.screenshot({ path: 'browser-evidence/level21.png' });
    await page.waitForTimeout(1000);
    if (errors.length) throw Error('Browser errors: ' + errors.join(' | '));
    console.log('BROWSER SMOKE PASS: start, scene mount, runtime level count, music control, QA navigation');
  } catch (e) {
    await page.screenshot({ path: 'browser-evidence/failure.png' }).catch(() => {});
    console.error('BROWSER SMOKE FAIL:', e.stack || e);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join('browser-evidence', 'diagnostics.json'), JSON.stringify({ errors, failedRequests: failures }, null, 2));
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
