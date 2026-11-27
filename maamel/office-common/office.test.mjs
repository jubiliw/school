import test from 'node:test';
import assert from 'node:assert/strict';
import * as word from '../word/model.mjs';
import * as slides from '../slides/model.mjs';
import * as sheets from '../sheets/model.mjs';
const save=s=>{s.name='مشروعي';s.files=[{name:s.name,body:structuredClone(s.body)}];};
const paragraph=text=>({runs:[{text}]});
const full=(model,state,task)=>assert.equal(model.grade(JSON.parse(JSON.stringify(state)),task).score,100);
test('each office task has a page and cannot be passed with the initial file',()=>{
 for(const model of [word,sheets,slides])for(const task of model.tasks){assert.ok(task.page);assert.ok(model.grade(model.initial(task),task).score<100);}
});
test('word accepts bilingual lines in order and distinguishes missing lines',()=>{
 const s=word.initial('fruit');s.body.paragraphs=['تفاح','أناناس','موز','apple','pineapple','banana'].map(paragraph);full(word,s,'fruit');
 s.body.paragraphs.splice(2,1);assert.ok(word.grade(s,'fruit').score<100);
});
test('word edits preserve unaffected text and assesses all selected headline runs',()=>{
 const s=word.initial('edit');s.body.paragraphs=['المشروبات الغازية لذيذ','إنه غير صحي لصحتك'].map(paragraph);full(word,s,'edit');
 const h=word.initial('headline');Object.assign(h.body.paragraphs[0].runs[0],{bold:true,italic:true,underline:true,highlight:'rgb(255, 255, 0)',size:16});save(h);full(word,h,'headline');
 h.body.paragraphs[0].runs.push({text:'مضاف'});assert.ok(word.grade(h,'headline').score<100);
});
test('word paragraph structure, borders, shades and saved version matter',()=>{
 const s=word.initial('city');s.body.paragraphs=['مدينتي الجميلة','نزور حديقة المدينة في المساء','نذهب إلى متحف المدينة في الصباح'].map(paragraph);s.body.paragraphs[0].runs[0].bold=true;Object.assign(s.body.paragraphs[1],{border:true,fill:'#abcd12'});Object.assign(s.body.paragraphs[2],{border:true,fill:'#abcdef'});save(s);full(word,s,'city');s.body.paragraphs[2].fill='#abcd12';assert.ok(word.grade(s,'city').score<100);
});
test('word months require twelve actual numbered paragraphs',()=>{
 const s=word.initial('months');s.body.paragraphs='يناير فبراير مارس أبريل مايو يونيو يوليو أغسطس سبتمبر أكتوبر نوفمبر ديسمبر'.split(' ').map(text=>({...paragraph(text),list:'ol'}));full(word,s,'months');s.body.paragraphs[0].list='ul';assert.ok(word.grade(s,'months').score<100);
});
test('worksheet parser calculates referenced expressions, Arabic digits, unary and precedence',()=>{
 const c={A1:{raw:'٤'},B1:{raw:'2'},C1:{raw:'=-(A1+B1)*2+20/4'}};assert.equal(sheets.evaluate(c,'C1'),-7);c.A1.raw='6';assert.equal(sheets.evaluate(c,'C1'),-11);
 for(const [raw,expected] of [['=1/0','#DIV/0!'],['=C1','#CYCLE!'],['=X51',0],['=Z10001','#REF!'],['=5+','#VALUE!'],['=(A1+2','#VALUE!']]){c.C1.raw=raw;assert.equal(sheets.evaluate(c,'C1'),expected);}
});
test('worksheet secret requires exact addresses and correct values',()=>{
 const s=sheets.initial('secret');for(const [a,raw] of Object.entries({A2:'ا',B3:'ل',C4:'ح',D5:'ا',E6:'س',F7:'ب'}))s.body.cells[a]={raw};full(sheets,s,'secret');
});
test('spreadsheet format and save',()=>{
 const s=sheets.initial('travel'),c=s.body.cells;for(const a of ['A1','B1','C1'])Object.assign(c[a],{bold:true,color:'#f00000',size:18});for(let i=2;i<=6;i++)Object.assign(c['A'+i],{fill:'#123456',align:'center'});save(s);full(sheets,s,'travel');
});
test('vote totals use dynamic references; literal or accidental match earns partial credit',()=>{
 const s=sheets.initial('votes'),c=s.body.cells;c.B6.raw='4';for(let i=2;i<=6;i++)c['D'+i]={raw:'=B'+i+'+C'+i};for(const col of ['B','C'])c[col+'7']={raw:'='+[2,3,4,5,6].map(n=>col+n).join('+')};save(s);full(sheets,s,'votes');c.D2.raw='=4';save(s);assert.ok(sheets.grade(s,'votes').score<100);
});
test('cost uses both independently changing totals',()=>{
 const s=sheets.initial('cost');Object.assign(s.body.cells,{B8:{raw:'=400*B7'},C8:{raw:'=C7*400'},D8:{raw:'=B8+C8'}});save(s);full(sheets,s,'cost');s.body.cells.C8.raw='=10400';save(s);assert.ok(sheets.grade(s,'cost').score<100);
});
test('slide creation, layout, text and saved state',()=>{
 const s=slides.initial();s.body.theme='basis';s.body.font='Arial';Object.assign(s.body.slides[0],{title:'الأطعمة الصحية',text:'نور'});s.body.slides.push({...slides.slide('content'),title:'الوصف',text:'يوفر الغذاء طاقة للنشاط.'});save(s);full(slides,s,'healthy');
});
test('slide grading examines placement, size, style and actual slide order',()=>{
 const s=slides.initial();Object.assign(s.body.slides[0],{title:'الرياضات',text:'نور',items:[{kind:'image',asset:'sport',x:55,y:60,w:35,frame:'frame'}]});s.body.slides.push({...slides.slide(),text:'أحب كرة السلة.'});full(slides,s,'sport');s.body.slides.reverse();assert.ok(slides.grade(s,'sport').score<100);
});
test('slide motion, transition and embedded media are distinct',()=>{
 const s=slides.initial();s.body.slides=Array.from({length:5},(_,i)=>({...slides.slide(),title:'اهتمام '+i,text:'معلومة '+i}));s.body.slides[1].transition='fade';s.body.slides[2].textAnimation='zoom';full(slides,s,'introduce');s.body.slides[1].items=[{kind:'image',asset:'landscape'},{kind:'video',asset:'sport-clip'}];s.body.slides[0].notes='التعريف بالمكان';save(s);full(slides,s,'holiday');
});
