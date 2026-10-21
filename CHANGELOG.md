# Changelog

## Unreleased

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
