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
