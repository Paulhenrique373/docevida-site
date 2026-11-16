import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { priceLabel } from "../data/products";
import ProductImage from "./ProductImage";
import PackSelector, { pickTarget } from "./PackSelector";
import { useCatalogVersion } from "../hooks/useCatalog";

export default function ProductCard({ product }) {
    useCatalogVersion();
    const { add } = useCart();
    const { openProduct } = useUI();
    const [pack, setPack] = useState("un");
    const target = pickTarget(product, pack);

    return (
        <article className="group flex flex-col" data-testid={`product-card-${product.id}`}>
            <button
                type="button"
                onClick={() => openProduct(product)}
                data-testid={`product-open-${product.id}`}
                aria-label={`Ver detalhes de ${product.name}`}
                className="relative block aspect-[4/3] w-full overflow-hidden rounded-3xl bg-oat"
            >
                <ProductImage
                    product={product}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-chocolate/75 px-3 py-1 text-[10px] font-medium tracking-wide text-cream backdrop-blur">Imagem ilustrativa</span>
                {!product.available && (
                    <span className="absolute inset-0 grid place-items-center bg-cocoa/55 text-sm font-semibold uppercase tracking-[0.2em] text-cream" data-testid={`unavailable-${product.id}`}>Indisponível</span>
                )}
                {product.isNew && (
                    <span className="absolute left-4 top-4 rounded-full bg-chocolate px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Novo</span>
                )}
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-chocolate/10" />
            </button>

            <div className="mt-5 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl leading-snug text-chocolate">
                        <button type="button" onClick={() => openProduct(product)} className="text-left">
                            {product.name}
                        </button>
                    </h3>
                    <button
                        type="button"
                        disabled={!target.available}
                        onClick={() => {
                            add(target.id);
                            toast.success(`${target.name} adicionado ao carrinho`);
                        }}
                        data-testid={`add-to-cart-${product.id}-btn`}
                        aria-label={`Adicionar ${target.name} ao carrinho`}
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-chocolate text-cream transition-all duration-300 hover:scale-105 hover:bg-caramel active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Plus size={18} strokeWidth={2} />
                    </button>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-taupe">{product.description}</p>
                {product.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {product.tags.map((t) => (
                            <span key={t} className="rounded-full bg-moss-light px-3 py-1 text-xs font-semibold text-moss-dark">{t}</span>
                        ))}
                    </div>
                )}
                <div className="mt-4">
                    <PackSelector product={product} value={pack} onChange={setPack} />
                </div>
                <p className="mt-3 text-sm font-semibold text-caramel" data-testid={`price-${product.id}`}>
                    {priceLabel(target)}
                </p>
            </div>
        </article>
    );
}
