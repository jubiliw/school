const safeSource=src=>typeof src==='string'&&src.length<250000&&/^data:image\/jpeg;base64,[a-z0-9+/]+=*$/i.test(src)
export function pictureElement(run){
  if(!safeSource(run.src))return null
  const img=document.createElement('img')
  img.src=run.src;img.alt=String(run.alt||'صورة').slice(0,100)
  img.width=Math.min(650,Math.max(32,Number(run.width)||180))
  img.style.maxWidth='100%';img.style.height='auto'
  img.style.float=['left','right'].includes(run.wrap)?run.wrap:'none'
  return img
}
export function readPicture(img){
  const src=img.getAttribute('src')
  return safeSource(src)?{kind:'picture',src,alt:img.alt,width:img.width,wrap:img.style.float||'none'}:null
}
export async function pictureFromFile(file){
  if(!file||!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>20*1024*1024)throw Error('اختر صورة من جهازك بحجم أقل من ٢٠ ميغابايت.')
  const url=URL.createObjectURL(file)
  try{
    const image=new Image();image.src=url;await image.decode()
    const scale=Math.min(1,720/Math.max(image.width,image.height)),canvas=document.createElement('canvas')
    canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale))
    const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height)
    const src=canvas.toDataURL('image/jpeg',.65)
    if(!safeSource(src))throw Error('اختر صورة أصغر.')
    return {kind:'picture',src,alt:file.name,width:Math.min(canvas.width,240),wrap:'none'}
  }finally{URL.revokeObjectURL(url)}
}
