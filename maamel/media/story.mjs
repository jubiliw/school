import {unpack,rate} from '../av/model.mjs'
export const storyTasks=[
 {id:'gardens-film',title:'فيلم حدائق الملك عبدالله العالمية',page:155,instructions:'اجمع صورًا مرخّصة للمشروع. سجّل تعليقك في معمل تحرير الصوت وصدّره. أضف الصور والتسجيل إلى لوحة العمل ثم صدّر الفيديو لعرضه في الفصل.'},
 {id:'forest-media',title:'دمج صور الغابة وصوتها',page:152,instructions:'أضف صورتين من مجلد الغابة إلى لوحة العمل، وأرفق ملف الصوت الذي صدّرته من معمل الصوت ثم عاين القصة.'},
 {id:'forest-story',title:'أنشئ قصة متحركة',page:154,instructions:'رتّب صور الحيوانات وأضف صوت الغابة. طبّق بريق العدسة على الأولى والتحريك والتكبير على الثانية. ضع عنوان «الحيوانات في الغابة» بنمط المغامرة ثم صدّر الفيلم.'}
]
export function gradeStory(story,id){
 const scenes=Array.isArray(story?.scenes)?story.scenes:[]
 const picture=s=>typeof s?.src==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(s.src)&&s.src.length>100
 const first=scenes[0],second=scenes[1]
 const checks=[[new Set(scenes.filter(picture).map(s=>s.src)).size>=2,'صورتان مختلفتان'],[unpack(story?.audio?.pcm)?.some(n=>Math.abs(n-128)>4),'صوت مسموع']]
 if(id==='gardens-film')checks.push([Number.isSafeInteger(story?.revision)&&story.exportRevision===story.revision,'تصدير الفيلم بعد إضافة الصور والتعليق']);
 if(id==='forest-story')checks.push([picture(first)&&first.effect==='sparkles','بريق العدسة للصورة الأولى'],[picture(second)&&second.motion==='panzoom','حركة الصورة الثانية'],[first?.title?.trim()==='الحيوانات في الغابة'&&first?.style==='adventure','عنوان المغامرة'],[Number.isSafeInteger(story?.revision)&&story.exportRevision===story.revision,'تصدير النسخة الحالية'])
 return {score:Math.round(100*checks.filter(([ok])=>ok).length/checks.length),feedback:checks.filter(([ok])=>!ok).map(([,label])=>label).join('، ')||'اكتملت معايير القصة.'}
}
export function soundBuffer(ctx,pcm){
 const samples=unpack(pcm)
 if(!samples?.length)return null
 const buffer=ctx.createBuffer(1,samples.length,rate),channel=buffer.getChannelData(0)
 samples.forEach((v,i)=>{channel[i]=(v-128)/128})
 return buffer
}
export function paintFrame(canvas,img,scene,fraction){
 const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height
 g.fillStyle='#182427';g.fillRect(0,0,w,h)
 if(!img)return
 const moving=scene.motion==='panzoom',scale=Math.min(w/img.width,h/img.height)*(moving?1+.2*fraction:1)
 const iw=img.width*scale,ih=img.height*scale
 g.drawImage(img,(w-iw)/2+(moving?12*Math.sin(fraction*Math.PI):0),(h-ih)/2,iw,ih)
 if(scene.effect==='sparkles'){
  for(let i=0;i<14;i++){const x=((i*71+31)%997)/997*w,y=((i*131+67)%953)/953*h,r=2+5*Math.abs(Math.sin(fraction*9+i))
   g.fillStyle='rgba(255,245,180,.85)';g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.25,y-r*.25);g.lineTo(x+r,y);g.lineTo(x+r*.25,y+r*.25);g.lineTo(x,y+r);g.lineTo(x-r*.25,y+r*.25);g.lineTo(x-r,y);g.lineTo(x-r*.25,y-r*.25);g.closePath();g.fill()}
 }
 if(scene.title){g.textAlign='center';g.font=(scene.style==='adventure'?'bold 40px':'30px')+' sans-serif';g.lineWidth=5;g.strokeStyle='#193039';g.strokeText(scene.title,w/2,h*.82,w*.94);g.fillStyle=scene.style==='adventure'?'#ffdc75':'white';g.fillText(scene.title,w/2,h*.82,w*.94)}
}
