const assert=require('node:assert/strict'),vm=require('node:vm');
const {game}=require('./helpers/game.cjs');
const {context:c,nodes}=game({Math:Object.create(Math)});
const run=s=>vm.runInContext(s,c);
run(`level=45;loadMaze();money=10000;turnReady=true;$('#start').onclick();let renders=0;const realUx=uxUi;uxUi=()=>{renders++;realUx()};simulate(.5)`);
assert.equal(run('renders'),1,'multiple simulation steps render the UI once');
assert.equal(run('spawned'),1,'simulation still runs all steps');
run('manualPaused=true;ui();let draws=0;draw=()=>{renderDirty=false;draws++};frame(1000);frame(1016);frame(1032)');
assert.equal(run('draws'),1,'paused field renders once');
run('canvas.onpointermove({clientX:10,clientY:10});frame(1048)');
assert.equal(run('draws'),2,'pointer changes invalidate the paused field');
nodes['#resumeBattle'].onclick();run('frame(1064);frame(1080)');
assert.equal(run('draws'),4,'resumed combat renders every frame');
run("running=false;traps=[];effects=[{kind:'burst',life:.001}];renderDirty=false;frame(1100);frame(1116)");
assert.equal(run('draws'),5,'last expired effect gets cleared before idle rendering stops');
run(`let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(let n=0;n<200;n++){
 foxes=Array.from({length:30},(_,i)=>({p:Math.floor(Math.random()*(path.length+2)),hp:i%7?5:0,hare:i%3===0,jump:i%4===0?.5:0}));
 for(let type=0;type<4;type++){
  const t={x:Math.floor(Math.random()*W),y:Math.floor(Math.random()*H),type},spec=types[type];
  const expected=foxes.filter(f=>f.hp>0&&f.p<path.length-1&&!(type===3&&f.hare&&f.jump>0)&&Math.hypot(pos(f).x-t.x,pos(f).y-t.y)<=spec.range).sort((a,b)=>b.p-a.p)[0]||null;
  if(trapTarget(t,spec)!==expected)throw Error('Target selection changed');
 }
 traps=Array.from({length:20},(_,i)=>({x:i%W,y:i%H,broken:i%3===0}));const p={x:Math.random()*W,y:Math.random()*H};
 const expected=traps.filter(t=>!t.broken&&Math.hypot(t.x-p.x,t.y-p.y)<3).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;
 if(bossTarget(p)!==expected)throw Error('Boss target selection changed');
}
for(let n=1;n<=50;n++){level=n;loadMaze();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if((pathIndices.get(x+','+y)??-1)!==path.findIndex(p=>p.x===x&&p.y===y))throw Error('Path index changed');}`);
console.log('PASS: batched UI; pause/resume redraw invalidation; equivalent target selection and path indexes');

// Rendering caches are shared across animals, preserve flash/jump variants and stay bounded.
const {context:renderContext}=game({Image:class{constructor(){this.naturalWidth=1024;this.naturalHeight=1024;}}});
const render=s=>vm.runInContext(s,renderContext);
render('atlasReady=true;let imageCalls=0;ctx.drawImage=()=>{imageCalls++};drawWalkingArt(0,56,0,4)');
assert.equal(render('imageCalls'),16*13+1,'a new sheet prepares the complete gait cycle once');
render('imageCalls=0;drawWalkingArt(0,56,1.7,4)');
assert.equal(render('imageCalls'),1,'a different gait phase reuses the same sheet with one draw');
render('drawWalkingArt(0,56,0,4,true);drawWalkingArt(0,56,0,0)');
assert.equal(render('walkingFrames.size'),3,'flash and jumping do not reuse an incompatible frame');
render('walkingFrames.clear();for(let i=0;i<walkingCacheLimit+2;i++)drawWalkingArt(i%4,51+i,i*.17,4)');
assert.equal(render('walkingFrames.size'),render('walkingCacheLimit'),'gait cache evicts old sheets when its memory limit is reached');
assert.equal(render('arrowArt(2)===arrowArt(2)'),true,'trees share the same arrow sprite');
assert.equal(render('arrowArt(1)===arrowArt(2)'),false,'upgrade colors remain distinct');
console.log('PASS: shared gait/arrow sprites, flash/jump variants and bounded cache');
render("ctx.shadowBlur=8;ctx.shadowColor='#ffd65e';drawTrapArt({type:1,tier:2,broken:false},55);imageCalls=0;drawTrapArt({type:1,tier:2,broken:false},55)");
assert.equal(render('imageCalls'),1,'upgraded trees reuse their glowing image');
render("drawTrapArt({type:1,tier:2,broken:true},55)");
assert.equal(render('glowingTraps.size'),2,'broken trees retain a separate grayscale image');
render('for(let i=0;i<100;i++){ctx.shadowBlur=i;drawTrapArt({type:1,tier:2},55)}');
assert.equal(render('glowingTraps.size'),render('glowingTrapLimit'),'tree sprite cache is bounded');
console.log('PASS: shared tree glow, separate broken appearance and bounded memory');
