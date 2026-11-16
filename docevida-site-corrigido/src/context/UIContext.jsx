import { createContext, useContext, useEffect, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [orderOpen, setOrderOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);

    const anyOverlay = cartOpen || searchOpen || orderOpen || Boolean(activeProduct);

    useEffect(() => {
        document.body.style.overflow = anyOverlay ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [anyOverlay]);

    const value = {
        cartOpen,
        setCartOpen,
        searchOpen,
        setSearchOpen,
        orderOpen,
        setOrderOpen,
        activeProduct,
        openProduct: (product) => setActiveProduct(product),
        closeProduct: () => setActiveProduct(null),
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);
