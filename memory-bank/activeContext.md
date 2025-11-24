# Active Context

Fecha: 2025-11-04

Estado actual del trabajo:
- Se creó el scaffolding inicial del backend (TypeScript + Express) con endpoints `/` y `/health`.
- Se añadió configuración básica de tests (Jest + ts-jest) y un test inicial con Supertest.

Decisiones recientes:
- Usar Express en backend por compatibilidad y rapidez de prototipado.
- Mantener TypeScript obligatorio en todo el proyecto (reglas del repo).

Próximos pasos inmediatos (priorizados por Product Backlog):
1. Implementar autenticación (US-1, US-2) con JWT y bcrypt.
2. Integrar Prisma y definir esquema inicial para usuarios, compras y productos.
3. Añadir endpoints CRUD para compras y productos.

Progreso US-1 (Registro de usuario):
- 2025-11-04: Inicio de implementación de US-1. Se creó conexión a MongoDB con `mongoose`, modelo `User`, servicios de autenticación, controlador, ruta `/auth/signup` y validación con `zod`.
- Tests de integración con `mongodb-memory-server` añadidos; dependencias actualizadas en `package.json`.

Nota: Aunque el Product Backlog sugería Prisma + PostgreSQL, las reglas del repositorio indican `mongoose` y MongoDB — por eso se adoptó MongoDB para esta US.

Progreso US-2 (Login de usuario):
- 2025-11-04: Implementación de `/auth/login` completada.
	- Se añadió `src/validators/login.validator.ts`.
	- `auth.service.ts` extendido con `verifyCredentials` y `generateToken` (JWT, expiración 24h configurable).
	- `auth.controller.ts` obtuvo el handler `login` y la ruta POST `/auth/login` fue montada con límite de tasa (express-rate-limit).
	- Tests de integración para login añadidos (`src/tests/auth.login.integration.test.ts`) y ejecutados con `mongodb-memory-server`.

Notas importantes:
- Actualizar `progress.md` después de cada sprint o cambio significativo.
