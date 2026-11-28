const types={terminal:'بداية أو نهاية',process:'عملية',decision:'قرار',io:'إدخال أو إخراج'};
const make=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
const button=(text,click)=>{const b=make('button',text);b.type='button';b.onclick=click;return b;};
export function validPlan(p){
 if(p===undefined)return true;
 if(!p||typeof p.steps!=='string'||p.steps.length>3000||!Array.isArray(p.nodes)||p.nodes.length>32||!Array.isArray(p.edges)||p.edges.length>64)return false;
 const ids=new Set(p.nodes.map(n=>n?.id));
 return ids.size===p.nodes.length&&p.nodes.every(n=>n&&Number.isSafeInteger(n.id)&&Object.hasOwn(types,n.kind)&&typeof n.text==='string'&&n.text.length<=80)
  &&p.edges.every(e=>e&&ids.has(e.from)&&ids.has(e.to)&&['','نعم','لا'].includes(e.label));
}
export function mountPlanner(host,state,save){
 const plan=state.plan??{steps:'',nodes:[],edges:[]};
 const persist=()=>{state.plan=plan;save();};
 const select=entries=>{const input=make('select');for(const [key,value] of entries){const option=make('option',value);option.value=key;input.append(option);}return input;};
 const field=(name,control)=>{const l=make('label',name+' ');l.append(control);return l;};
 const steps=make('textarea');steps.value=plan.steps;steps.maxLength=3000;steps.rows=4;steps.oninput=()=>{plan.steps=steps.value;persist();};
 host.append(field('خطوات الخوارزمية',steps));const chart=make('section');host.append(chart);
 function render(){
  chart.replaceChildren(make('h3','المخطط الانسيابي'));const kind=select(Object.entries(types)),text=make('input');text.maxLength=80;
  const add=button('أضف الشكل',()=>{if(!text.value.trim()||plan.nodes.length>=32)return;const id=Math.max(0,...plan.nodes.map(n=>n.id))+1;plan.nodes.push({id,kind:kind.value,text:text.value.trim()});persist();render();});
  chart.append(field('نوع الشكل',kind),field('النص',text),add);
  if(!plan.nodes.length)return;
  const entries=plan.nodes.map(n=>[n.id,n.id+' · '+n.text]);
  const from=select(entries),to=select(entries),label=select([['','مباشر'],['نعم','نعم'],['لا','لا']]);
  if(entries.length>1)to.selectedIndex=1;
  chart.append(make('hr'),field('من',from),field('إلى',to),field('المسار',label),button('اربط الشكلين',()=>{
   const edge={from:+from.value,to:+to.value,label:label.value};if(plan.edges.length>=64||plan.edges.some(e=>e.from===edge.from&&e.to===edge.to&&e.label===edge.label))return;
   plan.edges.push(edge);persist();render();
  }));
  const list=make('ol');
  for(const n of plan.nodes){
   const row=make('li'),name=make('input');name.maxLength=80;name.value=n.text;name.setAttribute('aria-label','نص الشكل '+n.id);
   name.onchange=()=>{n.text=name.value.trim();persist();render();};
   row.append(make('strong',n.id+' · '+types[n.kind]+' '),name,button('احذف الشكل',()=>{
    plan.nodes=plan.nodes.filter(other=>other!==n);plan.edges=plan.edges.filter(e=>e.from!==n.id&&e.to!==n.id);persist();render();
   }));list.append(row);
  }
  chart.append(list);
  for(const e of plan.edges){const line=make('div',e.from+' ← '+e.to+' '+e.label+' ');line.append(button('احذف الرابط',()=>{plan.edges=plan.edges.filter(edge=>edge!==e);persist();render();}));chart.append(line);}
  draw(chart,plan);
 }
 render();
}
function draw(host,{nodes,edges}){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),height=nodes.length*68+20;
 svg.setAttribute('viewBox','0 0 450 '+height);svg.style.cssText='max-width:450px;width:100%;display:block;margin:auto';svg.setAttribute('role','img');svg.setAttribute('aria-label','معاينة المخطط الانسيابي');
 function shape(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);return e;}
 const y=id=>nodes.findIndex(n=>n.id===id)*68+40;
 edges.forEach((edge,i)=>{const a=y(edge.from),b=y(edge.to),x=318+(i%6)*17;
  shape('path',{d:'M 307 '+a+' H '+x+' V '+(b-6)+' H 311',fill:'none',stroke:'#387569'});shape('path',{d:'M 315 '+(b-10)+' l -7 4 7 4',fill:'#387569'});
  if(edge.label)shape('text',{x:x+4,y:(a+b)/2+10,'font-size':12},edge.label);
 });
 for(const node of nodes){const cy=y(node.id),style={fill:'#e3f2ed',stroke:'#397665'};
  if(node.kind==='decision')shape('polygon',{...style,points:'135,'+cy+' 221,'+(cy-28)+' 307,'+cy+' 221,'+(cy+28)});
  else if(node.kind==='io')shape('polygon',{...style,points:'148,'+(cy-20)+' 307,'+(cy-20)+' 294,'+(cy+20)+' 135,'+(cy+20)});
  else shape('rect',{...style,x:135,y:cy-20,width:172,height:40,rx:node.kind==='terminal'?20:2});
  shape('text',{x:221,y:cy+4,'text-anchor':'middle','font-size':12},node.text.length>23?node.text.slice(0,22)+'…':node.text);
 }
 host.append(svg);
}
