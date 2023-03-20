import type { IODefinitionFunction, IODefinition } from "@trigger.dev/sdk";
import { makeIOConnection } from "@trigger.dev/sdk";
import { LinearClient, LinearClientOptions } from "@linear/sdk";

export type ConnectionParams = {
  apiKey: string;
};

export const apiKey = makeIOConnection<ConnectionParams>({
  service: "linear",
  auth: "apiKey",
});

export type ClientOptions = Omit<
  LinearClientOptions,
  "apiKey" | "accessToken" | "credentials"
>;

export const linearClient = (
  options: ClientOptions = {}
): IODefinition<ConnectionParams, InstanceType<typeof LinearClient>> => {
  return apiKey(({ apiKey }, { abortSignal }) => {
    return new LinearClient({ ...options, apiKey, signal: abortSignal });
  });
};
