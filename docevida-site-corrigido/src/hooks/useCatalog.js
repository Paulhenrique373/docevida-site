import { useEffect, useSyncExternalStore } from "react";
import { applyServerCatalog, getCatalogVersion, subscribeCatalog } from "../data/products";
import { request, isAbort } from "../lib/api";

// Faz componentes reagirem quando preços/disponibilidade chegam do servidor.
export const useCatalogVersion = () => useSyncExternalStore(subscribeCatalog, getCatalogVersion);

export function useCatalogLoader() {
    useEffect(() => {
        const ctrl = new AbortController();
        request("/api/catalog", { signal: ctrl.signal, timeoutMs: 10000 })
            .then(applyServerCatalog)
            .catch((e) => {
                // Sem API: o catálogo local segue visível (preço "sob consulta") e o checkout informa a indisponibilidade.
                if (!isAbort(e)) console.warn("Catálogo do servidor indisponível:", e.message);
            });
        return () => ctrl.abort();
    }, []);
}
