const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),out=root+'/artifacts/keyboard';fs.mkdirSync(out,{recursive:true});const {createStaticHandler}=require('./helpers/static-server.cjs');
(async()=>{const server=http.createServer(createStaticHandler(root+'/dist')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
try{for(const engine of ['chromium','firefox']){const browser=await pw[engine].launch();try{for(const lang of ['ru','en','nl'])for(const [width,height] of [[568,320],[844,390],[320,568]]){
const context=await browser.newContext({viewport:{width,height},screen:{width,height},hasTouch:true,locale:lang,userAgent:'Mozilla/5.0 (Android 14; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0'});const page=await context.newPage();page.on('pageerror',e=>{throw e});
await page.addInitScript(({width,height})=>{window.testViewport=Object.assign(new EventTarget(),{width,height,scale:1,offsetLeft:0,offsetTop:0});Object.defineProperty(window,'visualViewport',{value:window.testViewport});window.testOrientation=height>width?'portrait-primary':'landscape-primary';Object.defineProperty(screen.orientation,'type',{get:()=>window.testOrientation});},{width,height});
await page.goto('http://127.0.0.1:'+server.address().port);assert.equal(await page.evaluate(()=>document.activeElement.id),'playersTitle','no unsolicited keyboard at startup');
for(let i=0;i<3;i++)await page.click('#addPlayer');await page.locator('#playerName3').blur();await page.evaluate(()=>updateDeviceLayout());
const originalRotation=height>width;
await page.fill('#playerName0','Ян');
const visible=height>width?280:160;
async function resizeKeyboard(h){await page.evaluate(h=>{testViewport.height=h;testViewport.dispatchEvent(new Event('resize'))},h);await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>manualLandscape),originalRotation,'keyboard never changes orientation');}
for(const h of [height-90,visible+20,visible,visible+12,visible])await resizeKeyboard(h);
assert.equal(await page.locator('#playersDialog').getAttribute('data-editing'),'true');assert.equal(await page.locator('.setup-actions').isVisible(),false);
async function visibleInput(i){await page.waitForTimeout(60);assert.equal(await page.locator('#playerName'+i).evaluate(e=>{const r=e.getBoundingClientRect(),v=testViewport;return r.left>=v.offsetLeft&&r.top>=v.offsetTop&&r.right<=v.offsetLeft+v.width+1&&r.bottom<=v.offsetTop+v.height+1}),true,'whole active field stays above keyboard');}
await visibleInput(0);
if(engine==='chromium'&&lang==='ru'&&width===568){await page.evaluate(()=>{const marker=document.createElement('div');marker.id='keyboardMock';marker.setAttribute('popover','manual');marker.textContent='Место экранной клавиатуры — эмуляция';Object.assign(marker.style,{position:'fixed',inset:'160px 0 0',margin:'0',width:'100%',height:'160px',border:'0',display:'grid',placeItems:'center',background:'#34373b',color:'#fff',font:'14px sans-serif',pointerEvents:'none'});document.body.append(marker);marker.showPopover();});await page.screenshot({path:out+'/01-name-one.png'});}
for(let i=1;i<4;i++){if(i===1)await page.keyboard.press('Enter');else await page.click('#nameEditNext');assert.equal(await page.evaluate(()=>document.activeElement.id),'playerName'+i);await page.keyboard.type(['','Мартин','Аня','Макс'][i]);await visibleInput(i);}
assert.equal(await page.locator('#playerName3').getAttribute('enterkeyhint'),'done');
if(engine==='chromium'&&lang==='ru'&&width===568)await page.screenshot({path:out+'/02-name-four.png'});
await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>needsPlayerSetup),true,'Done must not start a new game');
await resizeKeyboard(height);assert.equal(await page.locator('#playersDialog').getAttribute('data-editing'),'false');assert.equal(await page.locator('.setup-actions').isVisible(),true);
await page.evaluate(()=>document.querySelector('#keyboardMock')?.remove());
const names=await page.locator('.player-name').evaluateAll(es=>es.map(e=>e.value));assert.deepEqual(names,['Ян','Мартин','Аня','Макс']);
if(engine==='chromium'&&lang==='ru'&&width===568)await page.screenshot({path:out+'/03-keyboard-closed.png'});
// Firefox can resize the layout viewport as well as the visual viewport.
await page.focus('#playerName0');await resizeKeyboard(visible);await page.setViewportSize({width,height:visible});await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>manualLandscape),originalRotation);await visibleInput(0);
await page.setViewportSize({width,height});await resizeKeyboard(height);
// Reopen keyboard on the same field; actual screen rotation is still honoured.
await page.focus('#playerName1');await resizeKeyboard(visible);await page.evaluate(()=>{testOrientation=testOrientation.startsWith('portrait')?'landscape-primary':'portrait-primary';testViewport.width=testOrientation.startsWith('portrait')?320:568;testViewport.height=160;testViewport.dispatchEvent(new Event('resize'));});assert.equal(await page.evaluate(()=>manualLandscape),!originalRotation);
await context.close();
}}finally{await browser.close();}}}finally{server.close();}console.log('PASS: keyboard height animation, four-name Next/Done, fully visible fields, draft preservation, reopening and actual orientation changes in Chromium/Firefox, 3 languages, 3 sizes');})().catch(e=>{console.error(e);process.exit(1)});
