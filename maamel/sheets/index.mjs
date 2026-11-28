import {readCSV,writeCSV} from './csv.mjs';
import {chartData,drawChart} from './charts.mjs';
import {el,button,command,field,group,select,shell} from '../office-common/ui.mjs';
import {initial,evaluate} from './model.mjs';
export function mount(host,input,onChange,task){
 let state=structuredClone(input||initial(task)),active='A1',anchor='A1',edit=false,ui,grid,bar,pos;
 const cols=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
 let rows=50,firstRow=1,extendByTouch=false;
 function reveal(row){
  rows=Math.max(rows,Math.ceil(row/50)*50);
  if(row<firstRow||row>=firstRow+50)firstRow=Math.floor((row-1)/50)*50+1;
 }
 function cell(){return state.body.cells[active]||={raw:''};}
 function write(text){cell().raw=text.slice(0,350);ui.touch();drawGrid();}
 function range(){const a=cols.indexOf(active[0]),b=cols.indexOf(anchor[0]),r=Number(active.slice(1)),s=Number(anchor.slice(1)),ids=[];for(let row=Math.min(r,s);row<=Math.max(r,s);row++)for(let c=Math.min(a,b);c<=Math.max(a,b);c++)ids.push(cols[c]+row);return ids;}
 function format(prop,value){for(const a of range()){state.body.cells[a]||={raw:''};state.body.cells[a][prop]=value;}ui.touch();drawGrid();}
 function choose(a,extend=false){if(!extend)anchor=a;active=a;reveal(Number(a.slice(1)));edit=false;drawGrid();grid.querySelector('[data-address="'+active+'"]')?.focus();}
 function editCell(a,seed){anchor=active=a;edit=true;drawGrid();const i=grid.querySelector('input');i.focus();if(seed!==undefined){i.value=seed;}else i.select();}
 function move(dx,dy,extend=false){const c=Math.max(0,Math.min(cols.length-1,cols.indexOf(active[0])+dx)),row=Math.max(1,Math.min(10000,Number(active.slice(1))+dy));choose(cols[c]+row,extend);}
 function drawGrid(){
  paintCharts();
  pos.value=active;bar.value=state.body.cells[active]?.raw||'';grid.replaceChildren();grid.dir=state.body.dir;
  const selected=new Set(range()),header=el('tr');header.append(el('th',''));const dir=state.body.dir==='rtl'?-1:1;
  function grip(th,horizontal,key){const handle=el('span',null,horizontal?'col-grip':'row-grip');handle.setAttribute('aria-hidden','true');th.append(handle);handle.onclick=e=>e.stopPropagation();handle.onpointerdown=e=>{
    e.preventDefault();e.stopPropagation();const start=horizontal?e.clientX:e.clientY,target=horizontal?state.body.widths:state.body.heights,base=target[key]||(horizontal?85:30);handle.setPointerCapture(e.pointerId);
    handle.onpointermove=ev=>{const delta=horizontal?(ev.clientX-start)*dir:ev.clientY-start,v=Math.round(Math.min(horizontal?340:140,Math.max(horizontal?45:22,base+delta)));target[key]=v;if(horizontal)th.style.minWidth=v+'px';else th.parentElement.style.height=v+'px';};
    handle.onpointerup=()=>{handle.onpointermove=null;ui.touch();drawGrid();};
   };}
  for(const c of cols){const th=el('th',c);th.scope='col';th.style.minWidth=(state.body.widths[c]||85)+'px';if(active[0]===c)th.className='head-active';th.onclick=()=>{anchor=c+'1';choose(c+rows,true);};grip(th,true,c);header.append(th);}grid.append(header);
  const cache=new Map();
  for(let row=firstRow;row<firstRow+50;row++){const tr=el('tr'),rh=el('th',String(row));rh.scope='row';if(+active.slice(1)===row)rh.className='head-active';rh.onclick=()=>{anchor='A'+row;choose('Z'+row,true);};grip(rh,false,row);tr.append(rh);tr.style.height=(state.body.heights[row]||30)+'px';
   for(const c of cols){const a=c+row,td=el('td'),record=state.body.cells[a]||{};td.tabIndex=a===active?0:-1;td.dataset.address=a;td.setAttribute('aria-label',a);td.style.cssText='cursor:cell;border:1px solid #d1dadd;padding:2px 6px;white-space:nowrap;max-width:270px;overflow:hidden;text-overflow:ellipsis;color:#1c313a';
    td.style.textAlign=record.align||(typeof evaluate(state.body.cells,a,new Set(),cache)==='number'?'left':'right');td.style.backgroundColor=record.fill||'white';td.style.color=record.color||'';td.style.fontWeight=record.bold?'700':'400';td.style.fontFamily=record.font||'inherit';td.style.fontStyle=record.italic?'italic':'normal';td.style.textDecoration=record.underline?'underline':'';if(selected.has(a)&&a!==active)td.style.boxShadow='inset 0 0 0 100px #46916d26';td.style.fontSize=(record.size||14)+'px';
    if(a===active){td.style.outline='2px solid #148266';td.style.outlineOffset='-2px';}
    if(a===active&&edit){
     const inp=el('input');inp.maxLength=350;inp.value=record.raw||'';inp.style.width='100%';inp.setAttribute('aria-label','تحرير '+a);let ended=false;
     function commit(){if(ended)return;ended=true;edit=false;cell().raw=inp.value;ui.touch();}
     inp.onblur=()=>{commit();queueMicrotask(()=>{if(!edit&&grid.contains(inp))drawGrid();});};
     inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();commit();move(e.key==='Tab'?1:0,e.key==='Enter'?1:0);}else if(e.key==='Escape'){e.preventDefault();ended=true;choose(a);}};td.append(inp);
    }else {
     td.textContent=String(evaluate(state.body.cells,a,new Set(),cache));td.onclick=e=>{if(extendByTouch){extendByTouch=false;rangeButton.setAttribute('aria-pressed','false');choose(a,true);}else if(e.shiftKey||active!==a)choose(a,e.shiftKey);else editCell(a);};td.ondblclick=()=>editCell(a);
     td.onkeydown=e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const dir=state.body.dir==='rtl'?-1:1;
      const moves={ArrowLeft:[-dir,0],ArrowRight:[dir,0],ArrowUp:[0,-1],ArrowDown:[0,1],Tab:[e.shiftKey?-1:1,0]};
      if(moves[e.key]){e.preventDefault();move(...moves[e.key],e.shiftKey&&e.key!=='Tab');}
      else if(['Delete','Backspace'].includes(e.key)){e.preventDefault();write('');choose(a);}
      else if(e.key==='Enter'||e.key==='F2'){e.preventDefault();editCell(a);}
      else if(e.key.length===1){e.preventDefault();editCell(a,e.key);}
     };
    }
    tr.append(td);
   }grid.append(tr);
  }
 }
 function shades(prop,txt,def){const n=el('input');n.type='color';n.value=def;n.oninput=()=>format(prop,n.value);return field(txt,n);}
 let clipboard=null;
 function copy(){clipboard=range().map(a=>({a,c:structuredClone(state.body.cells[a]||{raw:''})}));ui.notify('نُسخت الخلايا المحددة.');}
 function paste(){if(!clipboard?.length){ui.notify('انسخ خلية أو نطاقًا أولًا.');return;}const origin=clipboard[0].a;
  for(const {a,c} of clipboard){const col=cols.indexOf(active[0])+cols.indexOf(a[0])-cols.indexOf(origin[0]),row=+active.slice(1)+Number(a.slice(1))-Number(origin.slice(1));if(row>=1&&row<=10000&&col>=0&&col<cols.length){const fresh=structuredClone(c);if(fresh.raw.startsWith('='))fresh.raw=fresh.raw.replace(/\b[A-Z][1-9]\d*\b/gi,ref=>{const col2=cols.indexOf(ref[0].toUpperCase())+col-cols.indexOf(a[0]),row2=+ref.slice(1)+row-Number(a.slice(1));return col2<0||col2>=cols.length||row2<1||row2>10000?'#REF!':cols[col2]+row2;});state.body.cells[cols[col]+row]=fresh;}}
  ui.touch();drawGrid();}
 function home(){const rb=ui.ribbon;rb.append(group('الحافظة',command('لصق','▤',paste),command('نسخ','▥',copy,true)),
  group('خط',select('نوع الخط',['Arial','Tahoma','Georgia','monospace'].map(v=>[v,v]),v=>format('font',v)),select('حجم الخط',[12,14,16,18,22,26].map(n=>[n,n]),v=>format('size',Number(v))),command('غامق','B',()=>format('bold',!cell().bold),true),command('مائل','𝑰',()=>format('italic',!cell().italic),true),command('تسطير','U̲',()=>format('underline',!cell().underline),true),shades('color','لون الخط','#143329'),shades('fill','تعبئة','#e1f7de')),
  group('محاذاة',...['right','center','left'].map((v,i)=>command(['يمين','وسط','يسار'][i],['⇥','≡','⇤'][i],()=>format('align',v),true))),
  group('خلايا',sizeField(true),sizeField(false)));}
 function sizeField(horizontal){const title=horizontal?'عرض العمود':'ارتفاع الصف',options=horizontal?[85,110,145,185,230]:[30,40,55,70];return field(title,select(title,options.map(n=>[n,n]),v=>{if(horizontal)state.body.widths[active[0]]=+v;else state.body.heights[active.slice(1)]=+v;ui.touch();drawGrid();}));}
 function layout(){ui.ribbon.append(group('خيارات الورقة',button('تبديل اتجاه الورقة',()=>{state.body.dir=state.body.dir==='rtl'?'ltr':'rtl';ui.touch();drawGrid();})),group('حجم الخلايا',sizeField(true),sizeField(false)));}
 function insertFunction(name){
  const selection=range(),single=selection.length===1;
  const inp=el('input');inp.dir='ltr';inp.value=single?'':selection[0]+':'+selection.at(-1);inp.placeholder='A1:A5';
  ui.dialog(name,[field('النطاق',inp)],[['إدراج',()=>{
   const ref=inp.value.trim().toUpperCase();
   if(!/^[A-Z][1-9]\d{0,4}(?::[A-Z][1-9]\d{0,4})?$/.test(ref)||ref.split(':').some(a=>Number(a.slice(1))>10000)){ui.notify('أدخل نطاقًا صالحًا.');return false;}
   if(!single){const last=selection.at(-1),row=Number(last.slice(1))+1,dest=selection[0][0]+row;if(row>10000||state.body.cells[dest]?.raw){ui.notify('اختر خلية فارغة للنتيجة ثم أدخل النطاق.');return false;}active=anchor=dest;reveal(row);}
   write('='+name+'('+ref+')');
  }]]);
 }
 function functions(){ui.ribbon.append(group('مكتبة الدالات',...['SUM','AVERAGE','MIN','MAX','COUNT'].map(name=>button(name,()=>insertFunction(name)))));}
 function dataTab(){
  const input=el('input');input.type='file';input.accept='.csv,text/csv';input.hidden=true;
  input.onchange=async()=>{
   const file=input.files[0];if(!file)return;
   try{
    if(file.size>650000)throw Error('تجاوز الملف حجم الاستيراد.');
    const cells=readCSV(await file.text());if(!host.isConnected)return;
    ui.dialog('استيراد CSV',[el('p','سيحل محتوى الملف محل خلايا الورقة الحالية. يمكنك إلغاء الاستيراد لحفظها أولًا.')],[['استيراد',()=>{
     state.body.cells=cells;state.body.charts=[];active=anchor='A1';firstRow=1;ui.touch();render();
    }]]);
   }catch(err){ui.notify(err.message);}finally{input.value='';}
  };
  const exportCSV=()=>{
   const blob=new Blob([writeCSV(state.body.cells)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download=(state.body.sheetName||'ورقة')+'.csv';ui.r.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  };
  ui.ribbon.append(group('ملفات CSV',button('استيراد CSV',()=>input.click()),button('تصدير CSV',exportCSV),input));
 }
 function rename(){const inp=el('input');inp.maxLength=40;inp.value=state.body.sheetName;ui.dialog('اسم ورقة العمل',[inp],[['تسمية',()=>{if(!inp.value.trim())return false;state.body.sheetName=inp.value.trim();ui.touch();render();}]]);}
 let chartHost;
 function paintCharts(){
  if(!chartHost)return;chartHost.replaceChildren();
  for(const chart of state.body.charts||[]){
   const section=el('section'),plot=el('div',null,'sheet-chart');
   section.append(el('h3',chart.title),plot,button('تعديل المخطط',()=>chartDialog(chart)),button('حذف المخطط',()=>{state.body.charts.splice(state.body.charts.indexOf(chart),1);ui.touch();paintCharts()}));
   chartHost.append(section);drawChart(plot,chart,chartData(state.body.cells,chart.source));
  }
 }
 function chartDialog(existing){
  const source=el('input'),title=el('input'),msg=el('output');
  title.value=existing?.title||'مخطط البيانات';title.maxLength=80;source.dir='ltr';source.value=existing?.source||anchor+':'+active;
  const type=select('نوع المخطط',[['column','أعمدة'],['line','خطي']],()=>{});type.value=existing?.kind||'column';
  ui.dialog(existing?'تعديل المخطط':'إدراج مخطط',[field('عنوان المخطط',title),field('نطاق البيانات',source),type,msg],[['تطبيق',()=>{
   const chart={title:title.value.trim()||'مخطط البيانات',source:source.value.trim().toUpperCase(),kind:type.value};
   try{const d=chartData(state.body.cells,chart.source);if(!d.series.some(s=>s.points.some(Number.isFinite)))throw Error('اختر نطاقًا يحتوي على قيم رقمية.')}catch(err){msg.textContent=err.message;return false;}
   if(existing)Object.assign(existing,chart);else(state.body.charts||=[]).push(chart);
   ui.touch();paintCharts();
  }]]);
 }
 let rangeButton;
 function render(){edit=false;extendByTouch=false;rows=Object.keys(state.body.cells).reduce((max,a)=>Math.max(max,Number(a.slice(1))||1),50);reveal(+active.slice(1));ui.work.replaceChildren();ui.tabset([['الصفحة الرئيسية',home],['تخطيط الصفحة',layout],['صيغ',functions],['بيانات',dataTab],['إدراج',()=>ui.ribbon.append(group('مخططات',button('إدراج مخطط',()=>chartDialog()))) ]]);
  pos=el('input');pos.className='address';pos.setAttribute('aria-label','مربع الاسم');pos.dir='ltr';pos.onkeydown=e=>{if(e.key!=='Enter')return;const a=pos.value.trim().toUpperCase();if(/^[A-Z][1-9]\d{0,4}$/.test(a)&&Number(a.slice(1))<=10000)choose(a);else{pos.value=active;ui.notify('أدخل عنوانًا بين A1 وZ10000.');}};bar=el('input');bar.setAttribute('aria-label','شريط الصيغة');bar.maxLength=350;bar.dir='auto';bar.style.flex='1';bar.onchange=()=>write(bar.value);bar.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();write(bar.value);choose(active);}};
  const formula=el('div',null,'formula');formula.append(pos,el('span','ƒx','fx'),bar);grid=el('table');grid.style.cssText='border-collapse:collapse;background:white;min-width:100%;font-size:14px';const scroll=el('div',null,'gridbox');scroll.append(grid);
  const sheetTab=button(state.body.sheetName,rename);sheetTab.className='sheet-tab';sheetTab.title='إعادة تسمية ورقة العمل';const controls=el('div',null,'sheet-navigation');
  rangeButton=button('تحديد نطاق باللمس',()=>{extendByTouch=!extendByTouch;rangeButton.setAttribute('aria-pressed',String(extendByTouch));if(extendByTouch){anchor=active;ui.notify('اضغط آخر خلية في النطاق.');}});
  controls.append(rangeButton,button('الصفوف السابقة',()=>choose(active[0]+Math.max(1,firstRow-50),extendByTouch)),button('الصفوف التالية',()=>choose(active[0]+Math.min(10000,firstRow+50),extendByTouch)));
  chartHost=el('div');ui.work.append(formula,controls,scroll,sheetTab,chartHost);drawGrid();
 }
 ui=shell(host,'الجداول الإلكترونية',state,onChange,()=>initial(task),render);render();
}
