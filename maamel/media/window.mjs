export const photoWindow = `
<style>
.mx-photos{--border:#465051;--accent:#8ce1c7;background:#272d30;color:#fff;border:1px solid #3b4649;border-radius:10px;overflow:hidden;box-shadow:0 8px 22px #132b2a18}
.mx-photos button,.mx-photos select,.mx-photos input{font:inherit}
.mx-photos button,.mx-photos select,.mx-photos input:not([type=range]){background:#374045;color:white;padding:.36rem .65rem;border:1px solid #687376;border-radius:4px;min-height:38px}
.mx-photos button{cursor:pointer}.mx-photos button:disabled{opacity:.5}.mx-photos button[aria-pressed=true],.mx-photos button:focus-visible{border-color:var(--accent);color:var(--accent)}
.mx-photos .mx-title{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;background:#30383c;padding:.55rem .65rem;border-bottom:1px solid var(--border)}.mx-title b{margin-inline-end:.3rem}
.mx-photos nav{display:flex;align-items:center;gap:.2rem;padding:0 .6rem;background:#323b3e;border-bottom:1px solid var(--border);flex-wrap:wrap}
.mx-photos nav button{border:0;border-radius:0;background:none;padding:.55rem .8rem}.mx-photos nav button[aria-pressed=true]{box-shadow:inset 0 -3px var(--accent)}
.mx-photos .mx-work{display:grid;grid-template-columns:minmax(10.5rem,28%) minmax(0,1fr);grid-template-areas:"panel stage";min-height:280px}
.mx-photos .mx-panel{grid-area:panel;background:#394044;padding:.7rem;border-inline-end:1px solid var(--border);overflow:auto}.mx-photos aside{display:grid;gap:.5rem;align-content:start}
.mx-photos aside label{display:grid;gap:.4rem}.mx-photos aside input[type=range]{width:100%;accent-color:#8ce1c7}
.mx-photos aside button{text-align:start}.mx-photos aside .filter-choice{display:grid;grid-template-columns:60px 1fr;gap:.45rem;align-items:center}.mx-photos aside canvas{width:60px;height:auto;border-radius:3px}
.mx-photos .mx-stage{grid-area:stage;display:grid;place-items:center;align-content:center;background:#161b1e;padding:.6rem;min-height:220px}
.mx-stage canvas{display:block;width:auto;max-width:100%;height:auto;max-height:330px;touch-action:none}.mx-stage canvas[hidden]{display:none}
.mx-photos footer,.mx-photos .mx-points{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;padding:.45rem}.mx-photos .mx-points:empty,.mx-photos [data-trash]:empty,.mx-photos [data-copies]:empty{display:none}
.mx-photos footer{border-top:1px solid var(--border);background:#30383c}.mx-photos [data-save]{background:#b0efda;color:#122f27}
.mx-photos .mx-points label{display:grid;font-size:.84rem}.mx-photos output{display:block;min-height:1.7em;padding:0 .7rem;color:#c9efe3}
@media(max-width:620px){.mx-photos .mx-work{grid-template-columns:1fr;grid-template-areas:"stage" "panel"}.mx-photos aside{display:flex;align-items:center;flex-wrap:wrap}.mx-photos aside .filter-choice{display:flex;flex-direction:column}.mx-photos aside label{max-width:7rem}}
</style>
<div class="mx-title"><b>الصور</b><select aria-label="اختر صورة"></select><button data-prev aria-label="الصورة السابقة">→</button><button data-next aria-label="الصورة التالية">←</button><button data-del>حذف الصورة</button><button data-bin>سلة المحذوفات</button></div><div data-trash></div>
<nav aria-label="أدوات التحرير"></nav>
<div class="mx-work"><div class="mx-stage"><canvas aria-label="معاينة الصورة"></canvas></div><div class="mx-panel"><aside></aside><div class="mx-points"></div></div></div>
<footer><button data-save>حفظ</button><button data-copy>حفظ نسخة في ألبوم</button><input data-album placeholder="اسم الألبوم" aria-label="اسم الألبوم" maxlength="80"><button data-reset>تراجع عن التعديلات</button></footer><div data-copies></div><output aria-live="polite"></output>`;
