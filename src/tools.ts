import { z } from "zod";
import type { HttpClient } from "./core/http.js";
import { ApiError } from "./core/http.js";
import type { ToolDef } from "./core/tools.js";
import { type Author, type Source, format, formatAnyStyle, formatBibliography, inText, narrativeInText, normalizeDoi, normalizeIsbn, normalizeStyle, normalizeStyleRequest, splitName } from "./format.js";

export interface Api {
  crossref: HttpClient;
  openLibrary: HttpClient;
}

const style = z.string().default("apa7").describe("Citation style. Aliases such as APA, MLA 9 and Chicago are accepted. Valid styles: apa7, mla9, chicago-ad (Chicago author date).");
const styleAll = z.string().default("apa7").describe("Citation style. Aliases such as APA, MLA 9 and Chicago are accepted. Valid styles: apa7, mla9, chicago-ad (Chicago author date), or all to get all three in one reply with a label above each one.");
const form = z.enum(["parenthetical", "narrative"]).default("parenthetical").describe("parenthetical is the usual brackets, like (Smith & Jones, 2020, p. 14). narrative puts the author in your sentence and keeps the rest in brackets, like Smith and Jones (2020, p. 14).");
const author = z.object({ family: z.string().describe("Last name"), given: z.string().optional().describe("First and middle names") });

const sourceShape = {
  type: z.enum(["journal", "book", "website", "chapter", "thesis", "report", "dataset", "preprint"]),
  authors: z.array(author).default([]),
  editors: z.array(author).optional().describe("Editors of a book or a chapter, same shape as authors. When a book has editors and no authors, they take the author's place in the citation."),
  translators: z.array(author).optional().describe("Translators of a book, same shape as authors."),
  year: z.string().optional(),
  title: z.string(),
  container: z.string().optional().describe("Journal name, the book title for a chapter, or website name. Required for a journal article and for a chapter, since without it the citation would be missing the work it appears in."),
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
  institution: z.string().optional().describe("The university or organisation behind a thesis, a report or a dataset."),
  degree: z.string().optional().describe('The degree of a thesis, like "Ph.D.".'),
  repository: z.string().optional().describe("Where a preprint was posted, like arXiv."),
  report_number: z.string().optional().describe("The number of a report or a standard."),
};

/** How each Crossref work type becomes the kind of source the formatter knows. */
const crossrefKinds: Record<string, Source["type"]> = {
  "journal-article": "journal",
  book: "book",
  monograph: "book",
  "edited-book": "book",
  "reference-book": "book",
  proceedings: "book",
  "book-chapter": "chapter",
  "proceedings-article": "chapter",
  dissertation: "thesis",
  report: "report",
  standard: "report",
  dataset: "dataset",
  "posted-content": "preprint",
  "peer-review": "journal",
};

/** The kind of source for a Crossref work type. A type we do not know stays a journal article. */
export function crossrefKind(type: string): Source["type"] {
  return crossrefKinds[type] ?? "journal";
}

/** The people on a Crossref record, in the shape the formatter takes. */
function crossrefPeople(list: any): Author[] {
  return (Array.isArray(list) ? list : [])
    .filter((x: any) => x?.family)
    .map((x: any) => ({ family: x.family, given: x.given }));
}

/** The first name on a Crossref list, like the institution behind a thesis. */
function crossrefFirst(list: any): string | undefined {
  const first = Array.isArray(list) ? list[0] : undefined;
  if (first?.name) return String(first.name);
  if (typeof first === "string") return first;
  return undefined;
}

/** The year of a Crossref record, including the posted date that a preprint carries. */
function yearOf(item: any): string | undefined {
  const parts = item?.issued?.["date-parts"]?.[0] ?? item?.published?.["date-parts"]?.[0] ?? item?.["published-print"]?.["date-parts"]?.[0] ?? item?.["published-online"]?.["date-parts"]?.[0] ?? item?.posted?.["date-parts"]?.[0];
  return parts?.[0] ? String(parts[0]) : undefined;
}

/** A Crossref record as a source the formatter can lay out. */
export function crossrefSource(m: any, doi: string): Source {
  const type = crossrefKind(String(m?.type ?? ""));
  const editors = crossrefPeople(m?.editor);
  const translators = crossrefPeople(m?.translator);
  const institution = crossrefFirst(m?.institution);
  const repository = institution ?? m?.publisher;
  const src: Source = {
    type,
    authors: crossrefPeople(m?.author),
    editors: editors.length ? editors : undefined,
    translators: translators.length ? translators : undefined,
    year: yearOf(m),
    title: Array.isArray(m?.title) ? m.title[0] : m?.title,
    container: Array.isArray(m?.["container-title"]) ? m["container-title"][0] : m?.["container-title"],
    publisher: m?.publisher,
    volume: m?.volume,
    issue: m?.issue,
    pages: m?.page,
    doi: m?.DOI ?? doi,
  };
  if (type === "chapter") src.editors = editors;
  if (type === "thesis") {
    src.institution = institution;
    src.degree = Array.isArray(m?.degree) ? m.degree[0] : m?.degree;
    src.publisher = m?.publisher ?? institution;
  }
  if (type === "report") {
    src.report_number = m?.number ? String(m.number) : undefined;
    src.institution = institution;
    src.publisher = m?.publisher ?? institution;
  }
  if (type === "dataset") {
    src.institution = institution;
    src.publisher = m?.publisher ?? institution;
  }
  if (type === "preprint") src.repository = repository;
  return src;
}

/** The source behind a DOI, as Crossref gives it, or an ApiError that says what to try instead. */
async function sourceFromDoi(input: string, api: Api): Promise<Source> {
  const doi = normalizeDoi(input);
  try {
    const res: any = await api.crossref.get(`/works/${encodeURI(doi)}`);
    const m = res.message ?? res;
    const src = crossrefSource(m, doi);
    if (!src.title) throw new Error("Crossref found that DOI but it has no title, so there is nothing to cite. Use format_citation and type the details.");
    return src;
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        throw new ApiError(`${err.message} That is not a DOI I recognise, or use format_citation and type the details.`, err.status, err.body);
      }
      throw new ApiError(`${err.message}. Use format_citation and type the details instead (offline typed details path).`, err.status, err.body);
    }
    throw err;
  }
}

/** The source behind an ISBN, as Open Library gives it, or an error that says what to try instead. */
async function sourceFromIsbn(input: string, api: Api): Promise<Source> {
  const isbn = normalizeIsbn(input);
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
    if (!src.publisher || !src.year) {
      try {
        const searchRes: any = await api.openLibrary.get("/search.json", { q: `isbn:${isbn}`, limit: 1 });
        const doc = searchRes.docs?.[0];
        if (doc) {
          if (!src.publisher && doc.publisher?.[0]) src.publisher = doc.publisher[0];
          if (!src.year && doc.publish_year?.[0]) src.year = String(doc.publish_year[0]);
          if (!src.city && doc.publish_place?.[0]) src.city = doc.publish_place[0];
        }
      } catch {
        // Search fallback failed, return what we have
      }
    }
    return src;
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        throw new ApiError(`${err.message} That is not an ISBN I recognise, or use format_citation and type the details.`, err.status, err.body);
      }
      throw new ApiError(`${err.message}. Use format_citation and type the details instead (offline typed details path).`, err.status, err.body);
    }
    throw err;
  }
}

export const tools: ToolDef<Api>[] = [
  {
    name: "format_citation",
    title: "Format a citation",
    description: "Format a journal article, book, website, book chapter, thesis, report, dataset or preprint as a citation in APA 7, MLA 9 or Chicago author date, from details you provide. Inputs: type (journal, book, website, chapter, thesis, report, dataset or preprint), title, and optional authors (family plus given names), year, container, publisher, city, edition, editors, translators, volume, issue, pages, doi, url, date_text, accessed, institution, degree, repository, report_number and style (apa7, mla9, chicago-ad or all). Pass all to get all three styles in one reply, each one with its style name on the line above it. Editors and translators are for books and take the same shape as authors: a book with editors and no authors puts the editors where the author goes, and a book with authors too carries the other names after the title, in the spot each style uses. Example prompt: \"Cite this journal article in APA 7: Learning to learn by John Kenneth Smith and Alice Jones, 2020, Journal of Study Skills, volume 4, issue 2, pages 11-25.\"",
    inputSchema: { ...sourceShape, style: styleAll },
    run: async (a) => {
      const { style: st, ...src } = a;
      return formatAnyStyle(src as Source, st ?? "apa7");
    },
  },
  {
    name: "format_bibliography",
    title: "Format a works cited list",
    description: "Format several sources at once as one works cited list, alphabetised by the first author's family name, in APA 7, MLA 9 or Chicago author date. A source with no author is alphabetised by its title. Inputs: sources (an array of objects, each with the same fields as format_citation: type, title and optional authors, year, container, publisher, city, edition, editors, translators, volume, issue, pages, doi, url, date_text, accessed, institution, degree, repository and report_number) and style (apa7, mla9 or chicago-ad). Example prompt: \"Put these three sources into an APA works cited list: a journal article by Smith and Jones from 2020, a book by Cormen from 2009 and a website from example.edu.\"",
    inputSchema: {
      sources: z.array(z.object(sourceShape)).describe("The sources for the list. Each one takes the same fields as format_citation, so a journal article, a book, a website, a chapter, a thesis, a report, a dataset and a preprint can share one list."),
      style,
    },
    run: async (a) => formatBibliography(a.sources as Source[], normalizeStyle(a.style ?? "apa7")),
  },
  {
    name: "cite_from_doi",
    title: "Cite from a DOI",
    description: "Look up a DOI on Crossref and format the citation. The Crossref record decides the shape: a journal article, a book or an edited book, a book chapter or a conference paper, a thesis, a report, a dataset or a preprint. Inputs: doi (a DOI like 10.1038/nature14539 or a doi.org link) and style (apa7, mla9, chicago-ad or all). Pass all to get all three styles in one reply, each one with its style name on the line above it. Example prompt: \"Cite 10.1038/nature14539 in APA.\"",
    inputSchema: { doi: z.string().describe("A DOI like 10.1038/nature14539, or a doi.org link."), style: styleAll },
    run: async (a, api) => {
      const st = normalizeStyleRequest(a.style ?? "apa7");
      const src = await sourceFromDoi(a.doi, api);
      return `${formatAnyStyle(src, st)}\n\n(From Crossref. Check it against your style guide.)`;
    },
  },
  {
    name: "cite_from_isbn",
    title: "Cite from an ISBN",
    description: "Look up an ISBN on Open Library and format the book citation. Inputs: isbn (a 10 or 13 digit ISBN, dashes are fine) and style (apa7, mla9 or chicago-ad). Example prompt: \"Cite ISBN 978-0-262-03384-8 in MLA 9.\"",
    inputSchema: { isbn: z.string().describe("A 10 or 13 digit ISBN. Dashes are fine."), style },
    run: async (a, api) => {
      const st = normalizeStyle(a.style ?? "apa7");
      const src = await sourceFromIsbn(a.isbn, api);
      return `${format(src, st)}\n\n(From Open Library. Check it against your style guide.)`;
    },
  },
  {
    name: "in_text_citation",
    title: "In text citation",
    description: "The in text citation that goes with a source, with an optional page number and an optional narrative form for a sentence where the author is named. Give authors and year, or a doi or an isbn and the record fills them in. Inputs: authors (family name plus optional given names), year, doi, isbn, page, form (parenthetical or narrative) and style (apa7, mla9 or chicago-ad). A doi or an isbn cannot be combined with the other one. Example prompt: \"Give the APA in text citation for Smith and Jones 2020 on page 14.\"",
    inputSchema: {
      authors: z.array(author).default([]),
      year: z.string().optional(),
      doi: z.string().optional().describe("A DOI like 10.1038/nature14539, or a doi.org link. The lookup fills in the authors and the year."),
      isbn: z.string().optional().describe("A 10 or 13 digit ISBN. Dashes are fine. The lookup fills in the authors and the year."),
      page: z.string().optional(),
      form,
      style,
    },
    run: async (a, api) => {
      const st = normalizeStyle(a.style ?? "apa7");
      if (a.doi && a.isbn) throw new Error("Give either a doi or an isbn, not both. They each look up one source.");
      let authors = a.authors ?? [];
      let year = a.year;
      if (a.doi) {
        const src = await sourceFromDoi(a.doi, api);
        authors = src.authors;
        year = src.year;
      } else if (a.isbn) {
        const src = await sourceFromIsbn(a.isbn, api);
        authors = src.authors;
        year = src.year;
      }
      return a.form === "narrative" ? narrativeInText(authors, year, st, a.page) : inText(authors, year, st, a.page);
    },
  },
];
