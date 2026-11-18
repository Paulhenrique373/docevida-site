import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { useUI } from "../context/UIContext";
import { useCatalogVersion } from "../hooks/useCatalog";
import ProductImage from "./ProductImage";

export default function ProductModal() {
    useCatalogVersion();
    const { activeProduct, closeProduct } = useUI();
    const closeRef = useRef(null);
    const product = activeProduct;

    useEffect(() => {
        if (product) closeRef.current?.focus();
    }, [product]);

    useEffect(() => {
        if (!product) return undefined;
        const onKey = (e) => e.key === "Escape" && closeProduct();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [product, closeProduct]);

    return (
        <AnimatePresence>
            {product && (
                <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={closeProduct}
                        className="absolute inset-0 bg-cocoa/70 backdrop-blur-sm"
                        data-testid="product-modal-backdrop"
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Detalhes do produto: ${product.name}`}
                        data-testid="product-modal"
                        initial={{ opacity: 0, y: 48, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 32, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="relative grid max-h-[92dvh] w-full max-w-4xl grid-rows-[auto_1fr] overflow-hidden rounded-t-3xl bg-cream shadow-2xl md:grid-cols-2 md:grid-rows-1 md:rounded-3xl"
                    >
                        <div className="relative aspect-[3/2] max-h-[40vh] bg-oat md:aspect-auto md:max-h-none md:h-full md:min-h-[540px]">
                            <ProductImage
                                product={product}
                                priority
                                sizes="(min-width: 768px) 50vw, 100vw"
                                className="h-full w-full object-cover"
                            />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-chocolate/75 px-3 py-1 text-[10px] font-medium tracking-wide text-cream backdrop-blur">Imagem ilustrativa</span>
                        </div>

                        <div className="overflow-y-auto p-6 sm:p-9" data-lenis-prevent>
                            <button
                                type="button"
                                ref={closeRef}
                                onClick={closeProduct}
                                data-testid="product-modal-close-btn"
                                aria-label="Fechar detalhes do produto"
                                className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-cream/90 text-chocolate shadow-sm transition-colors hover:bg-oat"
                            >
                                <X size={20} />
                            </button>

                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                                Chocolates Artesanais
                            </p>
                            <h2 className="mt-2 font-serif text-3xl text-chocolate sm:text-4xl" data-testid="product-modal-name">
                                {product.name}
                            </h2>
                            <p className="mt-3 leading-relaxed text-taupe">{product.description}</p>

                            <div className="mt-5">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-chocolate/70">Ingredientes</h3>
                                {product.ingredients?.length ? (
                                    <ul className="mt-2 flex flex-wrap gap-2">
                                        {product.ingredients.map((ing) => (
                                            <li key={ing} className="rounded-full bg-oat px-3 py-1 text-xs text-chocolate/80">
                                                {ing}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="pending-chip mt-2" data-testid="product-modal-ingredients-pending">
                                        <Info size={13} aria-hidden="true" /> Ingredientes em atualização
                                    </p>
                                )}
                            </div>

                            <p className="mt-6 text-sm leading-relaxed text-taupe" data-testid="product-modal-boxes-note">
                                Este sabor é vendido nas caixas. Escolha o tamanho da caixa e informe o sabor que você quer nas observações do pedido.
                            </p>
                            <Link
                                to="/produtos"
                                onClick={closeProduct}
                                data-testid="product-modal-boxes-link"
                                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-chocolate py-4 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel"
                            >
                                VER CAIXAS E BOLOS
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
