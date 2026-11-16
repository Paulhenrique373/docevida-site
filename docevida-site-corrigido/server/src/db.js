'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER CHECK (price_cents IS NULL OR (price_cents >= 0 AND price_cents <= 100000000)),
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0,1)),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  contact_preference TEXT NOT NULL,
  fulfillment TEXT NOT NULL CHECK (fulfillment IN ('retirada','entrega')),
  address TEXT,
  notes TEXT,
  subtotal_cents INTEGER,
  delivery_fee_cents INTEGER,
  total_cents INTEGER,
  price_pending INTEGER NOT NULL CHECK (price_pending IN (0,1)),
  status TEXT NOT NULL CHECK (status IN ('received','confirmed','preparing','completed','cancelled')),
  scheduled_date TEXT,
  scheduled_slot TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price_cents INTEGER,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  line_total_cents INTEGER
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('status','note')),
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  admin_id INTEGER,
  admin_username TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','staff')),
  disabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
`;

function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  if (file !== ':memory:') db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(SCHEMA);
  migrate(db);
  seedCatalog(db);
  return db;
}

// Bancos criados antes da agenda ganham as colunas novas (pedidos antigos ficam sem data agendada).
function migrate(db) {
  const cols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
  if (!cols.includes('scheduled_date')) db.exec('ALTER TABLE orders ADD COLUMN scheduled_date TEXT');
  if (!cols.includes('scheduled_slot')) db.exec('ALTER TABLE orders ADD COLUMN scheduled_slot TEXT');
  db.exec('CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders(scheduled_date)');
}

// Cadastra produtos novos do catálogo-base SEM sobrescrever preço/disponibilidade já ajustados pela loja.
function seedCatalog(db) {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'catalog.seed.json'), 'utf8'));
  const insert = db.prepare('INSERT OR IGNORE INTO products (id, name, price_cents, available, updated_at) VALUES (?, ?, NULL, 1, ?)');
  const now = new Date().toISOString();
  db.transaction(() => seed.forEach((p) => insert.run(p.id, p.name, now)))();
}

module.exports = { openDatabase };
