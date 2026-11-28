export const snipWindow = `
<style>
.mx-snip{background:#eef1f3;color:#233338;border:1px solid #b5c1c8;border-radius:10px;overflow:hidden;box-shadow:0 7px 22px #16293415}
.mx-snip button,.mx-snip select,.mx-snip textarea{font:inherit;border:1px solid #aab9bf;background:#fff;color:#20363d;border-radius:5px;padding:.35rem .6rem;min-height:38px}
.mx-snip button{cursor:pointer}.mx-snip button:disabled{opacity:.45;cursor:default}.mx-snip .snip-title,.mx-snip .snip-bar,.mx-snip .doc-tools{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.mx-snip .snip-title{padding:.5rem .8rem;background:#e3e8ec}.mx-snip .snip-title small{margin-inline-start:auto}
.mx-snip .snip-bar{padding:.4rem .65rem;border-block:1px solid #c5ced2;background:#f7f8f9}
.mx-snip [data-new]{background:#def0ec;border-color:#8aaea3}.mx-snip [data-new][aria-pressed=true]{background:#bfdfd4}
.mx-snip .capture{background:#4f585c;display:grid;place-items:center;min-height:178px;padding:clamp(.3rem,2vw,.9rem)}
.mx-snip canvas{width:100%;max-width:620px;touch-action:none;display:block;background:white;box-shadow:0 4px 12px #10212638}.mx-snip .capturing canvas{cursor:crosshair}
.mx-snip output{white-space:pre-line;display:block;padding:.55rem .8rem;color:#193e35;background:#e3eee8}.mx-snip output:empty{display:none}
.mx-snip .doc-tools{padding:.45rem .75rem;border-block:1px solid #c3cbd1;background:#e1e7ed}.mx-snip .doc-tools b{margin-inline-end:auto}
.mx-snip textarea{background:white;display:block;box-sizing:border-box;width:calc(100% - 1.5rem);min-height:6rem;margin:.7rem auto;resize:vertical}
.mx-snip [role=status]{min-height:1.4em;margin:.3rem .8rem;color:#30544c}
</style>
<div class="snip-title"><b>أداة القصاصة</b><small>بطاقة العلوم</small></div>
<div class="snip-bar"><button data-new aria-pressed="false">جديد</button><select aria-label="تحديد سطر بلوحة المفاتيح"><option value="">تحديد سطر…</option><option value="0">الأول</option><option value="1">الثاني</option><option value="2">الثالث</option></select><button data-ocr>إجراءات النص</button><button data-copy>نسخ النص</button></div>
<div class="capture"><canvas width="620" height="220" aria-label="بطاقة علوم تحتوي ثلاثة أسطر"></canvas></div>
<output aria-label="النص المستخرج"></output>
<div class="doc-tools"><b>مستند المراجعة</b><button data-paste>لصق</button><button data-save>حفظ المستند</button></div><textarea aria-label="مستند المراجعة" rows="3" maxlength="2000"></textarea>
<p role="status">يعمل التعرّف محليًا مع نصوص بطاقة التدريب.</p>`;
export function selectionOverlay(ctx, rect, width, height) {
 const [x,y,w,h]=rect.map((n,i)=>n*(i%2?height:width));
 ctx.fillStyle='rgba(17,29,34,.30)';
 ctx.fillRect(0,0,width,y);ctx.fillRect(0,y+h,width,height-y-h);
 ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,width-x-w,h);
 ctx.strokeStyle='#007c5c';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
 ctx.fillStyle='#007c5c';for(const a of [x,x+w])for(const b of [y,y+h])ctx.fillRect(a-2,b-2,4,4);
}
