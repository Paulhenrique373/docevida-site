import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CartProvider, useCart } from "../context/CartContext";
import { UIProvider, useUI } from "../context/UIContext";
import { findProduct } from "../data/products";
import OrderModal from "./OrderModal";

let cart;
let ui;
const Probe = () => { cart = useCart(); ui = useUI(); return null; };

const mount = () => render(
    <MemoryRouter>
        <CartProvider><UIProvider><Probe /><OrderModal /></UIProvider></CartProvider>
    </MemoryRouter>
);

const serverOrder = {
    code: "DV-ABC234", status: "received", statusLabel: "Recebido", fulfillment: "retirada",
    subtotalCents: null, deliveryFeeCents: 0, totalCents: null, pricePending: true,
    items: [{ productId: "doce-de-ninho", name: "Doce de Ninho", quantity: 2, unitPriceCents: null, lineTotalCents: null }],
    schedule: { date: "2026-10-13", slot: "09:00-12:00", slotLabel: "09h às 12h" },
    history: [{ status: "received", statusLabel: "Recebido", at: "2026-10-16T10:00:00Z" }],
};

const AGENDA = {
    timezone: "America/Sao_Paulo", minLeadDays: 2,
    slots: [{ id: "09:00-12:00", label: "09h às 12h" }, { id: "13:00-17:00", label: "13h às 17h" }],
    days: [{ date: "2026-10-13", weekday: "terça-feira", full: false }, { date: "2026-10-14", weekday: "quarta-feira", full: true }],
};
const res = (status, json) => ({ ok: status < 400, status, json: async () => json });
// Roteia o fetch: agenda e pedidos têm respostas independentes.
function mockApi({ schedule = () => Promise.resolve(res(200, AGENDA)), orders = () => Promise.resolve(res(201, { order: serverOrder, trackingToken: "t".repeat(32), replayed: false })) } = {}) {
    global.fetch = jest.fn((url, init) => {
        if (url === "/api/schedule") return schedule();
        if (url === "/api/orders") return orders(init);
        return Promise.reject(new Error(`rota inesperada ${url}`));
    });
}
const orderCalls = () => global.fetch.mock.calls.filter(([u]) => u === "/api/orders");


async function pickSchedule(user, { date = "2026-10-13", slot = "09:00-12:00" } = {}) {
    await user.selectOptions(await screen.findByTestId("order-input-data"), date);
    await user.click(screen.getByTestId(`order-slot-${slot}`));
}

async function fillAndReview(user) {
    await user.type(screen.getByTestId("order-input-nome"), "Maria Silva");
    await user.type(screen.getByTestId("order-input-telefone"), "11912345678");
    await pickSchedule(user);
    await user.click(screen.getByTestId("order-review-btn"));
}

beforeEach(() => {
    localStorage.clear();
    findProduct("doce-de-ninho").available = true;
    findProduct("doce-de-ninho").price = null;
});
afterEach(() => { delete global.fetch; });

async function openWithItem() {
    mount();
    act(() => { cart.add("doce-de-ninho", 2); ui.setOrderOpen(true); });
    await screen.findByTestId("order-modal");
}

test("carrinho vazio mostra estado vazio e não permite enviar", async () => {
    mockApi();
    mount();
    act(() => ui.setOrderOpen(true));
    expect(await screen.findByTestId("order-empty-state")).toBeInTheDocument();
    expect(screen.queryByTestId("order-review-btn")).not.toBeInTheDocument();
});

test("valida campos obrigatórios (inclusive data e horário) com erro junto do campo e sem enviar pedido", async () => {
    mockApi();
    const user = userEvent.setup();
    await openWithItem();
    await screen.findByTestId("order-input-data");
    await user.click(screen.getByTestId("order-review-btn"));
    expect(screen.getByTestId("order-input-nome")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Informe seu nome.")).toBeInTheDocument();
    expect(screen.getByText(/telefone válido com DDD/)).toBeInTheDocument();
    expect(screen.getByText("Escolha a data.")).toBeInTheDocument();
    expect(screen.getByTestId("order-input-data")).toHaveAttribute("aria-invalid", "true");
    expect(orderCalls()).toHaveLength(0);
    // com data mas sem horário
    await user.selectOptions(screen.getByTestId("order-input-data"), "2026-10-13");
    await user.click(screen.getByTestId("order-review-btn"));
    expect(screen.getByText("Escolha o horário.")).toBeInTheDocument();
    // entrega exige endereço
    await user.click(screen.getByTestId("order-fulfillment-entrega"));
    await user.click(screen.getByTestId("order-review-btn"));
    expect(screen.getByText(/endereço completo/)).toBeInTheDocument();
    expect(screen.getByText("Data da entrega")).toBeInTheDocument();
    expect(orderCalls()).toHaveLength(0);
});

test("agenda: dias lotados aparecem desabilitados e a antecedência é informada", async () => {
    mockApi();
    await openWithItem();
    const select = await screen.findByTestId("order-input-data");
    const full = within(select).getByRole("option", { name: /agenda completa/ });
    expect(full).toBeDisabled();
    expect(within(select).getByRole("option", { name: /13\/10/ })).not.toBeDisabled();
    expect(screen.getByText(/pelo menos 2 dias de antecedência/)).toBeInTheDocument();
});

test("falha ao carregar a agenda mostra erro com nova tentativa (sem tela quebrada)", async () => {
    let calls = 0;
    mockApi({ schedule: () => { calls += 1; return calls === 1 ? Promise.reject(new TypeError("Failed to fetch")) : Promise.resolve(res(200, AGENDA)); } });
    const user = userEvent.setup();
    await openWithItem();
    expect(await screen.findByTestId("order-schedule-error")).toHaveTextContent(/Sem conexão/);
    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(await screen.findByTestId("order-input-data")).toBeInTheDocument();
});

test("revisa, envia data/horário e SEM preços/totais, mostra código e limpa o carrinho", async () => {
    mockApi();
    const user = userEvent.setup();
    await openWithItem();
    await fillAndReview(user);
    expect(await screen.findByTestId("order-review")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByTestId("order-review-schedule")).toHaveTextContent(/13\/10.*09h às 12h/);
    await user.click(screen.getByTestId("order-confirm-btn"));
    expect(await screen.findByTestId("order-code")).toHaveTextContent("DV-ABC234");
    expect(screen.getByTestId("order-success-schedule")).toHaveTextContent(/Retirada.*13\/10.*09h às 12h/);

    const [url, init] = orderCalls()[0];
    expect(url).toBe("/api/orders");
    const body = JSON.parse(init.body);
    expect(body.items).toEqual([{ productId: "doce-de-ninho", quantity: 2 }]);
    expect(body.schedule).toEqual({ date: "2026-10-13", slot: "09:00-12:00" });
    expect(JSON.stringify(body)).not.toMatch(/price|total|subtotal/i);
    expect(init.headers["Idempotency-Key"]).toMatch(/^dv-/);
    expect(cart.count).toBe(0);
    expect(JSON.parse(localStorage.getItem("docevida_my_orders_v1"))[0].code).toBe("DV-ABC234");
});

test("cliques repetidos enviam um único pedido", async () => {
    let resolve;
    mockApi({ orders: () => new Promise((r) => { resolve = r; }) });
    const user = userEvent.setup();
    await openWithItem();
    await fillAndReview(user);
    const btn = await screen.findByTestId("order-confirm-btn");
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    expect(orderCalls()).toHaveLength(1);
    expect(btn).toBeDisabled();
    await act(async () => resolve(res(201, { order: serverOrder, trackingToken: "t".repeat(32) })));
});

test("timeout preserva carrinho, dados e agenda e o reenvio reutiliza a MESMA chave de idempotência", async () => {
    const orders = jest.fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(res(200, { order: serverOrder, trackingToken: "t".repeat(32), replayed: true }));
    mockApi({ orders });
    const user = userEvent.setup();
    await openWithItem();
    await fillAndReview(user);
    await user.click(await screen.findByTestId("order-confirm-btn"));
    const err = await screen.findByTestId("order-submit-error");
    expect(err).toHaveTextContent(/não vamos criar um pedido duplicado/i);
    expect(cart.count).toBe(2);                       // carrinho preservado
    await user.click(screen.getByTestId("order-confirm-btn")); // "tentar novamente"
    expect(await screen.findByTestId("order-code")).toBeInTheDocument();
    const k1 = orderCalls()[0][1].headers["Idempotency-Key"];
    const k2 = orderCalls()[1][1].headers["Idempotency-Key"];
    expect(k1).toBe(k2);
    expect(JSON.parse(orderCalls()[1][1].body).schedule).toEqual({ date: "2026-10-13", slot: "09:00-12:00" });
});

test("erro de validação do servidor volta ao formulário com mensagem no campo", async () => {
    mockApi({ orders: () => Promise.resolve(res(400, { error: { code: "validation_error", message: "Confira os campos destacados.", fields: { phone: "Informe um telefone válido com DDD." } } })) });
    const user = userEvent.setup();
    await openWithItem();
    await fillAndReview(user);
    await user.click(await screen.findByTestId("order-confirm-btn"));
    await waitFor(() => expect(screen.getByTestId("order-form")).toBeInTheDocument());
    expect(within(screen.getByTestId("order-form")).getByText(/telefone válido/)).toBeInTheDocument();
    expect(cart.count).toBe(2);
});

test("data que lotou entre a escolha e o envio (409): volta ao formulário, recarrega a agenda e mantém o carrinho", async () => {
    let agendaCalls = 0;
    mockApi({
        schedule: () => { agendaCalls += 1; return Promise.resolve(res(200, agendaCalls === 1 ? AGENDA : { ...AGENDA, days: [{ date: "2026-10-13", weekday: "terça-feira", full: true }] })); },
        orders: () => Promise.resolve(res(409, { error: { code: "schedule_unavailable", message: "Este dia já está com a agenda completa. Escolha outra data.", fields: { schedule: "x" } } })),
    });
    const user = userEvent.setup();
    await openWithItem();
    await fillAndReview(user);
    await user.click(await screen.findByTestId("order-confirm-btn"));
    await waitFor(() => expect(screen.getByTestId("order-form")).toBeInTheDocument());
    expect(screen.getByText(/agenda completa\. Escolha outra data/)).toBeInTheDocument();
    await waitFor(() => expect(agendaCalls).toBe(2));
    // a data lotada foi desmarcada: o cliente precisa escolher outra
    await waitFor(() => expect(screen.getByTestId("order-input-data")).toHaveValue(""));
    expect(cart.count).toBe(2);
});

test("produto indisponível (422) mostra mensagem e mantém o carrinho", async () => {
    mockApi({ orders: () => Promise.resolve(res(422, { error: { code: "unavailable_items", message: "Doce de Ninho está indisponível no momento." } })) });
    const user = userEvent.setup();
    await openWithItem();
    await fillAndReview(user);
    await user.click(await screen.findByTestId("order-confirm-btn"));
    expect(await screen.findByTestId("order-submit-error")).toHaveTextContent(/indisponível/);
    expect(cart.count).toBe(2);
});
