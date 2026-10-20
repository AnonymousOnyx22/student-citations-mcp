# Citations MCP

[![npm](https://img.shields.io/npm/v/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![downloads](https://img.shields.io/npm/dm/student-citations-mcp.svg)](https://www.npmjs.com/package/student-citations-mcp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Citation MCP server for AI apps. Paste a DOI or an ISBN and get a formatted citation back in APA 7, MLA 9 or Chicago author-date. You can also type the details yourself, and get the matching in-text citation. Formatting is done by tested code, so the punctuation is the same every time.

This is a free, open source [MCP](https://modelcontextprotocol.io) server. It works with Claude, ChatGPT, Cursor, VS Code Copilot and any other app that supports MCP. Lookups go to the free public Crossref and Open Library services and nothing else. There is no account or key, and nothing is stored.

Free forever. No account and no subscription.

## Quick start

Add this to your AI app's MCP config. For Claude Desktop that is `claude_desktop_config.json`.

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

Restart your AI app, then try one of the questions below. You need Node.js 20 or newer.

For Claude Code, run `claude mcp add citations -- npx -y student-citations-mcp`.

## What you can ask

- "Cite 10.1038/nature14539 in APA."
- "Make an MLA citation for ISBN 9780262033848."
- "Format this as Chicago: Smith and Jones, 2020, Learning to Learn, Journal of Study Skills, volume 4, issue 2, pages 11 to 25."
- "What's the in-text citation for a quote on page 14 of that paper?"

## Tools

| Tool | What it does |
| --- | --- |
| `format_citation` | Format a journal article, book or website from details you provide, in APA 7, MLA 9 or Chicago author-date |
| `cite_from_doi` | Look up a DOI on Crossref and format the citation |
| `cite_from_isbn` | Look up an ISBN on Open Library and format the citation |
| `in_text_citation` | The in-text citation that matches a source, with an optional page number |

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

## More free student MCP servers

All free, open source and read only where they touch your accounts. Browse the full list at [brightspacemcp.com/more-mcps](https://brightspacemcp.com/more-mcps/).

| Server | What it does |
| --- | --- |
| [Brightspace MCP](https://github.com/AnonymousOnyx22/brightspace-d2l-mcp) | D2L Brightspace for AI. Due dates with real submission status, grades, a target grade calculator and course files. |
| [Canvas MCP](https://github.com/AnonymousOnyx22/canvas-lms-student-mcp) | Read-only Canvas LMS for AI. Due dates, missing work, grades and announcements. |
| [Moodle MCP](https://github.com/AnonymousOnyx22/moodle-student-mcp) | Read-only Moodle for AI. Due dates, overdue work, grades and announcements. |
| [Google Classroom MCP](https://github.com/AnonymousOnyx22/google-classroom-student-mcp) | Read-only Google Classroom for AI. To-do, due dates, missing work and grades. |
| [GPA Calculator MCP](https://github.com/AnonymousOnyx22/gpa-calculator-mcp) | GPA, grade conversion and what-do-I-need-on-the-final math for AI. Works offline, no account. |
| [Study Planner MCP](https://github.com/AnonymousOnyx22/study-planner-mcp) | Exam study schedules, spaced repetition dates, pomodoro plans and assignment milestones. Works offline. |
| [Paper Finder MCP](https://github.com/AnonymousOnyx22/paper-finder-student-mcp) | Search scholarly papers, find open access copies and related work through OpenAlex. No key needed. |

## License

MIT
