import usePageMeta from "../hooks/usePageMeta";
import { SITE } from "../config/site";

export default function LegalPage({ title, description, updated, sections }) {
    usePageMeta({ title: `${title} — DoceVida`, description });
    const c = SITE.contact;
    const contactLine = c.email
        ? `pelo e-mail ${c.email}`
        : `pelo Instagram ${c.instagramHandle || "@docevidaoficiall"}${c.whatsapp ? " ou pelo WhatsApp" : ""}`;
    return (
        <div className="pt-32 sm:pt-36">
            <header className="mx-auto max-w-3xl px-5 sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">DoceVida</p>
                <h1 className="mt-4 font-serif text-4xl leading-tight text-chocolate sm:text-5xl">{title}</h1>
                <p className="mt-3 text-sm text-taupe">Última atualização: {updated}</p>
            </header>
            <article className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8">
                {sections.map(([h, paragraphs]) => (
                    <section key={h} className="mb-9">
                        <h2 className="font-serif text-2xl text-chocolate">{h}</h2>
                        {paragraphs.map((p, i) =>
                            Array.isArray(p) ? (
                                <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 text-taupe">
                                    {p.map((li) => <li key={li}>{li}</li>)}
                                </ul>
                            ) : (
                                <p key={i} className="mt-3 leading-relaxed text-taupe">{p === "@contato" ? `Para falar com a DoceVida sobre este assunto, entre em contato ${contactLine}.` : p}</p>
                            )
                        )}
                    </section>
                ))}
            </article>
        </div>
    );
}
