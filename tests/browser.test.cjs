const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'artifacts/ux'),{recursive:true});
const {createStaticHandler}=require('./helpers/static-server.cjs');
const server=http.createServer(createStaticHandler(path.join(root,'dist'))).listen(0,'127.0.0.1');
(async()=>{const browser=await chromium.launch({headless:true});const results=[];for(const lang of ['ru','en','nl'])for(const [w,h] of [[568,320],[740,360],[844,390],[915,412],[390,844],[1280,800]]){const mobile=w!==1280;const context=await browser.newContext({viewport:{width:w,height:h},screen:{width:w,height:h},isMobile:mobile,hasTouch:mobile,locale:lang});const page=await context.newPage();page.on('pageerror',e=>{throw e});await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>atlasReady);await page.click('#addPlayer');await page.fill('#playerName0','Jan');await page.fill('#playerName1','Martin');await page.click('#createPlayers');if(w===390)assert.equal(await page.evaluate(()=>manualLandscape),true);await page.evaluate(()=>{startPhoneFullscreen=()=>{};});await page.click('#ready');await page.waitForTimeout(100);for(let world=0;world<5;world++){await page.evaluate(world=>{level=world*10+1;loadMaze();ui();draw()},world);assert.equal(await page.evaluate(()=>{const r=canvas.getBoundingClientRect();return ['#prepHint','#message','.board-status'].some(id=>{const e=document.querySelector(id),b=e.getBoundingClientRect();return b.width>0&&b.height>0&&Math.min(r.right,b.right)>Math.max(r.left,b.left)&&Math.min(r.bottom,b.bottom)>Math.max(r.top,b.top)})}),false);await page.screenshot({path:`${root}/artifacts/ux/${lang}-${w}x${h}-world${world}.png`});}if(w===1280)await illustratedCombat(page,lang);await interactions(page,w===390);results.push(await page.evaluate(()=>{const r=canvas.getBoundingClientRect();return {lang:language,w:innerWidth,h:innerHeight,phone:phoneMode,rotated:manualLandscape,canvas:{w:r.width,h:r.height},overflow:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.card-compact b')].map(e=>({text:e.textContent,overflow:e.scrollWidth>e.clientWidth}))}}));await context.close();}fs.writeFileSync(root+'/artifacts/ux/layout.json',JSON.stringify(results,null,2));for(const r of results){assert.equal(r.overflow,false);assert.ok(r.cards.every(c=>!c.overflow),JSON.stringify(r));const ratio=r.rotated?r.canvas.h/r.canvas.w:r.canvas.w/r.canvas.h;assert.ok(Math.abs(ratio-1.4)<.002);assert.equal(r.phone,r.w!==1280);}await offline(browser);await browser.close();server.close();console.log('PASS: 90 screenshots, 18 viewport/language interaction flows, offline PWA and atlas');})().catch(e=>{console.error(e);process.exit(1)});

async function clickCell(page,p){const point=await page.evaluate(p=>{const r=canvas.getBoundingClientRect();return manualLandscape?{x:r.right-(p.y+.5)*r.width/10,y:r.top+(p.x+.5)*r.height/14}:{x:r.left+(p.x+.5)*r.width/14,y:r.top+(p.y+.5)*r.height/10}},p);await page.mouse.click(point.x,point.y);}
async function interactions(page,rotated){
 await page.evaluate(()=>{reset();turnReady=true;money=1000;ui()});
 for(let type=0;type<4;type++){
  await page.locator('.card').nth(type).click();
  const p=await page.evaluate(type=>{for(let y=0;y<10;y++)for(let x=0;x<14;x++)if(canPlace({x,y},type,false))return{x,y};},type);
  await clickCell(page,p);
  if(await page.evaluate(()=>phoneMode)){
   assert.equal(await page.evaluate(()=>traps.length),0);await page.locator('#cancelPlace').click();assert.equal(await page.evaluate(()=>pendingPlacement),null);
   await clickCell(page,p);await page.screenshot({path:path.join(root,`artifacts/ux/${await page.evaluate(()=>language)}-${await page.evaluate(()=>innerWidth)}-placement.png`)});await page.locator('#confirmPlace').click();
  }
  assert.equal(await page.evaluate(()=>traps.length),1);await clickCell(page,p);
  await page.locator('#upgrade').click();assert.equal(await page.evaluate(()=>traps[0].tier),1);
  await page.evaluate(()=>{traps[0].broken=true;traps[0].uses=0;ui()});
  await page.locator('#repair').click();assert.equal(await page.evaluate(()=>traps[0].broken),false);
  await page.locator('#sell').click();assert.equal(await page.evaluate(()=>traps.length),0);
 }
 await page.locator('#start').click();await page.waitForTimeout(250);const initialPosition=await page.evaluate(()=>foxes[0].p);await page.waitForTimeout(120);assert.ok(await page.evaluate(p=>foxes[0].p>p,initialPosition));await page.screenshot({path:path.join(root,`artifacts/ux/${await page.evaluate(()=>language)}-${await page.evaluate(()=>innerWidth)}-battle.png`)});assert.equal(await page.evaluate(()=>running),true);
 await page.locator('#menuToggle').click();const before=await page.evaluate(()=>foxes.map(f=>f.p));await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>foxes.map(f=>f.p)),before);
 await page.locator('#restart').click();assert.equal(await page.locator('#restartDialog').evaluate(e=>e.open),true);await page.screenshot({path:path.join(root,`artifacts/ux/${await page.evaluate(()=>language)}-${await page.evaluate(()=>innerWidth)}-restart.png`)});await page.locator('#cancelRestart').click();
 // Canceling a restart must leave a running battle paused until explicitly resumed.
 assert.equal(await page.evaluate(()=>isPaused()),true);
 await page.locator('#resumeBattle').click();assert.equal(await page.evaluate(()=>isPaused()),false);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>isPaused()),true);await page.locator('#resumeBattle').click();
 await page.reload();await page.waitForFunction(()=>atlasReady);await page.evaluate(()=>{startPhoneFullscreen=()=>{}});
 assert.equal(await page.evaluate(()=>resumePending&&resumeWave),true);await page.locator('#ready').click();await page.locator('#start').click();
 await page.evaluate(()=>failAttempt({boss:false}));assert.deepEqual(await page.evaluate(()=>[playerIndex,level,pie]),[1,1,9]);
 await page.screenshot({path:path.join(root,`artifacts/ux/${await page.evaluate(()=>language)}-${await page.evaluate(()=>innerWidth)}-handoff.png`)});
 await page.locator('#ready').click();await page.locator('#menuToggle').click();await page.screenshot({path:path.join(root,`artifacts/ux/${await page.evaluate(()=>language)}-${await page.evaluate(()=>innerWidth)}-menu.png`)});
 await page.locator('#restart').click();await page.locator('#confirmRestart').click();assert.equal(await page.evaluate(()=>pie),9);assert.equal(await page.locator('#playersDialog').evaluate(e=>e.open),true);await page.click('#addPlayer');await page.click('#createPlayers');assert.deepEqual(await page.evaluate(()=>[level,pie,playerIndex,turnReady]),[1,10,0,false]);
}
async function offline(browser){const context=await browser.newContext();const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});await context.setOffline(true);await page.reload();await page.waitForFunction(()=>atlasReady);assert.equal(await page.evaluate(()=>artAtlas.naturalWidth),fs.readFileSync(path.join(root,'assets/woodland-atlas.png')).readUInt32BE(16));await page.screenshot({path:path.join(root,'artifacts/ux/offline.png')});await context.close();}

// Arrange deterministic render fixtures to inspect every animal facing both ways,
// plus trap tiers, breakage, nets and attack effects in each environment.
async function illustratedCombat(page,lang){for(let world=0;world<5;world++){
 await page.evaluate(world=>{level=world*10+5;loadMaze();running=false;showPlacementHints=false;foxes=[];traps=[];effects=[];
 const directions=[path.findIndex((p,i)=>i<path.length-1&&path[i+1].x>p.x),path.findIndex((p,i)=>i<path.length-1&&path[i+1].x<p.x)];
 for(const start of directions)for(let kind=0;kind<4;kind++)foxes.push({p:start+kind*.9,hp:10,max:15,bear:kind===2,wolf:kind===1,hare:kind===3,boss:kind===0,slow:kind===2?2:0,jump:kind===3?.4:0,block:0,flash:0});
 for(let type=0;type<4;type++){for(let y=0;y<10;y++){let p;for(let x=0;x<14;x++)if(canPlace({x,y},type,false)){p={x,y};break}if(p){traps.push({...p,type,tier:type%3,uses:10,broken:type===3,cd:0});break;}}}
 for(let t of traps)animate('upgrade',t,t,1,{tier:t.tier});ui();draw();},world);
 await page.screenshot({path:path.join(root,`artifacts/ux/${lang}-combat-world${world}.png`)});
}}
