import test from 'node:test';
import assert from 'node:assert/strict';
import {desktopPrograms} from '../ui/library-view.mjs';
import {initial as sheet} from '../sheets/model.mjs';
import {initial as desktop,valid} from '../windows/model.mjs';
import {trim} from '../studio/video.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('Open programs are unique and blank workspaces omit lesson fixtures',()=>{
 assert.deepEqual(desktopPrograms([{id:'word'},{id:'word'},{id:'review'}]),['word','python','html','video']);
 assert.deepEqual(sheet('free').body.cells,{});
 const free=desktop('free');assert.ok(valid(free));assert.equal(free.nodes.length,3);
});
test('Trimming preserves the source duration and rejects inverted ranges',()=>{
 const source={duration:6,start:0,end:6};assert.deepEqual(trim(source,1,3),{duration:6,start:1,end:3});assert.equal(source.start,0);assert.throws(()=>trim(source,3,1));
});
test('Python interpreter executes functions, loops, input and standard library',async()=>{
 const messages=[];const context=vm.createContext({setTimeout,clearTimeout,setImmediate,clearImmediate,console,postMessage:m=>messages.push(m)});
 vm.runInContext('self=this;window=this',context);
 for(const f of ['vendor/skulpt/skulpt.min.js','vendor/skulpt/skulpt-stdlib.js','studio/python-engine.js'])vm.runInContext(readFileSync(new URL('../'+f,import.meta.url),'utf8'),context);
 await context.onmessage({data:{source:'import math\ndef square(x):\n    return x*x\nprint(sum(square(i) for i in range(int(input()))))\nprint(math.sqrt(25))',stdin:'4'}});
 assert.equal(messages.filter(m=>m.error).length,0,JSON.stringify(messages));assert.match(messages.map(m=>m.text??'').join(''),/14\n5/);
});
