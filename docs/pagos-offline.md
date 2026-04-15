# Pagos offline

## Medios soportados

Los ejemplos de esta libreria contemplan estos `payment_method_id` para pagos offline:

- `25`: Pago Facil
- `26`: Rapipago
- `41`: Pago Mis Cuentas
- `51`: Cobro Express

Todos los montos deben enviarse como enteros en centavos.

## Crear una operacion offline

```ts
import { PaywayClient } from "@diegomax/payway-ar-ts";

const client = new PaywayClient({
  environment: "test",
  credentials: {
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
  },
});

const payment = await client.payments.createOffline({
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

## Datos que conviene persistir

Despues de crear la operacion, guarda como minimo:

- `site_transaction_id`
- `id` u `operation_id`
- `status`
- los datos del cupon o referencia devueltos por Payway
- timestamps internos de creacion y ultima sincronizacion

Esto te permite reconstruir el estado de la orden y volver a consultar la operacion sin ambiguedad.

## Consultar estado

```ts
const operationId = payment.operation_id ?? payment.id;

if (!operationId) {
  throw new Error("La respuesta no incluyo operation_id ni id");
}

const paymentInfo = await client.payments.get(String(operationId));

console.log(paymentInfo.status);
console.log(paymentInfo.status_details);
```

La respuesta de detalle es la fuente de verdad para decidir si tu orden sigue pendiente, fue pagada, fallo o necesita revision manual.

## Seguimiento automatico

Si necesitas sincronizar el estado en tu sistema, una estrategia simple es ejecutar polling controlado:

```ts
async function syncOfflinePayment(client: PaywayClient, operationId: string) {
  const payment = await client.payments.get(operationId);

  return {
    operationId,
    status: payment.status,
    raw: payment,
  };
}
```

Para procesos batch o workers:

1. Recorre las operaciones offline pendientes en tu base.
2. Consulta `client.payments.get()` para cada una.
3. Actualiza el estado interno solo a partir de la respuesta de Payway.
4. Deja de consultar cuando la operacion llegue al estado final que maneja tu negocio.

## Webhooks y notificaciones

La referencia utilizada para esta integracion no documenta un webhook especifico para pagos offline ni una URL de callback server-to-server para enterarte de `success` o `error`.

Por eso, la recomendacion en esta libreria es:

1. Crear la operacion offline.
2. Persistir el identificador de operacion.
3. Consultar estado por API hasta completar la resolucion del pago.

Si tu cuenta o contrato con Payway incluye otro mecanismo de notificacion, debes confirmarlo con la documentacion oficial de tu tenant o con soporte de Payway antes de incorporarlo a produccion.

## Consideraciones practicas

- No asumas que un pago offline queda resuelto al momento de crear la operacion.
- No actualices la orden a pagada solo porque generaste el cupon.
- Usa `id` u `operation_id` como referencia principal para sincronizar estados.
- Registra tambien `site_transaction_id` para trazabilidad interna.
- Mapea los valores reales de `payment.status` que observes en sandbox y produccion antes de cerrar la logica final de negocio.
