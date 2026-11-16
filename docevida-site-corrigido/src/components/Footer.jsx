import { Link } from "react-router-dom";
import { Clock, Instagram, Mail, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { NAV_LINKS, SITE, isWhatsAppConfigured } from "../config/site";

export default function Footer() {
    const year = new Date().getFullYear();
    const { contact } = SITE;

    return (
        <footer className="grain bg-cocoa text-cream">
            <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
                <div className="grid gap-12 md:grid-cols-3">
                    <div>
                        <Logo light />
                        <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/70">
                            Nada de máquina: é tudo no capricho, feito com carinho. O chocolate mais amado de Cidade Tiradentes.
                        </p>
                    </div>

                    <nav aria-label="Links do rodapé">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Navegação</h2>
                        <ul className="mt-5 space-y-3">
                            {NAV_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                                        className="text-sm text-cream/75 transition-colors hover:text-gold"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link to="/acompanhar" data-testid="footer-link-acompanhar" className="text-sm text-cream/75 transition-colors hover:text-gold">
                                    Acompanhar pedido
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Contato</h2>
                        <ul className="mt-5 space-y-3 text-sm text-cream/75">
                            <li className="flex items-center gap-3" data-testid="footer-whatsapp">
                                <MessageCircle size={16} className="text-gold" aria-hidden="true" />
                                {isWhatsAppConfigured() ? (
                                    <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold">
                                        WhatsApp
                                    </a>
                                ) : (
                                    <span>
                                        WhatsApp <span className="text-cream/40">— em configuração</span>
                                    </span>
                                )}
                            </li>
                            <li className="flex items-center gap-3" data-testid="footer-instagram">
                                <Instagram size={16} className="text-gold" aria-hidden="true" />
                                {contact.instagram ? (
                                    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold">
                                        {contact.instagramHandle || "Instagram"}
                                    </a>
                                ) : (
                                    <span>
                                        Instagram <span className="text-cream/40">— em breve</span>
                                    </span>
                                )}
                            </li>
                            <li className="flex items-center gap-3" data-testid="footer-email">
                                <Mail size={16} className="text-gold" aria-hidden="true" />
                                {contact.email ? (
                                    <a href={`mailto:${contact.email}`} className="transition-colors hover:text-gold">
                                        E-mail
                                    </a>
                                ) : (
                                    <span>
                                        E-mail <span className="text-cream/40">— em configuração</span>
                                    </span>
                                )}
                            </li>
                            <li className="flex items-center gap-3" data-testid="footer-hours">
                                <Clock size={16} className="text-gold" aria-hidden="true" />
                                {contact.hours || (
                                    <span>
                                        Horário de atendimento <span className="text-cream/40">— em configuração</span>
                                    </span>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs text-cream/50 sm:flex-row">
                    <p>© {year} DoceVida — Chocolates Artesanais. Imagens ilustrativas geradas por IA; fotos oficiais em breve.</p>
                    <div className="flex items-center gap-6" data-testid="footer-docs">
                        <Link to="/privacidade" className="transition-colors hover:text-gold">Política de Privacidade</Link>
                        <Link to="/termos" className="transition-colors hover:text-gold">Termos de Uso</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
