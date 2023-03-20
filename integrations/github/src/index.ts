import { IODefinition, makeIOConnection } from "@trigger.dev/sdk";
import { IOTask } from "@trigger.dev/sdk/types";
import { Octokit } from "octokit";

export * from "./events";

export type ConnectionParams = {
  token: string;
  baseUrl?: string;
};

export const oauth = makeIOConnection<ConnectionParams>({
  service: "github",
  auth: "oauth2",
});

export const personalAccessToken = makeIOConnection<ConnectionParams>({
  service: "github",
  auth: "accessToken",
});

export const unauthenticated = makeIOConnection<{ baseUrl?: string }>({
  service: "github",
  auth: "none",
});

export type OctokitOptions = {
  auth: "oauth" | "token" | "unauthenticated";
};

export const octokit = (
  params: OctokitOptions
): IODefinition<ConnectionParams, InstanceType<typeof Octokit>> => {
  switch (params.auth) {
    case "oauth": {
      return oauth(({ token, baseUrl }, { abortSignal }) => {
        return new Octokit({
          auth: token,
          baseUrl,
          request: {
            signal: abortSignal,
          },
        });
      });
    }
    case "token": {
      return personalAccessToken(({ token, baseUrl }, { abortSignal }) => {
        return new Octokit({
          auth: token,
          baseUrl,
          request: {
            signal: abortSignal,
          },
        });
      });
    }
    case "unauthenticated": {
      return unauthenticated(({ baseUrl }, { abortSignal }) => {
        return new Octokit({
          baseUrl,
          request: {
            signal: abortSignal,
          },
        });
      });
    }
  }
};

export async function getLatestCommit(
  octokit: Octokit,
  task: IOTask,
  params: {
    owner: string;
    repo: string;
    branch: string;
  }
) {
  task.title = "Get Latest Commit SHA";
  task.params = params;

  const response = await octokit.rest.repos.getCommit({
    owner: params.owner,
    repo: params.repo,
    ref: params.branch,
  });

  return response.data.commit;
}

export async function createTree(
  octokit: Octokit,
  task: IOTask,
  params: {
    owner: string;
    repo: string;
    baseTree: string;
    files: {
      path: string;
      content: string;
    }[];
  }
) {
  task.title = "Create Tree";
  task.params = params;

  const response = await octokit.rest.git.createTree({
    owner: params.owner,
    repo: params.repo,
    base_tree: params.baseTree,
    tree: params.files.map((file) => ({
      path: file.path,
      content: file.content,
      mode: "100644",
      type: "blob",
    })),
  });

  return response.data.sha;
}

export async function createCommit(
  octokit: Octokit,
  task: IOTask,
  params: {
    owner: string;
    repo: string;
    branch: string;
    message: string;
    files: {
      path: string;
      content: string;
    }[];
  }
) {
  task.title = "Create Commit";
  task.params = params;

  // Create a subtask to fetch the current commit SHA
  const commit = await task.runTask("Get Commit SHA", (subtask) =>
    getLatestCommit(octokit, subtask, {
      owner: params.owner,
      repo: params.repo,
      branch: params.branch,
    })
  );

  const tree = await task.runTask("Create Tree", (subtask) =>
    createTree(octokit, subtask, {
      owner: params.owner,
      repo: params.repo,
      baseTree: commit.tree.sha,
      files: params.files,
    })
  );

  // All subtasks:
  // Create a tree with the new files
  // Create the new commit
  // Update the branch to point to the new commit
}
