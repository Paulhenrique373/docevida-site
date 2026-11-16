import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Logo from "./Logo";
import { NAV_LINKS } from "../config/site";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";

const slug = (label) => label.toLowerCase().replace(/\s+/g, "-");

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { count } = useCart();
    const { setCartOpen, setSearchOpen, setOrderOpen } = useUI();
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    const solid = scrolled || menuOpen;

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
                    solid
                        ? "border-b border-chocolate/10 bg-cream/90 backdrop-blur-md"
                        : "border-b border-transparent bg-transparent"
                }`}
            >
                <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 min-[400px]:px-5 sm:px-8">
                    <Link to="/" data-testid="logo-link" aria-label="DoceVida — início" className="shrink-0">
                        <Logo navbar />
                    </Link>

                    <nav aria-label="Navegação principal" className="hidden items-center gap-7 xl:flex">
                        {NAV_LINKS.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                data-testid={`nav-link-${slug(link.label)}`}
                                className={({ isActive }) =>
                                    `relative py-2 text-sm font-medium tracking-wide transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                                        isActive ? "text-chocolate after:scale-x-100" : "text-taupe hover:text-chocolate"
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-1 min-[400px]:gap-1.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setSearchOpen(true)}
                            data-testid="search-open-btn"
                            aria-label="Pesquisar"
                            className="grid h-10 w-10 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat min-[360px]:h-11 min-[360px]:w-11"
                        >
                            <Search size={20} strokeWidth={1.8} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setCartOpen(true)}
                            data-testid="cart-open-btn"
                            aria-label={`Abrir carrinho${count ? `, ${count} itens` : ""}`}
                            className="relative grid h-10 w-10 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat min-[360px]:h-11 min-[360px]:w-11"
                        >
                            <ShoppingBag size={20} strokeWidth={1.8} />
                            {count > 0 && (
                                <span
                                    data-testid="cart-badge"
                                    className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-caramel px-1 text-[10px] font-bold text-cream"
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderOpen(true)}
                            data-testid="pedir-agora-btn"
                            className="hidden rounded-full bg-chocolate px-5 py-2.5 text-sm font-semibold tracking-wide text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-caramel sm:inline-flex"
                        >
                            Pedir agora
                        </button>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((v) => !v)}
                            data-testid="mobile-menu-btn"
                            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                            aria-expanded={menuOpen}
                            className="grid h-10 w-10 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat min-[360px]:h-11 min-[360px]:w-11 xl:hidden"
                        >
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        data-testid="mobile-nav"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-40 flex flex-col bg-cream px-6 pt-28 pb-8 xl:hidden"
                    >
                        <nav aria-label="Menu mobile" className="flex flex-1 flex-col">
                            {NAV_LINKS.map((link, i) => (
                                <motion.div
                                    key={link.to}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <NavLink
                                        to={link.to}
                                        data-testid={`mobile-nav-link-${slug(link.label)}`}
                                        className={({ isActive }) =>
                                            `block border-b border-chocolate/10 py-4 font-serif text-3xl transition-colors ${
                                                isActive ? "text-caramel" : "text-chocolate"
                                            }`
                                        }
                                    >
                                        {link.label}
                                    </NavLink>
                                </motion.div>
                            ))}
                        </nav>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="flex flex-col gap-3"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setOrderOpen(true);
                                }}
                                data-testid="mobile-pedir-agora-btn"
                                className="w-full rounded-full bg-chocolate py-4 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-caramel"
                            >
                                PEDIR AGORA
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setCartOpen(true);
                                }}
                                data-testid="mobile-cart-btn"
                                className="flex w-full items-center justify-center gap-2 rounded-full border border-chocolate/25 py-4 text-sm font-semibold tracking-wide text-chocolate transition-colors hover:border-chocolate"
                            >
                                <ShoppingBag size={18} /> Ver carrinho
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
