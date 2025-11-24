# Tech Context

Stack y herramientas (MVP):
- Backend: Node.js (v20+), Express, TypeScript
- ORM: Prisma + PostgreSQL
- Auth: JWT + bcrypt
- Tests: Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- Dev tools: ts-node-dev, eslint, prettier

Setup de desarrollo (esenciales):
1. `npm install`
2. `npm run dev` — arranca el servidor en `src/server.ts` (ts-node-dev)
3. `npm test` — ejecutar tests unitarios y de integración

Recomendaciones:
- Instalar `@types/node` y `@types/express` en devDependencies para una experiencia TS completa.
- Mantener `schema.prisma` con convenciones snake_case para tablas y columnas.
