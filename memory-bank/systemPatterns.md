# System Patterns

Arquitectura general:
- Tres capas: Controllers (delgados), Services (lógica de negocio), Data/Repository (Mongoose).

Patrones y convenciones:
- Controllers: gestionar req/res y delegar a Services (sin lógica de negocio ni acceso directo a Mongoose).
- Services: contain business logic, validations, transactions y llamadas a Mongoose.
- Middleware central para manejo de errores y auth (JWT).

Persistencia:
- Mongoose ORM con MongoDB.

Prácticas de desarrollo:
- Tests unitarios y de integración para Services y Controllers (Jest + Supertest).
- Documentar endpoints con README y comentarios en código.

## PUM (Precio por Unidad de Medida) Calculation Pattern

**Purpose**: Automatically calculate cost per unit of measure to help users compare product prices across different package sizes.

**Implementation**: Pre-save hook in Product model

```typescript
// Product Model Schema
interface IProduct {
  name: string;
  price: number;          // Total price of the package
  packageSize: number;    // Quantity in the package (e.g., 1000 for 1kg)
  umd: string;           // Unit of measure: "gramos", "kg", "litros", "ml", "unidad"
  pum: number;           // Calculated: price / packageSize
  marca: string;
  barcode?: string;
  categoria: string;
}

// Pre-save Hook
productSchema.pre('save', function(next) {
  if (this.packageSize && this.packageSize > 0) {
    this.pum = this.price / this.packageSize;
  } else {
    this.pum = 0;
  }
  next();
});
```

**Example Usage**:
```typescript
// Product A: 500g rice at $12,000
{ price: 12000, packageSize: 500, umd: "gramos" }
// → pum = 24 (pesos per gram)

// Product B: 1kg (1000g) rice at $20,000
{ price: 20000, packageSize: 1000, umd: "gramos" }
// → pum = 20 (pesos per gram)

// Result: Product B is more economical (lower PUM)
```

**Business Rules**:
- PUM is automatically calculated on save/update
- Only calculated when `packageSize > 0` to prevent division by zero
- PUM helps users identify the most economical option
- Frontend displays PUM as badge (e.g., "$20/g")

**Purchase Enrichment**:
When creating a purchase, the system automatically enriches items with product catalog data:
```typescript
// Purchase item can reference product
{ productId: "abc123", quantity: 2 }
// → Service enriches with: price, packageSize, pum, umd, marca, barcode, categoria

// Or create manually with all fields
{ name: "Arroz", price: 20000, packageSize: 1000, umd: "gramos", quantity: 1 }
// → System searches catalog for auto-sync (barcode → name+marca+umd → create new)
```
