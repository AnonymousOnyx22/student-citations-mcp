import { describe, it, expect } from "vitest";
import { normalizeArxivId, arxivAbsUrl, arxivApiUrl, buildArxivApiUrl, arxivIdQuery, parseArxivAtom, parseArxivFeed, parseArxivResponse } from "../src/core/arxiv.js";

describe("normalizeArxivId", () => {
  it("keeps a new style arXiv ID as it is", () => {
    expect(normalizeArxivId("2001.00001")).toBe("2001.00001");
  });

  it("strips a version suffix", () => {
    expect(normalizeArxivId("2001.00001v2")).toBe("2001.00001");
    expect(normalizeArxivId("2001.00001v12")).toBe("2001.00001");
  });

  it("takes an old style archive ID", () => {
    expect(normalizeArxivId("math/0603452")).toBe("math/0603452");
    expect(normalizeArxivId("quant-ph/9901001")).toBe("quant-ph/9901001");
    expect(normalizeArxivId("cs.AI/0603452")).toBe("cs.AI/0603452");
  });

  it("takes an abs link with or without a scheme", () => {
    expect(normalizeArxivId("https://arxiv.org/abs/2001.00001")).toBe("2001.00001");
    expect(normalizeArxivId("http://arxiv.org/abs/2001.00001v3")).toBe("2001.00001");
    expect(normalizeArxivId("arxiv.org/abs/math/0603452")).toBe("math/0603452");
  });

  it("takes a pdf link", () => {
    expect(normalizeArxivId("https://arxiv.org/pdf/2001.00001")).toBe("2001.00001");
  });

  it("trims spaces", () => {
    expect(normalizeArxivId("  2001.00001  ")).toBe("2001.00001");
  });

  it("rejects anything else", () => {
    expect(() => normalizeArxivId("hello")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("10.1038/nature14539")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("2001.0000")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("math/060345")).toThrow("does not look like an arXiv ID");
    expect(() => normalizeArxivId("")).toThrow("does not look like an arXiv ID");
  });
});

describe("arxivAbsUrl", () => {
  it("builds the abstract page address", () => {
    expect(arxivAbsUrl("2001.00001")).toBe("https://arxiv.org/abs/2001.00001");
    expect(arxivAbsUrl("math/0603452")).toBe("https://arxiv.org/abs/math/0603452");
  });
});

describe("arxivApiUrl", () => {
  it("builds a query url for id list", () => {
    const url = arxivApiUrl({ idList: "2001.00001" });
    expect(url).toContain("export.arxiv.org/api/query");
    expect(url).toContain("id_list=2001.00001");
  });

  it("builds a query url for search query", () => {
    const url = arxivApiUrl({ searchQuery: "all:electron" });
    expect(url).toContain("search_query=all%3Aelectron");
  });

  it("supports buildArxivApiUrl alias", () => {
    const url = buildArxivApiUrl({ idList: ["2001.00001", "math/0603452"] });
    expect(url).toContain("id_list=2001.00001%2Cmath%2F0603452");
  });

  it("supports arxivIdQuery", () => {
    const url = arxivIdQuery("2001.00001v2");
    expect(url).toContain("id_list=2001.00001");
  });
});

describe("parseArxivAtom", () => {
  const xml = `<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/" xmlns:arxiv="http://arxiv.org/schemas/atom" xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/cond-mat/0011267v1</id>
    <title>The electronic structure of cuprates</title>
    <updated>2000-11-15T16:19:15Z</updated>
    <link href="https://arxiv.org/abs/cond-mat/0011267v1" rel="alternate" type="text/html"/>
    <link href="https://arxiv.org/pdf/cond-mat/0011267v1" rel="related" type="application/pdf" title="pdf"/>
    <summary>We report studies.</summary>
    <category term="cond-mat.supr-con" scheme="http://arxiv.org/schemas/atom"/>
    <published>2000-11-15T16:19:15Z</published>
    <arxiv:comment>In press</arxiv:comment>
    <arxiv:journal_ref>J. Electron Spectr. 2001</arxiv:journal_ref>
    <arxiv:doi>10.1234/example</arxiv:doi>
    <arxiv:primary_category term="cond-mat.supr-con"/>
    <author>
      <name>Mark S. Golden</name>
    </author>
    <author>
      <name>John Doe</name>
    </author>
  </entry>
</feed>`;

  it("parses an atom feed", () => {
    const entries = parseArxivAtom(xml);
    expect(entries).toHaveLength(1);
    expect(entries[0].arxivId).toBe("cond-mat/0011267");
    expect(entries[0].title).toBe("The electronic structure of cuprates");
    expect(entries[0].summary).toBe("We report studies.");
    expect(entries[0].authors.map((a) => a.name)).toEqual(["Mark S. Golden", "John Doe"]);
    expect(entries[0].categories).toContain("cond-mat.supr-con");
    expect(entries[0].primaryCategory).toBe("cond-mat.supr-con");
    expect(entries[0].comment).toBe("In press");
    expect(entries[0].journalRef).toBe("J. Electron Spectr. 2001");
    expect(entries[0].doi).toBe("10.1234/example");
    expect(entries[0].pdfLink).toBe("https://arxiv.org/pdf/cond-mat/0011267v1");
  });

  it("has parseArxivFeed and parseArxivResponse aliases", () => {
    expect(parseArxivFeed(xml)).toHaveLength(1);
    expect(parseArxivResponse(xml)).toHaveLength(1);
  });
});
