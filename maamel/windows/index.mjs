import {exercises} from './exercises.mjs'
import {animals, apply, children, initial, pathOf, valid} from './model.mjs'

const cssUrl = new URL('./style.css',import.meta.url).href
const h=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
const btn=(label,fn,cls)=>{const e=h('button',label,cls);e.type='button';e.onclick=fn;return e}
const apps={explorer:'مستكشف الملفات',paint:'الرسام',settings:'الإعدادات',calc:'الحاسبة',help:'تعليمات سطح المكتب',alarm:'المنبه',practice:'نشاط التصنيف'}
const roots=['desktop','docs','bin']
const icons={folder:'📁',text:'📄',image:'🖼️',drawing:'🎨',shortcut:'↗️'}
const theme={jade:'radial-gradient(ellipse at 29% 35%,#1590af,transparent 55%),linear-gradient(118deg,#073b68,#096a94 65%,#06486b)',blue:'linear-gradient(135deg,#bad8f5,#5281ac)',dune:'linear-gradient(135deg,#f0dcc1,#c69671)'}
function paintCanvas(canvas,strokes){
  const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height)
  g.fillStyle='white';g.fillRect(0,0,canvas.width,canvas.height)
  for(const stroke of strokes){g.strokeStyle=g.fillStyle=stroke.color;g.lineWidth=4;g.lineJoin=g.lineCap='round';g.beginPath()
    stroke.points.forEach(([x,y],i)=>i?g.lineTo(x*canvas.width,y*canvas.height):g.moveTo(x*canvas.width,y*canvas.height))
    if(stroke.points.length===1){g.arc(stroke.points[0][0]*canvas.width,stroke.points[0][1]*canvas.height,2,0,Math.PI*2);g.fill()}else g.stroke()
  }
}
export function mount(host,previous,onChange=()=>{},taskId=previous?.task??'animals',drive){
  host.replaceChildren()
  const link=h('link');link.rel='stylesheet';link.href=cssUrl
  const desk=h('section',undefined,'wm');desk.dir='rtl';desk.tabIndex=0;desk.setAttribute('aria-label','سطح المكتب التدريبي')
  const status=h('div','','wm-status');status.setAttribute('role','status')
  const bench=h('div',undefined,'wm-bench'),bar=h('div',undefined,'wm-bar')
  desk.append(bench,bar,status);host.append(link,desk)
  let state=valid(previous)?structuredClone(previous):initial(taskId),app='explorer',dir='docs',selected='',clip=null,start=false,menu=null,modal=null,minimized=false,maximized=false
  let drawing=[],drawId='',color='#197060',calcValue='0',operand=null,operator=null,fresh=true
  if(['hardware','filetypes'].includes(taskId))app='practice'
  if(taskId==='alarm')app='alarm'
  if(taskId==='display')app='settings'
  let questionSet=taskId==='filetypes'?'filetypes':'hardware',timer=0,unmounted=false,audioContext=null,lastAlarm=''
  let view='icons',settingsPane='display',brush='pen',paintFile=false,backStack=[],forwardStack=[]
  const gridNumbers=new Intl.NumberFormat('ar-SA')
  const lookup=id=>state.nodes.find(n=>n.id===id)
  function report(msg){status.textContent=msg}
  function commit(op){
    try{const next=apply(state,op);state=next;onChange(structuredClone(next));return true}catch(e){report(e.message);return false}
  }
  function closeMenu(){menu?.remove();menu=null}
  function closeModal(){modal?.close();modal?.remove();modal=null}
  function dialog(title,build){
    closeMenu();closeModal();modal=h('dialog',undefined,'wm-dialog');const form=h('form');form.method='dialog'
    const name=h('strong',title);form.append(name)
    const dismiss=btn('إلغاء',closeModal)
    build(form,dismiss);modal.append(form);desk.append(modal);modal.showModal()
    modal.addEventListener('close',()=>{if(modal&&!modal.open){modal.remove();modal=null}},{once:true})
    const first=form.querySelector('input, textarea, select');if(first){first.focus();if(first.tagName==='INPUT')first.select()}
  }
  function ask(title,value,callback){
    dialog(title,(form,dismiss)=>{const input=h('input');input.value=value;input.maxLength=96;input.required=true;input.setAttribute('aria-label',title)
      const error=h('span');error.setAttribute('role','alert')
      const ok=h('button','تأكيد');ok.type='submit'
      form.append(input,error,ok,dismiss);form.onsubmit=e=>{e.preventDefault();if(callback(input.value)){closeModal();render()}else error.textContent=status.textContent}
    })
  }
  function create(kind){ask(kind==='folder'?'إنشاء مجلد':'إنشاء ملف نصي',kind==='folder'?'مجلد جديد':'مستند.txt',name=>commit({type:'create',kind,name,parent:dir}))}
  function rename(){const n=lookup(selected);if(n)ask('إعادة تسمية',n.name,name=>commit({type:'rename',id:n.id,name}))}
  function paste(){if(!clip)return;const success=commit({type:clip.action,id:clip.id,parent:dir});if(success){if(clip.action==='move')clip=null;render();report('تم اللصق.')}}
  function clipboard(action){if(!selected)return;clip={id:selected,action};render();report(action==='move'?'تم القص. افتح المجلد المطلوب ثم الصق.':'تم النسخ. افتح المجلد المطلوب ثم الصق.')}
  function take(type){if(commit({type,id:selected})){selected='';render();report(type==='trash'?'نُقل العنصر إلى السلة.':'استُعيد العنصر.')}} 
  function openDir(id,history=true){if(id!==dir&&history){backStack.push(dir);forwardStack=[]}dir=id;selected='';app='explorer';minimized=false;start=false;render()}
  function launch(id){paintFile=false;app=id;minimized=start=false;render()}
  function openFile(id){
    const n=lookup(id);if(!n)return
    if(dir==='bin'){selected=id;take('restore');return}
    if(n.kind==='shortcut'){
      const target=lookup(n.target)
      if(!target||target.kind==='shortcut'||pathOf(state,target.id).split(' / ')[0]===lookup('bin').name)return report('تعذر فتح الاختصار لأن العنصر الأصلي غير متاح.')
      return openFile(target.id)
    }
    if(n.kind==='folder')return openDir(id)
    if(drive?.documentOf(n)){location.hash='lab/word/'+encodeURIComponent(n.id);return}
    if(n.kind==='drawing'){drawId=id;drawing=structuredClone(n.strokes);return launch('paint')}
    if(n.kind==='image'){
      const a=animals.find(v=>v.id===n.asset)
      return dialog(n.name,(f,dismiss)=>{const pic=h('div',a.symbol,'wm-picture');pic.setAttribute('role','img');pic.setAttribute('aria-label',a.name);f.append(pic,h('p',a.name),dismiss);dismiss.textContent='إغلاق'})
    }
    dialog(n.name,(f,dismiss)=>{const area=h('textarea');area.maxLength=50000;area.value=n.content;area.setAttribute('aria-label','محتوى الملف');f.append(area,btn('حفظ',()=>{if(commit({type:'write',id,content:area.value})){closeModal();report('حُفظ الملف.')}}),dismiss)})
  }
  function buttons(items,container){
    for(const [label,fn,disabled] of items){const b=btn(label,fn);b.disabled=!!disabled;container.append(b)}
  }
  function shortcut(parent){
    if(commit({type:'shortcut',id:selected,parent})){render();report('تم إنشاء الاختصار.')}
  }
  function cmds(){
    const gone=dir==='bin',none=!selected
    if(gone)return [['استعادة',()=>take('restore'),none]]
    return [['مجلد جديد',()=>create('folder')],['ملف نصي',()=>create('text')],['فتح',()=>openFile(selected),none],['إعادة تسمية',rename,none],['قص',()=>clipboard('move'),none],['نسخ',()=>clipboard('copy'),none],['لصق',paste,!clip],['إنشاء اختصار',()=>shortcut(dir),none],['إرسال إلى سطح المكتب (إنشاء اختصار)',()=>shortcut('desktop'),none],['حذف',()=>take('trash'),none]]
  }
  function popup(e,items){
    e.preventDefault();closeMenu();const panel=h('div',undefined,'wm-context');menu=panel;panel.setAttribute('role','menu')
    buttons(items.map(([l,fn,d])=>[l,()=>{closeMenu();fn()},d]),panel);desk.append(panel)
    const bounds=desk.getBoundingClientRect();panel.style.left=Math.max(4,Math.min(e.clientX-bounds.left,bounds.width-panel.offsetWidth-4))+'px'
    panel.style.top=Math.max(4,Math.min(e.clientY-bounds.top,bounds.height-panel.offsetHeight-4))+'px';panel.querySelector('button:not(:disabled)')?.focus()
  }
  function creationMenu(e,parent=dir){
    return ['جديد  ‹',()=>popup(e,[['مجلد',()=>{openDir(parent);create('folder')}],['مستند نصي',()=>{openDir(parent);create('text')}]])]
  }
  function explorer(body){
    const top=h('div',undefined,'wm-path');const parent=lookup(dir)?.parent;const up=btn('↑',()=>openDir(parent));up.title='المجلد الأعلى';up.disabled=!parent
    function historyNav(from,to){
      while(from.length){const target=from.pop();if(lookup(target)&&!pathOf(state,target).startsWith('سلة المحذوفات /')){to.push(dir);openDir(target,false);return}}
      render()
    }
    const back=btn('→',()=>historyNav(backStack,forwardStack)),forward=btn('←',()=>historyNav(forwardStack,backStack))
    back.ariaLabel='السابق';forward.ariaLabel='التالي';back.disabled=!backStack.length;forward.disabled=!forwardStack.length
    const trail=h('div',undefined,'wm-trail');trail.append(h('span','▰'),h('span',pathOf(state,dir)))
    top.append(back,forward,up,trail)
    const tabs=h('div',undefined,'wm-tabs')
    const home=btn('الشريط الرئيسي',()=>{ribbon.hidden=false;display.hidden=true;home.setAttribute('aria-pressed','true');layout.setAttribute('aria-pressed','false')})
    const layout=btn('عرض',()=>{ribbon.hidden=true;display.hidden=false;home.setAttribute('aria-pressed','false');layout.setAttribute('aria-pressed','true')})
    home.setAttribute('aria-pressed','true');layout.setAttribute('aria-pressed','false')
    tabs.append(home,layout);body.append(tabs)
    const ribbon=h('div',undefined,'wm-tools');buttons(cmds(),ribbon)
    const display=h('div',undefined,'wm-tools');display.hidden=true
    for(const [key,label] of [['icons','أيقونات'],['rows','قائمة']])display.append(btn(label,()=>{view=key;grid.classList.toggle('wm-rows',view==='rows')}))
    body.append(ribbon,display,top)
    const split=h('div',undefined,'wm-split'),side=h('nav');side.setAttribute('aria-label','أماكن الملفات')
    for(const id of roots){const b=btn(lookup(id).name,()=>openDir(id));if(dir===id)b.className='current';side.append(b)}
    const grid=h('div',undefined,'wm-files'+(view==='rows'?' wm-rows':''))
    grid.oncontextmenu=e=>{if(e.target===grid||e.target.classList.contains('wm-empty')){selected='';render();popup(e,dir==='bin'?cmds():[creationMenu(e),['لصق',paste,!clip]])}}
    grid.ondragover=e=>e.preventDefault();grid.ondrop=e=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-maamel-node');if(id&&dir!=='bin'&&commit({type:'move',id,parent:dir}))render()}
    function dropInto(el,id){el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.stopPropagation();e.preventDefault();const item=e.dataTransfer.getData('application/x-maamel-node');if(item&&commit(id==='bin'?{type:'trash',id:item}:{type:'move',id:item,parent:id}))render()}}
    ;[...side.children].forEach((el,i)=>dropInto(el,roots[i]))
    for(const n of children(state,dir)){
      const tile=btn('',()=>{selected=n.id;grid.querySelectorAll('[aria-pressed]').forEach(b=>b.setAttribute('aria-pressed','false'));tile.setAttribute('aria-pressed','true');ribbon.replaceChildren();buttons(cmds(),ribbon)},'wm-tile')
      tile.setAttribute('aria-pressed',String(n.id===selected));tile.append(h('span',icons[n.kind],'wm-ico'),h('span',n.name))
      tile.ondblclick=()=>openFile(n.id);tile.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();openFile(n.id)}}
      tile.oncontextmenu=e=>{selected=n.id;render();popup(e,cmds())};tile.draggable=dir!=='bin';tile.ondragstart=e=>e.dataTransfer.setData('application/x-maamel-node',n.id)
      if(n.kind==='folder'&&dir!=='bin')dropInto(tile,n.id);grid.append(tile)
    }
    if(!grid.children.length)grid.append(h('p','المجلد فارغ','wm-empty'))
    split.append(side,grid);body.append(split,h('div',gridNumbers.format(children(state,dir).length)+' عناصر','wm-footer'))
  }
  function saveDrawing(){
    if(!drawing.length){report('ارسم في اللوحة أولًا.');return}
    if(drawId){if(commit({type:'draw',id:drawId,strokes:drawing}))report('حُفظ الرسم.');return}
    const folders=state.nodes.filter(n=>n.kind==='folder'&&n.id!=='bin'&&!pathOf(state,n.id).startsWith(lookup('bin').name))
    dialog('حفظ الرسم',(f,dismiss)=>{
      const inp=h('input');inp.value='أجزاء الحاسب.png';inp.setAttribute('aria-label','اسم ملف الرسم');const sel=h('select');sel.setAttribute('aria-label','حفظ في')
      for(const n of folders){const o=h('option',pathOf(state,n.id));o.value=n.id;sel.append(o)}sel.value=dir==='bin'?'desktop':dir
      const error=h('span');f.append(inp,sel,error,btn('حفظ',()=>{if(commit({type:'create',kind:'drawing',name:inp.value,parent:sel.value,strokes:drawing})){drawId=state.nodes.at(-1).id;closeModal();report('حُفظ الرسم.')}else error.textContent=status.textContent}),dismiss)
      f.onsubmit=e=>e.preventDefault()
    })
  }
  function paint(body){
    const tabs=h('div',undefined,'wm-tabs');const file=btn('ملف',()=>{paintFile=!paintFile;render()});file.setAttribute('aria-expanded',String(paintFile))
    tabs.append(file,btn('الشريط الرئيسي',()=>{paintFile=false;render()}));body.append(tabs)
    if(paintFile){const menu=h('div',undefined,'wm-paint-file');menu.append(btn('حفظ',()=>{paintFile=false;render();saveDrawing()}),btn('فتح رسم محفوظ',()=>{paintFile=false;openDir('docs')}));body.append(menu);return}
    const tools=h('div',undefined,'wm-tools'),ink=h('input');ink.type='color';ink.value=color;ink.setAttribute('aria-label','لون الفرشاة');ink.oninput=()=>color=ink.value
    const canvas=h('canvas',undefined,'wm-canvas');canvas.width=800;canvas.height=440
    const brushList=h('select');brushList.ariaLabel='أداة الرسم'
    for(const [key,text] of [['pen','الفرشاة'],['eraser','الممحاة']]){const option=h('option',text);option.value=key;brushList.append(option)}
    brushList.value=brush;brushList.onchange=()=>brush=brushList.value
    tools.append(brushList,ink,btn('تراجع',()=>{drawing.pop();paintCanvas(canvas,drawing)}),btn('حفظ',saveDrawing),btn('رسم جديد',()=>{if(drawing.length&&!drawId){report('احفظ الرسم الحالي أولًا.');return}drawId='';drawing=[];render()}))
    let active=false
    const point=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height].map(x=>Math.max(0,Math.min(1,x)))}
    canvas.onpointerdown=e=>{if(drawing.length>=500||active)return;active=true;canvas.setPointerCapture(e.pointerId);drawing.push({color:brush==='eraser'?'#ffffff':color,points:[point(e)]});paintCanvas(canvas,drawing)}
    canvas.onpointermove=e=>{if(active&&drawing.at(-1).points.length<1000){drawing.at(-1).points.push(point(e));paintCanvas(canvas,drawing)}}
    canvas.onpointerup=canvas.onpointercancel=()=>active=false
    body.append(tools,canvas);paintCanvas(canvas,drawing)
  }
  function settings(body){
    const panel=h('div',undefined,'wm-settings-frame'),nav=h('nav'),form=h('div',undefined,'wm-settings')
    const sections={display:'جهاز العرض',background:'الخلفية',sound:'الصوت',time:'التاريخ والوقت'}
    nav.setAttribute('aria-label','أقسام الإعدادات')
    for(const [key,text] of Object.entries(sections)){const b=btn(text,()=>{settingsPane=key;render()});if(key===settingsPane)b.setAttribute('aria-current','page');nav.append(b)}
    form.append(h('h3',sections[settingsPane]));panel.append(nav,form);body.append(panel)
    function choice(label,opts,current,change){const l=h('label',label),s=h('select');for(const [value,text] of opts){const o=h('option',text);o.value=value;s.append(o)}s.value=current;s.onchange=()=>change(s.value);l.append(s);form.append(l)}
    function set(settings){if(commit({type:'settings',settings})){render();report('حُفظ الإعداد.')}}
    if(settingsPane==='display')choice('دقة الشاشة',['800×600','1280×800','1920×1200'].map(x=>[x,x]),state.settings.resolution,v=>{
      desk.dataset.res=v
      dialog('هل تريد الاحتفاظ بإعدادات العرض؟',(form,dismiss)=>{dismiss.textContent='إرجاع';form.append(btn('الاحتفاظ بالتغييرات',()=>{closeModal();set({resolution:v})}),dismiss)})
      modal.addEventListener('close',()=>{desk.dataset.res=state.settings.resolution;render()},{once:true})
    })
    const backgrounds=[['jade','أفق أخضر'],['blue','سماوي'],['dune','رمال'],...state.nodes.filter(n=>n.kind==='drawing'&&!pathOf(state,n.id).startsWith(lookup('bin').name)).map(n=>[n.id,pathOf(state,n.id)])]
    if(settingsPane==='background')choice('خلفية سطح المكتب',backgrounds,state.settings.background,v=>set({background:v}))
    const vol=h('input');vol.type='range';vol.min=0;vol.max=100;vol.value=state.settings.volume;vol.onchange=()=>set({volume:Number(vol.value)});const vl=h('label','مستوى الصوت');vl.append(vol)
    const date=h('input');date.type='datetime-local';const now=new Date(Date.now()+state.settings.clockOffset);date.value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16)
    const dl=h('label','التاريخ والوقت داخل المحاكي');dl.append(date)
    if(settingsPane==='sound')form.append(vl)
    if(settingsPane==='time')form.append(dl,btn('ضبط الوقت',()=>{if(date.value)set({clockOffset:new Date(date.value).getTime()-Date.now()})}))
    if(settingsPane==='display')form.append(h('div',state.settings.resolution,'wm-monitor'))
    if(settingsPane==='background'){
      const samples=h('div',undefined,'wm-backgrounds')
      for(const [id,label] of backgrounds.filter(([id])=>theme[id])){const button=btn(label,()=>set({background:id}));button.style.backgroundImage=theme[id];button.setAttribute('aria-pressed',String(id===state.settings.background));samples.append(button)}form.append(samples)
    }
  }
  function playTone(tone){
    const Audio=window.AudioContext||window.webkitAudioContext
    if(!Audio){report('الصوت غير متاح في هذا المتصفح.');return}
    audioContext??=new Audio();audioContext.resume().catch(()=>{})
    const g=audioContext.createGain(),osc=audioContext.createOscillator(),t=audioContext.currentTime
    const tones={bell:880,bird:1250,wave:420}
    osc.frequency.setValueAtTime(tones[tone]??880,t);osc.frequency.exponentialRampToValueAtTime((tones[tone]??880)*.65,t+.42)
    g.gain.setValueAtTime(.0001+state.settings.volume*.0015,t);g.gain.exponentialRampToValueAtTime(.0001,t+.55)
    osc.connect(g);g.connect(audioContext.destination);osc.start(t);osc.stop(t+.56)
  }
  function alarm(body){
    const wrap=h('div',undefined,'wm-settings'),input=h('input');input.type='time';input.value=state.settings.alarm?.time??'07:00'
    const label=h('label','وقت المنبه');label.append(input);const choice=h('label','صوت المنبه'),sel=h('select')
    for(const [value,text] of [['bell','جرس'],['bird','تغريد'],['wave','نغمة هادئة']]){const o=h('option',text);o.value=value;sel.append(o)}
    sel.value=state.settings.alarm?.tone??'bell';choice.append(sel);wrap.append(label,choice,btn('معاينة الصوت',()=>playTone(sel.value)),btn('ضبط المنبه',()=>{
      if(!input.value)return;playTone(sel.value);if(commit({type:'settings',settings:{alarm:{time:input.value,tone:sel.value,enabled:true}}})){render();report('تم ضبط المنبه.')}
    }))
    if(state.settings.alarm?.enabled)wrap.append(h('p','المنبه مضبوط عند '+state.settings.alarm.time),btn('إلغاء المنبه',()=>{commit({type:'settings',settings:{alarm:{...state.settings.alarm,enabled:false}}});render()}));body.append(wrap)
  }
  function practice(body){
    const qs=h('div',undefined,'wm-settings');const group=h('select');group.setAttribute('aria-label','موضوع التصنيف')
    for(const [id,name] of [['hardware','مكونات الحاسب واستخداماتها'],['filetypes','أنواع العناصر والأسماء']]){const o=h('option',name);o.value=id;group.append(o)}group.value=questionSet;group.onchange=()=>{questionSet=group.value;render()}
    body.append(group,qs)
    for(const q of exercises[questionSet]){
      const l=h('label',q.label),select=h('select');select.append(h('option','اختر إجابة'));select.firstChild.value=''
      for(const v of q.options){const o=h('option',v);o.value=v;select.append(o)}
      select.value=state.answers?.[q.id]??'';select.onchange=()=>{if(select.value&&commit({type:'answer',question:q.id,value:select.value}))report('حُفظ اختيارك.')};l.append(select);qs.append(l)
    }
  }
  function calculator(body){
    const wrap=h('div',undefined,'wm-calculator');wrap.dir='ltr';const val=h('output',calcValue);const pad=h('div')
    const math={'÷':(a,b)=>b===0?NaN:a/b,'×':(a,b)=>a*b,'−':(a,b)=>a-b,'+':(a,b)=>a+b}
    function input(k){
      if(k==='C'){calcValue='0';operand=operator=null;fresh=true}
      else if(k==='⌫'){calcValue=calcValue.slice(0,-1)||'0'}
      else if(k==='±'){calcValue=String(-Number(calcValue))}
      else if(k==='='||math[k]){
        if(operator&&(!fresh||k==='=')){const v=math[operator](operand,Number(calcValue));calcValue=Number.isFinite(v)?String(Number(v.toPrecision(12))):'خطأ'}
        operand=Number(calcValue);operator=k==='='?null:k;fresh=true
      }else if(fresh||calcValue==='خطأ'){calcValue=k==='.'?'0.':k;fresh=false}
      else if(calcValue.length<15&&!(k==='.'&&calcValue.includes('.')))calcValue=calcValue==='0'&&k!=='.'?k:calcValue+k
      val.textContent=calcValue
    }
    for(const k of ['C','±','⌫','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='])pad.append(btn(k,()=>input(k)))
    wrap.append(val,pad);body.append(wrap)
  }
  function render(){
    if(unmounted)return;closeMenu();bench.replaceChildren();bar.replaceChildren();const bg=state.settings.background
    desk.style.backgroundImage=theme[bg]||theme.jade;desk.style.backgroundSize='cover';desk.dataset.res=state.settings.resolution
    if(!theme[bg]){const pic=lookup(bg);if(pic?.kind==='drawing'){const c=h('canvas');c.width=800;c.height=440;paintCanvas(c,pic.strokes);desk.style.backgroundImage='url('+c.toDataURL()+')'}}
    const shortcuts=h('div',undefined,'wm-shortcuts')
    for(const [title,action] of [['🗂 مستكشف الملفات',()=>openDir('docs')],['🗑 سلة المحذوفات',()=>openDir('bin')]])shortcuts.append(btn(title,action))
    for(const n of children(state,'desktop'))shortcuts.append(btn(icons[n.kind]+' '+n.name,()=>{dir='desktop';openFile(n.id)}))
    bench.append(shortcuts)
    if(app&&!minimized){
      const win=h('section',undefined,'wm-window'+(maximized?' wm-max':'')),title=h('div',undefined,'wm-title');title.append(h('strong',apps[app]))
      for(const [txt,hint,fn] of [['−','تصغير',()=>{minimized=true;render()}],['□','تكبير أو استعادة',()=>{maximized=!maximized;render()}],['×','إغلاق',()=>{app='';render()}]]){
        const b=btn(txt,fn);b.setAttribute('aria-label',hint);title.append(b)
      }
      const body=h('div',undefined,'wm-body');win.append(title,body);bench.append(win)
      if(app==='explorer')explorer(body)
      if(app==='paint')paint(body)
      if(app==='settings')settings(body)
      if(app==='calc')calculator(body)
      if(app==='alarm')alarm(body)
      if(app==='practice')practice(body)
      if(app==='help'){
        const tips=[['إنشاء مجلد','افتح مكان الحفظ. اضغط مجلد جديد، ثم اكتب الاسم وأكده.'],['نقل ملف','حدد الملف، ثم قص. افتح وجهته واضغط لصق.'],['نسخ مجلد','حدد المجلد ثم انسخه والصقه في الوجهة.'],['استعادة ملف','افتح سلة المحذوفات، حدد الملف واضغط استعادة.'],['التخصيص','افتح الإعدادات واختر دقة الشاشة والخلفية.']]
        const query=h('input');query.placeholder='ابحث عن تعليمات';query.setAttribute('aria-label',query.placeholder);const results=h('div')
        function find(){results.replaceChildren();for(const [t,msg] of tips.filter(row=>row.join(' ').includes(query.value.trim()))){results.append(h('strong',t),h('p',msg))}if(!results.childElementCount)results.append(h('p','لا توجد تعليمات مطابقة.'))}
        query.oninput=find;body.append(query,results);find()
      }
    }
    const first=btn('⊞  بدء',()=>{start=!start;render()});first.setAttribute('aria-expanded',String(start));bar.append(first,btn('الملفات',()=>openDir('docs')))
    if(app)bar.append(btn(apps[app],()=>{minimized=!minimized;render()}))
    function settingsAt(key){settingsPane=key;launch('settings')}
    const clock=btn('',()=>settingsAt('time'),'wm-clock')
    function tick(){const now=new Date(Date.now()+state.settings.clockOffset),hhmm=[now.getHours(),now.getMinutes()].map(v=>String(v).padStart(2,'0')).join(':'),key=now.toDateString()+hhmm
      if(state.settings.alarm?.enabled&&state.settings.alarm.time===hhmm&&key!==lastAlarm){lastAlarm=key;playTone(state.settings.alarm.tone);report('حان موعد المنبه.')}
      clock.textContent=now.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'})}
    tick();clearInterval(timer);timer=setInterval(()=>{if(!desk.isConnected){clearInterval(timer);return}tick()},30000)
    clock.oncontextmenu=e=>popup(e,[['ضبط التاريخ والوقت',()=>settingsAt('time')]]);bar.append(btn('الصوت',()=>settingsAt('sound')),clock)
    if(start){
      const list=h('nav',undefined,'wm-start');list.setAttribute('aria-label','قائمة بدء')
      const search=h('input');search.type='search';search.placeholder='البحث في التطبيقات';search.ariaLabel=search.placeholder
      const entries=h('div',undefined,'wm-app-list')
      const shortcuts=h('div',undefined,'wm-start-rail')
      shortcuts.append(btn('المستندات',()=>openDir('docs')),btn('إعدادات النظام',()=>settingsAt('display')))
      const accessories=h('details');accessories.className='wm-accessories';accessories.append(h('summary','البرامج الملحقة'),btn('فتح الرسام',()=>launch('paint')))
      function listApps(){
        entries.replaceChildren();const query=search.value.trim()
        for(const [id,t] of Object.entries(apps))if(t.includes(query))entries.append(btn(t,()=>launch(id)))
        if(!query)entries.append(accessories);if(!entries.childElementCount)entries.append(h('p','لا توجد تطبيقات مطابقة.'))
      }
      search.oninput=listApps;search.onkeydown=e=>{if(e.key==='Enter')entries.querySelector('button')?.click()}
      listApps();list.append(search,shortcuts,entries);bench.append(list);search.focus()
    }
  }
  desk.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))closeMenu()})
  desk.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeMenu();if(start){start=false;render()}return}
    if(modal||app!=='explorer'||minimized||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return
    let fn;const ctrl=e.ctrlKey||e.metaKey
    if(dir!=='bin'){
      if(ctrl&&e.shiftKey&&e.code==='KeyN')fn=()=>create('folder')
      else if(ctrl&&e.code==='KeyC'&&selected)fn=()=>clipboard('copy')
      else if(ctrl&&e.code==='KeyX'&&selected)fn=()=>clipboard('move')
      else if(ctrl&&e.code==='KeyV'&&clip)fn=paste
      else if(e.key==='F2'&&selected)fn=rename
      else if(e.key==='Delete'&&selected)fn=()=>take('trash')
    }
    if(fn){e.preventDefault();fn()}
  })
  bench.addEventListener('contextmenu',e=>{if(e.target===bench||e.target.className==='wm-shortcuts'){e.preventDefault();popup(e,[creationMenu(e,'desktop'),['مجلد جديد',()=>{openDir('desktop');create('folder')}],['إعدادات العرض',()=>{settingsPane='display';launch('settings')}],['تخصيص',()=>{settingsPane='background';launch('settings')}]])}})
  render()
  return ()=>{unmounted=true;clearInterval(timer);audioContext?.close().catch(()=>{});closeModal();host.replaceChildren()}
}
