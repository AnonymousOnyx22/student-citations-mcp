#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, VERSION } from "./server.js";

function usage(): void {
  console.log(`student-citations-mcp ${VERSION}

Citation MCP server for APA, MLA and Chicago citations from a DOI, an ISBN or typed details.

Add it to your AI app's MCP config with command "npx" and args ["-y", "student-citations-mcp"].

Optional environment
  CROSSREF_EMAIL    Your email, sent to Crossref so they can reach you about heavy use

  --help, --version`);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (cmd === "--help" || cmd === "-h") return usage();
  if (cmd === "--version" || cmd === "-v") return console.log(VERSION);
  await createServer().connect(new StdioServerTransport());
  console.error(`student-citations-mcp ${VERSION} running`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
