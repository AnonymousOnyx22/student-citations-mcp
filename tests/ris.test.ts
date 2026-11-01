import { describe, it, expect } from "vitest";
import { format, formatBibliography, formatRis, inText } from "../src/format.js";

const article = {
  type: "journal" as const,
  authors: [{ family: "Smith", given: "John Kenneth" }, { family: "Jones", given: "Alice" }],
  year: "2020",
  title: "Learning to learn",
  container: "Journal of Study Skills",
  volume: "4",
  issue: "2",
  pages: "11-25",
  doi: "https://doi.org/10.1000/jss.2020.42",
};

describe("RIS records", () => {
  it("formats a journal article", () => {
    expect(formatRis(article)).toBe(
      [
        "TY  - JOUR",
        "AU  - Smith, John Kenneth",
        "AU  - Jones, Alice",
        "TI  - Learning to learn",
        "T2  - Journal of Study Skills",
        "PY  - 2020",
        "VL  - 4",
        "IS  - 2",
        "SP  - 11",
        "EP  - 25",
        "DO  - 10.1000/jss.2020.42",
        "ER  - ",
      ].join("\n"),
    );
  });

  it("formats a book with publisher, city and edition", () => {
    const ris = formatRis({
      type: "book",
      authors: [{ family: "Lee", given: "Ann" }],
      year: "2018",
      title: "Study well",
      publisher: "Open Press",
      city: "Toronto",
      edition: "2nd",
    });
    expect(ris).toContain("TY  - BOOK");
    expect(ris).toContain("ET  - 2nd");
    expect(ris).toContain("PB  - Open Press");
    expect(ris).toContain("CY  - Toronto");
  });

  it("maps other source types and skips empty fields", () => {
    const ris = formatRis({ type: "preprint", authors: [], title: "A draft", repository: "arXiv", year: "2024" });
    expect(ris).toContain("TY  - UNPB");
    expect(ris).toContain("T2  - arXiv");
    expect(ris).not.toContain("AU  -");
    expect(ris).not.toContain("VL  -");
    expect(ris.endsWith("ER  - ")).toBe(true);
  });

  it("is a style for format and format_bibliography", () => {
    expect(format(article, "ris")).toBe(formatRis(article));
    const book = { type: "book" as const, authors: [{ family: "Lee", given: "Ann" }], year: "2018", title: "Study well", publisher: "Open Press" };
    expect(formatBibliography([article, book], "RIS")).toBe(`${formatRis(article)}\n\n${formatRis(book)}`);
  });

  it("has no in text form", () => {
    expect(() => inText([{ family: "Lee" }], "2018", "ris")).toThrow(/RIS is an entry format/);
  });

  it("keeps a single page and takes the year from a web date", () => {
    const ris = formatRis({ type: "website", authors: [], title: "Page", container: "Site", published: "2026, October 14", pages: "7" });
    expect(ris).toContain("PY  - 2026");
    expect(ris).toContain("SP  - 7");
    expect(ris).not.toContain("EP  -");
  });
});
