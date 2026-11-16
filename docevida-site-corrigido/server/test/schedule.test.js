'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { startServer, key, validOrder, api, loginAdmin } = require('./helpers');

const post = (ctx, body) => api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key() }, body });

test('agenda pública: respeita antecedência, janela e dias de atendimento', async () => {
  const ctx = await startServer();
  try {
    const r = await api(ctx.base, '/api/schedule');
    assert.equal(r.status, 200);
    const dates = r.json.days.map((d) => d.date);
    assert.equal(dates[0], '2026-10-09');                 // hoje (qua 07/10) + 2 dias
    assert.ok(dates.every((d) => d <= '2026-11-06'));      // até 30 dias
    assert.ok(!dates.includes('2026-10-11'));              // domingo fechado
    assert.deepEqual(r.json.slots.map((s) => s.label), ['09h às 12h', '13h às 17h']);
    assert.ok(!JSON.stringify(r.json).includes('"orders"')); // sem contagem interna de pedidos
  } finally { await ctx.close(); }
});

test('pedido exige data e horário válidos', async () => {
  const ctx = await startServer();
  try {
    let r = await post(ctx, (() => { const b = validOrder(); delete b.schedule; return b; })());
    assert.equal(r.status, 400); assert.ok(r.json.error.fields.schedule);
    r = await post(ctx, validOrder({ schedule: { date: 'amanhã', slot: '09:00-12:00' } }));
    assert.equal(r.status, 400);
    r = await post(ctx, validOrder({ schedule: { date: '2026-10-13', slot: '09:00-12:00', extra: 1 } }));
    assert.equal(r.status, 400);
    for (const [date, slot, msg] of [
      ['2026-10-08', '09:00-12:00', /antecedência/],       // amanhã: cedo demais
      ['2026-10-07', '09:00-12:00', /antecedência/],       // hoje
      ['2026-10-02', '09:00-12:00', /antecedência/],       // passado
      ['2026-12-25', '09:00-12:00', /dias à frente/],      // longe demais
      ['2026-10-18', '09:00-12:00', /não atende/],         // domingo
      ['2026-10-13', '23:00-23:30', /horário/],            // faixa inexistente
      ['2026-02-30', '09:00-12:00', /válida/],             // data impossível
    ]) {
      const x = await post(ctx, validOrder({ schedule: { date, slot } }));
      assert.ok([400, 409].includes(x.status), `${date}: ${x.status}`);
      assert.match(x.json.error.message, msg, date);
    }
    assert.equal(ctx.db.prepare('SELECT COUNT(*) n FROM orders').get().n, 0);
  } finally { await ctx.close(); }
});

test('pedido válido guarda a data e aparece no acompanhamento e no admin', async () => {
  const ctx = await startServer();
  try {
    const { cookie } = await loginAdmin(ctx);
    const c = await post(ctx, validOrder());
    assert.equal(c.status, 201);
    assert.deepEqual(c.json.order.schedule, { date: '2026-10-13', slot: '09:00-12:00', slotLabel: '09h às 12h' });
    const pub = await api(ctx.base, `/api/orders/${c.json.order.code}`, { headers: { 'X-Order-Token': c.json.trackingToken } });
    assert.equal(pub.json.order.schedule.date, '2026-10-13');
    const list = await api(ctx.base, '/api/admin/orders?scheduled=2026-10-13', { cookie });
    assert.equal(list.json.total, 1);
    assert.equal(list.json.orders[0].schedule.slotLabel, '09h às 12h');
    assert.equal((await api(ctx.base, '/api/admin/orders?scheduled=2026-10-14', { cookie })).json.total, 0);
    assert.equal((await api(ctx.base, '/api/admin/orders?scheduled=hoje', { cookie })).status, 400);
  } finally { await ctx.close(); }
});

test('limite diário: não passa do limite, nem com pedidos simultâneos; cancelar libera vaga', async () => {
  const ctx = await startServer();
  try {
    const { cookie, csrf } = await loginAdmin(ctx);
    const put = await api(ctx.base, '/api/admin/schedule', { method: 'PUT', cookie, csrf, body: { ...(await api(ctx.base, '/api/admin/schedule', { cookie })).json.settings, dailyLimit: 2 } });
    assert.equal(put.status, 200);
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => post(ctx, validOrder())));
    const ok = results.filter((r) => r.status === 201);
    const full = results.filter((r) => r.status === 409);
    assert.equal(ok.length, 2);
    assert.equal(full.length, 3);
    assert.equal(full[0].json.error.code, 'schedule_unavailable');
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM orders WHERE scheduled_date = '2026-10-13'").get().n, 2);
    // o dia aparece como completo na agenda pública
    const day = (await api(ctx.base, '/api/schedule')).json.days.find((d) => d.date === '2026-10-13');
    assert.equal(day.full, true);
    // cancelar um pedido libera a vaga
    await api(ctx.base, `/api/admin/orders/${ok[0].json.order.code}/status`, { method: 'PATCH', cookie, csrf, body: { status: 'cancelled' } });
    assert.equal((await post(ctx, validOrder())).status, 201);
  } finally { await ctx.close(); }
});

test('mesma chave de idempotência continua devolvendo o mesmo pedido mesmo com o dia lotado', async () => {
  const ctx = await startServer({ schedule: { dailyLimit: 1 } });
  try {
    const k = key();
    const send = () => api(ctx.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': k }, body: validOrder() });
    const a = await send();
    const b = await send();
    assert.equal(a.status, 201);
    assert.equal(b.status, 200);
    assert.equal(b.json.order.code, a.json.order.code);
  } finally { await ctx.close(); }
});

test('datas fechadas e dias de atendimento editáveis só por quem tem permissão', async () => {
  const ctx = await startServer();
  try {
    const owner = await loginAdmin(ctx, 'owner', 'dona');
    const staff = await loginAdmin(ctx, 'staff', 'atendente');
    const cur = (await api(ctx.base, '/api/admin/schedule', { cookie: owner.cookie })).json.settings;
    // staff pode ver, mas não alterar
    assert.equal((await api(ctx.base, '/api/admin/schedule', { cookie: staff.cookie })).status, 200);
    assert.equal((await api(ctx.base, '/api/admin/schedule', { method: 'PUT', cookie: staff.cookie, csrf: staff.csrf, body: cur })).status, 403);
    assert.equal((await api(ctx.base, '/api/admin/schedule')).status, 401);
    // fecha 13/10 e só atende terça e quinta
    const r = await api(ctx.base, '/api/admin/schedule', { method: 'PUT', cookie: owner.cookie, csrf: owner.csrf, body: { ...cur, closedDates: ['2026-10-13'], openWeekdays: [2, 4] } });
    assert.equal(r.status, 200);
    const x = await post(ctx, validOrder());
    assert.equal(x.status, 409); assert.match(x.json.error.message, /não atende/);
    const days = (await api(ctx.base, '/api/schedule')).json.days.map((d) => d.date);
    assert.ok(!days.includes('2026-10-13') && days.includes('2026-10-15'));
    assert.equal((await post(ctx, validOrder({ schedule: { date: '2026-10-15', slot: '13:00-17:00' } }))).status, 201);
    // validações das regras
    for (const bad of [{ ...cur, minLeadDays: -1 }, { ...cur, slots: [] }, { ...cur, slots: [{ start: '12:00', end: '09:00' }] }, { ...cur, openWeekdays: [] }, { ...cur, dailyLimit: 0 }, { ...cur, closedDates: ['31/12/2026'] }, { ...cur, maxAdvanceDays: 1, minLeadDays: 5 }, { ...cur, hack: true }]) {
      const v = await api(ctx.base, '/api/admin/schedule', { method: 'PUT', cookie: owner.cookie, csrf: owner.csrf, body: bad });
      assert.equal(v.status, 400, JSON.stringify(bad));
    }
    // sem limite diário
    assert.equal((await api(ctx.base, '/api/admin/schedule', { method: 'PUT', cookie: owner.cookie, csrf: owner.csrf, body: { ...cur, dailyLimit: null } })).status, 200);
  } finally { await ctx.close(); }
});

test('migração: banco antigo (sem colunas de agenda) é atualizado sem perder pedidos', () => {
  const { openDatabase } = require('../src/db');
  const fs = require('fs'); const os = require('os'); const path = require('path');
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dv-mig-')), 'old.db');
  const old = new Database(file);
  old.exec(`CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, idempotency_key TEXT NOT NULL UNIQUE, request_hash TEXT NOT NULL,
    customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, contact_preference TEXT NOT NULL, fulfillment TEXT NOT NULL, address TEXT, notes TEXT,
    subtotal_cents INTEGER, delivery_fee_cents INTEGER, total_cents INTEGER, price_pending INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    INSERT INTO orders (code, idempotency_key, request_hash, customer_name, customer_phone, contact_preference, fulfillment, price_pending, status, created_at, updated_at)
    VALUES ('DV-OLD111','k'||hex(randomblob(8)),'h','Antiga','11999999999','whatsapp','retirada',1,'received','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');`);
  old.close();
  const db = openDatabase(file);
  const row = db.prepare("SELECT code, scheduled_date FROM orders WHERE code = 'DV-OLD111'").get();
  assert.equal(row.code, 'DV-OLD111');
  assert.equal(row.scheduled_date, null);
  db.close();
});
