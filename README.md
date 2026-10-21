# Citations MCP

[![npm](https://img.shields.io/npm/v/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![downloads](https://img.shields.io/npm/dm/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ci](https://github.com/AnonymousOnyx22/student-citations-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/AnonymousOnyx22/student-citations-mcp/actions/workflows/ci.yml)

Paste a DOI or an ISBN into your AI app and get a formatted citation back in APA 7, MLA 9 or Chicago author date. You can also type the details yourself and get the matching in text citation, either in brackets or in the narrative form for a sentence where you name the author. The wording and punctuation come from tested code, so they are the same every time. Free and open source, no account, no key and nothing stored. It works with Claude, ChatGPT, Cursor, VS Code Copilot and any other app that supports MCP.

## Citations MCP compared with BibGuru and Citation Machine

BibGuru and Citation Machine are web pages you fill in and copy from. Citations MCP sits inside the AI app you are already writing in, and it takes a DOI or an ISBN as well as typed details. Here is the side by side.

| | Citations MCP | [BibGuru](https://www.bibguru.com/) | [Citation Machine](https://www.citationmachine.net/) |
| --- | --- | --- | --- |
| Where you use it | In the AI app you already have open | In a web page in your browser | In a web page in your browser |
| What you type in | A DOI, an ISBN, or the details of the source | A URL, a title or an author to search for, or the details you type | The details you type, or a citation you paste in |
| Styles you get back | APA 7, MLA 9, Chicago author date | APA, MLA, Harvard and many more styles | APA, MLA, Chicago, Harvard and thousands more styles |
| In text citation | Yes, with an optional page number, in the parenthetical or the narrative form | Yes | Yes |
| Keeping your sources | Nothing is stored | BibGuru Plus saves sources in projects and folders | The paid tier saves your citations |
| Cost | Free, MIT license, open source | Free, with a paid plan | Free, with a paid tier |
| Signing in | Never | Only to save your sources | Only to save your citations |

Both other tools cover many more styles than this one does. What you get here is a citation in the chat you are writing in, from a DOI or an ISBN, with nothing to sign up for.

## Paste ready output

Here is the same paper in all three styles, with the in text citation and the narrative form for each one. The narrative form is for a sentence where you name the author, as in "LeCun et al. (2015, p. 436) argue that ...". Copy the lines you need.

```text
Deep learning
LeCun, Yann, Yoshua Bengio and Geoffrey Hinton
Nature, 2015, volume 521, issue 7553, pages 436 to 444
DOI 10.1038/nature14539

APA 7
LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. *Nature*, *521*(7553), 436-444. https://doi.org/10.1038/nature14539
In text: (LeCun et al., 2015, p. 436)
Narrative: LeCun et al. (2015, p. 436)

MLA 9
LeCun, Yann, et al. "Deep learning." *Nature*, vol. 521, no. 7553, 2015, pp. 436-444, https://doi.org/10.1038/nature14539.
In text: (LeCun et al. 436)
Narrative: LeCun et al. (436)

Chicago author date
LeCun, Yann, et al. 2015. "Deep learning." *Nature* 521 (7553): 436-444. https://doi.org/10.1038/nature14539.
In text: (LeCun et al. 2015, 436)
Narrative: LeCun et al. (2015, 436)
```

## Install

```bash
npx -y student-citations-mcp
```

Nothing else to install. You need Node.js 20 or newer. The config block for your app is further down this page.

## Tools

| Tool | What it does |
| --- | --- |
| `format_citation` | Format a journal article, book or website from details you type, in APA 7, MLA 9 or Chicago author date. For books you can name the editors and the translators too |
| `cite_from_doi` | Look up a DOI on Crossref and format the citation |
| `cite_from_isbn` | Look up an ISBN on Open Library and format the citation |
| `in_text_citation` | The in text citation that matches a source, with an optional page number, in the parenthetical or the narrative form |

All four tools are read only.

## What you can ask

- "Cite 10.1038/nature14539 in APA."
- "Make an MLA citation for ISBN 9780262033848."
- "Format this as Chicago: Smith and Jones, 2020, Learning to Learn, Journal of Study Skills, volume 4, issue 2, pages 11 to 25."
- "What's the in text citation for a quote on page 14 of that paper?"
- "Give me the APA citation for that in narrative form, so I can name the author in my sentence."
- "Format this book in MLA with the editors taking the author's place: A dictionary of study words by Jamie Patel and Robin Cole, 2019, North Gate Press."
- "Cite this translated book in APA: My brilliant friend by Elena Ferrante, translated by Ann Goldstein, 2012, Europa Editions."

## Example

Ask for "Cite 10.1038/nature14539 in APA." and the server gives back:

```text
LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. *Nature*, *521*(7553), 436-444. https://doi.org/10.1038/nature14539

(From Crossref. Check it against your style guide.)
```

Italics come back as asterisks so your app can style them.

If this saved you a formatting headache, please [give the repo a star](https://github.com/AnonymousOnyx22/student-citations-mcp). It sits at 0 stars, and one star helps the next student find it.

## Editors and translators

Edited and translated books are common in coursework, and each style puts those names in its own spot. `format_citation` takes `editors` and `translators` in the same shape as `authors`. When a book has editors and no authors, the editors take the author's place. When the book has an author as well, the extra names go after the title, next to the edition. Here is one edited book and one translated book in all three styles.

```text
A dictionary of study words
Jamie Patel and Robin Cole, editors, 2019, North Gate Press

APA 7
Patel, J., & Cole, R., Eds. (2019). *A dictionary of study words*. North Gate Press.

MLA 9
Patel, Jamie, and Robin Cole, editors. *A dictionary of study words*. North Gate Press, 2019.

Chicago author date
Patel, Jamie, and Robin Cole, eds. 2019. *A dictionary of study words*. North Gate Press.

My brilliant friend
Elena Ferrante, 2012, translated by Ann Goldstein, Europa Editions

APA 7
Ferrante, E. (2012). *My brilliant friend* (Goldstein, A., Trans.). Europa Editions.

MLA 9
Ferrante, Elena. *My brilliant friend*. Translated by Ann Goldstein, Europa Editions, 2012.

Chicago author date
Ferrante, Elena. 2012. *My brilliant friend*. Translated by Ann Goldstein. Europa Editions.
```

## Add it to your app

Add this to your MCP client config. For Claude Desktop that is `claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "citations": {
      "command": "npx",
      "args": ["-y", "student-citations-mcp"]
    }
  }
}
```

Restart your AI app, then try one of the questions above. For Claude Code, run `claude mcp add citations -- npx -y student-citations-mcp`.

## Good to know

- Always check the result against your course's style guide or your instructor's rules. Styles have many special cases this tool does not cover, such as editors and translators inside a journal article, the author of a single chapter in an edited book, chapter numbers and multi volume sets.
- Titles are used as the source gives them. APA wants sentence case for article titles, so fix capitals if your style needs it.
- Optional environment variables, `CROSSREF_EMAIL` puts your address in lookups so Crossref can reach you about heavy use, and `CROSSREF_BASE_URL` and `OPENLIBRARY_BASE_URL` point to other servers for testing.

## Development

```bash
npm install
npm run build
npm test
```

Tests run against fake Crossref and Open Library servers, so they need no network. The test runner needs Node.js 22.12 or newer, and the CI workflow uses Node 22.

The CI workflow installs the dependencies, builds the server and runs the tests on every push to main and on every pull request. One of those tests checks that the version is the same in package.json, server.json, llms.txt and glama.json, so the npm release and the registry entry stay in step. Another one checks that the paste ready example above is exactly what cite_from_doi returns for that DOI, so the page and the code stay in step.

## More free student MCP servers

All free, open source and read only where they touch your accounts. Browse the full list at [brightspacemcp.com/more-mcps](https://brightspacemcp.com/more-mcps/).

| Server | What it does |
| --- | --- |
| [Brightspace MCP](https://github.com/AnonymousOnyx22/brightspace-d2l-mcp) | D2L Brightspace for AI. Due dates with real submission status, grades, a target grade calculator and course files. |
| [Canvas MCP](https://github.com/AnonymousOnyx22/canvas-lms-student-mcp) | Read only Canvas LMS for AI. Due dates, missing work, grades and announcements. |
| [Moodle MCP](https://github.com/AnonymousOnyx22/moodle-student-mcp) | Read only Moodle for AI. Due dates, overdue work, grades and announcements. |
| [Google Classroom MCP](https://github.com/AnonymousOnyx22/google-classroom-student-mcp) | Read only Google Classroom for AI. To do, due dates, missing work and grades. |
| [GPA Calculator MCP](https://github.com/AnonymousOnyx22/gpa-calculator-mcp) | GPA, grade conversion and what do I need on the final math for AI. Works offline, no account. |
| [Study Planner MCP](https://github.com/AnonymousOnyx22/study-planner-mcp) | Exam study schedules, spaced repetition dates, pomodoro plans and assignment milestones. Works offline. |
| [Paper Finder MCP](https://github.com/AnonymousOnyx22/paper-finder-student-mcp) | Search scholarly papers, find open access copies and related work through OpenAlex. No key needed. |

## License

MIT
