import asyncio, json
from playwright.async_api import async_playwright
import os
EXE=os.environ.get("PW_CHROMIUM")  # caminho do Chromium; vazio = navegador padrão do Playwright
BASE=os.environ.get("BASE_URL","http://localhost:4300")
WIDTHS=[320,360,390,430,768,1024,1440]
PAGES=["/","/produtos","/historia","/sustentabilidade","/doacoes","/qualidade","/contato","/acompanhar","/admin"]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=EXE or None)
        problems=[]; consoles=set()
        for w in WIDTHS:
            ctx=await b.new_context(viewport={"width":w,"height":800})
            page=await ctx.new_page()
            page.on("console", lambda m: consoles.add((m.type, m.text[:160])) if m.type in("error","warning") else None)
            page.on("pageerror", lambda e: consoles.add(("pageerror", str(e)[:160])))
            for path in PAGES:
                await page.goto(BASE+path, wait_until="domcontentloaded")
                await page.wait_for_timeout(500)
                over=await page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                if over>0: problems.append((w,path,"overflow-x",over))
            await ctx.close()
        await b.close()
    print("OVERFLOW PROBLEMS:", problems or "nenhum")
    print("CONSOLE:"); [print("  ",c) for c in sorted(consoles)]
asyncio.run(main())
