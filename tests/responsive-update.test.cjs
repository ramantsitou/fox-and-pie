const assert=require('node:assert/strict'),vm=require('node:vm');
const {game}=require('./helpers/game.cjs');
(async()=>{
const {context:c,nodes}=game({devicePixelRatio:2});
vm.runInContext('phoneMode=true',c);
const holder=c.document.querySelector('.board-holder'),field=c.document.querySelector('.field'),canvas=c.document.querySelector('#game');
for(const [w,h] of [[830,300],[620,260],[440,350],[340,220]]){
 holder.clientWidth=w;holder.clientHeight=h;vm.runInContext('fitBoard()',c);
 const scale=Math.min(w/840,h/600),fw=840*scale,fh=600*scale;assert.equal(field.style.width,fw+'px');assert.equal(field.style.height,fh+'px');assert.equal(canvas.width,Math.round(fw*2));assert.equal(canvas.height,Math.round(fh*2));assert(Math.abs(fw/fh-1.4)<1e-10);assert(fw<=w+1e-8&&fh<=h+1e-8);
 canvas.getBoundingClientRect=()=>({left:10,top:20,width:w,height:h});
 c.pointer={clientX:10+w*3.5/14,clientY:20+h*4.5/10};let cell=vm.runInContext('cell(pointer)',c);assert.equal(cell.x,3);assert.equal(cell.y,4);vm.runInContext('draw()',c);
}
vm.runInContext('manualLandscape=true',c);canvas.getBoundingClientRect=()=>({left:10,top:20,width:300,height:830});c.pointer={clientX:10+300*(1-4.5/10),clientY:20+830*3.5/14};let cell=vm.runInContext('cell(pointer)',c);assert.equal(cell.x,3);assert.equal(cell.y,4);
// Changing workshop mode reveals its controls; balance changes do not disturb reading.
vm.runInContext('phoneMode=true;selectedTrap=null;pendingPlacement=null;ui()',c);nodes['#workshop'].scrollTop=80;vm.runInContext('money+=2;ui()',c);assert.equal(nodes['#workshop'].scrollTop,80);vm.runInContext('pendingPlacement={x:2,y:2,type:0};ui()',c);assert.equal(nodes['#workshop'].scrollTop,0);vm.runInContext('pendingPlacement=null;ui()',c);
// Compact controls retain full accessible labels, even with large balances and bosses.
for(const lang of ['ru','en','nl']){vm.runInContext(`language='${lang}';phoneMode=true;money=1000;level=10;ui()`,c);assert.equal(nodes['#money'].textContent,'🪙 1000');assert.equal(nodes['#level'].textContent,'10/50 👑');assert.equal(nodes['#speed'].textContent,'×1');assert(nodes['#start']['aria-label'].length>0);assert(nodes['#money']['aria-label'].includes('1000'));vm.runInContext("say('upgraded')",c);assert.equal(nodes['#message'].dataset.kind,'upgraded');}
vm.runInContext("language='ru';level=1;phoneMode=false;ui()",c);assert(nodes['#money'].textContent.includes('Монеты'));assert.equal(nodes['#start'].textContent,'Пустить лис!');
vm.runInContext('phoneMode=false;fitBoard()',c);assert.equal(field.style.height,'');assert.equal(canvas.width,840);assert.equal(canvas.height,600);
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const listeners={},first={},second={};let reloads=0,updates=0,registrationOptions;
c.sessionStorage=storage;c.location={protocol:'https:',reload(){reloads++}};c.isSecureContext=true;
c.navigator.serviceWorker={controller:null,addEventListener:(k,v)=>listeners[k]=v,async register(url,options){registrationOptions=options;return{async update(){updates++}}},ready:Promise.resolve()};
await vm.runInContext('registerOffline()',c);assert.equal(registrationOptions.updateViaCache,'none');
c.navigator.serviceWorker.controller=first;listeners.controllerchange();assert.equal(vm.runInContext('updatePending',c),false,'initial install does not loop-reload');
vm.runInContext("level=13;playerIndex=1;money=321;pie=6;bossRetryCount=2;loadMaze();traps=[{x:2,y:0,type:0,tier:1,uses:35,invested:81,broken:false,cd:0}];turnReady=true;speed=5;running=true",c);
c.navigator.serviceWorker.controller=second;listeners.controllerchange();vm.runInContext('applyPendingUpdate()',c);assert.equal(reloads,0,'running wave is not interrupted');assert.equal(store.size,0);
vm.runInContext('running=false;applyPendingUpdate();applyPendingUpdate()',c);assert.equal(reloads,1,'reload exactly once after the wave');assert.equal(store.size,1);
const fresh=game({sessionStorage:storage});let state=vm.runInContext('({level,playerIndex,money,pie,bossRetryCount,traps,speed,turnReady,running})',fresh.context);
assert.equal(state.level,13);assert.equal(state.playerIndex,1);assert.equal(state.money,321);assert.equal(state.pie,6);assert.equal(state.bossRetryCount,2);assert.equal(state.traps[0].tier,1);assert.equal(state.traps[0].uses,35);assert.equal(state.speed,5);assert.equal(state.turnReady,true);assert.equal(state.running,false);assert.equal(store.size,0,'snapshot consumed');
vm.runInContext('checkAppUpdate()',c);assert.equal(updates,1);
// Storage-denied browsers keep the current game rather than losing progress.
vm.runInContext('updateReloading=false',c);c.sessionStorage={setItem(){throw Error('storage blocked')}};vm.runInContext('applyPendingUpdate()',c);assert.equal(reloads,1);assert.equal(vm.runInContext('pwaStatusKey',c),'appUpdateManual');
console.log('PASS: field fits four viewport sizes proportionally; high-DPI canvas; accurate regular and rotated touches; desktop sizing; update checks; no first-install reload loop; update after wave; progress restored; blocked-storage fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
