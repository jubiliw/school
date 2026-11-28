import test from 'node:test';
import assert from 'node:assert/strict';
import {apply} from '../windows/model.mjs';
import {wordDrive} from './word-drive.mjs';

test('a Word document follows its Explorer file across folders and keeps formatting',()=>{
 const data=new Map(),disk=wordDrive({getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},'win');
 const body={paragraphs:[{runs:[{text:'النص',bold:true}]}]};
 const file=disk.save('ملفي','docs',body);
 assert.deepEqual(disk.files()[0].body,body);
 data.set('win',JSON.stringify(apply(JSON.parse(data.get('win')),{type:'move',id:file.id,parent:'desktop'})));
 disk.save('ملفي','docs',body,file.id);
 assert.equal(disk.files()[0].folder,'desktop');
 assert.throws(()=>disk.save('ملفي','desktop',body));
 data.set('win',JSON.stringify(apply(JSON.parse(data.get('win')),{type:'trash',id:file.id})));
 assert.deepEqual(disk.files(),[]);
});
