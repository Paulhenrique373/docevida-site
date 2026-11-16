import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { formatPrice, priceLabel } from "../data/products";
import PackSelector, { pickTarget } from "./PackSelector";
import { useCatalogVersion } from "../hooks/useCatalog";
import { isWhatsAppConfigured, whatsappUrl } from "../config/site";
import { MAX_QTY } from "../context/CartContext";
import { buildOrderMessage } from "../utils/orderMessage";
import ProductImage from "./ProductImage";

export default function ProductModal() {
    useCatalogVersion();
    const { activeProduct, closeProduct, setOrderOpen } = useUI();
    const { add } = useCart();
    const [qty, setQty] = useState(1);
    const [pack, setPack] = useState("un");
    const closeRef = useRef(null);
    const product = activeProduct;
    const target = product ? pickTarget(product, pack) : null;
    const unavailable = target ? !target.available : false;

    useEffect(() => {
        setQty(1);
        setPack("un");
        if (product) closeRef.current?.focus();
    }, [product]);

    useEffect(() => {
        if (!product) return undefined;
        const onKey = (e) => e.key === "Escape" && closeProduct();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [product, closeProduct]);

    const handleAdd = () => {
        add(target.id, qty);
        toast.success(`${target.name} adicionado ao carrinho`);
        closeProduct();
    };

    const handleWhatsApp = () => {
        add(target.id, qty);
        closeProduct();
        setOrderOpen(true);
    };

    const message = product
        ? buildOrderMessage({
              items: [{ ...target, qty }],
              hasPrices: target.price != null,
              subtotal: target.price != null ? target.price * qty : 0,
              nome: "",
              obs: "",
              formatPrice,
          })
        : "";

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

                            <div className="mt-6">
                                <PackSelector product={product} value={pack} onChange={setPack} />
                            </div>

                            <div className="mt-6 flex flex-wrap items-end justify-between gap-4" data-testid="product-modal-price">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-chocolate/70">Preço</p>
                                    <p className="mt-1 font-serif text-2xl text-chocolate">{priceLabel(target)}</p>
                                    {target.price == null && <p className="text-xs text-taupe">valor em definição</p>}
                                </div>
                                <p className="inline-flex items-center gap-2 rounded-full bg-moss-light px-3.5 py-1.5 text-xs font-semibold text-moss">
                                    <span className={`h-2 w-2 rounded-full ${unavailable ? "bg-chocolate/30" : "bg-moss"}`} aria-hidden="true" />
                                    {unavailable ? "Indisponível no momento" : "Disponível"}
                                </p>
                            </div>

                            {unavailable ? (
                                <button
                                    type="button"
                                    disabled
                                    data-testid="product-modal-unavailable-btn"
                                    className="mt-7 w-full cursor-not-allowed rounded-full bg-chocolate/10 py-4 text-sm font-semibold tracking-[0.15em] text-chocolate/50"
                                >
                                    INDISPONÍVEL NO MOMENTO
                                </button>
                            ) : (
                                <>
                                    <div className="mt-7 flex items-center gap-4">
                                        <div className="flex items-center rounded-full border border-chocolate/15">
                                            <button
                                                type="button"
                                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                                data-testid="product-modal-qty-dec"
                                                aria-label="Diminuir quantidade"
                                                className="grid h-11 w-11 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-semibold" data-testid="product-modal-qty" aria-live="polite">
                                                {qty}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                                                data-testid="product-modal-qty-inc"
                                                aria-label="Aumentar quantidade"
                                                className="grid h-11 w-11 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-taupe">Quantidade</p>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3">
                                        <button
                                            type="button"
                                            onClick={handleAdd}
                                            data-testid="product-modal-add-btn"
                                            className="w-full rounded-full bg-chocolate py-4 text-sm font-semibold tracking-[0.15em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-caramel"
                                        >
                                            ADICIONAR AO CARRINHO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleWhatsApp}
                                            data-testid="product-modal-whatsapp-btn"
                                            className="w-full rounded-full border border-chocolate/25 py-4 text-sm font-semibold tracking-[0.15em] text-chocolate transition-colors hover:border-chocolate hover:bg-oat"
                                        >
                                            PEDIR PELO WHATSAPP
                                        </button>
                                        {isWhatsAppConfigured() && (
                                            <a
                                                href={whatsappUrl(message)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-center text-xs text-taupe underline underline-offset-4"
                                            >
                                                Enviar direto pelo WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
