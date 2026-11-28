import {sceneControls,sensors,validObjects} from '../robot/scene.mjs';
import {createMotionScene} from './continuous.mjs';
import {mountPlanner,validPlan} from './planner.mjs';
import {run} from './runtime.mjs';
import {chromeStyle} from './chrome-style.mjs';
import {backdropLibrary,costumePane,menu,modal,soundPane} from './chrome.mjs';
import {newBlock,poses,scenes,scratchTools,robotTools} from './tools.mjs';
import {renderStage,playSound} from './stage.mjs';
const colors={'الاستشعار':'#177a92','الأحداث':'#aa6414','الحركة':'#28689b','الهيئة':'#69488e','الصوت':'#964781','التحكم':'#9b5322','القلم':'#1c7065','الحدث':'#a15329'};
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
const button=(text,fn)=>{const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;};
const label=(text,field)=>{const l=el('label',text+' ');l.append(field);return l;};
function select(options,val,change){const s=el('select');for(const [k,t] of options){const o=el('option',t);o.value=k;s.append(o);}s.value=val;s.onchange=()=>change(s.value);return s;}
export function mountEditor(host,previous,onChange,kind,initial){
 const robot=kind==='robot',defs=robot?robotTools:scratchTools,byOp=new Map(defs.map(d=>[d[0],d]));
 let state=structuredClone(previous??initial()),group=defs[0][1],target=state.blocks,frame=0,result=null,clock=0,audio=null;
 if(!Array.isArray(state.blocks)){state=initial();target=state.blocks;}
 let tab='code',simOpen=true,showReadings=true,dragged=null;
 const history=[],future=[];let last=JSON.stringify(state);
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
 `+chromeStyle;root.append(style);if(robot)root.classList.add('robot');
 const bar=el('div');bar.className='menubar';root.append(bar);bar.append(el('strong',robot?'Open Roberta · EV3':'Scratch · سكراتش'));
 const name=el('input');name.value=state.title;name.maxLength=80;name.oninput=()=>{state.title=name.value;persist();};
 const download=button('حفظ إلى الجهاز',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({format:'maamel-'+kind,project:state})],{type:'application/json'}));const a=el('a');a.href=url;a.download=(state.title||kind)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);});
 const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
 file.onchange=async()=>{try{const f=file.files[0];if(!f||f.size>160000)throw Error();const data=JSON.parse(await f.text());if(data.format!=='maamel-'+kind||!isProject(data.project))throw Error();state=structuredClone(data.project);sceneEditor?.sync();target=state.blocks;name.value=state.title;sceneSelect.value=state.scene;reset();refresh();persist();status.textContent='فُتح المشروع.';}catch{status.textContent='تعذّر فتح الملف. اختر مشروعًا صالحًا من هذا المختبر.';}finally{file.value='';}};
 menu(bar,robot?'تحرير':'ملف',[
  ['مشروع جديد',()=>{if(state.blocks.length&&!globalThis.confirm('بدء مشروع جديد؟ يمكنك استعادة المشروع السابق من تراجع.'))return;load(initial());persist();}],
  ['حفظ إلى الجهاز',()=>download.click()],['فتح من الجهاز',()=>file.click()]]);
 menu(bar,robot?'المقطع البرمجي':'تحرير',[['تراجع',()=>travel(history,future)],['إعادة',()=>travel(future,history)]]);
 bar.append(label('اسم المشروع',name),file);
 const tabs=el('nav');tabs.className='toolbar-tabs';tabs.setAttribute('aria-label','أدوات المختبر');root.append(tabs);
 const grid=el('div');grid.className='grid';root.append(grid);const tools=panel('اللبنات'),workspace=panel(robot?'منطقة البرمجة · NEPO':'منطقة البرمجة'),view=panel(robot?'محاكاة EV3':'المنصة');tools.classList.add('tools-panel');workspace.classList.add('workspace');view.classList.add('view');
 function panel(title){const s=el('section');s.className='panel';s.append(el('h3',title));grid.append(s);return s;}
 const groups=el('div'),palette=el('div');groups.className='groups';palette.className='palette';const shelf=el('div');shelf.className='tool-shelf';shelf.append(groups,palette);tools.append(shelf);
 const targetLabel=el('p'),toRoot=button('أضف إلى المقطع الرئيسي',()=>{target=state.blocks;refresh();});targetLabel.className='info';workspace.append(toRoot,targetLabel);const tree=el('div');if(robot){const hat=el('span','بدء · start');hat.className='start-hat';workspace.append(hat);}
 workspace.append(tree);
 const studio=el('section');studio.className='studio-pane';studio.hidden=true;root.append(studio);
 const controls=el('div');controls.className='bar';const stage=el('div');stage.className='stage';const canvas=el('canvas');canvas.width=720;canvas.height=540;canvas.setAttribute('aria-label',robot?'مسار حركة الروبوت':'منصة الكائن');canvas.setAttribute('role','img');const bubble=el('div');bubble.className='bubble';stage.append(canvas,bubble);
 const status=el('p');status.className='info';status.setAttribute('role','status');
 const playButton=button(robot?'▶ بدء المحاكاة':'⚑ تشغيل العلم',play),stopButton=button('■ إيقاف',stop);
 playButton.className='start-run';stopButton.className='stop-run';
 const expand=button('تكبير المنصة',()=>{const active=view.classList.toggle('expanded');expand.textContent=active?'تصغير المنصة':'تكبير المنصة';expand.setAttribute('aria-pressed',String(active));});
 controls.append(playButton,stopButton,button('إعادة الضبط',reset),expand);
 if(robot)view.append(stage,controls);else view.append(controls,stage);
 const fields=el('div');fields.className='stage-fields';const sceneSelect=select(scenes[kind],state.scene,value=>{state.scene=value;changed();});fields.append(label('الخلفية',sceneSelect));
 const positions={};for(const [key,max,t] of [['x',220,'س'],['y',160,'ص']]){const input=el('input');positions[key]=input;input.type='number';input.min=-max;input.max=max;input.step='1';input.value=key==='y'?-state[key]:state[key];input.onchange=()=>{let v=Math.max(-max,Math.min(max,Number(input.value)||0));state[key]=key==='y'?-v:v;changed();};fields.append(label(t,input));}
 if(!robot)fields.append(button('اختيار خلفية',()=>backdropLibrary(root,state.scene,value=>{state.scene=value;sceneSelect.value=value;changed();})));
 const actors=el('div');if(!robot)fields.append(actors);
 const actorKeys=['costume','x','y','blocks','clips'];
 function snapshotActor(){return Object.fromEntries(actorKeys.filter(k=>state[k]!==undefined).map(k=>[k,state[k]]));}
 function editActor(actor){for(const key of actorKeys)delete state[key];Object.assign(state,actor);target=state.blocks;changed();refresh();}
 function actorControls(){
  if(robot)return;actors.replaceChildren();const others=state.others??[];
  const nameOf=a=>poses.find(([id])=>id===(a.costume??'orange'))?.[1]??'كائن';
  const list=select([[0,nameOf(state)],...others.map((a,i)=>[i+1,nameOf(a)])],0,value=>{
   if(+value===0)return;const i=Number(value)-1,next=others[i];others[i]=snapshotActor();editActor(next);
  });
  const library=select(poses,'fish',()=>{});
  const add=button('أضف كائنًا',()=>{if(others.length>=11)return;state.others=[...others,snapshotActor()];editActor({costume:library.value,x:Math.min(180,30*(others.length+1)),y:0,blocks:[]});});add.disabled=others.length>=11;
  const remove=button('احذف الكائن',()=>{if(others.length){const next=others.shift();editActor(next);}});remove.disabled=!others.length;
  actors.append(label('الكائن النشط',list),label('مكتبة الكائنات',library),add,remove);
 }
 view.append(fields,status);
 const sceneEditor=robot?sceneControls(view,()=>state,changed):null;
 const sensorLine=el('small');if(robot)view.append(sensorLine);
 function showSensors(pose){if(!robot||!showReadings)return;const reading=sensors(state.objects,pose);sensorLine.textContent='مسافة أمامية: '+(reading.range===null?'أبعد من ٢٠٠ سم':reading.range+' سم')+' · لمس: '+(reading.touch?'نعم':'لا')+' · دوران: '+reading.gyro+'° · لون السطح: '+reading.color;}
 let motion=null,motionStart=0,press=null;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);press={x:e.clientX,y:e.clientY,drag:false};if(robot)setPoint(e);});
 canvas.addEventListener('pointerup',e=>{
  if(!robot&&press&&!press.drag){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*480-240,y=(e.clientY-r.top)/r.height*360-180;
   const actors=motion?.sprites??[state,...(state.others??[])],index=actors.findLastIndex(a=>Math.hypot(a.x-x,a.y-y)<24);
   if(motion){if(index>=0)motion.click(index,performance.now()-motionStart);return;}
   if(index>=0&&actors[index].blocks.some(b=>b.op==='clicked'))play(index);else setPoint(e);
  }press=null;
 });
 canvas.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>4)press.drag=true;if(press?.drag&&canvas.hasPointerCapture(e.pointerId))setPoint(e);});
 function setPoint(e){const r=canvas.getBoundingClientRect();const x=Math.max(-220,Math.min(220,Math.round((e.clientX-r.left)/r.width*480-240))),y=Math.max(-160,Math.min(160,Math.round((e.clientY-r.top)/r.height*360-180)));if(!sceneEditor?.place(x,y)){Object.assign(state,{x,y});changed();}}
 function persist(){const next=JSON.stringify(state);if(next!==last){history.push(last);if(history.length>40)history.shift();future.length=0;last=next;}onChange?.(structuredClone(state));}
 function load(project){state=structuredClone(project);target=state.blocks;name.value=state.title;sceneSelect.value=state.scene;sceneEditor?.sync();reset();refresh();}
 function travel(from,to){if(!from.length){status.textContent='لا توجد خطوة أخرى.';return;}to.push(last);last=from.pop();load(JSON.parse(last));onChange?.(structuredClone(state));}
 async function previewSound(id){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;try{audio??=new C();await audio.resume();playSound(audio,id);}catch{status.textContent='تعذر تشغيل الصوت على الجهاز.';}}
 function pickTab(id){tab=id;refresh();}
 function refreshChrome(){
  tabs.replaceChildren();studio.replaceChildren();
  const tabButton=(id,name)=>{const b=button(name,()=>pickTab(id));b.setAttribute('aria-pressed',String(tab===id));tabs.append(b);};
  tabButton('code',robot?'المقطع البرمجي · NEPO':'المقاطع البرمجية');
  if(robot){tabButton('config','تهيئة الروبوت');const sim=button('SIM · المحاكاة',()=>{if(tab!=='code'){tab='code';simOpen=true;}else simOpen=!simOpen;refresh();});sim.setAttribute('aria-pressed',String(simOpen&&tab==='code'));tabs.append(sim);}
  else{tabButton('costumes','المظاهر');tabButton('sounds','الأصوات');tabButton('plan','الخوارزمية والمخطط');}
  grid.hidden=tab!=='code';studio.hidden=tab==='code';view.hidden=robot&&!simOpen;
  if(robot){grid.classList.toggle('no-sim',!simOpen);}
  if(tab==='plan')mountPlanner(studio,state,persist);
  if(tab==='costumes')costumePane(studio,state,id=>{state.costume=id;changed();refresh();});
  if(tab==='sounds'){const clips=state.clips??['cat'];soundPane(studio,clips,previewSound,id=>{state.clips=[...new Set([...clips,id])];changed();refresh();},id=>{
    if(containsSound(state.blocks,id)){status.textContent='هذا الصوت مستخدم في المقطع.';const msg=el('p',status.textContent);studio.append(msg);return;}
    state.clips=clips.filter(c=>c!==id);changed();refresh();});}
  if(tab==='config'){studio.append(el('h3','EV3 · تهيئة الروبوت'));const ports=[['B','المحرك الأيسر'],['C','المحرك الأيمن'],['1','مستشعر اللمس'],['2','مستشعر الجيروسكوب'],['3','مستشعر اللون'],['4','مستشعر المسافة']];const table=el('table');for(const [id,t] of ports){const tr=el('tr');tr.append(el('th',id),el('td',t));table.append(tr);}studio.append(table);
   const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=showReadings;checkbox.onchange=()=>{showReadings=checkbox.checked;sensorLine.hidden=!showReadings;redraw();};studio.append(label('عرض قراءات المستشعرات',checkbox));}
 }
 function containsSound(blocks,id){return blocks.some(b=>b.op==='sound'&&b.sound===id||Array.isArray(b.body)&&containsSound(b.body,id));}
 function changed(){reset();persist();}
 let promptForm=null;
 function stop(){motion=null;promptForm?.remove();promptForm=null;cancelAnimationFrame(frame);frame=0;status.textContent='متوقف';}
 function redraw(){bubble.textContent=renderStage(canvas,state,kind,result,clock,showSensors);}
 function reset(){stop();result=null;clock=0;status.textContent='جاهز للتشغيل';positions.x.value=state.x;positions.y.value=-state.y;redraw();}
 function play(click,key){
  const oldRuns=result?[result,...(result.others??[])]:[];
  stop();clock=0;
  const actors=robot?[state]:[state,...(state.others??[])],answers=actors.map(()=>[]);
  if(!robot&&!key&&!Number.isInteger(click)&&actors.some(a=>a.blocks.some(b=>['forever','receive','broadcast','broadcastWait'].includes(b.op)))){
   motion=createMotionScene(actors);motionStart=performance.now();status.textContent='قيد التنفيذ';
   const animate=now=>{if(!root.isConnected){stop();return;}motion.tick(now-motionStart);
    const display=motion.sprites.map(s=>({origin:{x:s.x,y:s.y,angle:s.angle},trace:s.costume?[{op:'costume',costume:s.costume,start:0}]:[]}));result=display[0];result.others=display.slice(1);redraw();bubble.textContent=motion.sprites.map(s=>s.speech).filter(Boolean).join(' · ');
    if(motion.sprites.some(s=>s.threads.length))frame=requestAnimationFrame(animate);else status.textContent='اكتمل التنفيذ';};
   animate(motionStart);return;
  }
  let runs,duration,sounds;
  function simulate(){
   runs=actors.map((actor,i)=>{
    const last=oldRuns[i],start=key&&last?{...actor,x:last.x??last.origin.x,y:last.y??last.origin.y}:actor;
    return run(start,kind,answers[i],key??(Number.isInteger(click)?(i===click?'clicked':'inactive'):'flag'));
   });result=runs[0];result.others=runs.slice(1);
   duration=Math.max(0,...runs.filter(r=>r.valid).map(r=>r.time));
   sounds=runs.filter(r=>r.valid).flatMap(r=>r.trace.filter(e=>e.op==='sound')).sort((a,b)=>a.start-b.start);
  }
  simulate();
  if(!runs.some(r=>r.valid&&r.trace.length)){status.textContent=result.error?'تعذر تنفيذ المقطع؛ راجع عدد التكرارات واللبنات.':robot?'أضف لبنة حركة أولًا.':'ضع لبنة العلم في بداية المقطع.';redraw();return;}
  const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(C){try{audio??=new C();audio.resume().catch(()=>{});}catch{}}
  let ix=0,started=performance.now();status.textContent='قيد التنفيذ';
  function tick(now){if(!root.isConnected){stop();audio?.close().catch(()=>{});return;}clock=Math.min(duration,now-started);const question=runs.map((r,i)=>({...r.pending,i})).filter(q=>q.time!==undefined&&q.time<=clock).sort((a,b)=>a.time-b.time)[0];
  if(question){
   clock=question.time;redraw();const form=el('form'),input=el('input'),submit=el('button','إجابة');submit.type='submit';input.maxLength=180;
   form.append(label(question.text,input),submit);view.append(form);promptForm=form;input.focus();status.textContent='بانتظار إجابتك';
   form.onsubmit=e=>{e.preventDefault();answers[question.i].push(input.value);form.remove();promptForm=null;simulate();started=performance.now()-clock;status.textContent='قيد التنفيذ';frame=requestAnimationFrame(tick);};return;
  }
  while(ix<sounds.length&&sounds[ix].start<=clock){playSound(audio,sounds[ix++].sound);}
  redraw();if(clock<duration)frame=requestAnimationFrame(tick);else{frame=0;status.textContent='اكتمل التنفيذ';}}
  tick(started);
 }
 function add(op,list=target,at){const def=byOp.get(op);if(!def)return;if(total(state.blocks)>=160){status.textContent='بلغ المقطع الحد الأقصى للبنات.';return;}const block=newBlock(def);if(op==='sound')block.sound=(state.clips??['cat'])[0]??'cat';list.splice(at??list.length,0,block);changed();refresh();}
 function total(items){return items.reduce((sum,b)=>sum+1+(Array.isArray(b.body)?total(b.body):0),0);}
 function isProject(p){function valid(list,depth){return depth<=5&&Array.isArray(list)&&list.length<=160&&list.every(b=>b&&byOp.has(b.op)&&(!['repeat','ifAnswer','forever'].includes(b.op)||valid(b.body,depth+1))&&byOp.get(b.op).slice(3).every(f=>f.type==='text'?typeof b[f.key]==='string'&&b[f.key].length<=180:f.type==='select'?f.options.some(([k])=>k===b[f.key]):Number.isFinite(b[f.key])&&b[f.key]>=f.min&&b[f.key]<=f.max));}
 return p&&validPlan(p.plan)&&(p.others===undefined||!robot&&Array.isArray(p.others)&&p.others.length<=11&&p.others.every(a=>a&&a.others===undefined&&isProject({...a,scene:p.scene,title:p.title})))&&(!robot||validObjects(p.objects))&&(p.clips===undefined||Array.isArray(p.clips)&&p.clips.length<=4&&p.clips.every(v=>['bird','bounce','cat','door'].includes(v)))&&(p.costume===undefined||poses.some(([id])=>id===p.costume))&&typeof p.title==='string'&&p.title.length<=80&&Number.isFinite(p.x)&&Math.abs(p.x)<=220&&Number.isFinite(p.y)&&Math.abs(p.y)<=160&&scenes[kind].some(([k])=>k===p.scene)&&valid(p.blocks,0)&&total(p.blocks)<=160;}
 function drop(list,container,at){container.ondragover=e=>{e.preventDefault();e.stopPropagation();};container.ondrop=e=>{e.preventDefault();e.stopPropagation();const op=e.dataTransfer.getData('application/x-maamel-op');
 if(dragged&&e.dataTransfer.getData('application/x-maamel-move')){
  const {list:old,block}=dragged;dragged=null;const inside=b=>b?.body===list||b?.body?.some(inside);
  if(inside(block))return;
  const position=old.indexOf(block);if(position<0)return;let dest=at??list.length;
  if(old===list&&position<dest)dest--;old.splice(position,1);list.splice(dest,0,block);if(!isProject(state)){list.splice(dest,1);old.splice(position,0,block);return;}changed();refresh();
 }else if(byOp.has(op))add(op,list,at);};}
 function refresh(){actorControls();refreshChrome();groups.replaceChildren();palette.replaceChildren();for(const g of new Set(defs.map(d=>d[1]))){if(g==='القلم'&&!hasPen())continue;const b=button(g,()=>{group=g;refresh();});b.style.setProperty('--category',colors[g]);b.setAttribute('aria-pressed',String(group===g));if(group===g)b.className='active';groups.append(b);}
  if(!robot&&!hasPen()){const b=button('إضافة ملحق',()=>{const dialog=modal(root,'ملحقات سكراتش');dialog.append(button('إضافة القلم',()=>{dialog.close();state.pen=true;group='القلم';changed();refresh();}));});groups.append(b);}
  for(const d of defs.filter(d=>d[1]===group)){const b=button(d[2],()=>add(d[0]));b.className='tile';b.style.setProperty('--ink',colors[d[1]]);b.draggable=true;b.ondragstart=e=>e.dataTransfer.setData('application/x-maamel-op',d[0]);palette.append(b);}
  tree.replaceChildren();renderList(state.blocks,tree,0);targetLabel.textContent=target===state.blocks?'الإضافة إلى المقطع الرئيسي':'الإضافة داخل اللبنة المحددة';drop(state.blocks,workspace);
 }
 function hasPen(){return state.pen||state.blocks.some(function used(b){return byOp.get(b.op)?.[1]==='القلم'||b.body?.some(used);});}
 function renderList(list,parent,depth){for(const [i,b] of list.entries()){
  const d=byOp.get(b.op);if(!d)continue;const node=el('div');node.className='node';node.style.setProperty('--ink',colors[d[1]]);const heading=el('strong',d[2]);heading.draggable=true;heading.title='اسحب لإعادة ترتيب اللبنة';heading.ondragstart=e=>{dragged={list,block:b};e.dataTransfer.setData('application/x-maamel-move','block');};heading.ondragend=()=>{dragged=null;};node.append(heading);drop(list,node,i);
  const params=el('div');params.className='params';node.append(params);
  for(const spec of d.slice(3)){let input;if(spec.type==='select'){input=select(spec.options,b[spec.key],v=>{b[spec.key]=v;if(spec.key==='sound')state.clips=[...new Set([...(state.clips??['cat']),v])];changed();});}else{input=el('input');input.type=spec.type;input.value=b[spec.key];if(spec.type==='number'){input.min=spec.min;input.max=spec.max;input.step='any';}else input.maxLength=180;
   input.oninput=()=>{if(spec.type==='number'&&(input.value===''||!input.validity.valid))return;b[spec.key]=spec.type==='number'?Number(input.value):input.value;changed();};input.onchange=()=>{input.value=b[spec.key];};}
   params.append(label(spec.label,input));}
  const cmds=el('div');cmds.className='commands';const swap=delta=>{[list[i],list[i+delta]]=[list[i+delta],list[i]];changed();refresh();};const up=button('↑',()=>swap(-1)),down=button('↓',()=>swap(1));up.ariaLabel='انقل اللبنة للأعلى';down.ariaLabel='انقل اللبنة للأسفل';up.disabled=i===0;down.disabled=i===list.length-1;
  cmds.append(up,down,button('مضاعفة',()=>{if(total(state.blocks)+total([b])>160)return;list.splice(i+1,0,structuredClone(b));changed();refresh();}),button('حذف',()=>{list.splice(i,1);target=state.blocks;changed();refresh();}));const edit=el('details');edit.className='block-commands';const more=el('summary','خيارات اللبنة');edit.append(more,cmds);node.append(edit);node.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();edit.open=true;};
  if(['repeat','ifAnswer','forever'].includes(b.op)){const nest=el('div');nest.className='nest';if(depth<5){nest.append(button(b.op!=='ifAnswer'?'أضف لبنات داخل التكرار':'أضف لبنات عند تحقق الشرط',()=>{target=b.body;refresh();}));drop(b.body,nest);}renderList(b.body,nest,depth+1);node.append(nest);}parent.append(node);
 }}
 const arrows=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
 if(!robot){
  canvas.tabIndex=0;
  const pad=el('div');pad.className='bar';pad.setAttribute('aria-label','مفاتيح المنصة');
  for(const [i,key] of arrows.entries())pad.append(button(['↑ أعلى','↓ أسفل','← يسار','→ يمين'][i],()=>pressArrow(key)));
  view.append(pad);
 }
 function pressArrow(key){if(!promptForm&&[state,...(state.others??[])].some(actor=>actor.blocks.some(b=>b.op==='key'&&b.key===key))){play(null,key);return true;}return false;}
 const onKey=e=>{if(!robot&&arrows.includes(e.key)&&!e.target.closest('input,select,textarea')&&pressArrow(e.key))e.preventDefault();if(e.key==='Escape'){view.classList.remove('expanded');expand.textContent='تكبير المنصة';for(const m of root.querySelectorAll('.block-menu'))m.open=false;}};
 root.addEventListener('keydown',onKey);refresh();reset();return ()=>{root.removeEventListener('keydown',onKey);stop();audio?.close().catch(()=>{});};
}
