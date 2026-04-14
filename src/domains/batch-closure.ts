import { z } from "zod";

import { RequestValidationError } from "../http/errors.js";
import { PaywayHttpClient } from "../http/payway-http-client.js";
import { routes } from "../http/routes.js";

const batchClosureRequestSchema = z.object({}).passthrough();
const batchClosureResponseSchema = z.object({}).passthrough();

export type BatchClosureRequest = z.infer<typeof batchClosureRequestSchema> &
  Record<string, unknown>;
export type BatchClosureResponse = z.infer<typeof batchClosureResponseSchema> &
  Record<string, unknown>;

export class BatchClosureClient {
  public constructor(private readonly httpClient: PaywayHttpClient) {}

  public async create(
    payload: BatchClosureRequest,
  ): Promise<BatchClosureResponse> {
    const parsed = batchClosureRequestSchema.safeParse(payload);
    if (!parsed.success) {
      throw new RequestValidationError(
        "Payload invalido para batch closure",
        parsed.error.issues,
        parsed.error,
      );
    }

    return this.httpClient.request({
      route: routes.createBatchClosure,
      body: parsed.data,
      responseSchema: batchClosureResponseSchema,
    });
  }
}
