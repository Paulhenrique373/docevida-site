export function buildOrderMessage({ items, hasPrices, subtotal, nome, telefone, modalidade, endereco, obs, formatPrice }) {
    const lines = ["Olá, DoceVida! Gostaria de fazer um pedido:", ""];
    if (nome) lines.push(`Nome: ${nome}`);
    if (telefone) lines.push(`Telefone: ${telefone}`);
    if (modalidade) lines.push(`Modalidade: ${modalidade === "entrega" ? "Entrega" : "Retirada"}`);
    if (modalidade === "entrega" && endereco) lines.push(`Endereço: ${endereco}`);
    if (nome || telefone || modalidade) lines.push("");
    for (const p of items) {
        lines.push(p.name, `Quantidade: ${p.qty}`);
        if (p.price != null) lines.push(`Preço unitário: ${formatPrice(p.price)}`, `Subtotal: ${formatPrice(p.price * p.qty)}`);
        lines.push("");
    }
    lines.push(hasPrices ? `Total dos produtos: ${formatPrice(subtotal)}` : "Total: valores sob consulta");
    if (modalidade === "entrega") lines.push("Taxa de entrega: a combinar");
    if (obs) lines.push("", `Observações: ${obs}`);
    return lines.join("\n");
}
