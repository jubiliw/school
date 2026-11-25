export function el(tag, text, cls) {
  const n=document.createElement(tag);
  if(text!=null)n.textContent=text;
  if(cls)n.className=cls;
  return n;
}
export function button(text, run) {const b=el('button',text);b.type='button';b.addEventListener('click',run);return b;}
export function select(label, options, run) {
  const s=el('select');s.setAttribute('aria-label',label);
  for(const [value,text] of options)s.add(new Option(text,value));s.onchange=()=>run(s.value);return s;
}
export function field(label, node){const l=el('label',label+' ');l.append(node);return l;}
export function group(label,...nodes){
 const g=el('section',null,'ogrp'), items=el('div',null,'ogtools');
 g.setAttribute('aria-label',label);items.append(...nodes);g.append(items,el('div',label,'ogname'));return g;
}
export function command(label,glyph,run,iconOnly=false){
 const b=button('',run);b.className='ocmd'+(iconOnly?' icon-only':'');b.setAttribute('aria-label',label);b.title=label;
 const icon=el('span',glyph,'oglyph');icon.setAttribute('aria-hidden','true');b.append(icon);if(!iconOnly)b.append(el('span',label));return b;
}
export function shell(host, title, state, change, fresh, render, tasks) {
  host.replaceChildren(); const r=el('section',null,'ofc');r.dir='rtl';host.append(r);
  const css = document.createElement('link');css.rel='stylesheet';css.href=new URL('./ribbon.css',import.meta.url).href;r.append(css);
  r.classList.add(title==='معالجة النصوص'?'office-word':title==='الجداول الإلكترونية'?'office-sheets':'office-slides');
  const top=el('div',null,'obar'), heading=el('strong'), tabs=el('nav',null,'otabs'), ribbon=el('div',null,'oribbon'), work=el('div',null,'owork'), status=el('div',null,'ostatus');status.setAttribute('role','status');
  function notify(msg){status.textContent=msg;}
  function touch(){heading.textContent=title+' · '+(state.name||'بدون اسم');change(structuredClone(state));}
  function dialog(label, contents, actions) {
    const d=el('dialog');d.setAttribute('aria-label',label);d.append(el('h3',label),...contents);const buttons=el('div',null,'odlg-actions');
    for(const [name,fn] of actions)buttons.append(button(name,()=>{if(fn()!==false)d.close();}));
    buttons.append(button('إلغاء',()=>d.close()));d.append(buttons);r.append(d);d.onclose=()=>d.remove();d.showModal();return d;
  }
  function save(as=false) {
    function commit(name){if(!name.trim())return false;const clean=name.trim().slice(0,80);state.files ||= [];
      const original=state.files.find(f=>f.name===clean);
      if(original)original.body=structuredClone(state.body);else if(state.files.length>=8){notify('وصلت إلى الحد الأقصى للملفات في هذا النشاط.');return false;}else state.files.push({name:clean,body:structuredClone(state.body)});
      state.name=clean;touch();notify('تم حفظ '+clean);return true;}
    if(state.name&&!as){commit(state.name);return;}
    const input=el('input');input.maxLength=80;input.value=state.name||'';input.placeholder='اسم الملف';input.setAttribute('aria-label','اسم الملف');const dlg=dialog('حفظ باسم',[input],[['حفظ',()=>commit(input.value)]]);input.focus();input.onkeydown=e=>{if(e.key==='Enter'&&commit(input.value))dlg.close();};
  }
  function open(){const files=state.files||[];if(!files.length){notify('لم تحفظ ملفًا في مساحة هذا التدريب بعد.');return;}
    const pick=select('اختر الملف',files.map(f=>[f.name,f.name]),()=>{});
    dialog('فتح ملف محفوظ',[pick],[['فتح',()=>{const f=files.find(f=>f.name===pick.value);state.name=f.name;state.body=structuredClone(f.body);touch();render();notify('تم فتح '+f.name);}]]);}
  function newFile(){dialog('إنشاء ملف جديد',[el('p','احفظ تعديلات الملف الحالي إذا أردت الرجوع إليها.')],[['إنشاء',()=>{state.name='';state.body=fresh().body;touch();render();notify('ملف جديد');}]]);}
  top.append(heading,button('حفظ',()=>save()),button('فتح',open));heading.textContent=title+' · '+(state.name||'بدون اسم');
  r.append(top,tabs,ribbon,work,status);r.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}});
  function tabset(items){tabs.replaceChildren();for(const [name,fn] of [['ملف',()=>ribbon.replaceChildren(group('إدارة الملف',button('جديد',newFile),button('فتح',open),button('حفظ',()=>save()),button('حفظ باسم',()=>save(true))))],...items]){
    const b=button(name,()=>{for(const t of tabs.children)t.setAttribute('aria-pressed','false');b.setAttribute('aria-pressed','true');ribbon.replaceChildren();fn();});tabs.append(b);}
    tabs.children[1]?.click();}
  return {r,work,ribbon,tabs,top,notify,touch,dialog,tabset};
}
