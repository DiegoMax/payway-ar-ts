import { z } from "zod";

import { RequestValidationError } from "../http/errors.js";
import { PaywayHttpClient } from "../http/payway-http-client.js";
import { routes } from "../http/routes.js";

const threeDSRequestSchema = z.object({}).passthrough();
const threeDSResponseSchema = z.object({}).passthrough();

export type ThreeDSRequest = z.infer<typeof threeDSRequestSchema> &
  Record<string, unknown>;
export type ThreeDSResponse = z.infer<typeof threeDSResponseSchema> &
  Record<string, unknown>;

export class ThreeDSClient {
  public constructor(private readonly httpClient: PaywayHttpClient) {}

  public async createInstruction(
    payload: ThreeDSRequest,
  ): Promise<ThreeDSResponse> {
    const parsed = threeDSRequestSchema.safeParse(payload);
    if (!parsed.success) {
      throw new RequestValidationError(
        "Payload invalido para 3DS challenge",
        parsed.error.issues,
        parsed.error,
      );
    }

    return this.httpClient.request({
      route: routes.createThreeDSInstruction,
      body: parsed.data,
      responseSchema: threeDSResponseSchema,
    });
  }
}
