export function normalizeArxivId(input: string): string {
  const raw = input.trim();
  const withoutLink = raw
    .replace(/^https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\//i, "")
    .replace(/^arxiv\.org\/(?:abs|pdf)\//i, "");
  const withoutVersion = withoutLink.replace(/v\d+$/, "");
  if (/^\d{4}\.\d{5}$/.test(withoutVersion)) return withoutVersion;
  if (/^[a-z][a-z-]*(\.[a-z-]+)?\/\d{7}$/i.test(withoutVersion)) return withoutVersion;
  throw new Error(`"${input}" does not look like an arXiv ID. An arXiv ID is like 2001.00001 or math/0603452, with an optional v1 version, or an arxiv.org abs or pdf link. That is not an arXiv ID I recognise, or use format_citation and type the details.`);
}

export function arxivAbsUrl(id: string): string {
  return `https://arxiv.org/abs/${id}`;
}
