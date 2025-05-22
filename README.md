# Bitbucket MCP Server

This directory contains an implementation of a Model Context Protocol (MCP) server that exposes Bitbucket API as tools.

## Overview

The Model Context Protocol (MCP) allows applications to provide context for LLMs in a standardized way. This implementation creates an MCP server that exposes Bitbucket API operations as tools that can be consumed by MCP clients, including LLM applications.

## Files

- `mcp.ts`: The MCP server implementation that exposes Bitbucket API methods as tools
- `example-client.ts`: An example client demonstrating how to use the Bitbucket tools

## Available Tools

This MCP server exposes the following Bitbucket API operations as tools:

### Repository and Pipeline Operations

1. `bitbucket/getRepositories`: List repositories for the authenticated user
2. `bitbucket/getRepository`: Get details of a specific repository
3. `bitbucket/getPipelines`: List pipelines for a repository
4. `bitbucket/getPipeline`: Get details of a specific pipeline
5. `bitbucket/getPipelineSteps`: List steps for a specific pipeline

### Pull Request Operations

6. `bitbucket/getPullRequests`: List pull requests for a repository
7. `bitbucket/getPullRequest`: Get details of a specific pull request
8. `bitbucket/createPullRequest`: Create a new pull request
9. `bitbucket/updatePullRequest`: Update an existing pull request
10. `bitbucket/mergePullRequest`: Merge a pull request
11. `bitbucket/declinePullRequest`: Decline a pull request

## Setup

1. Install dependencies:
   ```bash
   npm install @modelcontextprotocol/sdk zod
   ```

2. Make sure TypeScript is installed:
   ```bash
   npm install -g typescript ts-node
   ```

## Running the Server

Start the Bitbucket MCP server:

```bash
npx ts-node src/mcp.ts
```

The server runs using a stdio transport, which means it expects to receive and send messages through standard input/output channels.

## Using with Clients

To use this server from a client, see the example in `example-client.ts`. You can run the example with:

```bash
npx ts-node src/mcp/example-client.ts
```

Remember to update the authentication credentials in the example client with your Bitbucket username and app password.

## Example: Working with Pull Requests

```typescript
// Connect to the MCP server
const client = new Client(
  {
    name: "example-bitbucket-client",
    version: "1.0.0",
  },
  {
    capabilities: {}
  }
);

const transport = new StdioClientTransport({
  command: "npx ts-node src/mcp.ts",
});

await client.connect(transport);

// Get open pull requests
const prResponse = await client.request(
  {
    method: "bitbucket/getPullRequests",
    params: {
      auth: {
        username: "your-username",
        password: "your-app-password"
      },
      workspace: "your-workspace",
      repoSlug: "your-repo",
      state: "OPEN"
    }
  },
  BitbucketResultSchema
);

const pullRequests = prResponse.result;

// Create a new pull request
const newPrResponse = await client.request(
  {
    method: "bitbucket/createPullRequest",
    params: {
      auth: {
        username: "your-username",
        password: "your-app-password"
      },
      workspace: "your-workspace",
      repoSlug: "your-repo",
      title: "My new pull request",
      source: {
        branch: {
          name: "feature-branch"
        }
      },
      destination: {
        branch: {
          name: "main"
        }
      },
      description: "This is a new feature implementation",
      close_source_branch: true
    }
  },
  BitbucketResultSchema
);

const newPullRequest = newPrResponse.result;
```

## Integration with LLM Applications

This MCP server can be used with any MCP-compatible LLM application or framework. The client simply needs to:

1. Connect to the server using the appropriate transport (stdio in this case)
2. Make requests to the exposed Bitbucket API methods
3. Handle the responses according to the application's needs

## Security Considerations

The Bitbucket API requires authentication credentials, which are passed directly from the client to the server. Ensure that:

1. Credentials are stored securely and never committed to version control
2. The server is run in a secure environment
3. Communication channels are secured appropriately for your use case

## Further Reading

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Bitbucket REST API Documentation](https://developer.atlassian.com/cloud/bitbucket/rest/) 