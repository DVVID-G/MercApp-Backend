# System Patterns

Arquitectura general:
- Tres capas: Controllers (delgados), Services (lógica de negocio), Data/Repository (Prisma).

Patrones y convenciones:
- Controllers: gestionar req/res y delegar a Services (sin lógica de negocio ni acceso directo a Prisma).
- Services: contain business logic, validations, transactions y llamadas a Prisma.
- Middleware central para manejo de errores y auth (JWT).

Persistencia:
- Prisma ORM con PostgreSQL. Nombres en DB en snake_case según `security-standards.instructions.md`.

Prácticas de desarrollo:
- Tests unitarios y de integración para Services y Controllers (Jest + Supertest).
- Documentar endpoints con Swagger (OpenAPI 3.0).
