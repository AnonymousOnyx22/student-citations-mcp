import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createClient } from "./core/http.js";
import { registerTools } from "./core/tools.js";
import { baseUrls } from "./config.js";
import { type Api, tools } from "./tools.js";

export const VERSION = "0.1.0";

export function makeApi(urls = baseUrls(), fetchImpl?: typeof fetch): Api {
  const ua = `student-citations-mcp/${VERSION}${urls.email ? ` (mailto:${urls.email})` : ""}`;
  return {
    crossref: createClient({ baseUrl: urls.crossref, headers: { "User-Agent": ua }, fetchImpl }),
    openLibrary: createClient({ baseUrl: urls.openLibrary, headers: { "User-Agent": ua }, fetchImpl }),
  };
}

export function createServer(api: Api = makeApi()): McpServer {
  const server = new McpServer({ name: "student-citations-mcp", version: VERSION });
  registerTools(server, tools, api);
  return server;
}
