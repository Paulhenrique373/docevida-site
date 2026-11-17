'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function int(value, name, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null } = {}) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Variável de ambiente inválida: ${name} deve ser um inteiro entre ${min} e ${max}.`);
  }
  return n;
}

function loadDotEnv(file) {
  // Leitor mínimo de .env (sem dependência). Variáveis já definidas no ambiente têm prioridade.
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function loadConfig(env = process.env, overrides = {}) {
  const root = path.resolve(__dirname, '..');
  const production = (env.NODE_ENV || 'development') === 'production';
  const dbPath = overrides.databasePath ?? env.DATABASE_PATH ?? path.join(root, 'data', 'docevida.db');

  let secret = overrides.orderTokenSecret ?? env.ORDER_TOKEN_SECRET ?? '';
  if (!secret) {
    if (production) {
      throw new Error('ORDER_TOKEN_SECRET é obrigatório em produção (mínimo de 32 caracteres).');
    }
    // Desenvolvimento: gera e reaproveita um segredo local para que as chaves dos pedidos sobrevivam a reinícios.
    const devFile = path.join(root, 'data', '.dev-secret');
    if (dbPath === ':memory:') secret = crypto.randomBytes(32).toString('hex');
    else if (fs.existsSync(devFile)) secret = fs.readFileSync(devFile, 'utf8').trim();
    else {
      secret = crypto.randomBytes(32).toString('hex');
      fs.mkdirSync(path.dirname(devFile), { recursive: true });
      fs.writeFileSync(devFile, secret, { mode: 0o600 });
    }
  }
  if (secret.length < 32) throw new Error('ORDER_TOKEN_SECRET deve ter pelo menos 32 caracteres.');

  const corsOrigins = (overrides.corsOrigins ?? env.CORS_ORIGINS ?? (production ? '' : 'http://localhost:3000'))
    .split(',').map((s) => s.trim()).filter(Boolean);

  return {
    production,
    port: int(env.PORT, 'PORT', { min: 1, max: 65535, fallback: 4000 }),
    databasePath: dbPath,
    orderTokenSecret: secret,
    corsOrigins,
    deliveryFeeCents: overrides.deliveryFeeCents !== undefined
      ? overrides.deliveryFeeCents
      : int(env.DELIVERY_FEE_CENTS, 'DELIVERY_FEE_CENTS', { min: 0, max: 100000, fallback: null }),
    sessionTtlMs: int(env.SESSION_TTL_HOURS, 'SESSION_TTL_HOURS', { min: 1, max: 168, fallback: 12 }) * 3600 * 1000,
    trustProxy: env.TRUST_PROXY === '1',
    frontendDir: overrides.frontendDir ?? path.resolve(root, '..', 'build'),
    fulfillment: { retirada: true, entrega: true },
    rateLimits: overrides.rateLimits || { orderCreate: 10, orderLookup: 30, login: 10, windowMs: 15 * 60 * 1000 },
    schedule: overrides.schedule || {},
    now: overrides.now || null,
    silent: Boolean(overrides.silent),
  };
}

module.exports = { loadConfig, loadDotEnv };
