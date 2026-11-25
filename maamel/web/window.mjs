export const windowView = `
<style>
.wb-lab{--edge:#d6dbdd;background:#fff;color:#202d31;border:1px solid #b5bec3;border-radius:10px;overflow:hidden;font:inherit;box-shadow:0 8px 24px #14292a10}
.wb-lab button,.wb-lab select,.wb-lab input,.wb-lab textarea{font:inherit;color:inherit}
.wb-lab button{border:1px solid #bcc7c8;background:#f5f7f7;padding:.32rem .68rem;min-height:38px;border-radius:5px;cursor:pointer}
.wb-lab button:disabled{opacity:.45;cursor:default}
.wb-lab .wb-title{display:flex;align-items:end;gap:.35rem;flex-wrap:wrap;padding:.4rem .5rem 0;background:#e3e7ea;border-bottom:1px solid var(--edge)}
.wb-title [data-tabs]{display:flex;max-width:100%;overflow-x:auto;align-items:center}
.wb-title [role=tab]{background:transparent;border:0;border-radius:8px 8px 0 0;white-space:nowrap;max-width:13rem;text-overflow:ellipsis;overflow:hidden}
.wb-title [role=tab][aria-selected=true]{background:white;font-weight:bold}.wb-title>button{border:0;background:transparent}
.wb-title small{margin-inline-start:auto;padding-bottom:.45rem;color:#4a595e}
.wb-lab .wb-bar{display:flex;gap:.25rem;align-items:center;padding:.45rem;background:#fafafa;border-bottom:1px solid var(--edge)}
.wb-bar button:not(:last-child){background:transparent;border-color:transparent}.wb-lab input,.wb-lab textarea{padding:.45rem .6rem;border:1px solid #b3bfc0;border-radius:5px;min-width:0;background:white}
.wb-lab input[name=url]{flex:1;width:1px;min-width:3rem;border-radius:16px;padding-inline:1rem;background:#f1f3f4}.wb-lab article{background:white;min-height:210px;max-height:28rem;overflow-y:auto;padding:clamp(.7rem,2vw,1.4rem)}
.wb-lab article h3{font-size:1.25rem;margin:.3rem 0 .8rem}.wb-lab article form{display:flex;gap:.4rem;max-width:32rem}.wb-lab article form input{flex:1}.wb-lab article p{line-height:1.85;max-width:65ch}
.wb-lab article .result{display:block;border:0;background:none;text-align:start;margin:.5rem 0;color:#174b8a;font-weight:bold;text-decoration:underline;text-underline-offset:3px}
.wb-lab article .site-source{display:block;color:#37664f}.wb-lab details{border-top:1px solid var(--edge);background:#f6f8f7;padding:.7rem 1rem}
.wb-lab summary{cursor:pointer;font-weight:bold}.wb-lab label{display:grid;gap:.15rem;margin:.4rem 0}
.wb-lab footer{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}.wb-lab output{color:#20543e}.wb-lab fieldset{border:1px solid var(--edge);margin:.6rem;padding:.7rem}
@media(max-width:520px){.wb-lab .wb-bar{flex-wrap:wrap}.wb-bar input[name=url]{flex:1 1 7rem}.wb-title small{display:none}}
</style>
<div class="wb-title"><div data-tabs role="tablist" aria-label="علامات التبويب"></div><button data-add aria-label="علامة تبويب جديدة" title="علامة تبويب جديدة">＋</button><button data-close aria-label="إغلاق علامة التبويب" title="إغلاق علامة التبويب">×</button><small>متصفح معامل · صفحات تدريب محلية</small></div>
<form class="wb-bar"><button type="button" data-back aria-label="رجوع" title="رجوع">→</button><button type="button" data-next aria-label="تقدم" title="تقدم">←</button><button type="button" data-reload aria-label="تحديث الصفحة" title="تحديث">↻</button><button type="button" data-home>الرئيسة</button><input name="url" dir="ltr" aria-label="شريط العنوان أو البحث"><button>انتقال</button></form>
<article aria-live="polite"></article>
<details open><summary>مستند البحث</summary><label>اسم الملف<input data-file maxlength="80"></label><label>عنوان المصدر<input data-source dir="ltr" maxlength="220"></label><label>النص المنقول<textarea rows="3" maxlength="4000"></textarea></label><footer><button data-paste>لصق المقتطف</button><button data-save>حفظ المستند</button><output></output></footer></details>`;
