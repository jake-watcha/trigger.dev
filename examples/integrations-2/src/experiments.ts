import { Octokit } from "octokit";
import axios from "axios";
import { initUntypeable, createTypeLevelClient } from "untypeable";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import Stripe from "stripe";

import {
  GetResponseTypeFromEndpointMethod,
  GetResponseDataTypeFromEndpointMethod,
} from "@octokit/types";

const u = initUntypeable();

type User = {
  id: string;
  name: string;
};

// Create a router
// - Add typed inputs and outputs
const router = u.router({
  "/user": u.input<{ id: string }>().output<User>(),
});

type IOAction<TService, TParams, TResponseType> = {
  name: string;
  run: (
    service: TService,
    params: TParams,
    idempotencyKey: string,
    abortSignal: AbortSignal
  ) => Promise<TResponseType>;
};

type IOActions = Record<string, IOAction<any, any, any>>;

type IODefinition<
  TCallbackArgs,
  TReturnType,
  TActions extends 
> = {
  service: string;
  auth: string;
  io: (args: TCallbackArgs) => TReturnType;
  actions?: TActions;
};

type IODefinitionFunction<TCallbackArgs> = <TReturnType, TActions extends IOActions>(
  callback: (args: TCallbackArgs, actions?: TActions) => TReturnType
) => IODefinition<TCallbackArgs, TReturnType, TActions>;

const createRepoInOrg: IOAction<
  InstanceType<typeof Octokit>,
  { org: string; name: string },
  CreateRepoResponse
> = {
  name: "Create repo in org",
  run: async (service, params, idempotencyKey, abortSignal) => {
    const response = await service.rest.repos.createInOrg({
      org: params.org,
      name: params.name,
    });

    return response.data;
  },
};

const githubActions = {
  createRepoInOrg
}

// I only want to specify the type of the first argument to the callback, in this case { token: string }
const githubOAuth: IODefinitionFunction<{ token: string; baseUrl?: string }> = (
  callback
) => {
  return {
    service: "github",
    auth: "oauth",
    io: callback,
  };
};

const stripeAuth: IODefinitionFunction<{ apiKey: string }> = (callback) => {
  return {
    service: "stripe",
    auth: "apiKey",
    io: callback,
  };
};

const apiKeyService: IODefinitionFunction<{
  apiKey: string;
  baseUrl?: string;
}> = (callback) => {
  return {
    service: "generic",
    auth: "apiKey",
    io: callback,
  };
};

const aws: IODefinitionFunction<{
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

export type IOMap<T extends Record<string, IODefinition<any, any>>> = {
  [K in keyof T]: <R>(
    key: string,
    io: (
      service: ReturnType<T[K]["io"]>,
      idempotencyKey: string,
      abortSignal: AbortSignal
    ) => R
  ) => R;
};

type TriggerOptions<TIO extends Record<string, IODefinition<any, any>>> = {
  id: string;
  io: TIO; // Not sure what is supposed to go here

  run: (io: IOMap<TIO>) => Promise<any>;
};

class Trigger<TIO extends Record<string, IODefinition<any, any>>> {
  options: TriggerOptions<TIO>;

  constructor(options: TriggerOptions<TIO>) {
    this.options = options;
  }

  async listen() {
    // const io = {} as any;
    // // Build the io map, and wrap the result of the callback function in a Proxy
    // for (const [key, value] of Object.entries(this.options.io)) {
    //   io[key] = (key: string) => value.io({ token: "ghp_1234" });
    // }
    // await this.options.run(io);
  }
}

type CreateRepoResponse = GetResponseDataTypeFromEndpointMethod<
  InstanceType<typeof Octokit>["rest"]["repos"]["createInOrg"]
>;

const octokit = githubOAuth(
  ({ token, baseUrl }) => {
    return new Octokit({ auth: token, baseUrl });
  },
  githubActions
);


const trigger = new Trigger({
  id: "test",
  io: {
    github: githubOAuth(({ token, baseUrl }) => {
      return new Octokit({ auth: token, baseUrl });
    }),
    githubFetch: githubOAuth(({ token, baseUrl }) => {
      return (path: string) =>
        fetch(`${baseUrl ? baseUrl : "https://api.github.com"}${path}`, {
          headers: {
            Authorization: `token ${token}`,
          },
        });
    }),
    githubAxios: githubOAuth(({ token, baseUrl }) => {
      return axios.create({
        baseURL: baseUrl ? baseUrl : "https://api.github.com",
        headers: {
          Authorization: `token ${token}`,
        },
      });
    }),
    userService: apiKeyService(({ apiKey, baseUrl }) => {
      return createTypeLevelClient<typeof router>((path, input) => {
        return fetch(baseUrl + path + `?${new URLSearchParams(input)}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }).then((res) => res.json());
      });
    }),
    s3: aws(({ accessKeyId, secretAccessKey, sessionToken, region }) => {
      return new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
        region: region ?? "us-east-1",
      });
    }),
    mainStripe: stripeAuth(({ apiKey }) => {
      return new Stripe(apiKey, { apiVersion: "2022-11-15", typescript: true });
    }),
    internalStripe: stripeAuth(({ apiKey }) => {
      return new Stripe(apiKey, { apiVersion: "2022-11-15", typescript: true });
    }),
  },
  run: async (io) => {
    const customer = await io.mainStripe("Create Customer", (stripe, key) =>
      stripe.customers.create(
        {
          email: "eric@trigger.dev",
        },
        {
          idempotencyKey: key,
        }
      )
    );

    const subscriptions = await io.internalStripe(
      "List Subscriptions",
      (stripe) =>
        stripe.subscriptions.list({
          collection_method: "charge_automatically",
        })
    );

    const helloResponse = await io.s3("Get Object", (s3) =>
      s3.send(
        new GetObjectCommand({
          Bucket: "my-bucket",
          Key: "hello.png",
        })
      )
    );

    // PUT is idempotent, so we can use the same key for multiple calls
    const worldResponse = await io.s3("Put Object", (s3) =>
      s3.send(
        new PutObjectCommand({
          Bucket: "my-bucket",
          Key: "world.png",
          Body: Buffer.from("world"),
        })
      )
    );

    const newUserResponse = await io.userService(
      "Create User",
      (service, key) => service("/user", { id: "1234" })
    );

    // "Create Issue" is the unique key for this call, and allows us to make
    // idempotent calls to the GitHub API, even while using Octokit
    const response = await io.github("Create Issue", (octokit, key) =>
      octokit.rest.issues.create({
        owner: "octocat",
        repo: "hello-world",
        title: "Hello world!",
      })
    );

    // Takes full advantage of the Octokit pagination API
    const paginatedReponse = await io.github("Get Issues", (octokit, key) => {
      return octokit.paginate(octokit.rest.issues.listForRepo, {
        owner: "octocat",
        repo: "hello-world",
      });
    });

    // Or you can just use the fetch API directly
    const fetchResponse = await io.githubFetch(
      "Get Users in org",
      (fetch, key) => fetch("/orgs/octokit/members")
    );

    // Or use axios
    const axiosResponse = await io.githubAxios(
      "Get Users in org",
      (axios, key) => axios.get("/orgs/octokit/members")
    );
  },
});

trigger.listen();
