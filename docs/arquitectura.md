# Arquitectura

El SDK esta organizado alrededor de un unico `PaywayClient` con dominios especializados:

- `health`
- `payments`
- `tokens`
- `threeDS`
- `batchClosure`
- `checkout`
- `internalTokenization`

La capa HTTP usa `fetch` nativo y aplica:

- resolucion de base URL por entorno
- headers compatibles con Payway
- timeout mediante `AbortController`
- normalizacion de errores
- validacion de respuestas criticas con Zod

## Principios de diseno

- exponer una API predecible y tipada
- centralizar rutas y autenticacion
- exponer tipos estables y ergonomicos para Node
- permitir tests deterministas sin acceso a la red

## Capas

- `PaywayClient`: punto de entrada y agrupacion de dominios.
- `http/`: transporte, resolucion de rutas, autenticacion y errores.
- `schemas/`: validaciones de configuracion y payloads.
- `domains/`: operaciones agrupadas por funcionalidad.
