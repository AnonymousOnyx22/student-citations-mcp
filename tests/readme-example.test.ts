import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, makeApi } from "../src/server.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8").replace(/\r\n/g, "\n");

/** The Crossref record for 10.1038/nature14539, as cite_from_doi reads it. */
const crossrefRecord = {
  message: {
    type: "journal-article",
    title: ["Deep learning"],
    "container-title": ["Nature"],
    author: [
      { given: "Yann", family: "LeCun" },
      { given: "Yoshua", family: "Bengio" },
      { given: "Geoffrey", family: "Hinton" },
    ],
    issued: { "date-parts": [[2015, 5, 28]] },
    volume: "521",
    issue: "7553",
    page: "436-444",
    DOI: "10.1038/nature14539",
  },
};

/** The first page of the paper, the one the README uses in the in text citations. */
const firstPage = String(crossrefRecord.message.page).split("-")[0];

/** The three citation lines the README shows for the paper, one per style. */
const expected = {
  apa7: "LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. *Nature*, *521*(7553), 436-444. https://doi.org/10.1038/nature14539",
  mla9: 'LeCun, Yann, et al. "Deep learning." *Nature*, vol. 521, no. 7553, 2015, pp. 436-444, https://doi.org/10.1038/nature14539.',
  "chicago-ad": 'LeCun, Yann, et al. 2015. "Deep learning." *Nature* 521 (7553): 436-444. https://doi.org/10.1038/nature14539.',
};

let srv: http.Server;
let client: Client;

beforeAll(async () => {
  srv = http.createServer((req, res) => {
    const url = new URL(req.url!, "http://x");
    res.writeHead(url.pathname === "/works/10.1038/nature14539" ? 200 : 404, { "content-type": "application/json" });
    res.end(JSON.stringify(url.pathname === "/works/10.1038/nature14539" ? crossrefRecord : {}));
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(makeApi({ crossref: base, openLibrary: base, email: "" })).connect(a);
  client = new Client({ name: "test", version: "0" });
  await client.connect(b);
});
afterAll(() => srv.close());

async function call(name: string, args: Record<string, unknown> = {}) {
  const r: any = await client.callTool({ name, arguments: args });
  return { text: r.content[0].text as string, isError: !!r.isError };
}

/** The code block under "## Paste ready output", where the README shows the example. */
function pasteReadyBlock(): string {
  const section = readme.split("## Paste ready output")[1] ?? "";
  const block = section.match(/```text\n([\s\S]*?)```/);
  expect(block, "the README has no paste ready code block").toBeTruthy();
  return block![1];
}

describe("README paste ready example", () => {
  it("gives the APA 7 citation the README shows", async () => {
    const r = await call("cite_from_doi", { doi: "10.1038/nature14539", style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toBe(`${expected.apa7}\n\n(From Crossref. Check it against your style guide.)`);
  });

  it("gives the MLA 9 citation the README shows", async () => {
    const r = await call("cite_from_doi", { doi: "10.1038/nature14539", style: "mla9" });
    expect(r.isError).toBe(false);
    expect(r.text).toBe(`${expected.mla9}\n\n(From Crossref. Check it against your style guide.)`);
  });

  it("gives the Chicago author date citation the README shows", async () => {
    const r = await call("cite_from_doi", { doi: "10.1038/nature14539", style: "chicago-ad" });
    expect(r.isError).toBe(false);
    expect(r.text).toBe(`${expected["chicago-ad"]}\n\n(From Crossref. Check it against your style guide.)`);
  });

  it("keeps the paste ready block in step with what the tool returns", async () => {
    const block = pasteReadyBlock();
    for (const style of ["apa7", "mla9", "chicago-ad"] as const) {
      const r = await call("cite_from_doi", { doi: "10.1038/nature14539", style });
      expect(block.split("\n")).toContain(r.text.split("\n")[0]);
    }
  });

  it("keeps the in text and narrative lines in step with the tool", async () => {
    const block = pasteReadyBlock();
    const authors = crossrefRecord.message.author.map((a) => ({ family: a.family, given: a.given }));
    for (const style of ["apa7", "mla9", "chicago-ad"] as const) {
      const inText = await call("in_text_citation", { authors, year: "2015", page: firstPage, style });
      const narrative = await call("in_text_citation", { authors, year: "2015", page: firstPage, style, form: "narrative" });
      expect(block.split("\n")).toContain(`In text: ${inText.text}`);
      expect(block.split("\n")).toContain(`Narrative: ${narrative.text}`);
    }
  });
});
