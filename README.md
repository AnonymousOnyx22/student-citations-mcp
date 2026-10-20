# Citations MCP

[![npm](https://img.shields.io/npm/v/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![downloads](https://img.shields.io/npm/dm/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ci](https://github.com/AnonymousOnyx22/student-citations-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/AnonymousOnyx22/student-citations-mcp/actions/workflows/ci.yml)

Paste a DOI or an ISBN into your AI app and get a formatted citation back in APA 7, MLA 9 or Chicago author date. You can also type the details yourself and get the matching in text citation. The wording and punctuation come from tested code, so they are the same every time. Free and open source, no account, no key and nothing stored. It works with Claude, ChatGPT, Cursor, VS Code Copilot and any other app that supports MCP.

## Install

```bash
npx -y student-citations-mcp
```

Nothing else to install. You need Node.js 20 or newer. The config block for your app is further down this page.

## Tools

| Tool | What it does |
| --- | --- |
| `format_citation` | Format a journal article, book or website from details you type, in APA 7, MLA 9 or Chicago author date |
| `cite_from_doi` | Look up a DOI on Crossref and format the citation |
| `cite_from_isbn` | Look up an ISBN on Open Library and format the citation |
| `in_text_citation` | The in text citation that matches a source, with an optional page number |

All four tools are read only.

## What you can ask

- "Cite 10.1038/nature14539 in APA."
- "Make an MLA citation for ISBN 9780262033848."
- "Format this as Chicago: Smith and Jones, 2020, Learning to Learn, Journal of Study Skills, volume 4, issue 2, pages 11 to 25."
- "What's the in text citation for a quote on page 14 of that paper?"

## Example

Ask for "Cite 10.1038/nature14539 in APA." and the server gives back:

```text
LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. *Nature*, *521*(7553), 436-444. https://doi.org/10.1038/nature14539

(From Crossref. Check it against your style guide.)
```

Italics come back as asterisks so your app can style them.

If this saved you a formatting headache, please [give the repo a star](https://github.com/AnonymousOnyx22/student-citations-mcp). It sits at 0 stars, and one star helps the next student find it.

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

- Always check the result against your course's style guide or your instructor's rules. Styles have many special cases this tool does not cover, such as editors, translators and edition rules.
- Titles are used as the source gives them. APA wants sentence case for article titles, so fix capitals if your style needs it.
- Optional environment variables, `CROSSREF_EMAIL` puts your address in lookups so Crossref can reach you about heavy use, and `CROSSREF_BASE_URL` and `OPENLIBRARY_BASE_URL` point to other servers for testing.

## Development

```bash
npm install
npm run build
npm test
```

Tests run against fake Crossref and Open Library servers, so they need no network.

The CI workflow installs the dependencies, builds the server and runs the tests on every push to main and on every pull request. One of those tests checks that the version is the same in package.json, server.json, llms.txt and glama.json, so the npm release and the registry entry stay in step.

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
