import { motion } from "framer-motion";
import usePageMeta from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import { IMG } from "../config/images";
import { TEAM } from "../data/team";

const AVATAR_TONES = ["bg-gold-soft text-caramel", "bg-moss-light text-moss-dark", "bg-oat text-chocolate"];

const VALUES = [
    {
        title: "Cuidado em cada etapa",
        text: "Do preparo à embalagem, cada doce é feito à mão, com atenção aos detalhes que fazem diferença.",
    },
    {
        title: "Sabor que abraça",
        text: "O sabor é o coração da DoceVida — preservar o sabor marcante do Doce de Ninho.",
    },
    {
        title: "Qualidade sem atalhos",
        text: "Ingredientes e preparo valorizados, com o ponto artesanal que dá textura e cremosidade a cada colherada.",
    },
    {
        title: "Perto de você",
        text: "A DoceVida nasce da proximidade com quem prova: doces pensados para tornar momentos especiais ainda mais.",
    },
];

export default function Historia() {
    usePageMeta({
        title: "Nossa História — DoceVida",
        description: "Mais que doces. Histórias feitas à mão — cuidado, sabor, qualidade e produção artesanal.",
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
                    Nossa história
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 }}
                    className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-chocolate sm:text-6xl"
                    data-testid="historia-title"
                >
                    Mais que doces. <em className="italic text-caramel">Histórias feitas à mão.</em>
                </motion.h1>
            </header>

            <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
                <div className="relative">
                    <Reveal>
                        <img
                            src={IMG.storyKitchen}
                            alt="Imagem ilustrativa: cozinha artesanal"
                            loading="lazy"
                            className="aspect-[4/3] w-full rounded-3xl object-cover"
                        />
                    </Reveal>
                    <Reveal delay={0.15} className="absolute -bottom-10 right-4 hidden w-56 sm:block">
                        <img
                            src={IMG.handsArtisan}
                            alt="Imagem ilustrativa: mãos enrolando doces"
                            loading="lazy"
                            className="aspect-square w-full rounded-3xl border-4 border-cream object-cover shadow-xl"
                        />
                    </Reveal>
                </div>
                <div className="lg:pl-6">
                    <Reveal delay={0.1}>
                        <p className="text-lg leading-relaxed text-taupe">
                            Somos a DoceVida, uma pequena empresa apaixonada pelo que faz. Produzimos chocolates artesanais
                            de alta qualidade, com ingredientes orgânicos e sustentáveis. Na DoceVida, cada bombom é enrolado
                            à mão e feito com carinho!
                        </p>
                    </Reveal>
                    <div className="mt-10 grid gap-8 sm:grid-cols-2">
                        {VALUES.map((v, i) => (
                            <Reveal key={v.title} delay={0.1 + i * 0.07}>
                                <div className="border-t border-chocolate/15 pt-5" data-testid={`historia-value-${i}`}>
                                    <h2 className="font-serif text-xl text-chocolate">{v.title}</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-taupe">{v.text}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section aria-label="Logo da DoceVida" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28" data-testid="historia-logo">
                <Reveal>
                    <div className="mx-auto max-w-3xl rounded-[2.5rem] bg-[#FBF3DE] p-6 text-center sm:p-10">
                        <img
                            src="/logo.png"
                            width="860"
                            height="665"
                            alt="Logo da DoceVida — Chocolates Artesanais, com a coelhinha segurando uma barra de chocolate"
                            loading="lazy"
                            className="mx-auto h-auto w-full max-w-xl"
                        />
                    </div>
                </Reveal>
            </section>

            <section aria-labelledby="missao-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28" data-testid="missao-section">
                <Reveal>
                    <div className="rounded-[2.5rem] bg-oat p-8 sm:p-12 lg:p-16">
                        <h2 id="missao-title" className="font-serif text-4xl text-chocolate sm:text-5xl">Nossa missão</h2>
                        <p className="mt-5 max-w-3xl font-serif text-2xl leading-relaxed text-chocolate/90 sm:text-3xl">
                            Criar produtos deliciosos que satisfaçam o paladar, mas que também promovam a sustentabilidade e a
                            responsabilidade social.
                        </p>
                    </div>
                </Reveal>
            </section>

            <section aria-labelledby="equipe-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28" data-testid="equipe-section">
                <Reveal>
                    <h2 id="equipe-title" className="max-w-2xl font-serif text-4xl leading-tight text-chocolate sm:text-5xl">
                        As pessoas por trás de cada doce
                    </h2>
                    <p className="mt-4 max-w-xl text-lg leading-relaxed text-taupe">
                        Cada uma cuida de uma parte da DoceVida, da cozinha ao financeiro, para o doce chegar até você do jeito certo.
                    </p>
                </Reveal>

                <ul className="mt-12 border-t border-chocolate/15">
                    {TEAM.map((m, i) => (
                        <li key={m.name} className="border-b border-chocolate/15" data-testid={`equipe-member-${i}`}>
                            <Reveal delay={0.04} y={16}>
                                <div className="grid gap-4 py-7 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center md:gap-10">
                                    <div className="flex items-center gap-4">
                                        <span
                                            aria-hidden="true"
                                            className={`grid h-14 w-14 shrink-0 place-items-center rounded-full font-serif text-2xl ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                                        >
                                            {m.name.charAt(0)}
                                        </span>
                                        <div>
                                            <h3 className="font-serif text-2xl text-chocolate">{m.name}</h3>
                                            <p className="text-sm font-medium text-caramel">{m.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-base leading-relaxed text-taupe">{m.text}</p>
                                </div>
                            </Reveal>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-label="Ingredientes e preparo" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
                <Reveal>
                    <img
                        src={IMG.ingredientsFlatlay}
                        alt="Imagem ilustrativa: ingredientes sobre tecido claro"
                        loading="lazy"
                        className="aspect-[21/9] w-full rounded-3xl object-cover"
                    />
                </Reveal>
            </section>
        </div>
    );
}
