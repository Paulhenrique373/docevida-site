export const LogoMark = ({ size = 44, className = "" }) => (
    <img src="/logo-96.webp" srcSet="/logo-96.webp 1x, /logo-192.webp 2x" width={size} height={size} alt="" aria-hidden="true" className={`rounded-full ${className}`} />
);

// navbar: versão que encolhe em celulares para não empurrar carrinho/menu para fora da tela.
export default function Logo({ light = false, compact = false, navbar = false }) {
    return (
        <span className={`inline-flex items-center ${navbar ? "gap-2 min-[400px]:gap-3" : "gap-3"}`}>
            <LogoMark size={navbar ? 40 : 44} className={navbar ? "h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 sm:h-11 sm:w-11" : ""} />
            {!compact && (
                <span className="flex flex-col leading-none">
                    <span className={`font-serif ${navbar ? "text-base tracking-[0.1em] min-[360px]:text-lg min-[360px]:tracking-[0.14em] min-[400px]:text-xl min-[400px]:tracking-[0.22em]" : "text-xl tracking-[0.22em]"} ${light ? "text-cream" : "text-chocolate"}`}>
                        DOCEVIDA
                    </span>
                    <span className={`mt-1.5 text-[9px] font-semibold uppercase tracking-[0.32em] ${navbar ? "hidden min-[480px]:block" : ""} ${light ? "text-cream/60" : "text-taupe"}`}>
                        Chocolates Artesanais
                    </span>
                </span>
            )}
        </span>
    );
}
