const assert=require('node:assert/strict'),vm=require('node:vm');
const {game}=require('./helpers/game.cjs');
const run=(g,s)=>vm.runInContext(s,g.context);
function storage(){const values=new Map();return {values,getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}}
const store=storage();let g=game({autoCreatePlayers:false,localStorage:store});
assert.equal(g.nodes['#playersDialog'].open,true);
g.nodes['#ready'].onclick();g.nodes['#start'].onclick();assert.equal(run(g,'running'),false);
assert.equal(store.values.has('foxPieSavedGameV1'),false,'no incomplete roster is saved');
for(const names of [[],['A','B','C','D','E'],['x'.repeat(25)],[null],['A\u202eB']])assert.equal(run(g,`createPlayers(${JSON.stringify(names)})`),false);
assert.equal(run(g,'setupCount'),1);
g.nodes['#addPlayer'].onclick();g.nodes['#addPlayer'].onclick();g.nodes['#addPlayer'].onclick();g.nodes['#addPlayer'].onclick();assert.equal(run(g,'setupCount'),4);
g.nodes['#playerName2'].value='Keep me';g.nodes['#removePlayer1'].onclick();assert.equal(g.nodes['#playerName1'].value,'Keep me');assert.equal(run(g,'setupCount'),3);
assert.equal(run(g,"createPlayers(['','  '])"),true);assert.equal(run(g,'players[0]'),run(g,"tr('playerSlot',{n:1})"));assert.equal(run(g,"createPlayers(['Sam','Sam'])"),true);
assert.equal(run(g,"createPlayers([''])"),true);assert.equal(run(g,'turnReady'),true);
for(const n of [1,2,3,4]){
 const names=['Аня','Борис','Chloé','Daan'].slice(0,n);
 assert.equal(run(g,`createPlayers(${JSON.stringify(names)})`),true);
 assert.equal(g.nodes['#playersDialog'].open,false);
 for(let turn=0;turn<n*2;turn++){
  assert.equal(run(g,'currentPlayer()'),names[turn%n]);
  if(turn%2===0)run(g,'pie=10;failAttempt({boss:false})');else run(g,'advanceLevel();ui()');
 }
 assert.equal(run(g,'playerIndex'),0);
}
run(g,"createPlayers(['  Аня  ','Борис','Chloé','Daan']);playerIndex=3;level=7;money=222;pie=6;traps=[{x:2,y:2,type:0,tier:0,uses:30,invested:45,broken:false}];loadMaze();ui()");
const saved=JSON.parse(store.values.get('foxPieSavedGameV1'));assert.equal(saved.version,2);assert.deepEqual(saved.players,['Аня','Борис','Chloé','Daan']);
g=game({autoCreatePlayers:false,localStorage:store});assert.equal(run(g,'needsPlayerSetup'),false);assert.equal(run(g,'currentPlayer()'),'Daan');assert.equal(run(g,'level'),7);assert.equal(run(g,'money'),222);
g.nodes['#ready'].onclick();g.nodes['#start'].onclick();g=game({autoCreatePlayers:false,localStorage:store});assert.equal(run(g,'resumeWave'),true);assert.equal(run(g,'currentPlayer()'),'Daan');
for(const language of ['ru','en','nl']){run(g,`language='${language}';updateLanguage()`);assert.equal(run(g,'currentPlayer()'),'Daan');}
run(g,"createPlayers(['<b>Fox</b>']);$('#ready').onclick()");assert(g.nodes['#message'].textContent.includes('<b>Fox</b>'));
run(g,'pie=1;failAttempt({boss:false})');assert.equal(run(g,'over'),true);assert.equal(run(g,'playerIndex'),0);
// Old saved games retain their progress and gain an explicit two-player roster.
store.values.set('foxPieSavedGameV1',JSON.stringify({...saved,version:1,players:undefined,playerIndex:1}));
g=game({autoCreatePlayers:false,localStorage:store});assert.equal(run(g,'players.length'),2);assert.equal(run(g,'level'),7);assert.equal(run(g,'needsPlayerSetup'),false);
for(const invalid of [{players:['A'],playerIndex:1},{players:[null],playerIndex:0},{players:['A'],playerIndex:-1}]){
 store.values.set('foxPieSavedGameV1',JSON.stringify({...saved,...invalid}));g=game({autoCreatePlayers:false,localStorage:store});assert.equal(run(g,'needsPlayerSetup'),true);assert.equal(g.nodes['#playersDialog'].open,true);
}
g=game({autoCreatePlayers:false,localStorage:{getItem(){return null},setItem(){throw Error('blocked')}}});assert.equal(run(g,"createPlayers(['Solo'])"),true);assert.equal(run(g,'saveAvailable'),false);g.nodes['#ready'].onclick();g.nodes['#start'].onclick();assert.equal(run(g,'running'),true);
console.log('PASS: player setup validation; 1–4 turn cycles; roster persistence; mid-wave reload; language changes; text-only names; legacy saves; invalid saves; blocked storage');
