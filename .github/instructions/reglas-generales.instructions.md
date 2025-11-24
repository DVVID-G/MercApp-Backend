---
applyTo: '**'
---
# ⚙️ Directrices de Desarrollo del Proyecto

## Estilo de Código y Lenguaje
- **Idioma:** Usar exclusivamente **TypeScript** en todo el proyecto (Frontend y Backend).
- **Formateo:** Aplicar convenciones de formateo estándar (Prettier/ESLint) y no exceder la longitud de línea de 100 caracteres.
- **Nomenclatura:** Usar **`camelCase`** para variables, funciones y métodos. Usar **`PascalCase`** para nombres de componentes y clases.
- uso de genericos en TypeScript cuando sea apropiado para mejorar la reutilización y seguridad de tipos.

## Testing y Documentación
- **Testing Backend:** Usar **Jest** para pruebas unitarias y **Supertest** para pruebas de integración de API.
- **Testing Frontend:** Usar **Vitest** y **React Testing Library** para pruebas unitarias y de integración de componentes.
- **Documentación:** Todas las funciones, componentes y métodos públicos deben tener documentación **JSDoc** o TSDoc.

## Herramientas
- **APIs:** Mantener la documentación **Swagger (OpenAPI 3.0)** actualizada con cada nuevo *endpoint* o cambio en la estructura de datos.
- **bd:** Usar **mongoose** para la interacción con MongoDB y seguir las mejores prácticas de modelado de datos.
- **Entorno:** Node.js (v20+)
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **ORM:** Prisma (con PostgreSQL)
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT + bcrypt
- **Documentación API:** Swagger (OpenAPI 3.0)
- **Testing:** Jest + Supertest
- **Despliegue:** Render / Railway (API) + Vercel (Frontend)


# Gitflow y commits
- Realizar commits atomicos y descriptivos siguiendo la convención **Conventional Commits**.
- Usar ramas feature/bugfix basadas en develop y realizar pull requests para revisión antes de mergear a main.
- Mantener el historial de Git limpio y comprensible, evitando merges innecesarios.