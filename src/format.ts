export type Style = "apa7" | "mla9" | "chicago-ad";

export interface Author {
  family: string;
  given?: string;
}

export interface Source {
  type: "journal" | "book" | "website";
  authors: Author[];
  editors?: Author[]; // for books, they take the author's place when there are no authors
  translators?: Author[]; // for books
  year?: string;
  title: string;
  container?: string; // journal name or website name
  publisher?: string;
  city?: string;
  edition?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  date_text?: string; // for websites, like "2026, October 14" (APA) or "14 Oct. 2026" (MLA)
  accessed?: string;
}

function initials(given = ""): string {
  return given
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .map((p) => (p[0] ? p[0].toUpperCase() + "." : ""))
        .join("-"),
    )
    .join(" ");
}

function apaAuthors(a: Author[]): string {
  if (a.length === 0) return "";
  const names = a.slice(0, 20).map((x) => (x.given ? `${x.family}, ${initials(x.given)}` : x.family));
  if (a.length > 20) return `${names.slice(0, 19).join(", ")}, . . . ${names[19]}`;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

function inverted(x: Author): string {
  return x.given ? `${x.family}, ${x.given}` : x.family;
}

function normal(x: Author): string {
  return x.given ? `${x.given} ${x.family}` : x.family;
}

function mlaAuthors(a: Author[]): string {
  if (a.length === 0) return "";
  if (a.length === 1) return inverted(a[0]);
  if (a.length === 2) return `${inverted(a[0])}, and ${normal(a[1])}`;
  return `${inverted(a[0])}, et al`;
}

/** The same name list with the period on "et al.", as Chicago writes it. */
function chicagoNames(a: Author[]): string {
  return mlaAuthors(a).replace(/, et al$/, ", et al.");
}

/** Names in reading order for "Translated by" and "Edited by". Three or more become the first name plus et al. */
function people(a: Author[]): string {
  if (a.length === 1) return normal(a[0]);
  if (a.length === 2) return `${normal(a[0])} and ${normal(a[1])}`;
  return `${normal(a[0])} et al.`;
}

/** One role word or two, so one editor is "ed." and two are "eds.". */
const role = (a: Author[], one: string, many: string) => (a.length === 1 ? one : many);

const dash = (p?: string) => (p ? p.replace(/\s*-\s*/g, "-") : p);
const end = (s: string) => (/[.?!]$/.test(s) ? s : s + ".");
const link = (s: Source) => (s.doi ? `https://doi.org/${s.doi}` : s.url ?? "");

export function format(s: Source, styleInput: Style | string): string {
  const style = normalizeStyle(styleInput);
  const parts: string[] = [];
  const push = (x?: string) => {
    if (x && x.trim()) parts.push(x.trim());
  };
  if (style === "apa7") {
    const who = apaAuthors(s.authors);
    const date = s.type === "website" && s.date_text ? s.date_text : s.year ?? "n.d.";
    if (s.type === "journal") {
      push(who ? end(who) + ` (${date}).` : undefined);
      if (!who) push(`${end(s.title)} (${date}).`);
      else push(end(s.title));
      const vol = s.volume ? `*${s.container ?? ""}*, *${s.volume}*${s.issue ? `(${s.issue})` : ""}` : `*${s.container ?? ""}*`;
      push(`${vol}${s.pages ? `, ${dash(s.pages)}` : ""}.`);
      push(link(s));
    } else if (s.type === "book") {
      const eds = s.editors ?? [];
      const trs = s.translators ?? [];
      if (who) push(`${end(who)} (${date}).`);
      else if (eds.length) push(`${end(`${apaAuthors(eds)}, ${role(eds, "Ed.", "Eds.")}`)} (${date}).`);
      const inside = [
        s.edition ? `${s.edition} ed.` : "",
        eds.length && who ? `${apaAuthors(eds)}, ${role(eds, "Ed.", "Eds.")}` : "",
        trs.length ? `${apaAuthors(trs)}, Trans.` : "",
      ]
        .filter(Boolean)
        .join("; ");
      push(end(`*${s.title}*${inside ? ` (${inside})` : ""}`));
      push(s.publisher ? end(s.publisher) : undefined);
      push(link(s));
    } else {
      if (who) push(`${end(who)} (${date}).`);
      push(end(`*${s.title}*`));
      push(s.container ? end(s.container) : undefined);
      push(link(s));
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }
  if (style === "mla9") {
    const who = mlaAuthors(s.authors);
    if (s.type === "journal") {
      push(who ? end(who) : undefined);
      push(`"${end(s.title)}"`);
      const bits = [`*${s.container ?? ""}*`, s.volume ? `vol. ${s.volume}` : "", s.issue ? `no. ${s.issue}` : "", s.year ?? "", s.pages ? `pp. ${s.pages}` : "", link(s)].filter(Boolean);
      push(end(bits.join(", ")));
    } else if (s.type === "book") {
      const eds = s.editors ?? [];
      const trs = s.translators ?? [];
      if (who) push(end(who));
      else if (eds.length) push(end(`${mlaAuthors(eds)}, ${role(eds, "editor", "editors")}`));
      push(end(`*${s.title}*`));
      const bits = [
        s.edition ? `${s.edition} ed.` : "",
        trs.length ? `Translated by ${people(trs)}` : "",
        eds.length && who ? `Edited by ${people(eds)}` : "",
        s.publisher ?? "",
        s.year ?? "",
      ].filter(Boolean);
      push(bits.length ? end(bits.join(", ")) : undefined);
    } else {
      push(who ? end(who) : undefined);
      push(`"${end(s.title)}"`);
      const bits = [s.container ? `*${s.container}*` : "", s.date_text ?? s.year ?? "", s.url ?? ""].filter(Boolean);
      push(end(bits.join(", ")));
      if (s.accessed) push(`Accessed ${s.accessed}.`);
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }
  // Chicago author date
  const who = chicagoNames(s.authors);
  const year = s.year ?? "n.d.";
  if (s.type === "journal") {
    push(who ? end(who) : undefined);
    push(end(year));
    push(`"${end(s.title)}"`);
    const vi = `${s.volume ?? ""}${s.issue ? ` (${s.issue})` : ""}`;
    push(end(`*${s.container ?? ""}*${vi ? ` ${vi}` : ""}${s.pages ? `: ${dash(s.pages)}` : ""}`));
    push(link(s) ? end(link(s)) : undefined);
  } else if (s.type === "book") {
    const eds = s.editors ?? [];
    const trs = s.translators ?? [];
    if (who) push(end(who));
    else if (eds.length) push(end(`${chicagoNames(eds)}, ${role(eds, "ed.", "eds.")}`));
    push(end(year));
    const after = [
      s.edition ? `${s.edition} ed.` : "",
      trs.length ? `Translated by ${people(trs)}` : "",
      eds.length && who ? `Edited by ${people(eds)}` : "",
    ]
      .filter(Boolean)
      .map((x) => end(x))
      .join(" ");
    push(end(`*${s.title}*${after ? `. ${after}` : ""}`));
    push(s.publisher ? end(`${s.city ? `${s.city}: ` : ""}${s.publisher}`) : undefined);
  } else {
    push(who ? end(who) : undefined);
    push(end(s.date_text ?? year));
    push(`"${end(s.title)}"`);
    push(s.container ? end(s.container) : undefined);
    push(s.url ? end(s.url) : undefined);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** The author names as they read inside a sentence. APA uses "&" only inside brackets. */
function whoFor(authors: Author[], style: Style, narrative: boolean): string {
  const names = authors.map((a) => a.family);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}${style === "apa7" && !narrative ? " &" : " and"} ${names[1]}`;
  return `${names[0]} et al.`;
}

export function inText(authors: Author[], year: string | undefined, styleInput: Style | string, page?: string): string {
  const style = normalizeStyle(styleInput);
  const y = year ?? "n.d.";
  const who = whoFor(authors, style, false);
  if (style === "apa7") return `(${[who, y, page ? `p. ${page}` : ""].filter(Boolean).join(", ")})`;
  if (style === "mla9") return `(${[who, page ?? ""].filter(Boolean).join(" ")})`;
  return `(${[who, y].filter(Boolean).join(" ")}${page ? `, ${page}` : ""})`;
}

/**
 * The narrative form, for a sentence where the author is already in your writing:
 * "LeCun et al. (2015, p. 436) argue that ...". APA and Chicago keep the year in the
 * brackets, MLA keeps only the page number there. With no authors it falls back to
 * the parenthetical form, since there is nothing to name.
 */
export function narrativeInText(authors: Author[], year: string | undefined, styleInput: Style | string, page?: string): string {
  const style = normalizeStyle(styleInput);
  const who = whoFor(authors, style, true);
  if (!who) return inText(authors, year, style, page);
  const y = year ?? "n.d.";
  if (style === "apa7") return `${who} (${[y, page ? `p. ${page}` : ""].filter(Boolean).join(", ")})`;
  if (style === "mla9") return page ? `${who} (${page})` : who;
  return `${who} (${[y, page ?? ""].filter(Boolean).join(", ")})`;
}

export function normalizeStyle(input: unknown): Style {
  const raw = String(input ?? "").trim();
  const key = raw.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const aliases: Record<string, Style> = {
    "apa": "apa7",
    "apa 7": "apa7",
    "apa7": "apa7",
    "apa 7th": "apa7",
    "apa seventh": "apa7",
    "mla": "mla9",
    "mla 9": "mla9",
    "mla9": "mla9",
    "mla 9th": "mla9",
    "chicago": "chicago-ad",
    "chicago ad": "chicago-ad",
    "chicago-ad": "chicago-ad",
    "chicago author date": "chicago-ad",
    "chicago author-date": "chicago-ad",
  };
  const result = aliases[key];
  if (!result) {
    throw new Error(`"${raw}" is not a known citation style. Valid styles are apa7, mla9 and chicago ad (chicago-ad).`);
  }
  return result;
}

export const normalizeStyleName = normalizeStyle;
export const normalizeStyleAlias = normalizeStyle;
export const parseStyle = normalizeStyle;
export const toStyle = normalizeStyle;

export function normalizeDoi(input: string): string {
  const d = input.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  if (!/^10\.\d{4,9}\/\S+$/.test(d)) throw new Error(`"${input}" does not look like a DOI. A DOI starts with 10. and has a slash, like 10.1038/nature14539. That is not a DOI I recognise, or use format_citation and type the details.`);
  return d;
}

export function normalizeIsbn(input: string): string {
  const d = input.replace(/[-\s]/g, "").toUpperCase();
  if (!/^(\d{9}[\dX]|\d{13})$/.test(d)) throw new Error(`"${input}" does not look like an ISBN. It should have 10 or 13 digits. That is not a DOI I recognise, or use format_citation and type the details.`);
  return d;
}

export function splitName(full: string): Author {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { family: parts[0] };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
}
