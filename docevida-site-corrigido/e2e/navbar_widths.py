import asyncio
from playwright.async_api import async_playwright
import os
EXE=os.environ.get("PW_CHROMIUM")  # caminho do Chromium; vazio = navegador padrão do Playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=EXE or None)
        for w in (320,360,390,430,768,1024,1440):
            page=await b.new_page(viewport={"width":w,"height":640})
            await page.goto(os.environ.get("BASE_URL","http://localhost:4300")+"/"); await page.wait_for_timeout(500)
            r=await page.evaluate("""(()=>{const h=document.querySelector('header .mx-auto');const out=[];
              for(const el of h.querySelectorAll('a,button')){const r=el.getBoundingClientRect(); if(r.width) out.push([el.getAttribute('data-testid')||el.getAttribute('aria-label')||el.tagName, Math.round(r.left), Math.round(r.right)]);}
              return {vw:innerWidth, els:out, headerScroll:h.scrollWidth, headerClient:h.clientWidth}})()""")
            bad=[e for e in r['els'] if e[1]<0 or e[2]>r['vw']]; print(w,'FORA DA TELA:' if bad else 'ok', bad or '', 'headerScroll',r['headerScroll'],'/',r['headerClient'])
        await b.close()
asyncio.run(main())
