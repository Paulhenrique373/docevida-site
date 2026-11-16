'use strict';
const crypto = require('crypto');
const { sha256, orderToken } = require('./security');
const { slotLabel } = require('./schedule');
const { AppError } = require('./errors');

const STATUSES = ['received', 'confirmed', 'preparing', 'completed', 'cancelled'];
const STATUS_LABELS = {
  received: 'Recebido',
  confirmed: 'Confirmado',
  preparing: 'Em preparação',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};
const TRANSITIONS = {
  received: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos (0/O, 1/I)
function newCode() {
  let s = '';
  for (const b of crypto.randomBytes(6)) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `DV-${s}`;
}

const TOP_KEYS = ['customer', 'fulfillment', 'address', 'notes', 'contactPreference', 'items', 'schedule'];
const SCHEDULE_KEYS = ['date', 'slot'];
const CUSTOMER_KEYS = ['name', 'phone'];
const ITEM_KEYS = ['productId', 'quantity'];
const CONTACTS = ['whatsapp', 'instagram', 'email'];

function unknownKeys(obj, allowed) {
  return Object.keys(obj).filter((k) => !allowed.includes(k));
}
const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const ctrl = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

// Valida e normaliza o payload. Nunca aceita preços/totais vindos do cliente: campos desconhecidos são rejeitados.
function validateOrderInput(body, { fulfillment }) {
  const fields = {};
  if (!isPlainObject(body)) throw new AppError(400, 'invalid_body', 'Dados do pedido inválidos.');

  const extra = unknownKeys(body, TOP_KEYS);
  if (extra.length) throw new AppError(400, 'forbidden_field', 'O pedido contém campos não permitidos. Valores e totais são calculados pelo servidor.', { _: extra.join(', ') });

  const c = body.customer;
  let name = '';
  let phone = '';
  if (!isPlainObject(c)) fields.name = 'Informe seu nome.';
  else {
    if (unknownKeys(c, CUSTOMER_KEYS).length) throw new AppError(400, 'forbidden_field', 'O pedido contém campos não permitidos.');
    name = typeof c.name === 'string' ? c.name.trim().replace(/\s+/g, ' ') : '';
    if (name.length < 2 || name.length > 100 || ctrl.test(name)) fields.name = 'Informe seu nome (2 a 100 caracteres).';
    let digits = typeof c.phone === 'string' ? c.phone.replace(/\D/g, '') : '';
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
    phone = digits;
    if (!/^[1-9]{2}9?\d{8}$/.test(digits)) fields.phone = 'Informe um telefone válido com DDD.';
  }

  const mode = body.fulfillment;
  if (mode !== 'retirada' && mode !== 'entrega') fields.fulfillment = 'Escolha entrega ou retirada.';
  else if (!fulfillment[mode]) fields.fulfillment = 'Esta modalidade não está disponível no momento.';

  let address = null;
  if (mode === 'entrega') {
    address = typeof body.address === 'string' ? body.address.trim() : '';
    if (address.length < 8 || address.length > 300 || ctrl.test(address)) fields.address = 'Informe o endereço completo para entrega.';
  }

  let notes = null;
  if (body.notes !== undefined && body.notes !== null && body.notes !== '') {
    if (typeof body.notes !== 'string' || body.notes.trim().length > 500 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(body.notes)) fields.notes = 'Observações: no máximo 500 caracteres.';
    else notes = body.notes.trim() || null;
  }

  let contactPreference = 'whatsapp';
  if (body.contactPreference !== undefined) {
    if (!CONTACTS.includes(body.contactPreference)) fields.contactPreference = 'Forma de contato inválida.';
    else contactPreference = body.contactPreference;
  }

  let schedule = null;
  if (!isPlainObject(body.schedule)) fields.schedule = 'Escolha a data e o horário do pedido.';
  else {
    if (unknownKeys(body.schedule, SCHEDULE_KEYS).length) throw new AppError(400, 'forbidden_field', 'O pedido contém campos não permitidos.');
    const { date, slot } = body.schedule;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fields.schedule = 'Escolha uma data válida.';
    else if (typeof slot !== 'string' || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)) fields.schedule = 'Escolha um horário válido.';
    else schedule = { date, slot };
  }

  const merged = new Map();
  if (!Array.isArray(body.items) || body.items.length === 0) fields.items = 'Adicione ao menos um produto ao pedido.';
  else if (body.items.length > 30) fields.items = 'Itens demais no pedido.';
  else {
    for (const it of body.items) {
      if (!isPlainObject(it)) { fields.items = 'Item inválido.'; break; }
      if (unknownKeys(it, ITEM_KEYS).length) throw new AppError(400, 'forbidden_field', 'Os itens contêm campos não permitidos. Preços são definidos pelo servidor.');
      if (typeof it.productId !== 'string' || !it.productId || it.productId.length > 80) { fields.items = 'Produto inválido.'; break; }
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 99) { fields.items = 'Quantidade inválida (1 a 99).'; break; }
      const total = (merged.get(it.productId) || 0) + it.quantity;
      if (total > 99) { fields.items = 'Quantidade máxima por produto: 99.'; break; }
      merged.set(it.productId, total);
    }
  }

  if (Object.keys(fields).length) throw new AppError(400, 'validation_error', 'Confira os campos destacados.', fields);

  return {
    customer: { name, phone },
    fulfillment: mode,
    address,
    notes,
    contactPreference,
    schedule,
    items: [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity })).sort((a, b) => a.productId.localeCompare(b.productId)),
  };
}

const hashInput = (input) => sha256(JSON.stringify(input));

function createOrdersService(db, config, schedule) {
  const getProduct = db.prepare('SELECT id, name, price_cents, available FROM products WHERE id = ?');
  const findByKey = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?');
  const insertOrder = db.prepare(`INSERT INTO orders (code, idempotency_key, request_hash, customer_name, customer_phone, contact_preference,
    fulfillment, address, notes, subtotal_cents, delivery_fee_cents, total_cents, price_pending, status, scheduled_date, scheduled_slot, created_at, updated_at)
    VALUES (@code, @key, @hash, @name, @phone, @contact, @fulfillment, @address, @notes, @subtotal, @fee, @total, @pending, 'received', @sdate, @sslot, @now, @now)`);
  const insertItem = db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity, line_total_cents)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const insertEvent = db.prepare(`INSERT INTO order_events (order_id, kind, from_status, to_status, note, admin_id, admin_username, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const itemsOf = db.prepare('SELECT product_id, product_name, unit_price_cents, quantity, line_total_cents FROM order_items WHERE order_id = ? ORDER BY id');
  const eventsOf = db.prepare('SELECT kind, from_status, to_status, note, admin_username, created_at FROM order_events WHERE order_id = ? ORDER BY id');
  const byCode = db.prepare('SELECT * FROM orders WHERE code = ?');

  function serializeCommon(o) {
    return {
      code: o.code,
      status: o.status,
      statusLabel: STATUS_LABELS[o.status],
      fulfillment: o.fulfillment,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      schedule: o.scheduled_date ? { date: o.scheduled_date, slot: o.scheduled_slot, slotLabel: slotLabel(o.scheduled_slot) } : null,
      subtotalCents: o.subtotal_cents,
      deliveryFeeCents: o.delivery_fee_cents,
      totalCents: o.total_cents,
      pricePending: o.total_cents == null,
      items: itemsOf.all(o.id).map((i) => ({
        productId: i.product_id,
        name: i.product_name,
        quantity: i.quantity,
        unitPriceCents: i.unit_price_cents,
        lineTotalCents: i.line_total_cents,
      })),
    };
  }

  // Visão pública (cliente): sem telefone, endereço, observações nem nomes de administradores.
  function publicView(o) {
    return {
      ...serializeCommon(o),
      history: eventsOf.all(o.id)
        .filter((e) => e.kind === 'status')
        .map((e) => ({ status: e.to_status, statusLabel: STATUS_LABELS[e.to_status], at: e.created_at })),
    };
  }

  function adminView(o) {
    return {
      ...serializeCommon(o),
      customer: { name: o.customer_name, phone: o.customer_phone },
      contactPreference: o.contact_preference,
      address: o.address,
      notes: o.notes,
      allowedTransitions: TRANSITIONS[o.status],
      history: eventsOf.all(o.id).map((e) => ({
        kind: e.kind,
        from: e.from_status,
        to: e.to_status,
        note: e.note,
        by: e.admin_username,
        at: e.created_at,
      })),
    };
  }

  function create(body, idempotencyKey) {
    if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(idempotencyKey)) {
      throw new AppError(400, 'idempotency_key_required', 'Cabeçalho Idempotency-Key ausente ou inválido.');
    }
    const input = validateOrderInput(body, config);
    const hash = hashInput(input);

    const run = db.transaction(() => {
      // Dentro de BEGIN IMMEDIATE: dois envios simultâneos com a mesma chave são serializados.
      const existing = findByKey.get(idempotencyKey);
      if (existing) {
        if (existing.request_hash !== hash) {
          throw new AppError(409, 'idempotency_conflict', 'Esta chave de envio já foi usada com outro pedido.');
        }
        return { order: existing, replayed: true };
      }

      schedule.assertBookable(input.schedule.date, input.schedule.slot);

      let subtotal = 0;
      let allPriced = true;
      const lines = [];
      const problems = [];
      for (const it of input.items) {
        const p = getProduct.get(it.productId);
        if (!p) { problems.push(`Produto não encontrado: ${it.productId}`); continue; }
        if (!p.available) { problems.push(`${p.name} está indisponível no momento.`); continue; }
        const line = p.price_cents == null ? null : p.price_cents * it.quantity;
        if (line == null) allPriced = false; else subtotal += line;
        lines.push({ p, qty: it.quantity, line });
      }
      if (problems.length) throw new AppError(422, 'unavailable_items', problems.join(' '), { items: problems.join(' ') });

      const fee = input.fulfillment === 'retirada' ? 0 : config.deliveryFeeCents;
      const subtotalCents = allPriced ? subtotal : null;
      const total = subtotalCents != null && fee != null ? subtotalCents + fee : null;
      const now = new Date().toISOString();

      let code;
      for (let tries = 0; tries < 8; tries += 1) {
        code = newCode();
        if (!byCode.get(code)) break;
      }
      const info = insertOrder.run({
        code, key: idempotencyKey, hash,
        name: input.customer.name, phone: input.customer.phone, contact: input.contactPreference,
        fulfillment: input.fulfillment, address: input.address, notes: input.notes,
        subtotal: subtotalCents, fee, total, pending: total == null ? 1 : 0, now,
        sdate: input.schedule.date, sslot: input.schedule.slot,
      });
      const orderId = Number(info.lastInsertRowid);
      for (const l of lines) insertItem.run(orderId, l.p.id, l.p.name, l.p.price_cents, l.qty, l.line);
      insertEvent.run(orderId, 'status', null, 'received', null, null, null, now);
      return { order: byCode.get(code), replayed: false };
    });

    const { order, replayed } = run.immediate();
    return { order: publicView(order), token: orderToken(config.orderTokenSecret, order.code), replayed };
  }

  function lookup(code, token) {
    const o = typeof code === 'string' ? byCode.get(code.toUpperCase()) : null;
    const expected = o ? orderToken(config.orderTokenSecret, o.code) : orderToken(config.orderTokenSecret, 'x');
    const ok = typeof token === 'string' && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    if (!o || !ok) throw new AppError(404, 'not_found', 'Pedido não encontrado. Confira o código e a chave de acompanhamento.');
    return publicView(o);
  }

  const SORTS = { scheduled: 'o.scheduled_date', created_at: 'o.created_at', total: 'o.total_cents', status: 'o.status', code: 'o.code', customer: 'o.customer_name' };

  function list(q) {
    const where = [];
    const params = {};
    if (q.status) {
      if (!STATUSES.includes(q.status)) throw new AppError(400, 'invalid_filter', 'Status inválido.');
      where.push('o.status = @status');
      params.status = q.status;
    }
    if (q.scheduled) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(q.scheduled))) throw new AppError(400, 'invalid_filter', 'Data inválida.');
      where.push('o.scheduled_date = @scheduled');
      params.scheduled = String(q.scheduled);
    }
    for (const [key, op] of [['from', '>='], ['to', '<=']]) {
      if (q[key]) {
        const d = new Date(q[key]);
        if (Number.isNaN(d.getTime())) throw new AppError(400, 'invalid_filter', 'Data inválida.');
        // "to" sem hora inclui o dia inteiro
        if (key === 'to' && /^\d{4}-\d{2}-\d{2}$/.test(q[key])) d.setUTCHours(23, 59, 59, 999);
        params[key] = d.toISOString();
        where.push(`o.created_at ${op} @${key}`);
      }
    }
    if (q.q) {
      const term = String(q.q).trim().slice(0, 60);
      if (term) {
        const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
        params.like = like;
        const digits = term.replace(/\D/g, '');
        let clause = "(o.code LIKE @like ESCAPE '\\' OR o.customer_name LIKE @like ESCAPE '\\'";
        if (digits.length >= 4) { params.phone = `%${digits}%`; clause += ' OR o.customer_phone LIKE @phone'; }
        where.push(`${clause})`);
      }
    }
    const sortCol = SORTS[q.sort] || SORTS.created_at;
    const dir = String(q.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const pageSize = Math.min(Math.max(parseInt(q.pageSize, 10) || 20, 1), 100);
    const page = Math.max(parseInt(q.page, 10) || 1, 1);
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = db.prepare(`SELECT COUNT(*) n FROM orders o ${w}`).get(params).n;
    const rows = db.prepare(`SELECT o.*, (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o ${w} ORDER BY ${sortCol} ${dir}, o.id DESC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize });
    return {
      total, page, pageSize,
      orders: rows.map((o) => ({
        code: o.code, status: o.status, statusLabel: STATUS_LABELS[o.status], createdAt: o.created_at,
        customerName: o.customer_name, fulfillment: o.fulfillment, itemCount: o.item_count,
        schedule: o.scheduled_date ? { date: o.scheduled_date, slotLabel: slotLabel(o.scheduled_slot) } : null,
        totalCents: o.total_cents, pricePending: o.total_cents == null,
      })),
    };
  }

  function adminGet(code) {
    const o = byCode.get(String(code).toUpperCase());
    if (!o) throw new AppError(404, 'not_found', 'Pedido não encontrado.');
    return adminView(o);
  }

  function changeStatus(code, to, admin, { expectedStatus, note } = {}) {
    if (!STATUSES.includes(to)) throw new AppError(400, 'invalid_status', 'Status inválido.');
    if (note !== undefined && (typeof note !== 'string' || note.length > 300)) throw new AppError(400, 'invalid_note', 'Nota inválida (máx. 300 caracteres).');
    const tx = db.transaction(() => {
      const o = byCode.get(String(code).toUpperCase());
      if (!o) throw new AppError(404, 'not_found', 'Pedido não encontrado.');
      if (expectedStatus && expectedStatus !== o.status) {
        throw new AppError(409, 'stale_status', `O pedido já está "${STATUS_LABELS[o.status]}". Atualize a tela e tente novamente.`);
      }
      if (!TRANSITIONS[o.status].includes(to)) {
        throw new AppError(409, 'invalid_transition', `Não é possível mudar de "${STATUS_LABELS[o.status]}" para "${STATUS_LABELS[to]}".`);
      }
      if (to === 'confirmed' && o.total_cents == null) {
        throw new AppError(409, 'total_required', 'Defina o valor total do pedido antes de confirmá-lo.');
      }
      const now = new Date().toISOString();
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(to, now, o.id);
      insertEvent.run(o.id, 'status', o.status, to, note?.trim() || null, admin.id, admin.username, now);
      return byCode.get(o.code);
    });
    return adminView(tx.immediate());
  }

  // Define o total quando algum preço/entrega ainda estava "sob consulta". Só vale para pedidos em aberto.
  function setTotal(code, totalCents, admin) {
    if (!Number.isInteger(totalCents) || totalCents < 0 || totalCents > 100000000) {
      throw new AppError(400, 'invalid_total', 'Valor total inválido.');
    }
    const tx = db.transaction(() => {
      const o = byCode.get(String(code).toUpperCase());
      if (!o) throw new AppError(404, 'not_found', 'Pedido não encontrado.');
      if (!o.price_pending) throw new AppError(409, 'total_locked', 'O total deste pedido já foi calculado pelo sistema.');
      if (!['received', 'confirmed'].includes(o.status)) throw new AppError(409, 'total_locked', 'O total não pode mais ser alterado neste status.');
      const now = new Date().toISOString();
      db.prepare('UPDATE orders SET total_cents = ?, updated_at = ? WHERE id = ?').run(totalCents, now, o.id);
      insertEvent.run(o.id, 'note', null, null, `Valor total definido pela loja: R$ ${(totalCents / 100).toFixed(2).replace('.', ',')}`, admin.id, admin.username, now);
      return byCode.get(o.code);
    });
    return adminView(tx.immediate());
  }

  return { create, lookup, list, adminGet, changeStatus, setTotal };
}

module.exports = { createOrdersService, validateOrderInput, AppError, STATUSES, STATUS_LABELS, TRANSITIONS };
