import { z } from "zod";

import { RequestValidationError } from "../http/errors.js";
import { PaywayHttpClient } from "../http/payway-http-client.js";
import { routes } from "../http/routes.js";
import { identifierSchema } from "../schemas/common.js";

const tokenRequestSchema = z
  .object({
    card_number: z.string().min(1).optional(),
    card_expiration_month: z.string().min(1).optional(),
    card_expiration_year: z.string().min(1).optional(),
    security_code: z.string().min(1).optional(),
    card_holder_name: z.string().min(1).optional(),
    card_holder_identification: z.object({}).passthrough().optional(),
  })
  .passthrough();

const tokenResponseSchema = z
  .object({
    id: z.string().optional(),
    token: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export type TokenRequest = z.infer<typeof tokenRequestSchema> &
  Record<string, unknown>;
export type TokenResponse = z.infer<typeof tokenResponseSchema> &
  Record<string, unknown>;

export class TokensClient {
  public constructor(private readonly httpClient: PaywayHttpClient) {}

  public async create(payload: TokenRequest): Promise<TokenResponse> {
    return this.httpClient.request({
      route: routes.createToken,
      body: this.parseInput(
        tokenRequestSchema,
        payload,
        "Payload invalido para tokenizacion",
      ),
      responseSchema: tokenResponseSchema,
    });
  }

  public createWithCybersource(payload: TokenRequest): Promise<TokenResponse> {
    return this.create(payload);
  }

  public async listCards(
    userId: string | number,
    query: Record<string, string | number | boolean> = {},
  ): Promise<TokenResponse> {
    const parsedUserId = String(
      this.parseInput(identifierSchema, userId, "userId invalido"),
    );
    return this.httpClient.request({
      route: routes.listCards(parsedUserId),
      query,
      responseSchema: tokenResponseSchema,
    });
  }

  public async deleteCard(
    cardToken: string | number,
    payload: Record<string, unknown> = {},
  ): Promise<TokenResponse> {
    const parsedCardToken = String(
      this.parseInput(identifierSchema, cardToken, "cardToken invalido"),
    );
    return this.httpClient.request({
      route: routes.deleteCard(parsedCardToken),
      body: payload,
      responseSchema: tokenResponseSchema,
    });
  }

  private parseInput<T>(
    schema: z.ZodType<T>,
    payload: unknown,
    message: string,
  ): T {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new RequestValidationError(
        message,
        parsed.error.issues,
        parsed.error,
      );
    }

    return parsed.data;
  }
}
