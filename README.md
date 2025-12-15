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

- `POST /purchases` — crear una compra con sincronización automática de productos al catálogo
  - Header: `Authorization: Bearer <accessToken>`
  - Body ejemplo:
    ```json
    {
      "items": [
        {
          "name": "Arroz Diana",
          "marca": "Diana",
          "price": 20000,
          "quantity": 2,
          "packageSize": 1000,
          "umd": "gramos",
          "barcode": "7891234567890",
          "categoria": "Granos"
        },
        {
          "name": "Leche Entera",
          "marca": "Colanta",
          "price": 3500,
          "quantity": 1,
          "packageSize": 1000,
          "umd": "mililitros",
          "barcode": "7891234567891",
          "categoria": "Lácteos"
        }
      ]
    }
    ```
  - **Comportamiento de sincronización automática** (nuevo):
    1. **Búsqueda por barcode**: Si el item tiene `barcode`, busca en el catálogo por código de barras.
    2. **Búsqueda por name+marca+umd**: Si no se encuentra por barcode (o no tiene barcode), busca por coincidencia de nombre, marca y unidad de medida (case-insensitive).
    3. **Creación automática**: Si no existe el producto, lo crea automáticamente en el catálogo con los datos del item.
    4. **Detección de cambios de precio**: Si el producto existe pero el precio difiere del catálogo, devuelve un flag `priceChanged: true` en el item de respuesta.
  - El servicio:
    - Enriquece cada item con el `productId` del catálogo (encontrado o recién creado)
    - Usa el **precio del catálogo** como fuente de verdad (ignora el precio enviado si el producto existe)
    - Calcula `pum` automáticamente
    - Calcula `total` sumando `price * quantity` por item
  - Respuesta: 201 con el documento `Purchase` creado incluyendo flags de cambio de precio
  - Ejemplo response:
    ```json
    {
      "_id": "...",
      "userId": "...",
      "items": [
        {
          "productId": "...",
          "name": "Arroz Diana",
          "marca": "Diana",
          "price": 20000,
          "quantity": 2,
          "packageSize": 1000,
          "umd": "gramos",
          "barcode": "7891234567890",
          "categoria": "Granos",
          "pum": 20,
          "priceChanged": false
        }
      ],
      "total": 40000,
      "createdAt": "2025-12-15T..."
    }
    ```

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

**Products** — Requiere autenticación

- `POST /products` — crear producto
  - Header: `Authorization: Bearer <accessToken>`
  - Body ejemplo:
    ```json
    {
      "name": "Arroz Integral",
      "price": 20000,
      "packageSize": 1000,
      "umd": "gramos",
      "barcode": "7891234567890",
      "categoria": "Alimentos",
      "marca": "Diana"
    }
    ```
  - Comportamiento: El sistema calcula automáticamente `pum = price / packageSize` cuando `packageSize > 0`. El campo `pum` se almacena y devuelve en las respuestas.
  - Validación: `packageSize` debe ser positivo, `barcode` es único si se provee.
  - Respuesta: 201 con el producto creado incluyendo `pum` calculado.

- `GET /products` — listar productos
  - Header: `Authorization: Bearer <accessToken>`
  - Respuesta: 200 con array de productos (cada producto incluye `pum` calculado).

- `GET /products/:id` — obtener producto por ID
  - Header: `Authorization: Bearer <accessToken>`
  - Respuesta: 200 con el producto o 404 si no existe.

- `GET /products/search` — buscar productos por nombre, marca o código de barras (autocomplete)
  - Header: `Authorization: Bearer <accessToken>`
  - Query params: 
    - `q` (query string, mínimo 2 caracteres)
    - `limit` (opcional, default 10, max 50)
  - Comportamiento: Búsqueda por texto completo en campos `name` y `marca` usando índice de texto. También busca por coincidencia exacta de `barcode` si el query es numérico.
  - Respuesta: 200 con array de productos que coinciden, ordenados por relevancia.
  - Ejemplo request: `GET /products/search?q=arroz&limit=5`
  - Ejemplo response:
    ```json
    [
      {
        "_id": "...",
        "name": "Arroz Diana",
        "marca": "Diana",
        "price": 20000,
        "packageSize": 1000,
        "umd": "gramos",
        "barcode": "7891234567890",
        "categoria": "Granos",
        "pum": 20
      }
    ]
    ```

- `GET /products/barcode/:barcode` — buscar producto por código de barras
  - Header: `Authorization: Bearer <accessToken>`
  - Path param: `barcode` (8, 12 o 13 dígitos)
  - Respuesta: 200 con el producto o 404 si no existe.
  - Ejemplo: `GET /products/barcode/7891234567890`

- `PUT /products/:id` — actualizar producto
  - Header: `Authorization: Bearer <accessToken>`
  - Body: Campos a actualizar (parcial)
  - Comportamiento: Si se actualiza `price` o `packageSize`, `pum` se recalcula automáticamente.
  - Respuesta: 200 con el producto actualizado.
  - Ejemplo request:
    ```json
    {
      "price": 21000
    }
    ```
  - Ejemplo response:
    ```json
    {
      "_id": "...",
      "name": "Arroz Diana",
      "price": 21000,
      "packageSize": 1000,
      "pum": 21,
      "updatedAt": "2025-12-15T..."
    }
    ```

**Reglas importantes:**
- **PUM (Precio por Unidad de Medida)**: Se calcula como `pum = price / packageSize`. Por ejemplo, un producto de 1000g a $20,000 tiene PUM = 20 (pesos por gramo).
- **PackageSize**: Cantidad del producto en el paquete (ej: 1000 para 1kg).
- **UMD (Unidad de Medida)**: String que indica cómo se vende el producto ("gramos", "kg", "libra", "litros", "ml", "unidad").
- Solo usuarios autenticados pueden crear/modificar productos.
- **Sincronización automática de productos**: Al crear una compra, el sistema automáticamente:
  1. Busca productos existentes por barcode (primera prioridad)
  2. Si no existe barcode, busca por name+marca+umd (segunda prioridad)
  3. Si no encuentra coincidencia, crea el producto automáticamente en el catálogo
  4. Detecta cambios de precio entre el catálogo y la compra actual
- **Identificación de productos únicos**: Un producto se considera único por su `barcode` (si existe) o por la combinación `name + marca + umd` (case-insensitive).
- **Índices de búsqueda**:
  - Índice único en `barcode` para búsquedas rápidas por código de barras (~1ms)
  - Índice compuesto en `name + marca + umd` para búsquedas por identidad (~5ms)
  - Índice de texto en `name + marca` para búsqueda autocomplete (~10ms)

Modelo de datos (resumen)
- `User` — email, password (hasheado), refreshTokens[]
- `Purchase` — `userId`, `items[]`(productId?, name, price, quantity, packageSize, umd, marca, barcode, categoria, pum), `total`, `createdAt`
- `Product` — `name`, `price`, `packageSize`, `pum` (calculado), `umd`, `barcode` (único), `marca`, `categoria`, timestamps

**Cálculo de PUM:**
```typescript
// Pre-save hook en Product model
if (this.packageSize && this.packageSize > 0) {
  this.pum = this.price / this.packageSize;
}
// Ejemplo: price=20000, packageSize=1000 → pum=20 (pesos/gramo)
```

Testing
- Las pruebas de integración usan `mongodb-memory-server`. Ejecuta `npm test` para lanzar Jest.
- Coverage reports disponibles en `coverage/lcov-report/index.html` después de ejecutar tests.

Notas operativas
- Si usas MongoDB Atlas en desarrollo, asegúrate de que `MONGO_URI` sea correcto y que tu IP esté permitida en la whitelist; los errores de autenticación provienen normalmente de credenciales inválidas o IP no permitida.

**Documentación Adicional**

Para información detallada sobre el sistema de sincronización de productos, consulta:

1. **[Algoritmo de Identificación de Productos](./docs/product-sync-algorithm.md)**
   - Cómo funciona el sistema de tres niveles (barcode → name+brand+umd → create new)
   - Tracking de precios y prevención de duplicados
   - Métricas de performance y casos de error

2. **[Guía del Desarrollador: Flujo de Sincronización](./docs/developer-guide-product-sync.md)**
   - Arquitectura del sistema (diagramas de flujo)
   - Componentes core (Product Service, Purchase Service, frontend)
   - Ejemplos de código y patrones de uso
   - Cómo extender el sistema
   - Tests unitarios e integración
   - Debugging y optimización de performance

3. **[Guía del Usuario: Búsqueda y Gestión de Productos](./docs/user-guide-product-search.md)**
   - Cómo buscar productos (autocomplete, barcode)
   - Crear productos nuevos manualmente
   - Gestión de cambios de precio
   - Preguntas frecuentes y tips

4. **[Procedimiento de Migración: Actualización del Schema](./docs/migration-product-schema.md)**
   - Cambios en el modelo Product (campos ahora requeridos: marca, barcode, categoria)
   - Creación de índices (barcode único, name+marca+umd compuesto, texto)
   - Pasos de migración con validación
   - Estrategia de rollback
   - Análisis de impacto en performance

5. **[Guía de Troubleshooting: Product Sync](./docs/troubleshooting-product-sync.md)**
   - Soluciones a problemas comunes (creación, búsqueda, barcode scanning, duplicados)
   - Códigos de error de API con resoluciones
   - Checklist de debugging (frontend, backend, database)
   - Métricas de performance y cómo mejorarlas

Contactos y siguientes pasos
- Si el frontend necesita cambios concretos en la respuesta (por ejemplo campos calculados, formato de fechas), dime qué formato prefieres y lo adapto.
- Trabajo completado: HU-4 (Products) con sincronización automática al catálogo desde compras.
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
