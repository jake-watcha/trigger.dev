import { Trigger } from "@trigger.dev/sdk";
import { issueEvent, octokit } from "@trigger.dev/github";
import { linearClient } from "@trigger.dev/linear";
import { openaiClient, createCompletion } from "@trigger.dev/openai";

import { EntryPoint } from "@trigger.dev/sdk";
import { expressAdapter } from "@trigger.dev/express";
import express from "express";

const app = express();

const entryPoint = new EntryPoint({
  apiKey: process.env.TRIGGER_API_KEY,
  url: "https://infisical.com",
});

new Trigger({
  // ...
}).listen(entryPoint);

app.use(expressAdapter(entryPoint));

await sendEvent(entryPoint, {
  name: "my-event",
  payload: {
    foo: "bar",
  },
});

const githubConnection = new GitHubConnection({
  id: "my-github",
  name: "My Github Connection",
  auth: "oauth",
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
});

const trigger = new Trigger({
  id: "test",
  name: "test",
  io: {
    github: githubConnection,
    linear: linearClient({ id: "my-linear" }),
    openai: openaiClient(),
  },
  on: githubConnection.issueEvent({
    repo: "triggerdotdev/hello-world",
    action: ["opened"], // only fire when an issue is opened
  }),
  run: async (event, ctx, io) => {
    await io.waitFor("Wait for 30 seconds", { seconds: 30 });

    // When an issue is created in github, let's sync it to Linear
    // And then update the github issue with a label called "synced-linear"
    const { issue, repository: repo } = event;

    // Prompt openai to generate a summary of the issue
    const summary = await io.openai.createCompletion(
      "Generate summary",
      async (task) =>
        io.openai.createCompletion(task, {
          prompt: `Issue: ${issue.title}\n\n${issue.body}\n\nSummary:`,
          model: "davinci:2020-05-03",
        })
    );

    await io.linear("Create linear issue", async (task) => {});

    const linearIssue = await io.linear("Create issue", async (linear, key) =>
      linear
        .createIssue({
          teamId: ctx.env.LINEAR_TEAM_ID,
          title: issue.title,
          description: `Original Issue: ${issue.body}, Summary: ${summary}`,
        })
        .then((res) => res.issue)
    );

    if (linearIssue) {
      await ctx.logger.info("Created linear issue", { linearIssue });

      // Update github issue with a label
      await io.github("Update issue", async (octokit) =>
        octokit.rest.issues.addLabels({
          owner: repo.owner.login,
          repo: repo.name,
          issue_number: issue.number,
          labels: ["synced-linear"],
        })
      );
    }
  },
});

trigger.listen();
