import test from 'node:test';
import assert from 'node:assert/strict';
import * as p from './model.mjs';
import * as b from '../web/model.mjs';
import * as a from '../ai/model.mjs';
test('photo edits committed, partial grading and save/reopen',()=>{let s=p.edit(p.initial(),'coast',{light:115,color:0});assert.equal(p.grade(s,'coast').score,0);s=p.save(s,'coast');assert.equal(p.grade(s,'coast').score,67);s=p.save(p.edit(s,'coast',{filter:'desert'}),'coast');assert.equal(p.grade(JSON.parse(JSON.stringify(s)),'coast').score,100);});
test('spot correction requires a point on an actual defect',()=>{let s=p.initial();assert.equal(p.mark(s,'spot',.95,.95),s);s=p.mark(s,'spot',.23,.18);s=p.mark(s,'spot',.68,.15);assert.equal(p.grade(p.save(s,'coast'),'spot').score,100);});
test('crop bounds isolate one leaf, not whole image',()=>{let s=p.initial();assert.equal(p.grade(p.save(s,'leaves'),'crop').score,0);s=p.save(p.edit(s,'leaves',{crop:[.1,.15,.28,.4]}),'leaves');assert.equal(p.grade(s,'crop').score,100);});
test('album, collection, rotation, eyes grade resulting state',()=>{let s=p.initial();s.deleted=['cat','bird'];assert.equal(p.grade(s,'collection').score,100);s.deleted.push('leaves');assert.ok(p.grade(s,'collection').score<100);s=p.save(p.edit(s,'pyramid',{rotation:2}),'pyramid');assert.equal(p.grade(s,'turn').score,100);s.selected='portrait';for(const xy of p.assets.find(x=>x.id==='portrait').eyes)s=p.mark(s,'eyes',...xy);assert.equal(p.grade(p.save(s,'portrait'),'eyes').score,100);s.copies=[{album:'صور قديمة',edit:{filter:'vanilla'}}];assert.equal(p.grade(s,'album').score,100);});
test('web history replaces forward path and preserves search',()=>{let s=b.navigate(b.initial(),'one');s=b.navigate(s,'two');s=b.navigate({...s,cursor:1},'three');assert.deepEqual(s.history,[b.HOME,'one','three']);assert.ok(b.search('الأمن الرقمي').some(p=>p===b.pages[1]));assert.deepEqual(b.search('غيرموجود'),[]);});
test('web saves the actual source and extract; click history alone earns no credit',()=>{let s=b.navigate(b.initial(),b.pages[2].url);assert.equal(b.grade(s,'privacy').score,0);s=b.save({...s,source:b.pages[2].url,note:b.pages[2].text,filename:'الخصوصية'});assert.equal(b.grade(s,'privacy').score,100);assert.ok(b.grade(s,'security').score<100);});
test('AI crop, correct extracted text and saved review all required',()=>{let s=a.initial();assert.equal(a.grade(s).score,0);s={...s,rect:[0,98/220,1,45/220],recognized:a.lines[1],saved:a.lines[1]};assert.equal(a.grade(s).score,100);assert.ok(a.grade({...s,rect:[0,0,1,1]}).score<100);});
test('safety assessment grades saved decisions independently',()=>{assert.equal(b.grade({safetyAnswers:{0:1,1:2,2:0}},'safety').score,100);assert.equal(b.grade({safetyDraft:{0:1,1:2,2:0}},'safety').score,0);});
test('tabs restore independent history and keep the research document',()=>{
 let s={...b.initial(),note:'بحثي'};s=b.navigate(s,b.pages[2].url);
 s=b.tabAction(s,'add');assert.equal(s.history[s.cursor],b.HOME);
 s=b.navigate(s,b.pages[3].url);s=b.tabAction(s,'select',0);assert.equal(s.history[s.cursor],b.pages[2].url);
 s=b.tabAction(s,'close');assert.equal(s.history[s.cursor],b.pages[3].url);assert.equal(s.note,'بحثي');
});
