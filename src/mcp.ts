import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import BitbucketClient from "./bitbucket";


/**
 * Start an MCP Server that exposes Bitbucket API tools
 */
export function createMCPServer() {
  const server = new Server(
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

  // Register request handlers with inline schemas
  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/getRepositories"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        role: z.enum(["owner", "admin", "contributor", "member"]).optional(),
        page: z.number().optional(),
        pagelen: z.number().optional(),
      }),
    }), 
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const result = await client.getRepositories({
        role: request.params.role,
        page: request.params.page,
        pagelen: request.params.pagelen,
      });
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/getRepository"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const result = await client.getRepository(
        request.params.workspace,
        request.params.repoSlug
      );
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/getPipelines"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
        sort: z.string().optional(),
        page: z.number().optional(),
        pagelen: z.number().optional(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const result = await client.getPipelines(
        request.params.workspace,
        request.params.repoSlug,
        {
          sort: request.params.sort,
          page: request.params.page,
          pagelen: request.params.pagelen,
        }
      );
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/getPipeline"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
        pipelineUuid: z.string(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const result = await client.getPipeline(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pipelineUuid
      );
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/getPipelineSteps"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
        pipelineUuid: z.string(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const result = await client.getPipelineSteps(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pipelineUuid
      );
      return { result };
    }
  );

  // Pull request handlers
  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/getPullRequests"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
        state: z.enum(["OPEN", "MERGED", "DECLINED", "SUPERSEDED"]).optional(),
        sort: z.string().optional(),
        page: z.number().optional(),
        pagelen: z.number().optional(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
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
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/getPullRequest"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
        pullRequestId: z.number(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const result = await client.getPullRequest(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pullRequestId
      );
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/createPullRequest"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
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
      const client = new BitbucketClient(request.params.auth);
      const { workspace, repoSlug, auth, ...createParams } = request.params;
      const result = await client.createPullRequest(
        workspace,
        repoSlug,
        createParams
      );
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/updatePullRequest"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
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
      const client = new BitbucketClient(request.params.auth);
      const { workspace, repoSlug, pullRequestId, auth, ...updateParams } = request.params;
      const result = await client.updatePullRequest(
        workspace,
        repoSlug,
        pullRequestId,
        updateParams
      );
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/mergePullRequest"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
        pullRequestId: z.number(),
        merge_strategy: z.enum(["merge_commit", "squash", "fast_forward"]).optional(),
        message: z.string().optional(),
        close_source_branch: z.boolean().optional(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const { workspace, repoSlug, pullRequestId, auth, ...mergeParams } = request.params;
      const result = await client.mergePullRequest(
        workspace,
        repoSlug,
        pullRequestId,
        mergeParams
      );
      return { result };
    }
  );

  server.setRequestHandler(
    z.object({
      method: z.literal("bitbucket/declinePullRequest"),
      params: z.object({
        auth: z.object({
          username: z.string(),
          password: z.string(),
        }),
        workspace: z.string(),
        repoSlug: z.string(),
        pullRequestId: z.number(),
      }),
    }),
    async (request) => {
      const client = new BitbucketClient(request.params.auth);
      const result = await client.declinePullRequest(
        request.params.workspace,
        request.params.repoSlug,
        request.params.pullRequestId
      );
      return { result };
    }
  );
  
  return server;
}

