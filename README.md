# MercApp — Backend (actualizado)

Breve descripción
- Pequeño backend en **TypeScript + Express** para la aplicación MercApp. Incluye autenticación con JWT, gestión de compras y la estructura para añadir productos.

Qué incluye (archivos clave)
- `src/app.ts` — instancia de Express y montaje de rutas (`/health`, `/auth`, `/purchases`)
- `src/server.ts` — bootstrap y conexión a MongoDB
- `src/db/mongoose.ts` — helper de conexión a MongoDB
- `src/models` — `user.model.ts`, `purchase.model.ts` (y `product.model.ts` cuando se implemente)
- `src/services` — lógica de negocio (auth, purchases, product cuando esté)
- `src/controllers` — handlers HTTP delgado
- `src/routes` — routers montados en `app.ts`
- `src/validators` — validaciones con Zod
- `src/tests` — pruebas de integración con Jest + Supertest y `mongodb-memory-server`

Requisitos
- Node 16+ recomendado
- MongoDB para entorno de producción; las pruebas usan `mongodb-memory-server` (no requiere Mongo externo).

Variables de entorno (ejemplo en `.env`)
- `PORT` — puerto del servidor (ej. `3000`)
- `MONGO_URI` — URI de MongoDB (ej. `mongodb://...`)
- `JWT_SECRET` — secreto para firmar access tokens (en desarrollo tiene un valor por defecto en el código)
- `JWT_EXPIRES_IN` — duración del access token (ej. `15m`)
- `REFRESH_TOKEN_EXPIRES_IN` — duración del refresh token (ej. `7d`)
- `SALT_ROUNDS` — rounds para bcrypt (ej. `10`)

Scripts útiles
- `npm run dev` — arranca en modo desarrollo (ts-node-dev)
- `npm start` — build + run (según `package.json`)
- `npm test` — ejecuta la suite de pruebas (Jest + Supertest)

Autenticación (uso desde el frontend)
- Flujo: `POST /auth/signup` -> crea usuario; `POST /auth/login` -> devuelve `accessToken` y `refreshToken`.
- Incluir header en peticiones protegidas: `Authorization: Bearer <accessToken>`

Respuesta de login (ejemplo)
```
{ "accessToken": "<jwt>", "refreshToken": "<refresh-token>" }
```

API — Endpoints documentados (para consumo del frontend)

**Health**
- `GET /health` — 200 OK si el servicio está arriba.

**Auth**
- `POST /auth/signup` — registrar usuario
  - Body: `{ "name": "User Name", "email": "user@example.com", "password": "secret", "confirmPassword": "secret" }`
  - Respuesta: 201 con el usuario (sin password) o 409 si el email ya existe.

- `POST /auth/login` — autenticar
  - Body: `{ "email": "user@example.com", "password": "secret" }`
  - Respuesta: 200 `{ "accessToken": "...", "refreshToken": "..." }`
  - Nota: login tiene rate-limiting para evitar abusos.

- `POST /auth/refresh` — intercambiar `refreshToken` por nuevo `accessToken`
  - Body: `{ "refreshToken": "..." }`
  - Respuesta: 200 con nuevo `accessToken` (y refresh token rotation).

- `POST /auth/logout` — revocar refresh token (opcional)
  - Body: `{ "refreshToken": "..." }` — devuelve 200 al completar.

**Purchases (Compras)** — Requiere autenticación

- `POST /purchases` — crear una compra
  - Header: `Authorization: Bearer <accessToken>`
  - Body ejemplo:
    ```json
    {
      "items": [
        { "productId": "<productId optional>", "name": "Arroz", "price": 2.5, "quantity": 2, "umd": "kg" },
        { "name": "Leche", "price": 1.0, "quantity": 3 }
      ]
    }
    ```
  - Comportamiento: si un `item` incluye `productId`, el servicio buscará el `Product` y usará el `price` y `umd` del `Product` para ese item (política actual: usar el precio del producto como fuente de verdad; el `price` enviado en el payload será ignorado para items con `productId`).
  - El servicio calcula `total` sumando `price * quantity` por item. Devuelve 201 y el documento `Purchase` creado.

- `GET /purchases` — listar compras del usuario
  - Header: `Authorization: Bearer <accessToken>`
  - Query params:
    - `page` (int, opcional)
    - `limit` (int, opcional, max 100)
    - `sort` (string, opcional)
    - `from` / `to` (fechas ISO string para filtrar por createdAt)
  - Respuesta: 200 `{ items: Purchase[], page, limit, total }`

- `GET /purchases/:id` — detalle de compra
  - Header: `Authorization: Bearer <accessToken>`
  - Respuesta: 200 con el `Purchase` si pertenece al usuario; 404 si no existe.

**Products (HU-4 — planificación e implementación próxima)**
- Objetivo: añadir recursos para gestionar productos que luego puedan referenciarse desde compras.
- Endpoints planeados:
  - `POST /products` — crear producto (requerido autenticación)
    - Body: `{ "name": string, "price": number, "gramaje": number, "umd": string, "barcode"?: string }`
    - Comportamiento: se calculará `pum = gramaje / price` y se almacenará (o se calcula on-demand según diseño). `barcode` será único si se provee.
  - `GET /products` — listar productos
  - `GET /products/:id` — obtener producto por id

- Reglas importantes (implementadas/planificadas):
  - Solo usuarios autenticados pueden crear productos (confirmar si se requiere rol `admin` en el futuro).
  - Si una `purchase.item` referencia `productId`, el `purchase.service` usará el `price` y `umd` del producto y calculará `total` con esos valores.
  - PUM (Precio Unitario de Medida): definido por la regla solicitada — PUM = `gramaje / price` (nota: confirmar unidades para evitar confusión; actualmente se implementará tal cual).

Modelo de datos (resumen)
- `User` — email, password (hasheado), refreshTokens[]
- `Purchase` — `userId`, `items[]`(productId?, name, price, quantity, umd), `total`, `createdAt`
- `Product` (planificado) — `name`, `price`, `gramaje`, `pum`, `umd`, `barcode?`, timestamps

Testing
- Las pruebas de integración usan `mongodb-memory-server`. Ejecuta `npm test` para lanzar Jest.

Notas operativas
- Si usas MongoDB Atlas en desarrollo, asegúrate de que `MONGO_URI` sea correcto y que tu IP esté permitida en la whitelist; los errores de autenticación provienen normalmente de credenciales inválidas o IP no permitida.

Contactos y siguientes pasos
- Si el frontend necesita cambios concretos en la respuesta (por ejemplo campos calculados, formato de fechas), dime qué formato prefieres y lo adapto.
- Próximo trabajo planificado: implementar HU-4 (Products), integración con compras y tests relacionados.
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
