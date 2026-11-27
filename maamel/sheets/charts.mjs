import {evaluate} from './model.mjs';
export function chartData(cells,source){
 const match=/^([A-Z])([1-9]\d{0,4}):([A-Z])([1-9]\d{0,4})$/i.exec(source.trim());
 if(!match)throw Error('اكتب نطاقًا مثل A1:B6.');
 const letters=[match[1],match[3]].map(x=>x.toUpperCase().charCodeAt(0)).sort((a,b)=>a-b);
 const rows=[+match[2],+match[4]].sort((a,b)=>a-b);
 if(rows[1]>10000||rows[1]-rows[0]>100||letters[1]-letters[0]>8)throw Error('اختر حتى ١٠١ صف و٩ أعمدة للمخطط.');
 const cols=Array.from({length:letters[1]-letters[0]+1},(_,i)=>String.fromCharCode(letters[0]+i)),cache=new Map();
 const value=(col,row)=>evaluate(cells,col+row,new Set(),cache);
 const keys=cols.length>1?cols.slice(1):cols;
 const header=keys.every(col=>typeof value(col,rows[0])==='string'&&value(col,rows[0])!=='');
 const series=keys.map(col=>({name:header?String(value(col,rows[0])):col,points:[]})),labels=[];
 for(let r=rows[0]+Number(header);r<=rows[1];r++){
  labels.push(cols.length>1?String(value(cols[0],r)):String(r));
  keys.forEach((col,i)=>{const v=value(col,r);series[i].points.push(Number.isFinite(v)?v:null)});
 }
 return {series,labels};
}
const colors=['#246b94','#b05623','#278057','#774da0','#a13c63','#596f24','#327a85','#675930'];
function svgNode(tag,attrs,txt){
 const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [name,v] of Object.entries(attrs))node.setAttribute(name,v);
 if(txt!=null)node.textContent=txt;return node;
}
export function drawChart(container,chart,data){
 const {labels,series}=data,values=series.flatMap(s=>s.points).filter(Number.isFinite);
 if(!values.length){container.textContent='لا توجد قيم رقمية في النطاق.';return;}
 const w=Math.max(440,labels.length*48+70),h=205,lo=Math.min(0,...values),hi=Math.max(0,...values),step=(w-58)/labels.length;
 const y=v=>12+(hi-v)/(hi-lo||1)*141,x=i=>42+(i+.5)*step;
 const svg=svgNode('svg',{viewBox:'0 0 '+w+' '+h,width:w,height:h,role:'img','aria-label':chart.title});
 svg.append(svgNode('line',{x1:40,x2:w-14,y1:y(0),y2:y(0),stroke:'#73838d'}));
 for(const value of new Set([lo,hi]))svg.append(svgNode('text',{x:34,y:y(value)+4,'text-anchor':'end','font-size':11},String(value)));
 labels.forEach((label,i)=>svg.append(svgNode('text',{x:x(i),y:181,'text-anchor':'middle','font-size':11},label.slice(0,12))));
 const legend=document.createElement('p');
 series.forEach((s,j)=>{
  const color=colors[j%colors.length],bw=.74*step/series.length;let last=null;
  const item=document.createElement('span');item.style.borderInlineStart='6px solid '+color;item.style.paddingInline='6px';item.textContent=s.name;legend.append(item);
  s.points.forEach((v,i)=>{if(v==null){last=null;return;}let mark;
   if(chart.kind==='line'){
    if(last)svg.append(svgNode('line',{x1:last.x,y1:last.y,x2:x(i),y2:y(v),stroke:color,'stroke-width':2}));
    last={x:x(i),y:y(v)};mark=svgNode('circle',{cx:x(i),cy:y(v),r:3,fill:color});
   }else mark=svgNode('rect',{x:x(i)-.37*step+j*bw,y:Math.min(y(v),y(0)),width:bw,height:Math.max(1,Math.abs(y(0)-y(v))),fill:color});
   mark.append(svgNode('title',{},s.name+' · '+labels[i]+': '+v));svg.append(mark);
  });
 });
 container.append(legend,svg);
}
