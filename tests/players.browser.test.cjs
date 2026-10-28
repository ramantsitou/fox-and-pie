const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),output=path.join(root,'artifacts/players');fs.mkdirSync(output,{recursive:true});const {createStaticHandler}=require(root+'/tests/helpers/static-server.cjs');
(async()=>{const server=http.createServer(createStaticHandler(root+'/dist')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({headless:true});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},screen:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,locale:'ru-RU'});
 const page=await context.newPage();page.on('pageerror',e=>{throw e});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>atlasReady);
 assert.equal(await page.locator('.player-row:visible').count(),1);
 await page.screenshot({path:path.join(output,mobile?'solo-setup-phone.png':'solo-setup-desktop.png')});
 for(let i=0;i<3;i++)await page.click('#addPlayer');
 assert.equal(await page.locator('#addPlayer').isVisible(),false);
 await page.fill('#playerName2','София');await page.click('#removePlayer1');assert.equal(await page.inputValue('#playerName1'),'София');await page.click('#addPlayer');
 for(const [i,name] of ['Аня','Борис','София','Макс'].entries())await page.fill('#playerName'+i,name);
 assert.equal(await page.locator('.player-row:visible').count(),4);
 await page.screenshot({path:path.join(output,mobile?'setup-phone.png':'setup-desktop.png')});
 await page.click('#createPlayers');assert.equal(await page.locator('#playersDialog').evaluate(e=>e.open),false);
 if(mobile)await page.click('#manualRotate');await page.evaluate(()=>startPhoneFullscreen=()=>{});
 await page.click('#ready');assert.equal(await page.locator('#currentPlayerBadge').textContent(),'🟠 Аня');
 for(const [type,x] of [[0,2],[1,6],[2,9]]){
 await page.locator('.card').nth(type).click();const point=await page.evaluate(x=>{const r=canvas.getBoundingClientRect();return manualLandscape?{x:r.right-.5*r.width/10,y:r.top+(x+.5)*r.height/14}:{x:r.left+(x+.5)*r.width/14,y:r.top+.5*r.height/10}},x);
 await page.mouse.click(point.x,point.y);if(mobile)await page.click('#confirmPlace');else await page.click('#backToShop');
 }
 await page.click('#start');await page.waitForTimeout(3500);assert.equal(await page.evaluate(()=>running),true);
 await page.screenshot({path:path.join(output,mobile?'gameplay-phone.png':'gameplay-desktop.png')});
 await page.reload();await page.waitForFunction(()=>atlasReady);assert.equal(await page.locator('#playersDialog').evaluate(e=>e.open),false);assert.deepEqual(await page.evaluate(()=>players),['Аня','Борис','София','Макс']);assert.equal(await page.evaluate(()=>resumeWave),true);
 if(mobile)await page.click('#manualRotate');await page.evaluate(()=>startPhoneFullscreen=()=>{});await page.click('#ready');
 await page.evaluate(()=>{failAttempt({boss:false});failAttempt({boss:false})});assert.equal(await page.locator('#currentPlayerBadge').textContent(),'🟢 София');
 await page.screenshot({path:path.join(output,mobile?'handoff-phone.png':'handoff-desktop.png')});
 await page.click('#menuToggle');await page.click('#restart');await page.click('#cancelRestart');assert.equal(await page.locator('#playersDialog').evaluate(e=>e.open),false);
 await page.click('#menuToggle');await page.click('#restart');await page.click('#confirmRestart');assert.equal(await page.locator('#playersDialog').evaluate(e=>e.open),true);
 assert.equal(await page.evaluate(()=>pie),8);await page.screenshot({path:path.join(output,mobile?'restart-setup-phone.png':'restart-setup-desktop.png')});await page.fill('#playerName0','<b>Лис</b>');await page.click('#createPlayers');assert.equal(await page.evaluate(()=>turnReady),true);assert((await page.locator('#message').textContent()).includes('<b>Лис</b>'));assert.equal(await page.locator('#message b').count(),0);
 await page.evaluate(()=>failAttempt({boss:false}));assert.equal(await page.evaluate(()=>playerIndex),0);
 await page.click('#menuToggle');for(const lang of ['en','nl','ru']){await page.selectOption('#language',lang);assert.equal(await page.evaluate(()=>currentPlayer()),'<b>Лис</b>')}
 await context.close();
}
await browser.close();server.close();console.log('PASS: real desktop/mobile player setup, validation, four-player gameplay, reload, third-player handoff, restart, solo, safe names and languages');})().catch(e=>{console.error(e);process.exit(1)});
