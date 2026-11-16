'use strict';
const crypto = require('crypto');
const { loadConfig } = require('../src/config');
const { openDatabase } = require('../src/db');
const { createApp } = require('../src/app');

async function startServer(overrides = {}) {
  const config = loadConfig({ NODE_ENV: 'test' }, {
    databasePath: ':memory:', silent: true, corsOrigins: 'http://localhost:3000',
    frontendDir: '/nonexistent', now: () => FIXED_NOW, ...overrides,
  });
  const db = openDatabase(config.databasePath);
  const app = createApp(db, config);
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const close = () => new Promise((r) => server.close(() => { db.close(); r(); }));
  return { base, db, app, config, close, auth: app.locals.auth };
}

const key = () => crypto.randomBytes(16).toString('hex');

// Relógio fixo nos testes: quarta-feira, 07/10/2026 (meio-dia em Brasília). Segunda-feira mínima = 9/10.
const FIXED_NOW = new Date('2026-10-07T15:00:00Z');
const GOOD_SCHEDULE = { date: '2026-10-13', slot: '09:00-12:00' }; // terça-feira, dentro das regras padrão

const validOrder = (over = {}) => ({
  schedule: { ...GOOD_SCHEDULE },
  customer: { name: 'Maria Silva', phone: '(11) 91234-5678' },
  fulfillment: 'retirada',
  items: [{ productId: 'doce-de-ninho', quantity: 2 }],
  ...over,
});

async function api(base, path, { method = 'GET', body, headers = {}, cookie, csrf } = {}) {
  const h = { ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (cookie) h.Cookie = cookie;
  if (csrf) h['X-CSRF-Token'] = csrf;
  const res = await fetch(base + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* sem corpo */ }
  return { status: res.status, json, headers: res.headers };
}

async function loginAdmin(ctx, role = 'owner', username = 'loja') {
  ctx.auth.createAdmin(username, 'senha-bem-longa-123', role);
  const res = await api(ctx.base, '/api/admin/login', { method: 'POST', body: { username, password: 'senha-bem-longa-123' } });
  const cookie = res.headers.get('set-cookie').split(';')[0];
  return { cookie, csrf: res.json.csrfToken, res };
}

const setPrices = (db, cents = 1000) => db.prepare('UPDATE products SET price_cents = ?').run(cents);

module.exports = { FIXED_NOW, GOOD_SCHEDULE, startServer, key, validOrder, api, loginAdmin, setPrices };
