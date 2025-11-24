---
applyTo: '**'
---
# Seguridad y Persistencia
- **Hashing de Contraseña:** Usar **`bcrypt`** con un mínimo de **10 *salt rounds*** para hashear todas las contraseñas.
- **Autenticación JWT:** El token debe ser manejado por el *middleware* y debe incluir solo el `userId` y la fecha de expiración; evitar incluir datos sensibles.
