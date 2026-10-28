const assert=require('node:assert/strict'),vm=require('node:vm');const {game}=require('./helpers/game.cjs');
const run=(g,s)=>vm.runInContext(s,g.context);
(async()=>{
for(const [ua,touch,platform] of [['Mozilla Android Firefox/140',5,'firefox'],['Mozilla Android Chrome/140',5,'android'],['Mozilla iPhone',5,'ios'],['Mozilla Macintosh',5,'ios'],['Mozilla Windows',0,'generic']]){
 const g=game({navigator:{userAgent:ua,maxTouchPoints:touch},location:{protocol:'https:'}});assert.equal(run(g,'installPlatform()'),platform);await g.nodes['#installGame'].onclick();assert.equal(g.nodes['#installDialog'].open,true);assert(g.nodes['#installSteps'].textContent);g.nodes['#closeInstall'].onclick();assert.equal(g.nodes['#installDialog'].open,false);
}
let g=game();await g.nodes['#installGame'].onclick();assert.equal(g.nodes['#installSteps'].textContent,run(g,"tr('appLocal')"));
for(const outcome of ['accepted','dismissed','error']){
 g=game({location:{protocol:'https:'}});let calls=0;g.events.beforeinstallprompt({preventDefault(){},async prompt(){calls++;if(outcome==='error')throw Error('denied')},userChoice:Promise.resolve({outcome})});
 await g.nodes['#installGame'].onclick();assert.equal(calls,1);assert.equal(g.nodes['#installDialog'].open,true);assert.equal(run(g,'installBusy'),false);assert.equal(run(g,'pwaInstalled'),false);assert.equal(run(g,'installNoticeKey'),{accepted:'installAccepted',dismissed:'installDismissed',error:'installFailed'}[outcome]);
 g.nodes['#closeInstall'].onclick();await g.nodes['#installGame'].onclick();assert.equal(calls,1,'a native prompt is single-use');assert.equal(g.nodes['#installDialog'].open,true);
 g.events.appinstalled();assert.equal(g.nodes['#installDialog'].open,false);assert.equal(g.nodes['#installGame'].hidden,true);
}
g=game();let release,calls=0;g.events.beforeinstallprompt({preventDefault(){},prompt(){calls++;return new Promise(r=>release=r)},userChoice:Promise.resolve({outcome:'dismissed'})});const first=g.nodes['#installGame'].onclick();await g.nodes['#installGame'].onclick();assert.equal(calls,1);assert.equal(g.nodes['#installGame'].disabled,true);release();await first;assert.equal(g.nodes['#installGame'].disabled,false);
g=game();g.context.matchMedia=q=>({matches:q==='(display-mode: fullscreen)'});g.context.document.fullscreenElement={};assert.equal(run(g,'installedMode()'),false);g.context.document.fullscreenElement=null;assert.equal(run(g,'installedMode()'),true);
console.log('PASS: platform instructions, local file, native acceptance/cancellation/error, single-use prompt, duplicate clicks, installed state and browser fullscreen');
})().catch(e=>{console.error(e);process.exitCode=1});
