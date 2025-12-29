import { Types } from 'mongoose';
import CustomCategory, { ICustomCategory } from '../models/custom-category.model';
import Product from '../models/product.model';
import Purchase from '../models/purchase.model';

export async function getUserCategories(userId: string): Promise<ICustomCategory[]> {
  return CustomCategory.find({ userId: new Types.ObjectId(userId) })
    .sort({ order: 1 })
    .exec();
}

export async function createCategory(userId: string, name: string): Promise<ICustomCategory> {
  // Get the highest order number for this user
  const lastCategory = await CustomCategory.findOne({ userId: new Types.ObjectId(userId) })
    .sort({ order: -1 })
    .exec();
  
  const nextOrder = lastCategory ? lastCategory.order + 1 : 0;
  
  const category = new CustomCategory({
    userId: new Types.ObjectId(userId),
    name: name.trim(),
    order: nextOrder,
  });
  
  return category.save();
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  updates: Partial<Pick<ICustomCategory, 'name' | 'order' | 'icon' | 'color'>>
): Promise<ICustomCategory | null> {
  // Validate ownership
  const category = await CustomCategory.findOne({
    _id: new Types.ObjectId(categoryId),
    userId: new Types.ObjectId(userId),
  }).exec();
  
  if (!category) {
    return null;
  }
  
  // If updating name, check uniqueness (case-insensitive)
  if (updates.name) {
    const existing = await CustomCategory.findOne({
      userId: new Types.ObjectId(userId),
      name: { $regex: new RegExp(`^${updates.name.trim()}$`, 'i') },
      _id: { $ne: new Types.ObjectId(categoryId) },
    }).exec();
    
    if (existing) {
      throw new Error('Category name already exists');
    }
    
    updates.name = updates.name.trim();
  }
  
  const updated = await CustomCategory.findByIdAndUpdate(
    new Types.ObjectId(categoryId),
    { $set: updates },
    { new: true, runValidators: true }
  ).exec();
  
  return updated;
}

export async function deleteCategory(categoryId: string, userId: string): Promise<boolean> {
  // Validate ownership
  const category = await CustomCategory.findOne({
    _id: new Types.ObjectId(categoryId),
    userId: new Types.ObjectId(userId),
  }).exec();
  
  if (!category) {
    return false;
  }
  
  await CustomCategory.findByIdAndDelete(new Types.ObjectId(categoryId)).exec();
  return true;
}

export async function checkCategoryInUse(categoryId: string, userId: string): Promise<boolean> {
  const category = await CustomCategory.findOne({
    _id: new Types.ObjectId(categoryId),
    userId: new Types.ObjectId(userId),
  }).exec();
  
  if (!category) {
    return false;
  }
  
  // Check if any products use this category (products are global, but we check by name)
  const productCount = await Product.countDocuments({
    categoria: category.name,
  }).exec();
  
  // Check if any purchase items use this category (purchases are user-specific)
  const purchaseCount = await Purchase.countDocuments({
    userId: userId,
    'items.categoria': category.name,
  }).exec();
  
  return productCount > 0 || purchaseCount > 0;
}

