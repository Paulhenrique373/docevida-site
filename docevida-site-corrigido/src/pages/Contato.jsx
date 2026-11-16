import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Copy, Info, Instagram, Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import usePageMeta from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import { SITE, isWhatsAppConfigured, whatsappUrl } from "../config/site";

const CHANNELS = [
    {
        icon: MessageCircle,
        label: "WhatsApp",
        key: "whatsapp",
        pending: "Número em configuração",
    },
    {
        icon: Instagram,
        label: "Instagram",
        key: "instagram",
        pending: "Em breve",
    },
    {
        icon: Mail,
        label: "E-mail",
        key: "email",
        pending: "Em configuração",
    },
    {
        icon: Clock,
        label: "Horário de atendimento",
        key: "hours",
        pending: "Em configuração",
    },
];

export default function Contato() {
    usePageMeta({
        title: "Contato — DoceVida",
        description: "Vamos conversar? Fale com a DoceVida — Chocolates Artesanais.",
    });

    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [copied, setCopied] = useState(false);

    const message = useMemo(() => {
        const lines = [`Olá, DoceVida! Meu nome é ${nome || "..."}.`];
        if (telefone) lines.push(`Telefone: ${telefone}`);
        lines.push("", mensagem || "Gostaria de saber mais sobre os doces.");
        return lines.join("\n");
    }, [nome, telefone, mensagem]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            toast.success("Mensagem copiada!");
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error("Não foi possível copiar. Selecione o texto manualmente.");
        }
    };

    return (
        <div className="pt-32 sm:pt-36">
            <header className="mx-auto max-w-7xl px-5 sm:px-8">
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold"
                >
                    Contato
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 }}
                    className="mt-4 font-serif text-5xl text-chocolate sm:text-6xl"
                    data-testid="contato-title"
                >
                    Vamos <em className="italic text-caramel">conversar?</em>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.16 }}
                    className="mt-4 max-w-xl leading-relaxed text-taupe"
                >
                    Escolha um canal ou deixe sua mensagem — a DoceVida responde com carinho.
                </motion.p>
            </header>

            <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {CHANNELS.map((c, i) => {
                        const value = SITE.contact[c.key];
                        return (
                            <Reveal key={c.key} delay={i * 0.06}>
                                <div className="h-full rounded-3xl border border-chocolate/10 bg-cream p-7 transition-colors duration-500 hover:bg-oat" data-testid={`contact-card-${c.key}`}>
                                    <span className="grid h-12 w-12 place-items-center rounded-full bg-oat text-caramel">
                                        <c.icon size={22} strokeWidth={1.6} aria-hidden="true" />
                                    </span>
                                    <h2 className="mt-5 font-serif text-xl text-chocolate">{c.label}</h2>
                                    {value ? (
                                        <p className="mt-2 text-sm text-taupe">{c.key === "instagram" ? (
                                                <a href={value} target="_blank" rel="noopener noreferrer" className="underline decoration-gold underline-offset-4">
                                                    {SITE.contact.instagramHandle}
                                                </a>
                                            ) : c.key === "whatsapp" ? (
                                                "Canal oficial ativo"
                                            ) : (
                                                value
                                            )}</p>
                                    ) : (
                                        <p className="pending-chip mt-3">
                                            <Info size={13} aria-hidden="true" /> {c.pending}
                                        </p>
                                    )}
                                </div>
                            </Reveal>
                        );
                    })}
                </div>

                <Reveal>
                    <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-3xl bg-oat p-8 sm:flex-row sm:items-center" data-testid="contact-form-card">
                        <div>
                            <h2 className="font-serif text-2xl text-chocolate">Preferência dos nossos clientes</h2>
                            <p className="mt-1 text-sm text-taupe">Conte o que você mais gosta: sua opinião ajuda a escolher os próximos sabores.</p>
                        </div>
                        <a
                            href={SITE.contact.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel"
                        >
                            RESPONDER FORMULÁRIO
                        </a>
                    </div>
                </Reveal>

                <div className="mt-10 grid gap-10 lg:grid-cols-2">
                    <Reveal>
                        <div className="h-full rounded-[2rem] bg-chocolate p-8 text-cream sm:p-10" data-testid="contact-fale-card">
                            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Fale com a DoceVida</h2>
                            <p className="mt-4 text-cream/70">
                                Quer fazer um pedido? Monte-o direto pelo site — adicione seus doces ao carrinho e finalize
                                pelo WhatsApp.
                            </p>
                            {isWhatsAppConfigured() ? (
                                <a
                                    href={whatsappUrl(`Olá, DoceVida! Gostaria de fazer um pedido.`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-testid="contact-fale-btn"
                                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-semibold tracking-[0.15em] text-cocoa transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream"
                                >
                                    <Send size={16} aria-hidden="true" /> FALE COM A DOCEVIDA
                                </a>
                            ) : (
                                <p className="mt-8 inline-flex items-start gap-3 rounded-2xl border border-cream/20 bg-cream/5 p-5 text-sm leading-relaxed text-cream/75" data-testid="contact-pending-note">
                                    <Info size={17} className="mt-0.5 shrink-0 text-gold-soft" aria-hidden="true" />
                                    O WhatsApp oficial ainda não foi configurado. Este botão será ativado assim que o número for
                                    definido — sem inventar contatos.
                                </p>
                            )}
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <form
                            className="h-full rounded-[2rem] border border-chocolate/10 bg-cream p-8 sm:p-10"
                            onSubmit={(e) => e.preventDefault()}
                            data-testid="contact-form"
                        >
                            <h2 className="font-serif text-3xl text-chocolate">Deixe sua mensagem</h2>
                            <p className="mt-2 text-sm text-taupe">Sua mensagem será enviada pelo WhatsApp da DoceVida.</p>
                            <div className="mt-7 grid gap-4">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Nome</span>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        placeholder="Seu nome"
                                        data-testid="contact-input-nome"
                                        className="w-full rounded-xl border border-chocolate/15 bg-white/70 px-4 py-3 text-sm text-chocolate placeholder:text-taupe/60 focus:border-gold"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Telefone</span>
                                    <input
                                        type="tel"
                                        value={telefone}
                                        onChange={(e) => setTelefone(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        data-testid="contact-input-telefone"
                                        className="w-full rounded-xl border border-chocolate/15 bg-white/70 px-4 py-3 text-sm text-chocolate placeholder:text-taupe/60 focus:border-gold"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-chocolate/70">Mensagem</span>
                                    <textarea
                                        value={mensagem}
                                        onChange={(e) => setMensagem(e.target.value)}
                                        placeholder="Escreva sua mensagem..."
                                        rows={4}
                                        data-testid="contact-input-mensagem"
                                        className="w-full resize-none rounded-xl border border-chocolate/15 bg-white/70 px-4 py-3 text-sm text-chocolate placeholder:text-taupe/60 focus:border-gold"
                                    />
                                </label>
                            </div>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                {isWhatsAppConfigured() ? (
                                    <a
                                        href={whatsappUrl(message)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        data-testid="contact-send-btn"
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-moss py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-moss-dark"
                                    >
                                        <Send size={16} /> ENVIAR PELO WHATSAPP
                                    </a>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        data-testid="contact-send-pending"
                                        className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-chocolate/10 py-3.5 text-sm font-semibold tracking-[0.15em] text-chocolate/50"
                                    >
                                        <Send size={16} /> ENVIAR PELO WHATSAPP
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    data-testid="contact-copy-btn"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-chocolate/25 px-6 py-3.5 text-sm font-semibold tracking-[0.15em] text-chocolate transition-colors hover:border-chocolate hover:bg-oat"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "COPIADA" : "COPIAR MENSAGEM"}
                                </button>
                            </div>
                        </form>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}
