# User Guide: Product Search & Management

## Overview

MercApp helps you track your grocery purchases by automatically syncing products to your personal catalog. This guide explains how to use the product search, creation, and price update features.

---

## Table of Contents

1. [Searching for Products](#searching-for-products)
2. [Creating New Products](#creating-new-products)
3. [Barcode Scanning](#barcode-scanning)
4. [Price Updates](#price-updates)
5. [Frequently Asked Questions](#frequently-asked-questions)
6. [Troubleshooting](#troubleshooting)

---

## Searching for Products

### Basic Search

When creating a new purchase, use the search bar at the top of the screen:

1. **Start typing** the product name or brand
   - Minimum 2 characters required
   - Autocomplete appears after a short delay

2. **Review suggestions**
   - Product name in bold
   - Brand and price shown below
   - PUM (price per unit) displayed for easy comparison

3. **Select a product**
   - Tap the product card
   - Product is added to your purchase list
   - Quantity defaults to 1 (can be changed later)

**Example**:
```
Search: "arroz"
Results:
  📦 Arroz Diana - Diana - $20,000
     PUM: $20.00/gramo
  
  📦 Arroz Roa - Roa - $18,500
     PUM: $18.50/gramo
```

### Search by Barcode

For faster entry, use the barcode search:

1. **Tap the barcode icon** 🔍 next to the search bar
2. **Enter the barcode manually** or scan with camera (if enabled)
3. **Automatic lookup**:
   - If found: Product details appear instantly
   - If not found: Option to create new product with barcode pre-filled

**Barcode Format Support**:
- ✅ EAN-13 (13 digits): `7891234567890`
- ✅ UPC-A (12 digits): `012345678905`
- ✅ EAN-8 (8 digits): `12345678`
- ❌ QR codes not supported

---

## Creating New Products

### When to Create

Create a new product when:
- ✅ Search returns no results
- ✅ Product has a unique barcode not in the system
- ✅ Brand/package size differs from existing products

### Manual Creation Flow

1. **Tap "Create New Product"** button (appears when search has no results)

2. **Fill required fields**:
   - **Product Name** *
     - Example: `Arroz Diana`
     - Tips: Use full name from package

   - **Brand** *
     - Example: `Diana`
     - Tips: Official brand name, not store name

   - **Price** *
     - Example: `20000` (no commas or symbols)
     - Tips: Total price for the package

   - **Package Size** *
     - Example: `1000`
     - Tips: Number only (unit selected separately)

   - **Unit of Measure (UMD)** *
     - Dropdown: `gramos`, `litros`, `unidades`, `kilogramos`, `mililitros`
     - Tips: Match package label exactly

   - **Category** *
     - Dropdown: `Granos`, `Lácteos`, `Carnes`, `Bebidas`, etc.
     - Tips: Choose closest match

   - **Barcode** (optional but recommended)
     - Example: `7891234567890`
     - Tips: Scan or type from package

3. **Review calculated PUM**
   - Automatically shows price per unit
   - Example: `$20.00/gramo` if price=20000, size=1000, umd=gramos

4. **Tap "Create Product"**
   - Product saved to catalog
   - Automatically added to current purchase

### Field Validation

| Field | Rules | Example Valid | Example Invalid |
|-------|-------|---------------|-----------------|
| Name | 2-100 chars | `Arroz Diana` | `A` (too short) |
| Brand | 2-50 chars | `Diana` | `D` (too short) |
| Price | > 0 | `20000` | `0`, `-100` |
| Package Size | > 0 | `1000` | `0`, `abc` |
| UMD | Fixed list | `gramos` | `g`, `grams` |
| Category | Fixed list | `Granos` | `Grains` |
| Barcode | 8/12/13 digits | `7891234567890` | `123` (too short) |

---

## Barcode Scanning

### Supported Devices

- ✅ Android 8.0+
- ✅ iOS 12.0+
- ✅ Requires camera permission

### How to Scan

1. **Tap barcode icon** 🔍 in search or create product screen
2. **Allow camera access** (first time only)
3. **Point camera at barcode**
   - Hold phone steady
   - Ensure good lighting
   - Keep barcode flat and visible
4. **Auto-detect**
   - Green border when detected
   - Vibration feedback (if enabled)
   - Automatic search or field fill

### Troubleshooting Scanning

| Issue | Solution |
|-------|----------|
| Camera won't open | Check app permissions in settings |
| Barcode not detected | Clean camera lens, improve lighting |
| Wrong barcode read | Scan again or enter manually |
| Camera blurry | Hold phone still, tap to focus |

---

## Price Updates

### Detecting Price Changes

When you add a product to a purchase with a different price than the catalog:

1. **Price Update Modal appears**
   - Shows old catalog price
   - Shows new price you entered
   - Displays price difference (increase/decrease)

**Example Modal**:
```
⚠️ Price Change Detected

Product: Arroz Diana
Old Price: $20,000
New Price: $21,000
Difference: +$1,000 (5%)

What would you like to do?
```

### Update Options

#### Option 1: Update Catalog (Recommended)
```
[Update Catalog Price]
```
- ✅ Updates price in catalog permanently
- ✅ All future purchases use new price
- ✅ Maintains price history
- **Use when**: Price changed at the store

#### Option 2: Use Catalog Price
```
[Use Catalog Price]
```
- ✅ Replaces your entered price with catalog price
- ✅ Keeps catalog unchanged
- **Use when**: You made a typo or price hasn't changed

#### Option 3: Use Once
```
[Use This Price for This Purchase Only]
```
- ✅ Keeps your entered price for this purchase
- ✅ Catalog remains unchanged
- **Use when**: Temporary discount, special offer, or different store

### Price History

View past prices for any product:

1. **Open product details** (tap product in catalog)
2. **Scroll to "Price History"** section
3. **Review timeline**:
   ```
   Dec 15, 2025: $21,000
   Nov 30, 2025: $20,500
   Nov 1, 2025: $20,000
   Oct 15, 2025: $19,500
   ```
4. **See trend**:
   - 📈 Price increasing over time
   - 📉 Price decreasing
   - ➡️ Price stable

---

## Frequently Asked Questions

### Q: Can I edit a product after creating it?

**A**: Yes! 
1. Go to **Catalog** tab
2. Tap the product
3. Tap **Edit** button
4. Update any field
5. Tap **Save Changes**

### Q: How do I delete a product?

**A**: Products with purchase history cannot be deleted (to maintain data integrity). Products never used in purchases can be deleted from the Edit screen.

### Q: What if I scan the wrong barcode?

**A**: 
1. Clear the barcode field
2. Tap barcode icon again to rescan
3. Or manually type the correct barcode

### Q: Can I have two products with the same name?

**A**: Yes, if they differ in:
- Brand
- Package size
- Unit of measure

**Example**:
```
✅ Arroz Diana - 1000g (Diana brand)
✅ Arroz Diana - 500g (Diana brand)
✅ Arroz - 1000g (Roa brand)
```

### Q: Why does autocomplete show products I don't recognize?

**A**: The catalog is personal - it only shows products YOU have created or purchased. If you see unfamiliar products, check if:
- Another user on your account created them
- You accidentally created duplicates
- Product was auto-created from a purchase

### Q: Can I merge duplicate products?

**A**: Not currently supported. Best practice:
1. Stop using the duplicate
2. Edit the correct product's details if needed
3. Delete the duplicate if it has no purchase history

### Q: What happens if two products have the same barcode?

**A**: Barcodes are unique in the system. If you try to create a product with an existing barcode, you'll see:
```
❌ Error: A product with barcode 7891234567890 already exists.
   
[View Existing Product]
```

---

## Troubleshooting

### Search Not Working

**Symptoms**: Autocomplete doesn't appear, or results are empty

**Solutions**:
1. ✅ Type at least 2 characters
2. ✅ Wait 0.5 seconds after typing
3. ✅ Check internet connection
4. ✅ Try different search terms (brand name instead of product name)
5. ✅ Clear search and try again

### Product Not Saving

**Symptoms**: "Create Product" button doesn't work, error messages appear

**Solutions**:
1. ✅ Ensure all required fields (*) are filled
2. ✅ Check field validation errors (red borders)
3. ✅ Verify price and package size are numbers > 0
4. ✅ Check barcode format (8/12/13 digits)
5. ✅ Ensure internet connection is stable
6. ✅ Try again - it may be a temporary server issue

### Price Update Modal Won't Close

**Symptoms**: Modal stuck on screen, can't interact with app

**Solutions**:
1. ✅ Choose one of the three options (buttons may be off-screen - scroll down)
2. ✅ Tap outside the modal to cancel
3. ✅ Force close app and reopen (last resort)

### Duplicate Products Appearing

**Symptoms**: Same product appears multiple times in catalog/autocomplete

**Causes**:
- Name/brand typos (`Diana` vs `Diana S.A.`)
- Different package sizes (`1000g` vs `1kg`)
- Missing vs present barcode
- Upper/lowercase differences

**Prevention**:
1. ✅ Always search before creating
2. ✅ Use exact brand names
3. ✅ Scan barcode when possible
4. ✅ Double-check spelling

**Fix**:
1. ✅ Use the correct product going forward
2. ✅ Edit incorrect products to match
3. ✅ Delete duplicates with no purchase history

---

## Tips for Best Experience

### ✅ Do's

- ✅ Search before creating (avoid duplicates)
- ✅ Scan barcodes when available
- ✅ Use consistent brand names
- ✅ Update catalog prices when items go up/down
- ✅ Review autocomplete suggestions before creating
- ✅ Use "Update Catalog" for permanent price changes

### ❌ Don'ts

- ❌ Don't create duplicates (search first!)
- ❌ Don't use store names as brands (`Éxito` ❌, `Diana` ✅)
- ❌ Don't mix units (`1kg` vs `1000g` - pick one)
- ❌ Don't leave barcode blank if available
- ❌ Don't ignore price update modals (choose an option)

---

## Keyboard Shortcuts (Web/Desktop)

| Action | Shortcut |
|--------|----------|
| Focus search | `Ctrl + K` or `Cmd + K` |
| Create new product | `Ctrl + N` or `Cmd + N` |
| Save product | `Ctrl + S` or `Cmd + S` |
| Cancel/Close | `Esc` |
| Next field | `Tab` |
| Previous field | `Shift + Tab` |

---

## Getting Help

If you encounter issues not covered here:

1. **Check the app**:
   - Settings → Help & Support
   - In-app chat with support team

2. **Contact support**:
   - Email: support@mercapp.com
   - Response time: 24-48 hours

3. **Report a bug**:
   - Settings → Report Bug
   - Include screenshots if possible

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Related Guides**: Developer Guide, API Documentation, Troubleshooting Guide
