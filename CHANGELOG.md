# Changelog

## 0.1.6

- format_bibliography now takes `dois` and `isbns` lists as well as typed sources. It looks each one up and puts it in the same alphabetised list, and a lookup that fails gives an error that names the DOI or ISBN.
- cite_from_isbn now looks in the Open Library search when an ISBN record has no publisher, year or place, and fills the gap only when the search names exactly one. A book with many editions is left with what the record gave, because a guess could put another edition's year or publisher in your citation.

## 0.1.5

- Let `format_citation` and `cite_from_doi` take `style` as `all`, so all three styles come back in one reply with a label above each one.
- Refuse to format a journal article or a chapter whose `container` is missing or blank, and return an error that names the container instead of a citation with a missing part.

## 0.1.4

- The README now ends with a table of the other free student MCP servers, so you can find the one for your school's system.

## 0.1.3

- Add doi and isbn inputs to in_text_citation
- Add a format_bibliography tool for alphabetised works cited lists

## 0.1.2

- Add a format_bibliography tool, so several sources come back as one works cited list, alphabetised by author in APA 7, MLA 9 or Chicago author date
- Add doi and isbn inputs to in_text_citation, so a student with only an identifier can get the in text citation without retyping the authors and the year

- Add a README comparison table with the zotero-mcp, zoteus and xbghc zotero-mcp servers, and a FAQ answer about how this server differs from them
- Register a cite_this prompt, so clients that show prompts can start a citation with the wording the tools use
- Widen the npm keywords and the descriptions to cover the words students type, such as citation generator, apa formatter, works cited, cite this and thesis

- Follow the Crossref work type in cite_from_doi, so a book chapter, a conference paper, a dissertation, an edited book, a report, a dataset or a preprint is no longer formatted as a journal article
- Add book chapter, thesis, report, dataset and preprint kinds to format_citation, with the institution, degree, repository and report number inputs they need
- Fix the ISBN errors so they name the ISBN instead of a DOI, and drop the repeated format_citation fallback
- Add a frequently asked questions section to the README, covering compatibility, cost, privacy, install and styles
- Add a test that locks the README paste ready example to what cite_from_doi returns for 10.1038/nature14539
- Support editors and translators in format_citation, in the places APA 7, MLA 9 and Chicago author date put them for books
- Add a narrative form to in_text_citation, so a sentence can name the author: "LeCun et al. (2015, p. 436) argue that ..."
- Update the test runner and refresh the lock file, so npm audit reports no known problems

## 0.1.1

- Make DOI and ISBN errors point to format_citation fallback
- Rewrite metadata around "citation mcp" phrase
- Remove em and en dashes and hyphenated words from docs and descriptions
- Lead README with install, tools, worked example and star ask
- Add metadata tests for version alignment and CI wiring
- Add README comparison table and paste ready output block with tests
- Add concrete inputs and one example prompt to each of the four tool descriptions in src/tools.ts
- Audit llms.txt and glama.json so all four tools appear with parameters, examples and version 0.1.0
- Rewrite package.json description and keywords to rank for 'citation mcp'

## 0.1.0

- First release. APA 7, MLA 9 and Chicago author date formatting, DOI lookup through Crossref and ISBN lookup through Open Library, with tests.
