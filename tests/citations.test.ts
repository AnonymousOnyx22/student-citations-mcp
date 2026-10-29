import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, makeApi } from "../src/server.js";
import { format, formatAnyStyle, formatBibliography, inText, narrativeInText, normalizeDoi, normalizeIsbn, splitName } from "../src/format.js";
import { crossrefKind } from "../src/tools.js";

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
let base = "";

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
    if (url.pathname === "/works/10.1000/handbook.1")
      return json({ message: { type: "book-chapter", title: ["Learning to learn in groups"], "container-title": ["The Study Skills Handbook"], author: [{ given: "John Kenneth", family: "Smith" }], editor: [{ given: "Robin", family: "Cole" }], publisher: "North Gate Press", issued: { "date-parts": [[2020, 5]] }, page: "11-25", DOI: "10.1000/handbook.1" } });
    if (url.pathname === "/works/10.1000/dict.1")
      return json({ message: { type: "edited-book", title: ["A dictionary of study words"], editor: [{ given: "Jamie", family: "Patel" }, { given: "Robin", family: "Cole" }], publisher: "North Gate Press", issued: { "date-parts": [[2019]] }, DOI: "10.1000/dict.1" } });
    if (url.pathname === "/works/10.1349/ddlp.2889")
      return json({ message: { type: "dissertation", title: ["Attention and memory in first year students"], author: [{ given: "Jamie", family: "Patel" }], publisher: "Dartmouth College Library Press", institution: [{ name: "Dartmouth College" }], degree: ["Ph.D."], issued: { "date-parts": [[2019]] }, DOI: "10.1349/ddlp.2889" } });
    if (url.pathname === "/works/10.1101/2020.01.30.927871")
      return json({ message: { type: "posted-content", subtype: "preprint", title: ["A preprint about study groups"], author: [{ given: "Alex", family: "Stone" }], publisher: "openRxiv", institution: [{ name: "bioRxiv" }], posted: { "date-parts": [[2020, 1, 31]] }, DOI: "10.1101/2020.01.30.927871" } });
    if (url.pathname.startsWith("/works/")) return json({}, 404);
    if (url.pathname === "/page") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<!DOCTYPE html><html><head><title>How to study | Example Uni</title><meta property=\"og:title\" content=\"How to study\"><meta property=\"og:site_name\" content=\"Example University\"><meta property=\"article:published_time\" content=\"2026-10-14T09:00:00Z\"></head><body><p>Study tips.</p></body></html>");
      return;
    }
    if (url.pathname === "/notitle") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<html><head></head><body><p>No title here.</p></body></html>");
      return;
    }
    if (url.pathname === "/plain") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<html><head><title>A plain page</title></head><body><p>Plain.</p></body></html>");
      return;
    }
    if (url.pathname === "/jsonld") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<!DOCTYPE html><html><head><title>JSON LD Page | News Site</title><meta property=\"og:title\" content=\"JSON LD Page\"><meta property=\"og:site_name\" content=\"News Site\"><script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@type\":\"NewsArticle\",\"datePublished\":\"2026-09-01T12:00:00Z\"}</script></head><body></body></html>");
      return;
    }
    if (url.pathname === "/timedate") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<!DOCTYPE html><html><head><title>Time Page</title><meta name=\"application-name\" content=\"Time Blog\"></head><body><time datetime=\"2026-08-05\">August 5, 2026</time></body></html>");
      return;
    }
    if (url.pathname === "/twitter") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<!DOCTYPE html><html><head><meta name=\"twitter:title\" content=\"Twitter Title\"><meta property=\"og:site_name\" content=\"Twitter Site\"><meta name=\"date\" content=\"2026-07-10\"></head><body></body></html>");
      return;
    }
    if (url.pathname === "/titlepipe") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<!DOCTYPE html><html><head><title>Pipe Title | Pipe Site</title></head><body></body></html>");
      return;
    }
    if (url.pathname === "/api/books") {
      const key = url.searchParams.get("bibkeys");
      if (key === "ISBN:9780262033848") return json({ [key]: { title: "Introduction to Algorithms", authors: [{ name: "Thomas H. Cormen" }, { name: "Charles E. Leiserson" }], publishers: [{ name: "MIT Press" }], publish_places: [{ name: "Cambridge, MA" }], publish_date: "July 31, 2009" } });
      if (key === "ISBN:1111111111111") return json({}, 404);
      if (key === "ISBN:9780134685991") return json({ [key]: { title: "Effective Java", authors: [{ name: "Joshua Bloch" }] } });
      if (key === "ISBN:9780140449136") return json({ [key]: { title: "Crime and Punishment", authors: [{ name: "Fyodor Dostoevsky" }] } });
      return json({});
    }
    if (url.pathname === "/search.json") {
      const q = url.searchParams.get("q");
      if (q === "isbn:9780134685991") return json({ docs: [{ publisher: ["Addison-Wesley"], publish_year: [2018], publish_place: ["Boston"] }] });
      // a classic with many editions: the search describes the whole work, so no single publisher, year or place is this edition's
      if (q === "isbn:9780140449136") return json({ docs: [{ publisher: ["Penguin", "Vintage", "Dover"], publish_year: [1866, 1950, 2003], publish_place: ["Parizh", "London", "New York"] }] });
      return json({ docs: [] });
    }
    json({}, 404);
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
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
  it("formats all three styles with a label above each one", () => {
    expect(formatAnyStyle(article, "all")).toBe(
      [
        `APA 7\n${format(article, "apa7")}`,
        `MLA 9\n${format(article, "mla9")}`,
        `Chicago author date\n${format(article, "chicago-ad")}`,
      ].join("\n\n"),
    );
    expect(formatAnyStyle(article, "ALL")).toBe(formatAnyStyle(article, "all"));
    expect(formatAnyStyle(article, "APA")).toBe(format(article, "apa7"));
  });
  it("formats books and websites", () => {
    const book = { type: "book" as const, authors: [{ family: "Cormen", given: "Thomas H." }], year: "2009", title: "Introduction to algorithms", edition: "3rd", publisher: "MIT Press", city: "Cambridge, MA" };
    expect(format(book, "apa7")).toBe("Cormen, T. H. (2009). *Introduction to algorithms* (3rd ed.). MIT Press.");
    expect(format(book, "mla9")).toBe("Cormen, Thomas H. *Introduction to algorithms*. 3rd ed., MIT Press, 2009.");
    expect(format(book, "chicago-ad")).toBe("Cormen, Thomas H. 2009. *Introduction to algorithms*. 3rd ed. Cambridge, MA: MIT Press.");
    const web = { type: "website" as const, authors: [], title: "How to study", container: "Example Uni", year: "2026", url: "https://example.edu/study" };
    expect(format(web, "apa7")).toBe("*How to study*. Example Uni. https://example.edu/study");
  });
  it("puts editors in the author's place when a book has no authors", () => {
    const edited = { type: "book" as const, authors: [], editors: [{ family: "Patel", given: "Jamie" }, { family: "Cole", given: "Robin" }], year: "2019", title: "A dictionary of study words", publisher: "North Gate Press" };
    expect(format(edited, "apa7")).toBe("Patel, J., & Cole, R., Eds. (2019). *A dictionary of study words*. North Gate Press.");
    expect(format(edited, "mla9")).toBe("Patel, Jamie, and Robin Cole, editors. *A dictionary of study words*. North Gate Press, 2019.");
    expect(format(edited, "chicago-ad")).toBe("Patel, Jamie, and Robin Cole, eds. 2019. *A dictionary of study words*. North Gate Press.");
    const one = { ...edited, editors: [{ family: "Patel", given: "Jamie" }] };
    expect(format(one, "apa7")).toBe("Patel, J., Ed. (2019). *A dictionary of study words*. North Gate Press.");
    expect(format(one, "mla9")).toBe("Patel, Jamie, editor. *A dictionary of study words*. North Gate Press, 2019.");
    expect(format(one, "chicago-ad")).toBe("Patel, Jamie, ed. 2019. *A dictionary of study words*. North Gate Press.");
  });
  it("keeps the edition, editors and translators together after the title", () => {
    const both = { type: "book" as const, authors: [{ family: "Ferrante", given: "Elena" }], editors: [{ family: "Rey", given: "Jean" }], translators: [{ family: "Goldstein", given: "Ann" }], year: "2012", title: "My brilliant friend", edition: "2nd", publisher: "Europa Editions", city: "New York" };
    expect(format(both, "apa7")).toBe("Ferrante, E. (2012). *My brilliant friend* (2nd ed.; Rey, J., Ed.; Goldstein, A., Trans.). Europa Editions.");
    expect(format(both, "mla9")).toBe("Ferrante, Elena. *My brilliant friend*. 2nd ed., Translated by Ann Goldstein, Edited by Jean Rey, Europa Editions, 2012.");
    expect(format(both, "chicago-ad")).toBe("Ferrante, Elena. 2012. *My brilliant friend*. 2nd ed. Translated by Ann Goldstein. Edited by Jean Rey. New York: Europa Editions.");
  });
  it("handles three or more authors and in-text forms", () => {
    const three = [{ family: "A" }, { family: "B" }, { family: "C" }];
    expect(inText(three, "2020", "apa7")).toBe("(A et al., 2020)");
    expect(inText(article.authors, "2020", "apa7", "14")).toBe("(Smith & Jones, 2020, p. 14)");
    expect(inText(article.authors, "2020", "mla9", "14")).toBe("(Smith and Jones 14)");
    expect(inText(article.authors, "2020", "chicago-ad", "14")).toBe("(Smith and Jones 2020, 14)");
  });
  it("writes the narrative form for a sentence that names the author", () => {
    const three = [{ family: "A" }, { family: "B" }, { family: "C" }];
    expect(narrativeInText(article.authors, "2020", "apa7", "14")).toBe("Smith and Jones (2020, p. 14)");
    expect(narrativeInText(article.authors, "2020", "mla9", "14")).toBe("Smith and Jones (14)");
    expect(narrativeInText(article.authors, "2020", "chicago-ad", "14")).toBe("Smith and Jones (2020, 14)");
    expect(narrativeInText(three, "2020", "apa7")).toBe("A et al. (2020)");
    expect(narrativeInText([{ family: "Smith" }], "2020", "apa7")).toBe("Smith (2020)");
    expect(narrativeInText(article.authors, "2020", "mla9")).toBe("Smith and Jones");
    expect(narrativeInText([], "2020", "apa7", "14")).toBe("(2020, p. 14)");
  });
  it("cleans DOIs, ISBNs and names", () => {
    expect(normalizeDoi("https://doi.org/10.1000/abc")).toBe("10.1000/abc");
    expect(() => normalizeDoi("hello")).toThrow("does not look like a DOI");
    expect(normalizeIsbn("978-0-262-03384-8")).toBe("9780262033848");
    expect(() => normalizeIsbn("123")).toThrow("ISBN");
    expect(splitName("Thomas H. Cormen")).toEqual({ family: "Cormen", given: "Thomas H." });
  });
});

describe("works cited list", () => {
  const zimmer = {
    type: "journal" as const,
    authors: [{ family: "Zimmer", given: "Zoe" }],
    year: "2021",
    title: "Later work",
    container: "Journal of Study Skills",
    volume: "2",
    pages: "1-9",
  };
  const edited = {
    type: "book" as const,
    authors: [],
    editors: [{ family: "Baker", given: "Sam" }],
    year: "2018",
    title: "A dictionary of study words",
    publisher: "North Gate Press",
  };
  const adams = {
    type: "book" as const,
    authors: [{ family: "Adams", given: "Amy" }],
    year: "2019",
    title: "Study habits",
    publisher: "North Gate Press",
  };

  it("alphabetises several sources into one list", () => {
    expect(formatBibliography([zimmer, edited, adams], "apa7")).toBe(
      [
        "Adams, A. (2019). *Study habits*. North Gate Press.",
        "Baker, S., Ed. (2018). *A dictionary of study words*. North Gate Press.",
        "Zimmer, Z. (2021). Later work. *Journal of Study Skills*, *2*, 1-9.",
      ].join("\n\n"),
    );
  });

  it("sorts by title when there is no author and skips a leading article", () => {
    const site = { type: "website" as const, authors: [], title: "The water cycle", container: "Example Uni", year: "2026", url: "https://example.edu/water" };
    const young = { type: "book" as const, authors: [{ family: "Young", given: "Ada" }], year: "2020", title: "Study", publisher: "North Gate Press" };
    const list = formatBibliography([young, site, adams], "apa7").split("\n\n");
    expect(list[0]).toContain("Adams, A.");
    expect(list[1]).toContain("*The water cycle*");
    expect(list[2]).toContain("Young, A.");
  });

  it("orders one author's works by year in APA and by title in MLA", () => {
    const early = { type: "book" as const, authors: [{ family: "Adams", given: "Amy" }], year: "2018", title: "Zebra habits", publisher: "North Gate Press" };
    const late = { type: "book" as const, authors: [{ family: "Adams", given: "Amy" }], year: "2020", title: "Alpha methods", publisher: "North Gate Press" };
    expect(formatBibliography([late, early], "apa7").split("\n\n")[0]).toContain("Zebra habits");
    expect(formatBibliography([late, early], "mla9").split("\n\n")[0]).toContain("Alpha methods");
  });

  it("asks for one source at least", () => {
    expect(() => formatBibliography([], "apa7")).toThrow("at least one source");
  });
});

describe("source kinds", () => {
  const chapter = {
    type: "chapter" as const,
    authors: [{ family: "Smith", given: "John Kenneth" }],
    editors: [{ family: "Cole", given: "Robin" }],
    year: "2020",
    title: "Learning to learn in groups",
    container: "The Study Skills Handbook",
    pages: "11-25",
    publisher: "North Gate Press",
    doi: "10.1000/handbook.1",
  };
  const thesis = {
    type: "thesis" as const,
    authors: [{ family: "Patel", given: "Jamie" }],
    year: "2019",
    title: "Attention and memory in first year students",
    institution: "Dartmouth College",
    degree: "Ph.D.",
    doi: "10.1349/ddlp.2889",
  };
  const report = { type: "report" as const, authors: [{ family: "Stone", given: "Alex" }], year: "2020", title: "How students study", report_number: "2020-04", publisher: "Office of Academic Resources" };
  const dataset = { type: "dataset" as const, authors: [{ family: "Stone", given: "Alex" }], year: "2021", title: "Study habits survey data", publisher: "Zenodo" };
  const preprint = { type: "preprint" as const, authors: [{ family: "Stone", given: "Alex" }], year: "2022", title: "A preprint about study groups", repository: "bioRxiv" };

  it("formats a book chapter as a chapter, with no volume or issue", () => {
    expect(format(chapter, "apa7")).toBe("Smith, J. K. (2020). Learning to learn in groups. In R. Cole (Ed.), *The Study Skills Handbook* (pp. 11-25). North Gate Press. https://doi.org/10.1000/handbook.1");
    expect(format(chapter, "mla9")).toBe('Smith, John Kenneth. "Learning to learn in groups." *The Study Skills Handbook*, edited by Robin Cole, North Gate Press, 2020, pp. 11-25, https://doi.org/10.1000/handbook.1.');
    expect(format(chapter, "chicago-ad")).toBe('Smith, John Kenneth. 2020. "Learning to learn in groups." In *The Study Skills Handbook*, edited by Robin Cole, 11-25. North Gate Press. https://doi.org/10.1000/handbook.1.');
  });
  it("formats a thesis with the degree and the institution", () => {
    expect(format(thesis, "apa7")).toBe("Patel, J. (2019). *Attention and memory in first year students* [Doctoral dissertation, Dartmouth College]. https://doi.org/10.1349/ddlp.2889");
    expect(format(thesis, "mla9")).toBe("Patel, Jamie. *Attention and memory in first year students*. 2019. Dartmouth College, PhD dissertation. https://doi.org/10.1349/ddlp.2889.");
    expect(format(thesis, "chicago-ad")).toBe("Patel, Jamie. 2019. *Attention and memory in first year students*. PhD diss., Dartmouth College. https://doi.org/10.1349/ddlp.2889.");
  });
  it("formats a report, a dataset and a preprint", () => {
    expect(format(report, "apa7")).toBe("Stone, A. (2020). *How students study* (Report No. 2020-04). Office of Academic Resources.");
    expect(format(report, "chicago-ad")).toBe("Stone, Alex. 2020. *How students study*. Report no. 2020-04. Office of Academic Resources.");
    expect(format(dataset, "apa7")).toBe("Stone, A. (2021). *Study habits survey data* [Data set]. Zenodo.");
    expect(format(preprint, "apa7")).toBe("Stone, A. (2022). *A preprint about study groups* [Preprint]. bioRxiv.");
    expect(format(preprint, "mla9")).toBe('Stone, Alex. "A preprint about study groups." Preprint, bioRxiv, 2022.');
  });
  it("keeps the period a record ends a title with outside the italics", () => {
    const dotted = { ...thesis, title: "Attention and memory in first year students." };
    expect(format(dotted, "apa7")).toBe("Patel, J. (2019). *Attention and memory in first year students* [Doctoral dissertation, Dartmouth College]. https://doi.org/10.1349/ddlp.2889");
    expect(format(dotted, "mla9")).toBe("Patel, Jamie. *Attention and memory in first year students*. 2019. Dartmouth College, PhD dissertation. https://doi.org/10.1349/ddlp.2889.");
  });
  it("reads the degree of a thesis for the words each style uses", () => {
    expect(format({ ...thesis, degree: "M.A." }, "apa7")).toContain("[Master's thesis, Dartmouth College]");
    expect(format({ ...thesis, degree: "M.A." }, "mla9")).toContain("Dartmouth College, MA thesis.");
    expect(format({ ...thesis, degree: "M.A." }, "chicago-ad")).toContain("MA thesis, Dartmouth College.");
    expect(format({ ...thesis, degree: undefined }, "apa7")).toContain("[Dissertation, Dartmouth College]");
  });
  it("maps each Crossref work type to the kind of source it is", () => {
    expect(crossrefKind("journal-article")).toBe("journal");
    expect(crossrefKind("book")).toBe("book");
    expect(crossrefKind("monograph")).toBe("book");
    expect(crossrefKind("edited-book")).toBe("book");
    expect(crossrefKind("reference-book")).toBe("book");
    expect(crossrefKind("proceedings")).toBe("book");
    expect(crossrefKind("book-chapter")).toBe("chapter");
    expect(crossrefKind("proceedings-article")).toBe("chapter");
    expect(crossrefKind("dissertation")).toBe("thesis");
    expect(crossrefKind("report")).toBe("report");
    expect(crossrefKind("standard")).toBe("report");
    expect(crossrefKind("dataset")).toBe("dataset");
    expect(crossrefKind("posted-content")).toBe("preprint");
    expect(crossrefKind("peer-review")).toBe("journal");
    expect(crossrefKind("a-type-we-do-not-know")).toBe("journal");
  });
});

describe("missing container", () => {
  const noContainer = { type: "journal" as const, authors: [{ family: "Smith", given: "John" }], year: "2020", title: "Learning to learn", volume: "4", pages: "11-25" };
  const chapterNoContainer = { type: "chapter" as const, authors: [{ family: "Smith", given: "John" }], year: "2020", title: "Learning to learn in groups", pages: "11-25", publisher: "North Gate Press" };

  it("rejects a journal article with no container, and names the container", () => {
    expect(() => format(noContainer, "apa7")).toThrow("A journal article needs a container");
    expect(() => format(noContainer, "mla9")).toThrow("name of the journal");
    expect(() => format(noContainer, "chicago-ad")).toThrow("Add container");
  });

  it("rejects a chapter with no container, and names the container", () => {
    expect(() => format(chapterNoContainer, "apa7")).toThrow("A book chapter needs a container");
    expect(() => format(chapterNoContainer, "mla9")).toThrow("title of the book");
    expect(() => format(chapterNoContainer, "chicago-ad")).toThrow("Add container");
  });

  it("rejects a blank container as well as a missing one", () => {
    expect(() => format({ ...noContainer, container: "   " }, "apa7")).toThrow("needs a container");
    expect(() => format({ ...chapterNoContainer, container: "" }, "mla9")).toThrow("needs a container");
  });

  it("stops a works cited list when one source has no container", () => {
    expect(() => formatBibliography([{ ...article }, noContainer], "apa7")).toThrow("A journal article needs a container");
  });

  it("still formats a journal article and a chapter that have a container", () => {
    expect(format({ ...noContainer, container: "Journal of Study Skills" }, "apa7")).toContain("*Journal of Study Skills*");
    expect(format({ ...chapterNoContainer, container: "The Study Skills Handbook" }, "apa7")).toContain("In *The Study Skills Handbook*");
  });

  it("names the container in the tool error", async () => {
    const r = await call("format_citation", { type: "journal", title: "Learning to learn", year: "2020" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("A journal article needs a container");
    expect(r.text).toContain("Add container");
    const c = await call("format_citation", { type: "chapter", title: "Learning to learn in groups", year: "2020" });
    expect(c.isError).toBe(true);
    expect(c.text).toContain("A book chapter needs a container");
  });
});

describe("MCP tools", () => {
  it("lists six read only tools", async () => {
    const tools = (await client.listTools()).tools;
    expect(tools.map((t) => t.name).sort()).toEqual(["cite_from_doi", "cite_from_isbn", "cite_from_url", "format_bibliography", "format_citation", "in_text_citation"]);
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
  it("cites a book chapter from Crossref as a chapter, with no volume or issue", async () => {
    const r = await call("cite_from_doi", { doi: "10.1000/handbook.1", style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("Smith, J. K. (2020). Learning to learn in groups. In R. Cole (Ed.), *The Study Skills Handbook* (pp. 11-25).");
    expect(r.text).not.toMatch(/\*\d+\*/);
    expect(r.text).not.toContain("vol.");
  });
  it("cites an edited book from Crossref with the editors in the author's place", async () => {
    const r = await call("cite_from_doi", { doi: "10.1000/dict.1", style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("Patel, J., & Cole, R., Eds. (2019). *A dictionary of study words*. North Gate Press.");
  });
  it("cites a dissertation from Crossref as a thesis, with no volume or issue", async () => {
    const r = await call("cite_from_doi", { doi: "10.1349/ddlp.2889", style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("Patel, J. (2019). *Attention and memory in first year students* [Doctoral dissertation, Dartmouth College].");
    expect(r.text).not.toMatch(/\*\d+\*/);
  });
  it("cites a preprint from Crossref with the repository it was posted in", async () => {
    const r = await call("cite_from_doi", { doi: "10.1101/2020.01.30.927871", style: "mla9" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain('Stone, Alex. "A preprint about study groups." Preprint, bioRxiv, 2020,');
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
  it("falls back to Open Library search when the ISBN record is thin", async () => {
    const r = await call("cite_from_isbn", { isbn: "978-0-13-468599-1", style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("Bloch, J. (2018).");
    expect(r.text).toContain("Addison-Wesley");
  });
  it("does not guess a publisher, year or place from a search result that covers many editions", async () => {
    const r = await call("cite_from_isbn", { isbn: "978-0-14-044913-6", style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("Dostoevsky");
    for (const guess of ["Penguin", "Vintage", "Dover", "1866", "1950", "2003", "Parizh"]) expect(r.text).not.toContain(guess);
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
  it("returns all three styles from format_citation when asked", async () => {
    const r = await call("format_citation", { ...article, style: "all" });
    expect(r.isError).toBe(false);
    expect(r.text).toBe(
      [
        `APA 7\n${format(article, "apa7")}`,
        `MLA 9\n${format(article, "mla9")}`,
        `Chicago author date\n${format(article, "chicago-ad")}`,
      ].join("\n\n"),
    );
  });
  it("returns all three styles from cite_from_doi when asked", async () => {
    const r = await call("cite_from_doi", { doi: "10.1000/jss.2020.42", style: "all" });
    expect(r.isError).toBe(false);
    expect(r.text).toBe(
      [
        `APA 7\n${format(article, "apa7")}`,
        `MLA 9\n${format(article, "mla9")}`,
        `Chicago author date\n${format(article, "chicago-ad")}`,
        "(From Crossref. Check it against your style guide.)",
      ].join("\n\n"),
    );
  });
  it("takes editors in format_citation and puts them where the author goes", async () => {
    const r = await call("format_citation", { type: "book", title: "A dictionary of study words", editors: [{ family: "Patel", given: "Jamie" }, { family: "Cole", given: "Robin" }], year: "2019", publisher: "North Gate Press", style: "mla9" });
    expect(r.text).toBe("Patel, Jamie, and Robin Cole, editors. *A dictionary of study words*. North Gate Press, 2019.");
  });
  it("puts several sources in one alphabetised list", async () => {
    const r = await call("format_bibliography", {
      sources: [
        { type: "book", authors: [{ family: "Zimmer", given: "Zoe" }], year: "2021", title: "Later work", publisher: "North Gate Press" },
        { type: "book", authors: [{ family: "Adams", given: "Amy" }], year: "2019", title: "Study habits", publisher: "North Gate Press" },
      ],
      style: "apa7",
    });
    expect(r.isError).toBe(false);
    const entries = r.text.split("\n\n");
    expect(entries).toHaveLength(2);
    expect(entries[0]).toBe("Adams, A. (2019). *Study habits*. North Gate Press.");
    expect(entries[1]).toBe("Zimmer, Z. (2021). *Later work*. North Gate Press.");
  });
  it("adds looked up dois and isbns to the list with the typed sources", async () => {
    const r = await call("format_bibliography", {
      sources: [{ type: "book", authors: [{ family: "Zimmer", given: "Zoe" }], year: "2021", title: "Later work", publisher: "North Gate Press" }],
      dois: ["10.1000/jss.2020.42"],
      isbns: ["978-0-262-03384-8"],
    });
    expect(r.isError).toBeFalsy();
    const entries = r.text.split("\n\n");
    expect(entries[0]).toContain("Cormen");
    expect(entries[1]).toContain("Smith");
    expect(entries[2]).toContain("Zimmer");
    expect(r.text).toContain("Crossref and Open Library");
  });
  it("builds a list from dois alone and names a lookup that fails", async () => {
    const ok = await call("format_bibliography", { dois: ["10.1000/jss.2020.42"] });
    expect(ok.isError).toBeFalsy();
    const bad = await call("format_bibliography", { dois: ["10.1000/jss.2020.42", "10.9999/nothing"] });
    expect(bad.isError).toBe(true);
    expect(bad.text).toContain("DOI 10.9999/nothing");
  });
  it("asks for at least one source in a works cited list", async () => {
    const r = await call("format_bibliography", { sources: [] });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("at least one source");
  });
  it("gives the narrative in text citation when asked", async () => {
    const p = await call("in_text_citation", { authors: article.authors, year: "2020", page: "14", style: "apa7" });
    expect(p.text).toBe("(Smith & Jones, 2020, p. 14)");
    const n = await call("in_text_citation", { authors: article.authors, year: "2020", page: "14", style: "apa7", form: "narrative" });
    expect(n.text).toBe("Smith and Jones (2020, p. 14)");
    const m = await call("in_text_citation", { authors: article.authors, year: "2020", page: "14", style: "mla9", form: "narrative" });
    expect(m.text).toBe("Smith and Jones (14)");
  });
  it("fills the authors and year from a DOI for an in text citation", async () => {
    const p = await call("in_text_citation", { doi: "10.1000/jss.2020.42", page: "14", style: "apa7" });
    expect(p.isError).toBe(false);
    expect(p.text).toBe("(Smith & Jones, 2020, p. 14)");
    const n = await call("in_text_citation", { doi: "https://doi.org/10.1000/jss.2020.42", form: "narrative", style: "mla9" });
    expect(n.isError).toBe(false);
    expect(n.text).toBe("Smith and Jones");
  });
  it("fills the authors and year from an ISBN for an in text citation", async () => {
    const p = await call("in_text_citation", { isbn: "978-0-262-03384-8", style: "apa7" });
    expect(p.isError).toBe(false);
    expect(p.text).toBe("(Cormen & Leiserson, 2009)");
    const n = await call("in_text_citation", { isbn: "9780262033848", form: "narrative", style: "chicago-ad" });
    expect(n.isError).toBe(false);
    expect(n.text).toBe("Cormen and Leiserson (2009)");
  });
  it("asks for one identifier when both a DOI and an ISBN are given", async () => {
    const r = await call("in_text_citation", { doi: "10.1000/jss.2020.42", isbn: "978-0-262-03384-8" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("either a doi or an isbn");
  });
  it("explains a missing DOI when filling an in text citation", async () => {
    const r = await call("in_text_citation", { doi: "10.1000/missing" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("That is not a DOI I recognise");
  });
});

describe("cite from a web page", () => {
  it("cites a page in APA 7, using its title, site name and date", async () => {
    const r = await call("cite_from_url", { url: `${base}/page`, style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain(`*How to study*. (2026, October 14). Example University. ${base}/page`);
    expect(r.text).toContain("(From the page. Check it against your style guide.)");
    expect(lastUa).toContain("mailto:me@example.com");
  });

  it("cites a page in MLA 9 with the date in the MLA form", async () => {
    const r = await call("cite_from_url", { url: `${base}/page`, style: "mla9" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain('"How to study."');
    expect(r.text).toContain(`*Example University*, 14 Oct. 2026, ${base}/page.`);
  });

  it("cites all three styles with a label above each one", async () => {
    const r = await call("cite_from_url", { url: `${base}/page`, style: "all" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain(`APA 7\n*How to study*. (2026, October 14). Example University. ${base}/page`);
    expect(r.text).toContain(`MLA 9\n"How to study." *Example University*, 14 Oct. 2026, ${base}/page.`);
    expect(r.text).toContain(`Chicago author date\n2026. "How to study." Example University. ${base}/page.`);
    expect(r.text).toContain("(From the page. Check it against your style guide.)");
  });

  it("falls back to the title element when the page has no open graph tags", async () => {
    const r = await call("cite_from_url", { url: `${base}/plain`, style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain(`*A plain page*. 127.0.0.1. ${base}/plain`);
  });

  it("uses the title, site name and date you pass in instead of the page's own", async () => {
    const r = await call("cite_from_url", { url: `${base}/page`, title: "My title", site_name: "My Site", date: "October 14, 2026", style: "mla9" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain('"My title."');
    expect(r.text).toContain(`*My Site*, 14 Oct. 2026, ${base}/page.`);
  });

  it("rejects a date that does not look like a date", async () => {
    const r = await call("cite_from_url", { url: `${base}/page`, date: "last autumn" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("does not look like a date");
  });

  it("gives a friendly error when the page is missing", async () => {
    const r = await call("cite_from_url", { url: `${base}/missing` });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("was not found");
  });

  it("gives a friendly error when the page has no title", async () => {
    const r = await call("cite_from_url", { url: `${base}/notitle` });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("has no title");
  });

  it("rejects an address that is not a web address", async () => {
    const r = await call("cite_from_url", { url: "not a web address" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("does not look like a web address");
  });
});

describe("cite from a web page parsing", () => {
  it("reads the title, site name and date from JSON-LD", async () => {
    const r = await call("cite_from_url", { url: `${base}/jsonld`, style: "mla9" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain('"JSON LD Page."');
    expect(r.text).toContain("*News Site*");
    expect(r.text).toContain("1 Sept. 2026");
  });

  it("reads the date from a time element when no meta tags give it", async () => {
    const r = await call("cite_from_url", { url: `${base}/timedate`, style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("*Time Page*.");
    expect(r.text).toContain("Time Blog");
    expect(r.text).toContain("(2026, August 5)");
  });

  it("reads from twitter meta tags and date meta tag", async () => {
    const r = await call("cite_from_url", { url: `${base}/twitter`, style: "mla9" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain('"Twitter Title."');
    expect(r.text).toContain("*Twitter Site*");
    expect(r.text).toContain("10 July 2026");
  });

  it("splits the title from the pipe in the title element", async () => {
    const r = await call("cite_from_url", { url: `${base}/titlepipe`, style: "apa7" });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("*Pipe Title*.");
    expect(r.text).toContain("Pipe Site");
  });
});

describe("error messages", () => {
  it("names the ISBN when the number is the wrong shape", () => {
    expect(() => normalizeIsbn("123")).toThrow("not an ISBN I recognise");
    expect(() => normalizeIsbn("123")).not.toThrow("DOI");
  });

  it("names the ISBN through the tool when the number is the wrong shape", async () => {
    const r = await call("cite_from_isbn", { isbn: "123" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("does not look like an ISBN");
    expect(r.text).toContain("not an ISBN I recognise");
    expect(r.text).not.toContain("DOI");
  });

  it("points at format_citation once when Open Library has no book for the ISBN", async () => {
    const r = await call("cite_from_isbn", { isbn: "0306406152" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("no book for ISBN 0306406152");
    expect(r.text).not.toContain("DOI");
    expect(r.text.match(/use format_citation and type the details/g)).toHaveLength(1);
  });

  it("names the ISBN when the lookup comes back not found", async () => {
    const r = await call("cite_from_isbn", { isbn: "1111111111111" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("That is not an ISBN I recognise");
    expect(r.text).not.toContain("DOI");
  });

  it("still names the DOI for a DOI problem", async () => {
    const r = await call("cite_from_doi", { doi: "10.1000/missing" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("That is not a DOI I recognise");
    expect(() => normalizeDoi("hello")).toThrow("does not look like a DOI");
  });
});
