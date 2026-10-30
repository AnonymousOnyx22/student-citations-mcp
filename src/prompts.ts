import { z } from "zod";
import type { PromptDef } from "./core/prompts.js";
import { normalizeStyle, type Style } from "./format.js";

/** How each style is written: the short name inside a sentence and the full name. */
const styleWords: Record<Style, { short: string; long: string }> = {
  apa7: { short: "APA", long: "APA 7" },
  mla9: { short: "MLA", long: "MLA 9" },
  "chicago-ad": { short: "Chicago", long: "Chicago author date" },
  harvard: { short: "Harvard", long: "Harvard" },
  ieee: { short: "IEEE", long: "IEEE" },
};

/** The example wording the citation tools carry, in the style that was asked for. */
export function examplePrompts(style: Style): string[] {
  const { short, long } = styleWords[style];
  return [
    `Cite this journal article in ${long}: Learning to learn by John Kenneth Smith and Alice Jones, 2020, Journal of Study Skills, volume 4, issue 2, pages 11-25.`,
    `Cite 10.1038/nature14539 in ${short}.`,
    `Cite ISBN 978-0-262-03384-8 in ${long}.`,
    `Give the ${short} in text citation for Smith and Jones 2020 on page 14.`,
  ];
}

/** True when the source is a DOI, with the doi.org link and the doi prefix taken off. */
function looksLikeDoi(source: string): boolean {
  const d = source.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  return /^10\.\d{4,9}\/\S+$/.test(d);
}

/** True when the source is an ISBN, with the dashes and the spaces taken off. */
function looksLikeIsbn(source: string): boolean {
  return /^(\d{9}[\dX]|\d{13})$/.test(source.replace(/[-\s]/g, "").toUpperCase());
}

/** True when the source is a web address. */
function looksLikeUrl(source: string): boolean {
  return /^https?:\/\//i.test(source.trim()) || /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(source.trim());
}

/** The line that points at the tool that fits the source. */
function hintFor(source: string): string {
  if (looksLikeDoi(source)) return "That looks like a DOI, so use cite_from_doi.";
  if (looksLikeIsbn(source)) return "That looks like an ISBN, so use cite_from_isbn.";
  if (looksLikeUrl(source)) return "That looks like a web address, so use cite_from_url.";
  return "Those are details you type, so use format_citation.";
}

/** The message the cite_this prompt puts in the chat, ready to edit and send. */
export function citeThisMessage(args: { style?: string; source?: string }): string {
  const wanted = (args.style ?? "").trim();
  const style = normalizeStyle(wanted || "apa7");
  const source = (args.source ?? "").trim();
  const lines: string[] = [`Cite this source in ${styleWords[style].long}.`];
  if (source) {
    lines.push("", `Source: ${source}`, "", hintFor(source));
  } else {
    lines.push("", "Use the tool that fits the source: cite_from_doi for a DOI, cite_from_isbn for an ISBN, cite_from_url for a web address, format_citation for details you type and in_text_citation for the in text form.");
  }
  lines.push("", "Example prompts:");
  for (const example of examplePrompts(style)) lines.push(`- "${example}"`);
  return lines.join("\n");
}

const style = z
  .string()
  .optional()
  .describe("Citation style: apa7, mla9 or chicago-ad. Aliases such as APA, MLA 9 and Chicago are accepted. Defaults to apa7 when you leave it out or leave it blank.");

const source = z
  .string()
  .optional()
  .describe("The source to cite: a DOI, an ISBN, or the details of the source. Leave it out or leave it blank and write them in the message instead.");

export const prompts: PromptDef[] = [
  {
    name: "cite_this",
    title: "Cite a source in APA",
    description:
      "Start a citation in APA 7, MLA 9 or Chicago author date from a DOI, an ISBN or details you type. The title names the default style, APA 7, and the style argument picks another one. The prompt returns the wording the citation tools use, so you can edit the source and send it. Arguments: style (apa7, mla9 or chicago-ad) and source (the DOI, the ISBN or the details), both optional. Example prompt: \"Cite this journal article in APA 7: Learning to learn by John Kenneth Smith and Alice Jones, 2020, Journal of Study Skills, volume 4, issue 2, pages 11-25.\"",
    argsSchema: { style, source },
    build: (args) => citeThisMessage(args),
  },
];
