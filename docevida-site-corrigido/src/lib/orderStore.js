// Armazena APENAS: (1) a chave de idempotência do envio em andamento e (2) código+chave de acompanhamento dos
// pedidos já registrados. Os pedidos oficiais vivem no servidor; isto só ajuda o cliente a não duplicar/consultar.
const DRAFT_KEY = "docevida_checkout_v1";
const MINE_KEY = "docevida_my_orders_v1";

const read = (k, fallback) => {
    try {
        const v = JSON.parse(localStorage.getItem(k));
        return v ?? fallback;
    } catch {
        return fallback;
    }
};
const write = (k, v) => {
    try {
        localStorage.setItem(k, JSON.stringify(v));
    } catch {
        /* armazenamento indisponível */
    }
};

const uuid = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

// Mesma chave enquanto o conteúdo do pedido for idêntico (reenvio/timeout/recarregar a página);
// se o cliente alterar o pedido, nasce uma nova chave.
export function idempotencyKeyFor(fingerprint) {
    const saved = read(DRAFT_KEY, null);
    if (saved?.fingerprint === fingerprint && typeof saved.key === "string") return saved.key;
    const key = `dv-${uuid()}`;
    write(DRAFT_KEY, { fingerprint, key });
    return key;
}
export const clearIdempotencyKey = () => {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        /* noop */
    }
};

export const getMyOrders = () => {
    const list = read(MINE_KEY, []);
    return Array.isArray(list) ? list.filter((o) => o && typeof o.code === "string" && typeof o.token === "string") : [];
};
export function rememberOrder(code, token) {
    const list = getMyOrders().filter((o) => o.code !== code);
    list.unshift({ code, token, savedAt: new Date().toISOString() });
    write(MINE_KEY, list.slice(0, 10));
}
export function forgetOrder(code) {
    write(MINE_KEY, getMyOrders().filter((o) => o.code !== code));
}
