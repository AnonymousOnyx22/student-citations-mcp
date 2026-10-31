import type { Source, Style } from "./format.js";

/** What a web page says about itself, in the shape the formatter takes. */
export interface PageDetails {
  title: string;
  siteName?: string;
  year?: string;
  month?: number;
  day?: number;
}

/** The parts of a date a page gives. */
export interface DateParts {
  year: string;
  month?: number;
  day?: number;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthAbbr = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

/** Turn the character entities a title or a meta tag carries into the characters they stand for. */
function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

/** Collapse the spaces and line breaks a page puts in a title or a meta tag. */
function clean(text: string): string {
  return decode(text).replace(/\s+/g, " ").trim();
}

/** The value of one attribute in an HTML tag, with or without quotes. */
function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? clean(m[1] ?? m[2] ?? m[3] ?? "") : undefined;
}

/** The meta tags of a page, keyed by their property, name or itemprop. The first one of each key wins. */
function metas(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? attr(tag, "itemprop"))?.toLowerCase();
    const content = attr(tag, "content");
    if (key && content && !(key in out)) out[key] = content;
  }
  return out;
}

/** The text of the title element, which most pages still carry. */
function titleTag(html: string): string | undefined {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return m ? clean(m[1]) : undefined;
}

/** A date from a JSON-LD block, which many news and blog pages use. */
function jsonLdDate(html: string): string | undefined {
  const m = html.match(/"datePublished"\s*:\s*"([^"]+)"/i) ?? html.match(/"dateCreated"\s*:\s*"([^"]+)"/i);
  return m ? clean(m[1]) : undefined;
}

/** A date from a time element, when the page has no meta tag for it. */
function timeDate(html: string): string | undefined {
  const m = html.match(/<time\b[^>]*\bdatetime\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return m ? clean(m[1] ?? m[2] ?? "") : undefined;
}

/** The month number a date names, whether it writes the month out or shortens it. */
function monthOf(text: string): number | undefined {
  for (let i = 0; i < monthNames.length; i++) {
    const name = monthNames[i];
    const short = name.slice(0, 3);
    if (new RegExp(`\\b(${name}|${short})\\.?\\b`, "i").test(text)) return i + 1;
  }
  return undefined;
}

/** A date as its year, month and day, when the text has enough of them. */
export function parsePageDate(raw?: string): DateParts | undefined {
  if (!raw) return undefined;
  const text = clean(raw);
  const iso = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:T|\s|$)/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { year: String(year), month, day };
  }
  const year = text.match(/\b(1[89]\d{2}|20\d{2}|21\d{2})\b/)?.[1];
  if (!year) return undefined;
  const month = monthOf(text);
  if (!month) return { year };
  const dayText = text.replace(year, " ").match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/)?.[1];
  const day = dayText ? Number(dayText) : undefined;
  if (day !== undefined && (day < 1 || day > 31)) return { year, month };
  return { year, month, day };
}

/** Split "How to study | Example Uni" into a title and the site name at the end. */
function splitTitle(raw: string): { title: string; siteName?: string } {
  const text = clean(raw);
  const parts = text.split(/\s*\|\s*/);
  if (parts.length === 2 && parts[0] && parts[1] && parts[1].length <= 60) return { title: parts[0], siteName: parts[1] };
  return { title: text };
}

/** Take the site name off the end of a title when the page repeats it there. */
function cleanTitle(raw: string, siteName?: string): string {
  let title = clean(raw);
  if (siteName) {
    const escaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(`\\s*[|:\\-\\u2013\\u2014]\\s*${escaped}\\s*$`, "i"), "").trim();
  }
  return title;
}

/** The title, site name and date a page gives, ready to become a website citation. */
export function parsePage(html: string, url: string): PageDetails {
  const meta = metas(html);
  const rawTitle = meta["og:title"] ?? meta["twitter:title"] ?? titleTag(html) ?? "";
  const split = splitTitle(rawTitle);
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch {
      return undefined;
    }
  })();
  const siteName = meta["og:site_name"] ?? meta["application-name"] ?? meta["publisher"] ?? split.siteName ?? host;
  const date = parsePageDate(
    meta["article:published_time"] ?? meta["datepublished"] ?? meta["date"] ?? jsonLdDate(html) ?? timeDate(html),
  );
  return {
    title: cleanTitle(split.title, siteName),
    siteName,
    year: date?.year,
    month: date?.month,
    day: date?.day,
  };
}

/** A web address with a scheme, so a reader can paste "example.edu/study" as well as the full URL. */
export function normalizeUrl(input: string): string {
  const raw = input.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("not a web address");
    return url.toString();
  } catch {
    throw new Error(`"${input}" does not look like a web address. Give a URL like https://example.edu/study, or use format_citation and type the details.`);
  }
}

/** The page as the website kind of source, with the date in the spot the style puts it. */
export function pageSource(page: PageDetails, url: string, style: Style): Source {
  const source: Source = {
    type: "website",
    authors: [],
    title: page.title,
    container: page.siteName,
    url,
    year: page.year,
  };
  if (page.year && page.month) {
    const month = monthNames[page.month - 1];
    if (style === "apa7") {
      source.published = `${page.year}, ${month}${page.day ? ` ${page.day}` : ""}`;
    } else if (style === "mla9") {
      source.date_text = `${page.day ? `${page.day} ` : ""}${monthAbbr[page.month - 1]} ${page.year}`;
    }
  }
  return source;
}
