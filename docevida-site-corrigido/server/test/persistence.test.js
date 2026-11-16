'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadConfig } = require('../src/config');
const { openDatabase } = require('../src/db');
const { createApp } = require('../src/app');
const { key, validOrder, api, FIXED_NOW } = require('./helpers');

test('pedidos sobrevivem a reinício do servidor (banco em arquivo)', async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dv-')), 'x.db');
  const mk = async () => {
    const config = loadConfig({ NODE_ENV: 'test' }, { databasePath: file, silent: true, orderTokenSecret: 'x'.repeat(40), frontendDir: '/nonexistent', now: () => FIXED_NOW });
    const db = openDatabase(file);
    const app = createApp(db, config);
    const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
    return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(() => { db.close(); r(); })) };
  };
  let s = await mk();
  const k = key();
  const first = await api(s.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': k }, body: validOrder() });
  await s.close();
  s = await mk();
  try {
    const look = await api(s.base, `/api/orders/${first.json.order.code}`, { headers: { 'X-Order-Token': first.json.trackingToken } });
    assert.equal(look.status, 200);
    assert.equal(look.json.order.code, first.json.order.code);
    // reenvio após reinício continua idempotente
    const again = await api(s.base, '/api/orders', { method: 'POST', headers: { 'Idempotency-Key': k }, body: validOrder() });
    assert.equal(again.json.order.code, first.json.order.code);
    assert.equal(again.json.replayed, true);
  } finally { await s.close(); }
});

test('configuração: produção exige ORDER_TOKEN_SECRET forte', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'production' }, { databasePath: ':memory:' }), /ORDER_TOKEN_SECRET/);
  assert.throws(() => loadConfig({ NODE_ENV: 'production', ORDER_TOKEN_SECRET: 'curto' }, { databasePath: ':memory:' }), /32/);
  assert.throws(() => loadConfig({ NODE_ENV: 'test', PORT: 'abc' }, { databasePath: ':memory:' }), /PORT/);
  assert.doesNotThrow(() => loadConfig({ NODE_ENV: 'production', ORDER_TOKEN_SECRET: 'x'.repeat(32) }, { databasePath: ':memory:' }));
});
