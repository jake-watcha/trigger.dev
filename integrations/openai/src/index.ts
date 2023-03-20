import type { IODefinition } from "@trigger.dev/sdk";
import { makeIOConnection } from "@trigger.dev/sdk";
import { IOTask } from "@trigger.dev/sdk/types";
import { Configuration, OpenAIApi } from "openai";

export type ConnectionParams = {
  apiKey: string;
};

export const apiKey = makeIOConnection<ConnectionParams>({
  service: "openai",
  auth: "apiKey",
});

export const openaiClient = (): IODefinition<
  ConnectionParams,
  InstanceType<typeof OpenAIApi>
> => {
  return apiKey(({ apiKey }) => {
    return new OpenAIApi(new Configuration({ apiKey }));
  });
};

export async function createCompletion(
  openai: OpenAIApi,
  task: IOTask,
  params: {
    prompt: string;
    model: string;
  }
) {
  task.title = "Create Completion";
  task.params = params;

  const response = await openai.createCompletion(params);

  if (response.status !== 200) {
    task.status = "failed";
    task.error = response.statusText;
    task.retry = [429, 500].includes(response.status);

    throw task;
  }

  return response.data.choices[0].text;
}
