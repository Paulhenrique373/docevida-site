import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Loader2, RefreshCw, Search } from "lucide-react";
import usePageMeta from "../hooks/usePageMeta";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { isAbort, request } from "../lib/api";
import { brl, formatDateTime, formatDay, STATUS_META } from "../lib/format";
import { forgetOrder, getMyOrders, rememberOrder } from "../lib/orderStore";

const inputCls =
    "w-full rounded-xl border border-chocolate/20 bg-white/80 px-4 py-3 text-base text-chocolate placeholder:text-taupe/70 focus:border-gold";

export default function Acompanhar() {
    usePageMeta({ title: "Acompanhar pedido — DoceVida", description: "Consulte o andamento do seu pedido com o código e a chave de acompanhamento." });
    const location = useLocation();
    const [mine, setMine] = useState(getMyOrders);
    const [code, setCode] = useState(location.state?.code || "");
    const [token, setToken] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const reqId = useRef(0);
    const ctrlRef = useRef(null);

    // Cancela a consulta anterior e ignora respostas fora de ordem.
    const fetchOrder = useCallback(async (c, t) => {
        ctrlRef.current?.abort();
        const ctrl = new AbortController();
        ctrlRef.current = ctrl;
        const id = ++reqId.current;
        setLoading(true);
        setError(null);
        try {
            const data = await request(`/api/orders/${encodeURIComponent(c.trim().toUpperCase())}`, { headers: { "X-Order-Token": t.trim() }, signal: ctrl.signal });
            if (id !== reqId.current) return;
            setOrder(data.order);
            setCode(data.order.code);
            setToken(t.trim());
            rememberOrder(data.order.code, t.trim());
            setMine(getMyOrders());
        } catch (e) {
            if (isAbort(e) || id !== reqId.current) return;
            setOrder(null);
            setError(e.status === 404 ? "Pedido não encontrado. Confira o código e a chave." : e.message);
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const preset = location.state?.code ? getMyOrders().find((o) => o.code === location.state.code) : getMyOrders()[0];
        if (preset) {
            setCode(preset.code);
            setToken(preset.token);
            fetchOrder(preset.code, preset.token);
        }
        return () => ctrlRef.current?.abort();
    }, []);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!code.trim() || !token.trim()) {
            setError("Informe o código e a chave de acompanhamento.");
            return;
        }
        fetchOrder(code, token);
    };

    return (
        <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-caramel">Seu pedido</p>
            <h1 className="mt-2 font-serif text-4xl text-chocolate sm:text-5xl">Acompanhar pedido</h1>
            <p className="mt-3 max-w-xl text-taupe">Use o código e a chave que você recebeu ao finalizar o pedido. Não pedimos login nem mostramos dados de outros clientes.</p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-3xl border border-chocolate/10 bg-oat p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end" data-testid="track-form" noValidate>
                <div>
                    <label htmlFor="track-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Código</label>
                    <input id="track-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="DV-XXXXXX" autoCapitalize="characters" autoComplete="off" data-testid="track-code" className={`${inputCls} font-mono uppercase`} />
                </div>
                <div>
                    <label htmlFor="track-token" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Chave de acompanhamento</label>
                    <input id="track-token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="32 caracteres" autoComplete="off" spellCheck={false} data-testid="track-token" className={`${inputCls} font-mono`} />
                </div>
                <button type="submit" disabled={loading} data-testid="track-submit" className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-chocolate px-6 text-sm font-semibold tracking-[0.12em] text-cream hover:bg-caramel disabled:opacity-60">
                    {loading ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />} CONSULTAR
                </button>
            </form>

            {mine.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="track-mine">
                    <span className="text-xs text-taupe">Neste aparelho:</span>
                    {mine.map((o) => (
                        <span key={o.code} className="inline-flex items-center rounded-full border border-chocolate/25 text-sm">
                            <button type="button" onClick={() => { setCode(o.code); setToken(o.token); fetchOrder(o.code, o.token); }} className="min-h-[40px] rounded-l-full px-3 font-mono text-chocolate hover:bg-oat">{o.code}</button>
                            <button type="button" aria-label={`Remover ${o.code} deste aparelho`} onClick={() => { forgetOrder(o.code); setMine(getMyOrders()); if (order?.code === o.code) setOrder(null); }} className="min-h-[40px] rounded-r-full px-2 text-taupe hover:text-[#7A1F14]">×</button>
                        </span>
                    ))}
                </div>
            )}

            <div aria-live="polite" className="mt-6">
                {error && (
                    <div role="alert" className="flex items-start gap-2 rounded-2xl border border-[#7A1F14]/40 bg-[#FDF3F1] p-4 text-sm text-[#7A1F14]" data-testid="track-error">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <p>{error}</p>
                    </div>
                )}
                {order && (
                    <section className="rounded-3xl border border-chocolate/10 bg-white/60 p-5 sm:p-7" data-testid="track-result" aria-label={`Pedido ${order.code}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Pedido</p>
                                <p className="font-mono text-xl font-semibold text-chocolate" data-testid="track-order-code">{order.code}</p>
                            </div>
                            <OrderStatusBadge status={order.status} className="text-sm" />
                        </div>
                        <p className="mt-3 text-sm text-taupe">{STATUS_META[order.status]?.hint}</p>

                        <ol className="mt-6 space-y-3 border-l-2 border-gold/50 pl-5" data-testid="track-history">
                            {order.history.map((h, i) => (
                                <li key={`${h.status}-${i}`} className="relative">
                                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-cream bg-gold-dark" aria-hidden="true" />
                                    <p className="text-sm font-semibold text-chocolate">{h.statusLabel}</p>
                                    <p className="text-xs text-taupe">{formatDateTime(h.at)}</p>
                                </li>
                            ))}
                        </ol>

                        <ul className="mt-6 divide-y divide-chocolate/10 text-sm text-chocolate">
                            {order.items.map((i) => (
                                <li key={i.productId} className="flex justify-between gap-3 py-2">
                                    <span>{i.quantity}× {i.name}</span>
                                    <span className="shrink-0">{i.lineTotalCents != null ? brl(i.lineTotalCents) : "sob consulta"}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-3 space-y-1 text-sm">
                            {order.schedule && <div className="flex justify-between gap-3 text-taupe" data-testid="track-schedule"><dt>{order.fulfillment === "entrega" ? "Entrega" : "Retirada"}</dt><dd className="text-right">{formatDay(order.schedule.date)}, {order.schedule.slotLabel}</dd></div>}
                            <div className="flex justify-between text-taupe"><dt>Recebimento</dt><dd>{order.fulfillment === "entrega" ? "Entrega" : "Retirada"}</dd></div>
                            <div className="flex justify-between text-taupe"><dt>Entrega</dt><dd>{order.deliveryFeeCents === 0 ? "Grátis" : order.deliveryFeeCents != null ? brl(order.deliveryFeeCents) : "A combinar"}</dd></div>
                            <div className="flex justify-between font-serif text-lg text-chocolate"><dt>Total</dt><dd data-testid="track-total">{order.totalCents != null ? brl(order.totalCents) : "A confirmar pela loja"}</dd></div>
                        </dl>
                        <button type="button" onClick={() => fetchOrder(order.code, token)} disabled={loading} className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chocolate/30 px-5 text-sm font-semibold text-chocolate hover:bg-oat disabled:opacity-60">
                            <RefreshCw size={15} aria-hidden="true" /> Atualizar status
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}
