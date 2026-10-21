import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export type Shape = Record<string, z.ZodTypeAny>;

export interface PromptDef {
  name: string;
  title: string;
  description: string;
  argsSchema: Shape;
  build: (args: any) => string;
}

/**
 * Register the prompts on the server, so a client can list them and ask for one by name.
 * Each prompt returns a single user message, which the client puts in the chat for the
 * student to edit before sending.
 */
export function registerPrompts(server: McpServer, prompts: PromptDef[]): void {
  for (const prompt of prompts) {
    server.registerPrompt(
      prompt.name,
      {
        title: prompt.title,
        description: prompt.description,
        argsSchema: prompt.argsSchema,
      },
      (args: any) => ({
        description: prompt.description,
        messages: [{ role: "user" as const, content: { type: "text" as const, text: prompt.build(args) } }],
      }),
    );
  }
}
