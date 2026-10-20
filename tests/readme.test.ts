import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { format, inText } from "../src/format.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

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

describe("README", () => {
  it("shows the worked example exactly as the formatter returns it", () => {
    const citation = format(natureDeepLearning, "apa7");
    expect(citation).toBe(
      "LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. *Nature*, *521*(7553), 436-444. https://doi.org/10.1038/nature14539",
    );
    expect(readme).toContain(citation);
    expect(readme).toContain("(From Crossref. Check it against your style guide.)");
  });

  it("puts the install command and the tool table above the config block", () => {
    for (const name of ["format_citation", "cite_from_doi", "cite_from_isbn", "in_text_citation"]) {
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
    }
  });

  it("compares the server with BibGuru and Citation Machine", () => {
    expect(readme).toContain("## Citations MCP compared with BibGuru and Citation Machine");
    expect(readme).toContain("## Paste ready output");
    expect(readme).toContain("https://www.bibguru.com/");
    expect(readme).toContain("https://www.citationmachine.net/");
  });

  it("claims only the styles the server formats", () => {
    const row = readme.split("\n").find((line) => line.startsWith("| Styles you get back |"));
    expect(row).toBeTruthy();
    const cells = row!.split("|").map((cell) => cell.trim());
    expect(cells[1]).toBe("Styles you get back");
    expect(cells[2]).toBe("APA 7, MLA 9, Chicago author date");
  });
});
