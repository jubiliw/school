import test from 'node:test';
import assert from 'node:assert/strict';
import {reviews,initial,grade} from './model.mjs';
for(const review of reviews){
 test('Source review '+review.id+' page '+review.page,()=>{
  assert.ok(review.questions.length>=1);
  for(const q of review.questions){assert.ok(q.prompt&&q.options.length>1&&q.options[q.correct])}
  assert.equal(grade(initial(),review.id).score,0);
  const answers=Object.fromEntries(review.questions.map((q,i)=>[i,q.correct]));
  assert.equal(grade(JSON.parse(JSON.stringify({answers})),review.id).score,100);
  answers[0]=(answers[0]+1)%review.questions[0].options.length;
  assert.equal(grade({answers},review.id).score,Math.round(100*(review.questions.length-1)/review.questions.length));
 })
}
