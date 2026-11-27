export function readCSV(source){
 const text=source.replace(/^\uFEFF/,''),cells={};let row=1,col=0,field='',quoted=false,closed=false;
 function finish(){
  if(col>=26||row>10000||field.length>350)throw Error('يتجاوز الملف حدود الورقة أو طول نص الخلية.');
  if(field!=='')cells[String.fromCharCode(65+col)+row]={raw:field};field='';col++;closed=false;
 }
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c===','){finish();continue;}
  if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;finish();row++;col=0;continue;}
  if(closed||(c==='"'&&field))throw Error('تنسيق الاقتباس في ملف CSV غير صالح.');
  if(c==='"')quoted=true;else field+=c;
 }
 if(quoted)throw Error('ملف CSV ينتهي داخل حقل مقتبس.');
 if(col||field||closed)finish();return cells;
}
export function writeCSV(cells){
 const keys=Object.keys(cells).filter(k=>/^[A-Z][1-9]\d{0,4}$/.test(k)&&+k.slice(1)<=10000&&cells[k]?.raw!=='');
 let rMax=1,cMax=0;for(const key of keys){rMax=Math.max(rMax,+key.slice(1));cMax=Math.max(cMax,key.charCodeAt(0)-65);}
 const lines=[];for(let r=1;r<=rMax;r++){
  const fields=[];for(let c=0;c<=cMax;c++){const value=String(cells[String.fromCharCode(65+c)+r]?.raw??'');fields.push(/[",\r\n]/.test(value)?'"'+value.replace(/"/g,'""')+'"':value);}
  lines.push(fields.join(','));
 }
 return '\uFEFF'+lines.join('\r\n');
}
