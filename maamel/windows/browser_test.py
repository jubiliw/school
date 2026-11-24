"""Chromium workflow checks for the Windows simulator. Run with Python Playwright installed."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import os

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(Path(__file__).parent)))
Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}/"
harness = """<html dir=rtl><meta charset=utf-8><meta name=viewport content="width=device-width"><main></main>
<script type=module>
import {mount} from './index.mjs';import {initial,grade} from './model.mjs';
const task=location.hash.slice(1)||'animals';const key='w-'+task;window.state=JSON.parse(sessionStorage.getItem(key))||initial(task);
mount(document.querySelector('main'),state,s=>{window.state=s;sessionStorage.setItem(key,JSON.stringify(s))},task);
window.points=()=>grade(window.state,task).score;</script></html>"""

def run(page, viewport):
    page.set_viewport_size(viewport)
    page.route("**/harness", lambda r:r.fulfill(content_type="text/html; charset=utf-8",body=harness))
    page.goto(base+"harness")
    def button(label):return page.get_by_role("button",name=label,exact=True)
    def submit_name(label, name):
        button(label).click(); page.get_by_role("dialog").get_by_role("textbox").fill(name);button("تأكيد").click()
    submit_name("مجلد جديد","الحيوانات")
    folder = page.locator(".wm-tile",has_text="الحيوانات")
    folder.dblclick()
    submit_name("مجلد جديد","الطيور")
    assert page.evaluate("points()")==20
    button("المستندات").click()
    page.locator(".wm-tile",has_text="G4.S1.1.2_animals_photos").dblclick()
    bird=page.locator(".wm-tile",has_text="صورة 1.png")
    bird.dblclick()
    assert page.get_by_role("img",name="نورس").count()==1
    page.get_by_role("dialog").get_by_role("button",name="إغلاق").click()
    bird.click();submit_name("إعادة تسمية","نورس.png")
    button("قص").click();button("المستندات").click();folder.dblclick()
    page.locator(".wm-tile",has_text="الطيور").dblclick();button("لصق").click()
    assert page.evaluate("points()")==40
    page.reload();button("المستندات").wait_for();assert page.evaluate("points()")==40
    folder.dblclick();page.locator(".wm-tile",has_text="الطيور").dblclick()
    page.locator(".wm-tile",has_text="نورس.png").click();button("حذف").click()
    assert page.evaluate("points()")==20
    page.locator(".wm-split nav").get_by_role("button",name="سلة المحذوفات").click()
    page.locator(".wm-tile",has_text="نورس.png").click();button("استعادة").click()
    assert page.evaluate("points()")==40
    submit=button("⊞ بدء");submit.click();button("الرسام").click()
    canvas=page.locator("canvas");box=canvas.bounding_box();x,y=box['x']+5,box['y']+5
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+40,y+30);page.mouse.up();button("حفظ").click()
    page.get_by_role("dialog").get_by_role("button",name="حفظ").click()
    assert page.evaluate("state.nodes.some(n=>n.kind==='drawing' && n.strokes[0].points.length>1)")
    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
    page.goto(base+"harness#hardware");page.reload()
    page.get_by_label("الفأرة",exact=True).select_option(label="المكوّنات الرئيسة")
    assert page.evaluate("points()")==10
    page.goto(base+"harness#display");page.reload()
    page.get_by_label("دقة الشاشة",exact=True).select_option("1920×1200");button("الاحتفاظ بالتغييرات").click()
    assert page.evaluate("points()")==33
    page.goto(base+"harness#alarm");page.reload()
    page.get_by_label("وقت المنبه").fill("11:59");button("ضبط المنبه").click()
    assert page.evaluate("points()")==67

try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ.get("CHROME_BIN","/usr/bin/chromium"),args=["--no-sandbox"])
        for w,h in [(1280,900),(390,844)]:
            page=browser.new_page();errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
            run(page,{"width":w,"height":h});assert not errors, errors
            print(f"PASS Chromium {w}×{h} — create, rename, move, restore, persist, draw, classify, resolution, alarm")
            page.close()
        browser.close()
finally:
    server.shutdown()
