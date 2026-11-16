'use strict';
const { hashPassword, verifyPassword, DUMMY_HASH, sha256, randomToken, safeEqual } = require('./security');
const { AppError } = require('./errors');

const COOKIE = 'dv_admin';
const PERMISSIONS = {
  owner: ['orders:read', 'orders:update', 'products:write', 'settings:write'],
  staff: ['orders:read', 'orders:update'],
};
const can = (admin, perm) => (PERMISSIONS[admin.role] || []).includes(perm);

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function createAuth(db, config) {
  const failures = new Map(); // bloqueio por usuário (em memória): 5 falhas / 15 min
  const LOCK_MS = 15 * 60 * 1000;
  const MAX_FAILS = 5;

  const isLocked = (u) => {
    const f = failures.get(u);
    if (!f) return false;
    if (Date.now() - f.first > LOCK_MS) { failures.delete(u); return false; }
    return f.count >= MAX_FAILS;
  };
  const registerFail = (u) => {
    const f = failures.get(u);
    if (!f || Date.now() - f.first > LOCK_MS) failures.set(u, { count: 1, first: Date.now() });
    else f.count += 1;
  };

  function cookieHeader(value, maxAgeMs) {
    const parts = [`${COOKIE}=${encodeURIComponent(value)}`, 'Path=/api', 'HttpOnly', 'SameSite=Strict', `Max-Age=${Math.floor(maxAgeMs / 1000)}`];
    if (config.production) parts.push('Secure');
    return parts.join('; ');
  }

  function login(username, password, res) {
    const u = typeof username === 'string' ? username.trim().toLowerCase().slice(0, 60) : '';
    if (!u || typeof password !== 'string' || !password || password.length > 200) {
      throw new AppError(400, 'validation_error', 'Informe usuário e senha.');
    }
    if (isLocked(u)) throw new AppError(429, 'locked', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(u);
    const ok = verifyPassword(password, admin ? admin.password_hash : DUMMY_HASH) && admin && !admin.disabled;
    if (!ok) {
      registerFail(u);
      throw new AppError(401, 'invalid_credentials', 'Usuário ou senha incorretos.');
    }
    failures.delete(u);
    const token = randomToken();
    const csrf = randomToken(24);
    const now = Date.now();
    db.prepare('INSERT INTO sessions (token_hash, admin_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
      .run(sha256(token), admin.id, csrf, new Date(now).toISOString(), new Date(now + config.sessionTtlMs).toISOString());
    res.setHeader('Set-Cookie', cookieHeader(token, config.sessionTtlMs));
    return { admin: { username: admin.username, role: admin.role, permissions: PERMISSIONS[admin.role] }, csrfToken: csrf };
  }

  function sessionFrom(req) {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (!token) return null;
    const row = db.prepare(`SELECT s.token_hash, s.csrf_token, s.expires_at, a.id, a.username, a.role, a.disabled
      FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ?`).get(sha256(token));
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now() || row.disabled) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
      return null;
    }
    return row;
  }

  // Autenticação obrigatória no servidor para TODA rota administrativa.
  function requireAdmin(permission) {
    return (req, res, next) => {
      const s = sessionFrom(req);
      if (!s) return next(new AppError(401, 'unauthenticated', 'Faça login para continuar.'));
      const admin = { id: s.id, username: s.username, role: s.role };
      if (permission && !can(admin, permission)) return next(new AppError(403, 'forbidden', 'Você não tem permissão para esta ação.'));
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        if (!safeEqual(req.get('x-csrf-token') || '', s.csrf_token)) return next(new AppError(403, 'csrf', 'Sessão inválida. Recarregue a página e tente novamente.'));
      }
      req.admin = admin;
      req.session = s;
      return next();
    };
  }

  function logout(req, res) {
    const s = sessionFrom(req);
    if (s) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(s.token_hash);
    res.setHeader('Set-Cookie', cookieHeader('', 0));
  }

  const purgeExpired = () => db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());

  function createAdmin(username, password, role = 'staff') {
    const u = String(username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(u)) throw new Error('Usuário inválido (3-40 caracteres: letras, números, ponto, hífen, sublinhado).');
    if (typeof password !== 'string' || password.length < 10) throw new Error('A senha precisa ter pelo menos 10 caracteres.');
    if (!PERMISSIONS[role]) throw new Error('Perfil inválido (owner ou staff).');
    db.prepare('INSERT INTO admins (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)')
      .run(u, hashPassword(password), role, new Date().toISOString());
    return u;
  }

  return { login, logout, requireAdmin, sessionFrom, purgeExpired, createAdmin, PERMISSIONS };
}

module.exports = { createAuth, PERMISSIONS, can };
