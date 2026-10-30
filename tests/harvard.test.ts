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

describe("Harvard style", () => {
  it("reads harvard aliases", () => {
    for (const a of ["harvard", "Harvard", "HARVARD style", "harvard-referencing"]) expect(normalizeStyle(a)).toBe("harvard");
  });

  it("formats a journal article", () => {
    expect(format(article, "harvard")).toBe(
      "Smith, J.K. and Jones, A. (2020) 'Learning to learn', *Journal of Study Skills*, 4(2), pp. 11-25. Available at: https://doi.org/10.1000/jss.2020.42",
    );
  });

  it("formats a book with a city, an edition and four authors", () => {
    const book = {
      type: "book" as const,
      authors: ["A", "B", "C", "D"].map((family) => ({ family, given: "Pat" })),
      year: "2009",
      title: "Introduction to algorithms",
      edition: "3rd",
      publisher: "MIT Press",
      city: "Cambridge, MA",
    };
    expect(format(book, "harvard")).toBe("A, P. et al. (2009) *Introduction to algorithms*. 3rd edn. Cambridge, MA: MIT Press.");
  });

  it("formats a chapter and a website", () => {
    const chapter = { type: "chapter" as const, authors: [{ family: "Lee", given: "Sam" }], editors: [{ family: "Kim", given: "Ann" }], year: "2018", title: "On notes", container: "The Study Handbook", publisher: "Pearson", city: "London", pages: "10-20" };
    expect(format(chapter, "harvard")).toBe("Lee, S. (2018) 'On notes', in Kim, A. (ed.) *The Study Handbook*. London: Pearson, pp. 10-20.");
    const site = { type: "website" as const, authors: [], year: "2026", title: "Study tips", url: "https://example.edu/tips", accessed: "14 October 2026" };
    expect(format(site, "harvard")).toBe("*Study tips* (2026). Available at: https://example.edu/tips (Accessed: 14 October 2026)");
  });

  it("writes in text citations", () => {
    expect(inText(article.authors, "2020", "harvard", "14")).toBe("(Smith and Jones, 2020, p. 14)");
    expect(inText([{ family: "A" }, { family: "B" }, { family: "C" }], "2020", "harvard")).toBe("(A, B and C, 2020)");
    expect(inText([{ family: "A" }, { family: "B" }, { family: "C" }, { family: "D" }], "2020", "harvard")).toBe("(A et al., 2020)");
    expect(narrativeInText(article.authors, "2020", "harvard", "14")).toBe("Smith and Jones (2020, p. 14)");
  });

  it("alphabetises a list", () => {
    const list = formatBibliography([{ ...article, authors: [{ family: "Zed", given: "Q" }] }, article], "harvard");
    expect(list.startsWith("Smith")).toBe(true);
  });
});
