import test from 'node:test'
import assert from 'node:assert/strict'
import {grade,initial} from '../word/model.mjs'
import {corrections,spellingIssues} from '../word/proofing.mjs'
test('Arabic proofreading ends after full-word corrections, including prefix matches',()=>{
 for(const id of ['security-proof','mosque-proof']){
  const state=initial(id)
  assert.equal(grade(state,id).score,0)
  for(const p of state.body.paragraphs)for(const r of p.runs)for(const [wrong,right] of corrections)r.text=r.text.replace(wrong,right)
  assert.deepEqual(spellingIssues(state.body.paragraphs.map(p=>p.runs[0].text)),[])
  assert.equal(grade(state,id).score,100)
 }
})
test('process and family diagrams are graded by layout and distinct labels',()=>{
 const state=initial('design-process')
 state.body.paragraphs=[{type:'diagram',layout:'process',items:['الفكرة','الكتابة','الإخراج']}]
 assert.equal(grade(state,'design-process').score,100)
 assert.equal(grade(state,'family-hierarchy').score,0)
})
