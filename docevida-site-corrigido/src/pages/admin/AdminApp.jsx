import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, LogOut, Plus, RefreshCw, Search, X } from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { isAbort, request } from "../../lib/api";
import { brl, formatDateTime, formatDay, STATUS_META } from "../../lib/format";

const field = "w-full rounded-xl border border-chocolate/25 bg-white px-3 py-2.5 text-base text-chocolate focus:border-gold";
const btn = "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const btnDark = `${btn} bg-chocolate text-cream hover:bg-caramel`;
const btnLine = `${btn} border border-chocolate/30 text-chocolate hover:bg-oat`;

function ErrorBox({ children, testid }) {
    if (!children) return null;
    return (
        <div role="alert" data-testid={testid} className="flex items-start gap-2 rounded-2xl border border-[#7A1F14]/40 bg-[#FDF3F1] p-3 text-sm text-[#7A1F14]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{children}</p>
        </div>
    );
}

function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            onLogin(await request("/api/admin/login", { method: "POST", body: { username, password } }));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
            <h1 className="font-serif text-3xl text-chocolate">DoceVida — Administração</h1>
            <p className="mt-2 text-sm text-taupe">Acesso restrito à equipe da loja.</p>
            <form onSubmit={submit} className="mt-6 grid gap-4" data-testid="admin-login-form">
                <div>
                    <label htmlFor="adm-user" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Usuário</label>
                    <input id="adm-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required className={field} data-testid="admin-username" />
                </div>
                <div>
                    <label htmlFor="adm-pass" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Senha</label>
                    <input id="adm-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={field} data-testid="admin-password" />
                </div>
                <ErrorBox testid="admin-login-error">{error}</ErrorBox>
                <button type="submit" disabled={busy} className={btnDark} data-testid="admin-login-btn">
                    {busy && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />} ENTRAR
                </button>
            </form>
        </div>
    );
}

function OrderDetail({ code, call, onClose, onChanged }) {
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState("");
    const [total, setTotal] = useState("");
    const ref = useRef(null);

    // keepError: recarga silenciosa após um 409, sem apagar a mensagem que explica o conflito.
    const load = useCallback(async (signal, keepError = false) => {
        if (!keepError) setError(null);
        try {
            const d = await call(`/api/admin/orders/${code}`, { signal });
            setOrder(d.order);
        } catch (e) {
            if (!isAbort(e)) setError(e.message);
        }
    }, [call, code]);

    useEffect(() => {
        const c = new AbortController();
        setOrder(null);
        load(c.signal);
        return () => c.abort();
    }, [load]);
    useEffect(() => { ref.current?.focus(); }, [code]);
    useEffect(() => {
        const k = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
    }, [onClose]);

    const act = async (fn) => {
        setBusy(true);
        setError(null);
        try {
            const d = await fn();
            setOrder(d.order);
            setNote("");
            onChanged();
        } catch (e) {
            setError(e.message);
            if (e.status === 409) load(undefined, true);
        } finally {
            setBusy(false);
        }
    };
    const changeStatus = (status) => act(() => call(`/api/admin/orders/${code}/status`, { method: "PATCH", body: { status, expectedStatus: order.status, note: note.trim() || undefined } }));
    const saveTotal = () => {
        const cents = Math.round(Number(String(total).replace(",", ".")) * 100);
        if (!Number.isFinite(cents) || cents < 0) { setError("Informe um valor válido, ex.: 45,90"); return; }
        act(() => call(`/api/admin/orders/${code}/total`, { method: "PUT", body: { totalCents: cents } }));
    };

    return (
        <div className="fixed inset-0 z-[90] flex justify-end" data-testid="admin-order-detail">
            <div className="absolute inset-0 bg-cocoa/60" onClick={onClose} aria-hidden="true" />
            <aside role="dialog" aria-modal="true" aria-labelledby="adm-detail-title" className="relative flex h-[100dvh] w-full max-w-xl flex-col bg-cream shadow-2xl">
                <div className="flex items-center justify-between border-b border-chocolate/10 px-5 py-4">
                    <h2 id="adm-detail-title" ref={ref} tabIndex={-1} className="font-mono text-lg font-semibold text-chocolate outline-none">{code}</h2>
                    <button type="button" onClick={onClose} aria-label="Fechar detalhes" className="grid h-11 w-11 place-items-center rounded-full hover:bg-oat"><X size={20} /></button>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                    <ErrorBox testid="admin-detail-error">{error}</ErrorBox>
                    {!order && !error && <p className="flex items-center gap-2 text-sm text-taupe"><Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Carregando…</p>}
                    {order && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <OrderStatusBadge status={order.status} className="text-sm" />
                                <span className="text-xs text-taupe">Criado em {formatDateTime(order.createdAt)}</span>
                            </div>
                            <dl className="grid gap-2 rounded-2xl border border-chocolate/15 bg-white/60 p-4 text-sm">
                                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Cliente</dt><dd>{order.customer.name}</dd></div>
                                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Telefone</dt><dd><a className="underline" href={`tel:+55${order.customer.phone}`}>{order.customer.phone}</a></dd></div>
                                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Contato preferido</dt><dd className="capitalize">{order.contactPreference}</dd></div>
                                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Agendado para</dt><dd data-testid="admin-order-schedule">{order.schedule ? `${formatDay(order.schedule.date)} · ${order.schedule.slotLabel}` : "Sem data (pedido anterior à agenda)"}</dd></div>
                                <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Recebimento</dt><dd>{order.fulfillment === "entrega" ? `Entrega — ${order.address}` : "Retirada"}</dd></div>
                                {order.notes && <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Observações</dt><dd className="whitespace-pre-wrap">{order.notes}</dd></div>}
                            </dl>
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Itens</h3>
                                <ul className="divide-y divide-chocolate/10 text-sm">
                                    {order.items.map((i) => (
                                        <li key={i.productId} className="flex justify-between gap-3 py-2"><span>{i.quantity}× {i.name}</span><span>{i.lineTotalCents != null ? brl(i.lineTotalCents) : "sem preço"}</span></li>
                                    ))}
                                </ul>
                                <dl className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between text-taupe"><dt>Subtotal</dt><dd>{order.subtotalCents != null ? brl(order.subtotalCents) : "pendente"}</dd></div>
                                    <div className="flex justify-between text-taupe"><dt>Entrega</dt><dd>{order.deliveryFeeCents != null ? brl(order.deliveryFeeCents) : "a combinar"}</dd></div>
                                    <div className="flex justify-between font-serif text-lg"><dt>Total</dt><dd data-testid="admin-order-total">{order.totalCents != null ? brl(order.totalCents) : "não definido"}</dd></div>
                                </dl>
                            </div>
                            {order.pricePending && ["received", "confirmed"].includes(order.status) && (
                                <div className="rounded-2xl border border-gold/50 bg-gold/10 p-4">
                                    <label htmlFor="adm-total" className="text-sm font-semibold text-chocolate">Definir valor total (R$)</label>
                                    <p className="text-xs text-taupe">Há preço ou entrega sob consulta. Informe o valor combinado com o cliente.</p>
                                    <div className="mt-2 flex gap-2">
                                        <input id="adm-total" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0,00" className={field} data-testid="admin-total-input" />
                                        <button type="button" onClick={saveTotal} disabled={busy} className={btnDark} data-testid="admin-total-save">Salvar</button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Atualizar status</h3>
                                {order.allowedTransitions.length === 0 ? (
                                    <p className="text-sm text-taupe">Este pedido está em um estado final.</p>
                                ) : (
                                    <>
                                        <label htmlFor="adm-note" className="sr-only">Nota interna (opcional)</label>
                                        <input id="adm-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Nota interna (opcional)" className={field} />
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {order.allowedTransitions.map((s) => (
                                                <button key={s} type="button" disabled={busy} onClick={() => changeStatus(s)} data-testid={`admin-set-${s}`} className={s === "cancelled" ? `${btn} border border-[#7A1F14]/50 text-[#7A1F14] hover:bg-[#FDF3F1]` : btnDark}>
                                                    {busy && <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />} {STATUS_META[s].label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Histórico</h3>
                                <ol className="space-y-2 border-l-2 border-gold/50 pl-4 text-sm" data-testid="admin-history">
                                    {order.history.map((h, i) => (
                                        <li key={i}>
                                            <p className="font-semibold">{h.kind === "status" ? `${h.from ? STATUS_META[h.from].label + " → " : ""}${STATUS_META[h.to].label}` : "Anotação"}</p>
                                            <p className="text-xs text-taupe">{formatDateTime(h.at)}{h.by ? ` · ${h.by}` : " · cliente"}</p>
                                            {h.note && <p className="text-xs text-chocolate/80">{h.note}</p>}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

function Orders({ call, statuses, setStatuses }) {
    const [filters, setFilters] = useState({ q: "", status: "", from: "", to: "", scheduled: "", sort: "created_at", order: "desc", page: 1 });
    const [qInput, setQInput] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(null);
    const seq = useRef(0);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput, page: 1 })), 350);
        return () => clearTimeout(t);
    }, [qInput]);

    useEffect(() => {
        const ctrl = new AbortController();
        const id = ++seq.current;
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
        setLoading(true);
        call(`/api/admin/orders?${params}`, { signal: ctrl.signal })
            .then((d) => {
                if (id !== seq.current) return; // resposta fora de ordem
                setData(d);
                setError(null);
                if (d.statuses && !statuses.length) setStatuses(d.statuses);
            })
            .catch((e) => { if (!isAbort(e) && id === seq.current) setError(e.message); })
            .finally(() => { if (id === seq.current) setLoading(false); });
        return () => ctrl.abort();
    }, [filters, tick, call]);

    const set = (patch) => setFilters((f) => ({ ...f, page: 1, ...patch }));
    const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

    return (
        <section aria-label="Pedidos">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7" role="search">
                <div className="relative lg:col-span-2">
                    <label htmlFor="f-q" className="sr-only">Buscar por código, nome ou telefone</label>
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-taupe" aria-hidden="true" />
                    <input id="f-q" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Código, nome ou telefone" className={`${field} pl-9`} data-testid="admin-search" />
                </div>
                <div>
                    <label htmlFor="f-status" className="sr-only">Status</label>
                    <select id="f-status" value={filters.status} onChange={(e) => set({ status: e.target.value })} className={field} data-testid="admin-filter-status">
                        <option value="">Todos os status</option>
                        {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="f-from" className="sr-only">De</label>
                    <input id="f-from" type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} className={field} aria-label="Data inicial" />
                </div>
                <div>
                    <label htmlFor="f-to" className="sr-only">Até</label>
                    <input id="f-to" type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} className={field} aria-label="Data final" />
                </div>
                <div>
                    <label htmlFor="f-sched" className="sr-only">Agendado para</label>
                    <input id="f-sched" type="date" value={filters.scheduled} onChange={(e) => set({ scheduled: e.target.value })} className={field} aria-label="Agendado para (data de retirada ou entrega)" data-testid="admin-filter-scheduled" />
                </div>
                <div>
                    <label htmlFor="f-sort" className="sr-only">Ordenar</label>
                    <select id="f-sort" value={`${filters.sort}:${filters.order}`} onChange={(e) => { const [sort, order] = e.target.value.split(":"); set({ sort, order }); }} className={field}>
                        <option value="scheduled:asc">Data agendada (mais próxima)</option>
                        <option value="created_at:desc">Mais recentes</option>
                        <option value="created_at:asc">Mais antigos</option>
                        <option value="total:desc">Maior valor</option>
                        <option value="total:asc">Menor valor</option>
                        <option value="status:asc">Status</option>
                    </select>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-taupe" aria-live="polite">
                <span data-testid="admin-count">{data ? `${data.total} pedido${data.total === 1 ? "" : "s"}` : ""}</span>
                <button type="button" onClick={() => setTick((t) => t + 1)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 hover:bg-oat"><RefreshCw size={14} className={loading ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" /> Atualizar</button>
            </div>

            <div className="mt-2">
                <ErrorBox testid="admin-list-error">{error}</ErrorBox>
                {error && <button type="button" onClick={() => setTick((t) => t + 1)} className={`${btnLine} mt-2`}>Tentar novamente</button>}
                {!error && loading && !data && <p className="py-10 text-center text-sm text-taupe">Carregando pedidos…</p>}
                {!error && data && data.orders.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-chocolate/25 py-14 text-center" data-testid="admin-empty">
                        <p className="font-serif text-xl text-chocolate">{data.total === 0 && !filters.q && !filters.status && !filters.from && !filters.to && !filters.scheduled ? "Nenhum pedido registrado ainda" : "Nenhum pedido encontrado"}</p>
                        <p className="mt-1 text-sm text-taupe">{filters.q || filters.status || filters.from || filters.to || filters.scheduled ? "Ajuste os filtros para ver outros resultados." : "Os pedidos feitos no site aparecerão aqui."}</p>
                    </div>
                )}
                {!error && data && data.orders.length > 0 && (
                    <ul className={`divide-y divide-chocolate/10 overflow-hidden rounded-3xl border border-chocolate/15 bg-white/60 ${loading ? "opacity-60" : ""}`} data-testid="admin-orders">
                        {data.orders.map((o) => (
                            <li key={o.code}>
                                <button type="button" onClick={() => setOpen(o.code)} data-testid={`admin-order-${o.code}`} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-oat sm:grid-cols-[9rem_1fr_9rem_8rem_auto]">
                                    <span className="font-mono text-sm font-semibold text-chocolate">{o.code}</span>
                                    <span className="order-3 col-span-2 text-sm text-chocolate sm:order-none sm:col-span-1">{o.customerName} <span className="text-taupe">· {o.itemCount} {o.itemCount === 1 ? "item" : "itens"} · {o.fulfillment === "entrega" ? "Entrega" : "Retirada"}</span></span>
                                    <span className="order-4 col-span-2 text-xs text-taupe sm:order-none sm:col-span-1">
                                        {o.schedule ? <strong className="font-semibold text-chocolate" data-testid="admin-row-schedule">{o.fulfillment === "entrega" ? "Entrega" : "Retirada"}: {formatDay(o.schedule.date)}, {o.schedule.slotLabel}</strong> : null}
                                        {o.schedule ? <br /> : null}
                                        Pedido em {formatDateTime(o.createdAt)}
                                    </span>
                                    <span className="text-right text-sm font-semibold text-caramel sm:text-left">{o.totalCents != null ? brl(o.totalCents) : "a definir"}</span>
                                    <OrderStatusBadge status={o.status} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {data && pages > 1 && (
                <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Paginação">
                    <button type="button" className={btnLine} disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Anterior</button>
                    <span className="text-sm text-taupe">Página {filters.page} de {pages}</span>
                    <button type="button" className={btnLine} disabled={filters.page >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Próxima</button>
                </nav>
            )}

            {open && <OrderDetail code={open} call={call} onClose={() => setOpen(null)} onChanged={() => setTick((t) => t + 1)} />}
        </section>
    );
}

function Products({ call, canWrite }) {
    const [list, setList] = useState(null);
    const [error, setError] = useState(null);
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        const c = new AbortController();
        call("/api/admin/products", { signal: c.signal }).then((d) => setList(d.products)).catch((e) => !isAbort(e) && setError(e.message));
        return () => c.abort();
    }, [call]);

    const save = async (p, patch) => {
        setSaving(p.id);
        setError(null);
        try {
            const d = await call(`/api/admin/products/${p.id}`, { method: "PATCH", body: patch });
            setList((l) => l.map((x) => (x.id === p.id ? { ...x, ...d.product } : x)));
            setDrafts((s) => { const n = { ...s }; delete n[p.id]; return n; });
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(null);
        }
    };
    const parse = (v) => {
        if (v === "" || v == null) return null;
        const n = Math.round(Number(String(v).replace(",", ".")) * 100);
        return Number.isFinite(n) && n >= 0 ? n : undefined;
    };

    return (
        <section aria-label="Produtos">
            <p className="text-sm text-taupe">Defina o preço e a disponibilidade. O site e a validação dos pedidos usam estes valores. Sem preço, o pedido fica com total "a confirmar".</p>
            {!canWrite && <p className="mt-2 text-sm font-semibold text-caramel">Seu perfil só permite consultar produtos.</p>}
            <div className="mt-3"><ErrorBox testid="admin-products-error">{error}</ErrorBox></div>
            {!list && !error && <p className="py-8 text-center text-sm text-taupe">Carregando…</p>}
            {list && (
                <ul className="mt-4 divide-y divide-chocolate/10 rounded-3xl border border-chocolate/15 bg-white/60" data-testid="admin-products">
                    {list.map((p) => {
                        const draft = drafts[p.id] ?? (p.priceCents != null ? (p.priceCents / 100).toFixed(2).replace(".", ",") : "");
                        const parsed = parse(draft);
                        const changed = parsed !== undefined && parsed !== p.priceCents;
                        return (
                            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                                <span className="min-w-[10rem] flex-1 text-sm font-semibold text-chocolate">{p.name}</span>
                                <label className="flex items-center gap-2 text-sm">
                                    <span className="text-taupe">R$</span>
                                    <input aria-label={`Preço de ${p.name}`} inputMode="decimal" disabled={!canWrite} value={draft} placeholder="sob consulta" onChange={(e) => setDrafts((s) => ({ ...s, [p.id]: e.target.value }))} className={`${field} w-28`} data-testid={`admin-price-${p.id}`} aria-invalid={parsed === undefined} />
                                </label>
                                <button type="button" disabled={!canWrite || !changed || saving === p.id} onClick={() => save(p, { priceCents: parsed })} className={btnDark} data-testid={`admin-save-${p.id}`}>Salvar preço</button>
                                <label className="flex min-h-[44px] items-center gap-2 text-sm">
                                    <input type="checkbox" className="h-5 w-5" disabled={!canWrite || saving === p.id} checked={p.available} onChange={(e) => save(p, { available: e.target.checked })} />
                                    Disponível
                                </label>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Schedule({ call, canEdit }) {
    const [data, setData] = useState(null);
    const [form, setForm] = useState(null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const ctrl = new AbortController();
        call("/api/admin/schedule", { signal: ctrl.signal })
            .then((d) => { setData(d); setForm(d.settings); setError(null); })
            .catch((e) => { if (!isAbort(e)) setError(e.message); });
        return () => ctrl.abort();
    }, [call, tick]);

    if (error && !form) return <div><ErrorBox testid="admin-schedule-error">{error}</ErrorBox><button type="button" className={`${btnLine} mt-2`} onClick={() => setTick((t) => t + 1)}>Tentar novamente</button></div>;
    if (!form) return <p className="py-10 text-center text-sm text-taupe">Carregando agenda…</p>;

    const patch = (p) => { setForm((f) => ({ ...f, ...p })); setSaved(false); };
    const num = (v) => (v === "" ? "" : Number(v));
    const toggleDay = (d) => patch({ openWeekdays: form.openWeekdays.includes(d) ? form.openWeekdays.filter((x) => x !== d) : [...form.openWeekdays, d].sort() });
    const setSlot = (i, p) => patch({ slots: form.slots.map((s, j) => (j === i ? { ...s, ...p } : s)) });

    const save = async (ev) => {
        ev.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const d = await call("/api/admin/schedule", { method: "PUT", body: form });
            setData(d);
            setForm(d.settings);
            setSaved(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const dis = !canEdit || saving;
    return (
        <section aria-label="Agenda de retirada e entrega" data-testid="admin-schedule">
            {!canEdit && <p className="mb-4 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-caramel">Somente o proprietário pode alterar as regras da agenda. Você pode consultá-las.</p>}
            <form onSubmit={save} className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label htmlFor="sc-lead" className="text-sm font-semibold text-chocolate">Antecedência mínima (dias)</label>
                        <input id="sc-lead" type="number" min="0" max="60" value={form.minLeadDays} disabled={dis} onChange={(e) => patch({ minLeadDays: num(e.target.value) })} className={field} data-testid="sc-lead" />
                    </div>
                    <div>
                        <label htmlFor="sc-max" className="text-sm font-semibold text-chocolate">Agendar até (dias à frente)</label>
                        <input id="sc-max" type="number" min="1" max="180" value={form.maxAdvanceDays} disabled={dis} onChange={(e) => patch({ maxAdvanceDays: num(e.target.value) })} className={field} />
                    </div>
                    <div>
                        <label htmlFor="sc-limit" className="text-sm font-semibold text-chocolate">Pedidos por dia</label>
                        <input id="sc-limit" type="number" min="1" max="500" value={form.dailyLimit ?? ""} disabled={dis || form.dailyLimit === null} onChange={(e) => patch({ dailyLimit: num(e.target.value) })} className={field} data-testid="sc-limit" />
                        <label className="mt-1.5 flex min-h-[44px] items-center gap-2 text-sm text-taupe">
                            <input type="checkbox" className="h-5 w-5" checked={form.dailyLimit === null} disabled={dis} onChange={(e) => patch({ dailyLimit: e.target.checked ? null : 10 })} data-testid="sc-nolimit" /> Sem limite
                        </label>
                    </div>
                </div>

                <fieldset>
                    <legend className="text-sm font-semibold text-chocolate">Dias de atendimento</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {WEEKDAY_NAMES.map((n, d) => (
                            <button key={n} type="button" disabled={dis} aria-pressed={form.openWeekdays.includes(d)} onClick={() => toggleDay(d)} data-testid={`sc-day-${d}`}
                                className={`min-h-[44px] min-w-[56px] rounded-full border px-4 text-sm ${form.openWeekdays.includes(d) ? "border-chocolate bg-chocolate text-cream" : "border-chocolate/30 text-chocolate"}`}>{n}</button>
                        ))}
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-sm font-semibold text-chocolate">Faixas de horário</legend>
                    <ul className="mt-2 grid gap-2">
                        {form.slots.map((s, i) => (
                            <li key={i} className="flex flex-wrap items-center gap-2">
                                <label className="sr-only" htmlFor={`sc-s${i}`}>Início da faixa {i + 1}</label>
                                <input id={`sc-s${i}`} type="time" value={s.start} disabled={dis} onChange={(e) => setSlot(i, { start: e.target.value })} className={`${field} w-36`} />
                                <span aria-hidden="true">às</span>
                                <label className="sr-only" htmlFor={`sc-e${i}`}>Fim da faixa {i + 1}</label>
                                <input id={`sc-e${i}`} type="time" value={s.end} disabled={dis} onChange={(e) => setSlot(i, { end: e.target.value })} className={`${field} w-36`} />
                                <button type="button" disabled={dis || form.slots.length <= 1} onClick={() => patch({ slots: form.slots.filter((_, j) => j !== i) })} className={btnLine} aria-label={`Remover faixa ${i + 1}`}><X size={16} aria-hidden="true" /></button>
                            </li>
                        ))}
                    </ul>
                    <button type="button" disabled={dis || form.slots.length >= 8} onClick={() => patch({ slots: [...form.slots, { start: "09:00", end: "12:00" }] })} className={`${btnLine} mt-2`} data-testid="sc-add-slot"><Plus size={16} aria-hidden="true" /> Adicionar faixa</button>
                </fieldset>

                <fieldset>
                    <legend className="text-sm font-semibold text-chocolate">Datas fechadas (feriados e folgas)</legend>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label htmlFor="sc-closed" className="sr-only">Nova data fechada</label>
                        <input id="sc-closed" type="date" value={newDate} disabled={dis} onChange={(e) => setNewDate(e.target.value)} className={`${field} w-48`} data-testid="sc-closed-input" />
                        <button type="button" disabled={dis || !newDate || form.closedDates.includes(newDate)} onClick={() => { patch({ closedDates: [...form.closedDates, newDate].sort() }); setNewDate(""); }} className={btnLine} data-testid="sc-closed-add"><Plus size={16} aria-hidden="true" /> Fechar data</button>
                    </div>
                    {form.closedDates.length === 0 ? <p className="mt-2 text-sm text-taupe">Nenhuma data fechada.</p> : (
                        <ul className="mt-2 flex flex-wrap gap-2" data-testid="sc-closed-list">
                            {form.closedDates.map((d) => (
                                <li key={d} className="inline-flex items-center gap-1 rounded-full bg-oat px-3 py-1 text-sm">
                                    {formatDay(d)}
                                    <button type="button" disabled={dis} onClick={() => patch({ closedDates: form.closedDates.filter((x) => x !== d) })} aria-label={`Reabrir ${formatDay(d)}`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-cream"><X size={14} aria-hidden="true" /></button>
                                </li>
                            ))}
                        </ul>
                    )}
                </fieldset>

                <ErrorBox testid="admin-schedule-save-error">{error}</ErrorBox>
                {saved && <p role="status" className="text-sm font-semibold text-moss-dark" data-testid="sc-saved">Regras salvas.</p>}
                {canEdit && <div><button type="submit" disabled={saving} className={btnDark} data-testid="sc-save">{saving ? "Salvando…" : "Salvar regras"}</button></div>}
            </form>

            <h3 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Próximos 15 dias</h3>
            <ul className="divide-y divide-chocolate/10 overflow-hidden rounded-3xl border border-chocolate/15 bg-white/60 text-sm" data-testid="sc-load">
                {data.load.map((d) => (
                    <li key={d.date} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span className={d.closed ? "text-taupe" : "text-chocolate"}>{formatDay(d.date)}</span>
                        <span className={d.closed ? "text-taupe" : "font-semibold text-chocolate"}>{d.closed ? "Fechado" : `${d.orders}${d.limit != null ? ` de ${d.limit}` : ""} pedido${d.orders === 1 && d.limit == null ? "" : "s"}`}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function AdminApp() {
    usePageMeta({ title: "Administração — DoceVida", description: "Área restrita." });
    const [session, setSession] = useState(undefined); // undefined = verificando; null = deslogado
    const [tab, setTab] = useState("orders");
    const [statuses, setStatuses] = useState([]);
    const csrf = useRef(null);

    // robots: a área administrativa não deve ser indexada
    useEffect(() => {
        const m = document.createElement("meta");
        m.name = "robots";
        m.content = "noindex,nofollow";
        document.head.appendChild(m);
        return () => m.remove();
    }, []);

    const call = useCallback(async (path, opts = {}) => {
        try {
            return await request(path, { ...opts, csrf: csrf.current });
        } catch (e) {
            if (e.status === 401) { csrf.current = null; setSession(null); }
            throw e;
        }
    }, []);

    useEffect(() => {
        const c = new AbortController();
        request("/api/admin/session", { signal: c.signal })
            .then((d) => { csrf.current = d.csrfToken || null; setSession(d.admin); })
            .catch((e) => { if (!isAbort(e)) setSession(null); });
        return () => c.abort();
    }, []);

    const onLogin = (d) => { csrf.current = d.csrfToken; setSession(d.admin); };
    const logout = async () => {
        try { await call("/api/admin/logout", { method: "POST" }); } catch { /* sessão já inválida */ }
        csrf.current = null;
        setSession(null);
    };
    const canWrite = useMemo(() => session?.permissions?.includes("products:write"), [session]);
    const canSchedule = useMemo(() => session?.permissions?.includes("settings:write"), [session]);

    if (session === undefined) return <div className="grid min-h-screen place-items-center text-taupe"><Loader2 className="animate-spin motion-reduce:animate-none" aria-label="Carregando" /></div>;
    if (!session) return <Login onLogin={onLogin} />;

    return (
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6" data-testid="admin-app">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl text-chocolate sm:text-3xl">Administração DoceVida</h1>
                    <p className="text-xs text-taupe">Conectado como {session.username} ({session.role === "owner" ? "proprietário" : "atendimento"})</p>
                </div>
                <button type="button" onClick={logout} className={btnLine} data-testid="admin-logout"><LogOut size={16} aria-hidden="true" /> Sair</button>
            </header>
            <div role="tablist" aria-label="Seções" className="mt-5 flex gap-2 border-b border-chocolate/15">
                {[["orders", "Pedidos"], ["schedule", "Agenda"], ["products", "Produtos e preços"]].map(([id, label]) => (
                    <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)} data-testid={`admin-tab-${id}`} className={`min-h-[44px] rounded-t-xl px-4 text-sm font-semibold ${tab === id ? "border-b-2 border-chocolate text-chocolate" : "text-taupe hover:text-chocolate"}`}>{label}</button>
                ))}
            </div>
            <div className="mt-5" role="tabpanel">
                {tab === "orders" ? <Orders call={call} statuses={statuses} setStatuses={setStatuses} /> : tab === "schedule" ? <Schedule call={call} canEdit={canSchedule} /> : <Products call={call} canWrite={canWrite} />}
            </div>
        </div>
    );
}
