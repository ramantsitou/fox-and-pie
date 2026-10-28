const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),out=root+'/artifacts/setup-install';fs.mkdirSync(out,{recursive:true});const {createStaticHandler}=require('./helpers/static-server.cjs');
(async()=>{const server=http.createServer(createStaticHandler(root+'/dist')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
try{for(const engine of ['chromium','firefox']){const browser=await pw[engine].launch();try{for(const lang of ['ru','en','nl'])for(const [width,height] of [[568,320],[844,390],[320,568],[390,844],[1280,800]]){
const mobile=width!==1280,context=await browser.newContext({viewport:{width,height},screen:{width,height},hasTouch:mobile,locale:lang,...(mobile?{userAgent:'Mozilla/5.0 (Android 14; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0'}:{})});const page=await context.newPage();page.on('pageerror',e=>{throw e});await page.goto('http://127.0.0.1:'+server.address().port);
await page.fill('#playerName0','Ян');await page.screenshot({path:`${out}/${engine}-${lang}-${width}x${height}-one.png`});
for(let i=1;i<4;i++){await page.click('#addPlayer');await page.fill('#playerName'+i,['','Мартин','Аня','Макс'][i]);}
const names=await page.locator('.player-name').evaluateAll(es=>es.map(e=>e.value));
await page.evaluate(()=>installPrompt=null);await page.click('#setupInstall');assert.equal(await page.locator('#installDialog').evaluate(e=>e.open),true);assert.equal(await page.locator('#playersDialog').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>needsPlayerSetup),true);
await page.click('#closeInstall');assert.deepEqual(await page.locator('.player-name').evaluateAll(es=>es.map(e=>e.value)),names);
assert.equal(await page.locator('#playersDialog').evaluate(e=>e.scrollHeight>e.clientHeight||e.scrollWidth>e.clientWidth),false,'only the roster scrolls');
for(const id of ['createPlayers','setupInstall'])assert.equal(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}),true,'action remains on screen');
await page.screenshot({path:`${out}/${engine}-${lang}-${width}x${height}-four.png`});
await page.evaluate(()=>{pwaInstalled=true;pwaUi()});assert.equal(await page.locator('#setupInstallBlock').isVisible(),false);assert.deepEqual(await page.locator('.player-name').evaluateAll(es=>es.map(e=>e.value)),names);
await page.click('#createPlayers');assert.deepEqual(await page.evaluate(()=>players),names);await context.close();
}}finally{await browser.close();}}}finally{server.close();}console.log('PASS: setup installation in two browsers, three languages, five resolutions; names preserved, four-player scrolling, fixed actions and installed-mode hiding');})().catch(e=>{console.error(e);process.exit(1)});
