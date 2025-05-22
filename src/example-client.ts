import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";

// Schema for result validation
const BitbucketResultSchema = z.object({
  result: z.any(),
});

/**
 * Example of using the Bitbucket MCP tools as a client
 */
async function main() {
  // Create a client
  const client = new Client(
    {
      name: "example-bitbucket-client",
      version: "1.0.0",
    },
    {
      capabilities: {}
    }
  );

  // Connect to the Bitbucket MCP server
  const transport = new StdioClientTransport({
    command: "npx ts-node src/mcp/bitbucket-server.ts",
  });

  try {
    await client.connect(transport);
    console.log("Connected to Bitbucket MCP server");

    // Example: Get repositories for a user
    const response = await client.request(
      {
        method: "bitbucket/getRepositories",
        params: {
          auth: {
            username: "your-username",
            password: "your-app-password"
          },
          role: "owner",
          pagelen: 10
        }
      },
      BitbucketResultSchema
    );

    const repositories = response.result;
    console.log(`Found ${repositories.size} repositories:`);
    for (const repo of repositories.values) {
      console.log(`- ${repo.full_name}: ${repo.description}`);
    }

    // Example: Get a specific repository
    if (repositories.values.length > 0) {
      const [workspace, repoSlug] = repositories.values[0].full_name.split('/');
      
      const repoResponse = await client.request(
        {
          method: "bitbucket/getRepository",
          params: {
            auth: {
              username: "your-username",
              password: "your-app-password"
            },
            workspace,
            repoSlug
          }
        },
        BitbucketResultSchema
      );

      const repository = repoResponse.result;
      console.log("\nRepository details:");
      console.log(`- Name: ${repository.name}`);
      console.log(`- Description: ${repository.description}`);
      console.log(`- Private: ${repository.is_private}`);
      console.log(`- Language: ${repository.language}`);
      console.log(`- Created: ${new Date(repository.created_on).toLocaleDateString()}`);
      
      // Example: Get pull requests for this repository
      console.log("\nFetching pull requests...");
      const prResponse = await client.request(
        {
          method: "bitbucket/getPullRequests",
          params: {
            auth: {
              username: "your-username",
              password: "your-app-password"
            },
            workspace,
            repoSlug,
            state: "OPEN"
          }
        },
        BitbucketResultSchema
      );
      
      const pullRequests = prResponse.result;
      console.log(`Found ${pullRequests.size} open pull requests:`);
      
      for (const pr of pullRequests.values) {
        console.log(`\n- PR #${pr.id}: ${pr.title}`);
        console.log(`  From: ${pr.source.branch.name} -> ${pr.destination.branch.name}`);
        console.log(`  Author: ${pr.author.display_name}`);
        console.log(`  Created: ${new Date(pr.created_on).toLocaleDateString()}`);
        console.log(`  Status: ${pr.state}`);
      }
      
      // Example: Create a pull request
      // Note: This is commented out to prevent accidental PR creation
      /*
      console.log("\nCreating a new pull request...");
      const createPrResponse = await client.request(
        {
          method: "bitbucket/createPullRequest",
          params: {
            auth: {
              username: "your-username",
              password: "your-app-password"
            },
            workspace,
            repoSlug,
            title: "Example PR from MCP client",
            source: {
              branch: {
                name: "feature-branch"  // Replace with an actual branch name
              }
            },
            destination: {
              branch: {
                name: "main"  // Replace with an actual branch name
              }
            },
            description: "This is an example pull request created via the MCP client",
            close_source_branch: true
          }
        },
        BitbucketResultSchema
      );
      
      const newPr = createPrResponse.result;
      console.log(`Created new PR #${newPr.id}: ${newPr.title}`);
      */
      
      // Example: Get a specific pull request (if one exists)
      if (pullRequests.values.length > 0) {
        const pullRequestId = pullRequests.values[0].id;
        console.log(`\nFetching details for PR #${pullRequestId}...`);
        
        const prDetailResponse = await client.request(
          {
            method: "bitbucket/getPullRequest",
            params: {
              auth: {
                username: "your-username",
                password: "your-app-password"
              },
              workspace,
              repoSlug,
              pullRequestId
            }
          },
          BitbucketResultSchema
        );
        
        const prDetail = prDetailResponse.result;
        console.log(`PR #${prDetail.id} details:`);
        console.log(`- Title: ${prDetail.title}`);
        console.log(`- Source: ${prDetail.source.branch.name}`);
        console.log(`- Destination: ${prDetail.destination.branch.name}`);
        console.log(`- Author: ${prDetail.author.display_name}`);
        console.log(`- Status: ${prDetail.state}`);
        console.log(`- Comment count: ${prDetail.comment_count}`);
        console.log(`- Created: ${new Date(prDetail.created_on).toLocaleDateString()}`);
        console.log(`- Updated: ${new Date(prDetail.updated_on).toLocaleDateString()}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the transport connection when done
    await transport.close();
  }
}

// If this file is executed directly, run the example
if (require.main === module) {
  main().catch(console.error);
} 