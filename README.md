# Citations MCP

[![npm](https://img.shields.io/npm/v/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![downloads](https://img.shields.io/npm/dm/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ci](https://github.com/AnonymousOnyx22/student-citations-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/AnonymousOnyx22/student-citations-mcp/actions/workflows/ci.yml)

Paste a DOI or an ISBN into your AI app and get a formatted citation back in APA 7, MLA 9 or Chicago author date, ready to paste into your works cited list. It is a citation generator that runs inside the app you are already writing in, so there is no web page to fill in and no account to create. You can also type the details yourself, or give the DOI or the ISBN, and get the matching in text citation, either in brackets or in the narrative form for a sentence where you name the author. Give several sources in one call and you get them back as an alphabetised works cited list. The wording and punctuation come from tested code, so they are the same every time. Free and open source, no account, no key and nothing stored. It works with Claude, ChatGPT, Cursor, VS Code Copilot and any other app that supports MCP.

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

## Citations MCP compared with the Zotero MCP servers

The other MCP servers for citations are the Zotero ones: [zotero-mcp](https://www.npmjs.com/package/zotero-mcp), [@oscardvs/zoteus](https://www.npmjs.com/package/@oscardvs/zoteus) and [@xbghc/zotero-mcp](https://www.npmjs.com/package/@xbghc/zotero-mcp). They are the closer competition, because they run inside your app as well. They are also built around a library you keep in Zotero, so they ask more of you first. Here is the side by side.

| | Citations MCP | [zotero-mcp](https://www.npmjs.com/package/zotero-mcp) | [@oscardvs/zoteus](https://www.npmjs.com/package/@oscardvs/zoteus) | [@xbghc/zotero-mcp](https://www.npmjs.com/package/@xbghc/zotero-mcp) |
| --- | --- | --- | --- | --- |
| What it works with | A DOI, an ISBN, or the details you type | Your Zotero library | Your Zotero library | Your Zotero library |
| What you need first | Node.js 20 or newer, nothing else | Zotero on your computer, with the plugin the project ships | Zotero on your computer, or an account at zotero.org | An account at zotero.org, with an API key and a user ID |
| Signing in | Never | Only if you use the Zotero web library | Only for sync and group libraries | Always, the API key is how it reaches your library |
| Citation styles | APA 7, MLA 9, Chicago author date | None of its own, it passes your items to your app | Any CSL style, through the citeproc-js library | Entries as BibTeX, RIS or CSL JSON |
| What you get back | A finished citation, and the in text form with a page number | Items, notes and PDF text from your library | Items, PDF passages with page numbers, and formatted bibliographies | Items and PDF text, plus exports for a bibliography tool |
| Reading your library | No, it looks up one source at a time | Search, collections, annotations and PDF text | Search by word or by meaning, PDF passages, annotations and bibliography imports | Search, details, full text, and filtering by group or tag |
| Writing to your library | No, every tool is read only | Notes, tags, metadata and new items | Adds, edits, tags, groups and files | Creates, edits, deletes, tags, groups and attachments |
| Where your sources live | Nowhere, nothing is stored | In your Zotero library | In your Zotero library | In your Zotero library |
| Good for | One citation now, with nothing to set up | Working inside a library you already keep in Zotero | The same, with a deeper read of your PDFs and many more styles | The same, with export formats your bibliography tool can read |

All three are open source under the MIT license, as this one is. Two of them talk to the Zotero desktop app, so you install Zotero and keep it running while you work. The third goes through the Zotero web API, so you sign in at zotero.org and paste an API key and your user ID.

That is the trade. The Zotero servers do more with a library you already keep. They search it, read your PDFs, give you a passage with its page number and write notes and tags back into it. Citations MCP covers the other half of the job. You give it a DOI, an ISBN or the details of a source, and it gives you the citation and the in text form, in the chat, with nothing to install, no account and nothing stored. If your course needs one of the many styles Zotero can produce, take one of the Zotero servers. If you need the reference for one essay, this is the shorter path.

Each project keeps its own setup guide: [cookjohn/zotero-mcp](https://github.com/cookjohn/zotero-mcp), [oscardvs/zoteus](https://github.com/oscardvs/zoteus) and [xbghc/zotero-mcp](https://github.com/xbghc/zotero-mcp).

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
| `format_citation` | Format a journal article, book, website, book chapter, thesis, report, dataset or preprint from details you type, in APA 7, MLA 9 or Chicago author date. For books you can name the editors and the translators too |
| `format_bibliography` | Format several sources as one works cited list, alphabetised by author, in APA 7, MLA 9 or Chicago author date. Each source takes the same fields as `format_citation` |
| `cite_from_doi` | Look up a DOI on Crossref and format the citation. The Crossref record decides the shape, so a book chapter comes back as a chapter and a dissertation comes back as a thesis |
| `cite_from_isbn` | Look up an ISBN on Open Library and format the citation |
| `in_text_citation` | The in text citation that matches a source, with an optional page number, in the parenthetical or the narrative form. It takes the authors and year you type, or a DOI or an ISBN and looks up the authors and year for you |

All five tools are read only.

## Prompts

| Prompt | What it does |
| --- | --- |
| `cite_this` | Start a citation in APA 7, MLA 9 or Chicago author date from a DOI, an ISBN or details you type. It fills in the wording the tools use, so you can edit the source and send it |

A client that supports prompts, such as Claude Desktop or VS Code, shows it in the chat as a command you can run. In Claude Desktop it is `/cite_this`.

The prompt looks nothing up. It only writes out the request, so you can check it before you send it. Here is the message it puts in the chat when you run it with no arguments:

```text
Cite this source in APA 7.

Use the tool that fits the source: cite_from_doi for a DOI, cite_from_isbn for an ISBN, format_citation for details you type and in_text_citation for the in text form.

Example prompts:
- "Cite this journal article in APA 7: Learning to learn by John Kenneth Smith and Alice Jones, 2020, Journal of Study Skills, volume 4, issue 2, pages 11-25."
- "Cite 10.1038/nature14539 in APA."
- "Cite ISBN 978-0-262-03384-8 in APA 7."
- "Give the APA in text citation for Smith and Jones 2020 on page 14."
```

It takes two arguments. `style` picks the style, which is APA 7 unless you say otherwise, and `source` is the DOI, the ISBN or the details you want to cite. Give it a DOI and the message says so and points at `cite_from_doi`.

## What you can ask

- "Cite 10.1038/nature14539 in APA."
- "Cite the DOI of this book chapter in APA, with the editors of the book."
- "Make an MLA citation for ISBN 9780262033848."
- "Format this as Chicago: Smith and Jones, 2020, Learning to Learn, Journal of Study Skills, volume 4, issue 2, pages 11 to 25."
- "What's the in text citation for a quote on page 14 of that paper?"
- "Give me the APA in text citation for DOI 10.1038/nature14539 on page 436."
- "What's the MLA in text citation for ISBN 9780262033848?"
- "Give me the APA citation for that in narrative form, so I can name the author in my sentence."
- "Format this book in MLA with the editors taking the author's place: A dictionary of study words by Jamie Patel and Robin Cole, 2019, North Gate Press."
- "Cite this translated book in APA: My brilliant friend by Elena Ferrante, translated by Ann Goldstein, 2012, Europa Editions."
- "Cite this thesis in APA: Learning to learn by Jane Doe, 2021, North Gate University, Ph.D. dissertation."
- "Put these sources into one APA works cited list, alphabetised by author."

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

## Source types

With a DOI the server reads the Crossref record and follows the type it finds. A book does not come back as a journal article with a volume and an issue it does not have.

| Crossref type | What you get back |
| --- | --- |
| `journal-article` | A journal article, with its volume, issue and pages |
| `book`, `monograph`, `edited-book`, `reference-book`, `proceedings` | A book, and the editors take the author's place when the book has no author |
| `book-chapter`, `proceedings-article` | A chapter in its book, with the pages it covers |
| `dissertation` | A thesis, with the degree and the university |
| `report`, `standard` | A report, with its report number |
| `dataset` | A data set |
| `posted-content` | A preprint, with the repository it was posted in |

`format_citation` takes the same kinds of source, so you can type the details of a chapter, a thesis, a report, a data set or a preprint when there is no DOI to look up.

## Works cited list

`format_bibliography` takes several sources in one call and returns them as one list, alphabetised by the first author's family name. A source with no author is alphabetised by its title, and a leading "A", "An" or "The" is skipped. Each source takes the same fields as `format_citation`, so a journal article, a book and a website can sit in the same list. Here are those three sources in APA 7.

```text
Cormen, T. H. (2009). *Introduction to algorithms* (3rd ed.). MIT Press.

Smith, J. K., & Jones, A. (2020). Learning to learn. *Journal of Study Skills*, *4*(2), 11-25.

*The water cycle*. Example Uni. https://example.edu/water
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

## Frequently asked questions

**Does it work with Cursor?**

Yes. It runs over MCP, so it works in Cursor, Claude Desktop, VS Code with Copilot, ChatGPT and any other app that supports MCP. The config block is the same for every app, only the file it goes in changes. Copy that block into your app's MCP config, restart the app and ask for a citation.

**Is it free?**

Yes. It is MIT licensed and free to use. There is no account, no key, no paid plan and no trial that runs out. The DOI and ISBN lookups go to Crossref and Open Library, and the server sends no key, so there is nothing else to sign up for.

**Do I need an account or an API key?**

No. There is no sign up step and no key to paste into a config file. The install command is the whole setup.

**How is this different from the Zotero MCP servers?**

They are the other MCP servers for citations, and they are the closer competition, because they run inside your app as well. They are built around a Zotero library, so they need Zotero installed or a Zotero account, and they can search that library, read your PDFs and write back to it. This server works on one source at a time. You give it a DOI, an ISBN or the details and it gives you the citation, with nothing to install, no account and nothing stored. The comparison table above has the details.

**What happens to my data?**

Nothing is stored. The server keeps no list of your sources, writes no files and sends no usage data anywhere. It takes the details you type in the chat and, for a DOI or an ISBN, sends that identifier to Crossref or Open Library to fetch the record. The request also carries a user agent line with the server name and version, plus your email address if you set `CROSSREF_EMAIL`.

**How do I install it?**

Run `npx -y student-citations-mcp`. You need Node.js 20 or newer, and that is the only thing to install. `npx` fetches the package into the npm cache and runs it, so nothing is added to your project. Then add the config block to your app and restart it.

**Does it work without internet?**

Partly. `format_citation` works offline, because it formats the details you type. `in_text_citation` works offline too when you type the authors and the year. It also takes a DOI or an ISBN, and those lookups need a connection, as do `cite_from_doi` and `cite_from_isbn`, which fetch the record from Crossref or Open Library.

**Which styles can I ask for?**

APA 7, MLA 9 and Chicago author date, and no others. Ask for "APA", "MLA 9" or "Chicago" in the chat and the server works out the style name. A request for a style it does not have comes back with an error that names the three it knows.

**What can I cite?**

A journal article, a book, a book chapter, a thesis, a report, a dataset, a preprint or a website. With a DOI the server reads the Crossref record and follows the type it finds, so a journal article comes back as an article, an edited book comes back as a book with its editors, a book chapter or a conference paper comes back as a chapter, a dissertation comes back as a thesis, and a preprint comes back with the repository it was posted in. With an ISBN it reads the Open Library record for the book. If the lookup fails, or the source has no DOI, `format_citation` takes the details you type and formats them.

**Can I cite a book with editors or translators?**

Yes. `format_citation` takes `editors` and `translators` in the same shape as `authors`, and each style puts those names where it wants them. The Editors and translators section above shows a worked example for each style.

**Does it check the citation against my style guide?**

No. It formats from fixed rules in the code, and every style has cases it does not cover, such as editors and translators inside a journal article, chapter numbers and multi volume sets. Check the result against your course's style guide or your instructor's rules.

**Will it touch my files or my bibliography?**

No. The tools only return text in the chat. Nothing is written to your project and nothing is added to your reference list, so copy a citation into your own bibliography if you want to keep it.

**Can I use it to build a works cited list?**

Yes. `format_bibliography` takes several sources and returns them alphabetised as one list, in APA 7, MLA 9 or Chicago author date, ready to paste into your document. Each source takes the same fields as `format_citation`. The server keeps no list of your sources, so your works cited list stays where you put it.

**How do I remove it?**

Take the block out of your app's MCP config and the server stops running. There is nothing else to uninstall, since `npx` keeps its copy in the npm cache rather than in your project.

**Can I paste a DOI link or an ISBN with dashes?**

Yes. `cite_from_doi` and `in_text_citation` take a plain DOI like `10.1038/nature14539` or a doi.org link, and `cite_from_isbn` and `in_text_citation` take a 10 or 13 digit ISBN with or without dashes.

**Is the source code open?**

Yes. The MIT license and the full source are on GitHub, and the formatting rules live in `src/format.ts` if you want to read them.

## Good to know

- Always check the result against your course's style guide or your instructor's rules. Styles have many special cases this tool does not cover, such as editors and translators inside a journal article, chapter numbers and multi volume sets.
- Titles are used as the source gives them. APA wants sentence case for article titles, so fix capitals if your style needs it.
- Optional environment variables, `CROSSREF_EMAIL` puts your address in lookups so Crossref can reach you about heavy use, and `CROSSREF_BASE_URL` and `OPENLIBRARY_BASE_URL` point to other servers for testing.

## Development

```bash
npm install
npm run build
npm test
```

Tests run against fake Crossref and Open Library servers, so they need no network. The test runner needs Node.js 22.12 or newer, and the CI workflow uses Node 22.

The CI workflow installs the dependencies, builds the server and runs the tests on every push to main and on every pull request. One of those tests checks that the version is the same in package.json, server.json, llms.txt and glama.json, so the npm release and the registry entry stay in step. Another one checks that the paste ready example above is exactly what cite_from_doi returns for that DOI, so the page and the code stay in step. One more checks that the npm keywords and the descriptions keep the words students type when they look for a citation tool. A test also checks that the cite_this prompt is registered and that the message it returns carries the same example wording as the citation tool descriptions.

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
