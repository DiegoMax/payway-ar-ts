import { ZodType } from "zod";

import {
  clientConfigSchema,
  type ClientConfig,
  type ClientConfigInput,
  type Credentials,
  type Environment,
  type SourceMetadata,
} from "../schemas/common.js";
import {
  ApiError,
  CredentialError,
  RequestValidationError,
  ResponseValidationError,
  TimeoutError,
  TransportError,
} from "./errors.js";
import type { CredentialKey, RouteDefinition, RouteScope } from "./routes.js";

const baseUrls: Record<Environment, string> = {
  desa: "http://decidir.payway-dev.tanzu.intra",
  test: "https://developers.decidir.com",
  qa: "http://decidir.payway-qa.tanzu.intra",
  prod: "https://ventasonline.payway.com.ar",
};

const scopePrefixes: Record<RouteScope, string> = {
  "api-v1": "/api/v1",
  "api-v2": "/api/v2",
  web: "/web",
};

export interface RequestOptions<TResponse> {
  readonly route: RouteDefinition;
  readonly body?: unknown;
  readonly query?: Record<string, string | number | boolean>;
  readonly responseSchema?: ZodType<TResponse>;
  readonly signal?: AbortSignal;
}

export interface PaywayHttpClientOptions extends ClientConfig {
  readonly fetchImpl?: typeof fetch;
}

export class PaywayHttpClient {
  private readonly config: ClientConfig;
  private readonly fetchImpl: typeof fetch;

  public constructor(
    config: ClientConfigInput & { readonly fetchImpl?: typeof fetch },
  ) {
    const { fetchImpl, ...configInput } = config;
    const parsedConfig = clientConfigSchema.safeParse(configInput);
    if (!parsedConfig.success) {
      throw new RequestValidationError(
        "Configuracion invalida del cliente Payway",
        parsedConfig.error.issues,
        parsedConfig.error,
      );
    }

    this.fetchImpl = fetchImpl ?? fetch;
    this.config = {
      ...parsedConfig.data,
      timeoutMs: parsedConfig.data.timeoutMs ?? 30_000,
      sourceMetadata: {
        service:
          parsedConfig.data.sourceMetadata?.service ?? "@diegomax/payway-ar-ts",
        developer: parsedConfig.data.sourceMetadata?.developer,
        grouper: parsedConfig.data.sourceMetadata?.grouper,
      },
    };
  }

  public get environment(): Environment {
    return this.config.environment;
  }

  public async request<TResponse>({
    route,
    body,
    query,
    responseSchema,
    signal,
  }: RequestOptions<TResponse>): Promise<TResponse> {
    const headers = this.buildHeaders(
      route.credential,
      route.consumerHeaderSource,
    );
    const url = this.buildUrl(route.scope, route.path, query);
    const { combinedSignal, cleanup, didTimeout } = this.createSignal(signal);

    try {
      const requestInit: RequestInit = {
        method: route.method,
        headers,
        signal: combinedSignal,
      };

      if (route.method !== "GET" && body !== undefined) {
        requestInit.body = JSON.stringify(body);
      }

      const response = await this.fetchImpl(url, requestInit);

      const payload = await this.parseResponse(response);

      if (!response.ok || this.hasApiError(payload)) {
        throw new ApiError(
          `La API de Payway respondio con error para ${route.method} ${route.path}`,
          response.status,
          payload,
        );
      }

      if (!responseSchema) {
        return payload as TResponse;
      }

      const parsedResponse = responseSchema.safeParse(payload);
      if (!parsedResponse.success) {
        throw new ResponseValidationError(
          `La respuesta de Payway no coincide con el esquema esperado para ${route.path}`,
          parsedResponse.error.issues,
          payload,
          parsedResponse.error,
        );
      }

      return parsedResponse.data;
    } catch (error) {
      if (didTimeout()) {
        throw new TimeoutError(
          `Timeout al invocar ${route.method} ${route.path}`,
          this.config.timeoutMs ?? 30_000,
          error,
        );
      }

      if (
        error instanceof ApiError ||
        error instanceof ResponseValidationError ||
        error instanceof CredentialError
      ) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new TransportError(
          `La request ${route.method} ${route.path} fue abortada`,
          error,
        );
      }

      throw new TransportError(
        `Fallo la request ${route.method} ${route.path}`,
        error,
      );
    } finally {
      cleanup();
    }
  }

  private buildUrl(
    scope: RouteScope,
    path: string,
    query?: Record<string, string | number | boolean>,
  ): string {
    const baseUrl = this.config.baseUrl ?? baseUrls[this.config.environment];
    const url = new URL(`${scopePrefixes[scope]}/${path}`, baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  private buildHeaders(
    credentialKey: CredentialKey,
    consumerHeaderSource?: "xConsumerUsername" | "formSite",
  ): Headers {
    const headers = new Headers({
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "X-Source": this.encodeSourceMetadata(this.config.sourceMetadata),
    });

    const credential = this.getCredential(
      this.config.credentials,
      credentialKey,
    );
    headers.set("apikey", credential);

    if (consumerHeaderSource) {
      const consumerValue = this.getCredential(
        this.config.credentials,
        consumerHeaderSource,
      );
      headers.set("X-Consumer-Username", consumerValue);
    }

    return headers;
  }

  private getCredential(
    credentials: Credentials,
    key: CredentialKey | "xConsumerUsername" | "formSite",
  ): string {
    const value = credentials[key];
    if (!value) {
      throw new CredentialError(`Falta la credencial requerida: ${key}`);
    }

    return value;
  }

  private encodeSourceMetadata(metadata: SourceMetadata | undefined): string {
    const payload = JSON.stringify({
      service: metadata?.service ?? "@diegomax/payway-ar-ts",
      developer: metadata?.developer ?? "",
      grouper: metadata?.grouper ?? "",
    });

    return Buffer.from(payload, "utf8").toString("base64");
  }

  private async parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return { status: "success" };
    }

    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { raw: text };
    }
  }

  private hasApiError(payload: unknown): payload is Record<string, unknown> {
    return (
      typeof payload === "object" && payload !== null && "error_type" in payload
    );
  }

  private createSignal(externalSignal?: AbortSignal): {
    combinedSignal: AbortSignal;
    cleanup: () => void;
    didTimeout: () => boolean;
  } {
    const timeoutController = new AbortController();
    let timeoutTriggered = false;
    const timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      timeoutController.abort();
    }, this.config.timeoutMs ?? 30_000);

    const combinedSignal = externalSignal
      ? AbortSignal.any([externalSignal, timeoutController.signal])
      : timeoutController.signal;

    return {
      combinedSignal,
      cleanup: () => clearTimeout(timeoutId),
      didTimeout: () => timeoutTriggered,
    };
  }
}
