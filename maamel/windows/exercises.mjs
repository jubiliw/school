// All questions paraphrased. The illustrative names, symbols and photos are original substitutes.
const hardware=['المكوّنات الرئيسة','الأجهزة الملحقة']
const type=['ملف','مجلد','برنامج']
export const exercises={
  hardware:[
    ...[['mouse','الفأرة',0],['microphone','الميكروفون',1],['display','الشاشة',0],['camera','كاميرا الويب',1],['keys','لوحة المفاتيح',0],['speaker','مكبر الصوت',1]].map(([id,label,i])=>({id,label,options:hardware,answer:hardware[i]})),
    {id:'letters',label:'كتابة الأرقام والحروف',options:['لوحة المفاتيح','كاميرا الويب','الفأرة','الكاميرا الرقمية'],answer:'لوحة المفاتيح'},
    {id:'scan',label:'إدخال صورة ورقية إلى الحاسب',options:['لوحة المفاتيح','الميكروفون','الفأرة','الماسح الضوئي'],answer:'الماسح الضوئي'},
    {id:'listen',label:'الاستماع إلى تسجيل صوتي',options:['الفأرة','الشاشة','الطابعة','سماعة الرأس'],answer:'سماعة الرأس'},
    {id:'print',label:'طباعة صفحة',options:['الماسح الضوئي','مكبر الصوت','الشاشة','الطابعة'],answer:'الطابعة'}
  ],
  filetypes:[
    ...[['folder','📁 حافظة المشروع',1],['paint','🎨 تطبيق رسم',2],['photo','🏞 منظر.png',0],['edge','🌐 متصفح إنترنت',2],['docs','📂 حافظة المستندات',1],['editor','✍ تطبيق كتابة',2],['browse','🔎 تطبيق تصفّح آخر',2],['video','🎞 رحلة.mp4',0]].map(([id,label,i])=>({id,label,options:type,answer:type[i]})),
    ...['العطلة','الصيف / الشتاء','جهات الاتصال','أعلى / اسفل','<المصاريف>','مقاطع مضحكة','المنزل','الوقت'].map((label,i)=>({id:'name'+i,label:'اسم المجلد «'+label+'»',options:['مقبول','غير مقبول'],answer:/[<>/]/.test(label)?'غير مقبول':'مقبول'}))
  ]
}
