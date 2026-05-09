import { Request, Response } from 'express';
import prisma from '../config/prisma';

// POST /api/inventory/entry
export const createEntry = async (req: Request, res: Response): Promise<void> => {
  const { product_id, quantity, reason } = req.body;

  if (!product_id || !quantity || quantity <= 0) {
    res.status(400).json({ message: 'Producto y cantidad válida son requeridos.' });
    return;
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const product = await tx.products.findUnique({
        where: { id: Number(product_id) },
      });

      if (!product) throw new Error('Producto no encontrado.');

      const stockBefore = product.current_stock;
      const stockAfter = stockBefore + Number(quantity);

      await tx.products.update({
        where: { id: product.id },
        data: { current_stock: stockAfter },
      });

      await tx.inventory_movements.create({
        data: {
          product_id: product.id,
          user_id: req.user!.id,
          type: 'entrada',
          quantity: Number(quantity),
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: reason || 'Entrada de stock',
        },
      });
    });

    res.status(201).json({ message: 'Entrada de stock registrada correctamente.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al registrar entrada.' });
  }
};

// POST /api/inventory/adjustment
export const createAdjustment = async (req: Request, res: Response): Promise<void> => {
  const { product_id, new_stock, reason } = req.body;

  if (!product_id || new_stock === undefined || new_stock < 0) {
    res.status(400).json({ message: 'Producto y stock nuevo son requeridos.' });
    return;
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const product = await tx.products.findUnique({
        where: { id: Number(product_id) },
      });

      if (!product) throw new Error('Producto no encontrado.');

      const stockBefore = product.current_stock;
      const stockAfter = Number(new_stock);
      const difference = stockAfter - stockBefore;

      await tx.products.update({
        where: { id: product.id },
        data: { current_stock: stockAfter },
      });

      await tx.inventory_movements.create({
        data: {
          product_id: product.id,
          user_id: req.user!.id,
          type: 'ajuste',
          quantity: difference,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: reason || 'Ajuste manual de inventario',
        },
      });
    });

    res.status(201).json({ message: 'Ajuste de stock registrado correctamente.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al registrar ajuste.' });
  }
};

// GET /api/inventory/movements
export const getMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, type, desde, hasta } = req.query;

    const movements = await prisma.inventory_movements.findMany({
      where: {
        ...(product_id && { product_id: Number(product_id) }),
        ...(type && { type: String(type) }),
        ...(desde && hasta && {
          movement_date: {
            gte: new Date(String(desde)),
            lte: new Date(String(hasta)),
          },
        }),
      },
      include: {
        products: { select: { name: true } },
        users: { select: { name: true } },
      },
      orderBy: { movement_date: 'desc' },
      take: 100,
    });

    res.json(movements);
  } catch {
    res.status(500).json({ message: 'Error al obtener movimientos.' });
  }
};