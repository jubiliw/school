const emptyCell=()=>({span:1,blocks:[{runs:[]}]});
export function newTable(rows,cols){
 if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>200||cols>30)throw Error('اختر بين ١ و٢٠٠ صف وبين ١ و٣٠ عمودًا.');
 return {type:'table',border:'solid',rows:Array.from({length:rows},()=>Array.from({length:cols},emptyCell))};
}
export function changeTable(table,row,col,op){
 const cells=table.rows[row],cell=cells?.[col];
 if(!cell)throw Error('ضع المؤشر داخل الخلية أولًا.');
 const width=cells.reduce((sum,c)=>sum+c.span,0);
 if(op==='merge'){
  const next=cells[col+1];if(!next)throw Error('اختر خلية لها خلية تالية في الصف.');
  cell.span+=next.span;cell.blocks.push(...next.blocks);cells.splice(col+1,1);
 }else if(op==='split'){
  if(cell.span===1)throw Error('اختر خلية مدمجة.');
  cells.splice(col+1,0,...Array.from({length:cell.span-1},emptyCell));cell.span=1;
 }else if(op==='row'){
  if(table.rows.length>=200)throw Error('بلغ الجدول حد الصفوف.');
  table.rows.splice(row+1,0,Array.from({length:width},emptyCell));
 }else if(op==='column'){
  if(width>=30)throw Error('بلغ الجدول حد الأعمدة.');
  const boundary=cells.slice(0,col+1).reduce((sum,c)=>sum+c.span,0);
  for(const r of table.rows){
   let end=0;const index=r.findIndex(c=>(end+=c.span)>=boundary);
   if(end===boundary)r.splice(index+1,0,emptyCell());else r[index].span++;
  }
 }
}
