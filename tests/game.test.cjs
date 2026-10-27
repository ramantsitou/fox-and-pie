const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {game}=require('./helpers/game.cjs');
(async()=>{const {context:c,nodes,events}=game();
vm.runInContext(`function check(v,m){if(!v)throw Error(m)}function enemy(extra={}){return {p:1,hp:100,max:100,boss:false,slow:0,jump:0,jumpTraps:[],magic:4,...extra}}function start(){if(!turnReady)$('#ready').onclick();$('#start').onclick()}
reset();check(currentPlayer()==='Янчик','first player');start();let originalMoney=money;money+=100;failAttempt(enemy());check(level===1&&playerIndex===1&&currentPlayer()==='Мартин'&&pie===9,'failure passes to Martin');check(money===originalMoney,'wave earnings rollback');start();failAttempt(enemy());check(playerIndex===0&&level===1&&pie===8,'failure passes back to Jan');start();spawned=total;foxes=[];update(0);check(level===2&&playerIndex===1,'success passes to next player');start();failAttempt(enemy());check(level===2&&playerIndex===0,'retry independent of level parity');
reset();level=10;loadMaze();total=1;spawned=0;spawnEnemy();check(foxes[0].hp===180,'normal boss');start();let bank=money,b=enemy({boss:true});resolveImpact({target:b,type:0,hit:true,damage:2,a:{x:1,y:0}});check(money===bank+2&&effects.some(e=>e.drop&&e.reward===2),'two coins on living boss');resolveImpact({target:b,type:2,hit:true,a:{x:1,y:0}});check(money===bank+2,'net no coins');resolveImpact({target:b,type:0,hit:false,a:{x:1,y:0}});check(money===bank+2,'miss no coins');failAttempt(b);check(bossRetryCount===1&&pie===7&&money===bank&&playerIndex===1,'boss failure');start();total=1;spawned=0;spawnEnemy();check(Math.abs(foxes[0].hp-162)<1e-8,'boss ten percent weaker');for(let i=0;i<8;i++){pie=10;failAttempt(enemy({boss:true}));}check(bossHealthMultiplier()===.65,'weakening floor');start();spawned=total;foxes=[];update(0);check(level===11&&bossRetryCount===0,'new level resets weakening');reset();bossRetryCount=1;start();failAttempt(enemy());check(bossRetryCount===1,'ordinary escape does not weaken boss');
reset();pie=1;start();let player=playerIndex;failAttempt(enemy());check(over&&pie===0&&playerIndex===player,'no turns after game over');
// Upgrades and country refunds still work.
reset();$('#ready').onclick();money=1000;canvas.onclick({clientX:150,clientY:30});let t=traps[0];$('#upgrade').onclick();$('#upgrade').onclick();check(t.tier===2&&durability(t)===64&&trapDamage(t)===4,'upgrades');t.broken=true;t.uses=0;$('#repair').onclick();check(t.uses===64,'tier repair');level=10;let bank2=money,cost=t.invested;advanceLevel();check(level===11&&money===bank2+45+cost&&traps.length===0,'upgrade refund');
for(let world=0;world<5;world++){level=world*10+1;loadMaze();let seen=new Set();for(let i=0;i<path.length;i++){let p=path[i],k=p.x+','+p.y;check(!seen.has(k),'unique cells');seen.add(k);if(i)check(Math.abs(p.x-path[i-1].x)+Math.abs(p.y-path[i-1].y)===1,'connected maze')}draw();}
for(let lang of ['ru','en','nl']){language=lang;updateLanguage();for(let [key,d] of Object.entries(translations)){check(typeof d[lang]==='string'&&d[lang].length>0,'translation '+key)}}reset();
`,c);
await vm.runInContext('registerOffline()',c);assert.equal(vm.runInContext('pwaStatusKey',c),'appLocal');
c.location={protocol:'https:'};c.isSecureContext=true;let registration;
c.navigator.serviceWorker={async register(url,options){registration={url,options}},ready:Promise.resolve({})};
await vm.runInContext('registerOffline()',c);assert.equal(registration.url,'./sw.js');assert.equal(registration.options.scope,'./');assert.equal(vm.runInContext('pwaStatusKey',c),'appOfflineReady');
c.document.documentElement.requestFullscreen=async()=>{c.document.fullscreenElement=c.document.documentElement};c.document.exitFullscreen=async()=>{c.document.fullscreenElement=null};
await vm.runInContext('enterImmersiveFullscreen()',c);assert(c.document.fullscreenElement);await c.document.exitFullscreen();assert(!c.document.fullscreenElement);
delete c.document.documentElement.requestFullscreen;await assert.rejects(vm.runInContext('enterImmersiveFullscreen()',c));
let prompted=0,prevented=0;events.beforeinstallprompt({preventDefault(){prevented++},async prompt(){prompted++},userChoice:Promise.resolve({outcome:'dismissed'})});await nodes['#installGame'].onclick();assert.equal(prompted,1);assert.equal(prevented,1);events.appinstalled();assert.equal(nodes['#installGame'].hidden,true);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.webmanifest'),'utf8'));assert.equal(manifest.display,'fullscreen');assert.equal(manifest.orientation,'landscape');assert.equal(manifest.scope,'./');for(let icon of manifest.icons)assert(fs.existsSync(path.join(__dirname,'..',icon.src)));
console.log('PASS: turn passing on failures and success; persistent pie; 2 boss coins; retry rollback; boss weakening/floor/reset; upgrades/refunds; maze integrity; 3 languages; PWA registration, install and fullscreen handlers; manifest and icons');
})().catch(e=>{console.error(e);process.exitCode=1});

// Browser language preferences are matched by base language, with English fallback.
for(const [preferences,expected] of [[['nl-NL'],'nl'],[['ru-RU'],'ru'],[['en-US'],'en'],[['de-DE','nl-BE'],'nl'],[['de-DE','fr-FR'],'en'],[[],'en']]){
 const {context}=game({navigator:{languages:preferences},localStorage:{getItem(){return null},setItem(){}}});
 assert.equal(vm.runInContext('language',context),expected);
}
{const {context}=game({navigator:{language:'nl-NL'},localStorage:{getItem(){return 'ru'},setItem(){}}});assert.equal(vm.runInContext('language',context),'ru');}
