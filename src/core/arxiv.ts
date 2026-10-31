export function normalizeArxivId(input: string): string {
  const raw = input.trim();
  const withoutLink = raw
    .replace(/^https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\//i, "")
    .replace(/^arxiv\.org\/(?:abs|pdf)\//i, "");
  const withoutVersion = withoutLink.replace(/v\d+$/, "");
  if (/^\d{4}\.\d{5}(?:\.\d+)?$/.test(withoutVersion)) return withoutVersion;
  if (/^[a-z][a-z-]*(\.[a-z-]+)?\/\d{7}$/i.test(withoutVersion)) return withoutVersion;
  throw new Error(`"${input}" does not look like an arXiv ID. An arXiv ID is like 2001.00001 or math/0603452, with an optional v1 version, or an arxiv.org abs or pdf link. That is not an arXiv ID I recognise, or use format_citation and type the details.`);
}

export function arxivAbsUrl(id: string): string {
  return `https://arxiv.org/abs/${id}`;
}

export function arxivPdfUrl(id: string): string {
  return `https://arxiv.org/pdf/${id}`;
}

export interface ArxivQueryOptions {
  idList?: string | string[];
  searchQuery?: string;
  start?: number;
  maxResults?: number;
  sortBy?: "relevance" | "lastUpdatedDate" | "submittedDate";
  sortOrder?: "ascending" | "descending";
}

export function arxivApiUrl(opts: ArxivQueryOptions = {}): string {
  const params = new URLSearchParams();
  if (opts.idList) {
    const ids = Array.isArray(opts.idList) ? opts.idList.join(",") : opts.idList;
    params.set("id_list", ids);
  }
  if (opts.searchQuery) {
    params.set("search_query", opts.searchQuery);
  }
  if (opts.start !== undefined) {
    params.set("start", String(opts.start));
  }
  if (opts.maxResults !== undefined) {
    params.set("max_results", String(opts.maxResults));
  } else if (opts.idList) {
    params.set("max_results", String(Array.isArray(opts.idList) ? opts.idList.length : 1));
  } else {
    params.set("max_results", "10");
  }
  if (opts.sortBy) {
    params.set("sortBy", opts.sortBy);
  }
  if (opts.sortOrder) {
    params.set("sortOrder", opts.sortOrder);
  }
  return `https://export.arxiv.org/api/query?${params.toString()}`;
}

export function buildArxivApiUrl(opts: ArxivQueryOptions = {}): string {
  return arxivApiUrl(opts);
}

export function arxivIdQuery(id: string | string[]): string {
  const ids = Array.isArray(id) ? id.map((i) => normalizeArxivId(i)) : normalizeArxivId(id);
  return arxivApiUrl({ idList: ids });
}

export interface ArxivAuthor {
  name: string;
}

export interface ArxivEntry {
  id: string;
  arxivId: string;
  title: string;
  summary: string;
  published: string;
  updated: string;
  authors: ArxivAuthor[];
  categories: string[];
  primaryCategory?: string;
  comment?: string;
  journalRef?: string;
  doi?: string;
  link: string;
  pdfLink?: string;
}

function decodeXml(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return undefined;
  return decodeXml(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
}

function extractAllTags(block: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "ig");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    out.push(decodeXml(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()));
  }
  return out;
}

function extractAttr(block: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))[^>]*>`, "i");
  const m = block.match(re);
  return m ? decodeXml(m[1] ?? m[2] ?? m[3] ?? "") : undefined;
}

function extractAllAttrs(block: string, tag: string, attr: string): string[] {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))[^>]*>`, "ig");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    out.push(decodeXml(m[1] ?? m[2] ?? m[3] ?? ""));
  }
  return out;
}

export function parseArxivAtom(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];
  const re = /<entry\b[\s\S]*?<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const block = m[0];
    const idUrl = extractTag(block, "id") || "";
    const arxivId = idUrl.replace(/^https?:\/\/arxiv\.org\/abs\//i, "").replace(/v\d+$/, "");
    const title = extractTag(block, "title") || "";
    const summary = extractTag(block, "summary") || extractTag(block, "arxiv:summary") || "";
    const published = extractTag(block, "published") || "";
    const updated = extractTag(block, "updated") || "";
    const authors = extractAllTags(block, "name").map((name) => ({ name }));
    const categories = extractAllAttrs(block, "category", "term");
    const primaryCategory = extractAttr(block, "arxiv:primary_category", "term") || categories[0];
    const comment = extractTag(block, "arxiv:comment");
    const journalRef = extractTag(block, "arxiv:journal_ref");
    const doi = extractTag(block, "arxiv:doi");
    const link = extractAttr(block, "link", "href") && extractTag(block, "id") ? (extractAttr(block, "link", "href")?.includes("/abs/") ? extractAttr(block, "link", "href")! : `https://arxiv.org/abs/${arxivId}`) : `https://arxiv.org/abs/${arxivId}`;
    const pdfLinks = extractAllAttrs(block, "link", "href").filter((h) => h.includes("/pdf/"));
    const pdfLink = pdfLinks[0] || (arxivId ? `https://arxiv.org/pdf/${arxivId}` : undefined);
    entries.push({
      id: idUrl,
      arxivId,
      title: title.replace(/\s+/g, " ").trim(),
      summary: summary.replace(/\s+/g, " ").trim(),
      published,
      updated,
      authors,
      categories,
      primaryCategory,
      comment,
      journalRef,
      doi,
      link: link.startsWith("http") ? link : `https://arxiv.org/abs/${arxivId}`,
      pdfLink,
    });
  }
  return entries;
}

export const parseArxivFeed = parseArxivAtom;

export function parseArxivResponse(xml: string): ArxivEntry[] {
  return parseArxivAtom(xml);
}
