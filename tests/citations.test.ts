import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, makeApi } from "../src/server.js";
import { format, inText, normalizeDoi, normalizeIsbn, splitName } from "../src/format.js";

const article = {
  type: "journal" as const,
  authors: [{ family: "Smith", given: "John Kenneth" }, { family: "Jones", given: "Alice" }],
  year: "2020",
  title: "Learning to learn",
  container: "Journal of Study Skills",
  volume: "4",
  issue: "2",
  pages: "11-25",
  doi: "10.1000/jss.2020.42",
};

let srv: http.Server;
let client: Client;
let lastUa = "";

beforeAll(async () => {
  srv = http.createServer((req, res) => {
    lastUa = String(req.headers["user-agent"] ?? "");
    const url = new URL(req.url!, "http://x");
    const json = (d: unknown, code = 200) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(d));
    };
    if (url.pathname === "/works/10.1000/jss.2020.42")
      return json({ message: { type: "journal-article", title: ["Learning to learn"], "container-title": ["Journal of Study Skills"], author: [{ given: "John Kenneth", family: "Smith" }, { given: "Alice", family: "Jones" }], issued: { "date-parts": [[2020, 5]] }, volume: "4", issue: "2", page: "11-25", DOI: "10.1000/jss.2020.42" } });
    if (url.pathname.startsWith("/works/")) return json({}, 404);
    if (url.pathname === "/api/books") {
      const key = url.searchParams.get("bibkeys");
      if (key === "ISBN:9780262033848") return json({ [key]: { title: "Introduction to Algorithms", authors: [{ name: "Thomas H. Cormen" }, { name: "Charles E. Leiserson" }], publishers: [{ name: "MIT Press" }], publish_places: [{ name: "Cambridge, MA" }], publish_date: "July 31, 2009" } });
      return json({});
    }
    json({}, 404);
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(makeApi({ crossref: base, openLibrary: base, email: "me@example.com" })).connect(a);
  client = new Client({ name: "test", version: "0" });
  await client.connect(b);
});
afterAll(() => srv.close());

async function call(name: string, args: Record<string, unknown> = {}) {
  const r: any = await client.callTool({ name, arguments: args });
  return { text: r.content[0].text as string, isError: !!r.isError };
}

describe("formatting", () => {
  it("formats a journal article in APA 7", () => {
    expect(format(article, "apa7")).toBe("Smith, J. K., & Jones, A. (2020). Learning to learn. *Journal of Study Skills*, *4*(2), 11-25. https://doi.org/10.1000/jss.2020.42");
  });
  it("formats a journal article in MLA 9", () => {
    expect(format(article, "mla9")).toBe('Smith, John Kenneth, and Alice Jones. "Learning to learn." *Journal of Study Skills*, vol. 4, no. 2, 2020, pp. 11-25, https://doi.org/10.1000/jss.2020.42.');
  });
  it("formats a journal article in Chicago author-date", () => {
    expect(format(article, "chicago-ad")).toBe('Smith, John Kenneth, and Alice Jones. 2020. "Learning to learn." *Journal of Study Skills* 4 (2): 11-25. https://doi.org/10.1000/jss.2020.42.');
  });
  it("formats books and websites", () => {
    const book = { type: "book" as const, authors: [{ family: "Cormen", given: "Thomas H." }], year: "2009", title: "Introduction to algorithms", edition: "3rd", publisher: "MIT Press", city: "Cambridge, MA" };
    expect(format(book, "apa7")).toBe("Cormen, T. H. (2009). *Introduction to algorithms* (3rd ed.). MIT Press.");
    expect(format(book, "mla9")).toBe("Cormen, Thomas H. *Introduction to algorithms*. 3rd ed., MIT Press, 2009.");
    expect(format(book, "chicago-ad")).toBe("Cormen, Thomas H. 2009. *Introduction to algorithms*. 3rd ed. Cambridge, MA: MIT Press.");
    const web = { type: "website" as const, authors: [], title: "How to study", container: "Example Uni", year: "2026", url: "https://example.edu/study" };
    expect(format(web, "apa7")).toBe("*How to study*. Example Uni. https://example.edu/study");
  });
  it("handles three or more authors and in-text forms", () => {
    const three = [{ family: "A" }, { family: "B" }, { family: "C" }];
    expect(inText(three, "2020", "apa7")).toBe("(A et al., 2020)");
    expect(inText(article.authors, "2020", "apa7", "14")).toBe("(Smith & Jones, 2020, p. 14)");
    expect(inText(article.authors, "2020", "mla9", "14")).toBe("(Smith and Jones 14)");
    expect(inText(article.authors, "2020", "chicago-ad", "14")).toBe("(Smith and Jones 2020, 14)");
  });
  it("cleans DOIs, ISBNs and names", () => {
    expect(normalizeDoi("https://doi.org/10.1000/abc")).toBe("10.1000/abc");
    expect(() => normalizeDoi("hello")).toThrow("does not look like a DOI");
    expect(normalizeIsbn("978-0-262-03384-8")).toBe("9780262033848");
    expect(() => normalizeIsbn("123")).toThrow("ISBN");
    expect(splitName("Thomas H. Cormen")).toEqual({ family: "Cormen", given: "Thomas H." });
  });
});

describe("MCP tools", () => {
  it("lists four read only tools", async () => {
    const tools = (await client.listTools()).tools;
    expect(tools.map((t) => t.name).sort()).toEqual(["cite_from_doi", "cite_from_isbn", "format_citation", "in_text_citation"]);
    for (const t of tools) expect(t.annotations?.readOnlyHint).toBe(true);
  });
  it("gives every tool concrete inputs and an example prompt", async () => {
    const tools = (await client.listTools()).tools;
    for (const t of tools) {
      expect(t.description).toContain("Inputs:");
      expect(t.description).toContain("Example prompt:");
    }
    const doi = tools.find((t) => t.name === "cite_from_doi")!;
    expect(doi.description).toContain("10.1038/nature14539");
  });
  it("cites from a DOI through Crossref", async () => {
    const r = await call("cite_from_doi", { doi: "https://doi.org/10.1000/jss.2020.42", style: "apa7" });
    expect(r.text).toContain("Smith, J. K., & Jones, A. (2020). Learning to learn.");
    expect(lastUa).toContain("mailto:me@example.com");
  });
  it("gives a friendly error for an unknown DOI", async () => {
    const r = await call("cite_from_doi", { doi: "10.1000/missing" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("Not found");
  });
  it("cites from an ISBN through Open Library", async () => {
    const r = await call("cite_from_isbn", { isbn: "978-0-262-03384-8", style: "mla9" });
    expect(r.text).toContain("Cormen, Thomas H., and Charles E. Leiserson. *Introduction to Algorithms*. MIT Press, 2009.");
  });
  it("explains a missing ISBN", async () => {
    const r = await call("cite_from_isbn", { isbn: "0306406152" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("no book for ISBN");
  });
  it("formats typed details", async () => {
    const r = await call("format_citation", { ...article, style: "chicago-ad" });
    expect(r.text).toContain("2020.");
  });
});
