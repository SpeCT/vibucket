import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import BitbucketClient from "./bitbucket";

/**
 * Start an MCP Server that exposes Bitbucket API tools
 */
export function createMCPServer(auth: { username: string; password: string }) {
  const server = new McpServer(
    {
      name: "bitbucket-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {
          methods: [
            "bitbucket/getRepositories",
            "bitbucket/getRepository",
            "bitbucket/getPipelines",
            "bitbucket/getPipeline",
            "bitbucket/getPipelineSteps",
            // Pull request methods
            "bitbucket/getPullRequests",
            "bitbucket/getPullRequest",
            "bitbucket/createPullRequest",
            "bitbucket/updatePullRequest",
            "bitbucket/mergePullRequest",
            "bitbucket/declinePullRequest",
          ],
        },
      },
    }
  );

  // Create a BitbucketClient instance with the provided auth
  const client = new BitbucketClient(auth);

  // Register request handlers with inline schemas
  server.tool(
    'getRepositories',
    ({
      method: z.literal("bitbucket/getRepositories"),
      params: z.object({
        workspace: z.string().optional(),
        role: z.enum(["owner", "admin", "contributor", "member"]).optional(),
        page: z.number().optional(),
        pagelen: z.number().optional(),
      }),
    }), 
    async (request) => {
      const result = await client.getRepositories({
        workspace: request.params.workspace,
        role: request.params.role,
        page: request.params.page,
        pagelen: request.params.pagelen,
      });

      const output = result.values.map((repo) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        href: repo.links.html.href,
      }));
      return { content: [{ type: "text", text: JSON.stringify(output) }] };
    }
  );

  server.tool(
    'getRepository',
    ({
      method: z.literal("bitbucket/getRepository"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
      }),
    }),
    async (request) => {
      const result = await client.getRepository(
        request.params.workspace,
        request.params.repoSlug
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'getPipelines',
    ({
      method: z.literal("bitbucket/getPipelines"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        sort: z.string().optional(),
        page: z.number().optional(),
        pagelen: z.number().optional(),
      }),
    }),
    async (request) => {
      const result = await client.getPipelines(
        request.params.workspace,
        request.params.repoSlug,
        {
          sort: request.params.sort,
          page: request.params.page,
          pagelen: request.params.pagelen,
        }
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'getPipeline',
    ({
      method: z.literal("bitbucket/getPipeline"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        pipelineUuid: z.string(),
      }),
    }),
    async (request) => {
      const result = await client.getPipeline(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pipelineUuid
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'getPipelineSteps',
    ({
      method: z.literal("bitbucket/getPipelineSteps"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        pipelineUuid: z.string(),
      }),
    }),
    async (request) => {
      const result = await client.getPipelineSteps(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pipelineUuid
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // Pull request handlers
  server.tool(
    'getPullRequests',
    ({
      method: z.literal("bitbucket/getPullRequests"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        state: z.enum(["OPEN", "MERGED", "DECLINED", "SUPERSEDED"]).optional(),
        sort: z.string().optional(),
        page: z.number().optional(),
        pagelen: z.number().optional(),
      }),
    }),
    async (request) => {
      const result = await client.getPullRequests(
        request.params.workspace,
        request.params.repoSlug,
        {
          state: request.params.state,
          sort: request.params.sort,
          page: request.params.page,
          pagelen: request.params.pagelen,
        }
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'getPullRequest',
    ({
      method: z.literal("bitbucket/getPullRequest"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        pullRequestId: z.number(),
      }),
    }),
    async (request) => {
      const result = await client.getPullRequest(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pullRequestId
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'createPullRequest',
    ({
      method: z.literal("bitbucket/createPullRequest"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        title: z.string(),
        source: z.object({
          branch: z.object({
            name: z.string(),
          }),
          repository: z.object({
            full_name: z.string(),
          }).optional(),
        }),
        destination: z.object({
          branch: z.object({
            name: z.string(),
          }),
          repository: z.object({
            full_name: z.string(),
          }).optional(),
        }),
        description: z.string().optional(),
        close_source_branch: z.boolean().optional(),
        reviewers: z.array(
          z.object({
            uuid: z.string(),
          })
        ).optional(),
      }),
    }),
    async (request) => {
      const { workspace, repoSlug, ...createParams } = request.params;
      const result = await client.createPullRequest(
        workspace,
        repoSlug,
        createParams
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'updatePullRequest',
    ({
      method: z.literal("bitbucket/updatePullRequest"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        pullRequestId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        reviewers: z.array(
          z.object({
            uuid: z.string(),
          })
        ).optional(),
        close_source_branch: z.boolean().optional(),
      }),
    }),
    async (request) => {
      const { workspace, repoSlug, pullRequestId, ...updateParams } = request.params;
      const result = await client.updatePullRequest(
        workspace,
        repoSlug,
        pullRequestId,
        updateParams
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'mergePullRequest',
    ({
      method: z.literal("bitbucket/mergePullRequest"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        pullRequestId: z.number(),
        merge_strategy: z.enum(["merge_commit", "squash", "fast_forward"]).optional(),
        message: z.string().optional(),
        close_source_branch: z.boolean().optional(),
      }),
    }),
    async (request) => {
      const { workspace, repoSlug, pullRequestId, ...mergeParams } = request.params;
      const result = await client.mergePullRequest(
        workspace,
        repoSlug,
        pullRequestId,
        mergeParams
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'declinePullRequest',
    ({
      method: z.literal("bitbucket/declinePullRequest"),
      params: z.object({
        workspace: z.string(),
        repoSlug: z.string(),
        pullRequestId: z.number(),
      }),
    }),
    async (request) => {
      const result = await client.declinePullRequest(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pullRequestId
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
  
  return server;
}

