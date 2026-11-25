import {photoWindow} from './window.mjs';
import {assets,initial,fresh,edit,mark,save} from './model.mjs';
import {render} from './art.mjs';
export function mount(host,state,onChange){
 let s={...initial(),...state},mode='',corner=null;host.replaceChildren();const root=document.createElement('section');host.append(root);root.dir='rtl';root.className='mx-photos';
 root.innerHTML=photoWindow;
 const $=q=>root.querySelector(q),c=$('.mx-stage canvas'),sel=$('select'),note=t=>$('output').textContent=t;
 const change=v=>{s=v;onChange(s);}, btn=(where,label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;where.append(b);return b;};
 const e=()=>s.edits[s.selected]||s.saved[s.selected]||fresh();
 function redraw(){if(!s.selected){c.hidden=true;return;}c.hidden=false;render(c,s.selected,e(),Boolean(mode));}
 function patch(d){if(!s.selected)return;change(edit(s,s.selected,{...e(),...d}));redraw();}
 function options(){
  const available=assets.filter(a=>!s.deleted.includes(a.id));sel.replaceChildren();available.forEach(a=>sel.add(new Option(a.name,a.id)));
  sel.value=s.selected||'';const at=sel.selectedIndex;
  $('[data-prev]').disabled=at<=0;$('[data-next]').disabled=at<0||at===available.length-1;redraw();
 }
 for(const [selector,step] of [['[data-prev]',-1],['[data-next]',1]]){
  $(selector).onclick=()=>{const next=sel.options[sel.selectedIndex+step];if(!next)return;change({...s,selected:next.value});options();tools('adjust');};
 }
 function leave(){mode='';corner=null;$('.mx-points').replaceChildren();redraw();}
 function modeTo(m){if(!s.selected)return;mode=m;corner=null;const msg=m==='crop'?'اسحب مستطيلاً حول الجزء المطلوب. يمكنك أيضًا إدخال الحدود بالنسبة المئوية.':'حدّد موضع العيب على الصورة.';note(msg);const points=$('.mx-points');points.replaceChildren();
 if(m==='crop'){const ins=['يسار','أعلى','عرض','ارتفاع'].map((l,i)=>{const lab=document.createElement('label'),inp=document.createElement('input');lab.textContent=l+' %';inp.type='number';inp.style.width='4.3rem';inp.min=i<2?0:1;inp.max=100;inp.value=[5,5,60,65][i];lab.append(inp);points.append(lab);return inp;});btn(points,'تطبيق حدود القص',()=>{const [x,y,w,h]=ins.map(n=>Number(n.value)/100);if([x,y,w,h].every(Number.isFinite)&&x>=0&&y>=0&&w>0&&h>0&&x+w<=1&&y+h<=1){mode='';patch({crop:[x,y,w,h]});leave();}else note('تحقق من أن المستطيل يقع داخل الصورة.');});}
 else {const a=assets.find(x=>x.id===s.selected),coords=m==='eyes'?a?.eyes:a?.spots;(coords||[]).forEach(([x,y],i)=>btn(points,'تحديد الموضع '+(i+1),()=>fix(x,y)));}redraw();}
 function fix(x,y){const next=mark(s,mode,x,y);if(next!==s){change(next);redraw();note('عُدّل الموضع المحدد.');}else note('لم يقع المؤشر على عيب من النوع المحدد.');}
 const pos=ev=>{const r=c.getBoundingClientRect();return [Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height))];};
 c.onpointerdown=ev=>{if(!mode)return;if(mode==='crop'){corner=pos(ev);c.setPointerCapture(ev.pointerId);}else fix(...pos(ev));};
 c.onpointermove=ev=>{if(mode!=='crop'||!corner)return;redraw();const p=pos(ev),g=c.getContext('2d');g.strokeStyle='white';g.lineWidth=3;g.strokeRect(corner[0]*c.width,corner[1]*c.height,(p[0]-corner[0])*c.width,(p[1]-corner[1])*c.height);};
 c.onpointerup=ev=>{if(!corner||mode!=='crop')return;const [x,y]=pos(ev),[a,b]=corner;corner=null;if(Math.abs(x-a)<.03||Math.abs(y-b)<.03)return;mode='';patch({crop:[Math.min(x,a),Math.min(y,b),Math.abs(x-a),Math.abs(y-b)]});leave();note('تم القص.');};
 sel.onchange=()=>{change({...s,selected:sel.value});options();leave();tools('adjust');};
 const side=$('aside');
 function tools(tab){leave();side.replaceChildren();root.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
 if(tab==='crop'){btn(side,'تدوير ٩٠°',()=>patch({rotation:(e().rotation+1)%4}));btn(side,'تحديد منطقة القص',()=>modeTo('crop'));}
 else if(tab==='filters'){for(const [k,t]of [['none','الأصلي'],['vanilla','فانيلا · تدرج رمادي'],['arctic','القطب الشمالي'],['desert','الصحراء']]){const b=btn(side,t,()=>{patch({filter:k});tools('filters');note('المرشح الحالي: '+t);});b.className='filter-choice';b.setAttribute('aria-pressed',String(e().filter===k));const preview=document.createElement('canvas');preview.setAttribute('aria-hidden','true');const original=document.createElement('canvas');if(s.selected){render(original,s.selected,{...e(),filter:k});preview.width=72;preview.height=44;preview.getContext('2d').drawImage(original,0,0,72,44);}b.prepend(preview);}}
 else{for(const [k,t]of [['light','السطوع'],['color','اللون']]){const label=document.createElement('label'),input=document.createElement('input');label.textContent=t;input.type='range';input.min=k==='light'?40:0;input.max=160;input.value=e()[k];input.oninput=()=>{mode='';patch({[k]:Number(input.value)});};label.append(input);side.append(label);}
 btn(side,'أبيض وأسود',()=>{patch({color:0});tools('adjust');});btn(side,'إصلاح الأخطاء',()=>modeTo('spot'));btn(side,'العين الحمراء',()=>modeTo('eyes'));}}
 for(const [t,l]of [['crop','قص وتدوير'],['filters','عوامل تصفية'],['adjust','تعديلات']])btn($('nav'),l,()=>tools(t)).dataset.tab=t;
 $('[data-save]').onclick=()=>{if(!s.selected)return;change(save(s,s.selected));leave();note('حُفظت تعديلات الصورة.');};
 function listCopies(){const list=$('[data-copies]');list.replaceChildren();for(const copy of s.copies){const item=assets.find(a=>a.id===copy.id);btn(list,copy.album+' / '+item.name,()=>{change(edit({...s,selected:item.id,deleted:s.deleted.filter(i=>i!==item.id)},item.id,structuredClone(copy.edit)));options();tools('adjust');note('فُتحت النسخة في المحرر.');});}}
 $('[data-copy]').onclick=()=>{const album=$('[data-album]').value.trim();if(!album)return note('اكتب اسم الألبوم.');if(!s.selected)return;change({...s,copies:[...s.copies,{id:s.selected,album,edit:structuredClone(e())}].slice(-30)});listCopies();note('حُفظت نسخة في '+album);};
 $('[data-reset]').onclick=()=>{if(!s.selected)return;patch(s.saved[s.selected]||fresh());tools('adjust');note('عادت الصورة إلى آخر نسخة محفوظة.');};
 $('[data-del]').onclick=()=>{if(!s.selected)return;const deleted=[...s.deleted,s.selected];change({...s,deleted,selected:assets.find(a=>!deleted.includes(a.id))?.id||''});options();tools('adjust');trash();note('نُقلت الصورة إلى السلة.');};
 function trash(){const t=$('[data-trash]');t.replaceChildren();for(const id of s.deleted)btn(t,'استعادة '+assets.find(a=>a.id===id).name,()=>{change({...s,selected:id,deleted:s.deleted.filter(x=>x!==id)});trash();options();tools('adjust');});}
 $('[data-bin]').onclick=()=>{trash();if(!s.deleted.length)note('السلة فارغة.');};options();tools('adjust');listCopies();
}
