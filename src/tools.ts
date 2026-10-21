import { z } from "zod";
import type { HttpClient } from "./core/http.js";
import { ApiError } from "./core/http.js";
import type { ToolDef } from "./core/tools.js";
import { type Source, format, inText, narrativeInText, normalizeDoi, normalizeIsbn, normalizeStyle, splitName } from "./format.js";

export interface Api {
  crossref: HttpClient;
  openLibrary: HttpClient;
}

const style = z.string().default("apa7").describe("Citation style. Aliases such as APA, MLA 9 and Chicago are accepted. Valid styles: apa7, mla9, chicago-ad (Chicago author date).");
const form = z.enum(["parenthetical", "narrative"]).default("parenthetical").describe("parenthetical is the usual brackets, like (Smith & Jones, 2020, p. 14). narrative puts the author in your sentence and keeps the rest in brackets, like Smith and Jones (2020, p. 14).");
const author = z.object({ family: z.string().describe("Last name"), given: z.string().optional().describe("First and middle names") });

const sourceShape = {
  type: z.enum(["journal", "book", "website"]),
  authors: z.array(author).default([]),
  editors: z.array(author).optional().describe("Editors of a book, same shape as authors. When a book has editors and no authors, they take the author's place in the citation."),
  translators: z.array(author).optional().describe("Translators of a book, same shape as authors."),
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
    description: "Format a journal article, book or website as a citation in APA 7, MLA 9 or Chicago author date, from details you provide. Inputs: type (journal, book or website), title, and optional authors (family plus given names), year, container, publisher, city, edition, editors, translators, volume, issue, pages, doi, url, date_text, accessed and style (apa7, mla9 or chicago-ad). Editors and translators are for books and take the same shape as authors: a book with editors and no authors puts the editors where the author goes, and a book with authors too carries the other names after the title, in the spot each style uses. Example prompt: \"Cite this journal article in APA 7: Learning to learn by John Kenneth Smith and Alice Jones, 2020, Journal of Study Skills, volume 4, issue 2, pages 11-25.\"",
    inputSchema: { ...sourceShape, style },
    run: async (a) => {
      const { style: st, ...src } = a;
      return format(src as Source, normalizeStyle(st ?? "apa7"));
    },
  },
  {
    name: "cite_from_doi",
    title: "Cite from a DOI",
    description: "Look up a DOI on Crossref and format the citation. Works for journal articles, many books and conference papers. Inputs: doi (a DOI like 10.1038/nature14539 or a doi.org link) and style (apa7, mla9 or chicago-ad). Example prompt: \"Cite 10.1038/nature14539 in APA.\"",
    inputSchema: { doi: z.string().describe("A DOI like 10.1038/nature14539, or a doi.org link."), style },
    run: async (a, api) => {
      const st = normalizeStyle(a.style ?? "apa7");
      const doi = normalizeDoi(a.doi);
      try {
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
        if (!src.title) throw new Error("Crossref found that DOI but it has no title, so there is nothing to cite. Use format_citation and type the details.");
        return `${format(src, st)}\n\n(From Crossref. Check it against your style guide.)`;
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            throw new ApiError(`${err.message} That is not a DOI I recognise, or use format_citation and type the details.`, err.status, err.body);
          }
          throw new ApiError(`${err.message}. Use format_citation and type the details instead (offline typed details path).`, err.status, err.body);
        }
        throw err;
      }
    },
  },
  {
    name: "cite_from_isbn",
    title: "Cite from an ISBN",
    description: "Look up an ISBN on Open Library and format the book citation. Inputs: isbn (a 10 or 13 digit ISBN, dashes are fine) and style (apa7, mla9 or chicago-ad). Example prompt: \"Cite ISBN 978-0-262-03384-8 in MLA 9.\"",
    inputSchema: { isbn: z.string().describe("A 10 or 13 digit ISBN. Dashes are fine."), style },
    run: async (a, api) => {
      const st = normalizeStyle(a.style ?? "apa7");
      const isbn = normalizeIsbn(a.isbn);
      try {
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
        return `${format(src, st)}\n\n(From Open Library. Check it against your style guide.)`;
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            throw new ApiError(`${err.message} That is not an ISBN I recognise, or use format_citation and type the details.`, err.status, err.body);
          }
          throw new ApiError(`${err.message}. Use format_citation and type the details instead (offline typed details path).`, err.status, err.body);
        }
        throw err;
      }
    },
  },
  {
    name: "in_text_citation",
    title: "In text citation",
    description: "The in text citation that goes with a source, with an optional page number and an optional narrative form for a sentence where the author is named. Inputs: authors (family name plus optional given names), year, page, form (parenthetical or narrative) and style (apa7, mla9 or chicago-ad). Example prompt: \"Give the APA in text citation for Smith and Jones 2020 on page 14.\"",
    inputSchema: { authors: z.array(author).default([]), year: z.string().optional(), page: z.string().optional(), form, style },
    run: async (a) => (a.form === "narrative" ? narrativeInText(a.authors, a.year, normalizeStyle(a.style ?? "apa7"), a.page) : inText(a.authors, a.year, normalizeStyle(a.style ?? "apa7"), a.page)),
  },
];
