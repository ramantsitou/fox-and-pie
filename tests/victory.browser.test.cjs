const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/victory');fs.mkdirSync(out,{recursive:true});
const {createStaticHandler}=require('./helpers/static-server.cjs');
(async()=>{const server=http.createServer(createStaticHandler(root+'/dist')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch();
try{for(const lang of ['ru','en','nl'])for(const [w,h] of [[1280,900],[844,390],[568,320],[390,844],[320,568]]){
const context=await browser.newContext({viewport:{width:w,height:h},screen:{width:w,height:h},isMobile:w!==1280,hasTouch:w!==1280,locale:lang});const page=await context.newPage();page.on('pageerror',e=>{throw e});await page.goto('http://127.0.0.1:'+server.address().port);await page.click('#createPlayers');await page.evaluate(()=>startPhoneFullscreen=()=>{});
// Exercise actual wave-completion logic with the final wave already defeated.
await page.evaluate(()=>{level=50;loadMaze();turnReady=true;$('#start').onclick();spawned=total;foxes=[];update(0)});
assert.equal(await page.locator('#victoryDialog').evaluate(e=>e.open),true);
await page.locator('.victory-art').evaluate(img=>img.decode());
assert.equal(await page.locator('#victoryGithub').getAttribute('href'),'https://github.com/ramantsitou/fox-and-pie');
assert.equal(await page.locator('#victoryDialog').evaluate(e=>e.scrollWidth>e.clientWidth),false);
assert.equal(await page.locator('#victoryDialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}),true,'victory fits the physical screen');
if(w!==1280)assert.equal(await page.locator('#victoryDialog').evaluate(e=>e.scrollHeight>e.clientHeight),false,`no scrolling: ${lang} ${w}x${h} ${JSON.stringify(await page.locator('#victoryDialog').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,art:e.querySelector('img').clientHeight,copy:e.querySelector('.victory-copy').clientHeight})))}`);
await page.screenshot({path:path.join(out,`${lang}-${w}x${h}.png`)});
await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelector('#victoryDialog').open);await page.locator('.victory-art').evaluate(img=>img.decode());
await page.click('#victoryAgain');assert.equal(await page.locator('#playersDialog').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>level),50);
await page.fill('#playerName0','Ян');await page.click('#createPlayers');assert.deepEqual(await page.evaluate(()=>[level,pie,over,turnReady]),[1,10,false,true]);assert.equal(await page.locator('#victoryDialog').evaluate(e=>e.open),false);
await page.evaluate(()=>{level=50;pie=1;failAttempt({boss:false})});assert.equal(await page.locator('#victoryDialog').evaluate(e=>e.open),false,'defeat on level 50 is not victory');
await context.close();
}}finally{await browser.close();server.close();}
console.log('PASS: final-wave victory, 15 viewport/language layouts, offline artwork and victory reload, replay setup, final-level defeat');})().catch(e=>{console.error(e);process.exit(1)});
