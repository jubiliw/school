import {exercises} from './exercises.mjs'
const core = new Set(['desktop','docs','bin'])
const animalFolder = 'G4.S1.1.2_animals_photos'
export const animals = [
  {id:'bird',name:'نورس',category:'الطيور',symbol:'🕊️'},
  {id:'fish',name:'سمكة',category:'الأسماك',symbol:'🐟'},
  {id:'cat',name:'قطة',category:'الثدييات',symbol:'🐈'}
]
const prompts = {
  animals:'داخل المستندات أنشئ «الحيوانات» وبداخله الطيور والأسماك والثدييات. افتح صور التدريب، ثم سمّها نورس وسمكة وقطة مع الإبقاء على الامتداد .png وانقل كل صورة إلى فئتها.',
  continents:'أنشئ «قارات العالم» على سطح المكتب، وأضف آسيا وأستراليا وأفريقيا وأمريكا وأوروبا بداخله. أضف بلدك داخل آسيا، ثم جرّب نسخ مجلد بلد آخر ونقله وحذفه.',
  project:'أنشئ على سطح المكتب المستندات والصور ومقاطع الفيديو. داخل كل منها أنشئ مجلدين باسم المعلمين والطلبة. ارسم أجزاء الحاسب واحفظ الرسم واستخدمه خلفية.'
}
export const tasks = [
  {id:'hardware',title:'مكونات الحاسب واستخداماتها',page:'١٨–١٩',instructions:'افتح نشاط التصنيف. صنّف الأجهزة ثم اختر الأداة المناسبة لكل استخدام.'},
  {id:'filetypes',title:'الملفات والمجلدات والبرامج',page:'٢٩–٣٠',instructions:'افتح نشاط التصنيف. ميّز بين أنواع العناصر ثم تحقق من صلاحية أسماء المجلدات.'},
  {id:'display',title:'إعدادات جهاز الحاسب',page:'٣٤–٣٨',instructions:'اضبط دقة الشاشة الافتراضية إلى 1920×1200 واحتفظ بها، ثم اختر خلفية جديدة وجرّب تعديل مستوى الصوت.'},
  {id:'alarm',title:'المنبه وأصوات النظام',page:'٣٧',instructions:'افتح المنبه من قائمة بدء، واختر صوتًا ووقتًا واضبط المنبه. تأكد أن مستوى الصوت مسموع ثم غيّر السمة.'},
  {id:'animals',title:'تنظيم صور الحيوانات',page:'٣١–٣٢',instructions:prompts.animals},
  {id:'continents',title:'مجلدات قارات العالم',page:'٣١',instructions:prompts.continents},
  {id:'project',title:'مشروع تنظيم سطح المكتب',page:'٣٩',instructions:prompts.project}
]
const folder=(id,parent,name)=>({id,parent,name,kind:'folder'})
export function initial(task='animals'){
  return {version:1,task:tasks.some(t=>t.id===task)?task:'animals',answers:{},nodes:[
    folder('desktop',null,'سطح المكتب'),folder('docs',null,'المستندات'),folder('bin',null,'سلة المحذوفات'),
    folder('samples','docs',animalFolder),
    ...animals.map((a,i)=>({id:a.id,parent:'samples',kind:'image',name:'صورة '+(i+1)+'.png',asset:a.id}))
  ],settings:{background:'jade',resolution:'1280×800',volume:60,clockOffset:0}}
}
const key=s=>s.normalize('NFC').trim().toLocaleLowerCase()
const err=msg=>{throw Error(msg)}
function validName(s){
  if(typeof s!=='string'||s.trim()!==s||!s||s.length>96||/[<>:"/\\|?*\x00-\x1F]/u.test(s)||/[.]$/.test(s)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(s))err('اكتب اسمًا صالحًا دون رموز محجوزة.')
}
const node=(s,id)=>s.nodes.find(n=>n.id===id)
export const children=(s,id)=>s.nodes.filter(n=>n.parent===id)
function ancestors(s,id){
  const path=[];let n=node(s,id)
  while(n){if(path.includes(n.id))err('اكتُشف مسار دائري.');path.unshift(n.id);n=node(s,n.parent)}
  return path
}
export function pathOf(s,id){return ancestors(s,id).map(k=>node(s,k).name).join(' / ')}
function dest(s,id){
  const n=node(s,id);if(!n||n.kind!=='folder'||ancestors(s,id).includes('bin'))err('اختر مجلدًا متاحًا.')
}
function unique(s,parent,name,except){validName(name);if(children(s,parent).some(n=>n.id!==except&&key(n.name)===key(name)))err('يوجد عنصر بهذا الاسم في المجلد.')}
function generate(){return globalThis.crypto?.randomUUID?.()??'f'+Date.now().toString(36)+Math.random().toString(36).slice(2)}
function copyName(s,parent,name){
  let i=1,result=name
  const idx=name.lastIndexOf('.'), ext=idx>0?name.slice(idx):'',base=ext?name.slice(0,idx):name
  while(children(s,parent).some(n=>key(n.name)===key(result)))result=base.slice(0,80)+' ('+(++i)+')'+ext
  return result
}
export function valid(s){
  if(!s||s.version!==1||!Array.isArray(s.nodes)||s.nodes.length>600||!s.settings)return false
  const index=new Map(),names=new Set(),rootOf=new Map()
  try{
    for(const n of s.nodes){
      if(!n||typeof n.id!=='string'||!n.id||n.id.length>100||index.has(n.id)||!['folder','text','image','drawing'].includes(n.kind))return false
      index.set(n.id,n)
    }
    for(const root of core){
      if(index.get(root)?.kind!=='folder'||index.get(root)?.parent!==null)return false
      rootOf.set(root,root)
    }
    for(const n of s.nodes){
      validName(n.name)
      if(!rootOf.has(n.id)){
        const visited=new Set()
        let current=n
        while(!rootOf.has(current.id)){
          if(visited.has(current.id))return false
          visited.add(current.id);current=index.get(current.parent)
          if(current?.kind!=='folder')return false
        }
        for(const id of visited)rootOf.set(id,rootOf.get(current.id))
      }
      const nameKey=JSON.stringify([n.parent,key(n.name)])
      if(n.parent!=='bin'&&names.has(nameKey))return false
      names.add(nameKey)
      if(n.kind==='text'&&(typeof n.content!=='string'||n.content.length>50000))return false
      if(n.kind==='image'&&!animals.some(a=>n.asset===a.id))return false
      if(n.kind==='drawing'&&(!Array.isArray(n.strokes)||n.strokes.length>500||!n.strokes.every(st=>st&&/^#[0-9a-f]{6}$/i.test(st.color)&&Array.isArray(st.points)&&st.points.length>0&&st.points.length<=1000&&st.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)))))return false
    }
    const alarm=s.settings.alarm
    if(alarm&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(alarm.time)||!['wave','bell','bird'].includes(alarm.tone)||typeof alarm.enabled!=='boolean'))return false
    if(s.answers!==undefined){
      if(!s.answers||typeof s.answers!=='object'||Array.isArray(s.answers))return false
      for(const [id,answer] of Object.entries(s.answers)){
        if(!Object.values(exercises).flat().some(q=>q.id===id&&q.options.includes(answer)))return false
      }
    }
    return ['800×600','1280×800','1920×1200'].includes(s.settings.resolution)&&Number.isFinite(s.settings.clockOffset)&&Math.abs(s.settings.clockOffset)<3.2e12&&Number.isFinite(s.settings.volume)&&s.settings.volume>=0&&s.settings.volume<=100&&(['jade','blue','dune'].includes(s.settings.background)||node(s,s.settings.background)?.kind==='drawing')
  }catch{return false}
}
export function apply(state,op){
  const s=structuredClone(state), n=node(s,op.id), type=op.type
  if(type==='answer'){
    const q=Object.values(exercises).flat().find(q=>q.id===op.question&&q.options.includes(op.value));if(!q)err('اختيار غير متاح.')
    s.answers={...s.answers,[op.question]:op.value}
  }else if(type==='settings'){s.settings={...s.settings,...op.settings}}
  else if(type==='create'){
    dest(s,op.parent);unique(s,op.parent,op.name)
    if(!['folder','text','drawing'].includes(op.kind))err('نوع غير متاح.')
    s.nodes.push({id:generate(),kind:op.kind,name:op.name,parent:op.parent,...(op.kind==='text'?{content:op.content??''}:op.kind==='drawing'?{strokes:op.strokes??[]}:{})})
  }else{
    if(!n||core.has(n.id))err('اختر ملفًا أو مجلدًا.')
    if(ancestors(s,n.id).includes('bin')&&type!=='restore')err('استعد العنصر أولًا.')
    if(type==='rename'){unique(s,n.parent,op.name,n.id);n.name=op.name}
    else if(type==='write'&&n.kind==='text')n.content=op.content
    else if(type==='draw'&&n.kind==='drawing')n.strokes=op.strokes
    else if(type==='trash'){n.originalParent=n.parent;n.parent='bin'}
    else if(type==='restore'){
      if(n.parent!=='bin')err('العنصر خارج السلة.')
      const parent=node(s,n.originalParent)&&!ancestors(s,n.originalParent).includes('bin')?n.originalParent:'desktop'
      n.name=copyName(s,parent,n.name);n.parent=parent;delete n.originalParent
    }else if(type==='move'||type==='copy'){
      dest(s,op.parent);if(ancestors(s,op.parent).includes(n.id))err('لا يمكن وضع مجلد داخل نفسه.')
      if(type==='move'){unique(s,op.parent,n.name,n.id);n.parent=op.parent}
      else{
        const originals=s.nodes.slice(),clone=(src,parent,name)=>{
          if(s.nodes.length>=600)err('وصلت مساحة التدريب إلى حدها.')
          const id=generate();s.nodes.push({...structuredClone(src),parent,name,id})
          originals.filter(v=>v.parent===src.id).forEach(c=>clone(c,id,c.name))
        };clone(n,op.parent,copyName(s,op.parent,n.name))
      }
    }else err('العملية غير متاحة لهذا العنصر.')
  }
  const bg=s.settings.background
  if(!['jade','blue','dune'].includes(bg)&&ancestors(s,bg).includes('bin'))s.settings.background='jade'
  if(!valid(s))err('تجاوزت العملية حدود مساحة التدريب.')
  return s
}
const norm=s=>key(s).replace(/[أإآ]/g,'ا').replace(/[ًٌٍَُِّْـ]/g,'')
export function grade(state,task='animals'){
  const s=valid(state)?state:initial(), criteria=[]
  const add=(label,v)=>criteria.push({label,passed:Boolean(v)})
  const sub=(id,name)=>children(s,id).find(n=>n.kind==='folder'&&norm(n.name)===norm(name))?.id
  if(exercises[task]&&Array.isArray(exercises[task])){
    for(const q of exercises[task])add(q.label,s.answers?.[q.id]===q.answer)
  }else if(task==='display'){
    add('الاحتفاظ بدقة 1920×1200',s.settings.resolution==='1920×1200')
    add('تغيير الخلفية',s.settings.background!=='jade')
    add('ضبط مستوى الصوت',s.settings.volume!==60)
  }else if(task==='alarm'){
    add('منبّه مضبوط على وقت صالح',/^([01]\d|2[0-3]):[0-5]\d$/.test(s.settings.alarm?.time||'')&&s.settings.alarm?.enabled===true)
    add('صوت المنبه مختار ومسموع',s.settings.alarm?.enabled===true&&['bell','bird','wave'].includes(s.settings.alarm?.tone)&&s.settings.volume>0)
    add('اختيار خلفية جديدة',s.settings.background!=='jade')
  }else if(task==='continents'){
    const root=sub('desktop','قارات العالم');add('وجود قارات العالم على سطح المكتب',root)
    for(const name of ['آسيا','أستراليا','أفريقيا','أمريكا','أوروبا'])add('مجلد '+name,sub(root,name))
    add('مجلد البلد داخل آسيا',children(s,sub(root,'آسيا')).some(n=>n.kind==='folder'))
  }else if(task==='project'){
    for(const name of ['المستندات','الصور','مقاطع الفيديو']){
      const f=sub('desktop',name);add(name,f)
      for(const role of ['المعلمين','الطلبة'])add(name+' / '+role,sub(f,role))
    }
    const drawn=n=>n.kind==='drawing'&&n.strokes.some(st=>st.points.length>1)&&!ancestors(s,n.id).includes('bin')
    add('حفظ رسم في ملف',s.nodes.some(drawn))
    const bg=node(s,s.settings.background);add('اختيار الرسم خلفية',bg&&drawn(bg))
  }else{
    const root=sub('docs','الحيوانات');add('الحيوانات في المستندات',root)
    for(const a of animals){
      const category=sub(root,a.category);add('مجلد '+a.category,category)
      const f=node(s,a.id);add('تسمية صورة '+a.name,f&&f.kind==='image'&&f.asset===a.id&&norm(f.name)===norm(a.name+'.png')&&!ancestors(s,f.id).includes('bin'))
      add('نقل '+a.name+' إلى '+a.category,category&&f?.parent===category&&f.kind==='image'&&f.asset===a.id)
    }
  }
  const score=criteria.filter(c=>c.passed).length
  return {score:Math.round(100*score/criteria.length),max:100,criteria,feedback:criteria.filter(c=>!c.passed).map(c=>c.label).join('، ')||'اجتزت جميع معايير المهمة.'}
}
