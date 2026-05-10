import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { consumeProductBatchesFEFO, syncProductSnapshotFromBatches } from '../services/product-batches.service';

// POST /api/inventory/entry
export const createEntry = async (req: Request, res: Response): Promise<void> => {
  const {
    product_id, quantity, reason,
    purchase_price, sale_price, expiry_date, lot_code, min_stock,
  } = req.body;

  if (
    !product_id ||
    !quantity ||
    quantity <= 0 ||
    !purchase_price ||
    !sale_price ||
    !expiry_date ||
    !lot_code ||
    String(lot_code).trim() === '' ||
    !min_stock ||
    Number(min_stock) <= 0
  ) {
    res.status(400).json({
      message: 'Producto, lote, cantidad, stock mínimo, precios y vencimiento son requeridos.',
    });
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

      await tx.product_batches.create({
        data: {
          product_id: product.id,
          lot_code: String(lot_code).trim(),
          purchase_price: Number(purchase_price),
          sale_price: Number(sale_price),
          expiry_date: new Date(expiry_date),
          quantity_initial: Number(quantity),
          quantity_available: Number(quantity),
          active: true,
        },
      });

      await tx.product_batches.updateMany({
        where: { product_id: product.id },
        data: {
          purchase_price: Number(purchase_price),
          sale_price: Number(sale_price),
        },
      });

      await tx.products.update({
        where: { id: product.id },
        data: {
          current_stock: stockAfter,
          purchase_price: Number(purchase_price),
          sale_price: Number(sale_price),
          min_stock: Number(min_stock),
          expiry_date: new Date(expiry_date),
        },
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

      await syncProductSnapshotFromBatches(tx, product.id);
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

      if (difference > 0) {
        const fallbackExpiry = product.expiry_date
          ? new Date(product.expiry_date)
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

        await tx.product_batches.create({
          data: {
            product_id: product.id,
            lot_code: `AJUSTE-${Date.now()}`,
            purchase_price: product.purchase_price,
            sale_price: product.sale_price,
            expiry_date: fallbackExpiry,
            quantity_initial: difference,
            quantity_available: difference,
            active: true,
          },
        });
      } else if (difference < 0) {
        await consumeProductBatchesFEFO(tx, product.id, Math.abs(difference));
      }

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

      await syncProductSnapshotFromBatches(tx, product.id);
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

// GET /api/inventory/batches
export const getBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, active } = req.query;
    const activeValue = typeof active === 'string' ? active.toLowerCase() : undefined;
    const activeWhere =
      activeValue === 'all'
        ? undefined
        : activeValue !== undefined
          ? activeValue === 'true'
          : true;

    const batches = await prisma.product_batches.findMany({
      where: {
        ...(product_id && { product_id: Number(product_id) }),
        ...(activeWhere !== undefined && { active: activeWhere }),
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            min_stock: true,
            categories: { select: { name: true } },
          },
        },
      },
      orderBy: [{ expiry_date: 'asc' }, { received_at: 'asc' }],
      take: 300,
    });

    res.json(batches);
  } catch {
    res.status(500).json({ message: 'Error al obtener lotes.' });
  }
};
