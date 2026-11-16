import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Candy, Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { formatPrice, priceLabel } from "../data/products";
import ProductImage from "./ProductImage";
import { useCatalogVersion } from "../hooks/useCatalog";

export default function CartDrawer() {
    useCatalogVersion();
    const { cartOpen, setCartOpen, setOrderOpen } = useUI();
    const { items, setQty, remove, count, subtotal, hasPrices } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        if (!cartOpen) return undefined;
        const onKey = (e) => e.key === "Escape" && setCartOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [cartOpen, setCartOpen]);

    return (
        <AnimatePresence>
            {cartOpen && (
                <div className="fixed inset-0 z-[80]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setCartOpen(false)}
                        className="absolute inset-0 bg-cocoa/70 backdrop-blur-sm"
                        data-testid="cart-backdrop"
                    />
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label="Carrinho de compras"
                        data-testid="cart-drawer"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream h-[100dvh] shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-chocolate/10 px-6 py-5">
                            <h2 className="font-serif text-2xl text-chocolate">
                                Seu carrinho
                                {count > 0 && <span className="ml-2 text-sm text-taupe">({count} {count === 1 ? "item" : "itens"})</span>}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setCartOpen(false)}
                                data-testid="cart-close-btn"
                                aria-label="Fechar carrinho"
                                className="grid h-11 w-11 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center" data-testid="cart-empty-state">
                                <span className="grid h-16 w-16 place-items-center rounded-full bg-oat text-caramel">
                                    <Candy size={28} strokeWidth={1.5} />
                                </span>
                                <p className="font-serif text-2xl text-chocolate">Seu carrinho está vazio</p>
                                <p className="text-sm text-taupe">Que tal adoçar o seu dia? Escolha um doce e volte aqui.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCartOpen(false);
                                        navigate("/produtos");
                                    }}
                                    data-testid="cart-empty-cta"
                                    className="mt-2 rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel"
                                >
                                    CONHECER PRODUTOS
                                </button>
                            </div>
                        ) : (
                            <>
                                <ul className="flex-1 space-y-5 overflow-y-auto px-6 py-6" data-lenis-prevent data-testid="cart-items">
                                    {items.map((item) => (
                                        <li key={item.id} className="flex gap-4" data-testid={`cart-item-${item.id}`}>
                                            <ProductImage
                                                product={item}
                                                sizes="96px"
                                                className="h-20 w-24 shrink-0 rounded-2xl object-cover"
                                            />
                                            <div className="flex flex-1 flex-col">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-serif text-lg leading-tight text-chocolate">{item.name}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(item.id)}
                                                        data-testid={`cart-remove-${item.id}-btn`}
                                                        aria-label={`Remover ${item.name} do carrinho`}
                                                        className="grid h-9 w-9 place-items-center rounded-full text-taupe transition-colors hover:bg-oat hover:text-caramel"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-taupe">{priceLabel(item)} por unidade</p>
                                                <div className="mt-auto flex items-center justify-between pt-2">
                                                    <div className="flex items-center rounded-full border border-chocolate/15">
                                                        <button
                                                            type="button"
                                                            onClick={() => setQty(item.id, item.qty - 1)}
                                                            data-testid={`cart-dec-${item.id}-btn`}
                                                            aria-label={`Diminuir quantidade de ${item.name}`}
                                                            className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-oat"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-semibold" data-testid={`cart-qty-${item.id}`} aria-live="polite">
                                                            {item.qty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQty(item.id, item.qty + 1)}
                                                            data-testid={`cart-inc-${item.id}-btn`}
                                                            aria-label={`Aumentar quantidade de ${item.name}`}
                                                            className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-oat"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    {item.price != null && (
                                                        <p className="text-sm font-semibold text-caramel">{formatPrice(item.price * item.qty)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-chocolate/10 px-6 py-6">
                                    <div className="flex items-center justify-between text-sm text-taupe">
                                        <span>Subtotal</span>
                                        <span data-testid="cart-subtotal">{hasPrices ? formatPrice(subtotal) : "—"}</span>
                                    </div>
                                    <div className="mt-2 flex items-baseline justify-between">
                                        <span className="font-serif text-xl text-chocolate">Total</span>
                                        <span className="font-serif text-2xl text-chocolate" data-testid="cart-total">
                                            {hasPrices ? formatPrice(subtotal) : "Valores sob consulta"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-taupe" data-testid="cart-total-note">
                                        Os valores são confirmados no atendimento do pedido.
                                    </p>
                                    <div className="mt-5 flex flex-col gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCartOpen(false);
                                                setOrderOpen(true);
                                            }}
                                            data-testid="cart-checkout-btn"
                                            className="w-full rounded-full bg-chocolate py-4 text-sm font-semibold tracking-[0.15em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-caramel"
                                        >
                                            FINALIZAR PEDIDO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCartOpen(false)}
                                            data-testid="cart-continue-btn"
                                            className="w-full rounded-full border border-chocolate/25 py-4 text-sm font-semibold tracking-[0.15em] text-chocolate transition-colors hover:border-chocolate hover:bg-oat"
                                        >
                                            CONTINUAR COMPRANDO
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}
