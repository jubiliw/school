import {initial,apply,valid,pathOf} from '../windows/model.mjs';
export function wordDrive(storage,key){
 function read(){const raw=storage.getItem(key);const state=raw?JSON.parse(raw):initial('free');if(!valid(state))throw Error('تعذّر قراءة مساحة الملفات.');return state}
 function visible(s,n){while(n.parent)n=s.nodes.find(p=>p.id===n.parent);return n.id!=='bin'}
 function documentOf(n){
  if(n?.kind!=='text')return null;
  try{const f=JSON.parse(n.content);return f.format==='maamel-word-1'&&Array.isArray(f.body?.paragraphs)?f.body:null}catch{return null}
 }
 return {
  folders(){const s=read();return s.nodes.filter(n=>n.kind==='folder'&&visible(s,n)).map(n=>[n.id,pathOf(s,n.id)])},
  files(){const s=read();return s.nodes.filter(n=>n.kind==='text'&&visible(s,n)&&documentOf(n)).map(n=>({id:n.id,name:n.name,folder:n.parent,path:pathOf(s,n.id),body:documentOf(n)}))},
  save(name,folder,body,id){
   let s=read();const current=id?s.nodes.find(n=>n.id===id):null;
   if(id&&(!current||!visible(s,current)))throw Error('تغيّر موقع الملف. استخدم حفظ باسم.');
   const existing=current||s.nodes.find(n=>n.parent===folder&&n.name.normalize('NFC').toLowerCase()===name.normalize('NFC').toLowerCase());
   if(existing&&!current)throw Error('الاسم مستخدم في هذا المجلد. اختر اسمًا آخر.');
   const content=JSON.stringify({format:'maamel-word-1',body});
   s=apply(s,existing?{type:'write',id:existing.id,content}:{type:'create',kind:'text',parent:folder,name,content});
   const n=existing||s.nodes.at(-1);storage.setItem(key,JSON.stringify(s));return {id:n.id,folder:n.parent,name:n.name};
  },documentOf
 };
}
