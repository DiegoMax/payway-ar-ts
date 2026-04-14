export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type RouteScope = "api-v1" | "api-v2" | "web";

export type CredentialKey = "privateKey" | "publicKey" | "formApiKey";

export type ConsumerHeaderSource = "xConsumerUsername" | "formSite";

export interface RouteDefinition {
  readonly method: HttpMethod;
  readonly scope: RouteScope;
  readonly path: string;
  readonly credential: CredentialKey;
  readonly consumerHeaderSource?: ConsumerHeaderSource;
}

const defineRoute = (route: RouteDefinition): RouteDefinition => route;

export const routes = {
  healthcheck: defineRoute({
    method: "GET",
    scope: "api-v2",
    path: "healthcheck",
    credential: "privateKey",
  }),
  createPayment: defineRoute({
    method: "POST",
    scope: "api-v2",
    path: "payments",
    credential: "privateKey",
  }),
  capturePayment: (operationId: string): RouteDefinition => ({
    method: "PUT",
    scope: "api-v2",
    path: `payments/${operationId}`,
    credential: "privateKey",
  }),
  listPayments: defineRoute({
    method: "GET",
    scope: "api-v2",
    path: "payments",
    credential: "privateKey",
  }),
  getPayment: (operationId: string): RouteDefinition => ({
    method: "GET",
    scope: "api-v2",
    path: `payments/${operationId}`,
    credential: "privateKey",
  }),
  createRefund: (operationId: string): RouteDefinition => ({
    method: "POST",
    scope: "api-v2",
    path: `payments/${operationId}/refunds`,
    credential: "privateKey",
  }),
  deleteRefund: (operationId: string, refundId: string): RouteDefinition => ({
    method: "DELETE",
    scope: "api-v2",
    path: `payments/${operationId}/refunds/${refundId}`,
    credential: "privateKey",
  }),
  validateCheckout: defineRoute({
    method: "POST",
    scope: "web",
    path: "validate",
    credential: "formApiKey",
    consumerHeaderSource: "formSite",
  }),
  createForm: defineRoute({
    method: "POST",
    scope: "web",
    path: "forms",
    credential: "privateKey",
  }),
  generateCheckoutLink: defineRoute({
    method: "POST",
    scope: "api-v1",
    path: "checkout-payment-button/link",
    credential: "privateKey",
  }),
  createToken: defineRoute({
    method: "POST",
    scope: "api-v2",
    path: "tokens",
    credential: "publicKey",
  }),
  listCards: (userId: string): RouteDefinition => ({
    method: "GET",
    scope: "api-v2",
    path: `usersite/${userId}/cardtokens`,
    credential: "privateKey",
  }),
  deleteCard: (cardToken: string): RouteDefinition => ({
    method: "DELETE",
    scope: "api-v2",
    path: `cardtokens/${cardToken}`,
    credential: "privateKey",
  }),
  createThreeDSInstruction: defineRoute({
    method: "POST",
    scope: "api-v2",
    path: "threeds/instruction",
    credential: "privateKey",
    consumerHeaderSource: "xConsumerUsername",
  }),
  createBatchClosure: defineRoute({
    method: "POST",
    scope: "api-v1",
    path: "closures/batchclosure",
    credential: "privateKey",
  }),
  createInternalToken: defineRoute({
    method: "POST",
    scope: "api-v1",
    path: "transaction_gateway/tokens",
    credential: "privateKey",
  }),
  createCryptogram: defineRoute({
    method: "POST",
    scope: "api-v1",
    path: "transaction_gateway/payments",
    credential: "privateKey",
  }),
} as const;
