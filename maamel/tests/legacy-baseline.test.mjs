import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
for(const [file,functions] of Object.entries({'index.html':['startBoot','isInside','uniqueName'],'word-lab/index.html':['saveDoc','applyShade'],'access-lab/index.html':['checkIntegrity','exportJSON']})){
 const url=new URL(file,root);
 test('Legacy entry point '+file,{skip:!existsSync(url)},()=>{const html=readFileSync(url,'utf8');for(const name of functions)assert.ok(html.includes('function '+name+'('))})
}
