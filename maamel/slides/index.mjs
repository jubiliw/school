import {el,button,command,field,group,select,shell} from '../office-common/ui.mjs';
import {initial,slide} from './model.mjs';
import {images,video} from './assets.mjs';
const layouts=[['title','شريحة عنوان'],['content','عنوان ومحتوى'],['section','عنوان المقطع'],['only','عنوان فقط'],['blank','فارغ']];
const effects=[['none','بلا تأثير'],['fade','تلاشٍ'],['slide','دفع'],['zoom','تكبير']];
const themes={plain:['#ffffff','#243944','#d6e1e5'],basis:['#f9f8ee','#45583c','#9eaf52'],coast:['#eaf6fb','#215269','#67b7c6'],date:['#fff4e8','#633b29','#c68a62']};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function mount(host,input,onChange,task){
 const state=structuredClone(input||initial(task));let i=0,selected=null,ui,stage,thumbs,notes;
 const active=()=>state.body.slides[i],item=()=>active().items[selected],touch=()=>ui.touch();
 function set(prop,v){active()[prop]=v;touch();paint();}
 function pick(opts,label,val,cb){const s=select(label,opts,cb);s.value=val;return field(label,s);}
 function reorder(from,to){if(from===to||to<0||to>=state.body.slides.length)return;const [s]=state.body.slides.splice(from,1);state.body.slides.splice(to,0,s);i=to;selected=null;touch();render();}
 function goto(n){i=n;selected=null;render();}
 function add(layout='content'){if(state.body.slides.length>=24){ui.notify('الحد 24 شريحة في هذا التدريب');return;}state.body.slides.splice(++i,0,slide(layout));selected=null;touch();render();}
 function addObject(kind,asset,extra={}){if(active().items.length>=12){ui.notify('الحد 12 عنصرًا في الشريحة');return;}active().items.push({kind,asset,text:'',x:12,y:40,w:28,angle:0,frame:'none',animation:'none',duration:0.8,delay:0,...extra});selected=active().items.length-1;touch();paint();ui.tabs.children[6].click();}
 function itemChange(k,v){if(!item())return;item()[k]=v;touch();paint();}
 function duplicateSlide(){
  if(state.body.slides.length>=24){ui.notify('بلغ العرض حد الشرائح.');return;}
  const copy=structuredClone(active());state.body.slides.splice(i+1,0,copy);i++;selected=null;touch();render();
 }
 function layer(front){
  if(selected==null)return;
  const objects=active().items,[obj]=objects.splice(selected,1);selected=front?objects.length:0;objects.splice(selected,0,obj);touch();paint();ui.tabs.children[6].click();
 }
 function home(){
  const font=active().font||state.body.font||'system-ui';
  ui.ribbon.append(
   group('شرائح',command('شريحة جديدة','⊞',()=>add()),button('تكرار الشريحة',duplicateSlide),pick(layouts,'التخطيط',active().layout,v=>set('layout',v)),button('تقديم الشريحة',()=>reorder(i,i-1)),button('تأخير الشريحة',()=>reorder(i,i+1)),button('حذف الشريحة',()=>{if(state.body.slides.length<=1){ui.notify('يجب أن يحتوي العرض على شريحة واحدة على الأقل');return;}ui.dialog('حذف الشريحة الحالية؟',[],[['حذف',()=>{state.body.slides.splice(i,1);i=Math.min(i,state.body.slides.length-1);selected=null;touch();render();}]]);})),
   group('خط',pick([['system-ui','الافتراضي'],['Arial','Arial'],['Tahoma','Tahoma'],['Georgia','Georgia']],'خط الشريحة',font,v=>set('font',v)),command('غامق','B',()=>set('bold',!active().bold),true),command('مائل','𝑰',()=>set('italic',!active().italic),true)),
   group('فقرة',command('تعداد نقطي','•☰',()=>set('bullets',!active().bullets)),pick([['right','يمين'],['center','توسيط'],['left','يسار']],'المحاذاة',active().align||'right',v=>set('align',v))),
   group('عرض الشرائح',command('تشغيل العرض','▷',present)));
 }
 async function importPicture(file){
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>20*1024*1024){ui.notify('اختر صورة PNG أو JPEG أو WebP أو GIF حتى 20 ميغابايت.');return;}
  const target=active(),url=URL.createObjectURL(file);
  try{
   const img=new Image();img.src=url;await img.decode();
   const canvas=document.createElement('canvas');const scale=Math.min(1,800/Math.max(img.width,img.height));
   canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
   const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const src=canvas.toDataURL('image/jpeg',.65);
   if(JSON.stringify(state).length+2*src.length>520000){ui.notify('مساحة العرض لا تكفي لهذه الصورة. اختر صورة أصغر.');return;}
   if(host.isConnected&&active()===target)addObject('image','device',{src,alt:file.name.slice(0,100)});
  }catch{ui.notify('تعذّرت قراءة الصورة.');}finally{URL.revokeObjectURL(url);}
 }
 function selectPicture(){const input=el('input');input.type='file';input.accept='image/png,image/jpeg,image/webp,image/gif';input.onchange=()=>importPicture(input.files[0]);input.click();}
 function insert(){ui.ribbon.append(
  group('صور',button('صورة من هذا الجهاز',selectPicture),command('صور التدريب','▧',()=>ui.dialog('اختر صورة من معرض التدريب',[],[['كرة السلة',()=>addObject('image','sport')],['الجبال',()=>addObject('image','landscape')]]))),
  group('أشكال',...Object.entries({rect:'مستطيل',oval:'شكل بيضاوي',triangle:'مثلث'}).map(([type,label])=>button(label,()=>addObject('shape',type,{fill:'#4c8fb8'})))),group('نص',command('مربع نص','▣',()=>addObject('text','')),command('WordArt','𝑨',()=>addObject('art',''))),
  group('وسائط',command('فيديو من مكتبة التدريب','▶',()=>addObject('video','sport-clip'))));}
 function design(){ui.ribbon.append(group('نُسق',pick([['plain','بسيط'],['basis','الأساس'],['coast','الساحل'],['date','الرمل']],'النسق',state.body.theme,v=>{state.body.theme=v;touch();paint();}),...Object.entries(themes).map(([id,colors])=>{const labels={plain:'بسيط',basis:'الأساس',coast:'الساحل',date:'الرمل'};const b=command(labels[id],'Aa',()=>{state.body.theme=id;touch();paint();ui.tabs.children[3].click();});b.style.backgroundColor=colors[0];b.style.borderBottom='3px solid '+colors[2];b.style.color=colors[1];b.setAttribute('aria-pressed',id===state.body.theme);return b;})),
  group('أشكال مختلفة',pick([['system-ui','الافتراضي'],['Arial','Arial'],['Georgia','Georgia'],['Tahoma','Tahoma']],'الخط',state.body.font,v=>{state.body.font=v;touch();paint();})));}
 function transitions(){ui.ribbon.append(group('نقل إلى هذه الشريحة',pick(effects,'انتقال الشريحة',active().transition,v=>set('transition',v)),command('معاينة','▷',()=>motion(stage,active().transition,active().duration))),group('التوقيت',pick([.3,.6,1,2].map(v=>[v,v+' ث']),'مدة الانتقال',active().duration,v=>set('duration',+v)),button('تطبيق على الكل',()=>{const a=active();state.body.slides.forEach(s=>{s.transition=a.transition;s.duration=a.duration;});touch();ui.notify('طُبّق الانتقال على الشرائح');})));}
 function animateTab(){const node=item()||active(),key=item()?'animation':'textAnimation';ui.ribbon.append(group('حركة',el('span',item()?'العنصر المحدد':'نص الشريحة'),pick(effects,'الحركة',node[key],v=>{node[key]=v;touch();paint();})),group('التوقيت',
   pick([.3,.8,1,2,3].map(v=>[v,v+' ث']),'مدة الحركة',node.motionDuration||.8,v=>{node.motionDuration=+v;touch();}),pick([0,.5,1,2,3].map(v=>[v,v+' ث']),'تأخير الحركة',node.delay||0,v=>{node.delay=+v;touch();}))); }
 function handles(){const obj=item();if(!obj){ui.ribbon.append(group('تنسيق العنصر',el('span','حدد صورة أو مربع نص داخل الشريحة.')));return;}
  const range=(label,key,min,max)=>{const n=el('input');n.type='range';n.min=min;n.max=max;n.value=obj[key];n.oninput=()=>itemChange(key,+n.value);return field(label,n);};
  if(obj.kind==='shape'){const fill=el('input');fill.type='color';fill.value=obj.fill||'#4c8fb8';fill.onchange=()=>itemChange('fill',fill.value);ui.ribbon.append(group('تعبئة الشكل',field('لون التعبئة',fill)));}
  ui.ribbon.append(group('ترتيب',button('إحضار إلى المقدمة',()=>layer(true)),button('إرسال إلى الخلف',()=>layer(false)),range('الموقع الأفقي','x',0,85),range('الموقع الرأسي','y',0,80)),group('الحجم',range('الحجم','w',12,65),range('التدوير','angle',-180,180)),group('النمط',pick([['none','بلا إطار'],['frame','إطار']],'النمط',obj.frame,v=>itemChange('frame',v)),button('حذف العنصر',()=>{active().items.splice(selected,1);selected=null;touch();paint();ui.tabs.children[6].click();}))); }
 function motion(n,eff,duration=.7,delay=0){if(!n.animate||!eff||eff==='none'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const frames=eff==='slide'?[{translate:'-18% 0',opacity:0},{translate:'0 0',opacity:1}]:eff==='zoom'?[{scale:.6,opacity:0},{scale:1,opacity:1}]:[{opacity:0},{opacity:1}];n.animate(frames,{duration:clamp(duration,0,4)*1000,delay:clamp(delay,0,4)*1000,fill:'backwards'});}
 function content(canvas,s,show=false){
  canvas.replaceChildren();const palette=themes[state.body.theme]||themes.plain;
  canvas.style.cssText='position:relative;overflow:hidden;aspect-ratio:16/9;width:100%;direction:rtl;container-type:inline-size;box-shadow:0 1px 8px #173a401b;border:1px solid #afc0c4;border-bottom:7px solid '+palette[2];
  canvas.style.background=palette[0];canvas.style.color=palette[1];canvas.style.fontFamily=s.font||state.body.font;
  function textBox(prop,label,top,height,big){
   const n=el(show?'div':'textarea');n.style.cssText='position:absolute;inset-inline:5%;width:90%;top:'+top+'%;height:'+height+'%;font:inherit;text-align:inherit;white-space:pre-line;overflow:auto;resize:none;border:1px '+(show?'solid transparent':'dashed #a9b8bb')+';color:inherit;background:transparent;padding:1%;font-size:'+(big?'clamp(15px,4.8cqw,42px)':'clamp(12px,3cqw,32px)')+';font-weight:'+(big?'700':'400');
   if(s.align)n.style.textAlign=s.align;else if(s.layout==='title'||s.layout==='section')n.style.textAlign='center';if(s.bold)n.style.fontWeight='bold';if(s.italic)n.style.fontStyle='italic';
   if(show){n.textContent=prop==='text'&&s.bullets?s[prop].split('\n').filter(Boolean).map(v=>'• '+v).join('\n'):s[prop];motion(n,s.textAnimation,s.motionDuration,s.delay);}
   else{n.placeholder=label;n.setAttribute('aria-label',label);n.value=s[prop];n.maxLength=3000;n.onfocus=()=>{selected=null;};n.oninput=()=>{s[prop]=n.value;touch();if(prop==='title')drawThumbs();};if(prop==='text'&&s.bullets)n.style.borderInlineStart='5px dotted '+palette[2];}
   canvas.append(n);
  }
  if(s.layout!=='blank')textBox('title','عنوان الشريحة',s.layout==='title'?19:6,23,true);
  if(!['blank','only'].includes(s.layout))textBox('text',s.layout==='title'?'العنوان الفرعي':'محتوى الشريحة',s.layout==='title'?51:35,s.layout==='title'?30:55,false);
  s.items.forEach((o,k)=>{const frame=el('div');frame.style.cssText='position:absolute;display:grid;align-items:start;touch-action:none;max-height:90%;transform-origin:center;';frame.style.left=o.x+'%';frame.style.top=o.y+'%';frame.style.width=Math.min(o.w,100-o.x)+'%';frame.style.transform='rotate('+o.angle+'deg)';if(o.frame==='frame')frame.style.border='4px solid white',frame.style.boxShadow='0 2px 7px #0006';if(!show&&selected===k)frame.style.outline='2px solid #187c73';
   let n;if(o.kind==='image'){n=el('img');const uploaded=o.asset==='device'&&typeof o.src==='string'&&o.src.startsWith('data:image/jpeg;base64,');n.src=uploaded?o.src:images[o.asset]||images.landscape;n.alt=uploaded?o.alt:o.asset==='sport'?'كرة سلة في الملعب':'منظر جبلي';n.draggable=false;}
   else if(o.kind==='shape'){n=el('div');n.style.aspectRatio='1.6';n.style.backgroundColor=/^#[0-9a-f]{6}$/i.test(o.fill)?o.fill:'#4c8fb8';if(o.asset==='oval')n.style.borderRadius='50%';if(o.asset==='triangle')n.style.clipPath='polygon(50% 0,100% 100%,0 100%)';}
   else if(o.kind==='video'){n=el('video');n.src=video;n.controls=show;n.preload='metadata';n.playsInline=true;n.title='مقطع تدريبي لكرة سلة';}
   else {n=el(show?'div':'textarea');if(show)n.textContent=o.text;else{n.value=o.text;n.placeholder=o.kind==='art'?'نص زخرفي':'أدخل النص';n.setAttribute('aria-label',n.placeholder);n.oninput=()=>{o.text=n.value;touch();};}
    n.style.cssText='min-height:2em;font:inherit;background:transparent;border:0;color:inherit;resize:vertical';if(o.kind==='art')n.style.textShadow='1px 2px #c89253',n.style.fontWeight='800';}
   n.style.width='100%';if(o.kind==='image'&&o.ratio)n.style.aspectRatio=String(o.ratio),n.style.objectFit='fill';frame.append(n);canvas.append(frame);
   if(show){motion(frame,o.animation,o.motionDuration,o.delay);return;}
   if(o.kind==='image'){
    frame.classList.add('slide-picture');frame.classList.toggle('chosen',selected===k);
    for(const [mode,label] of [['corner','تغيير الحجم من الزاوية'],['side','تغيير عرض الصورة'],['rotate','تدوير الصورة']]){
     const grip=button('',()=>{});grip.className='picture-grip '+mode;grip.setAttribute('aria-label',label);frame.append(grip);
     grip.onpointerdown=e=>{
      e.stopPropagation();e.preventDefault();const box=canvas.getBoundingClientRect(),rect=frame.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      const initial=o.w,height=frame.offsetHeight,width=frame.offsetWidth,angle=o.angle||0,rad=angle*Math.PI/180,start=Math.atan2(e.clientY-cy,e.clientX-cx);
      grip.setPointerCapture(e.pointerId);
      grip.onpointermove=ev=>{
       if(mode==='rotate'){o.angle=Math.round((angle+(Math.atan2(ev.clientY-cy,ev.clientX-cx)-start)*180/Math.PI+540)%360-180);frame.style.transform='rotate('+o.angle+'deg)';}
       else{const delta=(ev.clientX-e.clientX)*Math.cos(rad)+(ev.clientY-e.clientY)*Math.sin(rad);o.w=clamp(initial+delta/box.width*100,8,100-o.x);frame.style.width=o.w+'%';if(mode==='side'){o.ratio=(width+(o.w-initial)*box.width/100)/Math.max(1,height);n.style.aspectRatio=String(o.ratio);n.style.objectFit='fill';}}
      };
      grip.onpointerup=grip.onpointercancel=()=>{grip.onpointermove=null;touch();paint()};
     };
    }
   }
   frame.tabIndex=0;frame.setAttribute('aria-label','تحديد العنصر '+(k+1));
   const choose=()=>{selected=k;canvas.querySelectorAll('.slide-picture').forEach(f=>f.classList.toggle('chosen',f===frame));for(const other of canvas.querySelectorAll('[tabindex]'))other.style.outline='';frame.style.outline='2px solid #187c73';if(ui.tabs.children[5].getAttribute('aria-pressed')==='true')ui.tabs.children[5].click();else ui.tabs.children[6].click();};
   frame.onfocus=choose;frame.onpointerdown=e=>{choose();if(e.target.tagName==='TEXTAREA')return;e.preventDefault();const rect=canvas.getBoundingClientRect(),x=o.x,y=o.y,sx=e.clientX,sy=e.clientY;frame.setPointerCapture(e.pointerId);
    frame.onpointermove=ev=>{o.x=Math.round(clamp(x+(ev.clientX-sx)/rect.width*100,0,85));o.y=Math.round(clamp(y+(ev.clientY-sy)/rect.height*100,0,80));frame.style.left=o.x+'%';frame.style.top=o.y+'%';};frame.onpointerup=()=>{frame.onpointermove=null;touch();paint();ui.tabs.children[6].click();};};
   frame.onkeydown=e=>{if(e.target.tagName==='TEXTAREA')return;const d={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[e.key];if(d){e.preventDefault();o.x=clamp(o.x+d[0],0,85);o.y=clamp(o.y+d[1],0,80);touch();paint();}};
  });
 }
 function drawThumbs(){thumbs.replaceChildren();state.body.slides.forEach((s,k)=>{const label=(k+1)+' · '+(s.title||'شريحة بلا عنوان'),b=button('',()=>goto(k));b.setAttribute('aria-label',label);b.className='slide-thumb';const mini=el('span',null,'thumb-content'),colors=themes[state.body.theme]||themes.plain;mini.style.background=colors[0];mini.style.borderBottom='3px solid '+colors[2];mini.style.color=colors[1];mini.append(el('strong',s.title||' '),el('small',s.text||' '));b.append(el('span',String(k+1)),mini);b.setAttribute('aria-pressed',k===i);b.draggable=true;b.ondragstart=e=>e.dataTransfer.setData('text/plain',String(k));b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();const from=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(from)&&from>=0&&from<state.body.slides.length)reorder(from,k);};thumbs.append(b);});}
 function paint(){drawThumbs();content(stage,active());notes.value=active().notes;}
 function present(start=0){
  let ix=Number.isInteger(start)?clamp(start,0,state.body.slides.length-1):0;const dlg=el('dialog');dlg.setAttribute('aria-label','عرض الشرائح');dlg.style.cssText='width:min(1000px,96vw);max-width:98vw;padding:12px';
  const board=el('div'),tools=el('div',null,'odlg-actions'),counter=el('span'),speaker=el('p');speaker.hidden=true;const update=()=>{const s=state.body.slides[ix];content(board,s,true);motion(board,s.transition,s.duration);counter.textContent=(ix+1)+' / '+state.body.slides.length;speaker.textContent=s.notes||'لا توجد ملاحظات';};
  const next=()=>{if(ix<state.body.slides.length-1){ix++;update();}else dlg.close();},prev=()=>{if(ix>0){ix--;update();}};
  tools.append(button('السابق',prev),counter,button('التالي',next),button('ملاحظات المتحدث',()=>{speaker.hidden=!speaker.hidden;}),button('إنهاء العرض',()=>dlg.close()));dlg.append(board,tools,speaker);board.onclick=e=>{if(e.target.tagName!=='VIDEO')next();};ui.r.append(dlg);dlg.onclose=()=>dlg.remove();
  dlg.onkeydown=e=>{if(['ArrowRight','ArrowDown','Enter',' '].includes(e.key)&&e.target.tagName!=='BUTTON'){e.preventDefault();next();}else if(['Backspace','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();prev();}};update();dlg.showModal();dlg.tabIndex=-1;dlg.focus();
 }
 function render(){i=clamp(i,0,state.body.slides.length-1);ui.work.replaceChildren();ui.tabset([['الشريط الرئيسي',home],['إدراج',insert],['تصميم',design],['انتقالات',transitions],['حركات',animateTab],['تنسيق العنصر',handles],['عرض الشرائح',()=>ui.ribbon.append(group('بدء عرض الشرائح',command('من البداية • F5','▷',()=>present()),button('من الشريحة الحالية',()=>present(i))))]]);
  thumbs=el('nav',null,'slide-nav');thumbs.setAttribute('aria-label','مصغرات الشرائح');stage=el('div');notes=el('textarea');notes.placeholder='ملاحظات المتحدث';notes.setAttribute('aria-label','ملاحظات المتحدث');notes.maxLength=1500;notes.className='notes-area';notes.oninput=()=>{active().notes=notes.value;touch();};const editor=el('div',null,'slide-editor'),body=el('div');body.append(stage,notes);editor.append(thumbs,body);ui.work.append(editor);paint();
 }
 ui=shell(host,'العروض التقديمية',state,onChange,()=>initial(task),render);ui.r.addEventListener('keydown',e=>{if(e.key==='F5'){e.preventDefault();present(e.shiftKey?i:0);}});render();
}
