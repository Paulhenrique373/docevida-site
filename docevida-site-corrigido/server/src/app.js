'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createOrdersService, STATUSES, STATUS_LABELS } = require('./orders');
const { AppError } = require('./errors');
const { createScheduleService } = require('./schedule');
const { createAuth, can } = require('./auth');

function createApp(db, config) {
  const app = express();
  const schedule = createScheduleService(db, config);
  const orders = createOrdersService(db, config, schedule);
  const auth = createAuth(db, config);
  const log = (...a) => { if (!config.silent) console.log(...a); };

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https://static.prod-images.emergentagent.com'],
        // Estilos inline são necessários (framer-motion e Sonner injetam <style>/style=""). Scripts seguem estritos.
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'script-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': config.production ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }));

  app.use('/api', cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key', 'X-Order-Token', 'X-CSRF-Token'],
    maxAge: 600,
  }));

  app.use(express.json({ limit: '20kb' }));

  app.use((req, res, next) => {
    req.id = crypto.randomBytes(6).toString('hex');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Defesa extra contra CSRF: requisições que alteram dados só valem se a Origin (quando enviada) for permitida.
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) return next();
    const sameHost = (() => { try { return new URL(origin).host === req.get('host'); } catch { return false; } })();
    if (sameHost || config.corsOrigins.includes(origin)) return next();
    return next(new AppError(403, 'bad_origin', 'Origem não permitida.'));
  });

  const limiter = (max, message) => rateLimit({
    windowMs: config.rateLimits.windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(new AppError(429, 'rate_limited', message)),
  });
  const asyncWrap = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { next(e); } };

  // ---------- Público ----------
  app.get('/api/health', asyncWrap((req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ ok: true });
  }));

  app.get('/api/catalog', asyncWrap((req, res) => {
    const products = db.prepare('SELECT id, name, price_cents, available FROM products ORDER BY rowid').all()
      .map((p) => ({ id: p.id, name: p.name, priceCents: p.price_cents, available: Boolean(p.available) }));
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json({
      products,
      fulfillment: {
        retirada: { enabled: config.fulfillment.retirada, feeCents: 0 },
        entrega: { enabled: config.fulfillment.entrega, feeCents: config.deliveryFeeCents },
      },
    });
  }));

  app.get('/api/schedule', asyncWrap((req, res) => {
    res.json(schedule.availability());
  }));

  app.post('/api/orders', limiter(config.rateLimits.orderCreate, 'Muitos pedidos em pouco tempo. Aguarde alguns minutos.'), asyncWrap((req, res) => {
    const { order, token, replayed } = orders.create(req.body, req.get('idempotency-key'));
    if (!replayed) log(`[${req.id}] pedido criado ${order.code}`);
    res.status(replayed ? 200 : 201).json({ order, trackingToken: token, replayed });
  }));

  app.get('/api/orders/:code', limiter(config.rateLimits.orderLookup, 'Muitas consultas. Aguarde alguns minutos.'), asyncWrap((req, res) => {
    res.json({ order: orders.lookup(req.params.code, req.get('x-order-token')) });
  }));

  // ---------- Administração ----------
  app.post('/api/admin/login', limiter(config.rateLimits.login, 'Muitas tentativas de login. Aguarde alguns minutos.'), asyncWrap((req, res) => {
    const b = req.body || {};
    res.json(auth.login(b.username, b.password, res));
  }));
  app.post('/api/admin/logout', asyncWrap((req, res) => {
    auth.logout(req, res);
    res.json({ ok: true });
  }));
  // Verificação de sessão sem erro HTTP quando deslogado (evita ruído no console do navegador).
  app.get('/api/admin/session', asyncWrap((req, res) => {
    const s = auth.sessionFrom(req);
    if (!s) return res.json({ admin: null });
    return res.json({ admin: { username: s.username, role: s.role, permissions: auth.PERMISSIONS[s.role] }, csrfToken: s.csrf_token });
  }));
  app.get('/api/admin/me', auth.requireAdmin(), asyncWrap((req, res) => {
    res.json({
      admin: { username: req.admin.username, role: req.admin.role, permissions: auth.PERMISSIONS[req.admin.role] },
      csrfToken: req.session.csrf_token,
    });
  }));

  app.get('/api/admin/orders', auth.requireAdmin('orders:read'), asyncWrap((req, res) => {
    res.json({ ...orders.list(req.query), statuses: STATUSES.map((id) => ({ id, label: STATUS_LABELS[id] })) });
  }));
  app.get('/api/admin/orders/:code', auth.requireAdmin('orders:read'), asyncWrap((req, res) => {
    res.json({ order: orders.adminGet(req.params.code) });
  }));
  app.patch('/api/admin/orders/:code/status', auth.requireAdmin('orders:update'), asyncWrap((req, res) => {
    const b = req.body || {};
    res.json({ order: orders.changeStatus(req.params.code, b.status, req.admin, { expectedStatus: b.expectedStatus, note: b.note }) });
  }));
  app.put('/api/admin/orders/:code/total', auth.requireAdmin('orders:update'), asyncWrap((req, res) => {
    res.json({ order: orders.setTotal(req.params.code, (req.body || {}).totalCents, req.admin) });
  }));

  app.get('/api/admin/schedule', auth.requireAdmin('orders:read'), asyncWrap((req, res) => {
    res.json(schedule.adminOverview());
  }));
  app.put('/api/admin/schedule', auth.requireAdmin('settings:write'), asyncWrap((req, res) => {
    schedule.saveSettings(req.body);
    log(`[${req.id}] agenda atualizada por ${req.admin.username}`);
    res.json(schedule.adminOverview());
  }));

  app.get('/api/admin/products', auth.requireAdmin('orders:read'), asyncWrap((req, res) => {
    const rows = db.prepare('SELECT id, name, price_cents, available, updated_at FROM products ORDER BY rowid').all();
    res.json({ products: rows.map((p) => ({ id: p.id, name: p.name, priceCents: p.price_cents, available: Boolean(p.available), updatedAt: p.updated_at })) });
  }));
  app.patch('/api/admin/products/:id', auth.requireAdmin('products:write'), asyncWrap((req, res) => {
    const b = req.body || {};
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!p) throw new AppError(404, 'not_found', 'Produto não encontrado.');
    let price = p.price_cents;
    let available = p.available;
    if ('priceCents' in b) {
      if (b.priceCents !== null && (!Number.isInteger(b.priceCents) || b.priceCents < 0 || b.priceCents > 100000000)) {
        throw new AppError(400, 'validation_error', 'Preço inválido.');
      }
      price = b.priceCents;
    }
    if ('available' in b) {
      if (typeof b.available !== 'boolean') throw new AppError(400, 'validation_error', 'Disponibilidade inválida.');
      available = b.available ? 1 : 0;
    }
    db.prepare('UPDATE products SET price_cents = ?, available = ?, updated_at = ? WHERE id = ?').run(price, available, new Date().toISOString(), p.id);
    log(`[${req.id}] produto ${p.id} atualizado por ${req.admin.username}`);
    res.json({ product: { id: p.id, name: p.name, priceCents: price, available: Boolean(available) } });
  }));

  app.use('/api', (req, res, next) => next(new AppError(404, 'not_found', 'Rota não encontrada.')));

  // ---------- Frontend (build de produção) ----------
  const indexFile = path.join(config.frontendDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    app.use(express.static(config.frontendDir, {
      index: false,
      setHeaders: (res, file) => {
        res.setHeader('Cache-Control', /[\\/]static[\\/]/.test(file) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
      },
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexFile);
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) } });
    }
    if (err.type === 'entity.too.large') return res.status(413).json({ error: { code: 'too_large', message: 'Requisição grande demais.' } });
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) return res.status(400).json({ error: { code: 'invalid_json', message: 'Corpo da requisição inválido.' } });
    // Erro inesperado: registra só mensagem/stack (nunca o corpo da requisição) e devolve resposta genérica.
    if (!config.silent) console.error(`[${req.id}] erro ${req.method} ${req.path}:`, err.stack || err.message);
    return res.status(500).json({ error: { code: 'internal_error', message: 'Erro interno. Tente novamente em instantes.', requestId: req.id } });
  });

  app.locals.auth = auth;
  return app;
}

module.exports = { createApp, can };
