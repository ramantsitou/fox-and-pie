import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildProject} from '../scripts/build.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function fixture(t){const root=await mkdtemp(path.join(tmpdir(),'fox-build-'));t.after(()=>rm(root,{recursive:true,force:true}));for(const file of ['index.html','sw.js','manifest.webmanifest','icons'])await cp(path.join(source,file),path.join(root,file),{recursive:true});return root;}
test('build packages all PWA resources and has a content-based cache version',async t=>{
 const root=await fixture(t),first=await buildProject(root),second=await buildProject(root);
 assert.equal(first.cacheVersion,second.cacheVersion);
 assert.match(await readFile(path.join(root,'dist/sw.js'),'utf8'),new RegExp(first.cacheVersion));
 const manifest=JSON.parse(await readFile(path.join(root,'dist/manifest.webmanifest'),'utf8'));
 for(const icon of manifest.icons)assert((await readFile(path.join(root,'dist',icon.src))).length>0);
 const html=await readFile(path.join(root,'index.html'),'utf8');await writeFile(path.join(root,'index.html'),html+'\n<!-- changed app -->');
 const changed=await buildProject(root);assert.notEqual(changed.cacheVersion,first.cacheVersion);
});
test('invalid JavaScript cannot replace a previously valid build',async t=>{
 const root=await fixture(t);await buildProject(root);const before=await readFile(path.join(root,'dist/index.html'),'utf8');
 await writeFile(path.join(root,'index.html'),before.replace("'use strict';","'use strict'; const = ;"));
 await assert.rejects(buildProject(root));assert.equal(await readFile(path.join(root,'dist/index.html'),'utf8'),before);
});
test('invalid manifest icon paths and dimensions fail the build',async t=>{
 const root=await fixture(t),file=path.join(root,'manifest.webmanifest'),manifest=JSON.parse(await readFile(file,'utf8'));
 manifest.icons[0].src='../outside.png';await writeFile(file,JSON.stringify(manifest));await assert.rejects(buildProject(root),/inside the project/);
 manifest.icons[0].src='icons/icon-192.png';manifest.icons[0].sizes='512x512';await writeFile(file,JSON.stringify(manifest));await assert.rejects(buildProject(root),/dimensions/);
});
