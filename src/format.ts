export type Style = "apa7" | "mla9" | "chicago-ad";

export interface Author {
  family: string;
  given?: string;
}

export interface Source {
  type: "journal" | "book" | "website";
  authors: Author[];
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

const dash = (p?: string) => (p ? p.replace(/\s*-\s*/g, "–") : p);
const end = (s: string) => (/[.?!]$/.test(s) ? s : s + ".");
const link = (s: Source) => (s.doi ? `https://doi.org/${s.doi}` : s.url ?? "");

export function format(s: Source, style: Style): string {
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
      if (who) push(`${end(who)} (${date}).`);
      push(end(`*${s.title}*${s.edition ? ` (${s.edition} ed.)` : ""}`));
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
      push(who ? end(who) : undefined);
      push(end(`*${s.title}*`));
      const bits = [s.edition ? `${s.edition} ed.` : "", s.publisher ?? "", s.year ?? ""].filter(Boolean);
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
  // Chicago author-date
  const who = mlaAuthors(s.authors).replace(/, et al$/, ", et al.");
  const year = s.year ?? "n.d.";
  if (s.type === "journal") {
    push(who ? end(who) : undefined);
    push(end(year));
    push(`"${end(s.title)}"`);
    const vi = `${s.volume ?? ""}${s.issue ? ` (${s.issue})` : ""}`;
    push(end(`*${s.container ?? ""}*${vi ? ` ${vi}` : ""}${s.pages ? `: ${dash(s.pages)}` : ""}`));
    push(link(s) ? end(link(s)) : undefined);
  } else if (s.type === "book") {
    push(who ? end(who) : undefined);
    push(end(year));
    push(end(`*${s.title}*${s.edition ? `. ${s.edition} ed` : ""}`));
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

export function inText(authors: Author[], year: string | undefined, style: Style, page?: string): string {
  const y = year ?? "n.d.";
  const names = authors.map((a) => a.family);
  if (style === "apa7") {
    const who = names.length === 0 ? "" : names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} & ${names[1]}` : `${names[0]} et al.`;
    return `(${[who, y, page ? `p. ${page}` : ""].filter(Boolean).join(", ")})`;
  }
  const who = names.length === 0 ? "" : names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names[0]} et al.`;
  if (style === "mla9") return `(${[who, page ?? ""].filter(Boolean).join(" ")})`;
  return `(${[who, y].filter(Boolean).join(" ")}${page ? `, ${page}` : ""})`;
}

export function normalizeDoi(input: string): string {
  const d = input.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  if (!/^10\.\d{4,9}\/\S+$/.test(d)) throw new Error(`"${input}" does not look like a DOI. A DOI starts with 10. and has a slash, like 10.1038/nature14539.`);
  return d;
}

export function normalizeIsbn(input: string): string {
  const d = input.replace(/[-\s]/g, "").toUpperCase();
  if (!/^(\d{9}[\dX]|\d{13})$/.test(d)) throw new Error(`"${input}" does not look like an ISBN. It should have 10 or 13 digits.`);
  return d;
}

export function splitName(full: string): Author {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { family: parts[0] };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
}
