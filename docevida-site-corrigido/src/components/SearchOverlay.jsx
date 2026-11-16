import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useUI } from "../context/UIContext";
import { allCatalogItems, priceLabel } from "../data/products";
import { useCatalogVersion } from "../hooks/useCatalog";
import ProductImage from "./ProductImage";

export default function SearchOverlay() {
    useCatalogVersion();
    const { searchOpen, setSearchOpen, openProduct } = useUI();
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (searchOpen) {
            setQuery("");
            const t = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [searchOpen]);

    useEffect(() => {
        if (!searchOpen) return undefined;
        const onKey = (e) => e.key === "Escape" && setSearchOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [searchOpen, setSearchOpen]);

    const q = query.trim().toLowerCase();
    const results = q
        ? allCatalogItems.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q))
        : allCatalogItems;

    const pick = (p) => {
        setSearchOpen(false);
        openProduct(p);
    };

    return (
        <AnimatePresence>
            {searchOpen && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Pesquisar produtos"
                    data-testid="search-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[85] flex flex-col bg-cream"
                >
                    <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 pt-28 sm:px-8">
                        <Search size={24} className="shrink-0 text-gold" aria-hidden="true" />
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar doces..."
                            data-testid="search-input"
                            aria-label="Buscar doces"
                            className="w-full border-b border-chocolate/15 bg-transparent pb-4 font-serif text-2xl text-chocolate placeholder:text-taupe/50 focus:border-gold focus:outline-none sm:text-3xl"
                        />
                        <button
                            type="button"
                            onClick={() => setSearchOpen(false)}
                            data-testid="search-close-btn"
                            aria-label="Fechar pesquisa"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <div className="mx-auto w-full max-w-3xl overflow-y-auto px-5 py-8 sm:px-8" data-testid="search-results">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                            {q ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}` : "Explore o catálogo"}
                        </p>
                        <ul className="mt-4 space-y-2">
                            {results.map((p) => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => pick(p)}
                                        data-testid={`search-result-${p.id}`}
                                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-oat"
                                    >
                                        <ProductImage product={p} sizes="80px" className="h-14 w-16 rounded-xl object-cover" />
                                        <span className="flex-1">
                                            <span className="block font-serif text-lg text-chocolate">{p.name}</span>
                                            <span className="block text-xs text-taupe">{p.description}</span>
                                        </span>
                                        {!p.available ? (
                                            <span className="pending-chip shrink-0">Em desenvolvimento</span>
                                        ) : (
                                            <span className="shrink-0 text-sm font-semibold text-caramel">{priceLabel(p)}</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {q && results.length === 0 && (
                            <div className="py-10 text-center" data-testid="search-empty-state">
                                <p className="font-serif text-xl text-chocolate">Nenhum doce encontrado para “{query}”.</p>
                                <p className="mt-2 text-sm text-taupe">Tente buscar por “Ninho”.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
