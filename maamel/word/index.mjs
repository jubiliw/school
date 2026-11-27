import {newTable,changeTable} from './table.mjs';
import {el,button,command,field,group,select,shell} from '../office-common/ui.mjs';
import {initial,plain} from './model.mjs';
const fontPx=[0,10,13,16,18,24,32,48];
const safeColor=v=>/^(#[a-f0-9]{3,8}|rgb\([\d., %]+\)|yellow)$/i.test(v||'')?v:'';
function paraStyle(n,p){n.style.textAlign=['left','right','center','justify'].includes(p.align)?p.align:'';n.style.backgroundColor=safeColor(p.fill);if(p.border){const edge=['Top','Bottom','Left','Right'].includes(p.edge)?p.edge:'';n.style['border'+edge]='1px solid #47616a';}if(p.dir==='ltr'||p.dir==='rtl')n.dir=p.dir;}
function writeDoc(doc,ps){
 doc.replaceChildren();let list=null;
 for(const p of ps){
  if(p.type==='table'){list=null;doc.append(renderTable(p));continue;}
  const numbered=['ol','ul'].includes(p.list);if(!numbered||list?.tagName.toLowerCase()!==p.list)list=null;
  if(numbered&&!list){list=el(p.list);doc.append(list);}
  const n=el(numbered?'li':'p');paraStyle(n,p);
  for(const run of p.runs||[]){const s=el('span',run.text);s.style.fontWeight=run.bold?'bold':'';s.style.fontStyle=run.italic?'italic':'';s.style.textDecoration=run.underline?'underline':'';
   s.style.color=safeColor(run.color);s.style.backgroundColor=safeColor(run.highlight);if(run.font)s.style.fontFamily=String(run.font).slice(0,64);if(run.size)s.style.fontSize=Math.min(80,Math.max(8,Number(run.size)))+'pt';n.append(s);}
  if(!n.textContent)n.append(el('br'));(list||doc).append(n);
 }
}
function renderTable(model){
 const table=el('table',null,'word-table');table.dataset.border=model.border||'solid';
 for(const row of model.rows){const tr=table.insertRow();for(const cell of row){const td=tr.insertCell();td.colSpan=cell.span||1;td.style.backgroundColor=safeColor(cell.fill);writeDoc(td,cell.blocks);}}
 return table;
}
function readTable(table){
 return {type:'table',border:table.dataset.border||'solid',rows:Array.from(table.rows,row=>Array.from(row.cells,td=>({span:td.colSpan,fill:safeColor(td.style.backgroundColor),blocks:readDoc(td)})))};
}
function readDoc(doc){
 const ps=[];let p;
 function begin(n,list){p={runs:[]};if(list)p.list=list;if(n?.style.textAlign)p.align=n.style.textAlign;if(n?.style.border)p.border=true;else if(n){const edge=['Top','Bottom','Left','Right'].find(k=>n.style['border'+k+'Style']==='solid');if(edge){p.border=true;p.edge=edge;}}if(n?.dir)p.dir=n.dir;if(n?.style.backgroundColor)p.fill=n.style.backgroundColor;ps.push(p);}
 function walk(n,style={},list=null){
  if(n.nodeType===3){if(!p)begin(null,list);if(n.nodeValue)p.runs.push({text:n.nodeValue,...style});return;}
  if(n.nodeType!==1)return;const tag=n.tagName.toLowerCase(),css=n.style;
  if(tag==='table'){ps.push(readTable(n));p=null;return;}
  if(tag==='br') {if(n.nextSibling)begin(null,list);return;}
  if(['ol','ul'].includes(tag)){p=null;for(const child of n.childNodes)walk(child,style,tag);p=null;return;}
  const block=['p','div','li'].includes(tag);if(block)begin(n,list);
  const next={...style};if(['b','strong'].includes(tag)||css.fontWeight==='bold'||Number(css.fontWeight)>=600)next.bold=true;
  if(['i','em'].includes(tag)||css.fontStyle==='italic')next.italic=true;if(tag==='u'||(css.textDecoration+' '+css.textDecorationLine).includes('underline'))next.underline=true;
  if(css.color||tag==='font'&&n.color)next.color=css.color||n.color;
  if(!block&&css.backgroundColor)next.highlight=css.backgroundColor;
  if(css.fontFamily||tag==='font'&&n.face)next.font=css.fontFamily||n.face;
  if(css.fontSize){const z=parseFloat(css.fontSize);if(Number.isFinite(z))next.size=Math.round(css.fontSize.endsWith('px')?z*.75:z);}else if(tag==='font'&&n.size)next.size=Math.round((fontPx[+n.size]||16)*.75);
  for(const c of n.childNodes)walk(c,next,list);if(block)p=null;
 }
 for(const n of doc.childNodes)walk(n);if(!ps.length)begin(null);return ps;
}
export function mount(host,input,onChange,task,drive){
 const state=structuredClone(input||initial(task));let ui,doc,savedRange,zoom=100,words;
 function capture(){const sel=window.getSelection();if(sel.rangeCount&&doc.contains(sel.anchorNode)&&doc.contains(sel.focusNode))savedRange=sel.getRangeAt(0).cloneRange();}
 function restore(){doc.focus();if(savedRange&&doc.contains(savedRange.commonAncestorContainer)){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);}}
 function sync(){state.body.paragraphs=readDoc(doc);ui.touch();words.textContent=state.body.paragraphs.map(plain).join(' ').trim().split(/\s+/).filter(Boolean).length+' كلمة';capture();}
 function exec(cmd,value){restore();document.execCommand(cmd,false,value);sync();}
 function formatSize(v){restore();document.execCommand('styleWithCSS',false,false);document.execCommand('fontSize',false,'7');for(const n of doc.querySelectorAll('font[size="7"]')){n.removeAttribute('size');n.style.fontSize=v+'pt';}sync();}
 function blockStyle(key,value){restore();const sel=window.getSelection();if(!sel.rangeCount)return;const range=sel.getRangeAt(0);const nodes=[...doc.querySelectorAll('p,li,div')].filter(p=>range.intersectsNode(p));for(const n of nodes)n.style[key]=value;sync();}
 function color(label,fn,def){const c=el('input');c.type='color';c.value=def;c.onchange=()=>fn(c.value);return field(label,c);}
 let clipboard='';
 function copy(cut=false){restore();const selection=window.getSelection();if(!selection?.toString())return ui.notify('حدّد نصًا أولًا.');clipboard=selection.toString();if(cut)exec('delete');ui.notify(cut?'قُص النص المحدد':'نُسخ النص المحدد');}
 function selectedParas(){restore();const sel=window.getSelection();if(!sel.rangeCount)return [];const rg=sel.getRangeAt(0);return [...doc.querySelectorAll('p,li,div')].filter(n=>rg.intersectsNode(n));}
 function border(which){for(const p of selectedParas()){p.style.border='';for(const k of ['Top','Bottom','Left','Right'])p.style['border'+k]='';if(which!=='none')p.style['border'+(which==='all'?'':which)]='1px solid #425563';}sync();}
 function direction(dir){for(const p of selectedParas())p.dir=dir;sync();}
 function activeCell(){
  const node=savedRange?.startContainer,cell=(node?.nodeType===1?node:node?.parentElement)?.closest('td');
  return cell&&doc.contains(cell)?cell:null;
 }
 function insertTable(){
  const rows=el('input'),cols=el('input');
  for(const [field,max,value] of [[rows,200,3],[cols,30,3]]){field.type='number';field.min='1';field.max=String(max);field.value=String(value);}
  ui.dialog('إدراج جدول',[field('عدد الأعمدة',cols),field('عدد الصفوف',rows)],[['إدراج',()=>{
   try{
    const table=renderTable(newTable(rows.valueAsNumber,cols.valueAsNumber));
    setTimeout(()=>{restore();exec('insertHTML',table.outerHTML+'<p><br></p>');},0);
   }catch(error){ui.notify(error.message);return false;}
  }]]);
 }
 function editTable(op,value){
  const td=activeCell();if(!td){ui.notify('ضع المؤشر داخل خلية من الجدول.');return;}
  const table=td.closest('table'),model=readTable(table),row=td.parentElement.rowIndex,col=td.cellIndex;
  try{if(op==='border')model.border=value;else if(op==='fill')model.rows[row][col].fill=value;else changeTable(model,row,col,op);}
  catch(error){ui.notify(error.message);return;}
  const next=renderTable(model);table.replaceWith(next);
  const range=document.createRange();range.selectNodeContents(next.rows[row].cells[col]);range.collapse(true);savedRange=range;restore();sync();
 }
 function tableTools(){ui.ribbon.append(group('جدول',button('إدراج جدول',insertTable),button('صف أسفل',()=>editTable('row')),button('عمود تالٍ',()=>editTable('column'))),
  group('خلايا',button('دمج مع الخلية التالية',()=>editTable('merge')),button('تقسيم الخلية المدمجة',()=>editTable('split'))),
  group('تنسيق الجدول',select('حدود الجدول',[['solid','حدود متصلة'],['dashed','حدود متقطعة'],['none','بلا حدود']],v=>editTable('border',v)),color('تظليل الخلية',v=>editTable('fill',v),'#fff1ac')));}
 function home(){
  const cmd=(label,glyph,action)=>command(label,glyph,action,true);
  const fonts=select('نوع الخط',['Arial','Tahoma','Georgia','serif','monospace'].map(s=>[s,s]),v=>exec('fontName',v));
  const sizes=select('حجم الخط',[10,11,12,14,16,18,20,24,32].map(v=>[v,v]),formatSize);sizes.value='14';
  ui.ribbon.append(
   group('الحافظة',command('لصق','▤',()=>{if(clipboard)exec('insertText',clipboard);else ui.notify('انسخ نصًا أولًا.');}),cmd('قص','✂',()=>copy(true)),cmd('نسخ','▥',()=>copy())),
   group('خط',fonts,sizes,cmd('غامق','B',()=>exec('bold')),cmd('مائل','𝑰',()=>exec('italic')),cmd('تسطير','U̲',()=>exec('underline')),color('لون الخط',v=>exec('foreColor',v),'#10365e'),command('تمييز أصفر','▰',()=>exec('hiliteColor','#ffff00'))),
   group('فقرة',cmd('يمين','⇥',()=>exec('justifyRight')),cmd('توسيط','≡',()=>exec('justifyCenter')),cmd('يسار','⇤',()=>exec('justifyLeft')),cmd('ضبط','☰',()=>exec('justifyFull')),cmd('تعداد نقطي','•☰',()=>exec('insertUnorderedList')),cmd('تعداد رقمي','¹☰',()=>exec('insertOrderedList')),
    select('الحدود',[['','الحدود ▾'],['Top','حد علوي'],['Bottom','حد سفلي'],['Right','حد أيمن'],['Left','حد أيسر'],['all','حدود خارجية'],['none','بلا حدود']],border),color('تظليل الفقرة',v=>blockStyle('backgroundColor',v),'#d7eee1'),select('اتجاه النص',[['rtl','من اليمين إلى اليسار'],['ltr','من اليسار إلى اليمين']],direction)),
   group('تحرير',command('بحث','⌕',find),cmd('تراجع','↶',()=>exec('undo')),cmd('إعادة','↷',()=>exec('redo'))));
 }
 let searchPanel,clearMarks=()=>{};
 function find(){
  if(searchPanel?.isConnected){searchPanel.querySelector('input').focus();return;}
  const panel=searchPanel=el('aside',null,'word-search'),input=el('input'),results=el('div'),count=el('output');
  input.type='search';input.setAttribute('aria-label','بحث في المستند');count.setAttribute('aria-live','polite');
  function close(){clearMarks();doc.removeEventListener('input',update);panel.remove();searchPanel=null;}
  function update(){
   clearMarks();results.replaceChildren();const ranges=[],q=input.value.trim();
   if(q)for(const p of doc.querySelectorAll('p,li,div')){
    const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),parts=[];let n,full='';
    while(n=walker.nextNode()){parts.push({n,start:full.length});full+=n.data;}
    let from=0,index;
    while((index=full.toLocaleLowerCase().indexOf(q.toLocaleLowerCase(),from))!==-1){
     const end=index+q.length,lo=parts.find(x=>x.start+x.n.length>index),hi=parts.find(x=>x.start+x.n.length>=end);
     if(!lo||!hi)break;
     const range=document.createRange();range.setStart(lo.n,index-lo.start);range.setEnd(hi.n,end-hi.start);ranges.push(range);
     results.append(button(full.slice(Math.max(0,index-18),end+18),()=>{savedRange=range.cloneRange();restore();p.scrollIntoView({block:'nearest'});}));
     from=end;
    }
   }
   if(globalThis.CSS?.highlights&&globalThis.Highlight){CSS.highlights.set('maamel-matches',new Highlight(...ranges));clearMarks=()=>CSS.highlights.delete('maamel-matches');}
   count.textContent=q?'عدد النتائج: '+ranges.length:'';
  }
  panel.append(el('strong','التنقل في المستند'),input,count,button('إغلاق البحث',close),results);ui.work.prepend(panel);input.oninput=update;doc.addEventListener('input',update);input.focus();
 }
 function render(){clearMarks();savedRange=null;ui.work.replaceChildren();ui.tabset([['الصفحة الرئيسية',home],['إدراج',()=>ui.ribbon.append(group('جداول',button('جدول',insertTable)),group('الرموز',...['★','✓','©','♥','←','•'].map(s=>button(s,()=>exec('insertText',s)))))],['أدوات الجدول',tableTools]]);
  doc=el('article',null,'paper');doc.contentEditable='true';doc.setAttribute('role','textbox');doc.setAttribute('aria-label','صفحة المستند');doc.setAttribute('aria-multiline','true');doc.dir='auto';doc.style.cssText='min-height:410px;max-width:780px;outline-color:#258576;white-space:pre-wrap;overflow-wrap:anywhere;font:14pt/1.65 Arial,sans-serif';writeDoc(doc,state.body.paragraphs);doc.oninput=sync;
  doc.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();capture();find();}});
  doc.onpaste=e=>{e.preventDefault();exec('insertText',(e.clipboardData?.getData('text/plain')||'').slice(0,50000));};doc.ondrop=e=>e.preventDefault();
  doc.onkeyup=capture;doc.onpointerup=capture;doc.onfocusout=capture;ui.ribbon.onpointerdown=e=>{capture();if(e.target.tagName==='BUTTON')e.preventDefault();};
  words=el('span',state.body.paragraphs.map(plain).join(' ').trim().split(/\s+/).filter(Boolean).length+' كلمة');const zoomer=el('input');zoomer.type='range';zoomer.min=75;zoomer.max=150;zoomer.step=5;zoomer.value=zoom;zoomer.oninput=()=>{zoom=+zoomer.value;doc.style.zoom=zoom+'%';};const ruler=el('div',null,'ruler');ruler.setAttribute('aria-hidden','true');for(let n=0;n<16;n++)ruler.append(el('span',String(n)));
  const foot=el('div',null,'ostatus wordfoot');foot.append(el('span','الصفحة ١'),words,field('تكبير العرض',zoomer));const quick=el('div',null,'word-touchbar');
  const toggle=button('أدوات إضافية',()=>{const open=ui.r.classList.toggle('expanded-tools');toggle.setAttribute('aria-expanded',String(open));});
  quick.append(command('غامق','B',()=>exec('bold'),true),command('مائل','𝑰',()=>exec('italic'),true),command('تسطير','U̲',()=>exec('underline'),true),color('لون',v=>exec('foreColor',v),'#16375b'),button('بحث',find),toggle);
  quick.onpointerdown=e=>{capture();if(e.target.closest('button'))e.preventDefault()};
  ui.work.append(quick,ruler,doc,foot);
 }
 ui=shell(host,'معالجة النصوص',state,onChange,()=>initial(task),render,drive);render();return ()=>clearMarks();
}
