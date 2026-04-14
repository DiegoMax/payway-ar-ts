import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CredentialError,
  PaywayClient,
  RequestValidationError,
  TimeoutError,
} from "../src/index.js";

interface MockFetchCall {
  input: string | URL | Request;
  init?: RequestInit | undefined;
}

const createJsonResponse = (payload: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
    ...init,
  });

const createClient = (
  fetchImpl: typeof fetch,
  credentials?: Partial<
    Record<
      | "privateKey"
      | "publicKey"
      | "formApiKey"
      | "formSite"
      | "xConsumerUsername",
      string | undefined
    >
  >,
) =>
  new PaywayClient({
    environment: "test",
    fetchImpl,
    credentials: {
      privateKey: "private-key",
      publicKey: "public-key",
      formApiKey: "form-api-key",
      formSite: "form-site",
      xConsumerUsername: "consumer-user",
      ...credentials,
    },
    sourceMetadata: {
      service: "sdk-tests",
      developer: "diegomax",
      grouper: "walter",
    },
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PaywayClient", () => {
  it("envia healthcheck a api/v2 con private key y X-Source", async () => {
    const calls: MockFetchCall[] = [];
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      calls.push({ input, init });
      return createJsonResponse({ status: "ok" });
    });

    const client = createClient(fetchMock);
    const response = await client.health.getStatus();

    expect(response.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(calls[0]?.input)).toBe(
      "https://developers.decidir.com/api/v2/healthcheck",
    );
    expect(calls[0]?.init?.method).toBe("GET");

    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("apikey")).toBe("private-key");
    expect(headers.get("x-source")).toBeTruthy();
  });

  it("usa public key para tokenizacion", async () => {
    const calls: MockFetchCall[] = [];
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      calls.push({ input, init });
      return createJsonResponse({ id: "tok_123" });
    });

    const client = createClient(fetchMock);
    await client.tokens.create({
      card_number: "4507990000004905",
      card_expiration_month: "12",
      card_expiration_year: "30",
      security_code: "123",
    });

    const headers = new Headers(calls[0]?.init?.headers);
    expect(String(calls[0]?.input)).toBe(
      "https://developers.decidir.com/api/v2/tokens",
    );
    expect(headers.get("apikey")).toBe("public-key");
  });

  it("usa form api key y form site en checkout validate", async () => {
    const calls: MockFetchCall[] = [];
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      calls.push({ input, init });
      return createJsonResponse({ status: "validated" });
    });

    const client = createClient(fetchMock);
    await client.checkout.validate({ payment: { amount: 1000 } });

    const headers = new Headers(calls[0]?.init?.headers);
    expect(String(calls[0]?.input)).toBe(
      "https://developers.decidir.com/web/validate",
    );
    expect(headers.get("apikey")).toBe("form-api-key");
    expect(headers.get("x-consumer-username")).toBe("form-site");
  });

  it("usa x_consumer_username para 3DS", async () => {
    const calls: MockFetchCall[] = [];
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      calls.push({ input, init });
      return createJsonResponse({ status: "pending" });
    });

    const client = createClient(fetchMock);
    await client.threeDS.createInstruction({ three_ds_server_trans_id: "abc" });

    const headers = new Headers(calls[0]?.init?.headers);
    expect(String(calls[0]?.input)).toBe(
      "https://developers.decidir.com/api/v2/threeds/instruction",
    );
    expect(headers.get("apikey")).toBe("private-key");
    expect(headers.get("x-consumer-username")).toBe("consumer-user");
  });

  it("normaliza 204 como status success al eliminar refunds", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 204 }),
    );

    const client = createClient(fetchMock);
    const response = await client.payments.deleteRefund("574671", "164");

    expect(response.status).toBe("success");
  });

  it("valida payloads de pago antes de llamar a la API", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createClient(fetchMock as typeof fetch);

    await expect(
      client.payments.create({
        payment_method_id: 1,
        amount: 1000,
        currency: "ARS",
      } as never),
    ).rejects.toBeInstanceOf(RequestValidationError);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falla si falta una credencial requerida", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      createJsonResponse({ status: "ok" }),
    );
    const client = createClient(fetchMock, { publicKey: undefined });

    await expect(
      client.tokens.create({
        card_number: "4507990000004905",
        card_expiration_month: "12",
        card_expiration_year: "30",
        security_code: "123",
      }),
    ).rejects.toBeInstanceOf(CredentialError);
  });

  it("aborta por timeout usando AbortController", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      (async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })) as typeof fetch,
    );

    const client = new PaywayClient({
      environment: "test",
      fetchImpl: fetchMock,
      timeoutMs: 10,
      credentials: {
        privateKey: "private-key",
      },
    });

    await expect(client.health.getStatus()).rejects.toBeInstanceOf(
      TimeoutError,
    );
  });
});
