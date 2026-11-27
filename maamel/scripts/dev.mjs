import {createServer} from 'node:http';
import {createReadStream,existsSync} from 'node:fs';
import {mkdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Readable} from 'node:stream';
import {localDatabase} from '../backend/local-db.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const built=path.join(root,'dist/server/index.js');
if(!existsSync(built))throw new Error('Run npm run build before npm run dev.');
const publicDir=['dist/client','dist/public','dist/static','dist'].map(x=>path.join(root,x)).find(x=>existsSync(path.join(x,'index.html')));
const files={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'application/javascript',mjs:'application/javascript',json:'application/json',svg:'image/svg+xml',webp:'image/webp',png:'image/png',jpg:'image/jpeg',woff2:'font/woff2',wav:'audio/wav',mp3:'audio/mpeg'};
async function assetsFetch(req){
 if(!publicDir || !['GET','HEAD'].includes(req.method))return new Response('Not found',{status:404});
 let segment;try{segment=decodeURIComponent(new URL(req.url).pathname);}catch{return new Response('Bad URL',{status:400});}
 if(segment==='/'||segment==='')segment='/index.html';
 if(segment.startsWith('/server/') || segment.split('/').some(x=>x.startsWith('.')||x==='..'))return new Response('Not found',{status:404});
 const full=path.resolve(publicDir,'.'+segment);
 if(!full.startsWith(publicDir+path.sep))return new Response('Not found',{status:404});
 try{
  if(!(await stat(full)).isFile())throw Error();
  const headers={'Content-Type':files[path.extname(full).slice(1)]||'application/octet-stream','X-Content-Type-Options':'nosniff'};
  return new Response(req.method==='HEAD'?null:Readable.toWeb(createReadStream(full)),{headers});
 }catch{return new Response('Not found',{status:404});}
}
const worker=(await import(pathToFileURL(built))).default;
const storage=process.env.MAAMEL_DEV_DB||path.join(root,'.local','maamel.sqlite');
if(storage!==':memory:')await mkdir(path.dirname(storage),{recursive:true});
const DB=localDatabase(storage);
DB.exec(await readFile(path.join(root,'backend/schema.sql'),'utf8'));
if(!DB.sq.prepare("PRAGMA table_info(work)").all().some(c=>c.name==="extendedUntil"))DB.exec("ALTER TABLE work ADD COLUMN extendedUntil TEXT");
const env={DB,ASSETS:{fetch:assetsFetch}};
const port=Number(process.env.PORT||(process.argv.includes('--port')?process.argv[process.argv.indexOf('--port')+1]:process.argv[2])||4173);
const server=createServer(async(req,res)=>{
 try{
  const origin='http://'+(req.headers.host||'127.0.0.1:'+port);
  const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const ctx={waitUntil:promise=>Promise.resolve(promise).catch(()=>console.error('Background operation failed.')),passThroughOnException(){}};
  let response=await worker.fetch(request,env,ctx);
  if(response.status===404 && publicDir && !new URL(request.url).pathname.startsWith('/api/'))response=await assetsFetch(request);
  res.writeHead(response.status,Object.fromEntries(response.headers));
  if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
 }catch{res.writeHead(500);res.end('Internal server error');}
});
server.listen(port,'127.0.0.1',()=>console.log('Maamel development server: http://127.0.0.1:'+server.address().port));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>server.close(()=>{DB.close();process.exit(0);}));
