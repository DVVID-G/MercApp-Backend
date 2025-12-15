# Product Identification Algorithm

## Overview

The product sync algorithm ensures that products from purchases are automatically cataloged while avoiding duplicates and maintaining price consistency.

## Algorithm Flow

```typescript
function findOrCreateProduct(item: PurchaseItem): Promise<Product> {
  // Step 1: Search by barcode (PRIMARY method)
  if (item.barcode) {
    const product = await findByBarcode(item.barcode);
    if (product) {
      return { product, priceChanged: product.price !== item.price };
    }
  }
  
  // Step 2: Search by name + brand + UMD (SECONDARY method)
  const product = await findByNameBrandUmd(
    item.name,
    item.marca,
    item.umd
  );
  if (product) {
    return { product, priceChanged: product.price !== item.price };
  }
  
  // Step 3: Create new product (FALLBACK)
  const newProduct = await createProduct({
    name: item.name,
    marca: item.marca,
    price: item.price,
    packageSize: item.packageSize,
    umd: item.umd,
    barcode: item.barcode,
    categoria: item.categoria
  });
  
  return { product: newProduct, priceChanged: false };
}
```

## Identification Methods

### Method 1: Barcode Match (Highest Priority)

**When**: Item has a barcode value  
**How**: Direct unique lookup on `barcode` field  
**Index**: Single unique index on `barcode`

```javascript
db.products.findOne({ barcode: "7891234567890" })
```

**Advantages:**
- Fast O(1) lookup via unique index
- 100% accurate - no false positives
- Industry standard identifier

**Limitations:**
- Not all products have barcodes
- User must enter/scan barcode

---

### Method 2: Name + Brand + UMD Match (Medium Priority)

**When**: No barcode OR barcode not found  
**How**: Compound match on three fields  
**Index**: Compound index on `(name, marca, umd)`

```javascript
db.products.findOne({
  name: { $regex: new RegExp('^' + escapeRegex(item.name) + '$', 'i') },
  marca: { $regex: new RegExp('^' + escapeRegex(item.marca) + '$', 'i') },
  umd: item.umd
})
```

**Advantages:**
- Works without barcode
- Catches common user re-entries
- Case-insensitive matching

**Limitations:**
- Typos create duplicates
- Slight variations miss matches
- Slower than barcode lookup

---

### Method 3: Create New Product (Fallback)

**When**: No matches found  
**How**: Insert new document with all required fields  
**Validation**: Zod schema ensures data integrity

```typescript
const product = await Product.create({
  name: item.name,
  marca: item.marca,
  price: item.price,
  packageSize: item.packageSize,
  umd: item.umd,
  barcode: item.barcode,
  categoria: item.categoria,
  pum: item.price / item.packageSize
});
```

**Advantages:**
- Never blocks purchase creation
- Grows catalog organically
- All fields validated

**Limitations:**
- May create duplicates if user inconsistent
- No similarity detection (fuzzy match)

---

## Price Tracking

When a product is found (Method 1 or 2), the algorithm compares prices:

```typescript
const priceChanged = product.price !== item.price;

if (priceChanged) {
  // Frontend handles this with a modal prompt:
  // - "Use catalog price" (default)
  // - "Update catalog with new price"
  // - "Use new price for this purchase only"
}
```

### Price Update Flow

1. **Backend**: Returns `{ product, priceChanged: true }`
2. **Frontend**: Shows modal if `priceChanged === true`
3. **User Choice**:
   - **Use catalog**: Apply `product.price` to purchase item
   - **Update catalog**: Call `PUT /products/:id` with new price
   - **One-time use**: Apply `item.price` without updating catalog

---

## Duplicate Prevention Strategy

### Primary Strategy: Barcode Enforcement

- Encourage barcode entry for all products
- Unique index prevents duplicate barcodes
- Barcode scanner integration (future)

### Secondary Strategy: Compound Index

- (name, marca, umd) tuple must be unique
- Case-insensitive comparison
- Exact match required (no fuzzy logic yet)

### User Experience Considerations

- **Search before create**: Autocomplete helps users find existing products
- **Barcode scanner**: Mobile integration for instant lookup
- **Smart defaults**: Pre-fill fields from similar products

---

## Performance Characteristics

### Lookup Times (Indexed Queries)

| Method | Index Type | Avg Time | Complexity |
|--------|-----------|----------|-----------|
| Barcode | Unique | ~1ms | O(1) |
| Name+Brand+UMD | Compound | ~5ms | O(log n) |
| Text Search | Text | ~20ms | O(n/k) |

### Catalog Growth Impact

- Up to 10,000 products: Negligible impact
- 10,000 - 100,000 products: 2-3x slower compound lookups
- 100,000+ products: Consider partitioning or caching

**Mitigation**: MongoDB indexes scale well; most users won't exceed 10k products.

---

## Error Scenarios

### Scenario 1: Invalid Barcode Format

**Input**: `barcode: "abc123"` (non-numeric)  
**Validation**: Zod schema requires min 8 digits  
**Result**: 400 Bad Request with validation error

### Scenario 2: Duplicate Barcode

**Input**: Barcode already exists in catalog  
**Detection**: Unique index constraint violation  
**Result**: Product reused (not error)

### Scenario 3: Missing Required Fields

**Input**: Item without `marca` field  
**Validation**: Zod schema enforces all fields  
**Result**: 400 Bad Request with clear error message

### Scenario 4: Price Conflicts

**Input**: Existing product $100, user enters $120  
**Detection**: Simple comparison in service layer  
**Result**: Frontend modal prompts user for resolution

---

## Future Enhancements

### Fuzzy Matching (Planned)

Use Levenshtein distance or TF-IDF for similarity:

```javascript
// Pseudo-code
const similarProducts = await Product.find({
  $text: { $search: item.name }
}).limit(5);

const bestMatch = similarProducts.find(p => 
  levenshtein(p.name, item.name) < 3 &&
  p.marca === item.marca
);
```

### Machine Learning (Long-term)

- Train model on user's purchase history
- Predict likely product matches
- Auto-suggest corrections for typos

### Barcode Validation API (External)

- Verify barcode against international databases
- Fetch product metadata (name, brand, category)
- Reduce manual entry errors

---

## Testing Strategy

### Unit Tests

```typescript
describe('findOrCreateProduct', () => {
  it('should find product by barcode', async () => {
    const product = await findOrCreateProduct({
      barcode: '7891234567890',
      // ... other fields
    });
    expect(product._id).toBeDefined();
  });

  it('should find product by name+brand+umd', async () => {
    // Test case without barcode
  });

  it('should create new product when no match', async () => {
    // Test case with unique product
  });

  it('should detect price changes', async () => {
    // Test priceChanged flag
  });
});
```

### Integration Tests

- Test full purchase creation flow
- Verify catalog grows correctly
- Ensure no duplicate products created
- Validate price update scenarios

---

## Monitoring & Analytics

### Key Metrics

- **Duplicate Rate**: % of products with similar name+brand+umd
- **Catalog Growth**: New products per week
- **Barcode Coverage**: % of products with barcodes
- **Price Update Frequency**: How often users update prices

### Queries for Analysis

```javascript
// Find potential duplicates
db.products.aggregate([
  {
    $group: {
      _id: { name: "$name", marca: "$marca", umd: "$umd" },
      count: { $sum: 1 }
    }
  },
  { $match: { count: { $gt: 1 } } }
]);

// Barcode coverage
db.products.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      withBarcode: {
        $sum: { $cond: [{ $ne: ["$barcode", ""] }, 1, 0] }
      }
    }
  }
]);
```

---

## References

- [MongoDB Text Search](https://docs.mongodb.com/manual/text-search/)
- [Compound Indexes](https://docs.mongodb.com/manual/core/index-compound/)
- [Unique Indexes](https://docs.mongodb.com/manual/core/index-unique/)
