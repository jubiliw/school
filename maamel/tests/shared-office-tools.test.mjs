import test from 'node:test';
import assert from 'node:assert/strict';
import {changeTable,newTable} from '../word/table.mjs';
import {plain} from '../word/model.mjs';
import {evaluate} from '../sheets/model.mjs';

test('Word retains Arabic cell content through merge, column insert, split and serialization',()=>{
 const t=newTable(2,3);
 t.rows[0][0].blocks[0].runs=[{text:'الاسم',bold:true}];
 t.rows[0][1].blocks[0].runs=[{text:'الصف'}];
 changeTable(t,0,0,'merge');
 assert.equal(t.rows[0][0].span,2);
 changeTable(t,1,0,'column');
 assert.equal(t.rows[0][0].span,3);
 changeTable(t,0,0,'split');changeTable(t,0,0,'row');
 const saved=JSON.parse(JSON.stringify(t));
 assert.deepEqual(saved.rows.map(row=>row.length),[4,4,4]);
 assert.equal(saved.rows[0][0].blocks[0].runs[0].bold,true);
 assert.ok(plain(saved).includes('الاسم الصف'));
 assert.throws(()=>changeTable(saved,0,3,'merge'));
});

test('Excel functions recalculate ranges, ignore empty and text cells, propagate errors and reject cycles',()=>{
 const cells={A1:{raw:'3'},A2:{raw:'6'},A3:{raw:'نص'},B1:{raw:'=SUM(A1:A4,2)'},B2:{raw:'=AVERAGE(A1:A4)'},B3:{raw:'=MAX(A4:A1)-MIN(A1:A4)'},B4:{raw:'=COUNT(A1:A4;B1)'},C1:{raw:'=SUM(C1:C2)'},C2:{raw:'=AVERAGE(D1:D2)'},C3:{raw:'=SUM(A1:Z10001)'}};
 assert.deepEqual(['B1','B2','B3','B4','C1','C2','C3'].map(a=>evaluate(cells,a)),[11,4.5,3,3,'#CYCLE!','#DIV/0!','#REF!']);
 cells.A2.raw='9';assert.equal(evaluate(cells,'B1'),14);
});
