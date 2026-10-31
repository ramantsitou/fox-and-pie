const assert=require('node:assert/strict'),vm=require('node:vm');const {game}=require('./helpers/game.cjs');const g=game(),run=s=>vm.runInContext(s,g.context);
for(const [m,d,expected] of [[9,23,false],[9,24,true],[9,31,true],[10,1,true],[10,14,true],[10,15,false],[0,1,false]])assert.equal(run(`halloweenAvailable(new Date(2026,${m},${d}))`),expected);
run('globalThis.realSeason=halloweenAvailable;halloweenAvailable=()=>true;level=50;loadMaze();globalThis.castlePath=JSON.stringify(path);globalThis.oldRoster=JSON.stringify(waveRoster());turnReady=true;$("#start").onclick();spawned=total;foxes=[];update(0)');
assert.equal(run('over'),true);assert.equal(g.nodes['#halloweenEnter'].hidden,false);
run('globalThis.oldMoney=money;$("#halloweenEnter").onclick()');assert.equal(run('level'),51);assert.equal(run('JSON.stringify(path)'),run('castlePath'));assert.equal(run('JSON.stringify(waveRoster())'),run('oldRoster'));assert.equal(run('enemyHealth(51,true)'),525);assert.equal(run('money'),run('oldMoney+45'));
run('turnReady=true;$("#start").onclick();spawned=total-1;spawnEnemy();globalThis.vampire=foxes[0];vampire.p=(path.length-1)*.81;update(0)');assert.equal(run('vampire.boss'),true);assert.equal(run('summoned'),22);assert.equal(run('foxes.filter(f=>f.wolf).length'),7);
run('vampire.hp=0;update(0)');assert.equal(run('over'),false);run('foxes.forEach(f=>f.hp=0);update(0)');assert.equal(run('over'),true);assert.equal(g.nodes['#victoryDialog'].open,true);assert.equal(g.nodes['#halloweenEnter'].hidden,true);
run('globalThis.saved=gameSnapshot();reset()');assert.equal(run('restoreGameState(saved)'),true);assert.equal(run('level'),51);run('halloweenAvailable=()=>false;restoreGameState(saved)');assert.equal(run('level'),50);assert.equal(run('over'),true);run('ui();$("#halloweenEnter").onclick()');assert.equal(run('level'),50);
console.log('PASS: Halloween date boundaries, 50→51 entry, identical maze/roster/balance, vampire summons, victory and seasonal save restore');

// Saved victories from before the bonus existed must unlock without replay.
run('halloweenAvailable=()=>true;reset();level=50;money=1234;pie=6;over=true;globalThis.oldVictory=JSON.parse(JSON.stringify(gameSnapshot()));reset()');
assert.equal(run('restoreGameState(oldVictory)'),true);run('ui()');assert.equal(g.nodes['#halloweenEnter'].hidden,false);run('$("#halloweenEnter").onclick()');assert.equal(run('level'),51);assert.equal(run('money'),1279);assert.equal(run('pie'),6);
run('halloweenAvailable=()=>false;restoreGameState(oldVictory);ui();$("#halloweenEnter").onclick()');assert.equal(run('level'),50);assert.equal(g.nodes['#halloweenEnter'].hidden,true);
console.log('PASS: pre-existing level-50 victory unlocks the bonus in season and preserves pie/coins');
