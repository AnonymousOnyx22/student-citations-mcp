import { z } from "zod";
import type { HttpClient } from "./core/http.js";
import { ApiError } from "./core/http.js";
import type { ToolDef } from "./core/tools.js";
import { type Author, type Source, allStyleLabels, format, formatAnyStyle, formatBibliography, inText, narrativeInText, normalizeDoi, normalizeIsbn, normalizeStyle, normalizeStyleRequest, splitName } from "./format.js";
import { normalizeUrl, pageSource, parsePage, parsePageDate } from "./page.js";

export interface Api {
  crossref: HttpClient;
  openLibrary: HttpClient;
  web: HttpClient;
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
          // A search result describes the whole work, with every edition's publishers, years and places. Use a value only when
          // the result lists exactly one, since the first of many is as likely to be another edition's, and a wrong year or
          // publisher in a citation is worse than a missing one.
          const only = (list: unknown): string | undefined => (Array.isArray(list) && list.length === 1 && list[0] != null ? String(list[0]) : undefined);
          if (!src.publisher) src.publisher = only(doc.publisher) ?? src.publisher;
          if (!src.year) src.year = only(doc.publish_year) ?? src.year;
          if (!src.city) src.city = only(doc.publish_place) ?? src.city;
        }
      } catch {
        // Search fallback failed, return what we have
      }
    }
    if (!src.city) {
      try {
        // The edition record is for this ISBN alone, so its first place is this edition's, unlike the search result for the whole work.
        const edition: any = await api.openLibrary.get(`/isbn/${isbn}.json`);
        const place = Array.isArray(edition?.publish_places) ? edition.publish_places[0] : undefined;
        if (typeof place === "string" && place.trim()) src.city = place.trim();
      } catch {
        // No edition record, leave the city empty
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

/** The most DOIs and ISBNs one works cited list will look up, so a single call stays a fair load on Crossref and Open Library. */
const maxLookups = 50;
/** How many of those lookups run at the same time. */
const lookupsAtOnce = 5;

/** The fields a citation of this type usually needs that a Crossref record left empty. */
function thinFields(src: Source): string[] {
  const needed: Array<[string, string | undefined]> = [["year", src.year]];
  if (src.type === "journal") needed.push(["volume", src.volume], ["pages", src.pages], ["journal name", src.container]);
  else if (src.type === "chapter") needed.push(["pages", src.pages], ["book title", src.container], ["publisher", src.publisher]);
  else if (src.type === "book") needed.push(["publisher", src.publisher]);
  return needed.filter(([, v]) => !v?.trim()).map(([name]) => name);
}

export const tools: ToolDef<Api>[] = [
  {
    name: "format_citation",
    title: "Format a citation",
    description: "Format a journal article, book, website, book chapter, thesis, report, dataset or preprint as a citation in APA 7, MLA 9, Chicago author date or IEEE, from details you provide. Inputs: type (journal, book, website, chapter, thesis, report, dataset or preprint), title, and optional authors (family plus given names), year, container, publisher, city, edition, editors, translators, volume, issue, pages, doi, url, date_text, accessed, institution, degree, repository, report_number and style (apa7, mla9, chicago-ad, ieee or all). Pass all to get all three styles in one reply, each one with its style name on the line above it. Editors and translators are for books and take the same shape as authors: a book with editors and no authors puts the editors where the author goes, and a book with authors too carries the other names after the title, in the spot each style uses. Example prompt: \"Cite this journal article in APA 7: Learning to learn by John Kenneth Smith and Alice Jones, 2020, Journal of Study Skills, volume 4, issue 2, pages 11-25.\"",
    inputSchema: { ...sourceShape, style: styleAll },
    run: async (a) => {
      const { style: st, ...src } = a;
      return formatAnyStyle(src as Source, st ?? "apa7");
    },
  },
  {
    name: "format_bibliography",
    title: "Format a works cited list",
    description: "Format several sources at once as one works cited list, alphabetised by the first author's family name in APA 7, MLA 9 or Chicago author date, or numbered in citation order in IEEE. A source with no author is alphabetised by its title. Inputs: sources (an array of objects, each with the same fields as format_citation: type, title and optional authors, year, container, publisher, city, edition, editors, translators, volume, issue, pages, doi, url, date_text, accessed, institution, degree, repository and report_number), dois (a list of DOIs to look up on Crossref), isbns (a list of ISBNs to look up on Open Library), urls (a list of web addresses to fetch and cite as websites) and style (apa7, mla9, chicago-ad or ieee). Give sources, dois, isbns, urls or any mix, up to 50 lookups in one call. If one lookup fails the reply is an error that names it. Example prompt: \"Put these three sources into an APA works cited list: a journal article by Smith and Jones from 2020, a book by Cormen from 2009 and a website from example.edu.\"",
    inputSchema: {
      sources: z.array(z.object(sourceShape)).default([]).describe("The sources for the list. Each one takes the same fields as format_citation, so a journal article, a book, a website, a chapter, a thesis, a report, a dataset and a preprint can share one list. Optional when you give dois or isbns."),
      dois: z.array(z.string()).default([]).describe("DOIs to look up on Crossref and add to the list, each one a DOI like 10.1038/nature14539 or a doi.org link."),
      isbns: z.array(z.string()).default([]).describe("ISBNs to look up on Open Library and add to the list as books. Dashes are fine."),
      urls: z.array(z.string()).default([]).describe("Web addresses to fetch and add to the list as websites. Each one a full URL like https://example.edu/study."),
      style,
    },
    run: async (a, api) => {
      const st = normalizeStyle(a.style ?? "apa7");
      const dois: string[] = a.dois ?? [];
const isbns: string[] = a.isbns ?? [];
const urls: string[] = a.urls ?? [];
if (dois.length + isbns.length + urls.length > maxLookups) throw new Error(`Give at most ${maxLookups} dois, isbns and urls in one list. Split a longer list into two calls.`);
const named = (id: string, p: Promise<Source>) =>
  p.catch((err) => {
    throw new Error(`${id}: ${err instanceof Error ? err.message : String(err)}`);
  });
// look them up a few at a time, so a long list is not a burst of 50 requests at once on Crossref and Open Library
const jobs: Array<() => Promise<Source>> = [
  ...dois.map((d) => () => named(`DOI ${d}`, sourceFromDoi(d, api))),
  ...isbns.map((i) => () => named(`ISBN ${i}`, sourceFromIsbn(i, api))),
  ...urls.map((u) => () => named(`URL ${u}`, (async () => {
    const url = normalizeUrl(u);
    const html = await api.web.getText(url);
    const page = parsePage(html, url);
    if (!page.title) throw new Error("That page has no title, so there is nothing to cite. Use format_citation and type the details.");
    return pageSource(page, url, st);
  })())),
];
      const found: Source[] = [];
      for (let at = 0; at < jobs.length; at += lookupsAtOnce) found.push(...(await Promise.all(jobs.slice(at, at + lookupsAtOnce).map((job) => job()))));
      const list = formatBibliography([...((a.sources ?? []) as Source[]), ...found], st);
      return found.length ? `${list}\n\n(The entries from dois and isbns come from Crossref and Open Library. Check them against your style guide.)` : list;
    },
  },
  {
    name: "cite_from_doi",
    title: "Cite from a DOI",
    description: "Look up a DOI on Crossref and format the citation. The Crossref record decides the shape: a journal article, a book or an edited book, a book chapter or a conference paper, a thesis, a report, a dataset or a preprint. Inputs: doi (a DOI like 10.1038/nature14539 or a doi.org link) and style (apa7, mla9, chicago-ad, ieee or all). Pass all to get all three styles in one reply, each one with its style name on the line above it. Example prompt: \"Cite 10.1038/nature14539 in APA.\"",
    inputSchema: { doi: z.string().describe("A DOI like 10.1038/nature14539, or a doi.org link."), style: styleAll },
    run: async (a, api) => {
      const st = normalizeStyleRequest(a.style ?? "apa7");
      const src = await sourceFromDoi(a.doi, api);
      const thin = thinFields(src);
      const warning = thin.length ? ` The Crossref record has no ${thin.length > 1 ? `${thin.slice(0, -1).join(", ")} or ${thin[thin.length - 1]}` : thin[0]}, so check ${thin.length === 1 ? "that" : "those"} in the source.` : "";
      return `${formatAnyStyle(src, st)}\n\n(From Crossref. Check it against your style guide.${warning})`;
    },
  },
  {
    name: "find_doi",
    title: "Find a DOI from a title",
    description: "Search Crossref for the DOI of a paper or a book when you have its title but no DOI. Returns the best matches, 5 by default, each with its title, authors, year, container and DOI, so you can pick the right one and pass the DOI to cite_from_doi. Inputs: title (the title, or as much of it as you know), optional author (a family name to narrow the search) and optional limit (1 to 10 matches). Example prompt: \"Find the DOI for the paper Deep learning by LeCun.\"",
    inputSchema: {
      title: z.string().describe("The title of the paper or book, or as much of it as you know."),
      author: z.string().optional().describe("An author's family name, to narrow the search."),
      limit: z.number().int().min(1).max(10).default(5).describe("How many matches to return, 1 to 10."),
    },
    run: async (a, api) => {
      const title = String(a.title ?? "").trim();
      if (!title) throw new Error("Give the title of the paper or book to look up.");
      const query: Record<string, string | number> = { "query.bibliographic": title, rows: a.limit ?? 5, select: "DOI,title,author,issued,published,container-title,type" };
      if (a.author?.trim()) query["query.author"] = a.author.trim();
      let res: any;
      try {
        res = await api.crossref.get("/works", query);
      } catch (err) {
        if (err instanceof ApiError) throw new ApiError(`${err.message}. Try again, or use cite_from_doi if you can find the DOI on the paper.`, err.status, err.body);
        throw err;
      }
      const items: any[] = (res?.message?.items ?? []).filter((m: any) => m?.DOI && (Array.isArray(m.title) ? m.title[0] : m.title));
      if (!items.length) return "Crossref found no match for that title. Check the spelling, try fewer words, or use format_citation and type the details.";
      const lines = items.map((m, i) => {
        const src = crossrefSource(m, m.DOI);
        const names = src.authors.slice(0, 3).map((x) => x.family).join(", ") + (src.authors.length > 3 ? " and others" : "");
        const parts = [src.title, names, src.year, src.container].filter((x) => x && String(x).trim());
        return `${i + 1}. ${parts.join(". ")}. DOI: ${m.DOI}`;
      });
      return `${lines.join("\n")}\n\n(From Crossref. Check that the title and authors are the work you mean, then pass the DOI to cite_from_doi.)`;
    },
  },
  {
    name: "cite_from_url",
    title: "Cite from a web page",
    description: "Fetch a web page and format it as a website citation in APA 7, MLA 9, Chicago author date or IEEE. It reads the page title, the site name and the date from the page. Inputs: url (a full web address), style (apa7, mla9, chicago-ad, ieee or all), and optional title, site_name and date to replace what the page gives. Pass all to get all three styles in one reply, each one with its style name on the line above it. Example prompt: \"Cite this page in APA: https://example.edu/study.\"",
    inputSchema: {
      url: z.string().describe("A full web address, like https://example.edu/study."),
      style: styleAll,
      title: z.string().optional().describe("Use this title instead of the one on the page."),
      site_name: z.string().optional().describe("Use this site name instead of the one on the page."),
      date: z.string().optional().describe("Use this date instead of the one on the page, like 2026-10-14 or October 14, 2026."),
    },
    run: async (a, api) => {
      const url = normalizeUrl(a.url);
      let html: string;
      try {
        html = await api.web.getText(url);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            throw new ApiError("That page was not found. Check the web address, or use format_citation and type the details.", err.status, err.body);
          }
          throw new ApiError(`${err.message} Check the web address, or use format_citation and type the details.`, err.status, err.body);
        }
        throw err;
      }
      const page = parsePage(html, url);
      if (a.title?.trim()) page.title = a.title.trim();
      if (a.site_name?.trim()) page.siteName = a.site_name.trim();
      if (a.date?.trim()) {
        const date = parsePageDate(a.date);
        if (!date) throw new Error(`"${a.date}" does not look like a date. Give a date like 2026-10-14 or October 14, 2026.`);
        page.year = date.year;
        page.month = date.month;
        page.day = date.day;
      }
      if (!page.title) throw new Error("That page has no title, so there is nothing to cite. Use format_citation and type the details.");
      const st = normalizeStyleRequest(a.style ?? "apa7");
      const note = "(From the page. Check it against your style guide.)";
      if (st === "all") {
        return `${allStyleLabels.map(({ style: s, label }) => `${label}\n${format(pageSource(page, url, s), s)}`).join("\n\n")}\n\n${note}`;
      }
      return `${format(pageSource(page, url, st), st)}\n\n${note}`;
    },
  },
  {
    name: "cite_from_isbn",
    title: "Cite from an ISBN",
    description: "Look up an ISBN on Open Library and format the book citation in APA 7, MLA 9, Chicago author date or IEEE. Inputs: isbn (a 10 or 13 digit ISBN, dashes are fine) and style (apa7, mla9, chicago-ad or ieee). Example prompt: \"Cite ISBN 978-0-262-03384-8 in MLA 9.\"",
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
    description: "The in text citation that goes with a source, with an optional page number and an optional narrative form for a sentence where the author is named. Give authors and year, or a doi or an isbn and the record fills them in. Inputs: authors (family name plus optional given names), year, doi, isbn, page, form (parenthetical or narrative) and style (apa7, mla9, chicago-ad or ieee). A doi or an isbn cannot be combined with the other one. Example prompt: \"Give the APA in text citation for Smith and Jones 2020 on page 14.\"",
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
