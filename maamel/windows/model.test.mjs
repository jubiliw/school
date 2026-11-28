import test from 'node:test'
import assert from 'node:assert/strict'
import {initial,apply,valid,grade,animals,children} from './model.mjs'
function fixture(){
  let s=initial()
  return {get state(){return s},op(op){s=apply(s,op);return s.nodes.at(-1).id},
    folder(name,parent='docs'){return this.op({type:'create',kind:'folder',name,parent})}}
}
test('seed, save and reopen edited text without shared mutable references',()=>{
  const a=fixture(), snap=a.state, id=a.op({type:'create',kind:'text',name:'نشاط.txt',parent:'docs',content:'مرحبا'})
  a.op({type:'write',id,content:'مرحبا بالعالم'});const reopened=JSON.parse(JSON.stringify(a.state))
  assert.ok(valid(reopened));assert.equal(reopened.nodes.find(n=>n.id===id).content,'مرحبا بالعالم');assert.equal(snap.nodes.length,7)
})
test('recursive copy creates independent identities; move preserves contents and identities',()=>{
  const f=fixture(),r=f.folder('أصل'),sub=f.folder('داخل',r),file=f.op({type:'create',kind:'text',parent:sub,name:'abc.txt',content:'42'})
  f.op({type:'copy',id:r,parent:'desktop'});const copy=children(f.state,'desktop')[0],copySub=children(f.state,copy.id)[0],copyFile=children(f.state,copySub.id)[0]
  assert.notEqual(copyFile.id,file);assert.equal(copyFile.content,'42');f.op({type:'move',id:file,parent:'desktop'});assert.equal(children(f.state,sub).length,0);assert.equal(children(f.state,copySub.id).length,1)
})
test('duplicate names, invalid names, cycles and system mutations rejected atomically',()=>{
  const f=fixture(),p=f.folder('قسم'),q=f.folder('فرع',p),before=f.state
  for(const op of [{type:'create',name:'قسم',kind:'folder',parent:'docs'},{type:'rename',id:q,name:'ممنوع/'},{type:'copy',id:p,parent:q},{type:'move',id:p,parent:p},{type:'trash',id:'docs'}])assert.throws(()=>f.op(op))
  assert.deepEqual(before,f.state)
})
test('recycle bin handles duplicates and restores to available destination',()=>{
  const f=fixture(),p=f.folder('نص'),q=f.folder('نص','desktop')
  f.op({type:'trash',id:p});f.op({type:'trash',id:q});assert.equal(children(f.state,'bin').length,2);f.folder('نص','desktop')
  f.op({type:'restore',id:q});assert.equal(f.state.nodes.find(n=>n.id===q).name,'نص (2)');assert.equal(children(f.state,'bin').length,1)
})
test('grade verifies exact image identity, placement and renaming; copy does not count as move',()=>{
  const f=fixture(), root=f.folder('الحيوانات'),categories=animals.map(a=>f.folder(a.category,root))
  assert.equal(grade(initial()).score,0);assert.equal(grade(f.state).score,40)
  f.op({type:'copy',id:'bird',parent:categories[0]});assert.equal(grade(f.state).score,40)
  for(const [i,a] of animals.entries()){f.op({type:'rename',id:a.id,name:a.name+'.png'});f.op({type:'move',id:a.id,parent:categories[i]})}
  assert.equal(grade(JSON.parse(JSON.stringify(f.state))).score,100);f.op({type:'trash',id:root});assert.equal(grade(f.state).score,0)
})
test('project evaluates artifact and selected background; settings persist',()=>{
 const f=fixture();for(const n of ['المستندات','الصور','مقاطع الفيديو']){const p=f.folder(n,'desktop');for(const who of ['المعلمين','الطلبة'])f.folder(who,p)}
 const id=f.op({type:'create',parent:'desktop',kind:'drawing',name:'أجزاء.png',strokes:[{color:'#112233',points:[[0,0],[1,1]]}]});f.op({type:'settings',settings:{background:id,resolution:'800×600'}})
 assert.equal(grade(JSON.parse(JSON.stringify(f.state)),'project').score,100)
})
test('invalid submissions cannot earn points; bad drawing data rejected',()=>{
 const s=initial();s.nodes[0].parent='desktop';assert.equal(valid(s),false);assert.equal(grade(s).score,0)
 assert.throws(()=>apply(initial(),{type:'create',name:'test',parent:'docs',kind:'drawing',strokes:[{color:'url(x)',points:[[1,1]]}]}))
})
test('continents task recognizes normalized Arabic names and nested placement',()=>{
 const f=fixture(),r=f.folder('قارات العالم','desktop');for(const n of ['آسيا','أفريقيا','أمريكا','أوروبا','أستراليا']){const id=f.folder(n,r);if(n==='آسيا')f.folder('السعودية',id)}
 assert.equal(grade(f.state,'continents').score,100)
})
test('restoring a file whose original parent is recycled falls back to desktop',()=>{
 const f=fixture(),p=f.folder('أب'),c=f.folder('ابن',p);f.op({type:'trash',id:c});f.op({type:'trash',id:p})
 f.op({type:'restore',id:c});assert.equal(f.state.nodes.find(n=>n.id===c).parent,'desktop')
})
test('hardware and desktop recognition use saved answers, not interaction count',async()=>{
 const {exercises}=await import('./exercises.mjs')
 for(const task of ['hardware','filetypes']){
   let s=initial(task);for(const q of exercises[task])s=apply(s,{type:'answer',question:q.id,value:q.answer})
   assert.equal(grade(JSON.parse(JSON.stringify(s)),task).score,100)
   const q=exercises[task][0];s=apply(s,{type:'answer',question:q.id,value:q.options.find(o=>o!==q.answer)})
   assert.ok(grade(s,task).score<100)
 }
})
test('settings and alarm rubric verifies final configuration and partial credit',()=>{
 let s=initial('display')
 s=apply(s,{type:'settings',settings:{resolution:'1920×1200'}})
 assert.equal(grade(s,'display').score,33)
 s=apply(s,{type:'settings',settings:{volume:40,background:'blue',alarm:{enabled:true,time:'08:45',tone:'bell'}}})
 assert.equal(grade(s,'display').score,100);assert.equal(grade(s,'alarm').score,100)
 assert.throws(()=>apply(s,{type:'settings',settings:{alarm:{enabled:true,time:'33:12',tone:'bell'}}}))
})
test('copy in same directory preserves filename extension and trashing wallpaper resets background',()=>{
 const f=fixture(),id=f.op({type:'create',kind:'drawing',parent:'desktop',name:'ملف.png',strokes:[]})
 const c=f.op({type:'copy',id,parent:'desktop'});assert.equal(f.state.nodes.find(n=>n.id===c).name,'ملف (2).png')
 f.op({type:'settings',settings:{background:id}});f.op({type:'trash',id});assert.equal(f.state.settings.background,'jade')
})
test('grade 5 picture shortcuts survive reopening and go to the bin independently of their targets',()=>{
 const task='picture-shortcuts'
 let state=initial(task)
 assert.equal(grade(state,task).score,0)
 for(const parent of ['pictures','desktop']){
   for(const id of ['bird','fish']){
     state=apply(state,{type:'shortcut',id,parent})
     const link=state.nodes.at(-1)
     assert.equal(link.target,id)
     state=apply(state,{type:'trash',id:link.id})
   }
   state=JSON.parse(JSON.stringify(state))
   assert.equal(valid(state),true)
   if(parent==='pictures')assert.equal(grade(state,task).score,33)
 }
 assert.equal(grade(state,task).score,100)
 state=apply(state,{type:'trash',id:'bird'})
 assert.ok(grade(state,task).score<100)
})
test('timed routes require the moved original and links in the two textbook locations',()=>{
 const task='shortcut-race'
 let s=initial(task)
 const run=op=>{s=apply(s,op)}
 assert.throws(()=>run({type:'race-open',id:'timing-file',elapsed:900}))
 run({type:'create',parent:'docs',kind:'folder',name:'الوقت'})
 const parent=s.nodes.at(-1).id
 run({type:'create',parent,kind:'folder',name:'تسجيلات'})
 run({type:'move',id:'timing-file',parent:s.nodes.at(-1).id})
 run({type:'race-open',id:'timing-file',elapsed:900})
 for(const location of [parent,'desktop']){
   run({type:'shortcut',id:'timing-file',parent:location})
   const id=s.nodes.at(-1).id
   run({type:'race-open',id,elapsed:600})
   run({type:'trash',id})
 }
 assert.deepEqual(s.timings,{direct:900,folder:600,desktop:600})
 assert.equal(grade(JSON.parse(JSON.stringify(s)),task).score,100)
})
test('project archive preserves an independent extractable image after deleting the source',async()=>{
 const {packEntry,unpackEntry}=await import('./archive.mjs')
 const task='green-project'
 let state=initial(task)
 const run=op=>{state=apply(state,op)}
 run({type:'create',parent:'docs',kind:'folder',name:'مشروع'})
 const folder=state.nodes.at(-1)
 for(const id of ['trees','park','plan','species'])run({type:'move',id,parent:folder.id})
 const files=children(state,folder.id)
 const entries=[await packEntry(folder,null),...await Promise.all(files.map(file=>packEntry(file,folder.id)))]
 run({type:'compress',id:folder.id,entries});const zip=state.nodes.at(-1).id
 run({type:'trash',id:folder.id});run({type:'purge',id:folder.id})
 state=JSON.parse(JSON.stringify(state))
 const tree=entries.find(e=>e.id==='trees')
 run({type:'extract',id:zip,parent:'docs',items:[{id:tree.id,file:await unpackEntry(tree)}]})
 run({type:'rename',id:state.nodes.at(-1).id,name:'أشجاري.png'})
 run({type:'trash',id:zip});run({type:'purge',id:zip})
 assert.equal(grade(state,task).score,100)
})
