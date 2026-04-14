import { z } from "zod";

import { PaywayHttpClient } from "../http/payway-http-client.js";
import { routes } from "../http/routes.js";
import {
  paymentCaptureRequestSchema,
  paymentIdentifierSchema,
  paymentInfoQuerySchema,
  paymentListQuerySchema,
  paymentListResponseSchema,
  paymentRequestSchema,
  paymentResponseSchema,
  partialRefundRequestSchema,
  refundIdentifierSchema,
  refundRequestSchema,
  offlinePaymentRequestSchema,
  type OfflinePaymentRequest,
  type PartialRefundRequest,
  type PaymentCaptureRequest,
  type PaymentListQuery,
  type PaymentListResponse,
  type PaymentRequest,
  type PaymentResponse,
  type RefundRequest,
} from "../schemas/payments.js";
import { RequestValidationError } from "../http/errors.js";

const rawObjectSchema = z.object({}).passthrough();

export interface PaymentInfoRequestBody extends Record<string, unknown> {}

export class PaymentsClient {
  public constructor(private readonly httpClient: PaywayHttpClient) {}

  public async create(payload: PaymentRequest): Promise<PaymentResponse> {
    return this.httpClient.request({
      route: routes.createPayment,
      body: this.parseInput(
        paymentRequestSchema,
        payload,
        "Payload invalido para crear un pago",
      ),
      responseSchema: paymentResponseSchema,
    });
  }

  public async createOffline(
    payload: OfflinePaymentRequest,
  ): Promise<PaymentResponse> {
    return this.httpClient.request({
      route: routes.createPayment,
      body: this.parseInput(
        offlinePaymentRequestSchema,
        payload,
        "Payload invalido para crear un pago offline",
      ),
      responseSchema: paymentResponseSchema,
    });
  }

  public async capture(
    operationId: string | number,
    payload: PaymentCaptureRequest,
  ): Promise<PaymentResponse> {
    const operation = String(
      this.parseInput(
        paymentIdentifierSchema,
        operationId,
        "operationId invalido",
      ),
    );
    return this.httpClient.request({
      route: routes.capturePayment(operation),
      body: this.parseInput(
        paymentCaptureRequestSchema,
        payload,
        "Payload invalido para capturar un pago",
      ),
      responseSchema: paymentResponseSchema,
    });
  }

  public async list(
    query: PaymentListQuery = {},
  ): Promise<PaymentListResponse> {
    return this.httpClient.request({
      route: routes.listPayments,
      query: this.parseInput(
        paymentListQuerySchema,
        query,
        "Query invalida para listar pagos",
      ),
      responseSchema: paymentListResponseSchema,
    });
  }

  public async get(
    operationId: string | number,
    query?: Record<string, string | number | boolean>,
  ): Promise<PaymentResponse> {
    const operation = String(
      this.parseInput(
        paymentIdentifierSchema,
        operationId,
        "operationId invalido",
      ),
    );
    const parsedQuery = this.parseInput(
      paymentInfoQuerySchema,
      query,
      "Query invalida para obtener un pago",
    );
    return this.httpClient.request({
      route: routes.getPayment(operation),
      ...(parsedQuery ? { query: parsedQuery } : {}),
      responseSchema: paymentResponseSchema,
    });
  }

  public async refund(
    operationId: string | number,
    payload: RefundRequest = {},
  ): Promise<PaymentResponse> {
    const operation = String(
      this.parseInput(
        paymentIdentifierSchema,
        operationId,
        "operationId invalido",
      ),
    );
    return this.httpClient.request({
      route: routes.createRefund(operation),
      body: this.parseInput(
        refundRequestSchema,
        payload,
        "Payload invalido para refund total",
      ),
      responseSchema: paymentResponseSchema,
    });
  }

  public async partialRefund(
    operationId: string | number,
    payload: PartialRefundRequest,
  ): Promise<PaymentResponse> {
    const operation = String(
      this.parseInput(
        paymentIdentifierSchema,
        operationId,
        "operationId invalido",
      ),
    );
    return this.httpClient.request({
      route: routes.createRefund(operation),
      body: this.parseInput(
        partialRefundRequestSchema,
        payload,
        "Payload invalido para refund parcial",
      ),
      responseSchema: paymentResponseSchema,
    });
  }

  public async deleteRefund(
    operationId: string | number,
    refundId: string | number,
    payload: RefundRequest = {},
  ): Promise<PaymentResponse> {
    const operation = String(
      this.parseInput(
        paymentIdentifierSchema,
        operationId,
        "operationId invalido",
      ),
    );
    const refund = String(
      this.parseInput(refundIdentifierSchema, refundId, "refundId invalido"),
    );
    return this.httpClient.request({
      route: routes.deleteRefund(operation, refund),
      body: this.parseInput(
        refundRequestSchema,
        payload,
        "Payload invalido para anular refund",
      ),
      responseSchema: paymentResponseSchema,
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
