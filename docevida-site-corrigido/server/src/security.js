'use strict';
const crypto = require('crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$');
}

function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(hash, 'base64');
    const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Hash fictício usado para equalizar o tempo de resposta quando o usuário não existe.
const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString('hex'));

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Chave de acompanhamento do pedido: derivada por HMAC do código. Não é armazenada (um vazamento do banco
// não expõe as chaves) e pode ser recalculada com segurança quando o cliente reenvia o mesmo pedido.
const orderToken = (secret, code) => crypto.createHmac('sha256', secret).update(`order-token:${code}`).digest('hex').slice(0, 32);

module.exports = { hashPassword, verifyPassword, DUMMY_HASH, sha256, randomToken, safeEqual, orderToken };
