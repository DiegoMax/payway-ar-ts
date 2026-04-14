# @diegomax/payway-ar-ts

SDK TypeScript para Payway AR orientado a Node 22+.

Cliente Node moderno para operar con Payway AR usando `fetch` nativo, `AbortController`, validaciones con Zod y tipado estricto en TypeScript.

## Estado

Implementacion inicial en progreso. Esta primera version ya incluye:

- cliente HTTP nativo con timeout por `AbortController`
- configuracion tipada por entorno
- operaciones principales de pagos, refunds, tokens, 3DS, batch closure, healthcheck y checkout
- suite de tests mockeada con Vitest
- documentacion base en espanol

## Instalacion

```bash
npm install @diegomax/payway-ar-ts
```

## Requisitos

- Node 22 o superior
- credenciales de Payway para el ambiente correspondiente

## Configuracion

```ts
import { PaywayClient } from "@diegomax/payway-ar-ts";

const client = new PaywayClient({
  environment: "test",
  timeoutMs: 30000,
  credentials: {
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
    publicKey: process.env.PAYWAY_PUBLIC_KEY,
    formApiKey: process.env.PAYWAY_FORM_API_KEY,
    formSite: process.env.PAYWAY_FORM_SITE,
    xConsumerUsername: process.env.PAYWAY_X_CONSUMER_USERNAME,
  },
  sourceMetadata: {
    service: "mi-backend",
    developer: "mi-equipo",
    grouper: "payments",
  },
});
```

## Credenciales por dominio

- `privateKey`: pagos, refunds, healthcheck, batch closure, checkout server-side e internal tokenization.
- `publicKey`: tokenizacion.
- `formApiKey` y `formSite`: validaciones del flujo checkout.
- `xConsumerUsername`: operaciones 3DS.

## Uso rapido

```ts
import { PaywayClient } from "@diegomax/payway-ar-ts";

const client = new PaywayClient({
  environment: "test",
  credentials: {
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
    publicKey: process.env.PAYWAY_PUBLIC_KEY,
  },
});

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

console.log(payment.status);
```

## Operaciones principales

```ts
const status = await client.health.getStatus();

const paymentInfo = await client.payments.get("574421", {
  expand: "card_data",
});

const refund = await client.payments.refund("574671", {});

const cards = await client.tokens.listCards("cliente-123");
```

## Ejemplo de pago PCI

Este flujo envia los datos de tarjeta directamente en la transaccion, sin tokenizacion previa. Debe usarse solo desde un backend controlado y con los resguardos PCI correspondientes.

```ts
import { PaywayClient } from "@diegomax/payway-ar-ts";

const client = new PaywayClient({
  environment: "test",
  credentials: {
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
  },
});

const payment = await client.payments.create({
  site_transaction_id: "pci-order-1002",
  payment_method_id: 1,
  amount: 125045,
  currency: "ARS",
  installments: 1,
  description: "Pago PCI sin tokenizacion",
  payment_type: "single",
  card_data: {
    card_number: "4507990000004905",
    card_expiration_month: "12",
    card_expiration_year: "30",
    security_code: "123",
    card_holder_name: "APRO",
    card_holder_identification: {
      type: "dni",
      number: "25123456",
    },
  },
});

console.log(payment.status);
```

En este escenario no se envian `token` ni `bin`, porque la operacion utiliza `card_data` como fuente primaria de la informacion de pago.

## Scripts

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run docs`

## Guias

- [docs/arquitectura.md](docs/arquitectura.md)
- [docs/uso-basico.md](docs/uso-basico.md)

## Alcance

La libreria expone una API orientada a backend para pagos, refunds, consulta de operaciones, tokenizacion, 3DS, checkout server-side, batch closure e internal tokenization. El foco es ofrecer una interfaz consistente para integraciones Node sobre Payway AR.
