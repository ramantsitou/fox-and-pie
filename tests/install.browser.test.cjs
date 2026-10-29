const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),out=root+'/artifacts/install';fs.mkdirSync(out,{recursive:true});
const {createStaticHandler}=require('./helpers/static-server.cjs');
(async()=>{const server=http.createServer(createStaticHandler(root+'/dist')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
try{for(const engine of ['chromium','firefox']){const browser=await pw[engine].launch();try{
for(const [kind,ua] of [['firefox','Mozilla/5.0 (Android 14; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0'],['ios','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'],['android','Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36']])for(const lang of ['ru','en','nl']){
const context=await browser.newContext({viewport:{width:568,height:320},screen:{width:568,height:320},hasTouch:true,userAgent:ua,locale:lang});const page=await context.newPage();page.on('pageerror',e=>{throw e});await page.goto('http://127.0.0.1:'+server.address().port);await page.click('#createPlayers');await page.evaluate(()=>{startPhoneFullscreen=()=>{};installPrompt=null});await page.click('#start');await page.click('#menuToggle');await page.click('#installGame');
assert.equal(await page.locator('#installDialog').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>installPlatform()),kind);assert(await page.locator('#installSteps').textContent());assert.equal(await page.evaluate(()=>isPaused()),true);assert.equal(await page.locator('#installDialog').evaluate(e=>e.scrollWidth>e.clientWidth),false);
if(lang==='ru')await page.screenshot({path:`${out}/${engine}-${kind}.png`});
await page.click('#closeInstall');await page.click('#resumeBattle');assert.equal(await page.evaluate(()=>isPaused()),false);
await page.click('#menuToggle');await page.evaluate(()=>installPrompt={prompt(){throw Error('unavailable')},userChoice:Promise.resolve({outcome:'dismissed'})});await page.click('#installGame');assert.equal(await page.evaluate(()=>installNoticeKey),'installFailed');await page.click('#closeInstall');
await page.setViewportSize({width:320,height:568});await page.waitForFunction(()=>manualLandscape);await page.click('#installGame');assert.equal(await page.locator('#installDialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}),true);
await page.keyboard.press('Escape');assert.equal(await page.locator('#installDialog').evaluate(e=>e.open),false);
await context.close();
}}finally{await browser.close();}}}finally{server.close();}
console.log('PASS: install help in Chromium and Firefox, simulated Android/iOS identities, three languages, pause/resume, error feedback and rotated layouts');})().catch(e=>{console.error(e);process.exit(1)});
