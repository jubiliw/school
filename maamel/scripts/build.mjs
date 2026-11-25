import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createCatalog} from './course-index.mjs';
import {labs} from '../registry.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const assets={};
function add(file,route='/'+file){assets[route]=read(file)}
add('index.html','/');add('backend/admin-ui.mjs','/admin-ui.mjs');
for(const dir of ['ui','studio','office-common',...Object.keys(labs)])for(const file of fs.readdirSync(dir)){
 if(/\.(mjs|css|svg)$/.test(file)&&!file.includes('.test.'))add(dir+'/'+file)
}
import {books} from '../courses/index.mjs';
const catalog=createCatalog(labs,books);
assets['/studio/python-frame.html']=read('studio/python-frame.html').replace('<!--BRIDGE-->',()=>'<script>'+read('studio/python-frame.mjs')+'</script>').replace('<!--RUNTIME-->',()=>'<script type="text/plain" id="runtime">'+['vendor/skulpt/skulpt.min.js','vendor/skulpt/skulpt-stdlib.js','studio/python-engine.js'].map(read).join('\n').replace(/<\/script/gi,'<\\/script')+'</script>');
assets['/vendor/skulpt/LICENSE']=read('vendor/skulpt/LICENSE');
assets['/catalog.json']=JSON.stringify(catalog);
for(const lab of catalog){if(!assets['/'+lab.id+'/index.mjs'])throw Error('Missing simulator '+lab.id)}
fs.mkdirSync('.generated',{recursive:true});fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('.generated/assets.mjs','export default '+JSON.stringify(assets));
execFileSync(process.env.ESBUILD_BIN||path.resolve('node_modules/.bin/esbuild'),['worker.mjs','--format=esm','--bundle','--target=es2022','--outfile=dist/server/index.js'],{stdio:'inherit'});
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log(catalog.length+' labs; '+catalog.reduce((n,l)=>n+l.tasks.length,0)+' tasks.');
