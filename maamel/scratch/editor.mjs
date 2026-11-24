import {sceneControls,sensors,validObjects} from '../robot/scene.mjs';
import {run} from './runtime.mjs';
import {newBlock,scenes,scratchTools,robotTools} from './tools.mjs';
import {renderStage,playSound} from './stage.mjs';
const colors={'الأحداث':'#aa6414','الحركة':'#28689b','الهيئة':'#69488e','الصوت':'#964781','التحكم':'#9b5322','القلم':'#1c7065','الحدث':'#a15329'};
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
const button=(text,fn)=>{const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;};
const label=(text,field)=>{const l=el('label',text+' ');l.append(field);return l;};
function select(options,val,change){const s=el('select');for(const [k,t] of options){const o=el('option',t);o.value=k;s.append(o);}s.value=val;s.onchange=()=>change(s.value);return s;}
export function mountEditor(host,previous,onChange,kind,initial){
 const robot=kind==='robot',defs=robot?robotTools:scratchTools,byOp=new Map(defs.map(d=>[d[0],d]));
 let state=structuredClone(previous??initial()),group=defs[0][1],target=state.blocks,frame=0,result=null,clock=0,audio=null;
 if(!Array.isArray(state.blocks)){state=initial();target=state.blocks;}
 const root=el('section');root.className='ma-block-editor';root.dir='rtl';host.replaceChildren(root);
 const style=el('style');style.textContent=`
 .ma-block-editor{font:15px/1.5 Tahoma,Arial,sans-serif;color:#203c39;background:#eff4f3;border:1px solid #cbdcd8;border-radius:14px;padding:10px;container-type:inline-size;min-width:0}
 .ma-block-editor *{box-sizing:border-box}.ma-block-editor :is(button,input,select){font:inherit;max-width:100%;border:1px solid #b8cbc6;border-radius:7px;padding:5px 8px;background:white;color:#183f39;min-height:36px}
 .ma-block-editor button{cursor:pointer}.ma-block-editor button:disabled{opacity:.5;cursor:default}.ma-block-editor :focus-visible{outline:3px solid #ae7025}
 .ma-block-editor .bar,.ma-block-editor .groups,.ma-block-editor .params,.ma-block-editor .commands{display:flex;align-items:center;flex-wrap:wrap;gap:5px}
 .ma-block-editor .grid{display:grid;grid-template-columns:minmax(105px,.6fr) minmax(220px,1.4fr) minmax(220px,1.4fr);gap:8px;margin-top:8px;align-items:start}
 .ma-block-editor.robot .grid{direction:ltr}.ma-block-editor.robot .grid>*{direction:rtl}
 .ma-block-editor .panel{min-width:0;padding:9px;background:white;border-radius:9px;border:1px solid #d3e0dc}.ma-block-editor h3{font-size:15px;margin:0 0 8px;color:#20483d}
 .ma-block-editor .palette{display:grid;gap:6px;margin-top:8px}.ma-block-editor .tile,.ma-block-editor .node{background:var(--ink);color:white;border:0;border-radius:8px 8px 8px 3px}
 .ma-block-editor .node{padding:7px;margin:5px 0}.ma-block-editor .node b{display:block}.ma-block-editor .node input[type=number]{width:70px}
 .ma-block-editor .node input[type=text]{width:140px}.ma-block-editor .commands button{font-size:12px;min-height:28px;padding:2px 6px}
 .ma-block-editor .nest{padding:6px;border-inline-start:4px solid #ffcc86;background:#fffc;border-radius:4px;margin-top:4px;color:#27433a}
 .ma-block-editor .stage{position:relative}.ma-block-editor canvas{display:block;touch-action:none;width:100%;height:auto;border:1px solid #becfc9;border-radius:7px;cursor:crosshair}
 .ma-block-editor .bubble{position:absolute;inset:6px 8px auto auto;border-radius:12px;background:#fff;color:#243a31;padding:3px 10px;max-width:85%;overflow-wrap:anywhere}
 .ma-block-editor .bubble:empty{display:none}.ma-block-editor .info{margin:5px 0}.ma-block-editor .stage-fields{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.ma-block-editor .stage-fields input{width:72px}
 .ma-block-editor .active{background:#d9f1e6;border-color:#3d8072}.ma-block-editor .workspace{min-height:150px;background:radial-gradient(#d3e0d9 1px,transparent 1px) 0 0/12px 12px}
 @container(max-width:760px){.ma-block-editor .grid{grid-template-columns:1fr 1.5fr}.ma-block-editor .view{grid-column:1/-1}.ma-block-editor .stage{max-width:470px;margin:auto}}@container(max-width:440px){.ma-block-editor .grid{grid-template-columns:1fr}.ma-block-editor .palette{display:flex;flex-wrap:wrap}.ma-block-editor .view{grid-column:auto}}
 `;root.append(style);if(robot)root.classList.add('robot');
 const bar=el('div');bar.className='bar';root.append(bar);
 const name=el('input');name.value=state.title;name.maxLength=80;name.oninput=()=>{state.title=name.value;persist();};
 const download=button('حفظ إلى الجهاز',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({format:'maamel-'+kind,project:state})],{type:'application/json'}));const a=el('a');a.href=url;a.download=(state.title||kind)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);});
 const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
 file.onchange=async()=>{try{const f=file.files[0];if(!f||f.size>160000)throw Error();const data=JSON.parse(await f.text());if(data.format!=='maamel-'+kind||!isProject(data.project))throw Error();state=structuredClone(data.project);sceneEditor?.sync();target=state.blocks;name.value=state.title;sceneSelect.value=state.scene;reset();refresh();persist();status.textContent='فُتح المشروع.';}catch{status.textContent='تعذّر فتح الملف. اختر مشروعًا صالحًا من هذا المختبر.';}finally{file.value='';}};
 bar.append(label('اسم المشروع',name),download,button('فتح من الجهاز',()=>file.click()),file);
 const grid=el('div');grid.className='grid';root.append(grid);const tools=panel('اللبنات'),workspace=panel(robot?'منطقة البرمجة · NEPO':'منطقة البرمجة'),view=panel(robot?'محاكاة EV3':'المنصة');workspace.classList.add('workspace');view.classList.add('view');
 function panel(title){const s=el('section');s.className='panel';s.append(el('h3',title));grid.append(s);return s;}
 const groups=el('div'),palette=el('div');groups.className='groups';palette.className='palette';tools.append(groups,palette);
 const targetLabel=el('p'),toRoot=button('أضف إلى المقطع الرئيسي',()=>{target=state.blocks;refresh();});targetLabel.className='info';workspace.append(toRoot,targetLabel);const tree=el('div');workspace.append(tree);
 const controls=el('div');controls.className='bar';const stage=el('div');stage.className='stage';const canvas=el('canvas');canvas.width=720;canvas.height=540;canvas.setAttribute('aria-label',robot?'مسار حركة الروبوت':'منصة الكائن');canvas.setAttribute('role','img');const bubble=el('div');bubble.className='bubble';stage.append(canvas,bubble);
 const status=el('p');status.className='info';status.setAttribute('role','status');
 controls.append(button(robot?'▶ بدء المحاكاة':'⚑ تشغيل العلم',play),button('■ إيقاف',stop),button('إعادة الضبط',reset));view.append(controls,stage);
 const fields=el('div');fields.className='stage-fields';const sceneSelect=select(scenes[kind],state.scene,value=>{state.scene=value;changed();});fields.append(label('الخلفية',sceneSelect));
 const positions={};for(const [key,max,t] of [['x',220,'س'],['y',160,'ص']]){const input=el('input');positions[key]=input;input.type='number';input.min=-max;input.max=max;input.step='1';input.value=key==='y'?-state[key]:state[key];input.onchange=()=>{let v=Math.max(-max,Math.min(max,Number(input.value)||0));state[key]=key==='y'?-v:v;changed();};fields.append(label(t,input));}
 view.append(fields,status);
 const sceneEditor=robot?sceneControls(view,()=>state,changed):null;
 const sensorLine=el('small');if(robot)view.append(sensorLine);
 function showSensors(pose){if(!robot)return;const reading=sensors(state.objects,pose);sensorLine.textContent='مسافة أمامية: '+(reading.range===null?'أبعد من ٢٠٠ سم':reading.range+' سم')+' · لمس: '+(reading.touch?'نعم':'لا')+' · دوران: '+reading.gyro+'° · لون السطح: '+reading.color;}
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);setPoint(e);});
 canvas.addEventListener('pointermove',e=>{if(canvas.hasPointerCapture(e.pointerId))setPoint(e);});
 function setPoint(e){const r=canvas.getBoundingClientRect();const x=Math.max(-220,Math.min(220,Math.round((e.clientX-r.left)/r.width*480-240))),y=Math.max(-160,Math.min(160,Math.round((e.clientY-r.top)/r.height*360-180)));if(!sceneEditor?.place(x,y)){Object.assign(state,{x,y});changed();}}
 function persist(){onChange?.(structuredClone(state));}
 function changed(){reset();persist();}
 function stop(){cancelAnimationFrame(frame);frame=0;status.textContent='متوقف';}
 function redraw(){bubble.textContent=renderStage(canvas,state,kind,result,clock,showSensors);}
 function reset(){stop();result=null;clock=0;status.textContent='جاهز للتشغيل';positions.x.value=state.x;positions.y.value=-state.y;redraw();}
 function play(){stop();result=run(state,kind);clock=0;if(!state.blocks.length||!result.valid){status.textContent=result.error?'تعذر تنفيذ المقطع؛ راجع عدد التكرارات واللبنات.':robot?'أضف لبنة حركة أولًا.':'ضع لبنة العلم في بداية المقطع.';redraw();return;}
  const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(C){try{audio??=new C();audio.resume().catch(()=>{});}catch{}}
  const sounds=result.trace.filter(e=>e.op==='sound');let ix=0;const started=performance.now();status.textContent='قيد التنفيذ';
  function tick(now){if(!root.isConnected){stop();audio?.close().catch(()=>{});return;}clock=Math.min(result.time,now-started);while(ix<sounds.length&&sounds[ix].start<=clock){playSound(audio,sounds[ix++].sound);}
  redraw();if(clock<result.time)frame=requestAnimationFrame(tick);else{frame=0;status.textContent='اكتمل التنفيذ';}}
  tick(started);
 }
 function add(op,list=target){const def=byOp.get(op);if(!def)return;if(total(state.blocks)>=160){status.textContent='بلغ المقطع الحد الأقصى للبنات.';return;}list.push(newBlock(def));changed();refresh();}
 function total(items){return items.reduce((sum,b)=>sum+1+(Array.isArray(b.body)?total(b.body):0),0);}
 function isProject(p){function valid(list,depth){return depth<=5&&Array.isArray(list)&&list.length<=160&&list.every(b=>b&&byOp.has(b.op)&&(b.op!=='repeat'||valid(b.body,depth+1))&&byOp.get(b.op).slice(3).every(f=>f.type==='text'?typeof b[f.key]==='string'&&b[f.key].length<=180:f.type==='select'?f.options.some(([k])=>k===b[f.key]):Number.isFinite(b[f.key])&&b[f.key]>=f.min&&b[f.key]<=f.max));}
 return p&&(!robot||validObjects(p.objects))&&typeof p.title==='string'&&p.title.length<=80&&Number.isFinite(p.x)&&Math.abs(p.x)<=220&&Number.isFinite(p.y)&&Math.abs(p.y)<=160&&scenes[kind].some(([k])=>k===p.scene)&&valid(p.blocks,0)&&total(p.blocks)<=160;}
 function drop(list,container){container.ondragover=e=>{e.preventDefault();e.stopPropagation();};container.ondrop=e=>{e.preventDefault();e.stopPropagation();const op=e.dataTransfer.getData('application/x-maamel-op');if(byOp.has(op))add(op,list);};}
 function refresh(){groups.replaceChildren();palette.replaceChildren();for(const g of new Set(defs.map(d=>d[1]))){const b=button(g,()=>{group=g;refresh();});b.setAttribute('aria-pressed',String(group===g));if(group===g)b.className='active';groups.append(b);}
  for(const d of defs.filter(d=>d[1]===group)){const b=button(d[2],()=>add(d[0]));b.className='tile';b.style.setProperty('--ink',colors[d[1]]);b.draggable=true;b.ondragstart=e=>e.dataTransfer.setData('application/x-maamel-op',d[0]);palette.append(b);}
  tree.replaceChildren();renderList(state.blocks,tree,0);targetLabel.textContent=target===state.blocks?'الإضافة إلى المقطع الرئيسي':'الإضافة داخل التكرار المحدد';drop(state.blocks,workspace);
 }
 function renderList(list,parent,depth){for(const [i,b] of list.entries()){
  const d=byOp.get(b.op);if(!d)continue;const node=el('div');node.className='node';node.style.setProperty('--ink',colors[d[1]]);node.append(el('b',d[2]));
  const params=el('div');params.className='params';node.append(params);
  for(const spec of d.slice(3)){let input;if(spec.type==='select'){input=select(spec.options,b[spec.key],v=>{b[spec.key]=v;changed();});}else{input=el('input');input.type=spec.type;input.value=b[spec.key];if(spec.type==='number'){input.min=spec.min;input.max=spec.max;input.step='any';}else input.maxLength=180;
   input.oninput=()=>{if(spec.type==='number'&&(input.value===''||!input.validity.valid))return;b[spec.key]=spec.type==='number'?Number(input.value):input.value;changed();};input.onchange=()=>{input.value=b[spec.key];};}
   params.append(label(spec.label,input));}
  const cmds=el('div');cmds.className='commands';const swap=delta=>{[list[i],list[i+delta]]=[list[i+delta],list[i]];changed();refresh();};const up=button('↑',()=>swap(-1)),down=button('↓',()=>swap(1));up.ariaLabel='انقل اللبنة للأعلى';down.ariaLabel='انقل اللبنة للأسفل';up.disabled=i===0;down.disabled=i===list.length-1;
  cmds.append(up,down,button('مضاعفة',()=>{if(total(state.blocks)+total([b])>160)return;list.splice(i+1,0,structuredClone(b));changed();refresh();}),button('حذف',()=>{list.splice(i,1);target=state.blocks;changed();refresh();}));node.append(cmds);
  if(b.op==='repeat'){const nest=el('div');nest.className='nest';if(depth<5){nest.append(button('أضف لبنات داخل التكرار',()=>{target=b.body;refresh();}));drop(b.body,nest);}renderList(b.body,nest,depth+1);node.append(nest);}parent.append(node);
 }}
 refresh();reset();return ()=>{stop();audio?.close().catch(()=>{});};
}
