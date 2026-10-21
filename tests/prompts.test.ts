import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";
import { citeThisMessage, examplePrompts, prompts } from "../src/prompts.js";
import { tools } from "../src/tools.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8").replace(/\r\n/g, "\n");

let client: Client;

beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer().connect(a);
  client = new Client({ name: "test", version: "0" });
  await client.connect(b);
});
afterAll(async () => {
  await client.close();
});

/** Ask the server for a prompt and return the text of the message it sends back. */
async function get(name: string, args: Record<string, string> = {}): Promise<string> {
  const r: any = await client.getPrompt({ name, arguments: args });
  return r.messages[0].content.text as string;
}

/** The example prompt that a tool description carries. */
function exampleOf(name: string): string {
  const tool = tools.find((t) => t.name === name);
  expect(tool, `${name} is not a tool`).toBeTruthy();
  return tool!.description.match(/Example prompt: "([^"]+)"/)![1];
}

describe("the cite_this prompt", () => {
  it("lists one prompt, with a title and a description", async () => {
    const listed = (await client.listPrompts()).prompts;
    expect(listed.map((p) => p.name)).toEqual(["cite_this"]);
    expect(listed[0].title).toBe("Cite a source in APA");
    expect(listed[0].description).toBe(prompts[0].description);
  });

  it("takes an optional style and an optional source", async () => {
    const listed = (await client.listPrompts()).prompts;
    const args = listed[0].arguments ?? [];
    expect(args.map((a) => a.name).sort()).toEqual(["source", "style"]);
    for (const arg of args) expect(arg.required).toBeFalsy();
  });

  it("sends back a user message the student can edit", async () => {
    const r: any = await client.getPrompt({ name: "cite_this" });
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0].role).toBe("user");
    expect(r.messages[0].content.type).toBe("text");
    expect(r.messages[0].content.text).toContain("Cite this source in APA 7.");
  });

  it("carries the example wording the four tools use", async () => {
    const text = await get("cite_this");
    expect(examplePrompts("apa7")[0]).toBe(exampleOf("format_citation"));
    expect(examplePrompts("apa7")[1]).toBe(exampleOf("cite_from_doi"));
    expect(examplePrompts("mla9")[2]).toBe(exampleOf("cite_from_isbn"));
    expect(examplePrompts("apa7")[3]).toBe(exampleOf("in_text_citation"));
    for (const example of examplePrompts("apa7")) expect(text).toContain(example);
  });

  it("names the style it used", async () => {
    const mla = await get("cite_this", { style: "mla9" });
    expect(mla).toContain("Cite this source in MLA 9.");
    expect(mla).toContain("Cite 10.1038/nature14539 in MLA.");
    expect(mla).not.toContain("in APA");
    const chicago = await get("cite_this", { style: "chicago-ad" });
    expect(chicago).toContain("Cite this source in Chicago author date.");
    const alias = await get("cite_this", { style: "Chicago" });
    expect(alias).toBe(chicago);
  });

  it("uses APA 7 when the style is left blank", async () => {
    const blank = await get("cite_this", { style: "   " });
    expect(blank).toContain("Cite this source in APA 7.");
  });

  it("puts the source in the message and points at the tool that fits it", async () => {
    const doi = await get("cite_this", { source: "10.1038/nature14539" });
    expect(doi).toContain("Source: 10.1038/nature14539");
    expect(doi).toContain("That looks like a DOI, so use cite_from_doi.");
    const isbn = await get("cite_this", { source: "978-0-262-03384-8" });
    expect(isbn).toContain("Source: 978-0-262-03384-8");
    expect(isbn).toContain("That looks like an ISBN, so use cite_from_isbn.");
    const typed = await get("cite_this", { source: "Smith and Jones, 2020, Learning to learn" });
    expect(typed).toContain("Those are details you type, so use format_citation.");
  });

  it("leaves the source out when it is left blank", async () => {
    const blank = await get("cite_this", { source: "   " });
    expect(blank).not.toContain("Source:");
    expect(blank).toContain("Use the tool that fits the source:");
  });

  it("points at every tool when there is no source", async () => {
    const text = await get("cite_this");
    for (const name of ["cite_from_doi", "cite_from_isbn", "format_citation", "in_text_citation"]) {
      expect(text).toContain(name);
    }
  });

  it("names the styles it knows when it is given one it does not", async () => {
    await expect(get("cite_this", { style: "harvard" })).rejects.toThrow(/not a known citation style/);
  });

  it("shows the message the README shows", () => {
    expect(readme).toContain(citeThisMessage({}));
  });
});
