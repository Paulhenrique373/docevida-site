import { Component, lazy, Suspense } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { CartProvider } from "@/context/CartContext";
import { UIProvider } from "@/context/UIContext";
import { useCatalogLoader } from "@/hooks/useCatalog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import OrderModal from "@/components/OrderModal";
import ProductModal from "@/components/ProductModal";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Home from "@/pages/Home";
import Produtos from "@/pages/Produtos";
const Historia = lazy(() => import("@/pages/Historia"));
const Sustentabilidade = lazy(() => import("@/pages/Sustentabilidade"));
const Qualidade = lazy(() => import("@/pages/Qualidade"));
const Contato = lazy(() => import("@/pages/Contato"));
const Doacoes = lazy(() => import("@/pages/Doacoes"));
const Privacidade = lazy(() => import("@/pages/Privacidade"));
const Termos = lazy(() => import("@/pages/Termos"));
const Acompanhar = lazy(() => import("@/pages/Acompanhar"));
const AdminApp = lazy(() => import("@/pages/admin/AdminApp"));
const DocesMatch = lazy(() => import("@/pages/DocesMatch"));

class ErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-cream p-6 text-center">
                    <div>
                        <p className="font-serif text-3xl text-chocolate">Algo saiu do ponto...</p>
                        <p className="mt-2 text-taupe">Recarregue a página para voltar à DoceVida.</p>
                        <a href="/" className="mt-6 inline-flex rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold text-cream">
                            Voltar ao início
                        </a>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function NotFound() {
    return (
        <section className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 py-32 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">Erro 404</p>
            <h1 className="font-serif text-4xl text-chocolate sm:text-5xl">Esta página derreteu...</h1>
            <p className="max-w-sm text-taupe">O endereço que você tentou acessar não existe por aqui.</p>
            <Link
                to="/"
                data-testid="notfound-cta"
                className="mt-4 inline-flex rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel"
            >
                VOLTAR AO INÍCIO
            </Link>
        </section>
    );
}

function PageFallback() {
    return (
        <div className="grid min-h-[50vh] place-items-center text-taupe" role="status" aria-live="polite">
            Carregando…
        </div>
    );
}

// Loja pública: navbar, rodapé, carrinho. A área /admin fica fora desse "chrome".
function Shell() {
    const { pathname } = useLocation();
    useCatalogLoader();
    if (pathname.startsWith("/admin")) {
        return (
            <div className="min-h-screen bg-cream font-sans text-chocolate">
                <Suspense fallback={<PageFallback />}>
                    <Routes>
                        <Route path="/admin/*" element={<AdminApp />} />
                    </Routes>
                </Suspense>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-cream font-sans text-chocolate">
            <a href="#conteudo" className="skip-link">
                Pular para o conteúdo
            </a>
            <Navbar />
            <main id="conteudo">
                <Suspense fallback={<PageFallback />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/produtos" element={<Produtos />} />
                        <Route path="/jogos/doces-match" element={<DocesMatch />} />
                        <Route path="/historia" element={<Historia />} />
                        <Route path="/sustentabilidade" element={<Sustentabilidade />} />
                        <Route path="/doacoes" element={<Doacoes />} />
                        <Route path="/qualidade" element={<Qualidade />} />
                        <Route path="/contato" element={<Contato />} />
                        <Route path="/privacidade" element={<Privacidade />} />
                        <Route path="/termos" element={<Termos />} />
                        <Route path="/acompanhar" element={<Acompanhar />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>
            <Footer />
            <FloatingWhatsApp />
            <CartDrawer />
            <SearchOverlay />
            <OrderModal />
            <ProductModal />
        </div>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <CartProvider>
                <UIProvider>
                    <BrowserRouter>
                        <ScrollToTop />
                        <Shell />
                        <Toaster
                            position="bottom-center"
                            toastOptions={{
                                style: { background: "#2A1810", color: "#FAF7F2", borderRadius: "16px" },
                            }}
                        />
                    </BrowserRouter>
                </UIProvider>
            </CartProvider>
        </ErrorBoundary>
    );
}
