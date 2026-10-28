import {cp,readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
// Inputs are the extracted, verified Pages artifacts; never rebuild or edit main.
const [main,preview,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!main||!preview||!output)throw Error('Usage: prepare-preview.mjs MAIN PREVIEW OUTPUT');
await mkdir(output,{recursive:true});
await cp(main,output,{recursive:true});
const target=path.join(output,'v2');
await cp(preview,target,{recursive:true});
let html=await readFile(path.join(target,'index.html'),'utf8');
for(const key of ['foxPieLanguage','foxPieSavedGameV1','foxPieUpdateStateV1'])html=html.replaceAll(key,'previewV2_'+key);
await writeFile(path.join(target,'index.html'),html);
const worker=await readFile(path.join(target,'sw.js'),'utf8');
if(!worker.includes("'fox-pie-pwa-'"))throw Error('Expected cache prefix missing');
await writeFile(path.join(target,'sw.js'),worker.replace("'fox-pie-pwa-'","'fox-pie-preview-v2-'"));
const manifest=JSON.parse(await readFile(path.join(target,'manifest.webmanifest'),'utf8'));
manifest.name='Foxes & Pie — v2 preview';manifest.short_name='Foxes v2';
await writeFile(path.join(target,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared Pages site with unchanged main and isolated /v2/ preview');
