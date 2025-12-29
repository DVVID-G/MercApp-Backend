import { Request, Response } from 'express';
import * as customCategoryService from '../services/custom-category.service';
import { createCategorySchema, updateCategorySchema } from '../validators/custom-category.validator';
import { Types } from 'mongoose';

export async function listCategories(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const categories = await customCategoryService.getUserCategories(userId);
    return res.status(200).json({ categories });
  } catch (err) {
    console.error('listCategories error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const parseResult = createCategorySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.format(),
      });
    }

    try {
      const category = await customCategoryService.createCategory(userId, parseResult.data.name);
      return res.status(201).json(category);
    } catch (err: any) {
      // MongoDB duplicate key error (E11000)
      if (err.code === 11000 || err.message?.includes('duplicate')) {
        return res.status(409).json({ message: 'El nombre de categoría ya existe' });
      }
      throw err;
    }
  } catch (err) {
    console.error('createCategory error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const categoryId = req.params.id;
    if (!Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'ID de categoría inválido' });
    }

    const parseResult = updateCategorySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.format(),
      });
    }

    try {
      const category = await customCategoryService.updateCategory(categoryId, userId, parseResult.data);
      if (!category) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      return res.status(200).json(category);
    } catch (err: any) {
      if (err.message === 'Category name already exists') {
        return res.status(409).json({ message: 'El nombre de categoría ya existe' });
      }
      // MongoDB duplicate key error (E11000)
      if (err.code === 11000) {
        return res.status(409).json({ message: 'El nombre de categoría ya existe' });
      }
      throw err;
    }
  } catch (err) {
    console.error('updateCategory error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const categoryId = req.params.id;
    if (!Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'ID de categoría inválido' });
    }

    const deleted = await customCategoryService.deleteCategory(categoryId, userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    // Check if category is in use
    const inUse = await customCategoryService.checkCategoryInUse(categoryId, userId);
    const response: any = { message: 'Categoría eliminada exitosamente' };
    if (inUse) {
      response.warning = 'Esta categoría está siendo utilizada por productos o compras. Los datos se mantendrán pero la categoría ya no estará disponible para nuevas selecciones.';
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('deleteCategory error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

