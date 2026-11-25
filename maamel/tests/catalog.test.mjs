import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {labs,validateLab,initial,grade} from '../registry.mjs';
const lessons=JSON.parse(fs.readFileSync(new URL('../courses/grade-04.json',import.meta.url))).lessons;
for(const [id,lab] of Object.entries(labs)){
 test('Catalog, source pages, serialization and fresh-state grading: '+id,async()=>{
  assert.equal(typeof (await import('../'+id+'/index.mjs')).mount,'function');
  assert.equal(new Set(lab.tasks.map(t=>t.id)).size,lab.tasks.length);
  for(const t of lab.tasks){
   const p=Number(String(t.page).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).match(/\d+/)?.[0]);
   assert.ok(lessons.some(l=>p>=l.start&&p<=l.end),id+'/'+t.id+' source page');
   assert.ok(validateLab(id,t.id));
   const result=grade(id,JSON.parse(JSON.stringify(initial(id,t.id))),t.id);
   assert.ok(Number.isFinite(result.score)&&result.score>=0&&result.score<100,id+'/'+t.id);
  }
  assert.equal(validateLab(id,'activity-not-in-book'),false);
 });
}
