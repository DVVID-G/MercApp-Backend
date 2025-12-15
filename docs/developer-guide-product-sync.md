# Developer Guide: Product Sync Flow

## Overview

This guide explains how the product synchronization system works and how to extend or modify it.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ CreatePurchase│  │ProductSearch │  │ ManualProductForm     │ │
│  │  Component    │  │   Input      │  │                       │ │
│  └───────┬──────┘  └──────┬───────┘  └──────────┬────────────┘ │
│          │                 │                      │              │
│          └─────────────────┴──────────────────────┘              │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (Express)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           POST /purchases (create purchase)              │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │      Purchase Controller (validation + orchestration)     │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │         Purchase Service (business logic)                 │  │
│  │  • Enriches items with product data                       │  │
│  │  • Calls Product Service for catalog sync                 │  │
│  │  • Calculates purchase total                              │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │         Product Service (catalog management)              │  │
│  │  • findOrCreateFromPurchaseItem()                         │  │
│  │  • findByBarcode()                                        │  │
│  │  • findByNameBrandUmd()                                   │  │
│  │  • createProduct()                                        │  │
│  │  • updateProduct()                                        │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ Mongoose
                              ▼
                      ┌────────────────┐
                      │    MongoDB     │
                      │ • products     │
                      │ • purchases    │
                      └────────────────┘
```

## Core Components

### 1. Product Service (`src/services/product.service.ts`)

#### `findOrCreateFromPurchaseItem(item)`

**Purpose**: Main entry point for product sync logic

**Flow**:
```typescript
async function findOrCreateFromPurchaseItem(
  item: PurchaseItemInput
): Promise<{ product: Product; priceChanged: boolean }> {
  // 1. Try barcode lookup
  if (item.barcode) {
    const product = await findByBarcode(item.barcode);
    if (product) {
      return { 
        product, 
        priceChanged: product.price !== item.price 
      };
    }
  }

  // 2. Try name+brand+umd lookup
  const product = await findByNameBrandUmd(
    item.name,
    item.marca,
    item.umd
  );
  if (product) {
    return { 
      product, 
      priceChanged: product.price !== item.price 
    };
  }

  // 3. Create new product
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

**Returns**: 
- `product`: Found or created Product document
- `priceChanged`: Boolean indicating price mismatch

---

#### `findByBarcode(barcode)`

**Purpose**: Exact barcode lookup

```typescript
async function findByBarcode(
  barcode: string
): Promise<Product | null> {
  return await Product.findOne({ barcode }).lean();
}
```

**Index Used**: `{ barcode: 1 }` (unique)

---

#### `findByNameBrandUmd(name, marca, umd)`

**Purpose**: Fuzzy name+brand+umd lookup

```typescript
async function findByNameBrandUmd(
  name: string,
  marca: string,
  umd: string
): Promise<Product | null> {
  return await Product.findOne({
    name: { $regex: new RegExp('^' + escapeRegex(name) + '$', 'i') },
    marca: { $regex: new RegExp('^' + escapeRegex(marca) + '$', 'i') },
    umd: umd
  }).lean();
}
```

**Index Used**: `{ name: 1, marca: 1, umd: 1 }` (compound)

---

### 2. Purchase Service (`src/services/purchase.service.ts`)

#### `createPurchase(userId, items)`

**Flow**:
```typescript
async function createPurchase(
  userId: string,
  items: PurchaseItemInput[]
): Promise<Purchase> {
  // 1. Enrich items with catalog data
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const { product, priceChanged } = 
        await productService.findOrCreateFromPurchaseItem(item);

      return {
        productId: product._id,
        name: product.name,
        marca: product.marca,
        price: product.price, // Use catalog price
        quantity: item.quantity,
        packageSize: product.packageSize,
        umd: product.umd,
        barcode: product.barcode,
        categoria: product.categoria,
        pum: product.pum,
        priceChanged // Pass to frontend for modal
      };
    })
  );

  // 2. Calculate total
  const total = enrichedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 3. Save purchase
  const purchase = await Purchase.create({
    userId,
    items: enrichedItems,
    total
  });

  return purchase;
}
```

---

### 3. Frontend Components

#### ProductSearchInput Component

**Purpose**: Provides autocomplete search for existing products

```typescript
function ProductSearchInput({
  onProductSelect,
  onManualCreate
}: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // Debounced search
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(async () => {
        const results = await searchProducts(query);
        setSuggestions(results);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  // Handle selection
  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or barcode..."
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map(product => (
            <li onClick={() => handleSelect(product)}>
              {product.name} - {product.marca} - ${product.price}
            </li>
          ))}
        </ul>
      )}
      {query && suggestions.length === 0 && (
        <button onClick={() => onManualCreate(query)}>
          Create new product
        </button>
      )}
    </div>
  );
}
```

---

#### CreatePurchase Component

**Purpose**: Main purchase creation flow with product sync

```typescript
function CreatePurchase() {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [priceUpdateModal, setPriceUpdateModal] = useState(null);

  const handleAddProduct = async (product: Product) => {
    // Check if product already in list
    const existing = items.find(i => i.productId === product._id);
    if (existing) {
      existing.quantity += 1;
      setItems([...items]);
      return;
    }

    // Add new item
    setItems([...items, {
      productId: product._id,
      name: product.name,
      marca: product.marca,
      price: product.price,
      quantity: 1,
      packageSize: product.packageSize,
      umd: product.umd,
      barcode: product.barcode,
      categoria: product.categoria,
      pum: product.pum
    }]);
  };

  const handleSavePurchase = async () => {
    try {
      const response = await createPurchase({ items });
      
      // Check for price changes
      response.items.forEach(item => {
        if (item.priceChanged) {
          setPriceUpdateModal({
            product: item,
            oldPrice: item.price,
            newPrice: items.find(i => i.productId === item.productId).price
          });
        }
      });

      toast.success('✅ Purchase saved successfully');
      // Navigate to purchase history
    } catch (error) {
      toast.error('❌ Failed to save purchase');
    }
  };

  return (
    <div>
      <ProductSearchInput 
        onProductSelect={handleAddProduct}
        onManualCreate={(name) => {
          // Open manual product form
        }}
      />
      
      <PurchaseItemsList items={items} />
      
      <button onClick={handleSavePurchase}>
        Save Purchase
      </button>

      {priceUpdateModal && (
        <PriceUpdateModal {...priceUpdateModal} />
      )}
    </div>
  );
}
```

---

## Data Flow Examples

### Example 1: New Product with Barcode

**User Action**: Scans barcode `7891234567890`

```typescript
// 1. Frontend searches
const product = await searchProductByBarcode('7891234567890');
// Result: null (not in catalog)

// 2. User fills manual form
const newProduct = {
  name: "Arroz Diana",
  marca: "Diana",
  price: 20000,
  packageSize: 1000,
  umd: "gramos",
  barcode: "7891234567890",
  categoria: "Granos"
};

// 3. User adds to purchase
// Purchase service calls findOrCreateFromPurchaseItem()

// 4. Backend creates product in catalog
const createdProduct = await Product.create(newProduct);

// 5. Purchase saved with productId reference
const purchase = await Purchase.create({
  userId: user._id,
  items: [{
    productId: createdProduct._id,
    name: createdProduct.name,
    price: createdProduct.price,
    quantity: 2,
    // ... other fields
  }],
  total: 40000
});
```

---

### Example 2: Existing Product (Price Changed)

**User Action**: Searches "Arroz Diana"

```typescript
// 1. Autocomplete finds product
const products = await searchProducts("Arroz Diana");
// Result: [{ _id: '...', name: 'Arroz Diana', price: 20000, ... }]

// 2. User selects product and changes price to 21000
const item = {
  productId: products[0]._id,
  quantity: 1,
  price: 21000 // User-entered price differs
};

// 3. Purchase service detects price change
const { product, priceChanged } = 
  await findOrCreateFromPurchaseItem(item);
// Result: priceChanged = true

// 4. Frontend shows price update modal
<PriceUpdateModal
  product={product}
  catalogPrice={20000}
  newPrice={21000}
  onUpdate={(action) => {
    if (action === 'update-catalog') {
      await updateProduct(product._id, { price: 21000 });
    } else if (action === 'use-catalog') {
      item.price = 20000;
    }
    // 'use-once' keeps item.price = 21000
  }}
/>
```

---

## Extending the System

### Adding New Search Methods

1. **Add service function**:

```typescript
// src/services/product.service.ts
export async function searchByCategory(
  categoria: string
): Promise<Product[]> {
  return await Product.find({ categoria })
    .sort({ name: 1 })
    .limit(50)
    .lean();
}
```

2. **Add API endpoint**:

```typescript
// src/routes/products.routes.ts
router.get('/category/:categoria', 
  authMiddleware,
  async (req, res, next) => {
    try {
      const products = await productService.searchByCategory(
        req.params.categoria
      );
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
);
```

3. **Update frontend service**:

```typescript
// frontend/src/services/products.service.ts
export async function getProductsByCategory(
  categoria: string
): Promise<Product[]> {
  const response = await api.get(`/products/category/${categoria}`);
  return response.data;
}
```

---

### Adding Price History

1. **Update Product model**:

```typescript
interface IPriceHistory {
  price: number;
  changedAt: Date;
  changedBy?: string; // userId
}

interface IProduct {
  // ... existing fields
  priceHistory: IPriceHistory[];
}
```

2. **Add pre-save hook**:

```typescript
ProductSchema.pre('save', function(next) {
  if (this.isModified('price')) {
    this.priceHistory.push({
      price: this.price,
      changedAt: new Date()
    });
  }
  next();
});
```

3. **Add analytics endpoint**:

```typescript
router.get('/:id/price-history',
  authMiddleware,
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id)
        .select('priceHistory')
        .lean();
      res.json(product?.priceHistory || []);
    } catch (error) {
      next(error);
    }
  }
);
```

---

## Testing

### Unit Tests for Product Service

```typescript
describe('Product Service', () => {
  describe('findOrCreateFromPurchaseItem', () => {
    it('should find product by barcode', async () => {
      // Arrange
      const existingProduct = await Product.create({
        name: 'Test Product',
        marca: 'Test Brand',
        price: 100,
        barcode: '1234567890',
        // ...
      });

      // Act
      const result = await findOrCreateFromPurchaseItem({
        name: 'Test Product',
        marca: 'Test Brand',
        price: 100,
        barcode: '1234567890',
        quantity: 1,
        // ...
      });

      // Assert
      expect(result.product._id).toEqual(existingProduct._id);
      expect(result.priceChanged).toBe(false);
    });

    it('should detect price changes', async () => {
      // Arrange
      await Product.create({
        name: 'Test Product',
        barcode: '1234567890',
        price: 100,
        // ...
      });

      // Act
      const result = await findOrCreateFromPurchaseItem({
        barcode: '1234567890',
        price: 120, // Different price
        // ...
      });

      // Assert
      expect(result.priceChanged).toBe(true);
    });

    it('should create new product if not found', async () => {
      // Act
      const result = await findOrCreateFromPurchaseItem({
        name: 'New Product',
        marca: 'New Brand',
        price: 100,
        barcode: '9999999999',
        // ...
      });

      // Assert
      expect(result.product._id).toBeDefined();
      expect(result.priceChanged).toBe(false);
      
      const created = await Product.findOne({ 
        barcode: '9999999999' 
      });
      expect(created).toBeDefined();
    });
  });
});
```

---

## Debugging

### Enable Debug Logs

```typescript
// src/services/product.service.ts
import debug from 'debug';
const log = debug('app:product-service');

export async function findOrCreateFromPurchaseItem(item) {
  log('Processing item:', item);
  
  if (item.barcode) {
    log('Searching by barcode:', item.barcode);
    const product = await findByBarcode(item.barcode);
    if (product) {
      log('Found by barcode:', product._id);
      return { product, priceChanged: product.price !== item.price };
    }
    log('Not found by barcode');
  }
  
  // ... rest of logic
}
```

### Run with debug logs

```bash
DEBUG=app:* npm run dev
```

---

## Performance Optimization

### 1. Batch Product Lookups

Instead of sequential lookups:

```typescript
// ❌ Slow (N+1 queries)
for (const item of items) {
  const { product } = await findOrCreateFromPurchaseItem(item);
  enrichedItems.push({ ...item, productId: product._id });
}

// ✅ Fast (parallel queries)
const results = await Promise.all(
  items.map(item => findOrCreateFromPurchaseItem(item))
);
```

### 2. Use Lean Queries

```typescript
// ❌ Slow (full Mongoose documents)
const product = await Product.findOne({ barcode });

// ✅ Fast (plain objects)
const product = await Product.findOne({ barcode }).lean();
```

### 3. Add Projection

```typescript
// ❌ Returns all fields
const products = await Product.find({ categoria });

// ✅ Returns only needed fields
const products = await Product.find({ categoria })
  .select('name marca price packageSize umd')
  .lean();
```

---

## Common Issues

### Issue 1: Duplicate Products Created

**Cause**: Typos in name/brand or missing barcode  
**Solution**: Implement fuzzy matching or barcode validation

### Issue 2: Slow Autocomplete

**Cause**: No text index or large result set  
**Solution**: Add text index and limit results

```typescript
// Add index
ProductSchema.index({ name: 'text', marca: 'text' });

// Limit results
const products = await Product.find({ $text: { $search: query } })
  .limit(10)
  .lean();
```

### Issue 3: Price Update Conflicts

**Cause**: Concurrent updates  
**Solution**: Use optimistic locking

```typescript
ProductSchema.plugin(require('mongoose-optimistic-locking'));
```

---

## References

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Zod Validation](https://zod.dev/)
