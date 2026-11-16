export default function Marquee({ items }) {
    return (
        <div className="overflow-hidden border-y border-chocolate/10 bg-chocolate py-5 text-cream" data-testid="marquee">
            <div className="marquee-track flex w-max" style={{ animationDuration: "44s" }}>
                {[0, 1].map((dup) => (
                    <ul
                        key={dup}
                        aria-hidden={dup === 1}
                        className="flex shrink-0 items-center"
                    >
                        {items.map((item, i) => (
                            <li key={`${dup}-${i}`} className="flex items-center whitespace-nowrap">
                                <span className="px-8 font-serif text-lg italic tracking-wide">{item}</span>
                                <span className="text-xs text-gold" aria-hidden="true">
                                    ◆
                                </span>
                            </li>
                        ))}
                    </ul>
                ))}
            </div>
        </div>
    );
}
