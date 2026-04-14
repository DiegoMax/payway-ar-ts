import { z } from "zod";

import { RequestValidationError } from "../http/errors.js";
import { PaywayHttpClient } from "../http/payway-http-client.js";
import { routes } from "../http/routes.js";

const checkoutPayloadSchema = z.object({}).passthrough();
const checkoutResponseSchema = z.object({}).passthrough();

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema> &
  Record<string, unknown>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema> &
  Record<string, unknown>;

export class CheckoutClient {
  public constructor(private readonly httpClient: PaywayHttpClient) {}

  public async validate(payload: CheckoutPayload): Promise<CheckoutResponse> {
    return this.perform(
      routes.validateCheckout,
      payload,
      "Payload invalido para validate",
    );
  }

  public async createForm(payload: CheckoutPayload): Promise<CheckoutResponse> {
    return this.perform(
      routes.createForm,
      payload,
      "Payload invalido para forms",
    );
  }

  public async generateLink(
    payload: CheckoutPayload,
  ): Promise<CheckoutResponse> {
    const enrichedPayload = {
      origin_platform: "@diegomax/payway-ar-ts",
      ...payload,
    };

    return this.perform(
      routes.generateCheckoutLink,
      enrichedPayload,
      "Payload invalido para checkout link",
    );
  }

  private perform(
    route:
      | (typeof routes)["validateCheckout"]
      | (typeof routes)["createForm"]
      | (typeof routes)["generateCheckoutLink"],
    payload: CheckoutPayload,
    message: string,
  ): Promise<CheckoutResponse> {
    const parsed = checkoutPayloadSchema.safeParse(payload);
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
      responseSchema: checkoutResponseSchema,
    });
  }
}
