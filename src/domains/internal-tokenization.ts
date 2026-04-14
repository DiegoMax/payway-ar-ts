import { z } from "zod";

import { RequestValidationError } from "../http/errors.js";
import { PaywayHttpClient } from "../http/payway-http-client.js";
import { routes } from "../http/routes.js";

const internalTokenSchema = z.object({}).passthrough();
const internalTokenResponseSchema = z.object({}).passthrough();

export type InternalTokenizationPayload = z.infer<typeof internalTokenSchema> &
  Record<string, unknown>;
export type InternalTokenizationResponse = z.infer<
  typeof internalTokenResponseSchema
> &
  Record<string, unknown>;

export class InternalTokenizationClient {
  public constructor(private readonly httpClient: PaywayHttpClient) {}

  public async createToken(
    payload: InternalTokenizationPayload,
  ): Promise<InternalTokenizationResponse> {
    return this.perform(
      routes.createInternalToken,
      payload,
      "Payload invalido para internal tokenization",
    );
  }

  public async createCryptogram(
    payload: InternalTokenizationPayload,
  ): Promise<InternalTokenizationResponse> {
    return this.perform(
      routes.createCryptogram,
      payload,
      "Payload invalido para cryptogram",
    );
  }

  private perform(
    route:
      | (typeof routes)["createInternalToken"]
      | (typeof routes)["createCryptogram"],
    payload: InternalTokenizationPayload,
    message: string,
  ): Promise<InternalTokenizationResponse> {
    const parsed = internalTokenSchema.safeParse(payload);
    if (!parsed.success) {
      throw new RequestValidationError(
        message,
        parsed.error.issues,
        parsed.error,
      );
    }

    return this.httpClient.request({
      route,
      body: parsed.data,
      responseSchema: internalTokenResponseSchema,
    });
  }
}
