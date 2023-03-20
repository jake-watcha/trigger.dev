import {
  SerializableCustomEventSchema,
  SerializableJsonSchema,
  SecureString,
} from "@trigger.dev/common-schemas";
import { z } from "zod";

export type { SecureString };

export type TriggerCustomEvent = z.infer<typeof SerializableCustomEventSchema>;

export type WaitForOptions = {
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
};

export type FetchOptions<
  TResponseBodySchema extends z.ZodTypeAny = z.ZodTypeAny
> = {
  method?:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "HEAD"
    | "OPTIONS"
    | "TRACE";
  body?: z.infer<typeof SerializableJsonSchema>;
  headers?: Record<string, string | SecureString>;
  responseSchema?: TResponseBodySchema;
  retry?: {
    enabled?: boolean;
    factor?: number;
    maxTimeout?: number;
    minTimeout?: number;
    maxAttempts?: number;
    statusCodes?: number[];
  };
};

export type FetchResponse<
  TResponseBodySchema extends z.ZodTypeAny = z.ZodTypeAny
> = {
  ok: boolean;
  body?: z.infer<TResponseBodySchema>;
  headers: Record<string, string>;
  status: number;
};

export type TriggerFetch = <TBodySchema extends z.ZodTypeAny = z.ZodTypeAny>(
  key: string,
  url: string | URL,
  options: FetchOptions<TBodySchema>
) => Promise<FetchResponse<TBodySchema>>;

export type TriggerRunOnceCallback = (idempotencyKey: string) => Promise<any>;

export interface TriggerKeyValueStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface TriggerContext {
  id: string;
  environment: string;
  apiKey: string;
  organizationId: string;
  logger: TriggerLogger;
  isTest: boolean;
  sendEvent(key: string, event: TriggerCustomEvent): Promise<void>;
  waitFor(key: string, options: WaitForOptions): Promise<void>;
  waitUntil(key: string, date: Date): Promise<void>;
  runOnce<T extends TriggerRunOnceCallback>(
    key: string,
    callback: T
  ): Promise<Awaited<ReturnType<T>>>;
  runOnceLocalOnly<T extends TriggerRunOnceCallback>(
    key: string,
    callback: T
  ): Promise<Awaited<ReturnType<T>>>;
  fetch: TriggerFetch;
  kv: TriggerKeyValueStorage;
  globalKv: TriggerKeyValueStorage;
  runKv: TriggerKeyValueStorage;
  env: Record<string, string>;
}

export interface TriggerLogger {
  debug(message: string, properties?: Record<string, any>): Promise<void>;
  info(message: string, properties?: Record<string, any>): Promise<void>;
  warn(message: string, properties?: Record<string, any>): Promise<void>;
  error(message: string, properties?: Record<string, any>): Promise<void>;
}

export type IODefinitionConfig = {
  abortSignal: AbortSignal;
};

export type IODefinition<TCallbackArgs, TReturnType> = {
  service: string;
  auth: string;
  io: (args: TCallbackArgs, config: IODefinitionConfig) => TReturnType;
};

export type IOTask = {
  title?: string;
  subtitle?: string;
  params?: Record<string, any>;
  readonly idempotencyKey: string;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  retryCount: number;
  retry?: boolean;
  runTask: <T>(
    id: string,
    callback: (task: IOTask) => Promise<T>
  ) => Promise<T>;
};

export type IODefinitionFunction<TCallbackArgs> = <TReturnType>(
  callback: (args: TCallbackArgs, config: IODefinitionConfig) => TReturnType
) => IODefinition<TCallbackArgs, TReturnType>;

export type IOMap<T extends Record<string, IODefinition<any, any>>> = {
  [K in keyof T]: <R>(
    key: string,
    io: (service: ReturnType<T[K]["io"]>, task: IOTask) => R
  ) => R;
};

export type IODefinitionMap = Record<string, IODefinition<any, any>>;
