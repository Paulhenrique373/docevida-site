import { motion } from "framer-motion";
import { HeartHandshake, Leaf, Recycle, Scale, Users } from "lucide-react";
import usePageMeta from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import { IMG } from "../config/images";

const ACTIONS = [
    {
        icon: Leaf,
        title: "Embalagens responsáveis",
        text: "A DoceVida passou a utilizar forminhas e embalagens biodegradáveis.",
    },
    {
        icon: HeartHandshake,
        title: "Fornecedores locais",
        text: "Priorizar insumos locais e parcerias com pequenos produtores.",
    },
    {
        icon: Recycle,
        title: "Menos desperdício",
        text: "O projeto busca otimizar a receita e reduzir desperdícios durante a produção.",
    },
];

const COMMITMENT = [
    { icon: Leaf, title: "Ambiental", text: "80% de ingredientes orgânicos e 50% menos plástico." },
    { icon: Users, title: "Social", text: "Comércio justo e apoio aos agricultores locais." },
    { icon: Scale, title: "Governança", text: "Transparência, ética e compromisso com os ODS 2, 8, 12 e 15 da ONU." },
];

const ODS = [
    {
        code: "ODS 2",
        name: "Fome Zero e Agricultura Sustentável",
        text: "Apoio aos agricultores locais e ingredientes orgânicos conectam a DoceVida ao ODS 2 — fome zero e agricultura sustentável.",
    },
    {
        code: "ODS 12",
        name: "Consumo e Produção Responsáveis",
        text: "A iniciativa da DoceVida com embalagens e produção consciente se relaciona ao ODS 12 — consumo e produção responsáveis.",
    },
    {
        code: "ODS 8",
        name: "Trabalho Decente e Crescimento Econômico",
        text: "As parcerias com pequenos produtores se relacionam ao ODS 8 — trabalho decente e crescimento econômico.",
    },
    {
        code: "ODS 15",
        name: "Vida Terrestre",
        text: "O compromisso de reduzir plástico e priorizar ingredientes orgânicos se relaciona ao ODS 15 — vida terrestre.",
    },
];

export default function Sustentabilidade() {
    usePageMeta({
        title: "Sustentabilidade — DoceVida",
        description: "Doce para você. Cuidado com o futuro — embalagens responsáveis, fornecedores locais e menos desperdício.",
    });

    return (
        <div className="pt-32 sm:pt-36">
            <header className="mx-auto max-w-7xl px-5 sm:px-8">
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold"
                >
                    Sustentabilidade
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 }}
                    className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-chocolate sm:text-6xl"
                    data-testid="sustentabilidade-title"
                >
                    Doce para você. <em className="italic text-moss">Cuidado com o futuro.</em>
                </motion.h1>
            </header>

            <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
                <Reveal>
                    <img
                        src={IMG.sustainabilityNature}
                        alt="Imagem ilustrativa: doces em forminhas com folhas"
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-3xl object-cover"
                    />
                </Reveal>
                <div className="space-y-6">
                    {ACTIONS.map((a, i) => (
                        <Reveal key={a.title} delay={0.08 + i * 0.07}>
                            <div className="flex items-start gap-5 rounded-3xl border border-chocolate/10 bg-cream p-7 transition-colors duration-500 hover:bg-moss-light" data-testid={`sust-action-${i}`}>
                                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-moss-light text-moss">
                                    <a.icon size={22} strokeWidth={1.6} aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="font-serif text-2xl text-chocolate">{a.title}</h2>
                                    <p className="mt-2 leading-relaxed text-taupe">{a.text}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <section aria-labelledby="compromisso-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28" data-testid="compromisso-section">
                <Reveal>
                    <h2 id="compromisso-title" className="font-serif text-4xl text-chocolate sm:text-5xl">Nosso compromisso</h2>
                </Reveal>
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {COMMITMENT.map((c, i) => (
                        <Reveal key={c.title} delay={i * 0.08}>
                            <div className="h-full rounded-3xl bg-oat p-8" data-testid={`compromisso-${i}`}>
                                <c.icon size={26} strokeWidth={1.5} className="text-caramel" aria-hidden="true" />
                                <h3 className="mt-5 font-serif text-2xl text-chocolate">{c.title}</h3>
                                <p className="mt-2 leading-relaxed text-taupe">{c.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <section aria-labelledby="ods-title" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
                <Reveal>
                    <div className="grain rounded-[2.5rem] bg-moss p-8 text-cream lg:p-14">
                        <h2 id="ods-title" className="max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
                            Compromisso com os Objetivos de Desenvolvimento Sustentável
                        </h2>
                        <div className="mt-10 grid gap-6 md:grid-cols-2">
                            {ODS.map((o, i) => (
                                <Reveal key={o.code} delay={i * 0.1}>
                                    <div className="h-full rounded-3xl border border-cream/20 bg-cream/5 p-8" data-testid={`ods-card-${o.code.toLowerCase().replace(/\s+/g, "-")}`}>
                                        <p className="inline-flex rounded-full border border-cream/30 px-3.5 py-1.5 text-xs font-semibold tracking-[0.2em] text-gold-soft">
                                            {o.code}
                                        </p>
                                        <h3 className="mt-4 font-serif text-2xl">{o.name}</h3>
                                        <p className="mt-3 text-sm leading-relaxed text-cream/75">{o.text}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </Reveal>
            </section>
        </div>
    );
}
