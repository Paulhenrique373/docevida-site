// Cardápio da DoceVida — baseado nos destaques "Sobremesas" do Instagram @docevidaoficiall.
// Preços, ingredientes, pesos e alergênicos seguem pendentes até serem confirmados (não inventar).
// Fotos: public/images/produtos/<slug>-{480,800,1200}.webp (proporção original 3:2, 1536x1024).
const IMG_DIR = "/images/produtos";
export const PHOTO_WIDTH = 1200;
export const PHOTO_HEIGHT = 800;
const photo = (slug, alt) => ({
    image: `${IMG_DIR}/${slug}-800.webp`,
    imageSrcSet: [480, 800, 1200].map((w) => `${IMG_DIR}/${slug}-${w}.webp ${w}w`).join(", "),
    imageAlt: alt,
});
const base = { price: null, category: null, ingredients: [], allergens: [], sizes: [], available: true, featured: false, tags: [], isNew: false };

export const products = [
    {
        ...base,
        id: "doce-de-ninho",
        ...photo("doce-de-ninho", "Quatro brigadeiros de Ninho cobertos de leite em pó em forminhas marrons, um deles mordido mostrando o recheio cremoso, sobre uma tábua de madeira"),
        name: "Doce de Ninho",
        description: "Brigadeiro de Ninho artesanal, cremoso e com o sabor marcante do leite em pó. O queridinho da DoceVida.",
        featured: true,
    },
    {
        ...base,
        id: "docinho-cacau-coco",
        ...photo("docinho-cacau-coco", "Quatro docinhos de chocolate com coco ralado por cima em forminhas marrons, um deles mordido, ao lado de um coco aberto"),
        name: "Docinho de Cacau com Coco",
        description: "Um dos queridinhos do público: docinho de cacau com coco, enrolado à mão.",
    },
    {
        ...base,
        id: "brigadeiro-morango-ninho",
        ...photo("brigadeiro-morango-ninho", "Brigadeiros rosados cobertos com chocolate branco e morango desidratado, um mordido mostrando o recheio de morango, com morangos frescos ao redor"),
        name: "Brigadeiro de Morango com Ninho Desnatado",
        description: "Brigadeiro de morango feito com ninho desnatado, enrolado à mão.",
    },
    {
        ...base,
        id: "brigadeiro-banana-zero",
        ...photo("brigadeiro-banana-zero", "Brigadeiros de banana cobertos com farelo crocante dourado, um mordido mostrando o recheio cremoso, com bananas e rodelas de banana ao redor"),
        name: "Brigadeiro de Banana Zero Açúcar",
        description: "Os novos brigadeiros de banana, sem açúcar.",
        tags: ["Zero açúcar"],
        isNew: true,
    },
    {
        ...base,
        id: "beijinho-morango-zero",
        ...photo("beijinho-morango-zero", "Beijinhos de morango com coco ralado e um pedacinho de morango fresco no topo, um mordido mostrando o recheio rosado"),
        name: "Beijinho de Morango Zero Açúcar",
        description: "Beijinho de morango sem açúcar. Já encomendou o seu hoje?",
        tags: ["Zero açúcar"],
    },
    {
        ...base,
        id: "brownie-proteico",
        ...photo("brownie-proteico", "Três pedaços de brownie de chocolate com interior macio e cremoso, cercados de pedaços de chocolate e bananas ao fundo"),
        name: "Brownie Proteico",
        description: "Brownie proteico e delicioso, só aqui na DoceVida.",
        tags: ["Proteico"],
    },
    {
        ...base,
        id: "muffin-banana-proteico",
        ...photo("muffin-banana-proteico", "Muffins de banana com aveia e uma rodela de banana no topo, um deles partido mostrando a massa macia, com banana e aveia ao redor"),
        name: "Muffin de Banana Proteico",
        description: "Sobremesa de muffin com sabor novo: banana, bem proteico.",
        tags: ["Proteico"],
        isNew: true,
    },
    {
        ...base,
        id: "muffin-abacaxi",
        ...photo("muffin-abacaxi", "Muffins dourados com pedaços de abacaxi, um deles partido mostrando a massa macia, com abacaxi fresco ao fundo"),
        name: "Muffin de Abacaxi",
        description: "Para o café da tarde: muffin de abacaxi.",
    },
    {
        ...base,
        id: "biscoito-maca-canela",
        ...photo("biscoito-maca-canela", "Pilha de biscoitos de aveia com pedaços de maçã e canela, com maçã fatiada e canela em pau ao lado"),
        name: "Biscoito de Maçã e Canela",
        description: "Nosso biscoito delicioso de maçã e canela, o mais famoso entre a nossa região.",
    },
    {
        ...base,
        id: "biscoito-coco-banana",
        ...photo("biscoito-coco-banana", "Pilha de biscoitos dourados de coco com banana, com rodelas de banana e um coco aberto ao fundo"),
        name: "Biscoito de Coco com Banana",
        description: "Deu vontade de comer um biscoito? Aqui tem de coco com banana, feito para você.",
    },
    {
        ...base,
        id: "cookie-caseiro",
        ...photo("cookie-caseiro", "Pilha de cookies caseiros com pedaços de chocolate, sobre tábua de madeira com chocolate picado ao redor"),
        name: "Cookie Caseiro",
        description: "Aquele amor por cookie caseiro, com sabor de quero mais.",
    },
];

// Sem lançamentos confirmados no momento (os anteriores não constavam no Instagram).
export const upcomingProducts = [];

export const allCatalogItems = [...products, ...upcomingProducts];

// Caixas e bolos — tabela de preços da DoceVida. O servidor é a autoridade de preços;
// os valores abaixo são o ponto de partida e são sobrescritos pelo catálogo do servidor.
export const packages = [
    { id: "pkg-caixa-brigadeiros", title: "Caixa de Brigadeiros", description: "Brigadeiros enrolados à mão, prontos para presentear ou dividir.", photoOf: "brigadeiro-morango-ninho", options: [[10, "10 unidades", 35], [20, "20 unidades", 65], [30, "30 unidades", 90], [50, "50 unidades", 140]] },
    { id: "pkg-caixa-doces-variados", title: "Caixa de Doces Variados", description: "Uma seleção de doces variados da DoceVida.", photoOf: "docinho-cacau-coco", options: [[10, "10 unidades", 38], [20, "20 unidades", 70], [30, "30 unidades", 98], [50, "50 unidades", 150]] },
    { id: "pkg-caixa-mista", title: "Caixa Mista — Brigadeiros + Doces", description: "Brigadeiros e doces juntos na mesma caixa.", photoOf: "doce-de-ninho", options: [[10, "10 unidades", 36], [20, "20 unidades", 68], [30, "30 unidades", 95], [50, "50 unidades", 145]] },
    { id: "pkg-caixa-biscoitos", title: "Caixa de Biscoitos", description: "Biscoitos da DoceVida em caixa.", photoOf: "biscoito-maca-canela", options: [[10, "10 unidades", 28], [20, "20 unidades", 50], [30, "30 unidades", 72], [50, "50 unidades", 110]] },
    { id: "pkg-bolo-inteiro", title: "Bolo Inteiro", description: "Bolo inteiro da DoceVida, nos tamanhos de 1, 2 ou 3 kg.", photoOf: null, options: [[1, "1 kg", 85], [2, "2 kg", 160], [3, "3 kg", 230]] },
    { id: "pkg-pedaco-bolo", title: "Pedaço de Bolo", description: "Uma fatia de bolo para matar a vontade.", photoOf: null, options: [[1, "1 fatia", 12]] },
];

const photoOf = (id) => products.find((p) => p.id === id);
export const packageItems = packages.flatMap((pkg) => {
    const photo = pkg.photoOf ? photoOf(pkg.photoOf) : null;
    return pkg.options.map(([qty, optionLabel, price]) => ({
        ...base,
        id: `${pkg.id}-${qty}`,
        name: `${pkg.title} — ${optionLabel}`,
        description: pkg.description,
        price,
        packageId: pkg.id,
        optionLabel,
        image: photo?.image ?? null,
        imageSrcSet: photo?.imageSrcSet,
    }));
});
packages.forEach((pkg) => {
    pkg.items = packageItems.filter((it) => it.packageId === pkg.id);
    pkg.image = pkg.photoOf ? photoOf(pkg.photoOf)?.image : null;
    pkg.imageSrcSet = pkg.photoOf ? photoOf(pkg.photoOf)?.imageSrcSet : undefined;
});

export const findProduct = (id) => products.find((p) => p.id === id) || packageItems.find((p) => p.id === id);

export const formatPrice = (value) =>
    value == null
        ? null
        : `R$ ${value.toFixed(2).replace(".", ",")}`;

export const priceLabel = (product) =>
    product?.price != null ? formatPrice(product.price) : "Preço sob consulta";

// ---- Sincronização com o catálogo oficial do servidor (preço e disponibilidade) ----
// O servidor é a autoridade de preços; aqui só espelhamos o que ele informa para exibição.
// Valores do navegador nunca são enviados como preço: o pedido leva apenas id + quantidade.
const listeners = new Set();
let catalogVersion = 0;
let fulfillmentInfo = { retirada: { enabled: true, feeCents: 0 }, entrega: { enabled: true, feeCents: null } };
let catalogLoaded = false;

export function applyServerCatalog(payload) {
    for (const sp of payload?.products || []) {
        const local = findProduct(sp.id);
        if (!local) continue;
        local.price = Number.isInteger(sp.priceCents) ? sp.priceCents / 100 : null;
        local.available = Boolean(sp.available);
    }
    if (payload?.fulfillment) fulfillmentInfo = payload.fulfillment;
    catalogLoaded = true;
    catalogVersion += 1;
    listeners.forEach((l) => l());
}
export const subscribeCatalog = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
export const getCatalogVersion = () => catalogVersion;
export const getFulfillmentInfo = () => fulfillmentInfo;
export const isCatalogLoaded = () => catalogLoaded;
export const centsOf = (reais) => (reais == null ? null : Math.round(reais * 100));
