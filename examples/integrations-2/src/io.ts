import type { IODefinitionFunction } from "@trigger.dev/sdk";

// I only want to specify the type of the first argument to the callback, in this case { token: string }
export const githubOAuth: IODefinitionFunction<{
  token: string;
  baseUrl?: string;
}> = (callback) => {
  return {
    service: "github",
    auth: "oauth",
    io: callback,
  };
};

export const stripeAuth: IODefinitionFunction<{ apiKey: string }> = (
  callback
) => {
  return {
    service: "stripe",
    auth: "apiKey",
    io: callback,
  };
};

export const apiKeyService: IODefinitionFunction<{
  apiKey: string;
  baseUrl?: string;
}> = (callback) => {
  return {
    service: "generic",
    auth: "apiKey",
    io: callback,
  };
};

export const aws: IODefinitionFunction<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
}> = (callback) => {
  return {
    service: "aws",
    auth: "accessKey",
    io: callback,
  };
};
