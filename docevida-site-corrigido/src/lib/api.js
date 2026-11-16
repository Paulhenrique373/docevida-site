// Cliente HTTP da API da DoceVida: timeout, cancelamento e erros normalizados.
const BASE = process.env.REACT_APP_API_URL || "";
const DEFAULT_TIMEOUT = 15000;

export class ApiError extends Error {
    constructor(message, { status = 0, code = "unknown", fields, network = false, timeout = false, aborted = false } = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields;
        this.network = network; // sem resposta do servidor (offline, DNS, CORS...)
        this.timeout = timeout; // o servidor pode ter processado: o resultado é INCERTO
        this.aborted = aborted;
    }
    // true quando não sabemos se o servidor registrou a operação (timeout/queda após envio)
    get uncertain() {
        return this.timeout || this.network;
    }
}

export async function request(path, { method = "GET", body, headers = {}, signal, timeoutMs = DEFAULT_TIMEOUT, csrf } = {}) {
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        ctrl.abort();
    }, timeoutMs);
    const onAbort = () => ctrl.abort();
    if (signal) {
        if (signal.aborted) ctrl.abort();
        else signal.addEventListener("abort", onAbort, { once: true });
    }
    try {
        const res = await fetch(`${BASE}${path}`, {
            method,
            credentials: BASE ? "include" : "same-origin",
            headers: {
                Accept: "application/json",
                ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
                ...(csrf ? { "X-CSRF-Token": csrf } : {}),
                ...headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: ctrl.signal,
        });
        let data = null;
        try {
            data = await res.json();
        } catch {
            /* resposta sem JSON */
        }
        if (!res.ok) {
            const e = data?.error;
            throw new ApiError(e?.message || "Não foi possível concluir a solicitação.", {
                status: res.status,
                code: e?.code || "http_error",
                fields: e?.fields,
            });
        }
        if (data === null) throw new ApiError("Resposta inválida do servidor.", { status: res.status, code: "bad_response" });
        return data;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        if (timedOut) throw new ApiError("O servidor demorou para responder.", { timeout: true, code: "timeout" });
        if (err?.name === "AbortError") throw new ApiError("Solicitação cancelada.", { aborted: true, code: "aborted" });
        throw new ApiError("Sem conexão com o servidor.", { network: true, code: "network" });
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener?.("abort", onAbort);
    }
}

export const isAbort = (e) => e instanceof ApiError && e.aborted;
