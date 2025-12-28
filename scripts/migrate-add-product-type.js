const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Script de migración para agregar el campo productType a productos y compras existentes
 * 
 * Este script:
 * 1. Agrega productType: 'regular' a todos los productos existentes
 * 2. Agrega productType: 'regular' a todos los items de compras existentes
 * 3. Actualiza el índice de barcode de único a parcial único
 * 4. Valida que la migración se completó correctamente
 */

async function migrate() {
  try {
    console.log('🚀 Iniciando migración de productType...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mercapp');
    console.log('✅ Conectado a MongoDB');
    
    // Step 1: Agregar productType a productos existentes
    console.log('\n📦 Step 1: Actualizando productos existentes...');
    const result1 = await mongoose.connection.db.collection('products').updateMany(
      { productType: { $exists: false } },
      { $set: { productType: 'regular' } }
    );
    console.log(`✅ Actualizados ${result1.modifiedCount} productos con productType: 'regular'`);
    
    // Step 2: Actualizar items en compras existentes
    console.log('\n🛒 Step 2: Actualizando compras existentes...');
    const purchases = await mongoose.connection.db.collection('purchases').find({}).toArray();
    let updatedPurchases = 0;
    
    for (const purchase of purchases) {
      if (purchase.items && purchase.items.length > 0) {
        const hasItemsWithoutType = purchase.items.some(item => !item.productType);
        
        if (hasItemsWithoutType) {
          const updatedItems = purchase.items.map(item => ({
            ...item,
            productType: item.productType || 'regular'
          }));
          
          await mongoose.connection.db.collection('purchases').updateOne(
            { _id: purchase._id },
            { $set: { items: updatedItems } }
          );
          updatedPurchases++;
        }
      }
    }
    console.log(`✅ Actualizadas ${updatedPurchases} compras con productType en items`);
    
    // Step 3: Actualizar índice de barcode
    console.log('\n🔍 Step 3: Actualizando índice de barcode...');
    try {
      await mongoose.connection.db.collection('products').dropIndex('barcode_1');
      console.log('✅ Índice único anterior eliminado');
    } catch (e) {
      console.log('ℹ️  Índice anterior no existía o ya fue eliminado');
    }
    
    await mongoose.connection.db.collection('products').createIndex(
      { barcode: 1 },
      { 
        unique: true,
        partialFilterExpression: { barcode: { $type: 'string' } }
      }
    );
    console.log('✅ Índice parcial único creado (solo para barcodes tipo string)');
    
    // Step 4: Validación
    console.log('\n✔️  Step 4: Validando migración...');
    
    const missingTypeProducts = await mongoose.connection.db.collection('products')
      .find({ productType: { $exists: false } }).count();
    
    if (missingTypeProducts > 0) {
      throw new Error(`❌ ${missingTypeProducts} productos sin productType`);
    }
    console.log('✅ Todos los productos tienen productType');
    
    const missingTypePurchases = await mongoose.connection.db.collection('purchases').aggregate([
      { $unwind: '$items' },
      { $match: { 'items.productType': { $exists: false } } },
      { $count: 'missing' }
    ]).toArray();
    
    const missingCount = missingTypePurchases.length > 0 ? missingTypePurchases[0].missing : 0;
    if (missingCount > 0) {
      throw new Error(`❌ ${missingCount} items de compra sin productType`);
    }
    console.log('✅ Todos los items de compra tienen productType');
    
    const indexes = await mongoose.connection.db.collection('products').indexes();
    const barcodeIndex = indexes.find(idx => idx.name === 'barcode_1');
    if (barcodeIndex && barcodeIndex.partialFilterExpression) {
      console.log('✅ Índice parcial de barcode verificado');
    } else {
      console.warn('⚠️  Índice parcial de barcode no encontrado (puede ser normal si no había datos)');
    }
    
    console.log('\n🎉 Migración completada exitosamente');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar migración
migrate();

