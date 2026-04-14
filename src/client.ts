import { BatchClosureClient } from "./domains/batch-closure.js";
import { CheckoutClient } from "./domains/checkout.js";
import { HealthClient } from "./domains/health.js";
import { InternalTokenizationClient } from "./domains/internal-tokenization.js";
import { PaymentsClient } from "./domains/payments.js";
import { ThreeDSClient } from "./domains/three-ds.js";
import { TokensClient } from "./domains/tokens.js";
import { PaywayHttpClient } from "./http/payway-http-client.js";
import type { ClientConfigInput } from "./schemas/common.js";

export interface PaywayClientOptions extends ClientConfigInput {
  readonly fetchImpl?: typeof fetch;
}

export class PaywayClient {
  public readonly health: HealthClient;
  public readonly payments: PaymentsClient;
  public readonly tokens: TokensClient;
  public readonly threeDS: ThreeDSClient;
  public readonly batchClosure: BatchClosureClient;
  public readonly checkout: CheckoutClient;
  public readonly internalTokenization: InternalTokenizationClient;

  private readonly httpClient: PaywayHttpClient;

  public constructor(options: PaywayClientOptions) {
    this.httpClient = new PaywayHttpClient(options);
    this.health = new HealthClient(this.httpClient);
    this.payments = new PaymentsClient(this.httpClient);
    this.tokens = new TokensClient(this.httpClient);
    this.threeDS = new ThreeDSClient(this.httpClient);
    this.batchClosure = new BatchClosureClient(this.httpClient);
    this.checkout = new CheckoutClient(this.httpClient);
    this.internalTokenization = new InternalTokenizationClient(this.httpClient);
  }
}
