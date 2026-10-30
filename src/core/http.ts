export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
    public retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  /** Query params added to every request (used by APIs that put the token in the URL). */
  defaultQuery?: Record<string, string>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** Extra attempts after a 429 or 5xx reply or a network error. Default 0. */
  retries?: number;
  /** Wait before the first retry, doubled each time. A Retry-After header wins, up to 5s. */
  retryDelayMs?: number;
}

export type Query = Record<string, string | number | boolean | undefined | Array<string | number>>;

export interface HttpClient {
  get<T = unknown>(path: string, query?: Query): Promise<T>;
  /** Fetches a page as text, for HTML rather than JSON. */
  getText(path: string): Promise<string>;
  /** Follows RFC 5988 `Link: rel="next"` pagination and concatenates array pages. */
  getAll<T = unknown>(path: string, query?: Query, maxPages?: number): Promise<T[]>;
}

function buildUrl(base: string, path: string, query: Query = {}, defaults: Record<string, string> = {}): string {
  const url = new URL(path.startsWith("http") ? path : base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, ""));
  for (const [k, v] of Object.entries(defaults)) url.searchParams.set(k, v);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, String(item));
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function nextLink(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const m = part.match(/<([^>]+)>\s*;\s*rel="?next"?/i);
    if (m) return m[1];
  }
  return null;
}

export function createClient(opts: ClientOptions): HttpClient {
  const doFetch = opts.fetchImpl ?? fetch;
  const timeout = opts.timeoutMs ?? 20000;

  const retries = opts.retries ?? 0;
  const retryDelay = opts.retryDelayMs ?? 500;

  async function request(url: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await requestOnce(url);
      } catch (err) {
        const status = err instanceof ApiError ? err.status : -1;
        const transient = status === 429 || status >= 500 || status === 0;
        if (!transient || attempt >= retries) throw err;
        const asked = err instanceof ApiError ? err.retryAfterMs : undefined;
        await new Promise((r) => setTimeout(r, Math.min(asked ?? retryDelay * 2 ** attempt, 5000)));
      }
    }
  }

  async function requestOnce(url: string): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await doFetch(url, {
        headers: { Accept: "application/json", ...(opts.headers ?? {}) },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = new ApiError(describeStatus(res.status), res.status, body.slice(0, 500));
        const header = res.headers.get("retry-after");
        const secs = Number(header);
        if (header && Number.isFinite(secs) && secs >= 0) err.retryAfterMs = secs * 1000;
        throw err;
      }
      return res;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if ((err as Error).name === "AbortError") {
        throw new ApiError(`Request timed out after ${timeout / 1000}s`, 0);
      }
      throw new ApiError(`Network error: ${(err as Error).message}`, 0);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async get<T>(path: string, query?: Query): Promise<T> {
      const res = await request(buildUrl(opts.baseUrl, path, query, opts.defaultQuery));
      return (await res.json()) as T;
    },
    async getText(path: string): Promise<string> {
      const res = await request(buildUrl(opts.baseUrl, path));
      const text = await res.text();
      return text.slice(0, 2_000_000);
    },
    async getAll<T>(path: string, query?: Query, maxPages = 10): Promise<T[]> {
      const out: T[] = [];
      let url: string | null = buildUrl(opts.baseUrl, path, query, opts.defaultQuery);
      for (let page = 0; url && page < maxPages; page++) {
        const res: Response = await request(url);
        const data = (await res.json()) as T | T[];
        if (Array.isArray(data)) out.push(...data);
        else out.push(data);
        url = nextLink(res.headers.get("link"));
      }
      return out;
    },
  };
}

export function describeStatus(status: number): string {
  switch (status) {
    case 401:
      return "Not authorized. The service refused the request.";
    case 403:
      return "Access denied.";
    case 404:
      return "Not found. Check the identifier you gave.";
    case 429:
      return "Rate limited by the service. Wait a minute and try again.";
    default:
      return status >= 500 ? `The service had a problem (HTTP ${status}). Try again shortly.` : `Request failed (HTTP ${status}).`;
  }
}
