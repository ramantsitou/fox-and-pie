const assert=require('node:assert/strict'),vm=require('node:vm');
const {game}=require('./helpers/game.cjs');
const run=(c,s)=>vm.runInContext(s,c);
function storage(){const map=new Map();return {map,getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
let store=storage(),g=game({localStorage:store}),c=g.context,n=g.nodes;
run(c,"level=7;playerIndex=1;pie=6;money=222;bossRetryCount=2;speed=5;traps=[{x:2,y:2,type:0,tier:1,uses:40,invested:81,broken:false,cd:1}];lastResult={kind:'retry',level:7,loss:1,pie:6};loadMaze();ui()");
let saved=JSON.parse(store.map.get('foxPieSavedGameV1'));assert.equal(saved.level,7);assert.equal(saved.traps[0].uses,40);
g=game({localStorage:store});c=g.context;n=g.nodes;assert.equal(run(c,'level'),7);assert.equal(run(c,'money'),222);assert.equal(run(c,'pie'),6);assert.equal(run(c,'resumePending'),true);assert.equal(run(c,'turnReady'),false);assert.equal(run(c,'playerIndex'),1);assert.equal(n['#ready'].textContent,'Continue game');
n['#ready'].onclick();assert.equal(run(c,'resumePending'),false);n['#start'].onclick();assert.equal(run(c,'running'),true);saved=JSON.parse(store.map.get('foxPieSavedGameV1'));assert.equal(saved.replayWave,true);
run(c,'money=999;traps[0].uses=1;ui()');g=game({localStorage:store});c=g.context;n=g.nodes;assert.equal(run(c,'money'),222,'reload during wave restores checkpoint, not wave earnings');assert.equal(run(c,'traps[0].uses'),40);assert.equal(run(c,'resumeWave'),true);assert.equal(JSON.parse(store.map.get('foxPieSavedGameV1')).replayWave,true,'reloading continue screen preserves wave-replay explanation');
n['#ready'].onclick();n['#start'].onclick();run(c,'update(.3)');let p=run(c,'foxes[0].p'),time=run(c,'visualTime');n['#start'].onclick();assert.equal(run(c,'isPaused()'),true);run(c,'update(2)');assert.equal(run(c,'foxes[0].p'),p);assert.equal(run(c,'visualTime'),time);n['#resumeBattle'].onclick();assert.equal(run(c,'isPaused()'),false);
n['#settings'].open=true;n['#settings'].ontoggle();run(c,'update(1)');assert.equal(run(c,'foxes[0].p'),p,'opening menu freezes battle');n['#settings'].open=false;n['#settings'].ontoggle();run(c,'update(.1)');assert(run(c,'foxes[0].p')>p);
g.events.blur();assert.equal(run(c,'isPaused()'),true);g.events['doc:visibilitychange']();assert.equal(run(c,'isPaused()'),true);n['#resumeBattle'].onclick();
n['#restart'].onclick();assert.equal(n['#restartDialog'].open,true);assert.equal(run(c,'level'),7);assert.equal(run(c,'isPaused()'),true);n['#cancelRestart'].onclick();assert.equal(run(c,'level'),7);assert.equal(run(c,'running'),true);assert.equal(run(c,'isPaused()'),true);assert.equal(n['#settings'].open,true);n['#resumeBattle'].onclick();assert.equal(run(c,'isPaused()'),false);
n['#restart'].onclick();n['#confirmRestart'].onclick();assert.equal(run(c,'level'),1);assert.equal(run(c,'pie'),10);assert.equal(run(c,'speed'),1);assert.equal(run(c,'traps.length'),0);assert.equal(JSON.parse(store.map.get('foxPieSavedGameV1')).level,1);
run(c,"money=0;turnReady=true;ui()");assert.equal(run(c,'canPlace({x:2,y:2},0,false)'),false);assert.equal(run(c,'canPlace({x:2,y:2},0,false,false)'),true,'placement guidance uses valid geometry despite unaffordable card');assert.equal(run(c,'canPlace(path[0],0,false,false)'),false,'entry is reserved');assert.equal(run(c,'canPlace({x:2,y:1},3,false,false)'),true,'rocks go on path');assert.equal(run(c,'canPlace({x:2,y:2},3,false,false)'),false);
for(const lang of ['ru','en','nl']){run(c,`language='${lang}';level=5;money=1000;traps=[{x:2,y:2,type:0,tier:0,uses:30,invested:45}];selectedTrap=traps[0];ui()`);assert(n['#upgrade'].textContent.includes('2→3'));assert(n['#upgrade']['aria-label'].includes('32'));assert(n['#currentPlayerBadge'].textContent.length>0);assert(run(c,"waveRoster().some(e=>e.kind==='bear')"));run(c,"selectedTrap=null;showPlacementHints=false;seenKinds=[];ui()");assert(n['#prepHint'].textContent.includes('🐻'));}
run(c,"level=10;loadMaze();money=123;traps=[];turnReady=true;$('#start').onclick();failAttempt({boss:true});ui()");saved=JSON.parse(store.map.get('foxPieSavedGameV1'));assert.equal(saved.pie,7);assert.equal(saved.playerIndex,1);assert.equal(saved.bossRetryCount,1);assert.equal(saved.lastResult.kind,'retry');assert.equal(saved.lastResult.loss,3);assert(n['#turnResult'].textContent.includes('7/10'));assert(n['#turnResult'].textContent.includes('3'));
store.map.set('foxPieSavedGameV1','{broken json');assert.doesNotThrow(()=>game({localStorage:store}));store.map.set('foxPieSavedGameV1',JSON.stringify({...saved,level:99}));assert.equal(run(game({localStorage:store}).context,'level'),1);
g=game({localStorage:{getItem(){return null},setItem(){throw Error('blocked')}}});assert.equal(run(g.context,'saveAvailable'),false);assert.equal(g.nodes['#saveWarning'].hidden,false);assert.doesNotThrow(()=>g.nodes['#ready'].onclick());
// Malformed optional metadata must not destroy an otherwise valid saved game.
const valid={version:1,level:7,playerIndex:1,money:222,pie:6,traps:[{x:2,y:2,type:0,tier:1,uses:40,invested:81,broken:false}],speed:5};
function restoreFixture(data){const s=storage();s.map.set('foxPieSavedGameV1',JSON.stringify(data));return game({localStorage:s})}
for(const result of [{kind:'retry',level:7,loss:{toString:0},pie:6},{kind:'passed',level:7,refund:{toString:0}},{kind:'retry',level:7,loss:1,pie:99}]){
 const restored=restoreFixture({...valid,lastResult:result});
 assert.equal(run(restored.context,'lastResult'),null);
 assert.equal(run(restored.context,'level'),7);assert.equal(run(restored.context,'money'),222);
 assert.equal(run(restored.context,'traps[0].invested'),81);
 // Exercise the path that formerly crashed during startup on a finished game.
 assert.doesNotThrow(()=>restoreFixture({...valid,pie:0,over:true,lastResult:result}));
}
for(const result of [{kind:'passed',level:6},{kind:'passed',level:10,refund:81},{kind:'retry',level:7,loss:1,pie:6}]){
 assert.deepEqual(JSON.parse(run(restoreFixture({...valid,lastResult:result}).context,'JSON.stringify(lastResult)')),result);
}
const dirty=restoreFixture({...valid,traps:[{...valid.traps[0],kick:{toString:0},aim:{toString:0},extra:'discard',invested:1e100}],over:{},seenKinds:['fox','fox',{}]});
assert.equal(run(dirty.context,'over'),false);
assert.equal(run(dirty.context,'traps[0].invested'),45);
assert.equal(run(dirty.context,"'extra' in traps[0] || 'kick' in traps[0] || 'aim' in traps[0]"),false);
assert.doesNotThrow(()=>run(dirty.context,'draw();ui()'));
console.log('PASS: autosave and continue; wave checkpoint recovery; manual/menu/background pause; safe restart/cancel; legal placement; upgrade previews and new enemies in 3 languages; failed-turn persistence; corrupt and blocked storage; malformed save metadata recovery');
