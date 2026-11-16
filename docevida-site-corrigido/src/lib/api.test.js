import { ApiError, request } from "./api";

afterEach(() => { jest.useRealTimers(); delete global.fetch; });

test("normaliza erro de validação do servidor com campos", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { code: "validation_error", message: "Confira", fields: { name: "x" } } }) });
    await expect(request("/api/x")).rejects.toMatchObject({ status: 400, code: "validation_error", fields: { name: "x" }, uncertain: false });
});

test("falha de rede é marcada como resultado incerto", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const err = await request("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.network).toBe(true);
    expect(err.uncertain).toBe(true);
});

test("timeout aborta a requisição e é marcado como incerto", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn((url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("abort"), { name: "AbortError" })))));
    const p = request("/api/x", { timeoutMs: 1000 }).catch((e) => e);
    jest.advanceTimersByTime(1100);
    const err = await p;
    expect(err.timeout).toBe(true);
    expect(err.uncertain).toBe(true);
});

test("cancelamento pelo chamador não é tratado como erro de rede", async () => {
    global.fetch = jest.fn((url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("abort"), { name: "AbortError" })))));
    const c = new AbortController();
    const p = request("/api/x", { signal: c.signal }).catch((e) => e);
    c.abort();
    const err = await p;
    expect(err.aborted).toBe(true);
    expect(err.uncertain).toBe(false);
});

test("resposta sem JSON válido vira erro controlado", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error("bad"); } });
    await expect(request("/api/x")).rejects.toMatchObject({ code: "bad_response" });
});
