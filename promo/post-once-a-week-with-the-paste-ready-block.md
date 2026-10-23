Post to: dev.to

# I built a citation tool that runs in the chat where I write my essays

The part of an essay I dread is not the writing. It is the ten minutes at the end spent formatting references. I would keep a DOI in my notes, open a citation site, paste it, close a cookie banner, pick a style, copy the result, then fix the italics after pasting it into my document. None of that is hard. It is just another set of tabs.

So I built Citations MCP. It is an MCP server, which means it adds citation tools to an AI app that already supports MCP, such as Claude Desktop, Claude Code, Cursor or VS Code with Copilot. You ask for a citation in the chat and the formatted citation comes back in the same conversation.

It has five tools:

- `cite_from_doi` looks up a DOI on Crossref and formats the citation. The Crossref record decides the shape, so a book chapter comes back as a chapter and a dissertation comes back as a thesis.
- `cite_from_isbn` looks up an ISBN on Open Library and formats the book.
- `format_citation` formats details you type: a journal article, book, website, book chapter, thesis, report, dataset or preprint.
- `format_bibliography` takes several sources and returns one works cited list, alphabetised by author.
- `in_text_citation` gives the matching in text citation, with an optional page number, in brackets or in the narrative form for a sentence that names the author.

The styles are APA 7, MLA 9 and Chicago author date. All five tools are read only, nothing is stored, and the only requests out are the DOI and ISBN lookups to Crossref and Open Library.

## Install

```bash
npx -y student-citations-mcp
```

You need Node.js 20 or newer. Add this block to your app's MCP config, restart the app, and ask for a citation:

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

## The same paper in all three styles

Here is one paper, with the reference, the in text citation and the narrative form for each style.

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

I use the narrative form most. "LeCun et al. (2015, p. 436) argue that ..." means I can name the authors in my sentence without rewriting the citation around a bracket.

## How it compares

| | Citations MCP | Citation sites in a browser | Zotero MCP servers |
| --- | --- | --- | --- |
| Where it runs | In the AI app you already have open | In a browser tab | In the AI app you already have open |
| What you give it | A DOI, an ISBN or the details of the source | A search term or the details you type | A Zotero library |
| What you get back | A citation and the in text form | A citation | Library search, PDF text, notes and tags |
| What you need first | Node.js 20 or newer | Nothing | Zotero installed or a Zotero account |
| What it stores | Nothing | Depends on the site | Your sources, in your Zotero library |

The Zotero servers are the closer match, because they also run in the app. If you already keep a library in Zotero, use one of those. They search it, read your PDFs and write notes back. This server does one source at a time. You give it an identifier or the details, and it gives you the citation and the in text form. That was the job I needed.

## Two things to know

It formats from fixed rules in the code, so check the result against your course guide or your instructor's rules. APA, MLA and Chicago all have cases the code does not cover, such as editors and translators inside a journal article, chapter numbers and multi volume sets.

Titles come back as the source gives them. APA wants sentence case for article titles, so fix capitals if your style needs it.

The repo is at [github.com/AnonymousOnyx22/student-citations-mcp](https://github.com/AnonymousOnyx22/student-citations-mcp). It is MIT licensed, free to use, and there is no account or key. If it saves you a formatting headache, a star helps the next student find it.
