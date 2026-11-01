import { describe, it, expect } from "vitest";
import { format, formatBibliography, inText, narrativeInText, normalizeStyle } from "../src/format.js";

const article = {
  type: "journal" as const,
  authors: [{ family: "Smith", given: "John Kenneth" }, { family: "Jones", given: "Alice" }],
  year: "2020",
  title: "Learning to learn",
  container: "Journal of Study Skills",
  volume: "4",
  issue: "2",
  pages: "11-25",
  doi: "10.1000/jss.2020.42",
};

const book = {
  type: "book" as const,
  authors: [{ family: "Zed", given: "Quinn" }],
  year: "2009",
  title: "Introduction to algorithms",
  publisher: "MIT Press",
  city: "Cambridge, MA",
};

describe("IEEE style", () => {
  it("reads the ieee name", () => {
    for (const a of ["ieee", "IEEE"]) expect(normalizeStyle(a)).toBe("ieee");
  });

  it("formats an entry without a number", () => {
    const entry = format(article, "ieee");
    expect(entry.startsWith("J. K. Smith and A. Jones, ")).toBe(true);
    expect(entry).toContain("doi: 10.1000/jss.2020.42.");
    expect(entry.startsWith("[")).toBe(false);
  });

  it("numbers bibliography entries from [1] in the order given", () => {
    const list = formatBibliography([book, article], "ieee").split("\n\n");
    expect(list).toHaveLength(2);
    expect(list[0]).toBe(`[1] ${format(book, "ieee")}`);
    expect(list[1]).toBe(`[2] ${format(article, "ieee")}`);
    expect(list[0]).toContain("Zed");
  });

  it("does not reorder the sources the way other styles do", () => {
    const ieee = formatBibliography([book, article], "ieee");
    const apa = formatBibliography([book, article], "apa7");
    expect(ieee.indexOf("Zed")).toBeLessThan(ieee.indexOf("Smith"));
    expect(apa.indexOf("Smith")).toBeLessThan(apa.indexOf("Zed"));
  });

  it("leaves the caller's array as it is", () => {
    const sources = [book, article];
    formatBibliography(sources, "ieee");
    expect(sources).toEqual([book, article]);
  });

  it("numbers a single source as [1]", () => {
    expect(formatBibliography([article], "ieee").startsWith("[1] ")).toBe(true);
  });

  it("writes a bracket number in text", () => {
    expect(inText(article.authors, "2020", "ieee")).toBe("[1]");
    expect(inText(article.authors, "2020", "ieee", "14")).toBe("[1, p. 14]");
    expect(inText([], undefined, "IEEE")).toBe("[1]");
  });

  it("uses the same bracket form for the narrative citation", () => {
    expect(narrativeInText(article.authors, "2020", "ieee")).toBe("[1]");
    expect(narrativeInText(article.authors, "2020", "ieee", "14")).toBe("[1, p. 14]");
  });
});
