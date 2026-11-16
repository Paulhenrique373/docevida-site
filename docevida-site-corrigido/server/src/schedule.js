'use strict';
const { AppError } = require('./errors');

// Regras PADRÃO da agenda (valores assumidos; a dona da loja ajusta no painel em Admin → Agenda).
const DEFAULT_SCHEDULE = {
  timezone: 'America/Sao_Paulo',
  minLeadDays: 2,          // encomendar com pelo menos 2 dias de antecedência
  maxAdvanceDays: 30,      // até 30 dias à frente
  openWeekdays: [1, 2, 3, 4, 5, 6], // 0 = domingo ... 6 = sábado (atende de segunda a sábado)
  slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
  dailyLimit: 10,          // pedidos (não cancelados) por dia; null = sem limite
  closedDates: [],         // datas fechadas (feriados, folgas): 'AAAA-MM-DD'
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const isRealDate = (s) => {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const addDays = (s, n) => {
  const d = new Date(`${s}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekdayOf = (s) => new Date(`${s}T12:00:00Z`).getUTCDay();
const todayIn = (tz, now) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

const hourLabel = (t) => {
  const [h, m] = t.split(':');
  return m === '00' ? `${h}h` : `${h}h${m}`;
};
const slotId = (s) => `${s.start}-${s.end}`;
const slotLabel = (id) => {
  const [a, b] = String(id).split('-');
  return a && b ? `${hourLabel(a)} às ${hourLabel(b)}` : String(id);
};

function validateSettings(input) {
  const fail = (msg) => { throw new AppError(400, 'validation_error', msg); };
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Configuração inválida.');
  const allowed = ['minLeadDays', 'maxAdvanceDays', 'openWeekdays', 'slots', 'dailyLimit', 'closedDates'];
  const extra = Object.keys(input).filter((k) => !allowed.includes(k));
  if (extra.length) fail(`Campos não permitidos: ${extra.join(', ')}.`);

  const { minLeadDays, maxAdvanceDays, openWeekdays, slots, dailyLimit, closedDates } = input;
  if (!Number.isInteger(minLeadDays) || minLeadDays < 0 || minLeadDays > 60) fail('Antecedência mínima: de 0 a 60 dias.');
  if (!Number.isInteger(maxAdvanceDays) || maxAdvanceDays < 1 || maxAdvanceDays > 180) fail('Janela de agendamento: de 1 a 180 dias.');
  if (maxAdvanceDays < minLeadDays) fail('A janela de agendamento não pode ser menor que a antecedência mínima.');
  if (!Array.isArray(openWeekdays) || !openWeekdays.length || openWeekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) fail('Escolha ao menos um dia de atendimento.');
  if (!Array.isArray(slots) || slots.length < 1 || slots.length > 8) fail('Informe de 1 a 8 faixas de horário.');
  const seen = new Set();
  const cleanSlots = slots.map((s) => {
    if (!s || !TIME_RE.test(s.start) || !TIME_RE.test(s.end) || s.start >= s.end) fail('Cada faixa precisa de início e fim válidos (início antes do fim).');
    const id = slotId(s);
    if (seen.has(id)) fail('Há faixas de horário repetidas.');
    seen.add(id);
    return { start: s.start, end: s.end };
  }).sort((a, b) => a.start.localeCompare(b.start));
  if (dailyLimit !== null && (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 500)) fail('Limite diário: de 1 a 500 pedidos (ou sem limite).');
  if (!Array.isArray(closedDates) || closedDates.length > 120 || closedDates.some((d) => typeof d !== 'string' || !isRealDate(d))) fail('Datas fechadas inválidas (use AAAA-MM-DD).');

  return {
    minLeadDays, maxAdvanceDays,
    openWeekdays: [...new Set(openWeekdays)].sort(),
    slots: cleanSlots,
    dailyLimit,
    closedDates: [...new Set(closedDates)].sort(),
  };
}

function createScheduleService(db, config) {
  const now = () => (config.now ? config.now() : new Date());
  const tz = (config.schedule && config.schedule.timezone) || DEFAULT_SCHEDULE.timezone;
  const defaults = { ...DEFAULT_SCHEDULE, ...(config.schedule || {}) };
  const getRow = db.prepare("SELECT value FROM settings WHERE key = 'schedule'");
  const countFor = db.prepare("SELECT COUNT(*) n FROM orders WHERE scheduled_date = ? AND status != 'cancelled'");

  function getSettings() {
    const row = getRow.get();
    const base = { ...defaults };
    delete base.timezone;
    if (!row) return { ...base };
    try { return { ...base, ...JSON.parse(row.value) }; } catch { return { ...base }; }
  }

  function saveSettings(input) {
    const clean = validateSettings(input);
    db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('schedule', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
      .run(JSON.stringify(clean), new Date().toISOString());
    return clean;
  }

  function window(settings) {
    const today = todayIn(tz, now());
    return { today, first: addDays(today, settings.minLeadDays), last: addDays(today, settings.maxAdvanceDays) };
  }

  function dayState(settings, date) {
    const closed = !settings.openWeekdays.includes(weekdayOf(date)) || settings.closedDates.includes(date);
    const used = countFor.get(date).n;
    const remaining = settings.dailyLimit == null ? null : Math.max(settings.dailyLimit - used, 0);
    return { closed, used, remaining, full: !closed && remaining === 0 };
  }

  // Visão pública: só o necessário para o cliente escolher (sem contagem interna de pedidos).
  function availability() {
    const s = getSettings();
    const w = window(s);
    const days = [];
    for (let d = w.first; d <= w.last; d = addDays(d, 1)) {
      const st = dayState(s, d);
      if (st.closed) continue;
      days.push({ date: d, weekday: WEEKDAYS[weekdayOf(d)], full: st.full });
    }
    return {
      timezone: tz,
      minLeadDays: s.minLeadDays,
      slots: s.slots.map((x) => ({ id: slotId(x), label: slotLabel(slotId(x)) })),
      days,
    };
  }

  // Chamado DENTRO da transação de criação do pedido: a contagem e a inserção ficam atômicas.
  function assertBookable(date, slot) {
    const s = getSettings();
    const w = window(s);
    const bad = (msg) => { throw new AppError(409, 'schedule_unavailable', msg, { schedule: msg }); };
    if (!isRealDate(date)) bad('Escolha uma data válida.');
    if (!s.slots.some((x) => slotId(x) === slot)) bad('Escolha um horário válido.');
    if (date < w.first) bad(`Os pedidos precisam de pelo menos ${s.minLeadDays} dia(s) de antecedência.`);
    if (date > w.last) bad(`Só é possível agendar até ${s.maxAdvanceDays} dias à frente.`);
    const st = dayState(s, date);
    if (st.closed) bad('A loja não atende nesta data. Escolha outro dia.');
    if (st.full) bad('Este dia já está com a agenda completa. Escolha outra data.');
  }

  // Visão administrativa: configurações + carga dos próximos dias.
  function adminOverview() {
    const s = getSettings();
    const w = window(s);
    const load = [];
    for (let d = w.today; d <= addDays(w.today, 14); d = addDays(d, 1)) {
      const st = dayState(s, d);
      load.push({ date: d, weekday: WEEKDAYS[weekdayOf(d)], closed: st.closed, orders: st.used, limit: s.dailyLimit });
    }
    return { timezone: tz, today: w.today, settings: s, load };
  }

  return { getSettings, saveSettings, availability, assertBookable, adminOverview };
}

module.exports = { createScheduleService, validateSettings, DEFAULT_SCHEDULE, slotLabel, isRealDate };
