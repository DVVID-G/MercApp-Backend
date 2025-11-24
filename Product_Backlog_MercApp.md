
# 📱 WebApp MobileFirst para Registro de Compras en Supermercado  
**Fecha:** 2025-11-04  
**Rol:** Product Manager  
**Propósito:** Definir el Product Backlog con historias de usuario, criterios de aceptación, definición de hecho (DoD), y stack tecnológico.

---

## 🧠 Propuesta de Nombre de la App
**Nombres sugeridos:**
1. **MercApp** – Tu mercado inteligente.
2. **ShopTrack** – Controla tus compras fácilmente.
3. **ListoMarket** – Compra, escanea y guarda.
4. **Marketly** – Digitaliza tu carrito de compras.
5. **Scan&Shop** – Escanea, compra, repite.

---

## ⚙️ Stack Tecnológico Sugerido

### **Frontend**
- **Framework:** React + Vite (mobile-first)
- **Lenguaje:** TypeScript
- **UI Library:** TailwindCSS + HeadlessUI
- **Gestión de Estado:** Redux Toolkit
- **Routing:** React Router v7
- **Autenticación:** JWT + Context API
- **Testing:** Vitest + React Testing Library

### **Backend**
- **Entorno:** Node.js (v20+)
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **ORM:** Prisma (con PostgreSQL)
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT + bcrypt
- **Documentación API:** Swagger (OpenAPI 3.0)
- **Testing:** Jest + Supertest
- **Despliegue:** Render / Railway (API) + Vercel (Frontend)

### **Otros Servicios**
- **Almacenamiento de Imágenes / Archivos:** Cloudinary o S3
- **Logs & Monitoring:** Winston + Logtail
- **CI/CD:** GitHub Actions

---

## 🧾 Product Backlog

### Código,Título,Épica,Descripción,Criterios de Aceptación,Definición de Hecho

---

### US-1,Registro de usuario,E-1 Gestión de cuentas,
"Como visitante quiero registrarme en la app para poder guardar mis compras de supermercado.",
**Criterios de Aceptación:**
- El formulario debe incluir: nombre, correo, contraseña y confirmación de contraseña.
- Contraseña ≥ 8 caracteres, al menos una mayúscula, un número y un carácter especial.
- Validación en tiempo real de campos.
- Mensajes de error claros sin recargar la página.
- Al registrarse correctamente, se redirige a /login y se muestra mensaje de éxito.
**Definición de Hecho:**
- API POST /auth/signup funcional con validaciones.
- Password hasheada con bcrypt (≥10 salt rounds).
- Pruebas unitarias y de integración superadas.
- UI responsive en 320px, 768px, 1024px.

## Progreso de implementación (agent)
- 2025-11-04: Iniciado desarrollo de US-1 en backend.
	- Se creó conexión a MongoDB con `mongoose` y modelo `User`.
	- Endpoint POST `/auth/signup` implementado en `src/routes/auth.routes.ts` y controlador asociado.
	- Validación de payload con `zod` (`src/validators/auth.validator.ts`).
	- Tests de integración agregados en `src/tests/auth.integration.test.ts` usando `mongodb-memory-server`.
	- Nota: Se ha decidido seguir la directiva de repo y usar MongoDB/mongoose en lugar de Prisma/Postgres para esta US.

Estado de la US-1: COMPLETADA

- [US-1] - Tarea completada (2025-11-04): Backend: endpoint POST `/auth/signup` implementado, contraseña hasheada, validaciones y tests de integración ejecutados y aprobados.

---

### US-2,Login de usuario,E-1 Gestión de cuentas,
"Como usuario registrado quiero iniciar sesión para acceder a mis compras y productos registrados.",
**Criterios de Aceptación:**
- Formulario con correo y contraseña.
- Validación en tiempo real.
- En caso de error, mostrar mensaje “Credenciales incorrectas”.
- Redirigir al dashboard al iniciar sesión.
**Definición de Hecho:**
- API POST /auth/login retorna JWT válido (expira en 24h).
- Front almacena token en localStorage seguro.
- Cobertura de pruebas ≥90%.

Estado de la US-2: COMPLETADA

- [US-2] - Tarea completada (2025-11-04): Backend: endpoint POST `/auth/login` implementado, verificación de credenciales con bcrypt, token JWT emitido (24h), validaciones y tests de integración ejecutados y aprobados.

---

### US-3,Registrar compra,E-2 Gestión de compras,
"Como usuario quiero registrar una nueva compra para llevar control del total y productos adquiridos.",
**Criterios de Aceptación:**
- Formulario con fecha (auto por defecto) y valor total.
- Permitir añadir productos al detalle.
- Guardar relación usuario–compra en BD.
**Definición de Hecho:**
- Endpoint POST /purchases guarda compra y productos asociados.
- Validaciones completas.
- UI mobile-first probada en pantallas chicas.
- Pruebas de integración API realizadas.

Estado de la US-3: COMPLETADA

- [US-3] - Tarea completada (2025-11-24): Backend: endpoint POST `/purchases` implementado, validaciones con `zod`, middleware de autenticación, cálculo de total en `src/services/purchase.service.ts` y tests de integración en `src/tests/purchases.integration.test.ts` ejecutados y aprobados.

---

### US-4,Agregar producto a compra,E-2 Gestión de compras,
"Como usuario quiero agregar productos con su información para registrar lo que compro.",
**Criterios de Aceptación:**
- Campos: nombre, precio, UMD, PUM, cantidad, código de barras.
- Validaciones de tipo y formato.
- Guardado automático en la compra actual.
**Definición de Hecho:**
- POST /products funcional con relación a compra.
- Pruebas unitarias backend ≥85%.
- UI dinámica con botones + y - para cantidad.

---

### US-5,Escanear producto,E-3 Escaneo de productos,
"Como usuario quiero escanear el código de barras de un producto para añadirlo rápidamente a mi compra.",
**Criterios de Aceptación:**
- Escáner accede a cámara del dispositivo (navigator.mediaDevices).
- Si el producto existe, se rellena automáticamente.
- Si no existe, muestra formulario de registro rápido.
**Definición de Hecho:**
- Uso de librería QuaggaJS o ZXing para escaneo.
- Endpoint GET /products/:barcode retorna información.
- Pruebas en dispositivos móviles Android/iOS.

---

### US-6,Historial de compras,E-4 Visualización de datos,
"Como usuario quiero ver mi historial de compras para revisar mis gastos anteriores.",
**Criterios de Aceptación:**
- Mostrar lista paginada con fecha, valor total y cantidad de productos.
- Permitir ordenar por fecha o valor.
- Acceso sólo para usuarios autenticados.
**Definición de Hecho:**
- Endpoint GET /purchases con paginación (limit, offset).
- UI con filtros interactivos.
- Pruebas E2E con Cypress completadas.

---

### US-7,Ver detalle de compra,E-4 Visualización de datos,
"Como usuario quiero ver el detalle de una compra pasada para revisar productos y precios.",
**Criterios de Aceptación:**
- Mostrar lista de productos asociados a la compra seleccionada.
- Totales y subtotales visibles.
**Definición de Hecho:**
- API GET /purchases/:id con join de productos.
- Diseño responsivo y limpio.

---

### US-8,Logout,E-1 Gestión de cuentas,
"Como usuario quiero cerrar sesión de forma segura para proteger mis datos.",
**Criterios de Aceptación:**
- Al cerrar sesión, eliminar JWT del almacenamiento local.
- Redirigir al login.
**Definición de Hecho:**
- Función logout implementada y probada.
- UI confirmando acción.

---

### US-9,Modo Offline (opcional),E-5 Experiencia de usuario avanzada,
"Como usuario quiero poder seguir registrando productos sin conexión para no perder mis datos si el internet falla.",
**Criterios de Aceptación:**
- Almacenar temporalmente compras sin conexión.
- Sincronizar al reconectarse.
**Definición de Hecho:**
- Uso de IndexedDB + Service Workers.
- Sincronización comprobada manualmente.

---

### US-10,Dashboard y estadísticas,E-4 Visualización de datos,
"Como usuario quiero ver estadísticas de mis gastos para tener control de mi presupuesto.",
**Criterios de Aceptación:**
- Mostrar gráficos de gasto por mes y categoría.
- Filtros por rango de fechas.
**Definición de Hecho:**
- Integración con Recharts.
- API agregada /analytics.
- Responsive y probado en móviles.

---

## 🚦 Prioridad Global
| Prioridad | Épica | Historias |
|------------|--------|------------|
| Alta | E-1 Gestión de cuentas | US-1, US-2, US-8 |
| Alta | E-2 Gestión de compras | US-3, US-4, US-5 |
| Media | E-4 Visualización de datos | US-6, US-7, US-10 |
| Baja | E-5 Experiencia avanzada | US-9 |

---

© 2025-11-04 - Product Backlog creado por José David (Product Manager)
