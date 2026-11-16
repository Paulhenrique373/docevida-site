export const brl = (cents) =>
    cents == null ? null : `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export const formatDateTime = (iso) =>
    iso
        ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "";

export const maskPhone = (v) => {
    const d = String(v).replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const STATUS_META = {
    received: { label: "Recebido", cls: "bg-oat text-chocolate border-chocolate/30", icon: "inbox", hint: "Recebemos o seu pedido e a loja vai analisá-lo." },
    confirmed: { label: "Confirmado", cls: "bg-moss-light text-moss-dark border-moss/40", icon: "check", hint: "A loja confirmou que poderá atender o seu pedido." },
    preparing: { label: "Em preparação", cls: "bg-gold-soft text-[#5C4310] border-gold-dark/50", icon: "flame", hint: "Estamos preparando os seus doces." },
    completed: { label: "Concluído", cls: "bg-moss text-cream border-moss-dark", icon: "done", hint: "Pedido finalizado. Obrigado pela preferência!" },
    cancelled: { label: "Cancelado", cls: "bg-[#F6DEDA] text-[#7A1F14] border-[#7A1F14]/40", icon: "x", hint: "Este pedido foi cancelado." },
};

// "2026-10-13" -> "terça-feira, 13/10" (ao meio-dia local, para não "voltar um dia" por fuso horário)
export const formatDay = (date) =>
    date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }) : "";
