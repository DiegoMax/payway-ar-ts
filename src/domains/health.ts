import { z } from "zod";

import { PaywayHttpClient } from "../http/payway-http-client.js";
import { routes } from "../http/routes.js";

export const healthResponseSchema = z
  .object({
    status: z.string().optional(),
  })
  .passthrough();

export type HealthStatusResponse = z.infer<typeof healthResponseSchema> &
  Record<string, unknown>;

export class HealthClient {
  public constructor(private readonly httpClient: PaywayHttpClient) {}

  public getStatus(): Promise<HealthStatusResponse> {
    return this.httpClient.request({
      route: routes.healthcheck,
      responseSchema: healthResponseSchema,
    });
  }
}
