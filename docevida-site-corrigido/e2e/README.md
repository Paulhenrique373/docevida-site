# Verificações em navegador (opcionais)

Scripts Python + Playwright usados na validação final. Não fazem parte do `npm test`.

    pip install playwright && python -m playwright install chromium
    npm run build
    # servidor de produção servindo o build (porta 4300) com um admin de teste:
    cd server && DATABASE_PATH=/tmp/teste.db PORT=4300 node src/index.js &
    ADMIN_USERNAME=dona ADMIN_PASSWORD='senha-segura-1234' DATABASE_PATH=/tmp/teste.db node src/scripts/createAdmin.js
    # (opcional) PW_CHROMIUM=/caminho/do/chromium  BASE_URL=http://localhost:4300
    python e2e/responsive_overflow.py     # rolagem horizontal + erros de console em 320–1440px
    python e2e/navbar_widths.py           # cabeçalho dentro da tela em todas as larguras
    python e2e/checkout_admin_flow.py     # compra → acompanhamento → admin confirma → cliente vê

Use um banco de teste (nunca o de produção): `checkout_admin_flow.py` cria pedidos de verdade.
