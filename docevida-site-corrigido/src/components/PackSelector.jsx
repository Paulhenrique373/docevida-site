// Escolha entre comprar a unidade ou a caixa (ex.: "Caixa com 6").
export const pickTarget = (product, pack) => (pack === "box" && product.box?.available ? product.box : product);

export default function PackSelector({ product, value, onChange }) {
    const box = product?.box;
    if (!box || !box.available) return null;
    const options = [
        ["un", "Unidade"],
        ["box", `Caixa com ${box.boxOf}`],
    ];
    return (
        <div role="radiogroup" aria-label="Como você quer comprar" className="inline-flex rounded-full bg-oat p-1" data-testid={`pack-selector-${product.id}`}>
            {options.map(([key, label]) => (
                <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={value === key}
                    onClick={() => onChange(key)}
                    data-testid={`pack-${key}-${product.id}`}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${value === key ? "bg-chocolate text-cream" : "text-chocolate hover:bg-cream"}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
