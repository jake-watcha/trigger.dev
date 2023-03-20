// @ts-nocheck
import type { TriggerEvent } from "@trigger.dev/sdk";
import * as schemas from "./schemas";

// Implements the ITriggerEventSource interface
export class GitHubEventSource {
  constructor(
    private readonly connection: OctokitConnection,
    private readonly repo: string,
    private readonly events: string[]
  ) {}

  async registerWebhook(url: string) {
    const secret = crypto.randomBytes(20).toString("hex");

    const { data } = await this.connection.octokit.repos.createWebhook({
      owner: this.repo.split("/")[0],
      repo: this.repo.split("/")[1],
      events: this.events,
      config: {
        url: url,
        content_type: "json",
        secret,
      },
    });

    return {
      title: `GitHub Webhook for ${this.repo}`,
      subtitle: `Events: ${this.events.join(", ")}`,
      displayProperties: [
        {
          label: "Webhook ID",
          value: data.id,
        },
      ],
      context: {
        webhookId: data.id,
        secret,
      },
    };
  }

  async receiveWebhook(
    request: NormalizedRequest,
    context: Record<string, any>
  ) {
    const githubWebhooks = new Webhooks({
      secret: context.secret,
    });

    if (
      !webhooks.verify(request.body, request.headers["x-hub-signature-256"])
    ) {
      return [];
    }

    const deliveryId = request.headers["x-github-delivery"];
    const hookId = request.headers["x-github-hook-id"];
    const id = md5Hash([hookId, deliveryId].join("-"));
    const event = options.request.headers["x-github-event"];

    return [{ id, payload: options.request.body, event, context }];
  }
}

export function issueEvent(
  connection: OctokitConnection,
  params: {
    repo: string;
    action?: string[];
  }
): TriggerEvent<IssueEvent> {
  return new GitHubEventSource(connection, params.repo, ["issues"]);
}

export function commitCommentEvent(params: {
  repo: string;
}): TriggerEvent<typeof schemas.commitComments.commitCommentEventSchema> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "commit_comment",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
        },
        event: ["commit_comment"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["commit_comment"],
      }),
      manualRegistration: false,
    },
    schema: schemas.commitComments.commitCommentEventSchema,
  };
}

export function issueEvent(params: {
  repo: string;
  action?: string[];
}): TriggerEvent<typeof schemas.issues.issuesEventSchema> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "issues",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
          action: params.action ?? [],
        },
        event: ["issues"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["issues"],
      }),
      manualRegistration: false,
    },
    schema: schemas.issues.issuesEventSchema,
  };
}

export function issueCommentEvent(params: {
  repo: string;
}): TriggerEvent<typeof schemas.issuesComments.issueCommentEventSchema> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "issue_comment",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
        },
        event: ["issue_comment"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["issue_comment"],
      }),
      manualRegistration: false,
    },
    schema: schemas.issuesComments.issueCommentEventSchema,
  };
}

export function pullRequestEvent(params: {
  repo: string;
}): TriggerEvent<typeof schemas.pullRequest.pullRequestEventSchema> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "pull_request",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
        },
        event: ["pull_request"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["pull_request"],
      }),
      manualRegistration: false,
    },
    schema: schemas.pullRequest.pullRequestEventSchema,
  };
}

export function pullRequestCommentEvent(params: {
  repo: string;
}): TriggerEvent<
  typeof schemas.pullRequestComments.pullRequestReviewCommentEventSchema
> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "pull_request_review_comment",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
        },
        event: ["pull_request_review_comment"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["pull_request_review_comment"],
      }),
      manualRegistration: false,
    },
    schema: schemas.pullRequestComments.pullRequestReviewCommentEventSchema,
  };
}

export function pullRequestReviewEvent(params: {
  repo: string;
}): TriggerEvent<
  typeof schemas.pullRequestReviews.pullRequestReviewEventSchema
> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "pull_request_review",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
        },
        event: ["pull_request_review"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["pull_request_review"],
      }),
      manualRegistration: false,
    },
    schema: schemas.pullRequestReviews.pullRequestReviewEventSchema,
  };
}

export function pushEvent(params: {
  repo: string;
}): TriggerEvent<typeof schemas.push.pushEventSchema> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "push",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
        },
        event: ["push"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["push"],
      }),
      manualRegistration: false,
    },
    schema: schemas.push.pushEventSchema,
  };
}

export function newStarEvent(params: {
  repo: string;
}): TriggerEvent<typeof schemas.stars.starCreatedEventSchema> {
  return {
    metadata: {
      type: "WEBHOOK",
      service: "github",
      name: "star",
      filter: {
        service: ["github"],
        payload: {
          repository: {
            full_name: [params.repo],
          },
          action: ["created"],
        },
        event: ["star"],
      },
      source: schemas.WebhookSourceSchema.parse({
        subresource: "repository",
        scopes: ["repo"],
        repo: params.repo,
        events: ["star"],
      }),
      manualRegistration: false,
    },
    schema: schemas.stars.starCreatedEventSchema,
  };
}
