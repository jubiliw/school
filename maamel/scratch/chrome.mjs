import {paintBackdrop,paintSprite} from './stage.mjs';
import {scenes,sounds,poses} from './tools.mjs';
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
function action(name,fn){const b=make('button',name);b.type='button';b.onclick=fn;return b;}
export function menu(root,title,entries){
 const wrap=make('details');wrap.className='block-menu';const summary=make('summary',title),items=make('div');items.className='menu-items';
 for(const [name,cb] of entries)items.append(action(name,()=>{wrap.open=false;cb();}));
 wrap.append(summary,items);root.append(wrap);return wrap;
}
export function modal(root,title){
 const d=make('dialog');d.className='block-dialog';const h=make('header'),t=make('h3',title),close=action('إغلاق',()=>d.close());h.append(t,close);d.append(h);d.setAttribute('aria-label',title);d.onclose=()=>d.remove();root.append(d);d.showModal();return d;
}
export function backdropLibrary(root,active,choose){
 const dialog=modal(root,'اختيار خلفية'),list=make('div');list.className='block-library-grid';
 for(const [id,title] of scenes.scratch){const b=action(title,()=>{choose(id);dialog.close();});b.setAttribute('aria-pressed',String(id===active));const canvas=make('canvas');canvas.width=160;canvas.height=120;const c=canvas.getContext('2d');if(c){c.scale(1/3,1/3);c.translate(240,180);paintBackdrop(c,'scratch',id);}b.prepend(canvas);list.append(b);}
 dialog.append(list);
}
export const costumes=poses;
export function costumePane(section,state,update){
 const title=make('h3','مظاهر الكائن');section.append(title);const gallery=make('div');gallery.className='block-library-grid';
 for(const [id,name] of costumes){const b=action(name,()=>update(id));b.setAttribute('aria-pressed',String((state.costume??'orange')===id));const cv=make('canvas');cv.width=150;cv.height=90;const c=cv.getContext('2d');if(c)paintSprite(c,'scratch',80,50,0,2,id);b.prepend(cv);gallery.append(b);}
 section.append(gallery);
}
export function soundPane(section,current,preview,add,remove){
 section.append(make('h3','أصوات الكائن'));const list=make('div');list.className='clip-list';
 for(const id of current){const name=sounds.find(([k])=>k===id)?.[1];if(!name)continue;
  const row=make('div');row.className='clip';row.append(make('strong',name),action('استمع إلى '+name,()=>preview(id)),action('إزالة '+name,()=>remove(id)));list.append(row);
 }section.append(list);
 const b=action('اختيار صوت',()=>{const dialog=modal(section,'مكتبة الأصوات');for(const [id,title] of sounds){const row=make('div');row.className='clip';const take=action(current.includes(id)?'مضاف':'إضافة '+title,()=>{dialog.close();add(id);});take.disabled=current.includes(id);row.append(make('strong',title),action('استمع إلى '+title,()=>preview(id)),take);dialog.append(row);}});section.append(b);
}
