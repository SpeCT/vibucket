import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMCPServer } from "./mcp";

main().catch(console.error);


async function main() {
  const username = process.env.BITBUCKET_USERNAME!;
  const password = process.env.BITBUCKET_PASSWORD!;
  
  const server = createMCPServer({ username, password });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("Bitbucket MCP Server started");
}