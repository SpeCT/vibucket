import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMCPServer } from "./mcp";

main().catch(console.error);


async function main() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("Bitbucket MCP Server started");
}
