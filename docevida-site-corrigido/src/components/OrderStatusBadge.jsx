import { CheckCircle2, Flame, Inbox, PackageCheck, XCircle } from "lucide-react";
import { STATUS_META } from "../lib/format";

const ICONS = { inbox: Inbox, check: CheckCircle2, flame: Flame, done: PackageCheck, x: XCircle };

// Texto + ícone + cor: o estado nunca depende só da cor.
export default function OrderStatusBadge({ status, className = "" }) {
    const meta = STATUS_META[status] || STATUS_META.received;
    const Icon = ICONS[meta.icon];
    return (
        <span
            data-testid={`status-badge-${status}`}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${meta.cls} ${className}`}
        >
            <Icon size={14} aria-hidden="true" />
            {meta.label}
        </span>
    );
}
