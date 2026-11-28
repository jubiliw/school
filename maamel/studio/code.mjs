export function initial(lang){return {name:lang==='html'?'index.html':'main.py',source:'',stdin:''}}
export function mount(host,state,change,lang){
 const html=lang==='html',ext=html?'html':'py';
 host.innerHTML='<section class="code-studio"><header><button data-open>فتح ملف</button><input type="file" hidden><button data-save>تنزيل الملف</button><button data-run>'+ (html?'معاينة':'تشغيل F5')+'</button>'+(!html?'<button data-stop disabled>إيقاف</button>':'')+'</header><div class="editor-columns"><section><label>اسم الملف<input data-name dir="ltr"></label><textarea data-source dir="ltr" aria-label="محرر الشيفرة" spellcheck="false"></textarea></section><section data-result><h3>'+(html?'معاينة الصفحة':'Python Shell')+'</h3></section></div></section>';
 const $=selector=>host.querySelector(selector),source=$('[data-source]'),name=$('[data-name]'),result=$('[data-result]'),file=$('[type=file]');
 file.accept='.'+ext;source.value=state.source;name.value=state.name;
 const sync=()=>{state={...state,source:source.value,name:name.value};change(state)};
 source.oninput=name.oninput=sync;
 let frame,channel,timeout,generation=0;
 const output=document.createElement('pre');
 if(!html){
  result.insertAdjacentHTML('beforeend','<label>مدخلات input (قيمة في كل سطر)<textarea data-input dir="auto"></textarea></label>');
  const input=$('[data-input]');input.value=state.stdin;input.oninput=()=>{state.stdin=input.value;sync()};
  output.dir='ltr';output.setAttribute('aria-live','polite');result.append(output);
 }
 function stop(){generation++;clearTimeout(timeout);channel?.port1.close();frame?.remove();frame=null;if(!html)$('[data-stop]').disabled=true}
 function run(){
  stop();const current=generation;
  frame=document.createElement('iframe');frame.title=html?'معاينة HTML':'مشغل Python';
  if(html){
   frame.setAttribute('sandbox','');frame.referrerPolicy='no-referrer';
   frame.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; img-src data:; style-src &apos;unsafe-inline&apos;; form-action &apos;none&apos;; base-uri &apos;none&apos;">'+source.value;
   result.append(frame);return;
  }
  output.textContent='';frame.setAttribute('sandbox','allow-scripts');frame.hidden=true;frame.src='/studio/python-frame.html';
  frame.onload=()=>{
   if(current!==generation)return;
   channel=new MessageChannel();channel.port1.onmessage=({data})=>{
    if(current!==generation)return;
    if(typeof data.text==='string')output.append(document.createTextNode(data.text));
    if(data.error)output.append(document.createTextNode('\n'+data.error));
    if(data.done)stop();
   };
   frame.contentWindow.postMessage({source:source.value,stdin:state.stdin},'*',[channel.port2]);
  };
  $('[data-stop]').disabled=false;result.append(frame);timeout=setTimeout(()=>{stop();output.append('انتهت مهلة التشغيل.')},15000);
 }
 $('[data-run]').onclick=run;
 if(!html)$('[data-stop]').onclick=()=>{stop();output.append('\nتوقف التنفيذ.')};
 $('[data-open]').onclick=()=>file.click();file.onchange=async()=>{const f=file.files[0];if(!f)return;source.value=await f.text();name.value=f.name;sync();if(html)run();file.value=''};
 $('[data-save]').onclick=()=>{const link=document.createElement('a');const url=URL.createObjectURL(new Blob([source.value],{type:html?'text/html':'text/x-python'}));link.href=url;link.download=name.value.trim()||initial(lang).name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 source.onkeydown=e=>{if(e.key==='F5'){e.preventDefault();run()}if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();source.setRangeText('    ',source.selectionStart,source.selectionEnd,'end');sync()}};
 if(html)run();return stop;
}
