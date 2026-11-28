// Run from the project checkout with Playwright and Chromium installed.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/' ){res.setHeader('content-type','text/html');return res.end('<meta charset=utf-8><main id="app"></main>');}
  const file=path.resolve(root,'.'+req.url);
  if(!file.startsWith(root+path.sep)||!file.endsWith('.mjs')){res.writeHead(404);return res.end();}
  res.setHeader('content-type','text/javascript');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
 browser=await chromium.launch({executablePath:process.env.MAAMEL_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1100,height:840}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 async function open(kind,reload=false){await page.evaluate(async({kind,reload})=>{const m=await import('/'+kind+'/index.mjs');window.kind=kind;window.project=reload?window.saved:null;window.cleanup?.();window.cleanup=m.mount(document.querySelector('main'),window.project,s=>window.project=s);},{kind,reload});}
 async function click(name){await page.getByRole('button',{name,exact:true}).click();}
 async function getScore(task){return page.evaluate(async task=>(await import('/'+window.kind+'/model.mjs')).grade(window.project,task).score,task);}
 await open('scratch');await click('عند نقر العلم');await click('التحكم');await click('كرّر');await click('أضف لبنات داخل التكرار');await click('الحركة');await click('تحرّك');
 await page.getByLabel('خطوة',{exact:true}).fill('5');
 assert.equal(await getScore('loop'),100);
 await click('⚑ تشغيل العلم');await page.waitForFunction(()=>document.querySelector('[role=status]').textContent==='اكتمل التنفيذ');
 await page.evaluate(()=>window.saved=JSON.parse(JSON.stringify(window.project)));
 await open('scratch',true);assert.equal(await getScore('loop'),100);
 await page.getByText('ملف',{exact:true}).click();const download=page.waitForEvent('download');await click('حفظ إلى الجهاز');const f=await download;
 const payload=JSON.parse(await fs.readFile(await f.path(),'utf8'));assert.equal(payload.format,'maamel-scratch');assert.equal(payload.project.blocks[1].body[0].n,5);
 await open('scratch');await page.locator('input[type=file]').setInputFiles({name:'exercise.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await page.waitForFunction(()=>document.querySelector('[role=status]').textContent==='فُتح المشروع.');assert.equal(await getScore('loop'),100);
 await click('المظاهر');await click('رمادي');assert.equal(await page.evaluate(()=>window.project.costume),'slate');
 await click('الأصوات');await click('اختيار صوت');await click('إضافة العصفور');assert.ok((await page.evaluate(()=>window.project.clips)).includes('bird'));
 await click('المقاطع البرمجية');await click('اختيار خلفية');await page.getByRole('dialog').getByRole('button',{name:'كرة القدم',exact:true}).click();assert.equal(await page.evaluate(()=>window.project.scene),'football');
 await page.getByText('تحرير',{exact:true}).click();await click('تراجع');assert.equal(await page.evaluate(()=>window.project.scene),'plain');
 await click('إضافة ملحق');await click('إضافة القلم');await click('أنزل القلم');assert.equal(await page.evaluate(()=>window.project.blocks.at(-1).op),'down');
 await open('robot');await click('SIM · المحاكاة');assert.equal(await page.locator('.view').isVisible(),false);await click('SIM · المحاكاة');
 await click('تهيئة الروبوت');await page.getByLabel('عرض قراءات المستشعرات').uncheck();await click('المقطع البرمجي · NEPO');await click('قيادة · Drive');await page.getByText('خيارات اللبنة',{exact:true}).first().click();await click('مضاعفة');
 const speed=page.getByLabel('السرعة %',{exact:true}),dist=page.getByLabel('المسافة (سم)',{exact:true});
 await speed.nth(0).fill('50');await speed.nth(1).fill('100');await dist.nth(0).fill('50');await dist.nth(1).fill('50');assert.equal(await getScore('speed'),100);
 await click('▶ بدء المحاكاة');await click('■ إيقاف');assert.equal(await page.getByRole('status').textContent(),'متوقف');
 await page.setViewportSize({width:390,height:844});await click('إعادة الضبط');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log('PASS Chromium: nested repeat, rendered playback, JSON export/import, persistence, EV3 speeds, stop/reset, 390px viewport.');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
