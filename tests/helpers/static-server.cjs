const fs=require('node:fs'),path=require('node:path');

function createStaticHandler(directory){
 const root=fs.realpathSync(directory);
 const inside=file=>{const relative=path.relative(root,file);return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)};
 return (req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end()}
  let pathname;
  try{pathname=decodeURIComponent(req.url.split('?')[0]);if(pathname.includes('\0')||pathname.includes('\\'))throw Error('Invalid path')}
  catch{res.statusCode=400;return res.end()}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!pathname.startsWith('/')||!inside(file)){res.statusCode=403;return res.end()}
  try{
   // Resolve symlinks too: lexical containment alone is insufficient.
   const real=fs.realpathSync(file);
   if(!inside(real)){res.statusCode=403;return res.end()}
   if(!fs.statSync(real).isFile()){res.statusCode=404;return res.end()}
   const body=fs.readFileSync(real);
   const mime={'.html':'text/html','.js':'application/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
   res.setHeader('Content-Type',mime[path.extname(real)]||'application/octet-stream');
   res.setHeader('X-Content-Type-Options','nosniff');
   res.end(req.method==='HEAD'?undefined:body);
  }catch{res.statusCode=404;res.end()}
 };
}
module.exports={createStaticHandler};
