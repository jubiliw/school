import {windowView} from './window.mjs';
import {HOME,pages,search,navigate,save,initial,safety,tabAction} from './model.mjs';
export function mount(host,state,onChange,task){
 let s={...initial(),...state};host.replaceChildren();const box=document.createElement('section');box.dir='rtl';box.className='wb-lab';host.append(box);
 box.innerHTML=windowView;
 if(task==='safety'){
  const style=box.querySelector('style');box.replaceChildren(style);const h=document.createElement('h3');h.textContent='السلامة على الإنترنت';box.append(h);
  let draft={...s.safetyDraft};const fields=safety.map((item,index)=>{const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=item.question;field.append(legend);
   item.options.forEach((option,i)=>{const label=document.createElement('label'),radio=document.createElement('input');label.style.display='inline-flex';label.style.marginInlineEnd='.8rem';radio.type='radio';radio.name='safety-'+index;radio.checked=draft[index]===i;radio.onchange=()=>{draft={...draft,[index]:i};s={...s,safetyDraft:draft};onChange(s);};label.append(radio,option);field.append(label);});return field;});box.append(...fields);
  const button=document.createElement('button'),msg=document.createElement('output');button.textContent='حفظ الإجابات';button.onclick=()=>{s={...s,safetyAnswers:{...draft}};onChange(s);msg.textContent='حُفظت الإجابات.';};box.append(button,msg);return;
 }
 const $=q=>box.querySelector(q), article=$('article'), address=$('[name=url]');let clip='';
 const change=n=>{s=n;onChange(s)}, status=m=>$('output').textContent=m;
 const btn=(parent,label,click)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=click;parent.append(b);return b;};
 const txt=(el,val)=>{const node=document.createElement(el);node.textContent=val;article.append(node);return node;};
 function go(u){change(navigate(s,u));draw();}
 function visit(value){const v=value.trim();if(!v)return;const exact=pages.find(p=>p.url.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'')===v.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''));go(exact?.url||(v.includes('://')?v:HOME+'?q='+encodeURIComponent(v)));}
 function drawTabs(){
  const tabs=s.tabs||[null], current=s.tabIndex||0, holder=$('[data-tabs]');holder.replaceChildren();
  tabs.forEach((t,i)=>{const url=i===current?s.history[s.cursor]:t.history[t.cursor];const name=pages.find(p=>p.url===url)?.title||(url.startsWith(HOME)?'بحث معامل':'صفحة ويب');const b=btn(holder,name,()=>{change(tabAction(s,'select',i));draw();});b.setAttribute('role','tab');b.setAttribute('aria-selected',String(i===current));});
  $('[data-close]').disabled=tabs.length===1;$('[data-add]').disabled=tabs.length>=8;
 }
 $('[data-add]').onclick=()=>{change(tabAction(s,'add'));draw();address.focus();address.select();};
 $('[data-close]').onclick=()=>{change(tabAction(s,'close'));draw();};
 $('[data-reload]').onclick=()=>{draw();status('حُدّثت الصفحة من مكتبة التدريب.');};
 function draw(){drawTabs();const url=s.history[s.cursor];address.value=url;article.replaceChildren();$('[data-back]').disabled=s.cursor===0;$('[data-next]').disabled=s.cursor>=s.history.length-1;
 if(url.startsWith(HOME)){let q='';try{q=decodeURIComponent((url.split('?q=')[1]||''));}catch{}txt('h3','البحث في المكتبة التعليمية');const f=document.createElement('form'),input=document.createElement('input');input.placeholder='اكتب كلمات البحث';input.setAttribute('aria-label','كلمات البحث');input.value=q;f.append(input);const sub=document.createElement('button');sub.textContent='بحث';f.append(sub);f.onsubmit=e=>{e.preventDefault();if(input.value.trim())go(HOME+'?q='+encodeURIComponent(input.value.trim()));};article.append(f);if(q){const results=search(q);txt('p',results.length+' نتائج');results.forEach(p=>{btn(article,p.title+' · '+p.publisher,()=>go(p.url)).className='result';txt('small',p.url).className='site-source';});}return;}
 const page=pages.find(p=>p.url===url);if(!page){txt('p','هذا العنوان خارج مكتبة التدريب. استخدم البحث للعثور على صفحة متاحة.');return;}
 txt('h3',page.title);txt('small',page.publisher);txt('p',page.text);btn(article,'نسخ مقتطف',()=>{clip=window.getSelection()?.toString().trim()||page.text;status('نُسخ المقتطف.');});btn(article,'إدراج عنوان المصدر',()=>{$('[data-source]').value=page.url;change({...s,source:page.url});});for(const i of page.links||[])btn(article,pages[i].title,()=>go(pages[i].url));}
 $('form').onsubmit=e=>{e.preventDefault();visit(address.value);};$('[data-back]').onclick=()=>{change({...s,cursor:s.cursor-1});draw();};$('[data-next]').onclick=()=>{change({...s,cursor:s.cursor+1});draw();};$('[data-home]').onclick=()=>go(HOME);
 for(const [key,sel]of [['filename','[data-file]'],['source','[data-source]'],['note','textarea']]){const el=$(sel);el.value=s[key];el.oninput=()=>change({...s,[key]:el.value});}
 $('[data-paste]').onclick=()=>{if(!clip)return status('انسخ مقتطفًا من الصفحة أولًا.');const a=$('textarea');a.setRangeText(clip,a.selectionStart,a.selectionEnd,'end');change({...s,note:a.value});status('أُلصق النص.');};
 $('[data-save]').onclick=()=>{if(!s.filename.trim())return status('اكتب اسم الملف أولًا.');change(save(s));status('حُفظ المستند باسم '+s.filename);};draw();
}
