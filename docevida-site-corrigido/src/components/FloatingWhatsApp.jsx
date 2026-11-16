import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useUI } from "../context/UIContext";
import { isWhatsAppConfigured, whatsappUrl } from "../config/site";

export default function FloatingWhatsApp() {
    const { setOrderOpen } = useUI();
    const reduce = useReducedMotion();

    const cls =
        "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-moss text-cream shadow-xl shadow-moss/30 transition-colors hover:bg-moss-dark";

    if (isWhatsAppConfigured()) {
        return (
            <motion.a
                href={whatsappUrl(`Olá, DoceVida! Gostaria de fazer um pedido.`)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Conversar pelo WhatsApp"
                data-testid="floating-whatsapp-btn"
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200, damping: 16 }}
                className={cls}
            >
                <MessageCircle size={24} />
            </motion.a>
        );
    }

    return (
        <motion.button
            type="button"
            onClick={() => setOrderOpen(true)}
            aria-label="Preparar pedido para o WhatsApp"
            data-testid="floating-whatsapp-btn"
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200, damping: 16 }}
            className={cls}
        >
            <MessageCircle size={24} />
        </motion.button>
    );
}
