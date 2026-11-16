// Configuração central da DoceVida — atualize a loja por aqui, sem mexer na interface.

export const SITE = {
    brand: {
        name: "DOCEVIDA",
        tagline: "Chocolates Artesanais",
    },
    contact: {
        // ⚠️ Dados oficiais pendentes — preencha quando disponíveis. Não usar valores fictícios.
        whatsapp: "", // ex.: "5511999999999" (DDI + DDD + número, apenas dígitos)
        instagram: "https://www.instagram.com/docevidaoficiall",
        email: "",
        hours: "",
        otherNetworks: [],
    },
    // Modalidades de atendimento. ⚠️ Confirmar com a loja (não há taxa/área de entrega cadastrada: fee null = "a combinar").
    fulfillment: {
        retirada: { enabled: true, label: "Retirada", note: "Escolha abaixo a data e o horário. O local de retirada é combinado no atendimento." },
        entrega: { enabled: true, label: "Entrega", fee: null, note: "Escolha abaixo a data e o horário. A taxa de entrega é informada no atendimento." },
    },
    orderMessage: {
        greeting: "Olá, DoceVida! Gostaria de fazer um pedido:",
        totalPending: "Total: valores sob consulta",
    },
    meta: {
        title: "DoceVida — Chocolates Artesanais",
        description:
            "Chocolates e doces artesanais, enrolados à mão e feitos com carinho. O chocolate mais amado de Cidade Tiradentes.",
    },
};

export const fulfillmentOptions = () =>
    Object.entries(SITE.fulfillment)
        .filter(([, v]) => v.enabled)
        .map(([id, v]) => ({ id, ...v }));

export const isWhatsAppConfigured = () => Boolean(SITE.contact.whatsapp);

export const whatsappUrl = (message) =>
    `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const NAV_LINKS = [
    { to: "/", label: "Início" },
    { to: "/produtos", label: "Produtos" },
    { to: "/jogos/doces-match", label: "Doces Match" },
    { to: "/historia", label: "Nossa História" },
    { to: "/sustentabilidade", label: "Sustentabilidade" },
    { to: "/doacoes", label: "Doações" },
    { to: "/qualidade", label: "Qualidade" },
    { to: "/contato", label: "Contato" },
];
