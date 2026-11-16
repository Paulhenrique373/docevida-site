import { act, render } from "@testing-library/react";
import { CartProvider, MAX_QTY, useCart } from "./CartContext";
import { findProduct } from "../data/products";

let cart;
const Probe = () => { cart = useCart(); return null; };
const setup = () => render(<CartProvider><Probe /></CartProvider>);

beforeEach(() => { localStorage.clear(); findProduct("doce-de-ninho").available = true; });

test("adiciona, soma, altera e remove itens", () => {
    setup();
    act(() => cart.add("doce-de-ninho"));
    act(() => cart.add("doce-de-ninho", 2));
    expect(cart.count).toBe(3);
    act(() => cart.setQty("doce-de-ninho", 5));
    expect(cart.items[0].qty).toBe(5);
    act(() => cart.setQty("doce-de-ninho", 0));
    expect(cart.items).toHaveLength(0);
});

test("quantidade é limitada e sempre inteira; produto inexistente é ignorado", () => {
    setup();
    act(() => cart.add("doce-de-ninho", 500));
    expect(cart.items[0].qty).toBe(MAX_QTY);
    act(() => cart.setQty("doce-de-ninho", 2.7));
    expect(cart.items[0].qty).toBe(2);
    act(() => cart.add("nao-existe"));
    expect(cart.items).toHaveLength(1);
});

test("produto indisponível não entra no carrinho e some se ficar indisponível", () => {
    setup();
    findProduct("doce-de-ninho").available = false;
    act(() => cart.add("doce-de-ninho"));
    expect(cart.items).toHaveLength(0);
});

test("subtotal só soma produtos com preço", () => {
    setup();
    const p = findProduct("doce-de-ninho");
    const old = p.price;
    p.price = 5;
    act(() => cart.add("doce-de-ninho", 3));
    expect(cart.subtotal).toBe(15);
    expect(cart.hasPrices).toBe(true);
    p.price = old;
});

test("carrinho persiste e é restaurado ao recarregar", () => {
    const first = setup();
    act(() => cart.add("doce-de-ninho", 2));
    first.unmount();
    setup();
    expect(cart.count).toBe(2);
});
