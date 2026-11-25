self.onmessage=async({data})=>{
 const lines=data.stdin.split('\n');
 let count=0;
 Sk.configure({__future__:Sk.python3,execLimit:10000,output:text=>{
  count+=text.length;if(count>100000)throw Error('تجاوز الإخراج الحد المتاح.');
  self.postMessage({text});
 },inputfun:prompt=>{self.postMessage({text:String(prompt||'')});if(!lines.length)throw Error('أدخل قيم input في حقل المدخلات ثم شغّل البرنامج.');return lines.shift()},
 read:path=>{const file=Sk.builtinFiles.files[path];if(file===undefined)throw Error('Module unavailable: '+path);return file}});
 try{await Sk.misceval.asyncToPromise(()=>Sk.importMainWithBody('<stdin>',false,data.source,true));self.postMessage({done:true})}
 catch(error){self.postMessage({error:String(error),done:true})}
};
