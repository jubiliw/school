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
export function shell(host, title, state, change, fresh, render, tasks) {
  host.replaceChildren(); const r=el('section',null,'ofc');r.dir='rtl';host.append(r);
  const style=el('style',`
.ofc{font:15px/1.5 system-ui,sans-serif;color:#172c35;background:#edf2f5;border:1px solid #c7d6d8;border-radius:12px;overflow:hidden;isolation:isolate}
.ofc *{box-sizing:border-box}.ofc .obar,.ofc .oribbon,.ofc .otabs,.ofc .ostatus{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 11px}
.ofc .obar{background:#1d4d58;color:white}.ofc .obar strong{margin-inline-end:auto}.ofc .oribbon{background:white;border-block:1px solid #ccd7dc}.ofc .otabs{background:#f4f8fa}
.ofc button,.ofc select,.ofc input{font:inherit;color:#203d46;max-width:100%}.ofc button,.ofc select{border:1px solid #b4c9ce;border-radius:5px;padding:4px 8px;background:#fff;cursor:pointer;min-height:33px}.ofc button:hover{background:#e4f5ee}
.ofc button:focus-visible,.ofc select:focus-visible,.ofc input:focus-visible{outline:3px solid #168077;outline-offset:1px}
.ofc [aria-pressed=true]{background:#d6ebe6;border-color:#399077}.ofc .owork{padding:14px;min-height:260px;overflow:auto}
.ofc .paper{margin:auto;background:#fff;border:1px solid #ccd8da;padding:clamp(10px,4vw,42px);color:#182b32}
.ofc .ostatus{background:#f7fbfa;color:#38535b;font-size:.85rem;min-height:32px}
.ofc dialog{color:#193340;background:white;border:1px solid #a7c1c5;border-radius:12px;padding:20px;max-width:min(430px,94%);box-shadow:0 15px 80px #0003}.ofc dialog::backdrop{background:#122d3759}.ofc dialog input:not([type=color]){width:100%;padding:7px;margin:8px 0}
.ofc .odlg-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.ofc .oribbon label{display:inline-flex;align-items:center;gap:3px}.ofc input[type=color]{width:28px;height:28px;padding:0}.ofc [hidden]{display:none!important}
`);r.append(style);
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
  function tabset(items){tabs.replaceChildren();for(const [name,fn] of [['ملف',()=>ribbon.replaceChildren(button('جديد',newFile),button('فتح',open),button('حفظ',()=>save()),button('حفظ باسم',()=>save(true)))],...items]){
    const b=button(name,()=>{for(const t of tabs.children)t.setAttribute('aria-pressed','false');b.setAttribute('aria-pressed','true');ribbon.replaceChildren();fn();});tabs.append(b);}
    tabs.children[1]?.click();}
  return {r,work,ribbon,tabs,notify,touch,dialog,tabset};
}
