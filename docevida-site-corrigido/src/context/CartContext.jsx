import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { findProduct } from "../data/products";
import { useCatalogVersion } from "../hooks/useCatalog";

const CartContext = createContext(null);

const STORAGE_KEY = "docevida_cart_v1";
export const MAX_QTY = 99;

// Quantidade sempre inteira entre 1 e MAX_QTY.
const clampQty = (n) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(n)) || 1));

export function CartProvider({ children }) {
    const catalogVersion = useCatalogVersion();
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed)
                ? parsed
                      .filter((i) => i && findProduct(i.id)?.available)
                      .map((i) => ({ id: i.id, qty: clampQty(i.qty) }))
                : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            /* armazenamento indisponível (modo privado/cheio): o carrinho segue funcionando em memória */
        }
    }, [items]);

    // Produtos indisponíveis ou inexistentes não entram no carrinho.
    const add = (id, qty = 1) => {
        if (!findProduct(id)?.available) return;
        setItems((prev) => {
            const existing = prev.find((i) => i.id === id);
            if (existing)
                return prev.map((i) => (i.id === id ? { ...i, qty: clampQty(i.qty + qty) } : i));
            return [...prev, { id, qty: clampQty(qty) }];
        });
    };

    const setQty = (id, qty) =>
        setItems((prev) =>
            qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty: clampQty(qty) } : i))
        );

    const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
    const clear = () => setItems([]);

    const detailed = useMemo(
        () =>
            items
                .map((i) => {
                    const product = findProduct(i.id);
                    return product?.available ? { ...product, qty: i.qty } : null;
                })
                .filter(Boolean),
        [items, catalogVersion]
    );

    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = detailed.reduce((sum, p) => sum + (p.price != null ? p.price * p.qty : 0), 0);
    const hasPrices = detailed.some((p) => p.price != null);

    const value = useMemo(
        () => ({ items: detailed, add, setQty, remove, clear, count, subtotal, hasPrices }),
        [detailed, count, subtotal, hasPrices]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
