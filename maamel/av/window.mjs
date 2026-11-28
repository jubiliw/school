const styles = `
<style>
.av-lab{background:#f3f5f6;color:#1e3137;border:1px solid #b3c1c4;border-radius:10px;overflow:hidden;box-shadow:0 7px 22px #19272814}
.av-lab button,.av-lab input,.av-lab select{font:inherit;color:inherit;min-height:38px;border:1px solid #9db3b7;background:#fff;padding:.35rem .58rem;border-radius:5px}
.av-lab label{display:grid;gap:.24rem;margin:.5rem 0}.av-lab input,.av-lab select{min-width:0;max-width:100%}
.av-lab button{cursor:pointer}.av-lab button:disabled{opacity:.5}.av-lab .av-title{padding:.58rem .8rem;background:#e1e9ec;display:flex;gap:.65rem;align-items:center;border-bottom:1px solid #bccace}
.av-title span{margin-inline-start:auto;color:#52686f;font-size:.86rem}
.av-lab .rec-layout{display:grid;grid-template-columns:minmax(9rem,28%) minmax(0,1fr)}.av-lab .rec-list{background:#eaf0f2;border-inline-end:1px solid #c3cfd3;padding:.75rem}
.av-lab .rec-list h4{margin:0 0 .6rem}.av-lab [data-library]{display:block;width:100%;text-align:start;overflow-wrap:anywhere}
.av-lab .rec-work{text-align:center;padding:.8rem 1rem;min-width:0;background:linear-gradient(#fafcfd,#f0f5f7)}
.av-lab .rec-work .rec-source{display:inline-flex;align-items:center;gap:.5rem}.av-lab [data-clock]{display:block;font-size:2rem;line-height:1.4;font-variant-numeric:tabular-nums;color:#183840}
.av-lab canvas{width:100%;max-width:480px;height:58px;display:block;margin:.5rem auto;background:#e6eff1;border-radius:5px}
.av-lab .rec-transport{display:flex;gap:.45rem;justify-content:center;align-items:center}.av-lab .rec-transport button{border-radius:999px}
.av-lab button[data-start]{background:#176a86;color:white;border-color:#176a86}.av-lab.is-recording button[data-stop]{background:#934457;color:white}
.av-lab .av-fields{display:flex;flex-wrap:wrap;gap:.6rem;align-items:end;padding:.7rem .8rem;border-top:1px solid #c7d3d6}.av-lab .av-fields label{margin:0;flex:1 1 9rem;min-width:0}
.av-lab small{display:block;padding:.4rem .8rem;color:#36545c}.av-lab audio{display:block;width:min(100%,480px);margin:.65rem auto}
.av-lab video{width:min(100%,620px);display:block;margin:auto}.av-lab .movie{background:#132127;padding:.7rem}.av-lab output{display:block;min-height:1.7em;padding:0 .8rem;color:#185b51}
@media(max-width:560px){.av-lab .rec-layout{grid-template-columns:1fr}.av-lab .rec-list{border-inline-end:0}.av-lab .rec-list h4{display:inline;margin-inline-end:.5rem}.av-lab [data-library]{display:inline-block;width:auto}}
</style>`;
export const recorderWindow = styles + `
<div class="av-title"><b>مسجّل الصوت</b><span>التسجيلات الصوتية</span></div>
<div class="rec-layout">
  <div class="rec-list"><h4>تسجيلاتي</h4><button data-library disabled>لا يوجد مقطع محفوظ</button></div>
  <div class="rec-work">
    <label class="rec-source">مصدر التسجيل <select><option value="tone">نغمة التدريب</option><option value="mic">الميكروفون</option></select></label>
    <time data-clock dir="ltr">00:00.0</time>
    <canvas width="480" height="58" aria-label="شكل موجة المقطع المسجل"></canvas>
    <div class="rec-transport"><button data-start aria-label="بدء التسجيل">● بدء التسجيل</button><button data-stop aria-label="إيقاف" disabled>■ إيقاف</button></div>
    <audio controls preload="metadata" aria-label="تشغيل التسجيل"></audio>
  </div>
</div>
<div class="av-fields"><label>مجلد الفريق<input data-folder maxlength="64"></label><label>اسم المقطع<input data-name maxlength="64"></label><button data-save>حفظ المقطع</button></div>
<small>يمكن التدريب بالنغمة. عند اختيار الميكروفون يُحفظ الصوت ضمن عملك عند الحفظ. مدة المقطع القصوى ١٥ ثانية.</small><output aria-live="polite"></output>`;
export const videoWindow = styles + `
<div class="av-title"><b>مشغّل الوسائط</b><span>طيور على الشاطئ</span></div>
<div class="movie"><video controls playsinline preload="metadata" aria-label="طيور على الشاطئ"></video></div>
<div class="av-fields"><label>عدد الطيور <input type="number" min="0" max="20"></label><label>أين ظهرت الطيور؟ <select><option value="">اختر</option><option value="land">على الرمل</option><option value="sky">في السماء</option><option value="sea">في البحر</option></select></label><button>حفظ الإجابات</button></div>
<small>مقطع تدريبي أصلي</small><output aria-live="polite"></output>`;
export function displayWave(canvas, pcm) {
 const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);g.strokeStyle='#267790';g.beginPath();
 const middle=canvas.height/2;
 if(!pcm?.length){g.moveTo(0,middle);g.lineTo(canvas.width,middle);}
 else for(let x=0;x<canvas.width;x++){
  const a=Math.floor(x*pcm.length/canvas.width),b=Math.max(a+1,Math.floor((x+1)*pcm.length/canvas.width));
  let low=128,high=128;
  for(let i=a;i<b;i++){low=Math.min(low,pcm[i]);high=Math.max(high,pcm[i]);}
  g.moveTo(x,middle-(high-128)*middle/128);g.lineTo(x,middle-(low-128)*middle/128);
 }
 g.stroke();
}
