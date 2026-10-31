import { describe, it, expect } from "vitest";
import { bibtexEntry, format, formatAnyStyle, formatBibliography, formatBibtex, inText, narrativeInText, normalizeStyle } from "../src/format.js";

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

describe("BibTeX entries", () => {
  it("formats a journal article as an article", () => {
    expect(formatBibtex(article)).toBe(
      [
        "@article{smith2020,",
        "  author = {Smith, John Kenneth and Jones, Alice},",
        "  title = {Learning to learn},",
        "  journal = {Journal of Study Skills},",
        "  year = {2020},",
        "  volume = {4},",
        "  number = {2},",
        "  pages = {11--25},",
        "  doi = {10.1000/jss.2020.42}",
        "}",
      ].join("\n"),
    );
  });

  it("formats a book with its edition, publisher and city", () => {
    const book = {
      type: "book" as const,
      authors: [{ family: "Cormen", given: "Thomas H." }],
      year: "2009",
      title: "Introduction to algorithms",
      edition: "3rd",
      publisher: "MIT Press",
      city: "Cambridge, MA",
    };
    expect(formatBibtex(book)).toBe(
      [
        "@book{cormen2009,",
        "  author = {Cormen, Thomas H.},",
        "  title = {Introduction to algorithms},",
        "  year = {2009},",
        "  edition = {3rd},",
        "  publisher = {MIT Press},",
        "  address = {Cambridge, MA}",
        "}",
      ].join("\n"),
    );
  });

  it("puts editors in the editor field when a book has no authors", () => {
    const edited = {
      type: "book" as const,
      authors: [],
      editors: [{ family: "Patel", given: "Jamie" }, { family: "Cole", given: "Robin" }],
      year: "2019",
      title: "A dictionary of study words",
      publisher: "North Gate Press",
    };
    expect(formatBibtex(edited)).toBe(
      [
        "@book{patel2019,",
        "  editor = {Patel, Jamie and Cole, Robin},",
        "  title = {A dictionary of study words},",
        "  year = {2019},",
        "  publisher = {North Gate Press}",
        "}",
      ].join("\n"),
    );
  });

  it("formats a chapter as an incollection with its book title and editors", () => {
    const chapter = {
      type: "chapter" as const,
      authors: [{ family: "Smith", given: "John Kenneth" }],
      editors: [{ family: "Cole", given: "Robin" }],
      year: "2020",
      title: "Learning to learn in groups",
      container: "The Study Skills Handbook",
      pages: "11-25",
      publisher: "North Gate Press",
      doi: "10.1000/handbook.1",
    };
    expect(formatBibtex(chapter)).toBe(
      [
        "@incollection{smith2020,",
        "  author = {Smith, John Kenneth},",
        "  editor = {Cole, Robin},",
        "  title = {Learning to learn in groups},",
        "  booktitle = {The Study Skills Handbook},",
        "  year = {2020},",
        "  pages = {11--25},",
        "  publisher = {North Gate Press},",
        "  doi = {10.1000/handbook.1}",
        "}",
      ].join("\n"),
    );
  });

  it("picks phdthesis, mastersthesis or misc from the degree", () => {
    const thesis = {
      type: "thesis" as const,
      authors: [{ family: "Patel", given: "Jamie" }],
      year: "2019",
      title: "Attention and memory in first year students",
      institution: "Dartmouth College",
      degree: "Ph.D.",
      doi: "10.1349/ddlp.2889",
    };
    expect(formatBibtex(thesis)).toBe(
      [
        "@phdthesis{patel2019,",
        "  author = {Patel, Jamie},",
        "  title = {Attention and memory in first year students},",
        "  year = {2019},",
        "  school = {Dartmouth College},",
        "  type = {Ph.D.},",
        "  doi = {10.1349/ddlp.2889}",
        "}",
      ].join("\n"),
    );
    const masters = formatBibtex({ ...thesis, degree: "M.A." });
    expect(masters.startsWith("@mastersthesis{patel2019,")).toBe(true);
    expect(masters).toContain("type = {M.A.}");
    const unknown = formatBibtex({ ...thesis, degree: undefined });
    expect(unknown.startsWith("@misc{patel2019,")).toBe(true);
    expect(unknown).toContain("institution = {Dartmouth College}");
  });

  it("formats a report as a techreport with its number and institution", () => {
    const report = {
      type: "report" as const,
      authors: [{ family: "Stone", given: "Alex" }],
      year: "2020",
      title: "How students study",
      report_number: "2020-04",
      publisher: "Office of Academic Resources",
    };
    expect(formatBibtex(report)).toBe(
      [
        "@techreport{stone2020,",
        "  author = {Stone, Alex},",
        "  title = {How students study},",
        "  year = {2020},",
        "  number = {2020-04},",
        "  institution = {Office of Academic Resources}",
        "}",
      ].join("\n"),
    );
  });

  it("formats a dataset and a preprint as misc entries", () => {
    const dataset = {
      type: "dataset" as const,
      authors: [{ family: "Stone", given: "Alex" }],
      year: "2021",
      title: "Study habits survey data",
      publisher: "Zenodo",
    };
    expect(formatBibtex(dataset)).toBe(
      [
        "@misc{stone2021,",
        "  author = {Stone, Alex},",
        "  title = {Study habits survey data},",
        "  year = {2021},",
        "  publisher = {Zenodo},",
        "  note = {Data set}",
        "}",
      ].join("\n"),
    );
    const preprint = { type: "preprint" as const, authors: [{ family: "Stone", given: "Alex" }], year: "2022", title: "A preprint about study groups", repository: "bioRxiv" };
    expect(formatBibtex(preprint)).toContain("howpublished = {Preprint, bioRxiv}");
  });

  it("formats a website with its site name, access date and address", () => {
    const site = {
      type: "website" as const,
      authors: [],
      title: "The water cycle",
      container: "Example Uni",
      published: "2026, October 14",
      url: "https://example.edu/water",
      accessed: "14 Oct. 2026",
    };
    expect(formatBibtex(site)).toBe(
      [
        "@misc{water2026,",
        "  title = {The water cycle},",
        "  year = {2026},",
        "  howpublished = {Example Uni},",
        "  note = {Accessed 14 Oct. 2026},",
        "  url = {https://example.edu/water}",
        "}",
      ].join("\n"),
    );
  });

  it("builds a key from the first author and year, or from the title with no author", () => {
    expect(formatBibtex(article)).toMatch(/^@article\{smith2020,/);
    const accented = { type: "book" as const, authors: [{ family: "López", given: "Ana" }], year: "2020", title: "Study habits" };
    expect(formatBibtex(accented)).toMatch(/^@book\{lopez2020,/);
    const untitled = { type: "book" as const, authors: [], year: "2018", title: "The quiet campus" };
    expect(formatBibtex(untitled)).toMatch(/^@book\{quiet2018,/);
  });

  it("takes the key you give it", () => {
    expect(formatBibtex(article, "smith2020a")).toMatch(/^@article\{smith2020a,/);
    expect(bibtexEntry(article, "smith2020b")).toMatch(/^@article\{smith2020b,/);
  });

  it("escapes the characters BibTeX treats as markup", () => {
    const tricky = { type: "book" as const, authors: [], year: "2020", title: "Costs & benefits: a 100% guide_to #1 $5 {draft} ~ ^" };
    expect(formatBibtex(tricky)).toBe(
      String.raw`@book{costs2020,
  title = {Costs \& benefits: a 100\% guide\_to \#1 \$5 \{draft\} \textasciitilde{} \textasciicircum{}},
  year = {2020}
}`,
    );
  });

  it("writes a page range with the double hyphen BibTeX expects", () => {
    expect(formatBibtex(article)).toContain("pages = {11--25}");
    expect(formatBibtex({ ...article, pages: "11 - 25" })).toContain("pages = {11--25}");
    expect(formatBibtex({ ...article, pages: "436--444" })).toContain("pages = {436--444}");
  });

  it("cleans a DOI that is given as a doi.org link", () => {
    expect(formatBibtex({ ...article, doi: "https://doi.org/10.1000/jss.2020.42" })).toContain("doi = {10.1000/jss.2020.42}");
    expect(formatBibtex({ ...article, doi: "doi: 10.1000/jss.2020.42" })).toContain("doi = {10.1000/jss.2020.42}");
  });

  it("asks for the container a journal article or a chapter needs", () => {
    expect(() => formatBibtex({ type: "journal", authors: [], year: "2020", title: "Learning to learn" })).toThrow("needs a container");
    expect(() => formatBibtex({ type: "chapter", authors: [], year: "2020", title: "Learning to learn in groups" })).toThrow("needs a container");
  });
});

describe("BibTeX as a style", () => {
  const book = {
    type: "book" as const,
    authors: [{ family: "Cormen", given: "Thomas H." }],
    year: "2009",
    title: "Introduction to algorithms",
    publisher: "MIT Press",
  };

  it("is a known style that formats one source", () => {
    expect(normalizeStyle("bibtex")).toBe("bibtex");
    expect(normalizeStyle("BibTeX")).toBe("bibtex");
    expect(format(article, "bibtex")).toBe(formatBibtex(article));
    expect(formatAnyStyle(article, "bibtex")).toBe(formatBibtex(article));
  });

  it("formats several sources as one block in the order given", () => {
    expect(formatBibliography([article, book], "bibtex")).toBe(`${formatBibtex(article)}\n\n${formatBibtex(book)}`);
  });

  it("says there is no in text form", () => {
    expect(() => inText(article.authors, "2020", "bibtex")).toThrow("no in text citation");
    expect(() => narrativeInText(article.authors, "2020", "bibtex")).toThrow("no in text citation");
  });
});
