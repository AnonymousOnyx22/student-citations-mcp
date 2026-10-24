Post to: Reddit r/ChatGPTCoding

Tired of tabbing between a citation site and my essay just to format one reference, so I built Citations MCP.

It runs in the AI app I'm already writing in (Claude Desktop, Claude Code, Cursor, VS Code). Paste a DOI or an ISBN and get APA 7, MLA 9 or Chicago author date back with the in text citation too.

Tools:
- cite_from_doi / cite_from_isbn for lookups
- format_citation for details you type (article, book, chapter, thesis, report, dataset, preprint, website)
- format_bibliography for an alphabetised works cited list
- in_text_citation for parenthetical or narrative form

Install:
`ash
npx -y student-citations-mcp
`

Add to your MCP config and ask for a citation. Nothing stored, read only, no account.

Repo: https://github.com/AnonymousOnyx22/student-citations-mcp
