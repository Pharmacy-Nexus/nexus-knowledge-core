"""Browser smoke test; intercepted API requests return EMPTY profile, not made-up medical details."""
import asyncio, json, subprocess
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]

async def main():
    server=subprocess.Popen(['python','-m','http.server','8765','--directory',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    async with async_playwright() as p:
      browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
      try:
        page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
        errs=[]
        page.on('pageerror',lambda e:errs.append(str(e)))
        await page.goto('http://127.0.0.1:8765/')
        assert await page.get_by_text('خطوة واحدة لربط قاعدة البيانات').count()==1
        assert not errs, errs
        await page.screenshot(path=str(ROOT/'tests/setup.png'),full_page=True)
        token='a'*40
        created={'value':False}
        async def router(route):
           u=route.request.url
           if u.endswith('/config.js'):
             return await route.fulfill(status=200,content_type='application/javascript',body='window.VITAL_CONFIG={supabaseUrl:"https://test.supabase.co", publishableKey:"sb_publishable_test_abcdefghijklmnopqrstuvwxyz"};')
           if '/auth/v1/token' in u:
             return await route.fulfill(status=200,json={'access_token':'test-token','refresh_token':'test-refresh','expires_in':3600})
           if u.endswith('/auth/v1/user'):
             return await route.fulfill(status=200,json={'id':'00000000-0000-0000-0000-000000000001','email':'','aud':'authenticated'})
           if '/rest/v1/medical_profiles' in u:
             return await route.fulfill(status=200,json=[{'fields':{},'sharing':{},'card_token':token if created['value'] else None,'published':False}] if created['value'] else [])
           if '/rpc/vital_create_card' in u:
             created['value']=True;return await route.fulfill(status=200,json=token)
           if '/rpc/vital_get_emergency' in u:
             return await route.fulfill(status=200,json=None)
           if '/rpc/vital_save_profile' in u:
             return await route.fulfill(status=200,json={'published':False,'shared_fields':0})
           return await route.continue_()
        await page.route('**/*',router)
        await page.goto('http://127.0.0.1:8765/')
        await page.locator('input[name=email]').fill('testing@example.test')
        await page.locator('input[name=password]').fill('not-a-real-password')
        await page.get_by_role('button',name='تسجيل الدخول').click()
        await page.get_by_text('ملفك الطبي لسه فاضي').wait_for()
        await page.screenshot(path=str(ROOT/'tests/home-mobile.png'),full_page=True)
        await page.get_by_role('button',name='كارت VITAL').first.click()
        await page.get_by_role('button',name='إنشاء رابط كارت جديد').click()
        await page.locator('svg[aria-label="QR code"]').wait_for()
        count=await page.locator('svg[aria-label="QR code"] rect').count()
        assert count>20, count
        await page.screenshot(path=str(ROOT/'tests/card-mobile.png'),full_page=True)
        await page.goto('http://127.0.0.1:8765/e/'+token)
        await page.get_by_text('صفحة الطوارئ غير متاحة').wait_for()
        await page.screenshot(path=str(ROOT/'tests/emergency-mobile.png'),full_page=True)
        assert not errs, errs
        print('PASS: blank config, login, empty profile, card QR, inactive emergency page, no JS errors')
      finally:
        await browser.close()
        server.terminate();server.wait(timeout=3)

if __name__=='__main__':asyncio.run(main())
