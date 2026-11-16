import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Hand, HeartHandshake, Info, Leaf, Minus, Plus, Recycle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import usePageMeta from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import Marquee from "../components/Marquee";
import { IMG } from "../config/images";
import { products } from "../data/products";
import PackSelector, { pickTarget } from "../components/PackSelector";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import ProductImage from "../components/ProductImage";
import { useCatalogVersion } from "../hooks/useCatalog";

const HERO_LINES = ["O sabor que", "transforma", "pequenos momentos."];

const IMPACT = [
    { icon: Hand, title: "Artesanal", text: "Produção cuidadosa." },
    { icon: Sparkles, title: "Qualidade", text: "Ingredientes e preparo valorizados." },
    { icon: Leaf, title: "Sustentável", text: "Menos impacto e mais responsabilidade." },
    { icon: HeartHandshake, title: "Especial", text: "Doces pensados para momentos especiais." },
];

function Hero() {
    const reduce = useReducedMotion();
    const { setOrderOpen } = useUI();

    return (
        <section className="grain relative overflow-hidden pb-16 pt-32 sm:pt-36 lg:min-h-screen lg:pb-0 lg:pt-0">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-40 top-10 h-[540px] w-[540px] rounded-full opacity-70"
                style={{ background: "radial-gradient(closest-side, rgba(244,239,230,0.9), rgba(250,247,242,0))" }}
            />
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:min-h-screen lg:grid-cols-2 lg:gap-8">
                <div className="pt-6 lg:pt-24">
                    <motion.p
                        initial={reduce ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold"
                    >
                        DoceVida — Chocolates Artesanais
                    </motion.p>

                    <h1 className="mt-6 font-serif text-[clamp(2.7rem,7.5vw,5rem)] font-medium leading-[1.04] tracking-tight text-chocolate">
                        {HERO_LINES.map((line, i) => (
                            <span key={line} className="block overflow-hidden pb-1">
                                <motion.span
                                    className={`block ${i === 2 ? "italic text-caramel" : ""}`}
                                    initial={reduce ? false : { y: "112%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.95, delay: 0.15 + i * 0.13, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {line}
                                </motion.span>
                            </span>
                        ))}
                    </h1>

                    <motion.p
                        initial={reduce ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.6 }}
                        className="mt-6 max-w-md text-base leading-relaxed text-taupe sm:text-lg"
                    >
                        Doces artesanais feitos para tornar cada momento mais especial.
                    </motion.p>

                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.72 }}
                        className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <Link
                            to="/produtos"
                            data-testid="hero-cta-produtos"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-chocolate px-8 py-4 text-sm font-semibold tracking-[0.15em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-caramel"
                        >
                            CONHECER PRODUTOS <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setOrderOpen(true)}
                            data-testid="hero-cta-pedir"
                            className="inline-flex items-center justify-center rounded-full border border-chocolate/25 px-8 py-4 text-sm font-semibold tracking-[0.15em] text-chocolate transition-all duration-300 hover:border-chocolate hover:bg-oat"
                        >
                            PEDIR AGORA
                        </button>
                    </motion.div>
                </div>

                <div className="relative pb-20 lg:pb-0">
                    <div className="relative mx-auto max-w-[520px]">
                        <motion.div
                            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden rounded-b-3xl rounded-t-[160px] border border-chocolate/10 shadow-2xl shadow-chocolate/20 sm:rounded-t-[240px]"
                            data-testid="hero-image"
                        >
                            <img
                                src={IMG.heroNinho}
                                srcSet="/images/produtos/doce-de-ninho-800.webp 800w, /images/produtos/doce-de-ninho-1200.webp 1200w"
                                sizes="(min-width: 1024px) 50vw, 100vw"
                                width={1200}
                                height={800}
                                alt="Brigadeiros de Ninho artesanais da DoceVida em forminhas marrons sobre tábua de madeira"
                                fetchPriority="high"
                                decoding="async"
                                className="h-[420px] w-full object-cover sm:h-[520px] lg:h-[600px]"
                            />
                        </motion.div>

                        <motion.div
                            className="absolute -left-4 bottom-16 rounded-2xl border border-chocolate/10 bg-cream/95 px-5 py-4 shadow-xl backdrop-blur sm:-left-10"
                            initial={reduce ? false : { opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.9 }}
                            data-testid="hero-badge"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Protagonista</p>
                            <p className="mt-1 font-serif text-lg text-chocolate">Doce de Ninho</p>
                        </motion.div>

                        <div className="absolute -bottom-8 -right-3 h-28 w-28 overflow-hidden rounded-full border-4 border-cream shadow-lg sm:-right-8 sm:h-36 sm:w-36">
                            <img
                                src={IMG.textureNinho}
                                alt="Imagem ilustrativa: textura do doce de ninho"
                                loading="lazy"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                    <p className="mt-12 text-center text-xs text-taupe">Imagem ilustrativa (arte gerada por IA). Foto oficial em breve.</p>
                </div>
            </div>
        </section>
    );
}

function Impact() {
    return (
        <section aria-labelledby="impact-title" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <h2 id="impact-title" className="sr-only">
                Por que a DoceVida é especial
            </h2>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-chocolate/10 bg-chocolate/10 sm:grid-cols-2 lg:grid-cols-4">
                {IMPACT.map((item, i) => (
                    <Reveal key={item.title} delay={i * 0.08} className="bg-cream">
                        <div className="group h-full p-8 transition-colors duration-500 hover:bg-oat" data-testid={`impact-card-${item.title.toLowerCase()}`}>
                            <item.icon size={26} strokeWidth={1.5} className="text-caramel transition-transform duration-500 group-hover:-translate-y-1" aria-hidden="true" />
                            <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-gold">0{i + 1}</p>
                            <h3 className="mt-2 font-serif text-2xl text-chocolate">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-taupe">{item.text}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

function FlagshipSection() {
    const { add } = useCart();
    const { setOrderOpen } = useUI();
    const product = products[0];
    const [qty, setQty] = useState(1);
    const [pack, setPack] = useState("un");
    const target = pickTarget(product, pack);

    return (
        <section aria-labelledby="flagship-title" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-14">
            <Reveal>
                <div className="grid items-center gap-10 rounded-[2.5rem] bg-oat p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-16">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => openProduct(product)}
                            data-testid="flagship-image-btn"
                            aria-label="Ver detalhes do Doce de Ninho"
                            className="block w-full overflow-hidden rounded-3xl"
                        >
                            <ProductImage product={product} sizes="(min-width: 1024px) 560px, 100vw" className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
                        </button>
                        <span className="absolute left-4 top-4 rounded-full bg-chocolate/85 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur">
                            Queridinho do público
                        </span>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Um dos queridinhos</p>
                        <h2 id="flagship-title" className="mt-4 font-serif text-4xl text-chocolate sm:text-5xl" data-testid="flagship-title-text">
                            {product.name}
                        </h2>
                        <p className="mt-4 leading-relaxed text-taupe">{product.description}</p>

                        <ul className="mt-6 space-y-2.5">
                            {["Sabor marcante do leite em pó", "Textura cremosa de ponto artesanal", "Embalagem individual"].map((c) => (
                                <li key={c} className="flex items-center gap-3 text-sm text-chocolate/85">
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-moss-light text-moss">
                                        <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                                    </span>
                                    {c}
                                </li>
                            ))}
                        </ul>

                        <p className="pending-chip mt-6" data-testid="flagship-ingredients-pending">
                            <Info size={13} aria-hidden="true" /> Ingredientes em atualização
                        </p>

                        <div className="mt-6">
                            <PackSelector product={product} value={pack} onChange={setPack} />
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                            <p className="font-serif text-2xl text-chocolate" data-testid="flagship-price">
                                Preço sob consulta
                            </p>
                            <p className="inline-flex items-center gap-2 rounded-full bg-moss-light px-3.5 py-1.5 text-xs font-semibold text-moss" data-testid="flagship-availability">
                                <span className="h-2 w-2 rounded-full bg-moss" aria-hidden="true" /> Disponível
                            </p>
                        </div>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center rounded-full border border-chocolate/15 bg-cream">
                                <button
                                    type="button"
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    data-testid="flagship-qty-dec"
                                    aria-label="Diminuir quantidade"
                                    className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-oat"
                                >
                                    <Minus size={15} />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold" data-testid="flagship-qty">
                                    {qty}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQty((q) => q + 1)}
                                    data-testid="flagship-qty-inc"
                                    aria-label="Aumentar quantidade"
                                    className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-oat"
                                >
                                    <Plus size={15} />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    add(target.id, qty);
                                    toast.success(`${target.name} adicionado ao carrinho`);
                                }}
                                data-testid="flagship-add-btn"
                                className="inline-flex flex-1 items-center justify-center rounded-full bg-chocolate px-7 py-4 text-sm font-semibold tracking-[0.15em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-caramel"
                            >
                                ADICIONAR AO CARRINHO
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    add(target.id, qty);
                                    setOrderOpen(true);
                                }}
                                data-testid="flagship-whatsapp-btn"
                                className="inline-flex flex-1 items-center justify-center rounded-full border border-chocolate/25 px-7 py-4 text-sm font-semibold tracking-[0.15em] text-chocolate transition-colors hover:border-chocolate hover:bg-oat"
                            >
                                PEDIR PELO WHATSAPP
                            </button>
                        </div>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

function StoryTeaser() {
    return (
        <section aria-labelledby="story-teaser-title" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
                <div className="relative">
                    <Reveal>
                        <img
                            src={IMG.handsArtisan}
                            alt="Imagem ilustrativa: mãos preparando doces"
                            loading="lazy"
                            className="aspect-[4/3] w-full rounded-3xl object-cover"
                        />
                    </Reveal>
                    <Reveal delay={0.15} className="absolute -bottom-10 -right-2 hidden w-52 sm:block lg:-right-6">
                        <img
                            src={IMG.ingredientsFlatlay}
                            alt="Imagem ilustrativa: ingredientes sobre a mesa"
                            loading="lazy"
                            className="aspect-square w-full rounded-3xl border-4 border-cream object-cover shadow-xl"
                        />
                    </Reveal>
                </div>
                <Reveal delay={0.1}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Nossa história</p>
                    <h2 id="story-teaser-title" className="mt-4 font-serif text-4xl leading-tight text-chocolate sm:text-5xl">
                        Mais que doces. <em className="italic text-caramel">Histórias feitas à mão.</em>
                    </h2>
                    <p className="mt-5 leading-relaxed text-taupe">
                        Cada doce da DoceVida carrega cuidado em cada etapa — da escolha dos ingredientes ao ponto perfeito da
                        receita, tudo é feito à mão, com sabor e qualidade que você sente na primeira colherada.
                    </p>
                    <Link
                        to="/historia"
                        data-testid="story-teaser-link"
                        className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold tracking-[0.15em] text-chocolate"
                    >
                        CONHEÇA NOSSA HISTÓRIA
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}

function SustainabilityTeaser() {
    return (
        <section aria-labelledby="sust-teaser-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
            <Reveal>
                <div className="grid items-center gap-10 rounded-[2.5rem] bg-moss p-8 text-cream lg:grid-cols-2 lg:gap-14 lg:p-16">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold-soft">Sustentabilidade</p>
                        <h2 id="sust-teaser-title" className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                            Doce para você. Cuidado com o futuro.
                        </h2>
                        <ul className="mt-7 space-y-4">
                            {[
                                { icon: Leaf, label: "Embalagens responsáveis", text: "Forminhas e embalagens biodegradáveis." },
                                { icon: HeartHandshake, label: "Fornecedores locais", text: "Insumos locais e parcerias com pequenos produtores." },
                                { icon: Recycle, label: "Menos desperdício", text: "Receita otimizada e menos desperdício na produção." },
                            ].map((item) => (
                                <li key={item.label} className="flex items-start gap-4">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream/10 text-gold-soft">
                                        <item.icon size={18} strokeWidth={1.8} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="font-serif text-lg">{item.label}</p>
                                        <p className="text-sm text-cream/70">{item.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-cream/30 px-3.5 py-1.5 text-xs font-semibold tracking-[0.15em]">ODS 2</span>
                            <span className="rounded-full border border-cream/30 px-3.5 py-1.5 text-xs font-semibold tracking-[0.15em]">ODS 12</span>
                            <span className="rounded-full border border-cream/30 px-3.5 py-1.5 text-xs font-semibold tracking-[0.15em]">ODS 8</span>
                            <span className="rounded-full border border-cream/30 px-3.5 py-1.5 text-xs font-semibold tracking-[0.15em]">ODS 15</span>
                        </div>
                        <Link
                            to="/sustentabilidade"
                            data-testid="sust-teaser-link"
                            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-[0.15em] text-gold-soft"
                        >
                            CONHEÇA NOSSAS AÇÕES
                            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                    </div>
                    <img
                        src={IMG.sustainabilityNature}
                        alt="Imagem ilustrativa: doces em forminhas com folhas"
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-3xl object-cover"
                    />
                </div>
            </Reveal>
        </section>
    );
}

function QualityTeaser() {
    return (
        <section aria-labelledby="quality-teaser-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
            <Reveal>
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Qualidade</p>
                        <h2 id="quality-teaser-title" className="mt-4 font-serif text-4xl text-chocolate sm:text-5xl">
                            Qualidade em cada detalhe
                        </h2>
                    </div>
                    <Link to="/qualidade" data-testid="quality-teaser-link" className="group inline-flex items-center gap-2 text-sm font-semibold tracking-[0.15em] text-chocolate">
                        VER TODOS OS PILARES
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                </div>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
                {[
                    { title: "Enrolado à mão", text: "Nada de máquina: cada bombom é feito no capricho, com carinho." },
                    { title: "Ingredientes orgânicos", text: "80% de ingredientes orgânicos e sustentáveis, com 50% menos plástico." },
                    { title: "Para todos os gostos", text: "Opções zero açúcar e proteicas, de brigadeiros a muffins." },
                ].map((pillar, i) => (
                    <Reveal key={pillar.title} delay={i * 0.08}>
                        <div className="h-full rounded-3xl border border-chocolate/10 bg-cream p-8 transition-colors duration-500 hover:bg-oat" data-testid={`quality-pillar-${i}`}>
                            <p className="font-serif text-xl text-chocolate">{pillar.title}</p>
                            <p className="mt-2 text-sm leading-relaxed text-taupe">{pillar.text}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

function FeedbackSection() {
    return (
        <section aria-labelledby="feedback-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
            <Reveal>
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Feedback</p>
                    <h2 id="feedback-title" className="mt-4 font-serif text-4xl text-chocolate sm:text-5xl">
                        Quem experimenta, recomenda.
                    </h2>
                </div>
            </Reveal>
            <Reveal delay={0.2}>
                <div
                    className="mx-auto mt-6 max-w-3xl rounded-3xl border border-dashed border-gold/50 bg-gold/5 p-8 text-center"
                    data-testid="feedback-empty-state"
                >
                    <p className="font-serif text-xl text-chocolate">As primeiras avaliações reais serão publicadas aqui.</p>
                    <p className="mt-2 text-sm text-taupe">Espaço preparado para os clientes da DoceVida — nome, estrelas, comentário e produto.</p>
                </div>
            </Reveal>
        </section>
    );
}

function MenuTeaser() {
    return (
        <section aria-labelledby="menu-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
            <Reveal>
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Cardápio</p>
                    <h2 id="menu-title" className="mt-4 font-serif text-4xl text-chocolate sm:text-5xl">Do brigadeiro ao muffin</h2>
                    <p className="mt-4 text-taupe">Nada de máquina: é tudo no capricho, feito com carinho.</p>
                </div>
            </Reveal>
            <Reveal delay={0.1}>
                <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3" data-testid="menu-chips">
                    {products.map((p) => (
                        <li key={p.id}>
                            <Link to="/produtos" className="inline-flex rounded-full border border-chocolate/15 bg-cream px-5 py-2.5 text-sm text-chocolate transition-colors hover:bg-oat">
                                {p.name}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="mt-8 text-center">
                    <Link to="/produtos" className="inline-flex rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel">
                        VER CARDÁPIO COMPLETO
                    </Link>
                </div>
            </Reveal>
        </section>
    );
}

function DonationTeaser() {
    return (
        <section aria-labelledby="donation-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
            <Reveal>
                <div className="rounded-[2.5rem] bg-oat p-8 text-center sm:p-14">
                    <HeartHandshake size={30} strokeWidth={1.5} className="mx-auto text-caramel" aria-hidden="true" />
                    <h2 id="donation-title" className="mx-auto mt-5 max-w-2xl font-serif text-4xl leading-tight text-chocolate sm:text-5xl">
                        Chocolate que adoça e transforma
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-taupe">
                        A cada compra, parte do valor vira doação para ONGs parceiras da nossa região. Você compra, a gente doa, o amor se multiplica.
                    </p>
                    <Link to="/doacoes" data-testid="donation-teaser-link" className="mt-8 inline-flex rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel">
                        CONHEÇA O CICLO DO BEM
                    </Link>
                </div>
            </Reveal>
        </section>
    );
}

function ContactBanner() {
    return (
        <section aria-labelledby="contact-banner-title" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
            <Reveal>
                <div className="grain rounded-[2.5rem] bg-chocolate px-6 py-16 text-center text-cream sm:px-12 lg:py-20">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Contato</p>
                    <h2 id="contact-banner-title" className="mx-auto mt-5 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
                        Vamos conversar?
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-cream/70">Escolha o canal e transforme seu momento em doce.</p>
                    <Link
                        to="/contato"
                        data-testid="home-contact-cta"
                        className="mt-9 inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-semibold tracking-[0.15em] text-cocoa transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream"
                    >
                        FALE COM A DOCEVIDA
                    </Link>
                </div>
            </Reveal>
        </section>
    );
}

export default function Home() {
    useCatalogVersion();
    usePageMeta({
        title: "DoceVida — Chocolates Artesanais",
        description: "O sabor que transforma pequenos momentos. Doces artesanais feitos para tornar cada momento mais especial.",
    });

    return (
        <>
            <Hero />
            <Marquee items={["Feito à mão", "Brigadeiros", "Brownie proteico", "Muffins", "Zero açúcar", "Biscoitos", "Com carinho", "Sustentável"]} />
            <Impact />
            <FlagshipSection />
            <StoryTeaser />
            <SustainabilityTeaser />
            <QualityTeaser />
            <FeedbackSection />
            <MenuTeaser />
            <DonationTeaser />
            <ContactBanner />
        </>
    );
}
