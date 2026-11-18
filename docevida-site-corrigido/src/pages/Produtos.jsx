import { useState } from "react";
import { motion } from "framer-motion";
import usePageMeta from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import ProductCard from "../components/ProductCard";
import { IMG } from "../config/images";
import { products, upcomingProducts, packages } from "../data/products";
import PackageCard from "../components/PackageCard";
import { useCatalogVersion } from "../hooks/useCatalog";

const FILTERS = [
    { id: "todos", label: "Todos" },
    { id: "novidades", label: "Novidades" },
    { id: "zero-acucar", label: "Zero açúcar" },
    { id: "proteico", label: "Proteicos" },
];

export default function Produtos() {
    useCatalogVersion();
    usePageMeta({
        title: "Produtos — DoceVida",
        description: "Cardápio DoceVida: brigadeiros, biscoitos, brownie, muffins e cookies, todos feitos com carinho.",
    });

    const [filter, setFilter] = useState("todos");
    const TAG = { "zero-acucar": "Zero açúcar", proteico: "Proteico" };
    const available =
        filter === "todos"
            ? products
            : filter === "novidades"
              ? products.filter((p) => p.isNew)
              : products.filter((p) => p.tags?.includes(TAG[filter]));
    const upcoming = filter === "todos" || filter === "novidades" ? upcomingProducts : [];

    return (
        <div className="pt-32 sm:pt-36">
            <header className="mx-auto max-w-7xl px-5 sm:px-8">
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold"
                >
                    Catálogo
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 }}
                    className="mt-4 font-serif text-5xl text-chocolate sm:text-6xl"
                    data-testid="produtos-title"
                >
                    Feitos para <em className="italic text-caramel">você</em>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.16 }}
                    className="mt-4 max-w-xl leading-relaxed text-taupe"
                >
                    Brigadeiros, biscoitos, brownie, muffins e cookies — nada de máquina, tudo no capricho e feito com carinho.
                </motion.p>

                <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar produtos" data-testid="produtos-filters">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFilter(f.id)}
                            data-testid={`filter-chip-${f.id}`}
                            aria-pressed={filter === f.id}
                            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                                filter === f.id
                                    ? "border-chocolate bg-chocolate text-cream"
                                    : "border-chocolate/20 text-taupe hover:border-chocolate hover:text-chocolate"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </header>

            {filter === "todos" && (
                <section aria-labelledby="caixas-title" className="mx-auto max-w-7xl px-5 pt-12 sm:px-8" data-testid="caixas-section">
                    <h2 id="caixas-title" className="font-serif text-3xl text-chocolate sm:text-4xl">Caixas e bolos</h2>
                    <p className="mt-2 max-w-xl text-taupe">Escolha o tamanho e adicione ao carrinho. Informe os sabores que você quer nas observações do pedido.</p>
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {packages.map((pkg) => (
                            <PackageCard key={pkg.id} pkg={pkg} />
                        ))}
                    </div>
                </section>
            )}

            <section aria-label="Lista de produtos" className="mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-8 lg:pb-32">
                {filter === "todos" && (
                    <div className="mb-8">
                        <h2 className="font-serif text-3xl text-chocolate sm:text-4xl">Nossos sabores</h2>
                        <p className="mt-2 max-w-xl text-taupe">Os sabores são vendidos nas caixas acima. Informe os que você quer nas observações do pedido.</p>
                    </div>
                )}
                {available.length === 0 && upcoming.length === 0 ? (
                    <p className="py-16 text-center text-taupe">Nenhum produto nesta categoria ainda — novos sabores chegam em breve.</p>
                ) : (
                    <>
                        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" data-testid="produtos-grid">
                            {available.map((p, i) => (
                                <Reveal key={p.id} delay={i * 0.06}>
                                    <ProductCard product={p} />
                                </Reveal>
                            ))}
                        </div>

                        {upcoming.length > 0 && (
                            <div className="mt-16">
                                <Reveal>
                                    <h2 className="font-serif text-3xl text-chocolate sm:text-4xl">Vem coisa boa por aí...</h2>
                                    <p className="mt-2 text-sm text-taupe">Próximas variações previstas no projeto — não disponíveis para compra.</p>
                                </Reveal>
                                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {upcoming.map((p, i) => (
                                        <Reveal key={p.id} delay={i * 0.06}>
                                            <article className="overflow-hidden rounded-3xl border border-chocolate/10 bg-cream" data-testid={`upcoming-card-${p.id}`}>
                                                <div className="relative aspect-[4/3] overflow-hidden bg-oat">
                                                    <img
                                                        src={p.image}
                                                        alt={`Prévia de direção de arte: ${p.name}`}
                                                        loading="lazy"
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <span className="absolute left-4 top-4 rounded-full bg-cocoa/85 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur">
                                                        EM DESENVOLVIMENTO
                                                    </span>
                                                </div>
                                                <div className="p-6">
                                                    <h3 className="font-serif text-xl text-chocolate">{p.name}</h3>
                                                    <p className="mt-1.5 text-sm text-taupe">{p.description}</p>
                                                    <button
                                                        type="button"
                                                        disabled
                                                        aria-disabled="true"
                                                        data-testid={`upcoming-btn-${p.id}`}
                                                        className="mt-4 w-full cursor-not-allowed rounded-full bg-chocolate/10 py-3 text-xs font-semibold tracking-[0.2em] text-chocolate/50"
                                                    >
                                                        DISPONÍVEL EM BREVE
                                                    </button>
                                                </div>
                                            </article>
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            <p className="mx-auto max-w-7xl px-5 pb-10 text-center text-xs text-taupe sm:px-8">Fotos oficiais dos produtos em breve. Preços sob consulta.</p>

            <section aria-hidden="true" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
                <Reveal>
                    <img
                        src={IMG.textureNinho}
                        alt=""
                        loading="lazy"
                        className="aspect-[21/9] w-full rounded-3xl object-cover opacity-90"
                    />
                </Reveal>
            </section>
        </div>
    );
}
