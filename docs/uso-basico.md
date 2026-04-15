# Uso basico

## Crear el cliente

```ts
import { PaywayClient } from "@diegomax/payway-ar-ts";

const client = new PaywayClient({
  environment: "test",
  credentials: {
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
    publicKey: process.env.PAYWAY_PUBLIC_KEY,
  },
});
```

## Verificar conectividad

```ts
const health = await client.health.getStatus();
console.log(health.status);
```

## Crear un pago

```ts
const payment = await client.payments.create({
  site_transaction_id: "order-1001",
  payment_method_id: 1,
  token: "sample-token",
  bin: "450799",
  amount: 125045,
  currency: "ARS",
  installments: 1,
  description: "Compra de prueba",
  payment_type: "single",
});
```

## Obtener una operacion

```ts
const paymentInfo = await client.payments.get("574421", {
  expand: "card_data",
});
```

## Pagos offline

```ts
const offlinePayment = await client.payments.createOffline({
  site_transaction_id: "offline-pf-1001",
  token: "92a95793-3321-447c-8795-8aeb8a8ac067",
  payment_method_id: 25,
  amount: 1000,
  currency: "ARS",
  payment_type: "single",
  email: "user@mail.com",
  invoice_expiration: "191123",
  cod_p3: "12",
  cod_p4: "134",
  client: "12345678",
  surcharge: 1001,
  payment_mode: "offline",
});
```

Guarda `site_transaction_id`, `id` u `operation_id` y el estado inicial para poder seguir la operacion despues.

## Consultar estado de un pago offline

```ts
const operationId = String(offlinePayment.operation_id ?? offlinePayment.id);
const paymentInfo = await client.payments.get(operationId);

console.log(paymentInfo.status);
console.log(paymentInfo.status_details);
```

La referencia disponible no documenta un webhook especifico para confirmacion de pagos offline, por lo que el enfoque recomendado es consultar estado por API.

## Realizar un refund

```ts
await client.payments.refund("574671", {});
await client.payments.partialRefund("574673", { amount: 5000 });
```

## Trabajar con tokens

```ts
const token = await client.tokens.create({
  card_number: "4507990000004905",
  card_expiration_month: "12",
  card_expiration_year: "30",
  security_code: "123",
});

const cards = await client.tokens.listCards("cliente-123");
```

## Timeouts

```ts
const client = new PaywayClient({
  environment: "test",
  timeoutMs: 15000,
  credentials: {
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
  },
});
```

Si una request supera el tiempo configurado, la libreria lanza `TimeoutError`.

Para una guia enfocada en medios offline, cupones y seguimiento de estado, ver [docs/pagos-offline.md](docs/pagos-offline.md).
