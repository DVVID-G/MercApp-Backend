# Troubleshooting Guide: Product Sync & Catalog

## Overview

This guide helps diagnose and resolve common issues with the product synchronization and catalog features.

---

## Table of Contents

1. [Product Creation Issues](#product-creation-issues)
2. [Search & Autocomplete Problems](#search--autocomplete-problems)
3. [Barcode Scanning Issues](#barcode-scanning-issues)
4. [Price Sync Conflicts](#price-sync-conflicts)
5. [Duplicate Products](#duplicate-products)
6. [Performance Issues](#performance-issues)
7. [Database Errors](#database-errors)
8. [API Error Codes](#api-error-codes)

---

## Product Creation Issues

### Issue 1.1: "Product validation failed: marca is required"

**Symptoms**:
```json
{
  "error": "Product validation failed: marca: Path `marca` is required."
}
```

**Cause**: Missing `marca` field in product creation request

**Resolution**:
```typescript
// ❌ WRONG
const product = {
  name: "Arroz Diana",
  price: 20000,
  packageSize: 1000,
  umd: "gramos",
  barcode: "7891234567890",
  categoria: "Granos"
  // Missing marca
};

// ✅ CORRECT
const product = {
  name: "Arroz Diana",
  marca: "Diana",  // Required field
  price: 20000,
  packageSize: 1000,
  umd: "gramos",
  barcode: "7891234567890",
  categoria: "Granos"
};
```

**Prevention**: Always validate input on frontend before API call

---

### Issue 1.2: "E11000 duplicate key error: barcode"

**Symptoms**:
```json
{
  "error": "E11000 duplicate key error collection: mercapp.products index: barcode_unique_idx dup key: { barcode: \"7891234567890\" }"
}
```

**Cause**: Attempting to create product with existing barcode

**Resolution**:

**Step 1**: Find existing product
```javascript
db.products.findOne({ barcode: "7891234567890" });
```

**Step 2**: Options:
- **Option A**: Use existing product (preferred)
- **Option B**: If truly different product, update existing barcode:
```javascript
db.products.updateOne(
  { barcode: "7891234567890" },
  { $set: { barcode: "7891234567890-ALT" } }
);
```
- **Option C**: Generate new barcode for new product:
```javascript
const newBarcode = `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

**Prevention**: 
```typescript
// Check barcode before creating
const existing = await Product.findOne({ barcode: newProduct.barcode });
if (existing) {
  // Use existing or prompt user
  return { product: existing, isNew: false };
}
```

---

### Issue 1.3: Product Created But Not Appearing in Search

**Symptoms**:
- Product created successfully (201 response)
- Not appearing in autocomplete
- Not found by barcode search

**Diagnosis**:

**Step 1**: Verify product exists
```javascript
db.products.findOne({ barcode: "7891234567890" });
```

**Step 2**: Check text index
```javascript
db.products.getIndexes();
// Should include name_marca_text_idx
```

**Step 3**: Test text search directly
```javascript
db.products.find({ $text: { $search: "Arroz Diana" } });
```

**Resolution**:

**If index missing**:
```javascript
db.products.createIndex(
  { name: "text", marca: "text" },
  {
    name: "name_marca_text_idx",
    weights: { name: 10, marca: 5 },
    default_language: "spanish"
  }
);
```

**If index exists but not working**:
```javascript
// Rebuild text index
db.products.dropIndex("name_marca_text_idx");
db.products.createIndex(
  { name: "text", marca: "text" },
  {
    name: "name_marca_text_idx",
    weights: { name: 10, marca: 5 },
    default_language: "spanish"
  }
);
```

**If product name/marca has special characters**:
```javascript
// Check for non-searchable characters
db.products.findOne({ _id: ObjectId("product_id") });
// Look for: ™, ®, emojis, etc.

// Update if needed
db.products.updateOne(
  { _id: ObjectId("product_id") },
  { $set: { name: "Cleaned Name" } }
);
```

---

## Search & Autocomplete Problems

### Issue 2.1: Autocomplete Returns No Results

**Symptoms**:
- User types in search box
- No suggestions appear
- Network request succeeds (200 OK)

**Diagnosis**:

**Frontend Console**:
```javascript
// Check API response
fetch('/products/search?q=arroz')
  .then(r => r.json())
  .then(console.log);
// Expected: Array of products
// Actual: Empty array []
```

**Backend Logs**:
```bash
# Enable debug logs
DEBUG=app:product-service npm run dev

# Look for:
app:product-service Searching for: "arroz"
app:product-service Found 0 results
```

**Resolution**:

**Cause A: Search query too short**
```typescript
// ❌ Query < 2 characters ignored
/products/search?q=a

// ✅ Query >= 2 characters
/products/search?q=ar
```

**Cause B: Text index not configured correctly**
```javascript
// Verify index language
db.products.getIndexes().find(i => i.name === "name_marca_text_idx");
// Should have: default_language: "spanish"

// If English (default), Spanish words may not match
// Recreate index with Spanish language
```

**Cause C: Product names don't match search term**
```javascript
// User searches: "leche"
// Products have: "LECHE ENTERA", "leche DESLACTOSADA"
// Text search is case-insensitive but requires word match

// Check actual product names
db.products.find({ name: /leche/i });
```

**Prevention**:
```typescript
// Add fuzzy search fallback
if (results.length === 0) {
  // Try regex search as fallback
  results = await Product.find({
    name: new RegExp(query, 'i')
  }).limit(10);
}
```

---

### Issue 2.2: Autocomplete Too Slow (>2 seconds)

**Symptoms**:
- Autocomplete appears after long delay
- Poor user experience
- Network requests slow in DevTools

**Diagnosis**:

**Check Query Performance**:
```javascript
db.products.find({ $text: { $search: "arroz" } })
  .explain("executionStats");

// Look for:
// - executionTimeMillis > 100ms (bad)
// - totalDocsExamined > 100 (bad)
// - indexName: "name_marca_text_idx" (good)
```

**Resolution**:

**Cause A: No index used (table scan)**
```javascript
// executionStats shows: COLLSCAN

// Create text index
db.products.createIndex({ name: "text", marca: "text" });
```

**Cause B: Too many results returned**
```typescript
// ❌ Returns all matching products
const products = await Product.find({ $text: { $search: query } });

// ✅ Limit results
const products = await Product.find({ $text: { $search: query } })
  .limit(10)  // Only top 10
  .select('name marca price packageSize umd barcode')  // Only needed fields
  .lean();  // Plain objects (faster)
```

**Cause C: Heavy projection (virtual fields)**
```typescript
// ❌ Calculates PUM for all results
const products = await Product.find(...)
  .select('+pum');  // Virtual field triggers calculation

// ✅ Calculate PUM in frontend or add to index
const products = await Product.find(...)
  .select('name marca price packageSize umd barcode');
// Calculate PUM client-side: price / packageSize
```

**Cause D: Network latency**
```bash
# Test API response time
curl -w "@curl-format.txt" -o /dev/null -s \
  "https://api.mercapp.com/products/search?q=arroz"

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n

# Expected:
# time_total < 0.2s
```

---

### Issue 2.3: Search Returns Irrelevant Results

**Symptoms**:
- Searching "arroz" returns "azúcar", "aceite", etc.
- Text search too fuzzy

**Resolution**:

```typescript
// Add text score filtering
const products = await Product.find(
  { $text: { $search: query } },
  { score: { $meta: "textScore" } }
)
  .sort({ score: { $meta: "textScore" } })
  .where('score').gt(0.5)  // Minimum relevance
  .limit(10)
  .lean();
```

---

## Barcode Scanning Issues

### Issue 3.1: Barcode Not Scanning

**Symptoms**:
- Camera opens
- Barcode visible in frame
- No detection/beep

**Diagnosis**:

**Check Camera Permission**:
```javascript
// Browser console
navigator.permissions.query({ name: 'camera' })
  .then(result => console.log(result.state));
// Expected: "granted"
// If "denied", user must re-enable in browser settings
```

**Check Barcode Library**:
```javascript
// Verify library loaded
console.log(window.Html5Qrcode);
// Should be defined
```

**Resolution**:

**Cause A: Poor lighting**
- Use better lighting
- Clean camera lens
- Flatten barcode (no wrinkles)

**Cause B: Unsupported barcode format**
```javascript
// Check supported formats
const config = {
  formatsToSupport: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128
  ]
};
```

**Cause C: Camera resolution too low**
```javascript
// Increase resolution
const config = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.777778,
  // Add high resolution
  videoConstraints: {
    facingMode: "environment",
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
};
```

---

### Issue 3.2: Wrong Barcode Detected

**Symptoms**:
- Scans "7891234567890"
- Detects "789123456789" (missing digit)
- Or detects completely wrong code

**Resolution**:

**Add Checksum Validation**:
```typescript
function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
    return false;
  }

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  
  return checksum === parseInt(barcode[12]);
}

// Use before API call
const scannedBarcode = "7891234567890";
if (!validateEAN13(scannedBarcode)) {
  toast.error("❌ Invalid barcode. Please scan again.");
  return;
}
```

---

## Price Sync Conflicts

### Issue 4.1: Price Update Modal Doesn't Appear

**Symptoms**:
- Product price in catalog: $20,000
- User enters: $21,000
- No price update modal shown
- Purchase saved with catalog price ($20,000)

**Diagnosis**:

**Check Price Change Detection**:
```typescript
// In purchase service
const { product, priceChanged } = 
  await findOrCreateFromPurchaseItem(item);

console.log('Catalog price:', product.price);
console.log('User price:', item.price);
console.log('Price changed:', priceChanged);
// Should log: true
```

**Resolution**:

**Cause A: Price comparison logic wrong**
```typescript
// ❌ WRONG (floating point comparison)
const priceChanged = product.price !== item.price;
// May fail for: 20.00 vs 20

// ✅ CORRECT (integer comparison or epsilon)
const priceChanged = Math.abs(product.price - item.price) > 0.01;
```

**Cause B: Frontend not checking response**
```typescript
// ❌ WRONG
const response = await createPurchase({ items });
// Doesn't check response.items for priceChanged flags

// ✅ CORRECT
const response = await createPurchase({ items });
response.items.forEach(item => {
  if (item.priceChanged) {
    showPriceUpdateModal({
      product: item,
      catalogPrice: item.originalPrice,
      newPrice: item.enteredPrice
    });
  }
});
```

---

### Issue 4.2: "Update Catalog" Button Doesn't Work

**Symptoms**:
- User clicks "Update Catalog Price"
- Modal closes
- Catalog price unchanged

**Diagnosis**:

**Check API Call**:
```javascript
// Frontend console
// Should see: PUT /products/:id
// Status: 200 OK

// Check actual update
fetch('/products/' + productId)
  .then(r => r.json())
  .then(p => console.log('Price:', p.price));
```

**Resolution**:

**Cause A: Missing await**
```typescript
// ❌ WRONG
const handleUpdateCatalog = () => {
  updateProduct(productId, { price: newPrice });
  closeModal();  // Closes before update completes
};

// ✅ CORRECT
const handleUpdateCatalog = async () => {
  await updateProduct(productId, { price: newPrice });
  toast.success('✅ Catalog price updated');
  closeModal();
};
```

**Cause B: Optimistic UI update missing**
```typescript
// Update local state immediately
setProducts(products.map(p => 
  p._id === productId ? { ...p, price: newPrice } : p
));
```

---

## Duplicate Products

### Issue 5.1: Multiple Products with Same Name

**Symptoms**:
```
Catalog shows:
- Arroz Diana (ID: 1, barcode: 789...)
- Arroz Diana (ID: 2, barcode: 790...)
- Arroz Diana (ID: 3, no barcode)
```

**Diagnosis**:

**Find All Duplicates**:
```javascript
db.products.aggregate([
  {
    $group: {
      _id: { name: "$name", marca: "$marca", umd: "$umd" },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
      barcodes: { $push: "$barcode" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]);
```

**Resolution**:

**Step 1**: Identify correct product (usually with barcode)

**Step 2**: Merge purchase history
```javascript
const keepId = ObjectId("correct_product_id");
const deleteIds = [ObjectId("dup1"), ObjectId("dup2")];

// Update all purchases to reference correct product
db.purchases.updateMany(
  { "items.productId": { $in: deleteIds } },
  { $set: { "items.$[elem].productId": keepId } },
  { arrayFilters: [{ "elem.productId": { $in: deleteIds } }] }
);

// Delete duplicates
db.products.deleteMany({ _id: { $in: deleteIds } });
```

**Prevention**:
```typescript
// Enhanced findByNameBrandUmd with fuzzy matching
async function findByNameBrandUmd(name: string, marca: string, umd: string) {
  // Try exact match first
  let product = await Product.findOne({
    name: new RegExp('^' + escapeRegex(name) + '$', 'i'),
    marca: new RegExp('^' + escapeRegex(marca) + '$', 'i'),
    umd: umd
  });

  // Try without accents
  if (!product) {
    product = await Product.findOne({
      name: new RegExp('^' + removeAccents(name) + '$', 'i'),
      marca: new RegExp('^' + removeAccents(marca) + '$', 'i'),
      umd: umd
    });
  }

  return product;
}
```

---

## Performance Issues

### Issue 6.1: API Response Slow (>1 second)

**Symptoms**:
- All product endpoints slow
- Server CPU high
- Database queries slow

**Diagnosis**:

**Enable Query Profiling**:
```javascript
// Enable profiling
db.setProfilingLevel(2);

// Make slow request
// /products/search?q=arroz

// Check slow queries
db.system.profile.find({
  ns: "mercapp.products",
  millis: { $gt: 100 }
}).sort({ ts: -1 }).limit(10);
```

**Resolution**:

**Cause A: Missing indexes**
```javascript
// Check index usage
db.products.find({ $text: { $search: "arroz" } })
  .explain("executionStats")
  .executionStats;

// Look for:
// - executionStages.stage: "TEXT_OR" (good)
// - executionStages.stage: "COLLSCAN" (bad - no index)
```

**Cause B: Large result sets**
```typescript
// ❌ Returns all products
const products = await Product.find();

// ✅ Add pagination
const products = await Product.find()
  .skip(page * limit)
  .limit(limit);
```

**Cause C: Heavy virtual fields**
```typescript
// ❌ PUM calculated for every product
ProductSchema.virtual('pum').get(function() {
  return this.price / this.packageSize;
});

// ✅ Calculate PUM in frontend
// Or add as real field with pre-save hook
```

---

## Database Errors

### Issue 7.1: "MongoServerError: connection timed out"

**Symptoms**:
```
MongoServerError: connection timed out
    at Connection.onMessage
```

**Resolution**:

**Check Connection String**:
```bash
# Test connection
mongosh "mongodb://localhost:27017/mercapp"

# If fails, check:
# 1. MongoDB service running
sudo systemctl status mongod

# 2. Network accessible
ping localhost

# 3. Firewall rules
sudo ufw status
```

**Check Connection Pool**:
```typescript
// Increase pool size
mongoose.connect(uri, {
  maxPoolSize: 50,  // Default: 10
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
});
```

---

### Issue 7.2: "buffering timed out after 10000ms"

**Symptoms**:
```
MongooseError: Operation `products.find()` buffering timed out after 10000ms
```

**Resolution**:

**Ensure Connection Established**:
```typescript
// ❌ WRONG (queries before connection ready)
mongoose.connect(uri);
app.listen(3000);  // Server starts before DB ready

// ✅ CORRECT
mongoose.connect(uri).then(() => {
  console.log('✅ MongoDB connected');
  app.listen(3000);
});
```

---

## API Error Codes

### Complete Error Code Reference

| Code | Message | Cause | Resolution |
|------|---------|-------|-----------|
| 400 | "Validation failed: marca is required" | Missing required field | Add all required fields |
| 400 | "Invalid barcode format" | Barcode not 8/12/13 digits | Validate barcode length |
| 400 | "Price must be greater than 0" | Negative/zero price | Validate price > 0 |
| 404 | "Product not found" | Product ID doesn't exist | Verify product ID |
| 409 | "Product with barcode already exists" | Duplicate barcode | Use existing or change barcode |
| 500 | "Database connection failed" | MongoDB down | Check DB connection |
| 500 | "Internal server error" | Unhandled exception | Check server logs |

### Example Error Handling

```typescript
try {
  const product = await createProduct(data);
  return { success: true, product };
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key (barcode)
    return {
      success: false,
      error: "Product with this barcode already exists",
      code: 409
    };
  } else if (error.name === 'ValidationError') {
    // Mongoose validation
    return {
      success: false,
      error: error.message,
      code: 400,
      fields: Object.keys(error.errors)
    };
  } else {
    // Unknown error
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: "An unexpected error occurred",
      code: 500
    };
  }
}
```

---

## Debugging Checklist

### Frontend Issues

- [ ] Check browser console for errors
- [ ] Verify API calls in Network tab (DevTools)
- [ ] Check localStorage/state for cached data
- [ ] Test in incognito mode (clear cache)
- [ ] Try different browser
- [ ] Check component props/state
- [ ] Verify environment variables (API URL)

### Backend Issues

- [ ] Check server logs (`pm2 logs` or `console.log`)
- [ ] Verify MongoDB connection (`db.runCommand({ ping: 1 })`)
- [ ] Check indexes exist (`db.products.getIndexes()`)
- [ ] Test endpoint directly (Postman/curl)
- [ ] Enable debug logs (`DEBUG=app:* npm run dev`)
- [ ] Check database data (`db.products.findOne(...)`)
- [ ] Verify environment variables (`.env` file)

### Database Issues

- [ ] Check MongoDB service running
- [ ] Verify indexes created
- [ ] Check disk space (`df -h`)
- [ ] Check database size (`db.stats()`)
- [ ] Review slow queries (`db.system.profile`)
- [ ] Check connection pool exhaustion
- [ ] Verify network connectivity

---

## Getting Help

If issue persists after troubleshooting:

### Gather Information

1. **Error message** (full stack trace)
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment** (OS, Node version, MongoDB version)
6. **Logs** (frontend console + backend logs)

### Contact Support

- **Email**: dev-support@mercapp.com
- **Slack**: #mercapp-dev-help
- **GitHub Issues**: https://github.com/mercapp/backend/issues

### Create Minimal Reproduction

```typescript
// Minimal test case
const mongoose = require('mongoose');
const Product = require('./models/product.model');

mongoose.connect('mongodb://localhost:27017/mercapp-test');

async function reproduce() {
  try {
    const product = await Product.create({
      name: "Test",
      marca: "Test",
      price: 100,
      packageSize: 100,
      umd: "gramos",
      barcode: "1234567890123",
      categoria: "Otros"
    });
    console.log('✅ Success:', product);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

reproduce();
```

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Related Docs**: Developer Guide, User Guide, Migration Procedure
