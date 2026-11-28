// Separate compressed streams keep individual virtual files independently extractable.
const codec=new TextEncoder()
const limit=512000
export async function packEntry(node,parent){
  const {id,name,kind}=node
  const value=kind==='text'?node.content:kind==='drawing'?node.strokes:kind==='image'?node.asset:kind==='shortcut'?node.target:null
  const bytes=codec.encode(JSON.stringify(value))
  if(bytes.length>limit)throw Error('الملف أكبر من مساحة الضغط المتاحة.')
  const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))
  const compressed=new Uint8Array(await new Response(stream).arrayBuffer())
  const data=Array.from(compressed,b=>String.fromCharCode(b)).join('')
  return {id,parent,name,kind,raw:bytes.length,packed:compressed.length,data:btoa(data)}
}
export async function unpackEntry(entry){
  const compressed=Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0))
  const reader=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate')).getReader()
  const decoder=new TextDecoder()
  let text='',length=0
  while(true){
    const {done,value}=await reader.read()
    if(done)break
    length+=value.length
    if(length>entry.raw||length>limit){await reader.cancel();throw Error('تعذر استخراج بيانات الملف.')}
    text+=decoder.decode(value,{stream:true})
  }
  if(length!==entry.raw)throw Error('الملف المضغوط غير صالح.')
  const value=JSON.parse(text+decoder.decode())
  const fields={text:'content',drawing:'strokes',image:'asset',shortcut:'target'}
  return {kind:entry.kind,name:entry.name,...(fields[entry.kind]?{[fields[entry.kind]]:value}:{})}
}
