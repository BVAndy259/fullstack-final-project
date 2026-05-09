import { Request, Response } from 'express';
import prisma from '../config/prisma';

// GET /api/categories
export const listCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.categories.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Error al obtener categorías.' });
  }
};
