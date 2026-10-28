import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('preview preserves main bytes and isolates browser storage and caches',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'fox-preview-'));
 try{
  const main=path.join(root,'main'),preview=path.join(root,'preview'),output=path.join(root,'site');
  await mkdir(main);await mkdir(preview);
  const original=Buffer.from('unchanged published main\n');
  await writeFile(path.join(main,'index.html'),original);
  await writeFile(path.join(main,'sw.js'),'original main worker');
  await writeFile(path.join(preview,'index.html'),'foxPieLanguage foxPieSavedGameV1 foxPieUpdateStateV1');
  await writeFile(path.join(preview,'sw.js'),"const CACHE_PREFIX = 'fox-pie-pwa-';");
  await writeFile(path.join(preview,'manifest.webmanifest'),JSON.stringify({scope:'./',start_url:'./index.html'}));
  execFileSync(process.execPath,['scripts/prepare-preview.mjs',main,preview,output]);
  assert.deepEqual(await readFile(path.join(output,'index.html')),original);
  assert.equal(await readFile(path.join(output,'sw.js'),'utf8'),'original main worker');
  assert.equal(await readFile(path.join(output,'v2/index.html'),'utf8'),'previewV2_foxPieLanguage previewV2_foxPieSavedGameV1 previewV2_foxPieUpdateStateV1');
  assert.match(await readFile(path.join(output,'v2/sw.js'),'utf8'),/fox-pie-preview-v2-/);
  const manifest=JSON.parse(await readFile(path.join(output,'v2/manifest.webmanifest'),'utf8'));
  assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./index.html');
 }finally{await rm(root,{recursive:true,force:true})}
});
