import { z } from "zod";

export const environmentSchema = z.enum(["desa", "test", "qa", "prod"]);

export const credentialsSchema = z
  .object({
    privateKey: z.string().min(1).optional(),
    publicKey: z.string().min(1).optional(),
    formApiKey: z.string().min(1).optional(),
    formSite: z.string().min(1).optional(),
    xConsumerUsername: z.string().min(1).optional(),
  })
  .strict();

export const sourceMetadataSchema = z
  .object({
    service: z.string().min(1).default("@diegomax/payway-ar-ts"),
    grouper: z.string().optional(),
    developer: z.string().optional(),
  })
  .strict();

export const clientConfigSchema = z
  .object({
    environment: environmentSchema,
    credentials: credentialsSchema,
    timeoutMs: z.number().int().positive().max(120_000).optional(),
    sourceMetadata: sourceMetadataSchema.optional(),
    baseUrl: z.string().url().optional(),
  })
  .strict();

export const identifierSchema = z.union([
  z.string().min(1),
  z.number().int().nonnegative(),
]);

export const amountSchema = z.number().int().nonnegative();

export const primitiveQueryValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export type Environment = z.infer<typeof environmentSchema>;
export type Credentials = z.infer<typeof credentialsSchema>;
export type ClientConfigInput = z.input<typeof clientConfigSchema>;
export type ClientConfig = z.infer<typeof clientConfigSchema>;
export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;
