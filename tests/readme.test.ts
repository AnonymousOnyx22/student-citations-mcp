import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { format, formatBibliography, inText, narrativeInText, normalizeStyle } from "../src/format.js";
import { crossrefKind } from "../src/tools.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

/** The README section that compares the server with the Zotero MCP servers. */
function zoteroSection(): string {
  return readme.split("## Citations MCP compared with the Zotero MCP servers")[1]?.split("\n## ")[0] ?? "";
}

/** The Crossref record for 10.1038/nature14539, as cite_from_doi reads it. */
const natureDeepLearning = {
  type: "journal" as const,
  authors: [
    { family: "LeCun", given: "Yann" },
    { family: "Bengio", given: "Yoshua" },
    { family: "Hinton", given: "Geoffrey" },
  ],
  year: "2015",
  title: "Deep learning",
  container: "Nature",
  volume: "521",
  issue: "7553",
  pages: "436-444",
  doi: "10.1038/nature14539",
};

/** An edited book with no authors, so the editors take the author's place. */
const editedBook = {
  type: "book" as const,
  authors: [],
  editors: [
    { family: "Patel", given: "Jamie" },
    { family: "Cole", given: "Robin" },
  ],
  year: "2019",
  title: "A dictionary of study words",
  publisher: "North Gate Press",
};

/** A book with an author and a translator, which coursework reading lists often ask for. */
const translatedBook = {
  type: "book" as const,
  authors: [{ family: "Ferrante", given: "Elena" }],
  translators: [{ family: "Goldstein", given: "Ann" }],
  year: "2012",
  title: "My brilliant friend",
  publisher: "Europa Editions",
};

describe("README", () => {
  it("shows the worked example exactly as the formatter returns it", () => {
    const citation = format(natureDeepLearning, "apa7");
    expect(citation).toBe(
      "LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. *Nature*, *521*(7553), 436-444. https://doi.org/10.1038/nature14539",
    );
    expect(readme).toContain(citation);
    expect(readme).toContain("(From Crossref. Check it against your style guide.)");
  });

  it("shows the works cited list exactly as the formatter returns it", () => {
    const section = (readme.split("## Works cited list")[1]?.split("\n## ")[0] ?? "").replace(/\r\n/g, "\n");
    const block = section.match(/```text\n([\s\S]*?)```/);
    expect(block, "the README has no works cited list example").toBeTruthy();
    const sources = [
      { type: "journal" as const, authors: [{ family: "Smith", given: "John Kenneth" }, { family: "Jones", given: "Alice" }], year: "2020", title: "Learning to learn", container: "Journal of Study Skills", volume: "4", issue: "2", pages: "11-25" },
      { type: "book" as const, authors: [{ family: "Cormen", given: "Thomas H." }], year: "2009", title: "Introduction to algorithms", edition: "3rd", publisher: "MIT Press", city: "Cambridge, MA" },
      { type: "website" as const, authors: [], title: "The water cycle", container: "Example Uni", year: "2026", url: "https://example.edu/water" },
    ];
    expect(block![1].trim()).toBe(formatBibliography(sources, "apa7"));
  });

  it("puts the install command and the tool table above the config block", () => {
    for (const name of ["format_citation", "format_bibliography", "cite_from_doi", "cite_from_isbn", "in_text_citation"]) {
      expect(readme).toContain(`\`${name}\``);
    }
    expect(readme.indexOf("npx -y student-citations-mcp")).toBeLessThan(readme.indexOf("## Tools"));
    expect(readme.indexOf("## Tools")).toBeLessThan(readme.indexOf('"mcpServers"'));
  });

  it("shows the paste ready block exactly as the formatter returns it", () => {
    expect(readme).toContain(format(natureDeepLearning, "apa7"));
    expect(readme).toContain(format(natureDeepLearning, "mla9"));
    expect(readme).toContain(format(natureDeepLearning, "chicago-ad"));
    for (const style of ["apa7", "mla9", "chicago-ad"] as const) {
      expect(readme).toContain(inText(natureDeepLearning.authors, "2015", style, "436"));
      expect(readme).toContain(`Narrative: ${narrativeInText(natureDeepLearning.authors, "2015", style, "436")}`);
    }
  });

  it("compares the server with BibGuru and Citation Machine", () => {
    expect(readme).toContain("## Citations MCP compared with BibGuru and Citation Machine");
    expect(readme).toContain("## Paste ready output");
    expect(readme).toContain("https://www.bibguru.com/");
    expect(readme).toContain("https://www.citationmachine.net/");
  });

  it("compares the server with the Zotero MCP servers", () => {
    expect(readme).toContain("## Citations MCP compared with the Zotero MCP servers");
    const section = zoteroSection();
    expect(section).toBeTruthy();
    for (const name of ["zotero-mcp", "@oscardvs/zoteus", "@xbghc/zotero-mcp"]) {
      expect(section).toContain(name);
      expect(section).toContain(`https://www.npmjs.com/package/${name}`);
    }
    for (const repo of [
      "https://github.com/cookjohn/zotero-mcp",
      "https://github.com/oscardvs/zoteus",
      "https://github.com/xbghc/zotero-mcp",
    ]) {
      expect(section).toContain(repo);
    }
  });

  it("says the Zotero servers need Zotero or a Zotero account", () => {
    const section = zoteroSection();
    expect(section).toContain("Zotero on your computer");
    expect(section).toContain("An account at zotero.org");
    expect(section).toContain("with an API key and a user ID");
  });

  it("claims only the styles the server formats in the Zotero comparison", () => {
    const row = zoteroSection().split("\n").find((line) => line.startsWith("| Citation styles |"));
    expect(row).toBeTruthy();
    const cells = row!.split("|").map((cell) => cell.trim());
    expect(cells[2]).toBe("APA 7, MLA 9, Chicago author date, Harvard, IEEE");
  });

  it("lists Harvard and IEEE support in the Zotero comparison", () => {
    const row = zoteroSection().split("\n").find((line) => line.startsWith("| Harvard and IEEE |"));
    expect(row).toBeTruthy();
    expect(row!.split("|").map((cell) => cell.trim())[2]).toContain("Both");
  });

  it("keeps the Zotero comparison free of em dashes and en dashes", () => {
    expect(zoteroSection()).not.toMatch(/[\u2014\u2013]/);
  });

  it("claims only the styles the server formats", () => {
    const row = readme.split("\n").find((line) => line.startsWith("| Styles you get back |"));
    expect(row).toBeTruthy();
    const cells = row!.split("|").map((cell) => cell.trim());
    expect(cells[1]).toBe("Styles you get back");
    expect(cells[2]).toBe("APA 7, MLA 9, Chicago author date, Harvard, IEEE");
  });

  it("shows the editors and translators examples exactly as the formatter returns them", () => {
    expect(readme).toContain("## Editors and translators");
    for (const style of ["apa7", "mla9", "chicago-ad"] as const) {
      expect(readme).toContain(format(editedBook, style));
      expect(readme).toContain(format(translatedBook, style));
    }
  });

  it("says format_citation takes editors and translators for books", () => {
    const row = readme.split("\n").find((line) => line.startsWith("| `format_citation` |"));
    expect(row).toBeTruthy();
    expect(row).toContain("editors");
    expect(row).toContain("translators");
  });

  it("lists the Crossref types it reads, the way the code maps them", () => {
    const section = readme.split("## Source types")[1]?.split("\n## ")[0] ?? "";
    expect(section).toBeTruthy();
    const types = ["journal-article", "book", "monograph", "edited-book", "reference-book", "proceedings", "book-chapter", "proceedings-article", "dissertation", "report", "standard", "dataset", "posted-content"];
    for (const type of types) {
      expect(crossrefKind(type), `${type} has no kind in the code`).toBeTruthy();
      expect(section, `the README does not mention ${type}`).toContain(`\`${type}\``);
    }
  });

  it("says the new kinds of source format_citation takes", () => {
    const row = readme.split("\n").find((line) => line.startsWith("| `format_citation` |"));
    expect(row).toBeTruthy();
    for (const kind of ["book chapter", "thesis", "report", "dataset", "preprint"]) {
      expect(row).toContain(kind);
    }
  });
});

describe("README frequently asked questions", () => {
  /** The FAQ section, from its heading to the next heading. */
  const faq = readme.split("## Frequently asked questions")[1]?.split("\n## ")[0] ?? "";

  /** The server source, so the privacy answer can be checked against the code. */
  const source = ["src/index.ts", "src/server.ts", "src/tools.ts", "src/config.ts", "src/format.ts", "src/core/http.ts", "src/core/tools.ts"]
    .map((file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8"))
    .join("\n");

  it("answers the questions people ask before they install", () => {
    expect(faq).toBeTruthy();
    for (const question of ["Does it work with Cursor?", "Is it free?", "What happens to my data?"]) {
      expect(faq).toContain(question);
    }
  });

  it("answers the question about the Zotero MCP servers", () => {
    expect(faq).toContain("How is this different from the Zotero MCP servers?");
    expect(faq).toContain("Zotero library");
  });

  it("points at the install command and the config block", () => {
    expect(faq).toContain("npx -y student-citations-mcp");
    expect(faq).toContain("Node.js 20 or newer");
  });

  it("names only the styles the server formats", () => {
    expect(faq).toContain("APA 7, MLA 9, Chicago author date, Harvard and IEEE");
    for (const style of ["apa7", "mla9", "chicago-ad", "harvard", "ieee"]) expect(normalizeStyle(style)).toBe(style);
    expect(faq).not.toMatch(/Vancouver|APA 6|MLA 8/);
  });

  it("keeps the privacy answer true to the code", () => {
    expect(faq).toContain("Nothing is stored");
    expect(faq).toContain("Crossref");
    expect(faq).toContain("Open Library");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|createWriteStream/);
    expect(source).toContain("https://api.crossref.org");
    expect(source).toContain("https://openlibrary.org");
  });

  it("uses plain punctuation", () => {
    expect(faq).not.toMatch(/[\u2014\u2013]/);
  });
});
