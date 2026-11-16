import { PHOTO_HEIGHT, PHOTO_WIDTH } from "../data/products";

// Foto de produto: WebP responsivo, proporção 3:2 preservada, dimensões fixas contra layout shift.
// priority = true só para a imagem visível ao abrir a página (sem lazy loading).
export default function ProductImage({ product, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", priority = false, className = "", ...rest }) {
    return (
        <img
            src={product.image}
            srcSet={product.imageSrcSet}
            sizes={sizes}
            width={PHOTO_WIDTH}
            height={PHOTO_HEIGHT}
            alt={product.imageAlt || `${product.name} — doce artesanal DoceVida`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className={className}
            {...rest}
        />
    );
}
