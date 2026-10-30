export type Style = "apa7" | "mla9" | "chicago-ad" | "harvard" | "ieee";

export interface Author {
  family: string;
  given?: string;
}

/** The kinds of source the formatter knows how to lay out. */
export type SourceType = "journal" | "book" | "chapter" | "thesis" | "report" | "dataset" | "preprint" | "website";

export interface Source {
  type: SourceType;
  authors: Author[];
  editors?: Author[]; // for books and chapters, they take the author's place when there are no authors
  translators?: Author[]; // for books
  year?: string;
  title: string;
  container?: string; // journal name, book title for a chapter, or website name
  publisher?: string;
  city?: string;
  edition?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  date_text?: string; // for websites, like "2026, October 14" (APA) or "14 Oct. 2026" (MLA)
  published?: string; // the date of a web page as the APA reference puts it, like "2026, October 14"
  accessed?: string;
  institution?: string; // the university or organisation behind a thesis, a report or a dataset
  degree?: string; // the degree of a thesis, like "Ph.D."
  repository?: string; // where a preprint was posted, like arXiv
  report_number?: string; // the number of a report or a standard
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

/** APA names in reading order, like "A. Editor", which the "In" spot of a chapter wants. */
function apaInOrder(a: Author[]): string {
  const names = a.map((x) => (x.given ? `${initials(x.given)} ${x.family}` : x.family));
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

/** What the degree says about a thesis: a doctorate, a masters, or nothing we can read. */
function degreeKind(degree?: string): "doctorate" | "masters" | "unknown" {
  const d = (degree ?? "").toLowerCase().replace(/\./g, "").trim();
  if (!d) return "unknown";
  if (/^(phd|dphil|doctor)/.test(d)) return "doctorate";
  if (/^(ma|ms|msc|mba|mphil|meng|master)/.test(d)) return "masters";
  return "unknown";
}

/** The words each style uses for a thesis, taken from the degree the record gives. */
function degreeWords(degree: string | undefined, style: Style): string {
  const kind = degreeKind(degree);
  if (style === "apa7") {
    if (kind === "doctorate") return "Doctoral dissertation";
    if (kind === "masters") return "Master's thesis";
    return "Dissertation";
  }
  if (style === "mla9") {
    if (kind === "doctorate") return "PhD dissertation";
    if (kind === "masters") return "MA thesis";
    return "Dissertation";
  }
  if (style === "harvard") {
    if (kind === "doctorate") return "PhD thesis";
    if (kind === "masters") return "MA thesis";
    return "Thesis";
  }
  if (kind === "doctorate") return "PhD diss.";
  if (kind === "masters") return "MA thesis";
  return "Diss.";
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

/** Harvard names as "Smith, J.K. and Jones, A.". Four or more authors become the first one plus et al. */
function harvardNames(a: Author[]): string {
  const one = (x: Author) => (x.given ? `${x.family}, ${initials(x.given).replace(/ /g, "")}` : x.family);
  if (a.length === 0) return "";
  if (a.length >= 4) return `${one(a[0])} et al.`;
  if (a.length === 1) return one(a[0]);
  return `${a.slice(0, -1).map(one).join(", ")} and ${one(a[a.length - 1])}`;
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

/** A title without the period the record ends it with, so the punctuation we add sits outside the italics. */
const plainTitle = (t: string) => t.replace(/\.\s*$/, "");

/** A journal article and a chapter are part of a larger work, so a citation without that work would be wrong. */
function requireContainer(s: Source): void {
  if (s.type !== "journal" && s.type !== "chapter") return;
  if (s.container?.trim()) return;
  if (s.type === "journal") {
    throw new Error('A journal article needs a container, the name of the journal it was published in. Add container, like "Journal of Study Skills", and try again.');
  }
  throw new Error('A book chapter needs a container, the title of the book it appears in. Add container, like "The Study Skills Handbook", and try again.');
}

export function format(s: Source, styleInput: Style | string): string {
  const style = normalizeStyle(styleInput);
  requireContainer(s);
  if (style === "ieee") return ieeeFormat(s);
  const parts: string[] = [];
  const push = (x?: string) => {
    if (x && x.trim()) parts.push(x.trim());
  };
  if (style === "apa7") {
    const who = apaAuthors(s.authors);
    const webDate = s.published ?? s.date_text;
    const date = s.type === "website" && webDate ? webDate : s.year ?? "n.d.";
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
    } else if (s.type === "chapter") {
      const eds = s.editors ?? [];
      push(who ? end(who) + ` (${date}).` : undefined);
      if (!who) push(`${end(s.title)} (${date}).`);
      else push(end(s.title));
      const edsPart = eds.length ? `${apaInOrder(eds)} (${role(eds, "Ed.", "Eds.")}), ` : "";
      const pages = s.pages ? ` (pp. ${dash(s.pages)})` : "";
      if (s.container) push(`In ${edsPart}*${s.container}*${pages}.`);
      else if (s.pages) push(`(${dash(s.pages)}).`);
      push(s.publisher ? end(s.publisher) : undefined);
      push(link(s));
    } else if (s.type === "thesis") {
      const label = s.institution ? `${degreeWords(s.degree, "apa7")}, ${s.institution}` : degreeWords(s.degree, "apa7");
      if (who) {
        push(`${end(who)} (${date}).`);
        push(`*${plainTitle(s.title)}* [${label}].`);
      } else {
        push(`*${plainTitle(s.title)}* [${label}] (${date}).`);
      }
      push(s.publisher && s.publisher !== s.institution ? end(s.publisher) : undefined);
      push(link(s));
    } else if (s.type === "report") {
      const number = s.report_number ? ` (Report No. ${s.report_number})` : "";
      if (who) {
        push(`${end(who)} (${date}).`);
        push(`*${plainTitle(s.title)}*${number}.`);
      } else {
        push(`*${plainTitle(s.title)}*${number} (${date}).`);
      }
      push(s.publisher ? end(s.publisher) : undefined);
      push(link(s));
    } else if (s.type === "dataset") {
      if (who) {
        push(`${end(who)} (${date}).`);
        push(`*${plainTitle(s.title)}* [Data set].`);
      } else {
        push(`*${plainTitle(s.title)}* [Data set] (${date}).`);
      }
      push(s.publisher ? end(s.publisher) : undefined);
      push(link(s));
    } else if (s.type === "preprint") {
      if (who) {
        push(`${end(who)} (${date}).`);
        push(`*${plainTitle(s.title)}* [Preprint].`);
      } else {
        push(`*${plainTitle(s.title)}* [Preprint] (${date}).`);
      }
      push(s.repository ? end(s.repository) : undefined);
      push(link(s));
    } else {
      if (who) push(`${end(who)} (${date}).`);
      if (!who && s.published) push(`${end(`*${plainTitle(s.title)}*`)} (${s.published}).`);
      else push(end(`*${plainTitle(s.title)}*`));
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
      push(end(`*${plainTitle(s.title)}*`));
      const bits = [
        s.edition ? `${s.edition} ed.` : "",
        trs.length ? `Translated by ${people(trs)}` : "",
        eds.length && who ? `Edited by ${people(eds)}` : "",
        s.publisher ?? "",
        s.year ?? "",
      ].filter(Boolean);
      push(bits.length ? end(bits.join(", ")) : undefined);
    } else if (s.type === "chapter") {
      const eds = s.editors ?? [];
      push(who ? end(who) : undefined);
      push(`"${end(s.title)}"`);
      const bits = [
        s.container ? `*${s.container}*` : "",
        eds.length ? `edited by ${people(eds)}` : "",
        s.publisher ?? "",
        s.year ?? "",
        s.pages ? `pp. ${dash(s.pages)}` : "",
        link(s),
      ].filter(Boolean);
      push(end(bits.join(", ")));
    } else if (s.type === "thesis") {
      push(who ? end(who) : undefined);
      push(end(`*${plainTitle(s.title)}*`));
      push(s.year ? end(s.year) : undefined);
      const bits = [s.institution, degreeWords(s.degree, "mla9")].filter(Boolean).join(", ");
      push(bits ? end(bits) : undefined);
      push(link(s) ? end(link(s)) : undefined);
    } else if (s.type === "report") {
      push(who ? end(who) : undefined);
      push(end(`*${plainTitle(s.title)}*`));
      const bits = [s.publisher ?? "", s.year ?? ""].filter(Boolean);
      push(bits.length ? end(bits.join(", ")) : undefined);
      push(s.report_number ? end(`Report no. ${s.report_number}`) : undefined);
      push(link(s) ? end(link(s)) : undefined);
    } else if (s.type === "dataset") {
      push(who ? end(who) : undefined);
      push(end(`*${plainTitle(s.title)}*`));
      const bits = [s.publisher ?? "", s.year ?? ""].filter(Boolean);
      push(bits.length ? end(bits.join(", ")) : undefined);
      push(link(s) ? end(link(s)) : undefined);
    } else if (s.type === "preprint") {
      push(who ? end(who) : undefined);
      push(`"${end(s.title)}"`);
      const bits = ["Preprint", s.repository ?? "", s.year ?? "", link(s)].filter(Boolean);
      push(end(bits.join(", ")));
    } else {
      push(who ? end(who) : undefined);
      push(`"${end(s.title)}"`);
      const bits = [s.container ? `*${s.container}*` : "", s.date_text ?? s.year ?? "", s.url ?? ""].filter(Boolean);
      push(end(bits.join(", ")));
      if (s.accessed) push(`Accessed ${s.accessed}.`);
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }
  if (style === "harvard") {
    const eds = s.editors ?? [];
    const trs = s.translators ?? [];
    const edLabel = role(eds, "(ed.)", "(eds.)");
    const who = harvardNames(s.authors) || (s.type === "book" && eds.length ? `${harvardNames(eds)} ${edLabel}` : "");
    const year = s.year ?? "n.d.";
    const title = plainTitle(s.title);
    const quoted = `'${title}'`;
    const italic = who ? `${who} (${year}) *${title}*.` : `*${title}* (${year}).`;
    const place = s.publisher ? `${s.city ? `${s.city}: ` : ""}${s.publisher}` : "";
    const avail = link(s) ? `Available at: ${link(s)}${s.accessed ? ` (Accessed: ${s.accessed})` : ""}` : undefined;
    if (s.type === "journal") {
      push(who ? `${who} (${year}) ${quoted},` : `${quoted} (${year})`);
      const bits = [`*${s.container ?? ""}*`, s.volume ? `${s.volume}${s.issue ? `(${s.issue})` : ""}` : "", s.pages ? `pp. ${dash(s.pages)}` : ""].filter(Boolean);
      push(end(bits.join(", ")));
    } else if (s.type === "book") {
      push(italic);
      if (s.edition) push(`${s.edition} edn.`);
      if (trs.length) push(`Translated by ${people(trs)}.`);
      if (eds.length && s.authors.length) push(`Edited by ${people(eds)}.`);
      push(place ? end(place) : undefined);
    } else if (s.type === "chapter") {
      push(who ? `${who} (${year}) ${quoted}, in` : `${quoted} (${year}) in`);
      push(end(`${eds.length ? `${harvardNames(eds)} ${edLabel} ` : ""}*${s.container ?? ""}*`));
      const bits = [place, s.pages ? `pp. ${dash(s.pages)}` : ""].filter(Boolean);
      push(bits.length ? end(bits.join(", ")) : undefined);
    } else if (s.type === "thesis") {
      push(italic);
      const bits = [degreeWords(s.degree, "harvard"), s.institution].filter(Boolean).join(". ");
      push(end(bits));
    } else if (s.type === "report") {
      push(italic);
      push(s.report_number ? `Report no. ${s.report_number}.` : undefined);
      push(place ? end(place) : undefined);
    } else if (s.type === "dataset") {
      push(who ? `${who} (${year}) *${title}* [Dataset].` : `*${title}* [Dataset] (${year}).`);
      push(place ? end(place) : undefined);
    } else if (s.type === "preprint") {
      push(who ? `${who} (${year}) ${quoted}.` : `${quoted} (${year}).`);
      push("Preprint.");
      push(s.repository ? end(s.repository) : undefined);
    } else {
      push(italic);
      push(s.container ? end(s.container) : undefined);
    }
    push(avail);
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
  } else if (s.type === "chapter") {
    const eds = s.editors ?? [];
    push(who ? end(who) : undefined);
    push(end(year));
    push(`"${end(s.title)}"`);
    const inner = [s.container ? `*${s.container}*` : "", eds.length ? `edited by ${people(eds)}` : "", s.pages ? dash(s.pages) : ""].filter(Boolean);
    push(inner.length ? end(`In ${inner.join(", ")}`) : undefined);
    push(s.publisher ? end(`${s.city ? `${s.city}: ` : ""}${s.publisher}`) : undefined);
    push(link(s) ? end(link(s)) : undefined);
  } else if (s.type === "thesis") {
    push(who ? end(who) : undefined);
    push(end(year));
    const bits = [degreeWords(s.degree, "chicago-ad"), s.institution].filter(Boolean).join(", ");
    push(end(`*${plainTitle(s.title)}*${bits ? `. ${bits}` : ""}`));
    push(link(s) ? end(link(s)) : undefined);
  } else if (s.type === "report") {
    push(who ? end(who) : undefined);
    push(end(year));
    const number = s.report_number ? `. Report no. ${s.report_number}.` : "";
    push(end(`*${plainTitle(s.title)}*${number}`));
    push(s.publisher ? end(`${s.city ? `${s.city}: ` : ""}${s.publisher}`) : undefined);
    push(link(s) ? end(link(s)) : undefined);
  } else if (s.type === "dataset") {
    push(who ? end(who) : undefined);
    push(end(year));
    push(end(`*${plainTitle(s.title)}*`));
    push(s.publisher ? end(`${s.city ? `${s.city}: ` : ""}${s.publisher}`) : undefined);
    push(link(s) ? end(link(s)) : undefined);
  } else if (s.type === "preprint") {
    push(who ? end(who) : undefined);
    push(end(year));
    push(`"${end(s.title)}"`);
    push("Preprint.");
    push(s.repository ? end(s.repository) : undefined);
    push(link(s) ? end(link(s)) : undefined);
  } else {
    push(who ? end(who) : undefined);
    push(end(s.date_text ?? year));
    push(`"${end(s.title)}"`);
    push(s.container ? end(s.container) : undefined);
    push(s.url ? end(s.url) : undefined);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** IEEE author names as initials and family names, like "J. K. Smith, A. Jones". */
function ieeeAuthors(a: Author[]): string {
  const names = a.map((x) => (x.given ? `${initials(x.given)} ${x.family}` : x.family));
  if (names.length === 0) return "";
  return names.join(", ");
}

/** One source laid out as an IEEE reference, without its number. The bibliography adds [1], [2] and so on. */
function ieeeFormat(s: Source): string {
  const parts: string[] = [];
  const push = (x?: string) => {
    if (x && x.trim()) parts.push(x.trim());
  };
  const who = ieeeAuthors(s.authors);
  const year = s.year ?? "n.d.";
  push(who);
  if (s.type === "book") {
    push(`*${plainTitle(s.title)}*`);
    const eds = s.editors ?? [];
    if (!who && eds.length) push(`${ieeeAuthors(eds)}, ${role(eds, "ed.", "eds.")}`);
    if (s.edition) push(`${s.edition} ed.`);
    const place = s.publisher ? `${s.city ? `${s.city}: ` : ""}${s.publisher}` : "";
    push(place);
    push(year);
  } else if (s.type === "chapter") {
    push(`"${plainTitle(s.title)},"`);
    const eds = s.editors ?? [];
    if (s.container) push(`In *${s.container}*`);
    if (eds.length) push(`edited by ${people(eds)}`);
    if (s.publisher) push(s.publisher);
    push(year);
  } else {
    push(`"${plainTitle(s.title)},"`);
    const rest: string[] = [];
    if (s.container) rest.push(`*${s.container}*`);
    if (s.volume) rest.push(`vol. ${s.volume}`);
    if (s.issue) rest.push(`no. ${s.issue}`);
    if (s.pages) rest.push(`pp. ${dash(s.pages)}`);
    rest.push(year);
    push(rest.join(", "));
  }
  push(link(s));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** A lower case, accent free form of a name or a title, so a list can be alphabetised. */
function sortText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * The name or title a works cited list is alphabetised by: the first author, then a book
 * editor when the book has no author, then the title with a leading article skipped.
 */
export function bibliographyKey(s: Source): string {
  const lead = s.authors[0]?.family ?? (s.type === "book" ? s.editors?.[0]?.family : undefined);
  if (lead) return sortText(lead);
  return sortText(s.title.replace(/^(a|an|the)\s+/i, ""));
}

/** Alphabetise by author, then by year in APA and Chicago and by title in MLA. */
function compareForList(a: Source, b: Source, style: Style): number {
  const text = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
  const author = text(bibliographyKey(a), bibliographyKey(b));
  if (author) return author;
  const year = text(a.year ?? "", b.year ?? "");
  const title = text(sortText(a.title), sortText(b.title));
  return style === "mla9" ? title || year : year || title;
}

/**
 * Several sources as one works cited list, alphabetised by author, with each entry
 * laid out by the style. The caller's array is left as it is.
 */
export function formatBibliography(sources: Source[], styleInput: Style | string): string {
  const style = normalizeStyle(styleInput);
  if (!sources.length) throw new Error("Give at least one source for the works cited list.");
  const ordered =
    style === "ieee"
      ? [...sources]
      : [...sources].sort((a, b) => compareForList(a, b, style));
  return ordered
    .map((s, i) => (style === "ieee" ? `[${i + 1}] ${format(s, style)}` : format(s, style)))
    .join("\n\n");
}

/** The author names as they read inside a sentence. APA uses "&" only inside brackets. */
function whoFor(authors: Author[], style: Style, narrative: boolean): string {
  const names = authors.map((a) => a.family);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (style === "harvard" && names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  if (names.length === 2) return `${names[0]}${style === "apa7" && !narrative ? " &" : " and"} ${names[1]}`;
  return `${names[0]} et al.`;
}

export function inText(authors: Author[], year: string | undefined, styleInput: Style | string, page?: string): string {
  const style = normalizeStyle(styleInput);
  const y = year ?? "n.d.";
  if (style === "ieee") return "[1]";
  const who = whoFor(authors, style, false);
  if (style === "apa7" || style === "harvard") return `(${[who, y, page ? `p. ${page}` : ""].filter(Boolean).join(", ")})`;
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
  if (style === "ieee") return inText(authors, year, style, page);
  const who = whoFor(authors, style, true);
  if (!who) return inText(authors, year, style, page);
  const y = year ?? "n.d.";
  if (style === "apa7" || style === "harvard") return `${who} (${[y, page ? `p. ${page}` : ""].filter(Boolean).join(", ")})`;
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
    "harvard": "harvard",
    "harvard referencing": "harvard",
    "harvard style": "harvard",
    "ieee": "ieee",
  };
  const result = aliases[key];
  if (!result) {
    throw new Error(`"${raw}" is not a known citation style. Valid styles are apa7, mla9, chicago ad (chicago-ad), harvard and ieee.`);
  }
  return result;
}

export const normalizeStyleName = normalizeStyle;
export const normalizeStyleAlias = normalizeStyle;
export const parseStyle = normalizeStyle;
export const toStyle = normalizeStyle;

/** A style, or "all" when the caller wants the three styles at once. */
export type StyleRequest = Style | "all";

/** The three styles and the labels the all styles output puts above each one. */
export const allStyleLabels: { style: Style; label: string }[] = [
  { style: "apa7", label: "APA 7" },
  { style: "mla9", label: "MLA 9" },
  { style: "chicago-ad", label: "Chicago author date" },
];

/** True when the caller asked for all three styles, whatever case they used. */
export function wantsAllStyles(input: unknown): boolean {
  return (
    String(input ?? "")
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ") === "all"
  );
}

/** Read the style argument, keeping all as its own request rather than an alias. */
export function normalizeStyleRequest(input: unknown): StyleRequest {
  return wantsAllStyles(input) ? "all" : normalizeStyle(input);
}

/** One citation in the style asked for, or all three with a label above each one. */
export function formatAnyStyle(s: Source, styleInput: Style | string): string {
  const requested = normalizeStyleRequest(styleInput);
  if (requested !== "all") return format(s, requested);
  return allStyleLabels.map(({ style, label }) => `${label}\n${format(s, style)}`).join("\n\n");
}

export function normalizeDoi(input: string): string {
  const d = input.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  if (!/^10\.\d{4,9}\/\S+$/.test(d)) throw new Error(`"${input}" does not look like a DOI. A DOI starts with 10. and has a slash, like 10.1038/nature14539. That is not a DOI I recognise, or use format_citation and type the details.`);
  return d;
}

export function normalizeIsbn(input: string): string {
  const d = input.replace(/[-\s]/g, "").toUpperCase();
  if (!/^(\d{9}[\dX]|\d{13})$/.test(d)) throw new Error(`"${input}" does not look like an ISBN. It should have 10 or 13 digits. That is not an ISBN I recognise, or use format_citation and type the details.`);
  return d;
}

export function splitName(full: string): Author {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { family: parts[0] };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
}
