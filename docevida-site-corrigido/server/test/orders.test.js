'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, key, validOrder, api, loginAdmin, setPrices } = require('./helpers');

test('cria pedido válido, persiste e calcula totais no servidor', async () => {
  const ctx = await startServer({ deliveryFeeCents: 800 });
  try {
    setPrices(ctx.db, 1250);
    const r = await api(ctx.base, '/api/orders', {
      method: 'POST', headers: { 'Idempotency-Key': key() },
      body: validOrder({ fulfillment: 'entrega', address: 'Rua das Flores, 123, Cidade Tiradentes', items: [{ productId: 'doce-de-ninho', quantity: 2 }, { productId: 'cookie-caseiro', quantity: 1 }] }),
    });
    assert.equal(r.status, 201);
    assert.match(r.json.order.code, /^DV-[A-Z2-9]{6}$/);
    assert.equal(r.json.order.subtotalCents, 3750);
    assert.equal(r.json.order.deliveryFeeCents, 800);
    assert.equal(r.json.order.totalCents, 4550);
    assert.equal(r.json.order.status, 'received');
    assert.equal(r.json.order.pricePending, false);
    // dados pessoais nunca aparecem na resposta pública
    const text = JSON.stringify(r.json);
    assert.ok(!text.includes('Maria') && !text.includes('91234') && !text.includes('Rua das Flores'));
    // persistência real: está no banco
    const row = ctx.db.prepare('SELECT * FROM orders WHERE code = ?').get(r.json.order.code);
    assert.equal(row.customer_name, 'Maria Silva');
    assert.equal(row.customer_phone, '11912345678');
    assert.equal(ctx.db.prepare('SELECT COUNT(*) n FROM order_items WHERE order_id = ?').get(row.id).n, 2);
  } finally { await ctx.close(); }
});

test('retirada: entrega zerada; sem preços cadastrados o total fica pendente (sem inventar valores)', async () => {
  const ctx = await startServer();
  try {
    const r = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder() });
    assert.equal(r.status, 201);
    assert.equal(r.json.order.totalCents, null);
    assert.equal(r.json.order.pricePending, true);
    assert.equal(r.json.order.deliveryFeeCents, 0);
    // entrega sem taxa configurada também fica pendente, mesmo com preços
    setPrices(ctx.db, 500);
    const e = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder({ fulfillment: 'entrega', address: 'Rua A, 1, Bairro B' }) });
    assert.equal(e.json.order.subtotalCents, 1000);
    assert.equal(e.json.order.deliveryFeeCents, null);
    assert.equal(e.json.order.totalCents, null);
  } finally { await ctx.close(); }
});

test('rejeita pedidos vazios e inválidos com erros por campo', async () => {
  const ctx = await startServer();
  try {
    const post = (body) => api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body });
    let r = await post(validOrder({ items: [] }));
    assert.equal(r.status, 400); assert.ok(r.json.error.fields.items);
    r = await post({});
    assert.equal(r.status, 400);
    r = await post(validOrder({ customer: { name: 'A', phone: '123' } }));
    assert.ok(r.json.error.fields.name && r.json.error.fields.phone);
    r = await post(validOrder({ fulfillment: 'entrega' }));
    assert.ok(r.json.error.fields.address);
    r = await post(validOrder({ items: [{ productId: 'doce-de-ninho', quantity: -3 }] }));
    assert.equal(r.status, 400);
    r = await post(validOrder({ items: [{ productId: 'doce-de-ninho', quantity: 1.5 }] }));
    assert.equal(r.status, 400);
    r = await post(validOrder({ items: [{ productId: 'doce-de-ninho', quantity: 100 }] }));
    assert.equal(r.status, 400);
    r = await post(validOrder({ items: [{ productId: 'nao-existe', quantity: 1 }] }));
    assert.equal(r.status, 422);
    const bad = await fetch(ctx.base + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key() }, body: '{oops' });
    assert.equal(bad.status, 400);
    assert.equal(ctx.db.prepare('SELECT COUNT(*) n FROM orders').get().n, 0);
  } finally { await ctx.close(); }
});

test('produto indisponível é recusado', async () => {
  const ctx = await startServer();
  try {
    ctx.db.prepare("UPDATE products SET available = 0 WHERE id = 'doce-de-ninho'").run();
    const r = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder() });
    assert.equal(r.status, 422);
    assert.equal(r.json.error.code, 'unavailable_items');
  } finally { await ctx.close(); }
});

test('preços/totais manipulados pelo cliente são rejeitados', async () => {
  const ctx = await startServer();
  try {
    setPrices(ctx.db, 1000);
    const post = (body) => api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body });
    let r = await post(validOrder({ items: [{ productId: 'doce-de-ninho', quantity: 1, price: 1 }] }));
    assert.equal(r.status, 400); assert.equal(r.json.error.code, 'forbidden_field');
    r = await post({ ...validOrder(), total: 1 });
    assert.equal(r.status, 400); assert.equal(r.json.error.code, 'forbidden_field');
    r = await post({ ...validOrder(), totalCents: 1, deliveryFee: 0 });
    assert.equal(r.status, 400);
    assert.equal(ctx.db.prepare('SELECT COUNT(*) n FROM orders').get().n, 0);
  } finally { await ctx.close(); }
});

test('idempotência: reenvio com a mesma chave não duplica e devolve o mesmo pedido', async () => {
  const ctx = await startServer();
  try {
    const k = key();
    const send = () => api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': k }, body: validOrder() });
    const [a, b, c] = await Promise.all([send(), send(), send()]);
    const again = await send();
    const codes = new Set([a, b, c, again].map((x) => x.json.order.code));
    assert.equal(codes.size, 1);
    assert.equal(ctx.db.prepare('SELECT COUNT(*) n FROM orders').get().n, 1);
    assert.equal(again.status, 200);
    assert.equal(again.json.replayed, true);
    assert.equal(a.json.trackingToken, again.json.trackingToken);
    // mesma chave com outro conteúdo: conflito, nunca sobrescreve
    const conflict = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': k }, body: validOrder({ items: [{ productId: 'cookie-caseiro', quantity: 5 }] }) });
    assert.equal(conflict.status, 409);
    // sem chave: recusado
    const none = await api(ctx.base, '/api/orders', { method: 'POST', body: validOrder() });
    assert.equal(none.status, 400);
  } finally { await ctx.close(); }
});

test('acompanhamento exige código + chave e não vaza dados pessoais', async () => {
  const ctx = await startServer();
  try {
    const c = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder({ notes: 'sem granulado' }) });
    const { code } = c.json.order;
    const ok = await api(ctx.base, `/api/orders/${code}`, { headers: { 'X-Order-Token': c.json.trackingToken } });
    assert.equal(ok.status, 200);
    assert.ok(!JSON.stringify(ok.json).match(/Maria|91234|sem granulado/));
    const noTok = await api(ctx.base, `/api/orders/${code}`);
    const wrong = await api(ctx.base, `/api/orders/${code}`, { headers: { 'X-Order-Token': 'a'.repeat(32) } });
    const ghost = await api(ctx.base, '/api/orders/DV-ZZZZZZ', { headers: { 'X-Order-Token': c.json.trackingToken } });
    for (const r of [noTok, wrong, ghost]) assert.equal(r.status, 404);
    assert.deepEqual(wrong.json, ghost.json); // não revela se o código existe
  } finally { await ctx.close(); }
});

test('rotas administrativas exigem autenticação no servidor', async () => {
  const ctx = await startServer();
  try {
    for (const [m, p] of [['GET', '/api/admin/orders'], ['GET', '/api/admin/orders/DV-AAAAAA'], ['PATCH', '/api/admin/orders/DV-AAAAAA/status'], ['PUT', '/api/admin/orders/DV-AAAAAA/total'], ['GET', '/api/admin/products'], ['PATCH', '/api/admin/products/doce-de-ninho'], ['GET', '/api/admin/me']]) {
      const r = await api(ctx.base, p, { method: m, body: m === 'GET' ? undefined : {} });
      assert.equal(r.status, 401, `${m} ${p}`);
    }
    const forged = await api(ctx.base, '/api/admin/orders', { cookie: 'dv_admin=falsificado' });
    assert.equal(forged.status, 401);
  } finally { await ctx.close(); }
});

test('login: erro genérico, bloqueio após falhas, cookie HttpOnly/SameSite e logout', async () => {
  const ctx = await startServer();
  try {
    const { cookie, res } = await loginAdmin(ctx);
    const sc = res.headers.get('set-cookie');
    assert.match(sc, /HttpOnly/); assert.match(sc, /SameSite=Strict/);
    assert.equal((await api(ctx.base, '/api/admin/me', { cookie })).status, 200);
    assert.equal((await api(ctx.base, '/api/admin/session', { cookie })).json.admin.username, 'loja');
    assert.equal((await api(ctx.base, '/api/admin/session')).json.admin, null);
    await api(ctx.base, '/api/admin/logout', { method: 'POST', cookie });
    assert.equal((await api(ctx.base, '/api/admin/me', { cookie })).status, 401);
    const bad = await api(ctx.base, '/api/admin/login', { method: 'POST', body: { username: 'loja', password: 'errada' } });
    const ghost = await api(ctx.base, '/api/admin/login', { method: 'POST', body: { username: 'ninguem', password: 'errada' } });
    assert.equal(bad.status, 401); assert.deepEqual(bad.json, ghost.json);
    for (let i = 0; i < 6; i += 1) await api(ctx.base, '/api/admin/login', { method: 'POST', body: { username: 'loja', password: 'errada' } });
    const locked = await api(ctx.base, '/api/admin/login', { method: 'POST', body: { username: 'loja', password: 'senha-bem-longa-123' } });
    assert.equal(locked.status, 429);
  } finally { await ctx.close(); }
});

test('CSRF: mutações administrativas exigem token e origem permitida', async () => {
  const ctx = await startServer();
  try {
    const { cookie, csrf } = await loginAdmin(ctx);
    const sem = await api(ctx.base, '/api/admin/products/doce-de-ninho', { method: 'PATCH', cookie, body: { priceCents: 100 } });
    assert.equal(sem.status, 403);
    const errado = await api(ctx.base, '/api/admin/products/doce-de-ninho', { method: 'PATCH', cookie, csrf: 'x'.repeat(32), body: { priceCents: 100 } });
    assert.equal(errado.status, 403);
    const origem = await api(ctx.base, '/api/admin/products/doce-de-ninho', { method: 'PATCH', cookie, csrf, headers: { Origin: 'https://malicioso.example' }, body: { priceCents: 100 } });
    assert.equal(origem.status, 403);
    const ok = await api(ctx.base, '/api/admin/products/doce-de-ninho', { method: 'PATCH', cookie, csrf, body: { priceCents: 100 } });
    assert.equal(ok.status, 200);
  } finally { await ctx.close(); }
});

test('permissões: staff não altera preços; owner sim', async () => {
  const ctx = await startServer();
  try {
    const staff = await loginAdmin(ctx, 'staff', 'atendente');
    const r = await api(ctx.base, '/api/admin/products/doce-de-ninho', { method: 'PATCH', cookie: staff.cookie, csrf: staff.csrf, body: { priceCents: 1 } });
    assert.equal(r.status, 403);
    assert.equal((await api(ctx.base, '/api/admin/orders', { cookie: staff.cookie })).status, 200);
  } finally { await ctx.close(); }
});

test('status: fluxo válido com histórico; transições inválidas e mudanças silenciosas são recusadas', async () => {
  const ctx = await startServer();
  try {
    setPrices(ctx.db, 1000);
    const { cookie, csrf } = await loginAdmin(ctx);
    const c = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder() });
    const code = c.json.order.code;
    const patch = (status, extra = {}) => api(ctx.base, `/api/admin/orders/${code}/status`, { method: 'PATCH', cookie, csrf, body: { status, ...extra } });

    assert.equal((await patch('completed')).status, 409);               // pula etapas
    assert.equal((await patch('preparing')).status, 409);
    assert.equal((await patch('inexistente')).status, 400);
    let r = await patch('confirmed', { expectedStatus: 'received' });
    assert.equal(r.status, 200); assert.equal(r.json.order.status, 'confirmed');
    const stale = await patch('preparing', { expectedStatus: 'received' });
    assert.equal(stale.status, 409); assert.equal(stale.json.error.code, 'stale_status');
    assert.equal((await patch('preparing')).status, 200);
    assert.equal((await patch('completed', { note: 'entregue' })).status, 200);
    assert.equal((await patch('cancelled')).status, 409);               // estado final
    assert.equal((await patch('received')).status, 409);

    const detail = await api(ctx.base, `/api/admin/orders/${code}`, { cookie });
    assert.deepEqual(detail.json.order.history.map((h) => h.to), ['received', 'confirmed', 'preparing', 'completed']);
    assert.equal(detail.json.order.history[1].by, 'loja');
    assert.equal(detail.json.order.customer.name, 'Maria Silva');
    // histórico público: sem nome do administrador nem notas internas
    const pub = await api(ctx.base, `/api/orders/${code}`, { headers: { 'X-Order-Token': c.json.trackingToken } });
    assert.equal(pub.json.order.status, 'completed');
    assert.equal(pub.json.order.history.length, 4);
    assert.ok(!JSON.stringify(pub.json).includes('loja') && !JSON.stringify(pub.json).includes('entregue'));
  } finally { await ctx.close(); }
});

test('confirmar exige total definido; admin define total só quando estava pendente', async () => {
  const ctx = await startServer();
  try {
    const { cookie, csrf } = await loginAdmin(ctx);
    const c = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder() });
    const code = c.json.order.code;
    const conf = () => api(ctx.base, `/api/admin/orders/${code}/status`, { method: 'PATCH', cookie, csrf, body: { status: 'confirmed' } });
    const blocked = await conf();
    assert.equal(blocked.status, 409); assert.equal(blocked.json.error.code, 'total_required');
    assert.equal((await api(ctx.base, `/api/admin/orders/${code}/total`, { method: 'PUT', cookie, csrf, body: { totalCents: -5 } })).status, 400);
    assert.equal((await api(ctx.base, `/api/admin/orders/${code}/total`, { method: 'PUT', cookie, csrf, body: { totalCents: 2500 } })).status, 200);
    assert.equal((await conf()).status, 200);
    // pedido calculado pelo sistema não aceita total manual
    setPrices(ctx.db, 700);
    const d = await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder() });
    const lock = await api(ctx.base, `/api/admin/orders/${d.json.order.code}/total`, { method: 'PUT', cookie, csrf, body: { totalCents: 1 } });
    assert.equal(lock.status, 409);
  } finally { await ctx.close(); }
});

test('painel: lista, filtros, busca, ordenação e paginação (sem dados inventados)', async () => {
  const ctx = await startServer();
  try {
    const { cookie } = await loginAdmin(ctx);
    const empty = await api(ctx.base, '/api/admin/orders', { cookie });
    assert.equal(empty.json.total, 0); assert.deepEqual(empty.json.orders, []);
    setPrices(ctx.db, 1000);
    for (const [name, qty] of [['Ana Souza', 1], ['Bruno Lima', 3], ['Carla Dias', 2]]) {
      await api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body: validOrder({ customer: { name, phone: '11987654321' }, items: [{ productId: 'doce-de-ninho', quantity: qty }] }) });
    }
    const all = await api(ctx.base, '/api/admin/orders?sort=total&order=asc', { cookie });
    assert.deepEqual(all.json.orders.map((o) => o.totalCents), [1000, 2000, 3000]);
    assert.equal((await api(ctx.base, '/api/admin/orders?q=bruno', { cookie })).json.total, 1);
    assert.equal((await api(ctx.base, '/api/admin/orders?q=987654', { cookie })).json.total, 3);
    assert.equal((await api(ctx.base, `/api/admin/orders?q=${all.json.orders[0].code}`, { cookie })).json.total, 1);
    assert.equal((await api(ctx.base, '/api/admin/orders?status=confirmed', { cookie })).json.total, 0);
    assert.equal((await api(ctx.base, '/api/admin/orders?status=hack', { cookie })).status, 400);
    assert.equal((await api(ctx.base, '/api/admin/orders?pageSize=2&page=2', { cookie })).json.orders.length, 1);
    assert.equal((await api(ctx.base, '/api/admin/orders?from=2999-01-01', { cookie })).json.total, 0);
    // tentativa de injeção SQL é tratada como texto
    const inj = await api(ctx.base, "/api/admin/orders?q=' OR 1=1 --&sort=total;DROP TABLE orders", { cookie });
    assert.equal(inj.status, 200); assert.equal(inj.json.total, 0);
    assert.equal(ctx.db.prepare('SELECT COUNT(*) n FROM orders').get().n, 3);
  } finally { await ctx.close(); }
});

test('catálogo público reflete preços/disponibilidade definidos pela loja', async () => {
  const ctx = await startServer();
  try {
    const { cookie, csrf } = await loginAdmin(ctx);
    let cat = await api(ctx.base, '/api/catalog');
    assert.equal(cat.json.products.length, 22);
    assert.ok(cat.json.products.every((p) => p.priceCents === null));
    await api(ctx.base, '/api/admin/products/cookie-caseiro', { method: 'PATCH', cookie, csrf, body: { priceCents: 650, available: false } });
    cat = await api(ctx.base, '/api/catalog');
    const cookie1 = cat.json.products.find((p) => p.id === 'cookie-caseiro');
    assert.equal(cookie1.priceCents, 650); assert.equal(cookie1.available, false);
    assert.equal((await api(ctx.base, '/api/admin/products/cookie-caseiro', { method: 'PATCH', cookie, csrf, body: { priceCents: -1 } })).status, 400);
  } finally { await ctx.close(); }
});

test('erros inesperados não vazam detalhes internos', async () => {
  const ctx = await startServer();
  try {
    ctx.db.exec('DROP TABLE products');
    const r = await api(ctx.base, '/api/catalog');
    assert.equal(r.status, 500);
    assert.ok(!JSON.stringify(r.json).match(/products|SQL|sqlite|stack/i));
    assert.ok(r.json.error.requestId);
  } finally { await ctx.close(); }
});

test('cabeçalhos de segurança presentes', async () => {
  const ctx = await startServer();
  try {
    const r = await fetch(ctx.base + '/api/health');
    assert.ok(r.headers.get('content-security-policy'));
    assert.equal(r.headers.get('x-powered-by'), null);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  } finally { await ctx.close(); }
});
