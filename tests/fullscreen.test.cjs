const assert=require('node:assert/strict'),vm=require('node:vm');
const {game}=require('./helpers/game.cjs');
function phone(c,{installed=false}={}){
 c.innerWidth=844;c.innerHeight=390;c.screen={width:844,height:390,orientation:{async lock(){}}};
 c.matchMedia=query=>({matches:query.includes('any-pointer')||(installed&&query.includes('display-mode'))});
 vm.runInContext('updateDeviceLayout();pwaUi()',c);
}
(async()=>{
 let {context:c,nodes,events}=game();phone(c,{installed:true});
 assert.equal(nodes['#fullscreen'].hidden,false,'installed PWA still offers API fullscreen');
 const calls=[],locks=[];
 c.document.documentElement.requestFullscreen=options=>{calls.push(options);c.document.fullscreenElement=c.document.documentElement;return Promise.resolve()};
 c.screen.orientation.lock=async value=>locks.push(value);
 assert.equal(calls.length,0,'no fullscreen request before a gesture');
 nodes['#ready'].onclick();assert.equal(calls.length,1,'request starts within ready click');assert.equal(calls[0].navigationUI,'hide');
 await vm.runInContext('fullscreenTask',c);assert.equal(locks[0],'landscape');
 // Neither a pending nor an active request causes a duplicate fullscreen prompt.
 vm.runInContext('startPhoneFullscreen()',c);assert.equal(calls.length,1);
 c.document.exitFullscreen=async()=>{c.document.fullscreenElement=null;events['doc:fullscreenchange']()};
 await nodes['#fullscreen'].onclick();vm.runInContext('turnReady=false',c);nodes['#ready'].onclick();assert.equal(calls.length,1,'explicit exit remains respected');
 await nodes['#fullscreen'].onclick();assert.equal(calls.length,2,'manual re-entry remains available');assert.equal(calls[1].navigationUI,'hide');
 // Android Back/Escape also opts out of automatic re-entry.
 c.document.fullscreenElement=null;events['doc:fullscreenchange']();vm.runInContext('autoFullscreenAttempted=false;turnReady=false',c);nodes['#ready'].onclick();assert.equal(calls.length,2,'browser exit is respected');
 ({context:c,nodes}=game());phone(c);c.document.documentElement.requestFullscreen=()=>Promise.reject(Error('denied'));
 nodes['#ready'].onclick();await vm.runInContext('fullscreenTask',c).catch(()=>{});assert.equal(vm.runInContext('turnReady',c),true);assert.notEqual(nodes['#settings']?.open,true,'automatic denial does not interrupt the game');
 // A denied or unsupported request can be retried explicitly later.
 c.document.documentElement.requestFullscreen=options=>{assert.equal(options.navigationUI,'hide');c.document.fullscreenElement=c.document.documentElement;return Promise.resolve()};await nodes['#fullscreen'].onclick();assert(c.document.fullscreenElement);
 ({context:c,nodes}=game());phone(c);nodes['#ready'].onclick();await vm.runInContext('fullscreenTask',c).catch(()=>{});assert.equal(vm.runInContext('fullscreenTask',c),null,'unsupported request clears pending state');
 let legacy=0;c.document.documentElement.webkitRequestFullscreen=function(){legacy++;assert.equal(arguments.length,0);c.document.webkitFullscreenElement=c.document.documentElement};c.screen.orientation.lock=()=>Promise.reject(Error('unsupported orientation lock'));await nodes['#fullscreen'].onclick();assert.equal(legacy,1);assert(c.document.webkitFullscreenElement);
 ({context:c,nodes}=game());let desktopRequests=0;c.document.documentElement.requestFullscreen=()=>{desktopRequests++;return Promise.resolve()};nodes['#ready'].onclick();assert.equal(desktopRequests,0,'desktop does not automatically enter fullscreen');await nodes['#fullscreen'].onclick();assert.equal(desktopRequests,1,'desktop menu still works');
 console.log('PASS: Android navigationUI hide; first ready gesture; installed PWA button; duplicate prevention; user exit; denied request recovery; legacy API; orientation fallback; desktop unchanged');
})().catch(error=>{console.error(error);process.exitCode=1});
