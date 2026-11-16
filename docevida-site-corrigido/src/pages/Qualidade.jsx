import { motion } from "framer-motion";
import usePageMeta from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import { IMG } from "../config/images";

const PILLARS = [
    { title: "Enrolado à mão", text: "Nada de máquina: cada bombom é enrolado à mão e feito com carinho." },
    { title: "Ingredientes orgânicos e sustentáveis", text: "Chocolates artesanais de alta qualidade, com 80% de ingredientes orgânicos." },
    { title: "Para todos os gostos", text: "Brigadeiros, brownie, muffins, biscoitos e cookies, com opções zero açúcar e proteicas." },
    { title: "Apresentação", text: "Embalagem individual, protegida e atraente, com 50% menos plástico." },
];

export default function Qualidade() {
    usePageMeta({
        title: "Qualidade — DoceVida",
        description: "Qualidade em cada detalhe: doces enrolados à mão, ingredientes orgânicos e sustentáveis e opções zero açúcar e proteicas.",
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
                    Qualidade
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 }}
                    className="mt-4 font-serif text-5xl text-chocolate sm:text-6xl"
                    data-testid="qualidade-title"
                >
                    Qualidade em cada <em className="italic text-caramel">detalhe</em>
                </motion.h1>
            </header>

            <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
                <div className="space-y-6">
                    {PILLARS.map((p, i) => (
                        <Reveal key={p.title} delay={0.08 + i * 0.07}>
                            <div className="flex items-start gap-5 rounded-3xl border border-chocolate/10 bg-cream p-8 transition-colors duration-500 hover:bg-oat" data-testid={`qualidade-pillar-${i}`}>
                                <p className="font-serif text-3xl text-gold" aria-hidden="true">
                                    0{i + 1}
                                </p>
                                <div>
                                    <h2 className="font-serif text-2xl text-chocolate">{p.title}</h2>
                                    <p className="mt-2 leading-relaxed text-taupe">{p.text}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal delay={0.1}>
                    <img
                        src={IMG.textureNinho}
                        alt="Imagem ilustrativa: textura do doce de ninho"
                        loading="lazy"
                        className="aspect-[4/5] w-full rounded-3xl object-cover"
                    />
                </Reveal>
            </section>
        </div>
    );
}
