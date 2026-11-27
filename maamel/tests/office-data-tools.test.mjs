import test from 'node:test';
import assert from 'node:assert/strict';
import {readCSV,writeCSV} from '../sheets/csv.mjs';
import {chartData} from '../sheets/charts.mjs';

test('Arabic CSV keeps blank cells, quotes, formulas, and embedded newlines',()=>{
 const source='\uFEFFالمنتج,سعر,عدد\r\n"قلم, أزرق",5,2\r\n"قال ""نعم""\nثم ذهب",,=B2*C2';
 const cells=readCSV(source);
 assert.equal(cells.A2.raw,'قلم, أزرق');assert.equal(cells.A3.raw,'قال "نعم"\nثم ذهب');assert.equal(cells.B3,undefined);
 assert.deepEqual(readCSV(writeCSV(cells)),cells);
 assert.throws(()=>readCSV('"نص'));assert.throws(()=>readCSV(Array(28).fill('1').join(',')));
});
test('chart reopens with live labels and series and recalculates formulas',()=>{
 const body={cells:readCSV('المنتج,السعر,الضعف\nتفاح,5,=B2*2\nموز,-2,=B3*2'),charts:[{source:'A1:C3',kind:'column',title:'الفواكه'}]};
 const restored=JSON.parse(JSON.stringify(body)),read=()=>chartData(restored.cells,restored.charts[0].source);
 assert.deepEqual(read().labels,['تفاح','موز']);assert.deepEqual(read().series.map(s=>s.points),[[5,-2],[10,-4]]);
 restored.cells.B2.raw='9';assert.equal(read().series[1].points[0],18);
 assert.deepEqual(chartData(restored.cells,'C3:A1'),read());assert.throws(()=>chartData(restored.cells,'A0:C3'));
});
