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

// POST /api/categories
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name || String(name).trim() === '') {
      res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const category = await prisma.categories.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        active: true,
      },
    });

    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'La categoría ya existe.' });
      return;
    }
    res.status(500).json({ message: 'Error al crear categoría.' });
  }
};
