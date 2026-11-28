const shapes=['مستطيل','مُعيّن','متوازي أضلاع','طرف مستدير']
export const fifthProgramming=[
 {id:'weather-decisions',title:'قراءة شرط درجة الحرارة',page:191,questions:[12,47,14].map(t=>({prompt:'يقول البرنامج «إنه بارد» تحت ٢٠ درجة و«إنه حار» فوق ٤٥. ما الرسالة عندما تكون درجة الحرارة '+t+'؟',options:['إنه بارد','إنه حار','لا تظهر رسالة'],correct:t<20?0:1}))},
 {id:'algorithm-steps',title:'من المشكلة إلى البرنامج',page:167,questions:[
  {prompt:'ما أول خطوة عندما تريد برمجة حل لمشكلة؟',options:['تركيب اللبنات','فهم المشكلة وتحديد المطلوب','تشغيل الحل'],correct:1},
  {prompt:'بعد فهم المشكلة، ماذا تكتب قبل اختيار اللبنات؟',options:['خطوات مرتبة لحلها','اسم الخلفية فقط','درجة النشاط'],correct:0},
  {prompt:'كيف تحوّل الخوارزمية إلى برنامج؟',options:['أحذف التعليمات','أرسم شخصية','أمثّل الخطوات بأوامر برمجية'],correct:2}
 ]},
 {id:'flowchart-shapes',title:'قراءة رموز المخطط الانسيابي',page:168,questions:[
  {prompt:'أي شكل يمثّل نهاية التنفيذ؟',options:shapes,correct:3},
  {prompt:'أي شكل تستخدمه عندما يختار البرنامج بين مسارين؟',options:shapes,correct:1},
  {prompt:'أي شكل يمثّل إدخال البيانات؟',options:shapes,correct:2},
  {prompt:'أين تضع عملية حسابية؟',options:shapes,correct:0}
 ]}
]
