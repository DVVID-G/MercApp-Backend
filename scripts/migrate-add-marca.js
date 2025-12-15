/**
 * Migration Script: Add marca field and update schema for existing products
 * 
 * This script:
 * 1. Backs up the products collection
 * 2. Adds marca="Sin marca" to all existing products
 * 3. Adds updatedAt field to existing products
 * 4. Creates required indexes (barcode unique, name+marca+umd compound, name text)
 * 5. Verifies migration success
 * 
 * Run with: node scripts/migrate-add-marca.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mercapp';
const BACKUP_DIR = path.join(__dirname, 'backups');

async function backupCollection() {
  console.log('📦 Backing up products collection...');
  
  const Product = mongoose.model('Product');
  const products = await Product.find({}).lean();
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(BACKUP_DIR, `products-backup-${timestamp}.json`);
  
  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2));
  console.log(`✅ Backup saved to: ${backupPath}`);
  console.log(`   Products backed up: ${products.length}`);
  
  return backupPath;
}

async function addMarcaField() {
  console.log('\n🔧 Adding marca field to existing products...');
  
  const Product = mongoose.model('Product');
  
  // Find products without marca field
  const productsWithoutMarca = await Product.countDocuments({ marca: { $exists: false } });
  console.log(`   Products without marca: ${productsWithoutMarca}`);
  
  if (productsWithoutMarca === 0) {
    console.log('✅ All products already have marca field');
    return;
  }
  
  // Update products to add marca="Sin marca"
  const result = await Product.updateMany(
    { marca: { $exists: false } },
    { 
      $set: { 
        marca: 'Sin marca',
        updatedAt: new Date()
      } 
    }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} products with marca="Sin marca"`);
}

async function addUpdatedAtField() {
  console.log('\n🔧 Adding updatedAt field to existing products...');
  
  const Product = mongoose.model('Product');
  
  // Find products without updatedAt field
  const productsWithoutUpdatedAt = await Product.countDocuments({ updatedAt: { $exists: false } });
  console.log(`   Products without updatedAt: ${productsWithoutUpdatedAt}`);
  
  if (productsWithoutUpdatedAt === 0) {
    console.log('✅ All products already have updatedAt field');
    return;
  }
  
  // Update products to add updatedAt
  const result = await Product.updateMany(
    { updatedAt: { $exists: false } },
    { $set: { updatedAt: new Date() } }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} products with updatedAt`);
}

async function createIndexes() {
  console.log('\n📑 Creating indexes...');
  
  const db = mongoose.connection.db;
  const productsCollection = db.collection('products');
  
  // List existing indexes
  const existingIndexes = await productsCollection.indexes();
  console.log(`   Existing indexes: ${existingIndexes.map(i => i.name).join(', ')}`);
  
  // Create compound index on name + marca + umd (if not exists)
  try {
    await productsCollection.createIndex(
      { name: 1, marca: 1, umd: 1 },
      { name: 'name_marca_umd_1' }
    );
    console.log('✅ Created compound index: name_marca_umd_1');
  } catch (err) {
    if (err.code === 85) {
      console.log('⚠️  Compound index already exists');
    } else {
      throw err;
    }
  }
  
  // Create text index on name (if not exists)
  try {
    await productsCollection.createIndex(
      { name: 'text' },
      { name: 'name_text' }
    );
    console.log('✅ Created text index: name_text');
  } catch (err) {
    if (err.code === 85) {
      console.log('⚠️  Text index already exists');
    } else {
      throw err;
    }
  }
  
  // Verify barcode unique index exists
  const barcodeIndex = existingIndexes.find(i => i.key.barcode === 1);
  if (barcodeIndex) {
    if (barcodeIndex.unique) {
      console.log('✅ Barcode unique index exists');
    } else {
      console.log('⚠️  Barcode index exists but is not unique - may need manual fix');
    }
  } else {
    console.log('⚠️  Barcode index not found - will be created by Mongoose on app start');
  }
}

async function verifyMigration() {
  console.log('\n✓ Verifying migration...');
  
  const Product = mongoose.model('Product');
  
  // Check all products have marca
  const productsWithoutMarca = await Product.countDocuments({ marca: { $exists: false } });
  if (productsWithoutMarca > 0) {
    throw new Error(`❌ Migration failed: ${productsWithoutMarca} products still missing marca`);
  }
  console.log('✅ All products have marca field');
  
  // Check all products have updatedAt
  const productsWithoutUpdatedAt = await Product.countDocuments({ updatedAt: { $exists: false } });
  if (productsWithoutUpdatedAt > 0) {
    throw new Error(`❌ Migration failed: ${productsWithoutUpdatedAt} products still missing updatedAt`);
  }
  console.log('✅ All products have updatedAt field');
  
  // Count total products
  const totalProducts = await Product.countDocuments({});
  console.log(`✅ Total products in database: ${totalProducts}`);
  
  console.log('\n🎉 Migration completed successfully!');
}

async function main() {
  try {
    console.log('🚀 Starting migration: Add marca field and indexes\n');
    console.log(`Connecting to: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//*****:*****@')}`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Define Product schema (minimal for migration)
    const ProductSchema = new mongoose.Schema({
      name: String,
      marca: String,
      price: Number,
      packageSize: Number,
      pum: Number,
      umd: String,
      barcode: String,
      categoria: String,
      createdAt: Date,
      updatedAt: Date,
    }, { timestamps: false });
    
    mongoose.model('Product', ProductSchema);
    
    // Step 1: Backup
    const backupPath = await backupCollection();
    
    // Step 2: Add marca field
    await addMarcaField();
    
    // Step 3: Add updatedAt field
    await addUpdatedAtField();
    
    // Step 4: Create indexes
    await createIndexes();
    
    // Step 5: Verify migration
    await verifyMigration();
    
    console.log('\n📝 Migration Summary:');
    console.log(`   - Backup saved: ${backupPath}`);
    console.log(`   - marca field added to all products`);
    console.log(`   - updatedAt field added to all products`);
    console.log(`   - Indexes created/verified`);
    
    console.log('\n✨ Migration complete! You can now restart the backend server.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nRollback instructions:');
    console.error('1. Stop the backend server');
    console.error('2. Restore from backup in scripts/backups/');
    console.error('3. mongorestore --db mercapp --collection products <backup-file>');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run migration
main();
