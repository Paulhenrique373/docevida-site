import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Candy, Check, Copy, Info, Loader2, Minus, Plus, RefreshCw, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { centsOf, getFulfillmentInfo } from "../data/products";
import { SITE, fulfillmentOptions, isWhatsAppConfigured, whatsappUrl } from "../config/site";
import { isAbort, request } from "../lib/api";
import { brl, formatDay, maskPhone } from "../lib/format";
import { clearIdempotencyKey, idempotencyKeyFor, rememberOrder } from "../lib/orderStore";
import { useCatalogVersion } from "../hooks/useCatalog";
import ProductImage from "./ProductImage";
import OrderStatusBadge from "./OrderStatusBadge";

const CONTACT_OPTIONS = [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "instagram", label: "Instagram" },
    { id: "email", label: "E-mail" },
];

const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70";
const inputCls =
    "w-full rounded-xl border border-chocolate/20 bg-white/80 px-4 py-3 text-base text-chocolate placeholder:text-taupe/70 focus:border-gold aria-[invalid=true]:border-[#7A1F14] aria-[invalid=true]:bg-[#FDF3F1]";
const btnPrimary =
    "flex w-full items-center justify-center gap-2 rounded-full bg-chocolate py-4 text-sm font-semibold tracking-[0.15em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-caramel disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const btnSecondary =
    "flex w-full items-center justify-center gap-2 rounded-full border border-chocolate/30 py-4 text-sm font-semibold tracking-[0.15em] text-chocolate transition-colors hover:border-chocolate hover:bg-oat disabled:opacity-60";

function FieldError({ id, children }) {
    if (!children) return null;
    return (
        <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-[#7A1F14]">
            <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
            {children}
        </p>
    );
}

export default function OrderModal() {
    useCatalogVersion();
    const reduce = useReducedMotion();
    const { orderOpen, setOrderOpen } = useUI();
    const { items, setQty, remove, clear } = useCart();
    const navigate = useNavigate();
    const options = fulfillmentOptions();

    const [step, setStep] = useState("form"); // form | review | success
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [obs, setObs] = useState("");
    const [contato, setContato] = useState("whatsapp");
    const [modalidade, setModalidade] = useState(options[0]?.id || "retirada");
    const [endereco, setEndereco] = useState("");
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [result, setResult] = useState(null); // { order, token }
    const [copied, setCopied] = useState(null);
    const [agenda, setAgenda] = useState({ status: "loading", data: null, message: "" });
    const [agendaTick, setAgendaTick] = useState(0);
    const [dia, setDia] = useState("");
    const [faixa, setFaixa] = useState("");
    const headingRef = useRef(null);
    const dialogRef = useRef(null);
    const lastFocus = useRef(null);

    const fee = getFulfillmentInfo();
    const allPriced = items.length > 0 && items.every((i) => i.price != null);
    const subtotalCents = allPriced ? items.reduce((s, i) => s + centsOf(i.price) * i.qty, 0) : null;
    const feeCents = modalidade === "retirada" ? 0 : fee.entrega?.feeCents ?? null;
    const totalCents = subtotalCents != null && feeCents != null ? subtotalCents + feeCents : null;

    // Foco: ao abrir devolve o foco ao fechar; a cada etapa move o foco para o título.
    useEffect(() => {
        if (!orderOpen) return undefined;
        toast.dismiss(); // avisos antigos (ex.: "adicionado ao carrinho") não devem cobrir o formulário
        lastFocus.current = document.activeElement;
        const onKey = (e) => {
            if (e.key === "Escape") setOrderOpen(false);
            if (e.key === "Tab" && dialogRef.current) {
                const f = dialogRef.current.querySelectorAll('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])');
                if (!f.length) return;
                const first = f[0];
                const last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            lastFocus.current?.focus?.();
        };
    }, [orderOpen, setOrderOpen]);

    useEffect(() => {
        if (!orderOpen) return;
        // Cada etapa começa no topo (a tela de sucesso herdava a rolagem do formulário).
        dialogRef.current?.querySelector("[data-lenis-prevent]")?.scrollTo?.(0, 0);
        headingRef.current?.focus({ preventScroll: true });
    }, [orderOpen, step]);

    // Datas e horários disponíveis vêm do servidor (antecedência, dias de atendimento, limite diário).
    useEffect(() => {
        if (!orderOpen) return undefined;
        const ctrl = new AbortController();
        setAgenda((a) => ({ ...a, status: "loading" }));
        request("/api/schedule", { signal: ctrl.signal, timeoutMs: 10000 })
            .then((data) => {
                setAgenda({ status: "ready", data, message: "" });
                setDia((d) => (data.days.some((x) => x.date === d && !x.full) ? d : ""));
                setFaixa((f) => (data.slots.some((x) => x.id === f) ? f : ""));
            })
            .catch((err) => {
                if (!isAbort(err)) setAgenda({ status: "error", data: null, message: err.message });
            });
        return () => ctrl.abort();
    }, [orderOpen, agendaTick]);

    // Ao reabrir após um pedido concluído, começa um novo.
    useEffect(() => {
        if (orderOpen && step === "success" && items.length > 0) {
            setStep("form");
            setResult(null);
        }
    }, [orderOpen, step, items.length]);

    const validate = () => {
        const e = {};
        if (nome.trim().length < 2) e.nome = "Informe seu nome.";
        const d = telefone.replace(/\D/g, "");
        if (!/^[1-9]{2}9?\d{8}$/.test(d)) e.telefone = "Informe um telefone válido com DDD, ex.: (11) 91234-5678.";
        if (modalidade === "entrega" && endereco.trim().length < 8) e.endereco = "Informe o endereço completo para entrega.";
        if (!dia) e.agenda = "Escolha a data.";
        else if (!faixa) e.agenda = "Escolha o horário.";
        if (obs.length > 500) e.obs = "Observações: no máximo 500 caracteres.";
        setErrors(e);
        return e;
    };

    const goReview = (ev) => {
        ev.preventDefault();
        if (items.length === 0) return;
        const e = validate();
        if (Object.keys(e).length) {
            const first = Object.keys(e)[0];
            document.getElementById(`order-field-${first}`)?.focus();
            return;
        }
        setSubmitError(null);
        setStep("review");
    };

    const payload = useMemo(
        () => ({
            customer: { name: nome.trim(), phone: telefone.replace(/\D/g, "") },
            fulfillment: modalidade,
            ...(modalidade === "entrega" ? { address: endereco.trim() } : {}),
            ...(obs.trim() ? { notes: obs.trim() } : {}),
            contactPreference: contato,
            schedule: { date: dia, slot: faixa },
            // Só id + quantidade: preços e totais são sempre calculados pelo servidor.
            items: items.map((i) => ({ productId: i.id, quantity: i.qty })),
        }),
        [nome, telefone, modalidade, endereco, obs, contato, dia, faixa, items]
    );

    const submit = async () => {
        if (sending || items.length === 0) return;
        setSending(true);
        setSubmitError(null);
        try {
            const key = idempotencyKeyFor(JSON.stringify(payload));
            const data = await request("/api/orders", { method: "POST", body: payload, headers: { "Idempotency-Key": key }, timeoutMs: 20000 });
            rememberOrder(data.order.code, data.trackingToken);
            clearIdempotencyKey();
            clear();
            setResult({ order: data.order, token: data.trackingToken });
            setStep("success");
        } catch (err) {
            if (err.status === 400 && err.fields) {
                // O servidor discordou da validação do navegador: volta ao formulário com os erros nos campos.
                const map = { name: "nome", phone: "telefone", address: "endereco", notes: "obs", schedule: "agenda" };
                const e = {};
                Object.entries(err.fields).forEach(([k, v]) => { e[map[k] || k] = v; });
                setErrors(e);
                setStep("form");
                setSubmitError({ message: err.message });
            } else if (err.status === 409 && err.code === "schedule_unavailable") {
                // A vaga acabou (ou a regra mudou) entre a escolha e o envio: atualiza as datas e volta ao formulário.
                setErrors({ agenda: err.message });
                setStep("form");
                setAgendaTick((t) => t + 1);
                setSubmitError({ message: "Não foi possível reservar essa data. Escolha outra data ou horário." });
            } else if (err.status === 409 && err.code === "idempotency_conflict") {
                clearIdempotencyKey();
                setSubmitError({ message: "Não foi possível enviar. Toque em tentar novamente.", retry: true });
            } else {
                setSubmitError({
                    message: err.uncertain
                        ? "Não recebemos a resposta do servidor, então não sabemos se o pedido foi registrado. Pode tentar novamente com segurança: não vamos criar um pedido duplicado."
                        : err.message,
                    retry: err.uncertain || err.status >= 500 || err.status === 429,
                });
            }
        } finally {
            setSending(false);
        }
    };

    const copy = async (text, what) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(what);
            toast.success("Copiado!");
            setTimeout(() => setCopied(null), 2000);
        } catch {
            toast.error("Não foi possível copiar. Selecione o texto manualmente.");
        }
    };

    const close = () => setOrderOpen(false);
    const selected = options.find((o) => o.id === modalidade);
    const title = step === "success" ? "Pedido registrado" : step === "review" ? "Revise seu pedido" : "Finalizar pedido";

    const Totals = ({ sub, feeC, total, pending }) => (
        <div className="mt-3 rounded-2xl border border-chocolate/15 px-4 py-3 text-sm" data-testid="order-totals">
            <dl className="space-y-1.5">
            <div className="flex justify-between text-taupe">
                <dt>Subtotal</dt>
                <dd data-testid="order-subtotal">{sub != null ? brl(sub) : "A confirmar"}</dd>
            </div>
            <div className="flex justify-between text-taupe">
                <dt>Entrega</dt>
                <dd data-testid="order-delivery-fee">{feeC === 0 ? "Grátis (retirada)" : feeC != null ? brl(feeC) : "A combinar"}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-chocolate/10 pt-2">
                <dt className="font-serif text-lg text-chocolate">Total</dt>
                <dd className="font-serif text-xl text-chocolate" data-testid="order-total">{total != null ? brl(total) : "A confirmar pela loja"}</dd>
            </div>
            </dl>
            {pending && (
                <p className="pt-2 text-xs text-taupe">A loja informará o valor final antes de confirmar o pedido.</p>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            {orderOpen && (
                <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.25 }}
                        onClick={close}
                        className="absolute inset-0 bg-cocoa/70 backdrop-blur-sm"
                        data-testid="order-backdrop"
                    />
                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="order-title"
                        data-testid="order-modal"
                        initial={{ opacity: 0, y: reduce ? 0 : 48, scale: reduce ? 1 : 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: reduce ? 0 : 32, scale: reduce ? 1 : 0.98 }}
                        transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-cream shadow-2xl sm:rounded-3xl"
                    >
                        <div className="flex items-center justify-between border-b border-chocolate/10 px-5 py-4 sm:px-8 sm:py-5">
                            <h2 id="order-title" ref={headingRef} tabIndex={-1} className="font-serif text-2xl text-chocolate outline-none">
                                {title}
                            </h2>
                            <button
                                type="button"
                                onClick={close}
                                data-testid="order-modal-close-btn"
                                aria-label="Fechar pedido"
                                className="grid h-11 w-11 place-items-center rounded-full text-chocolate transition-colors hover:bg-oat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {step !== "success" && items.length === 0 ? (
                            <div className="flex flex-col items-center gap-4 px-8 py-14 text-center" data-testid="order-empty-state">
                                <span className="grid h-16 w-16 place-items-center rounded-full bg-oat text-caramel">
                                    <Candy size={28} strokeWidth={1.5} />
                                </span>
                                <p className="font-serif text-2xl text-chocolate">Seu carrinho está vazio</p>
                                <p className="text-sm text-taupe">Escolha um doce para começar seu pedido.</p>
                                <button
                                    type="button"
                                    onClick={() => { close(); navigate("/produtos"); }}
                                    data-testid="order-empty-cta"
                                    className="mt-2 rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel"
                                >
                                    CONHECER PRODUTOS
                                </button>
                            </div>
                        ) : step === "success" && result ? (
                            <div className="overflow-y-auto px-5 py-6 sm:px-8" data-lenis-prevent data-testid="order-success">
                                <div role="status" className="flex flex-col items-center gap-2 text-center">
                                    <span className="grid h-14 w-14 place-items-center rounded-full bg-moss-light text-moss-dark">
                                        <Check size={26} aria-hidden="true" />
                                    </span>
                                    <p className="font-serif text-xl text-chocolate">Recebemos o seu pedido!</p>
                                    <OrderStatusBadge status={result.order.status} />
                                </div>
                                <div className="mt-5 grid gap-3 rounded-2xl bg-oat p-4 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Código do pedido</p>
                                            <p className="font-mono text-lg font-semibold text-chocolate" data-testid="order-code">{result.order.code}</p>
                                        </div>
                                        <button type="button" onClick={() => copy(result.order.code, "code")} aria-label="Copiar código do pedido" className="grid h-11 w-11 place-items-center rounded-full border border-chocolate/20 hover:bg-cream">
                                            {copied === "code" ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Chave de acompanhamento</p>
                                            <p className="break-all font-mono text-sm text-chocolate" data-testid="order-token">{result.token}</p>
                                        </div>
                                        <button type="button" onClick={() => copy(result.token, "token")} aria-label="Copiar chave de acompanhamento" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-chocolate/20 hover:bg-cream">
                                            {copied === "token" ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-taupe">Guarde o código e a chave: com eles você acompanha o pedido sem precisar de cadastro. Neste aparelho já ficam salvos.</p>
                                </div>
                                {result.order.schedule && (
                                    <p className="mt-4 rounded-xl bg-oat px-4 py-2.5 text-sm text-chocolate" data-testid="order-success-schedule">
                                        <span className="font-semibold">{result.order.fulfillment === "entrega" ? "Entrega" : "Retirada"}:</span> {formatDay(result.order.schedule.date)}, {result.order.schedule.slotLabel}
                                    </p>
                                )}
                                <ul className="mt-4 space-y-1 text-sm text-chocolate">
                                    {result.order.items.map((i) => (
                                        <li key={i.productId} className="flex justify-between gap-3">
                                            <span>{i.quantity}× {i.name}</span>
                                            <span>{i.lineTotalCents != null ? brl(i.lineTotalCents) : "—"}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Totals sub={result.order.subtotalCents} feeC={result.order.deliveryFeeCents} total={result.order.totalCents} pending={result.order.pricePending} />
                                <div className="mt-5 flex flex-col gap-3 pb-2">
                                    <button type="button" className={btnPrimary} data-testid="order-track-btn" onClick={() => { close(); navigate("/acompanhar", { state: { code: result.order.code } }); }}>
                                        ACOMPANHAR PEDIDO
                                    </button>
                                    {isWhatsAppConfigured() && (
                                        <a href={whatsappUrl(`Olá, DoceVida! Acabei de fazer o pedido ${result.order.code} pelo site.`)} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full bg-moss py-4 text-sm font-semibold tracking-[0.15em] text-cream hover:bg-moss-dark" data-testid="order-whatsapp-btn">
                                            <Send size={16} aria-hidden="true" /> AVISAR A LOJA NO WHATSAPP
                                        </a>
                                    )}
                                    <button type="button" className={btnSecondary} onClick={close}>FECHAR</button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-y-auto px-5 py-5 sm:px-8 sm:py-6" data-lenis-prevent>
                                {step === "review" ? (
                                    <div data-testid="order-review">
                                        <p className="text-sm text-taupe">Confira tudo antes de enviar. Depois do envio, a loja recebe o pedido.</p>
                                        <ul className="mt-4 space-y-1.5 text-sm text-chocolate" data-testid="order-review-items">
                                            {items.map((i) => (
                                                <li key={i.id} className="flex justify-between gap-3 rounded-xl bg-oat px-4 py-2.5">
                                                    <span>{i.qty}× {i.name}</span>
                                                    <span className="shrink-0 text-taupe">{i.price != null ? brl(centsOf(i.price) * i.qty) : "sob consulta"}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Totals sub={subtotalCents} feeC={feeCents} total={totalCents} pending={totalCents == null} />
                                        <p className="mt-1 px-1 text-xs text-taupe">Valores estimados: o servidor recalcula tudo ao registrar o pedido.</p>
                                        <dl className="mt-4 grid gap-2 rounded-2xl border border-chocolate/15 p-4 text-sm">
                                            <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Nome</dt><dd>{nome.trim()}</dd></div>
                                            <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Telefone</dt><dd>{maskPhone(telefone)}</dd></div>
                                            <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">{modalidade === "entrega" ? "Data da entrega" : "Data da retirada"}</dt><dd data-testid="order-review-schedule">{formatDay(dia)} · {agenda.data?.slots.find((x) => x.id === faixa)?.label}</dd></div>
                                            <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Recebimento</dt><dd>{selected?.label}{modalidade === "entrega" ? ` — ${endereco.trim()}` : ""}</dd></div>
                                            <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Contato preferido</dt><dd>{CONTACT_OPTIONS.find((c) => c.id === contato)?.label}</dd></div>
                                            {obs.trim() && <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-chocolate/70">Observações</dt><dd className="whitespace-pre-wrap">{obs.trim()}</dd></div>}
                                        </dl>
                                        {submitError && (
                                            <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-[#7A1F14]/40 bg-[#FDF3F1] p-4 text-sm text-[#7A1F14]" data-testid="order-submit-error">
                                                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                                                <p>{submitError.message}</p>
                                            </div>
                                        )}
                                        <p className="sr-only" role="status" aria-live="polite">{sending ? "Enviando pedido, aguarde." : ""}</p>
                                        <div className="mt-5 flex flex-col gap-3 pb-2">
                                            <p className="mb-3 text-xs text-taupe">Ao enviar, você concorda com a <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidade</a> e os <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline">Termos de Uso</a>.</p>
                                            <button type="button" onClick={submit} disabled={sending} aria-busy={sending} data-testid="order-confirm-btn" className={btnPrimary}>
                                                {sending ? <><Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> ENVIANDO…</> : submitError?.retry ? <><RefreshCw size={16} aria-hidden="true" /> TENTAR NOVAMENTE</> : <><Send size={16} aria-hidden="true" /> CONFIRMAR E ENVIAR PEDIDO</>}
                                            </button>
                                            <button type="button" onClick={() => setStep("form")} disabled={sending} data-testid="order-edit-btn" className={btnSecondary}>VOLTAR E EDITAR</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <ul className="space-y-2" data-testid="order-summary">
                                            {items.map((item) => (
                                                <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-oat px-3 py-3 sm:px-4" data-testid={`order-item-${item.id}`}>
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <ProductImage product={item} sizes="64px" className="h-11 w-14 shrink-0 rounded-xl object-cover" />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-chocolate">{item.name}</p>
                                                            <div className="mt-1 flex items-center gap-1">
                                                                <button type="button" onClick={() => setQty(item.id, item.qty - 1)} data-testid={`order-dec-${item.id}-btn`} aria-label={`Diminuir quantidade de ${item.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-chocolate/20 hover:bg-cream"><Minus size={13} /></button>
                                                                <span className="w-7 text-center text-sm font-semibold" data-testid={`order-qty-${item.id}`} aria-live="polite">{item.qty}</span>
                                                                <button type="button" onClick={() => setQty(item.id, item.qty + 1)} data-testid={`order-inc-${item.id}-btn`} aria-label={`Aumentar quantidade de ${item.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-chocolate/20 hover:bg-cream"><Plus size={13} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        {item.price != null && <p className="text-sm font-semibold text-caramel">{brl(centsOf(item.price) * item.qty)}</p>}
                                                        <button type="button" onClick={() => remove(item.id)} data-testid={`order-remove-${item.id}-btn`} aria-label={`Remover ${item.name} do pedido`} className="grid h-10 w-10 place-items-center rounded-full text-taupe hover:text-[#7A1F14]"><X size={15} /></button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <Totals sub={subtotalCents} feeC={feeCents} total={totalCents} pending={totalCents == null} />

                                        {submitError && (
                                            <div role="alert" className="mt-4 rounded-2xl border border-[#7A1F14]/40 bg-[#FDF3F1] p-4 text-sm text-[#7A1F14]">{submitError.message}</div>
                                        )}

                                        <form className="mt-6 grid gap-4" onSubmit={goReview} noValidate data-testid="order-form">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label htmlFor="order-field-nome" className={labelCls}>Nome</label>
                                                    <input id="order-field-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" data-testid="order-input-nome" autoComplete="name" maxLength={100} aria-required="true" aria-invalid={Boolean(errors.nome)} aria-describedby={errors.nome ? "err-nome" : undefined} className={inputCls} />
                                                    <FieldError id="err-nome">{errors.nome}</FieldError>
                                                </div>
                                                <div>
                                                    <label htmlFor="order-field-telefone" className={labelCls}>Telefone</label>
                                                    <input id="order-field-telefone" type="tel" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" data-testid="order-input-telefone" autoComplete="tel-national" inputMode="tel" aria-required="true" aria-invalid={Boolean(errors.telefone)} aria-describedby={errors.telefone ? "err-telefone" : undefined} className={inputCls} />
                                                    <FieldError id="err-telefone">{errors.telefone}</FieldError>
                                                </div>
                                            </div>
                                            <fieldset>
                                                <legend className={labelCls}>Receber o pedido</legend>
                                                <div className="flex flex-wrap gap-2" role="group">
                                                    {options.map((opt) => (
                                                        <button key={opt.id} type="button" onClick={() => setModalidade(opt.id)} data-testid={`order-fulfillment-${opt.id}`} aria-pressed={modalidade === opt.id} className={`min-h-[44px] rounded-full border px-5 py-2 text-sm transition-colors ${modalidade === opt.id ? "border-chocolate bg-chocolate text-cream" : "border-chocolate/30 text-chocolate hover:border-chocolate"}`}>
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-xs text-taupe">{selected?.note}</p>
                                            </fieldset>
                                            {modalidade === "entrega" && (
                                                <div>
                                                    <label htmlFor="order-field-endereco" className={labelCls}>Endereço de entrega</label>
                                                    <textarea id="order-field-endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, complemento" rows={2} maxLength={300} autoComplete="street-address" data-testid="order-input-endereco" aria-required="true" aria-invalid={Boolean(errors.endereco)} aria-describedby={errors.endereco ? "err-endereco" : undefined} className={`${inputCls} resize-none`} />
                                                    <FieldError id="err-endereco">{errors.endereco}</FieldError>
                                                </div>
                                            )}
                                            <fieldset data-testid="order-schedule">
                                                <legend className={labelCls}>{modalidade === "entrega" ? "Data da entrega" : "Data da retirada"}</legend>
                                                {agenda.status === "loading" && (
                                                    <p role="status" className="flex items-center gap-2 text-sm text-taupe">
                                                        <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Carregando datas disponíveis…
                                                    </p>
                                                )}
                                                {agenda.status === "error" && (
                                                    <div role="alert" className="rounded-2xl border border-[#7A1F14]/40 bg-[#FDF3F1] p-4 text-sm text-[#7A1F14]" data-testid="order-schedule-error">
                                                        <p>{agenda.message || "Não foi possível carregar as datas."}</p>
                                                        <button type="button" onClick={() => setAgendaTick((t) => t + 1)} className="mt-2 inline-flex min-h-[44px] items-center gap-2 font-semibold underline">
                                                            <RefreshCw size={14} aria-hidden="true" /> Tentar novamente
                                                        </button>
                                                    </div>
                                                )}
                                                {agenda.status === "ready" && (agenda.data.days.length === 0 ? (
                                                    <p className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-caramel" data-testid="order-schedule-empty">
                                                        Não há datas disponíveis no momento. Tente novamente mais tarde ou fale com a loja.
                                                    </p>
                                                ) : (
                                                    <>
                                                        <select
                                                            id="order-field-agenda"
                                                            value={dia}
                                                            onChange={(e) => setDia(e.target.value)}
                                                            data-testid="order-input-data"
                                                            aria-invalid={Boolean(errors.agenda)}
                                                            aria-describedby={errors.agenda ? "err-agenda" : undefined}
                                                            className={inputCls}
                                                        >
                                                            <option value="">Escolha uma data</option>
                                                            {agenda.data.days.map((d) => (
                                                                <option key={d.date} value={d.date} disabled={d.full}>
                                                                    {formatDay(d.date)}{d.full ? " — agenda completa" : ""}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Horário">
                                                            {agenda.data.slots.map((sl) => (
                                                                <button key={sl.id} type="button" onClick={() => setFaixa(sl.id)} aria-pressed={faixa === sl.id} data-testid={`order-slot-${sl.id}`} className={`min-h-[44px] rounded-full border px-5 py-2 text-sm transition-colors ${faixa === sl.id ? "border-chocolate bg-chocolate text-cream" : "border-chocolate/30 text-chocolate hover:border-chocolate"}`}>
                                                                    {sl.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="mt-2 text-xs text-taupe">
                                                            Encomendas com pelo menos {agenda.data.minLeadDays} dia{agenda.data.minLeadDays === 1 ? "" : "s"} de antecedência.
                                                        </p>
                                                    </>
                                                ))}
                                                <FieldError id="err-agenda">{errors.agenda}</FieldError>
                                            </fieldset>
                                            <div>
                                                <label htmlFor="order-field-obs" className={labelCls}>Observações (opcional)</label>
                                                <textarea id="order-field-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Alguma observação sobre o pedido?" rows={2} maxLength={500} data-testid="order-input-obs" aria-invalid={Boolean(errors.obs)} aria-describedby={errors.obs ? "err-obs" : undefined} className={`${inputCls} resize-none`} />
                                                <FieldError id="err-obs">{errors.obs}</FieldError>
                                            </div>
                                            <fieldset>
                                                <legend className={labelCls}>Como prefere ser contatado</legend>
                                                <div className="flex flex-wrap gap-2" role="group">
                                                    {CONTACT_OPTIONS.map((opt) => (
                                                        <button key={opt.id} type="button" onClick={() => setContato(opt.id)} data-testid={`order-contact-${opt.id}`} aria-pressed={contato === opt.id} className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors ${contato === opt.id ? "border-chocolate bg-chocolate text-cream" : "border-chocolate/30 text-chocolate hover:border-chocolate"}`}>
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </fieldset>
                                            {SITE.contact.whatsapp === "" && (
                                                <p className="flex items-start gap-2 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-xs leading-relaxed text-caramel" data-testid="order-pending-note">
                                                    <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                                                    Seu pedido será registrado no sistema da loja. Guarde o código e a chave que aparecerão ao final para acompanhá-lo.
                                                </p>
                                            )}
                                            <div className="pb-2">
                                                <button type="submit" data-testid="order-review-btn" className={btnPrimary}>REVISAR PEDIDO</button>
                                                <p className="mt-3 text-center text-xs text-taupe">
                                                    Já fez um pedido? <Link to="/acompanhar" onClick={close} className="font-semibold text-caramel underline">Acompanhar pedido</Link>
                                                </p>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
