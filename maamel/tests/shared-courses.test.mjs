import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalog} from '../scripts/course-index.mjs';
import {programsFor} from '../ui/course-catalog.mjs';
test('Two books share one program and activity while retaining their own lesson and term',()=>{
 const programs={word:{tasks:[{id:'font'},{id:'spacing'}]}};
 const book=(grade,term,tasks)=>({grade,lessons:[{start:1,end:10,term,unit:'u',lesson:'l'+grade}],activities:tasks.map(task=>({program:'word',task,page:2}))});
 const catalog=createCatalog(programs,[book(4,1,['font']),book(5,2,['font','spacing'])]);
 assert.equal(catalog.length,1);assert.equal(catalog[0].tasks.length,2);
 assert.deepEqual(programsFor(catalog,4,1)[0].tasks.map(t=>t.id),['font']);
 assert.equal(programsFor(catalog,5,2)[0].tasks[0].placements[1].lesson,'l5');
 assert.deepEqual(programsFor(catalog,4,2),[]);
});
