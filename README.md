# MercApp — scaffolding

Pequeño scaffolding para el backend de MercApp (TypeScript + Express).

Qué incluye:
- `src/app.ts` - instancia de Express y rutas básicas
- `src/server.ts` - arranca el servidor
- `src/routes/health.ts` - endpoint /health
- `jest.config.cjs` y `src/app.test.ts` - test inicial con Supertest

Primeros pasos (PowerShell / Windows):

```powershell
cd "c:\Users\usuario\OneDrive\Documents\ACADEMICO\MercApp"
npm install
npm run dev
```

Tests:

```powershell
npm test
```

Notas:
- El proyecto sigue las reglas internas: TypeScript en backend, Jest+Supertest para pruebas.
- Tras `npm install` es recomendable agregar `@types/node` y otras dependencias dev si faltan.
