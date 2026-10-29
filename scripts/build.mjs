import {readFile,writeFile,mkdir,cp,rm,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fail=message=>{throw new Error(message)};
const localPath=(root,relative)=>{
  if(typeof relative!=='string'||relative.includes('\\')||relative.includes('?')||relative.includes('#'))fail('Expected a local asset path');
  const resolved=path.resolve(root,relative);
  if(!resolved.startsWith(root+path.sep))fail('Asset must stay inside the project');
  return resolved;
};
export async function buildProject(root=projectRoot){
  root=path.resolve(root);
  const html=await readFile(path.join(root,'index.html'),'utf8');
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  if(scripts.length!==1)fail('Expected exactly one inline game script');
  new Script(scripts[0][1],{filename:'index.html'});
  const worker=await readFile(path.join(root,'sw.js'),'utf8');
  new Script(worker,{filename:'sw.js'});
  const manifest=JSON.parse(await readFile(path.join(root,'manifest.webmanifest'),'utf8'));
  if(manifest.scope!=='./'||manifest.start_url!=='./index.html')fail('PWA scope/start URL must support subfolder hosting');
  if(manifest.display!=='fullscreen'||manifest.orientation!=='landscape')fail('Expected fullscreen landscape PWA');
  const files=new Set(['index.html','manifest.webmanifest','icons/apple-touch-icon.png','assets/woodland-atlas.png','assets/friends.jpg','assets/friends-portrait.jpg']);
  for(const icon of manifest.icons??[]){
    if(icon.type!=='image/png')fail('Expected PNG app icons');
    const bytes=await readFile(localPath(root,icon.src));
    if(bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')fail('Invalid PNG: '+icon.src);
    const dimensions=bytes.readUInt32BE(16)+'x'+bytes.readUInt32BE(20);
    if(dimensions!==icon.sizes)fail('Wrong icon dimensions: '+icon.src);
    files.add(icon.src);
  }
  if(!(manifest.icons??[]).some(i=>i.sizes==='192x192')||!(manifest.icons??[]).some(i=>i.sizes==='512x512'))fail('Both 192px and 512px app icons are required');
  const atlas=await readFile(localPath(root,'assets/woodland-atlas.png'));
  if(atlas.length<24||atlas.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||atlas.readUInt32BE(16)!==atlas.readUInt32BE(20))fail('Expected square PNG sprite atlas');
  const digest=createHash('sha256');
  for(const file of [...files].sort()){digest.update(file+'\0');digest.update(await readFile(localPath(root,file)));digest.update('\0');}
  // Worker source also invalidates offline caches when caching behaviour changes.
  digest.update(worker);
  const version=digest.digest('hex').slice(0,20);
  const pattern=/const CACHE = CACHE_PREFIX \+ '[^']+';/g;
  if([...worker.matchAll(pattern)].length!==1)fail('Missing unique service-worker cache version marker');
  const builtWorker=worker.replace(pattern,`const CACHE = CACHE_PREFIX + '${version}';`);
  const output=path.join(root,'dist'),stage=path.join(root,'.dist-stage-'+process.pid);
  await rm(stage,{recursive:true,force:true});
  try{
    await mkdir(stage,{recursive:true});
    for(const file of files){const target=localPath(stage,file);await mkdir(path.dirname(target),{recursive:true});await cp(localPath(root,file),target);}
    await writeFile(path.join(stage,'sw.js'),builtWorker);
    await rm(output,{recursive:true,force:true});await rename(stage,output);
  }finally{await rm(stage,{recursive:true,force:true});}
  return {output,cacheVersion:version,fileCount:files.size+1};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(await buildProject()));}catch(error){console.error(error.message);process.exitCode=1;}
}
