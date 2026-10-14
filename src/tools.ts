import { z } from "zod";
import type { HttpClient } from "./core/http.js";
import type { ToolDef } from "./core/tools.js";
import { type Source, type Style, format, inText, normalizeDoi, normalizeIsbn, splitName } from "./format.js";

export interface Api {
  crossref: HttpClient;
  openLibrary: HttpClient;
}

const style = z.enum(["apa7", "mla9", "chicago-ad"]).default("apa7").describe("Citation style. apa7, mla9 or chicago-ad (Chicago author-date).");
const author = z.object({ family: z.string().describe("Last name"), given: z.string().optional().describe("First and middle names") });

const sourceShape = {
  type: z.enum(["journal", "book", "website"]),
  authors: z.array(author).default([]),
  year: z.string().optional(),
  title: z.string(),
  container: z.string().optional().describe("Journal name or website name."),
  publisher: z.string().optional(),
  city: z.string().optional().describe("Publisher city, used by Chicago for books."),
  edition: z.string().optional().describe('For example "2nd".'),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional().describe('For example "11-25".'),
  doi: z.string().optional(),
  url: z.string().optional(),
  date_text: z.string().optional().describe('Website date as you want it shown, like "2026, October 14" for APA or "14 Oct. 2026" for MLA.'),
  accessed: z.string().optional().describe('MLA access date, like "14 Oct. 2026".'),
};

function yearOf(item: any): string | undefined {
  const parts = item?.issued?.["date-parts"]?.[0] ?? item?.published?.["date-parts"]?.[0] ?? item?.["published-print"]?.["date-parts"]?.[0] ?? item?.["published-online"]?.["date-parts"]?.[0];
  return parts?.[0] ? String(parts[0]) : undefined;
}

export const tools: ToolDef<Api>[] = [
  {
    name: "format_citation",
    title: "Format a citation",
    description: "Format a journal article, book or website as a citation in APA 7, MLA 9 or Chicago author-date, from details you provide.",
    inputSchema: { ...sourceShape, style },
    run: async (a) => {
      const { style: st, ...src } = a;
      return format(src as Source, st as Style);
    },
  },
  {
    name: "cite_from_doi",
    title: "Cite from a DOI",
    description: "Look up a DOI on Crossref and format the citation. Works for journal articles, many books and conference papers.",
    inputSchema: { doi: z.string().describe("A DOI like 10.1038/nature14539, or a doi.org link."), style },
    run: async (a, api) => {
      const doi = normalizeDoi(a.doi);
      const res: any = await api.crossref.get(`/works/${encodeURI(doi)}`);
      const m = res.message ?? res;
      const type = String(m.type ?? "");
      const src: Source = {
        type: type === "book" || type === "monograph" ? "book" : "journal",
        authors: (m.author ?? []).filter((x: any) => x.family).map((x: any) => ({ family: x.family, given: x.given })),
        year: yearOf(m),
        title: Array.isArray(m.title) ? m.title[0] : m.title,
        container: Array.isArray(m["container-title"]) ? m["container-title"][0] : m["container-title"],
        publisher: m.publisher,
        volume: m.volume,
        issue: m.issue,
        pages: m.page,
        doi: m.DOI ?? doi,
      };
      if (!src.title) throw new Error("Crossref found that DOI but it has no title, so there is nothing to cite.");
      return `${format(src, a.style as Style)}\n\n(From Crossref. Check it against your style guide.)`;
    },
  },
  {
    name: "cite_from_isbn",
    title: "Cite from an ISBN",
    description: "Look up an ISBN on Open Library and format the book citation.",
    inputSchema: { isbn: z.string().describe("A 10 or 13 digit ISBN. Dashes are fine."), style },
    run: async (a, api) => {
      const isbn = normalizeIsbn(a.isbn);
      const res: any = await api.openLibrary.get("/api/books", { bibkeys: `ISBN:${isbn}`, format: "json", jscmd: "data" });
      const b = res[`ISBN:${isbn}`];
      if (!b) throw new Error(`Open Library has no book for ISBN ${isbn}. Check the number, or use format_citation and type the details.`);
      const year = String(b.publish_date ?? "").match(/\d{4}/)?.[0];
      const src: Source = {
        type: "book",
        authors: (b.authors ?? []).map((x: any) => splitName(String(x.name))),
        year,
        title: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title,
        publisher: b.publishers?.[0]?.name,
        city: b.publish_places?.[0]?.name,
      };
      return `${format(src, a.style as Style)}\n\n(From Open Library. Check it against your style guide.)`;
    },
  },
  {
    name: "in_text_citation",
    title: "In-text citation",
    description: "The in-text citation that goes with a source, with an optional page number.",
    inputSchema: { authors: z.array(author).default([]), year: z.string().optional(), page: z.string().optional(), style },
    run: async (a) => inText(a.authors, a.year, a.style as Style, a.page),
  },
];
