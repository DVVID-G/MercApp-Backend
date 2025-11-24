---
applyTo: '**'
---
# Arquitectura de Tres Capas
- **Controllers:** Debe ser delgado. Solo maneja la solicitud (req), llama al Servicio y gestiona la respuesta (res). Prohibida la lógica de negocio y el acceso directo a la DB.
- **Services:** Contiene la **lógica de negocio** principal (validaciones complejas, transacciones) y es la única capa que puede llamar a Prisma.
- **Errores:** Implementar un *middleware* centralizado para capturar y tipificar errores. Las funciones deben lanzar (throw) excepciones tipadas que el *middleware* maneje.