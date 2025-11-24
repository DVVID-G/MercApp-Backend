# Progress

Última actualización: 2025-11-24

Hecho:
- Scaffolding inicial del backend creado (Express + TypeScript).
- Test básico con Supertest añadido.
- `Product_Backlog_MercApp.md` revisado para priorización.

En progreso / pendientes:
- Implementar Endpoints de Auth (signup/login) y hash de passwords con bcrypt. (IN PROGRESS: `/auth/signup` implementado parcialmente)
- Integrar Prisma y crear migración inicial para users, purchases y products. (Defer: siguiendo regla, usamos MongoDB y mongoose en lugar de Prisma/Postgres para ahora)
- Añadir CI (GitHub Actions) que ejecute `npm test`.

Detalles recientes:
- Se añadió `src/db/mongoose.ts`, `src/models/user.model.ts`, `src/services/auth.service.ts`, `src/controllers/auth.controller.ts`, `src/routes/auth.routes.ts`, validator (`zod`) y tests de integración con `mongodb-memory-server`.

Recientes:
- Implementado endpoint POST `/purchases` (US-3) con:
	- Modelo Mongoose `Purchase` en `src/models/purchase.model.ts`.
	- Validador con `zod` en `src/validators/purchase.validator.ts`.
	- Servicio `createPurchase` que calcula el total y persiste la compra en `src/services/purchase.service.ts`.
	- Controlador y ruta protegida con JWT `src/controllers/purchase.controller.ts` y `src/routes/purchases.routes.ts`.
	- Tests de integración en `src/tests/purchases.integration.test.ts` usando `mongodb-memory-server`.

Reciente (Opción 2):
- Implementados GET `/purchases` (paginación y filtros básicos) y GET `/purchases/:id` (detalle) en `src/routes/purchases.routes.ts`.
- Servicios: `listPurchases` y `getPurchaseById` en `src/services/purchase.service.ts`.
- Controladores: `listPurchases` y `getPurchaseById` en `src/controllers/purchase.controller.ts`.
- Validación de query params en `src/validators/purchase.validator.ts`.
- Tests de integración extendidos en `src/tests/purchases.integration.test.ts`.


Estado US-2 (Login):
- Implementado POST `/auth/login` con verificación de credenciales y generación de JWT (expiración 24h configurable).
- Se añadió rate limiter para proteger el endpoint de login.
- Tests de integración para login ejecutados y pasados.

Bloqueos:
- Acceso a la base de datos (Postgres) para desarrollo; configurar variables de entorno y esquema prisma.
