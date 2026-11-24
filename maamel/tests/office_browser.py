"""Offline UI acceptance. Set BROWSER_ENGINE=webkit or CHROMIUM_PATH as appropriate."""
import os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE='https://maamel.test'
HTML='<html lang="ar" dir="rtl"><meta name="viewport" content="width=device-width, initial-scale=1"><main></main>'
def fixture(route):
    path=urlparse(route.request.url).path.lstrip('/')
    if not path:
        route.fulfill(body=HTML,content_type='text/html; charset=utf-8')
    elif (ROOT/path).resolve().is_relative_to(ROOT) and path.endswith('.mjs'):
        route.fulfill(body=(ROOT/path).read_text(), content_type='text/javascript; charset=utf-8')
    else:
        route.abort()
def launch_lab(page,lab,task):
    page.goto(BASE)
    page.evaluate("""async ([lab,task])=>{
      window.labModel=await import('/'+lab+'/model.mjs');
      window.labUI=await import('/'+lab+'/index.mjs');
      window.saved=labModel.initial(task);
      window.run=()=>labUI.mount(document.querySelector('main'),saved,v=>saved=v,task);
      window.score=()=>labModel.grade(saved,task).score;
      run();
    }""",[lab,task])
def save(page,name):
    page.get_by_role('button',name='حفظ',exact=True).first.click()
    page.get_by_label('اسم الملف',exact=True).fill(name)
    page.get_by_role('dialog').get_by_role('button',name='حفظ',exact=True).click()
def check(page):
    launch_lab(page,'word','headline')
    page.get_by_role('textbox',name='صفحة المستند').focus()
    page.evaluate("""()=>{let p=document.querySelector('.paper p'),r=document.createRange();r.selectNodeContents(p);let s=getSelection();s.removeAllRanges();s.addRange(r);p.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));}""")
    for name in ['غامق','مائل','تسطير','تمييز أصفر']:
        page.get_by_role('button',name=name,exact=True).click()
    page.get_by_label('حجم الخط',exact=True).select_option('16')
    save(page,'مقالي')
    assert page.evaluate('score()')==100,page.evaluate('saved.body')
    page.get_by_role('button',name='فتح',exact=True).first.click()
    page.get_by_role('dialog').get_by_role('button',name='فتح',exact=True).click()
    assert page.locator('.paper p').first.inner_text()=='التغير المناخي'
    assert page.evaluate('score()')==100
    launch_lab(page,'sheets','secret')
    for address,letter in zip(['A2','B3','C4','D5','E6','F7'],'الحاسب'):
        page.locator(f'td[data-address="{address}"]').click()
        formula=page.get_by_label('شريط الصيغة')
        formula.fill(letter)
        formula.press('Enter')
    assert page.evaluate('score()')==100
    save(page,'الخلايا')
    page.evaluate('run()')
    assert page.locator('td[data-address="B3"]').inner_text()=='ل'
    launch_lab(page,'sheets','cost')
    for address,formula in [('B8','=400*B7'),('C8','=400*C7'),('D8','=B8+C8')]:
        page.locator(f'td[data-address="{address}"]').click()
        bar=page.get_by_label('شريط الصيغة')
        bar.fill(formula)
        bar.press('Enter')
    save(page,'الرحلة')
    assert page.evaluate('score()')==100
    assert page.locator('td[data-address="D8"]').inner_text()=='19200'
    launch_lab(page,'slides','healthy')
    page.get_by_role('button',name='تصميم',exact=True).click()
    page.get_by_label('النسق',exact=True).select_option('basis')
    page.get_by_label('الخط',exact=True).select_option('Arial')
    page.get_by_label('عنوان الشريحة',exact=True).fill('الأطعمة الصحية')
    page.get_by_label('العنوان الفرعي',exact=True).fill('نور')
    page.get_by_role('button',name='الشريط الرئيسي',exact=True).click()
    page.get_by_role('button',name='شريحة جديدة',exact=True).click()
    page.get_by_label('عنوان الشريحة',exact=True).fill('الوصف')
    page.get_by_label('محتوى الشريحة',exact=True).fill('يساعدنا الغذاء المتوازن على النشاط.')
    save(page,'غذائي')
    assert page.evaluate('score()')==100
    page.get_by_role('button',name='تشغيل العرض',exact=True).click()
    dialog=page.get_by_role('dialog')
    assert 'الأطعمة الصحية' in dialog.inner_text()
    dialog.get_by_role('button',name='التالي',exact=True).click()
    assert 'الوصف' in dialog.inner_text()
    dialog.get_by_role('button',name='إنهاء العرض').click()
    page.get_by_role('button',name='إدراج',exact=True).click()
    page.get_by_role('button',name='فيديو من مكتبة التدريب').click()
    assert page.locator('video').count()==1
    page.evaluate('run()')
    page.get_by_role('button',name='2 · الوصف',exact=True).click()
    assert page.locator('video').count()==1
if __name__=='__main__':
    with sync_playwright() as p:
        engine=os.getenv('BROWSER_ENGINE','chromium'); args={}
        if engine=='chromium':
            if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
            args['args']=['--no-sandbox','--disable-dev-shm-usage']
        browser=getattr(p,engine).launch(headless=True,**args)
        for width,height in [(1280,850),(768,1024),(390,844)]:
            page=browser.new_page(viewport=dict(width=width,height=height))
            errors=[];page.on('pageerror',lambda err:errors.append(str(err)));page.route(BASE+'/**',fixture);check(page);assert not errors,errors
            print(f'PASS {engine} {width}×{height}: word selection/save/open, sheet formula/recalculation/restore, slide editing/presentation/media.')
            page.close()
        browser.close()
