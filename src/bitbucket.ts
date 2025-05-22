/**
 * Bitbucket API service
 * 
 * Provides functions to interact with Bitbucket Cloud REST API
 * for retrieving repositories and pipelines data.
 */

// Base URL for Bitbucket API v2.0
const BITBUCKET_API_BASE_URL = 'https://api.bitbucket.org/2.0';

// Types for Bitbucket entities
export interface BitbucketAuth {
  username: string;
  password: string; // App password
}

export interface Repository {
  uuid: string;
  name: string;
  full_name: string;
  description: string;
  owner: {
    display_name: string;
    uuid: string;
  };
  is_private: boolean;
  created_on: string;
  updated_on: string;
  size: number;
  language: string;
  has_issues: boolean;
  has_wiki: boolean;
  fork_policy: string;
  links: Record<string, any>;
}

export interface Pipeline {
  uuid: string;
  build_number: number;
  created_on: string;
  completed_on: string | null;
  state: {
    name: string;
    type: string;
  };
  target: {
    type: string;
    ref_type: string;
    ref_name: string;
    commit: {
      hash: string;
      type: string;
    };
  };
  creator: {
    display_name: string;
    uuid: string;
  };
  repository: {
    name: string;
    full_name: string;
    uuid: string;
  };
}

export interface PipelineStep {
  uuid: string;
  name: string;
  state: {
    name: string;
    type: string;
  };
  started_on: string;
  completed_on: string | null;
  duration_in_seconds: number;
}

export interface PaginatedResponse<T> {
  values: T[];
  pagelen: number;
  size: number;
  page: number;
  next?: string;
  previous?: string;
}

// Pull Request types
export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  author: {
    display_name: string;
    uuid: string;
    type: string;
  };
  source: {
    branch: {
      name: string;
    };
    repository: {
      full_name: string;
      uuid: string;
      type: string;
    };
    commit?: {
      hash: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
    repository: {
      full_name: string;
      uuid: string;
      type: string;
    };
    commit?: {
      hash: string;
    };
  };
  created_on: string;
  updated_on: string;
  close_source_branch: boolean;
  comment_count: number;
  task_count: number;
  links: Record<string, any>;
  summary?: {
    raw: string;
    html: string;
    markup: string;
  };
  reviewers?: {
    display_name: string;
    uuid: string;
    type: string;
  }[];
  participants?: {
    display_name: string;
    uuid: string;
    type: string;
    role: string;
  }[];
  merge_commit?: {
    hash: string;
  };
}

export interface CreatePullRequestParams {
  title: string;
  source: {
    branch: {
      name: string;
    };
    repository?: {
      full_name: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
    repository?: {
      full_name: string;
    };
  };
  description?: string;
  close_source_branch?: boolean;
  reviewers?: {
    uuid: string;
  }[];
}

export interface UpdatePullRequestParams {
  title?: string;
  description?: string;
  reviewers?: {
    uuid: string;
  }[];
  close_source_branch?: boolean;
}

export interface MergePullRequestParams {
  merge_strategy?: 'merge_commit' | 'squash' | 'fast_forward';
  message?: string;
  close_source_branch?: boolean;
}

/**
 * Bitbucket API client
 */
export class BitbucketClient {
  private auth: BitbucketAuth | undefined;
  
  /**
   * Creates a new BitbucketClient instance
   * 
   * @param auth Optional authentication credentials
   */
  constructor(auth?: BitbucketAuth) {
    this.auth = auth;
  }
  
  /**
   * Creates the authorization header for API requests
   */
  private getAuthHeader(): Record<string, string> {
    if (!this.auth) {
      return {};
    }
    
    const base64Credentials = btoa(`${this.auth.username}:${this.auth.password}`);
    return {
      Authorization: `Basic ${base64Credentials}`
    };
  }
  
  /**
   * Makes an authenticated request to the Bitbucket API
   * 
   * @param endpoint API endpoint (without the base URL)
   * @param options Fetch options
   * @returns Response data
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BITBUCKET_API_BASE_URL}${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
    };
    
    // Merge with any headers from options
    if (options.headers) {
      const optionHeaders = options.headers as Record<string, string>;
      Object.assign(requestHeaders, optionHeaders);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: requestHeaders
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Bitbucket API error: ${response.status} ${response.statusText}, ${JSON.stringify(errorData)}`);
    }
    
    return response.json() as Promise<T>;
  }
  
  /**
   * Gets repositories for the authenticated user
   * 
   * @param options Query parameters
   * @returns Paginated list of repositories
   */
  async getRepositories(options: { 
    role?: 'owner' | 'admin' | 'contributor' | 'member', 
    page?: number, 
    pagelen?: number 
  } = {}): Promise<PaginatedResponse<Repository>> {
    const params = new URLSearchParams();
    
    if (options.role) params.append('role', options.role);
    if (options.page) params.append('page', options.page.toString());
    if (options.pagelen) params.append('pagelen', options.pagelen.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<PaginatedResponse<Repository>>(`/repositories${queryString}`);
  }
  
  /**
   * Gets a specific repository by workspace and repo slug
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @returns Repository details
   */
  async getRepository(workspace: string, repoSlug: string): Promise<Repository> {
    return this.request<Repository>(`/repositories/${workspace}/${repoSlug}`);
  }
  
  /**
   * Gets pipelines for a specific repository
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param options Query parameters
   * @returns Paginated list of pipelines
   */
  async getPipelines(
    workspace: string, 
    repoSlug: string, 
    options: { 
      sort?: string, 
      page?: number, 
      pagelen?: number 
    } = {}
  ): Promise<PaginatedResponse<Pipeline>> {
    const params = new URLSearchParams();
    
    if (options.sort) params.append('sort', options.sort);
    if (options.page) params.append('page', options.page.toString());
    if (options.pagelen) params.append('pagelen', options.pagelen.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<PaginatedResponse<Pipeline>>(`/repositories/${workspace}/${repoSlug}/pipelines${queryString}`);
  }
  
  /**
   * Gets details of a specific pipeline
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param pipelineUuid Pipeline UUID
   * @returns Pipeline details
   */
  async getPipeline(workspace: string, repoSlug: string, pipelineUuid: string): Promise<Pipeline> {
    return this.request<Pipeline>(`/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}`);
  }
  
  /**
   * Gets steps for a specific pipeline
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param pipelineUuid Pipeline UUID
   * @returns Paginated list of pipeline steps
   */
  async getPipelineSteps(
    workspace: string, 
    repoSlug: string, 
    pipelineUuid: string
  ): Promise<PaginatedResponse<PipelineStep>> {
    return this.request<PaginatedResponse<PipelineStep>>(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/steps`
    );
  }

  /**
   * Gets pull requests for a specific repository
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param options Query parameters
   * @returns Paginated list of pull requests
   */
  async getPullRequests(
    workspace: string,
    repoSlug: string,
    options: {
      state?: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED',
      sort?: string,
      page?: number,
      pagelen?: number
    } = {}
  ): Promise<PaginatedResponse<PullRequest>> {
    const params = new URLSearchParams();
    
    if (options.state) params.append('state', options.state);
    if (options.sort) params.append('sort', options.sort);
    if (options.page) params.append('page', options.page.toString());
    if (options.pagelen) params.append('pagelen', options.pagelen.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<PaginatedResponse<PullRequest>>(
      `/repositories/${workspace}/${repoSlug}/pullrequests${queryString}`
    );
  }

  /**
   * Gets a specific pull request
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param pullRequestId Pull request ID
   * @returns Pull request details
   */
  async getPullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`
    );
  }

  /**
   * Creates a new pull request
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param params Pull request creation parameters
   * @returns Created pull request
   */
  async createPullRequest(
    workspace: string,
    repoSlug: string,
    params: CreatePullRequestParams
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests`,
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
  }

  /**
   * Updates a pull request
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param pullRequestId Pull request ID
   * @param params Pull request update parameters
   * @returns Updated pull request
   */
  async updatePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    params: UpdatePullRequestParams
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`,
      {
        method: 'PUT',
        body: JSON.stringify(params)
      }
    );
  }

  /**
   * Merges a pull request
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param pullRequestId Pull request ID
   * @param params Merge parameters
   * @returns Merged pull request
   */
  async mergePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    params: MergePullRequestParams = {}
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/merge`,
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
  }

  /**
   * Declines a pull request
   * 
   * @param workspace Workspace ID (usually username or team name)
   * @param repoSlug Repository slug
   * @param pullRequestId Pull request ID
   * @returns Declined pull request
   */
  async declinePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/decline`,
      {
        method: 'POST'
      }
    );
  }
}

export default BitbucketClient; 