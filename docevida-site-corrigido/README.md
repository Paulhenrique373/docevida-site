# DoceVida — loja + API de pedidos

Frontend React (CRA/craco + Tailwind) e backend Node/Express com SQLite. O servidor valida e calcula tudo (preços, entrega, total); o navegador nunca é fonte de verdade.

## Como rodar

```bash
npm run install:all              # frontend + backend
cp server/.env.example server/.env   # ajuste os valores (nunca versione o .env)

# desenvolvimento (2 terminais)
npm run server                   # API em http://localhost:4000
npm start                        # site em http://localhost:3000 (proxy para a API)

# produção (um só processo: API + site)
npm run build
NODE_ENV=production ORDER_TOKEN_SECRET=<32+ chars> npm run server
```

## Variáveis de ambiente (`server/.env.example`)
`NODE_ENV`, `PORT`, `DATABASE_PATH` (use disco persistente), `ORDER_TOKEN_SECRET` (**obrigatória em produção**, 32+ caracteres),
`CORS_ORIGINS`, `DELIVERY_FEE_CENTS` (vazio = "a combinar"), `SESSION_TTL_HOURS`, `TRUST_PROXY` (1 atrás de proxy/HTTPS).
No frontend, opcional: `REACT_APP_API_URL` (só se a API ficar em outro domínio).

## Área administrativa
1. Crie o primeiro usuário: `ADMIN_USERNAME=dono ADMIN_PASSWORD='senha-longa' ADMIN_ROLE=owner npm --prefix server run admin:create` (senha ≥ 10 caracteres; não há usuário padrão).
2. Acesse `/admin`. Perfis: `owner` (pedidos + preços/disponibilidade) e `staff` (pedidos).
3. Fluxo: pedidos novos chegam como **Recebido** → defina o total (se estiver "a confirmar") → **Confirmado** → **Em preparação** → **Concluído** (ou **Cancelado** até antes de concluir).

## Agenda de retirada/entrega
Todo pedido exige **data e faixa de horário**, validadas no servidor (e a contagem do limite diário acontece dentro da mesma transação do pedido, então dois clientes não passam do limite).
Regras **padrão assumidas** (ajuste em Admin → Agenda; só o perfil `owner` edita, `staff` consulta):
- antecedência mínima de **2 dias**; agendamento até **30 dias** à frente;
- atendimento de **segunda a sábado**; faixas **09h–12h** e **13h–17h**;
- limite de **10 pedidos por dia** (pedidos cancelados liberam a vaga); datas fechadas (feriados/folgas) editáveis;
- fuso `America/Sao_Paulo`.
Dias lotados aparecem como "agenda completa" para o cliente. O painel permite filtrar e ordenar pedidos pela data agendada.
Bancos criados antes da agenda são migrados automaticamente na inicialização (pedidos antigos ficam "sem data agendada").

## Preços e entrega
O catálogo original não tem preços e o código avisa para não inventá-los. Por isso, pedidos com item sem preço (ou entrega sem taxa) ficam com total **"a confirmar"**; a loja define o total no painel antes de confirmar.
Cadastre os preços em Admin → Produtos (owner) e a taxa em `DELIVERY_FEE_CENTS`; a partir daí o total é calculado automaticamente no servidor.

## Endpoints
Públicos: `GET /api/catalog`, `GET /api/schedule`, `POST /api/orders` (cabeçalho `Idempotency-Key`), `GET /api/orders/:code` (cabeçalho `X-Order-Token`), `GET /api/health`.
Admin (cookie HttpOnly + `X-CSRF-Token`): `POST /api/admin/login|logout`, `GET /api/admin/me`, `GET /api/admin/orders`, `GET /api/admin/orders/:code`,
`PATCH /api/admin/orders/:code/status`, `PUT /api/admin/orders/:code/total`, `GET /api/admin/products`, `PATCH /api/admin/products/:id`, `GET|PUT /api/admin/schedule` (PUT: só `owner`).

## Armazenamento
SQLite (`better-sqlite3`, WAL): `products`, `settings` (regras da agenda), `orders` (com `scheduled_date`/`scheduled_slot`), `order_items` (preço congelado no momento da compra), `order_events` (histórico com data e administrador), `admins` (senha scrypt), `sessions`.
Faça backup periódico do arquivo em `DATABASE_PATH`.

## Testes
```bash
npm run server:test      # backend (26 testes)
npm test                 # frontend (20 testes)
npm run build            # build de produção
```

## Pendências que dependem de configuração externa
- Preços oficiais, taxa de entrega, WhatsApp/e-mail/horário (`src/config/site.js`).
- Imagens institucionais em `src/config/images.js` ainda apontam para um host externo (`static.prod-images.emergentagent.com`): baixe-as para `public/images` e troque as URLs (a CSP do servidor só libera esse host enquanto ele existir).
- Pagamento online **não existe** (nenhum provedor integrado); o site não declara pagamentos.
- Estoque numérico não existe no catálogo; há apenas disponível/indisponível.
- Em produção use HTTPS (o cookie de sessão é `Secure`).
