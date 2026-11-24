import {el,button,field,select,shell} from '../office-common/ui.mjs';
import {initial,evaluate} from './model.mjs';
export function mount(host,input,onChange,task){
 let state=structuredClone(input||initial(task)),active='A1',edit=false,ui,grid,bar,pos;
 const cols=[...'ABCDEFGH'];
 function cell(){return state.body.cells[active]||={raw:''};}
 function write(text){cell().raw=text.slice(0,350);ui.touch();drawGrid();}
 function format(prop,value){cell()[prop]=value;ui.touch();drawGrid();}
 function choose(a){active=a;edit=false;drawGrid();grid.querySelector('[data-address="'+active+'"]')?.focus();}
 function editCell(a,seed){active=a;edit=true;drawGrid();const i=grid.querySelector('input');i.focus();if(seed!==undefined){i.value=seed;}else i.select();}
 function move(dx,dy){const c=Math.max(0,Math.min(7,cols.indexOf(active[0])+dx)),row=Math.max(1,Math.min(20,Number(active.slice(1))+dy));choose(cols[c]+row);}
 function drawGrid(){
  pos.textContent=active;bar.value=state.body.cells[active]?.raw||'';grid.replaceChildren();grid.dir=state.body.dir;
  const header=el('tr');header.append(el('th',''));for(const c of cols){const th=el('th',c);th.scope='col';th.style.minWidth=(state.body.widths[c]||85)+'px';header.append(th);}grid.append(header);
  const cache=new Map();
  for(let row=1;row<=20;row++){const tr=el('tr'),rh=el('th',String(row));rh.scope='row';tr.append(rh);tr.style.height=(state.body.heights[row]||30)+'px';
   for(const c of cols){const a=c+row,td=el('td'),record=state.body.cells[a]||{};td.tabIndex=a===active?0:-1;td.dataset.address=a;td.setAttribute('aria-label',a);td.style.cssText='cursor:cell;border:1px solid #d1dadd;padding:2px 6px;white-space:nowrap;max-width:270px;overflow:hidden;text-overflow:ellipsis;color:#1c313a';
    td.style.textAlign=record.align||(typeof evaluate(state.body.cells,a,new Set(),cache)==='number'?'left':'right');td.style.backgroundColor=record.fill||'white';td.style.color=record.color||'';td.style.fontWeight=record.bold?'700':'400';td.style.fontSize=(record.size||14)+'px';
    if(a===active){td.style.outline='2px solid #148266';td.style.outlineOffset='-2px';}
    if(a===active&&edit){
     const inp=el('input');inp.maxLength=350;inp.value=record.raw||'';inp.style.width='100%';inp.setAttribute('aria-label','تحرير '+a);let ended=false;
     function commit(){if(ended)return;ended=true;edit=false;cell().raw=inp.value;ui.touch();}
     inp.onblur=()=>{commit();queueMicrotask(()=>{if(!edit&&grid.contains(inp))drawGrid();});};
     inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();commit();move(e.key==='Tab'?1:0,e.key==='Enter'?1:0);}else if(e.key==='Escape'){e.preventDefault();ended=true;choose(a);}};td.append(inp);
    }else {
     td.textContent=String(evaluate(state.body.cells,a,new Set(),cache));td.onclick=()=>{if(active!==a)choose(a);else editCell(a);};td.ondblclick=()=>editCell(a);
     td.onkeydown=e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const dir=state.body.dir==='rtl'?-1:1;
      const moves={ArrowLeft:[-dir,0],ArrowRight:[dir,0],ArrowUp:[0,-1],ArrowDown:[0,1],Tab:[e.shiftKey?-1:1,0]};
      if(moves[e.key]){e.preventDefault();move(...moves[e.key]);}
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
 function home(){const rb=ui.ribbon;rb.append(button('غامق',()=>format('bold',!cell().bold)),field('الحجم',select('حجم الخط',[12,14,16,18,22,26].map(n=>[n,n]),v=>format('size',Number(v)))),shades('color','لون الخط','#143329'),shades('fill','تعبئة','#e1f7de'),...['right','center','left'].map((v,i)=>button(['يمين','وسط','يسار'][i],()=>format('align',v))));}
 function layout(){ui.ribbon.append(button('تبديل اتجاه الورقة',()=>{state.body.dir=state.body.dir==='rtl'?'ltr':'rtl';ui.touch();drawGrid();}),field('عرض العمود',select('عرض العمود',[85,110,145,185,230].map(n=>[n,n]),v=>{state.body.widths[active[0]]=+v;ui.touch();drawGrid();})),field('ارتفاع الصف',select('ارتفاع الصف',[30,40,55,70].map(n=>[n,n]),v=>{state.body.heights[active.slice(1)]=+v;ui.touch();drawGrid();})));}
 function rename(){const inp=el('input');inp.maxLength=40;inp.value=state.body.sheetName;ui.dialog('اسم ورقة العمل',[inp],[['تسمية',()=>{if(!inp.value.trim())return false;state.body.sheetName=inp.value.trim();ui.touch();render();}]]);}
 function render(){edit=false;ui.work.replaceChildren();ui.tabset([['الصفحة الرئيسية',home],['تخطيط الصفحة',layout]]);
  pos=el('output');bar=el('input');bar.setAttribute('aria-label','شريط الصيغة');bar.maxLength=350;bar.dir='auto';bar.style.flex='1';bar.onchange=()=>write(bar.value);bar.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();write(bar.value);choose(active);}};
  const formula=el('div',null,'oribbon');formula.append(pos,el('span','ƒx'),bar);grid=el('table');grid.style.cssText='border-collapse:collapse;background:white;min-width:100%;font-size:14px';const scroll=el('div');scroll.style.cssText='overflow:auto;max-height:470px;padding:2px';scroll.append(grid);
  ui.work.append(formula,scroll,button(state.body.sheetName+' · إعادة تسمية',rename));drawGrid();
 }
 ui=shell(host,'الجداول الإلكترونية',state,onChange,()=>initial(task),render);render();
}
