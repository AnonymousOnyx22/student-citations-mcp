import { describe, it, expect } from "vitest";
import { ApiError, createClient } from "../src/core/http.js";

function fakeFetch(statuses: number[]) {
  const calls = { n: 0 };
  const impl = (async () => {
    const status = statuses[Math.min(calls.n++, statuses.length - 1)];
    return new Response(status === 200 ? '{"ok":true}' : "nope", { status, headers: status === 429 ? { "retry-after": "0" } : {} });
  }) as unknown as typeof fetch;
  return { calls, impl };
}

describe("retries", () => {
  it("retries a 503 and then succeeds", async () => {
    const f = fakeFetch([503, 429, 200]);
    const c = createClient({ baseUrl: "http://x", fetchImpl: f.impl, retries: 2, retryDelayMs: 1 });
    expect(await c.get("a")).toEqual({ ok: true });
    expect(f.calls.n).toBe(3);
  });

  it("gives up after the retries are used", async () => {
    const f = fakeFetch([500]);
    const c = createClient({ baseUrl: "http://x", fetchImpl: f.impl, retries: 2, retryDelayMs: 1 });
    await expect(c.get("a")).rejects.toBeInstanceOf(ApiError);
    expect(f.calls.n).toBe(3);
  });

  it("does not retry a 404 or when retries is not set", async () => {
    const a = fakeFetch([404]);
    await expect(createClient({ baseUrl: "http://x", fetchImpl: a.impl, retries: 2, retryDelayMs: 1 }).get("a")).rejects.toBeInstanceOf(ApiError);
    expect(a.calls.n).toBe(1);
    const b = fakeFetch([503]);
    await expect(createClient({ baseUrl: "http://x", fetchImpl: b.impl }).get("a")).rejects.toBeInstanceOf(ApiError);
    expect(b.calls.n).toBe(1);
  });
});
