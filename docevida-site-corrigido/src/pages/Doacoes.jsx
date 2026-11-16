import { motion } from "framer-motion";
import { HeartHandshake, MapPin, Shirt } from "lucide-react";
import usePageMeta from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";

const FORM_URL = "https://forms.gle/98SvC8Spm88R88Uq5";

export default function Doacoes() {
    usePageMeta({
        title: "Doações Solidárias — DoceVida",
        description: "Chocolate que adoça e transforma: a cada compra, parte do valor vira doação para ONGs parceiras da nossa região.",
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
                    Doações solidárias
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 }}
                    className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-chocolate sm:text-6xl"
                    data-testid="doacoes-title"
                >
                    Chocolate que adoça <em className="italic text-caramel">e transforma.</em>
                </motion.h1>
                <p className="mt-4 font-serif text-xl italic text-taupe">DoceVida + ONGs</p>
            </header>

            <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
                <Reveal>
                    <p className="text-lg leading-relaxed text-taupe">
                        Aqui na DoceVida a gente acredita que carinho também se compartilha. Por isso, a cada compra que você
                        faz, parte do valor vira doação para ONGs parceiras da nossa região.
                    </p>
                    <p className="mt-5 text-lg leading-relaxed text-taupe">
                        Você se delicia com um bombom 100% enrolado à mão, e juntos a gente ajuda quem mais precisa.
                    </p>
                    <p className="mt-8 font-serif text-2xl text-chocolate">
                        É o nosso ciclo do bem: você compra, a gente doa, o amor se multiplica.
                    </p>
                </Reveal>
            </section>

            <section aria-labelledby="costurando-title" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
                <Reveal>
                    <div className="grid gap-10 rounded-[2.5rem] bg-oat p-8 sm:p-12 lg:grid-cols-2 lg:p-16" data-testid="doacoes-ong">
                        <div>
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-cream text-caramel">
                                <Shirt size={22} strokeWidth={1.6} aria-hidden="true" />
                            </span>
                            <h2 id="costurando-title" className="mt-5 font-serif text-3xl text-chocolate sm:text-4xl">
                                Projeto Costurando Sonhos
                            </h2>
                            <p className="mt-1 text-sm font-medium text-caramel">ONG Casa de Lei</p>
                            <p className="mt-5 leading-relaxed text-taupe">
                                Um projeto que cadastra gestantes e mães de bebês de até um ano, garantindo que seus bebês recebam
                                doações de roupas de qualidade, confeccionadas pela ONG Casa de Lei.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl text-chocolate">Como se cadastrar</h3>
                            <p className="mt-3 leading-relaxed text-taupe">
                                É muito fácil: basta acessar o link e preencher com seus dados. Se tiver alguma dúvida, você pode
                                comparecer diretamente na ONG ou entrar em contato via WhatsApp.
                            </p>
                            <a
                                href={FORM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="doacoes-form-link"
                                className="mt-6 inline-flex rounded-full bg-chocolate px-7 py-3.5 text-sm font-semibold tracking-[0.15em] text-cream transition-colors hover:bg-caramel"
                            >
                                FAZER CADASTRO
                            </a>
                            <p className="mt-8 flex items-start gap-3 text-sm leading-relaxed text-taupe">
                                <MapPin size={18} className="mt-0.5 shrink-0 text-caramel" aria-hidden="true" />
                                Rua Etore Tommasini, 40 — Cidade Tiradentes, São Paulo – SP, 08471-580
                            </p>
                        </div>
                    </div>
                </Reveal>
                <Reveal delay={0.1}>
                    <p className="mt-10 flex items-center justify-center gap-2 text-center font-serif text-2xl italic text-caramel">
                        <HeartHandshake size={22} aria-hidden="true" /> Obrigada por fazer parte disso!
                    </p>
                </Reveal>
            </section>
        </div>
    );
}
