import {test} from 'node:test';
import assert from 'node:assert/strict';
import {term1} from './term1.mjs';
import {grade,initial,tasks} from '../scratch/model.mjs';
test('term one has four identified sections and covers each actual assessment page',()=>{
 assert.deepEqual(term1.map(t=>t.id),['G4-Q01','G4-Q02','G4-Q03','G4-Q04']);
 const qs=term1.flatMap(t=>t.questions);assert.equal(qs.length,63);
 assert.deepEqual([...new Set(qs.map(q=>q.page))],[160,161,162,163,164,165,166,167,168,169]);
 for(const q of qs){assert.ok(Number.isInteger(q.correct));assert.ok(q.options[q.correct]);assert.equal(new Set(q.options).size,q.options.length);}
 assert.ok(tasks.some(t=>t.id===term1[3].practical.task));
});
test('page 169 requires five purple drawn intervals with unmarked equal gaps',()=>{
 const s=initial();s.x=-170;
 s.blocks=[{op:'flag'},{op:'erase'},{op:'size',n:2},{op:'color',n:77},{op:'repeat',n:5,body:[{op:'down'},{op:'move',n:30},{op:'up'},{op:'move',n:30}]}];
 assert.equal(grade(s,'review-dashes').score,100);
 s.blocks.at(-1).body[3].n=10;assert.ok(grade(s,'review-dashes').score<100);s.blocks.at(-1).body[3].n=30;
 s.blocks[3].n=15;assert.ok(grade(s,'review-dashes').score<100);s.blocks[3].n=77;
 s.blocks.pop();assert.ok(grade(s,'review-dashes').score<100);
});
