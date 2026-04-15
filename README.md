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

## Ejemplos de pagos offline

Para medios offline se utiliza `client.payments.createOffline()`. Los montos se envian como enteros en centavos y el `payment_method_id` cambia segun el medio:

- `25`: Pago Facil
- `26`: Rapipago
- `41`: Pago Mis Cuentas
- `51`: Cobro Express

### Pago Facil

```ts
const pagoFacil = await client.payments.createOffline({
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

### Rapipago

```ts
const rapipago = await client.payments.createOffline({
  site_transaction_id: "offline-rp-1002",
  token: "8e190c82-6a63-467e-8a09-9e8fa2ab6215",
  payment_method_id: 26,
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

### Pago Mis Cuentas

```ts
const pagoMisCuentas = await client.payments.createOffline({
  site_transaction_id: "offline-pmc-1003",
  token: "9ae1d130-8c89-4c3b-a267-0e97b88fedd0",
  payment_method_id: 41,
  amount: 1000,
  currency: "ARS",
  payment_type: "single",
  email: "user@mail.com",
  bank_id: "1",
  invoice_expiration: "191123",
  payment_mode: "offline",
});
```

### Cobro Express

```ts
const cobroExpress = await client.payments.createOffline({
  site_transaction_id: "offline-ce-1004",
  token: "3df26771-67ab-4a8e-91e2-f1e0b0c559f7",
  payment_method_id: 51,
  amount: 1000,
  currency: "ARS",
  payment_type: "single",
  email: "user@mail.com",
  invoice_expiration: "191123",
  second_invoice_expiration: "191130",
  cod_p3: "01",
  cod_p4: "134",
  client: "12345678",
  surcharge: 1001,
  payment_mode: "offline",
});
```

Los ejemplos anteriores asumen que ya existe un `token` valido para la operacion. La respuesta depende del medio y normalmente incluye los datos necesarios para emitir o presentar el cupon de pago.

### Que guardar despues de crear un pago offline

Cuando creas un pago offline conviene persistir al menos:

- `site_transaction_id`
- `id` u `operation_id` devuelto por la API
- `status`
- los datos del cupon o referencia de pago que devuelva el medio

El `id` u `operation_id` es el identificador mas util para consultar luego el estado real de la operacion.

### Como actualizar el estado de un pago offline

La forma mas directa de actualizar el estado es consultar la operacion con `client.payments.get()` usando el identificador devuelto al crear el pago.

```ts
const created = await client.payments.createOffline({
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

const operationId = created.operation_id ?? created.id;

if (!operationId) {
  throw new Error("La respuesta no incluyo operation_id ni id");
}

const paymentInfo = await client.payments.get(String(operationId));

console.log(paymentInfo.status);
console.log(paymentInfo.status_details);
```

### Estrategia recomendada para seguimiento

Para pagos offline, lo habitual es:

1. Crear la operacion y mostrar o almacenar el cupon.
2. Persistir `site_transaction_id`, `id` u `operation_id` y el `status` inicial.
3. Consultar el estado de la operacion en segundo plano hasta recibir el estado final que necesite tu negocio.
4. Actualizar tu orden interna solo a partir de la respuesta de Payway.

### Sobre webhooks y notificaciones

La referencia disponible para esta integracion no documenta un webhook especifico para confirmar pagos offline completados o rechazados. Por eso, en este SDK la recomendacion operativa es basarse en consultas de estado por API.

Si tu cuenta de Payway tiene algun mecanismo de notificacion server-to-server habilitado por configuracion comercial o por otro producto, deberias validarlo con la documentacion oficial de tu cuenta o con soporte de Payway antes de depender de ese flujo.

### Ejemplo de polling simple

```ts
async function waitForOfflineResolution(operationId: string, maxAttempts = 20) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const payment = await client.payments.get(operationId);

    if (payment.status && payment.status !== "pending") {
      return payment;
    }

    await new Promise((resolve) => setTimeout(resolve, 30000));
  }

  throw new Error(
    "El pago offline no llego a un estado final dentro de la ventana esperada",
  );
}
```

El estado final exacto depende del flujo configurado en Payway y del medio de pago. Si necesitas una clasificacion mas estricta en tu sistema, mapea los valores reales de `payment.status` que recibas en sandbox y produccion.

## Ejemplos de formularios de pago

Para crear un formulario de pago hospedado se utiliza `client.checkout.generateLink()`. Ese endpoint devuelve un `payment_link` que luego puedes redirigir o mostrar al comprador.

### Crear un link de checkout

```ts
import { PaywayClient } from "@diegomax/payway-ar-ts";

const client = new PaywayClient({
  environment: "test",
  credentials: {
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
    publicKey: process.env.PAYWAY_PUBLIC_KEY,
  },
});

const checkout = await client.checkout.generateLink({
  site: "03101980",
  template_id: 1,
  total_price: 1200,
  currency: "ARS",
  payment_method_id: 1,
  installments: [1],
  payment_description: "Producto o servicio",
  public_apikey: process.env.PAYWAY_PUBLIC_KEY,
  success_url: "https://shop.example.com/success",
  cancel_url: "https://shop.example.com/cancel",
  redirect_url: "https://shop.example.com/redirect",
  notifications_url: "https://shop.example.com/payway/notifications",
  products: [
    {
      id: "sku-001",
      quantity: 1,
      value: 1200,
      description: "Producto o servicio",
    },
  ],
});

console.log(checkout.payment_link);
```

### Redirigir al comprador al formulario

Una vez obtenido el `payment_link`, el flujo habitual es redirigir al usuario a esa URL:

```ts
const { payment_link } = await client.checkout.generateLink({
  site: "03101980",
  template_id: 1,
  total_price: 1200,
  payment_method_id: 1,
  installments: [1],
  success_url: "https://shop.example.com/success",
  cancel_url: "https://shop.example.com/cancel",
  public_apikey: process.env.PAYWAY_PUBLIC_KEY,
});

if (!payment_link) {
  throw new Error("Payway no devolvio payment_link");
}

return Response.redirect(payment_link, 302);
```

### Crear un formulario con Cybersource

Si tu cuenta opera con checkout y antifraude Cybersource, utiliza `template_id: 2` y agrega `fraud_detection`.

```ts
const checkoutWithCybersource = await client.checkout.generateLink({
  site: "03101980",
  template_id: 2,
  total_price: 1200,
  currency: "ARS",
  payment_method_id: 1,
  installments: [1],
  public_apikey: process.env.PAYWAY_PUBLIC_KEY,
  success_url: "https://shop.example.com/success",
  cancel_url: "https://shop.example.com/cancel",
  fraud_detection: {
    send_to_cs: true,
    channel: "Web",
    device_unique_id: "1234-1234",
    bill_to: {
      city: "Buenos Aires",
      country: "AR",
      customer_id: "cliente-123",
      email: "buyer@example.com",
      first_name: "Leila",
      last_name: "Sosa",
      phone_number: "1548866329",
      postal_code: "1427",
      state: "BA",
      street1: "Lavalle 4041",
    },
    ship_to: {
      city: "Buenos Aires",
      country: "AR",
      email: "buyer@example.com",
      first_name: "Leila",
      last_name: "Sosa",
      phone_number: "1549066329",
      postal_code: "1427",
      state: "BA",
      street1: "Lavalle 4041",
    },
    purchase_totals: {
      currency: "ARS",
      grandTotalAmount: 1200,
    },
    items: [
      {
        code: "sku-001",
        description: "Producto o servicio",
        name: "Producto o servicio",
        sku: "sku-001",
        quantity: 1,
        total_amount: 1200,
        unit_price: 1200,
      },
    ],
  },
});

console.log(checkoutWithCybersource.payment_link);
```

### Validar payloads del formulario

Si necesitas validar un payload de checkout antes de usarlo, puedes llamar `client.checkout.validate()`. Este flujo requiere `formApiKey` y `formSite` en las credenciales del cliente.

```ts
const validation = await client.checkout.validate({
  payment: {
    amount: 1200,
    currency: "ARS",
  },
  form: {
    site: "03101980",
    payment_method_id: 1,
  },
});

console.log(validation);
```

### Consideraciones para checkout hospedado

- `template_id: 1` crea un checkout estandar.
- `template_id: 2` se usa para checkout con Cybersource cuando tu configuracion lo soporta.
- `success_url` y `cancel_url` son las URLs de retorno del comprador.
- `redirect_url` y `notifications_url` dependen del flujo configurado en tu cuenta de Payway.
- El `payment_link` devuelto es el dato principal que debes almacenar o redirigir.

## Scripts

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run docs`

## Guias

- [docs/arquitectura.md](docs/arquitectura.md)
- [docs/uso-basico.md](docs/uso-basico.md)
- [docs/pagos-offline.md](docs/pagos-offline.md)

## Alcance

La libreria expone una API orientada a backend para pagos, refunds, consulta de operaciones, tokenizacion, 3DS, checkout server-side, batch closure e internal tokenization. El foco es ofrecer una interfaz consistente para integraciones Node sobre Payway AR.
