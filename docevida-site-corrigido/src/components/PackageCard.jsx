import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { priceLabel } from "../data/products";
import { useCatalogVersion } from "../hooks/useCatalog";

// Caixas e bolos: o cliente escolhe o tamanho e o preço vem da tabela (confirmado pelo servidor no pedido).
export default function PackageCard({ pkg }) {
    useCatalogVersion();
    const { add } = useCart();
    const [sel, setSel] = useState(0);
    const items = pkg.items;
    const item = items[sel] || items[0];
    const single = items.length === 1;

    return (
        <article className="flex flex-col rounded-3xl bg-oat/60 p-4" data-testid={`package-${pkg.id}`}>
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-[#FBF3DE]">
                {pkg.image ? (
                    <>
                        <img
                            src={pkg.image}
                            srcSet={pkg.imageSrcSet}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            alt={`${pkg.title} — DoceVida`}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                        />
                        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-chocolate/75 px-3 py-1 text-[10px] font-medium tracking-wide text-cream backdrop-blur">Imagem ilustrativa</span>
                    </>
                ) : (
                    <img src="/logo.png" alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-contain p-4" />
                )}
            </div>
            <h3 className="mt-5 font-serif text-xl text-chocolate">{pkg.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-taupe">{pkg.description}</p>

            {!single && (
                <div role="radiogroup" aria-label={`Tamanho — ${pkg.title}`} className="mt-4 flex flex-wrap gap-2">
                    {items.map((it, i) => (
                        <button
                            key={it.id}
                            type="button"
                            role="radio"
                            aria-checked={sel === i}
                            disabled={!it.available}
                            onClick={() => setSel(i)}
                            data-testid={`size-${it.id}`}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${sel === i ? "bg-chocolate text-cream" : "bg-cream text-chocolate hover:bg-white"}`}
                        >
                            {it.optionLabel}
                        </button>
                    ))}
                </div>
            )}

            <p className="mt-4 font-serif text-2xl text-chocolate" aria-live="polite" data-testid={`price-${item.id}`}>
                {priceLabel(item)}
                {single && <span className="ml-2 text-sm font-sans text-taupe">{item.optionLabel}</span>}
            </p>

            <button
                type="button"
                disabled={!item.available}
                onClick={() => {
                    add(item.id);
                    toast.success(`${item.name} adicionado ao carrinho`);
                }}
                aria-label={`Adicionar ${item.name} ao carrinho`}
                data-testid={`add-to-cart-${item.id}-btn`}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-chocolate px-6 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Plus size={16} aria-hidden="true" /> {item.available ? "ADICIONAR AO CARRINHO" : "INDISPONÍVEL"}
            </button>
        </article>
    );
}
