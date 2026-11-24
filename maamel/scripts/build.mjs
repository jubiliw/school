import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {labs} from '../registry.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const assets={};
function add(file,route='/'+file){assets[route]=read(file)}
add('index.html','/');add('backend/admin-ui.mjs','/admin-ui.mjs');
for(const dir of ['ui','office-common',...Object.keys(labs)])for(const file of fs.readdirSync(dir)){
 if(/\.(mjs|css|svg)$/.test(file)&&!file.includes('.test.'))add(dir+'/'+file)
}
const lessons=JSON.parse(read('ui/lessons.json'));
const catalog=Object.entries(labs).map(([id,model])=>({id,tasks:model.tasks.map(t=>{
 const page=Number(String(t.page).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).match(/\d+/)?.[0]);
 const lesson=lessons.find(l=>page>=l.start&&page<=l.end);
 if(!lesson)throw Error('Unmapped source page '+page+' '+id);
 return {...t,lesson:lesson.lesson,unit:lesson.unit};
})}));
assets['/catalog.json']=JSON.stringify(catalog);
for(const lab of catalog){if(!assets['/'+lab.id+'/index.mjs'])throw Error('Missing simulator '+lab.id)}
fs.mkdirSync('.generated',{recursive:true});fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('.generated/assets.mjs','export default '+JSON.stringify(assets));
execFileSync(process.env.ESBUILD_BIN||path.resolve('node_modules/.bin/esbuild'),['worker.mjs','--format=esm','--bundle','--target=es2022','--outfile=dist/server/index.js'],{stdio:'inherit'});
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log(catalog.length+' labs; '+catalog.reduce((n,l)=>n+l.tasks.length,0)+' tasks.');
