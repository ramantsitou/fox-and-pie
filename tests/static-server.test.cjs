const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createStaticHandler}=require('./helpers/static-server.cjs');
test('static server confines requests to dist and survives malformed URLs',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'fox-server-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const dist=path.join(root,'dist');fs.mkdirSync(dist);
 fs.writeFileSync(path.join(dist,'index.html'),'game');
 fs.writeFileSync(path.join(root,'private.txt'),'not public');
 fs.mkdirSync(path.join(root,'dist-other'));fs.writeFileSync(path.join(root,'dist-other','file'),'not public');
 fs.symlinkSync(path.join(root,'private.txt'),path.join(dist,'link'));
 const handler=createStaticHandler(dist);
 function request(url,method='GET'){
  const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body?.toString()}};
  assert.doesNotThrow(()=>handler({url,method},response));return response;
 }
 for(const url of ['/../private.txt','/%2e%2e/private.txt','/..%2fprivate.txt','/../dist-other/file','/link'])assert.equal(request(url).statusCode,403,url);
 for(const url of ['/%ZZ','/%00','/%5c..%5cprivate.txt'])assert.equal(request(url).statusCode,400,url);
 assert.equal(request('/missing').statusCode,404);
 assert.equal(request('/','POST').statusCode,405);
 assert.equal(request('/','HEAD').body,undefined);
 assert.equal(request('/?cache=1').body,'game');
 assert.equal(request('/index.html').headers['Content-Type'],'text/html');
});
