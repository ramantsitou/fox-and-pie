const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
function game(){const nodes={},cards=[],staticNodes=[],events={};
const paint=new Proxy({}, {get:(o,k)=>o[k]||(k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{})});
function node(){return {dataset:{},style:{setProperty(){}},textContent:'',classList:{toggle(){}},setAttribute(k,v){this[k]=v},append(b){cards.push(b)},getBoundingClientRect(){return {left:0,top:0,width:840,height:600}},getContext(){return paint}};}
for(let m of html.matchAll(/data-i18n="([^"]+)"/g)){let el=node();el.dataset.i18n=m[1];staticNodes.push(el)}
const doc={body:node(),documentElement:node(),addEventListener(k,cb){events['doc:'+k]=cb},querySelector:s=>nodes[s]??=node(),querySelectorAll:s=>s==='.card'?cards:s==='[data-i18n]'?staticNodes:[],createElement:node};
const context={console,Math,URL,setTimeout,document:doc,navigator:{},location:{protocol:'file:'},window:{addEventListener(k,cb){events[k]=cb}},matchMedia:()=>({matches:false}),requestAnimationFrame(){},localStorage:{getItem(){return 'ru'},setItem(){}}};
vm.createContext(context);vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1],context);return {context,nodes,events};}

module.exports={game};
