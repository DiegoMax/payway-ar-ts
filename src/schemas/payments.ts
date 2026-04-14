import { z } from "zod";

import { amountSchema, identifierSchema } from "./common.js";

export const cybersourceSchema = z
  .object({
    send_to_cs: z.boolean(),
  })
  .passthrough();

export const auth3dsDataSchema = z
  .object({
    device_type: z.string().min(1),
    accept_header: z.string().min(1),
    user_agent: z.string().min(1),
    ip: z.string().min(1),
    java_enabled: z.boolean(),
    language: z.string().min(1),
    color_depth: z.string().min(1),
    screen_height: z.number().int().positive(),
    screen_width: z.number().int().positive(),
    time_zone_offset: z.number().int(),
  })
  .passthrough();

export const tokenCardDataSchema = z
  .object({
    token: z.string().min(1),
    eci: z.string().min(1),
    cryptogram: z.string().min(1),
  })
  .passthrough();

export const subPaymentSchema = z
  .object({
    amount: amountSchema,
  })
  .passthrough();

const paymentRequestBaseSchema = z
  .object({
    site_transaction_id: z.string().min(1),
    payment_method_id: z.number().int().positive(),
    amount: amountSchema,
    currency: z.string().min(1),
    installments: z.number().int().positive().optional(),
    description: z.string().min(1).optional(),
    payment_type: z.enum(["single", "distributed"]).optional(),
    token: z.string().min(1).optional(),
    bin: z.string().min(6).optional(),
    sub_payments: z.array(subPaymentSchema).optional(),
    fraud_detection: cybersourceSchema.optional(),
    cardholder_auth_required: z.boolean().optional(),
    auth_3ds_data: auth3dsDataSchema.optional(),
    is_tokenized_payment: z.boolean().optional(),
    token_card_data: tokenCardDataSchema.optional(),
  })
  .passthrough();

export const paymentRequestSchema = paymentRequestBaseSchema.superRefine(
  (value, context) => {
    if (value.cardholder_auth_required && !value.auth_3ds_data) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "auth_3ds_data es obligatorio cuando cardholder_auth_required es true",
        path: ["auth_3ds_data"],
      });
    }

    if (value.is_tokenized_payment && !value.token_card_data) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "token_card_data es obligatorio cuando is_tokenized_payment es true",
        path: ["token_card_data"],
      });
    }
  },
);

export const offlinePaymentRequestSchema = paymentRequestBaseSchema
  .extend({
    payment_mode: z.literal("offline").optional(),
    email: z.string().email(),
    invoice_expiration: z.string().min(1).optional(),
    second_invoice_expiration: z.string().min(1).optional(),
    bank_id: z.string().min(1).optional(),
    surcharge: amountSchema.optional(),
  })
  .passthrough()
  .superRefine((value, context) => {
    if (value.cardholder_auth_required && !value.auth_3ds_data) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "auth_3ds_data es obligatorio cuando cardholder_auth_required es true",
        path: ["auth_3ds_data"],
      });
    }

    if (value.is_tokenized_payment && !value.token_card_data) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "token_card_data es obligatorio cuando is_tokenized_payment es true",
        path: ["token_card_data"],
      });
    }
  });

export const paymentCaptureRequestSchema = z
  .object({
    amount: amountSchema,
  })
  .passthrough();

export const refundRequestSchema = z.object({}).passthrough();

export const partialRefundRequestSchema = z
  .object({
    amount: amountSchema.optional(),
    sub_payments: z.array(subPaymentSchema).optional(),
  })
  .passthrough();

export const paymentListQuerySchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

export const paymentInfoQuerySchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .optional();

export const paymentIdentifierSchema = identifierSchema;
export const refundIdentifierSchema = identifierSchema;

export const paymentResponseSchema = z
  .object({
    id: identifierSchema.optional(),
    operation_id: identifierSchema.optional(),
    status: z.string().optional(),
    site_transaction_id: z.string().optional(),
  })
  .passthrough();

export const paymentListResponseSchema = z
  .object({
    results: z.array(z.unknown()).optional(),
    total: z.number().int().optional(),
    offset: z.number().int().optional(),
    page_size: z.number().int().optional(),
  })
  .passthrough();

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;
export type OfflinePaymentRequest = z.infer<typeof offlinePaymentRequestSchema>;
export type PaymentCaptureRequest = z.infer<typeof paymentCaptureRequestSchema>;
export type RefundRequest = z.infer<typeof refundRequestSchema>;
export type PartialRefundRequest = z.infer<typeof partialRefundRequestSchema>;
export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema> &
  Record<string, unknown>;
export type PaymentListResponse = z.infer<typeof paymentListResponseSchema> &
  Record<string, unknown>;
