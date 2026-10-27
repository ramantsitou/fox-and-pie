import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function tarEntry(name,bytes){
 if(Buffer.byteLength(name)>100)throw Error('Archive path too long: '+name);
 const header=Buffer.alloc(512);
 const text=(offset,length,value)=>header.write(value,offset,Math.min(length,Buffer.byteLength(value)),'utf8');
 const octal=(offset,length,value)=>text(offset,length,value.toString(8).padStart(length-1,'0')+'\0');
 text(0,100,name);octal(100,8,0o644);octal(108,8,0);octal(116,8,0);octal(124,12,bytes.length);octal(136,12,0);header.fill(32,148,156);header[156]=48;text(257,6,'ustar\0');text(263,2,'00');
 const checksum=header.reduce((sum,n)=>sum+n,0);text(148,8,checksum.toString(8).padStart(6,'0')+'\0 ');
 return [header,bytes,Buffer.alloc((512-bytes.length%512)%512)];
}
async function listFiles(directory){const result=[];for(const item of await readdir(path.join(root,directory),{withFileTypes:true})){const name=directory+'/'+item.name;if(item.isDirectory())result.push(...await listFiles(name));else if(item.isFile())result.push(name);else throw Error('Unsupported archive entry: '+name);}return result.sort();}
try{
 const config=JSON.parse(await readFile(path.join(root,'.openai/hosting.json'),'utf8'));
 if(config.project_id!=='appgprj_6addcc0e1ee0819194ad8dd701045c48'||config.static?.directory!=='dist')throw Error('Hosting manifest does not match the existing Site');
 await readFile(path.join(root,'dist/index.html'));await readFile(path.join(root,'dist/sw.js'));
 const parts=[];for(const name of ['.openai/hosting.json',...await listFiles('dist')])parts.push(...tarEntry(name,await readFile(path.join(root,name))));parts.push(Buffer.alloc(1024));
 const archive=gzipSync(Buffer.concat(parts),{level:9});await mkdir(path.join(root,'artifacts'),{recursive:true});
 const target=path.join(root,'artifacts/fox-and-pie-sites.tar.gz');await writeFile(target,archive);
 console.log(JSON.stringify({archive:target,sha256:createHash('sha256').update(archive).digest('hex'),projectId:config.project_id}));
}catch(error){console.error(error.message);process.exitCode=1;}
