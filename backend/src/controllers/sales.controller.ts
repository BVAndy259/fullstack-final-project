import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { Prisma } from '../generated/prisma/browser';

// POST /api/sales
export const registerSale = async (req: Request, res: Response): Promise<void> => {
  const { customer_id, items, observation } = req.body;

  if (!items || items.length === 0) {
    res.status(400).json({ message: 'La venta debe tener al menos un producto.' });
    return;
  }

  try {
    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let total = 0;
      const details = [];

      // 1. Verificar stock y calcular total
      for (const item of items) {
        const product = await tx.products.findUnique({
          where: { id: item.product_id },
        });

        if (!product || !product.active) {
          throw new Error(`Producto ID ${item.product_id} no encontrado.`);
        }

        if (product.current_stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${product.name}". Disponible: ${product.current_stock}`
          );
        }

        const subtotal = Number(product.sale_price) * item.quantity;
        total += subtotal;
        details.push({ product, quantity: item.quantity, subtotal });
      }

      // 2. Crear cabecera de la venta
      const newSale = await tx.sales.create({
        data: {
          user_id: req.user!.id,
          customer_id: customer_id || 1,
          total,
          observation,
        },
      });

      // 3. Crear detalle y actualizar stock por cada producto
      for (const detail of details) {
        await tx.sale_details.create({
          data: {
            sale_id: newSale.id,
            product_id: detail.product.id,
            quantity: detail.quantity,
            unit_price: detail.product.sale_price,
            subtotal: detail.subtotal,
          },
        });

        const stockBefore = detail.product.current_stock;
        const stockAfter = stockBefore - detail.quantity;

        // Descontar stock
        await tx.products.update({
          where: { id: detail.product.id },
          data: { current_stock: stockAfter },
        });

        // Registrar movimiento de inventario
        await tx.inventory_movements.create({
          data: {
            product_id: detail.product.id,
            user_id: req.user!.id,
            type: 'salida',
            quantity: -detail.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reason: `Venta #${newSale.id}`,
            sale_id: newSale.id,
          },
        });
      }

      return newSale;
    });

    // Retornar la venta completa con detalle
    const soldOut = await prisma.sales.findUnique({
      where: { id: sale.id },
      include: {
        sale_details: { include: { products: true } },
        customers: true,
        users: { select: { name: true } },
      },
    });

    res.status(201).json(soldOut);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al registrar venta.' });
  }
};

// GET /api/sales
export const listSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, upTo, status } = req.query;

    const sales = await prisma.sales.findMany({
      where: {
        ...(status && { status: String(status) }),
        ...(from && upTo && {
          sale_date: {
            gte: new Date(String(from)),
            lte: new Date(String(upTo)),
          },
        }),
      },
      include: {
        users: { select: { name: true } },
        customers: { select: { name: true } },
        _count: { select: { sale_details: true } },
      },
      orderBy: { sale_date: 'desc' },
    });

    res.json(sales);
  } catch {
    res.status(500).json({ message: 'Error al listar ventas.' });
  }
};

// GET /api/sales/:id
export const getSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await prisma.sales.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        sale_details: { include: { products: true } },
        customers: true,
        users: { select: { name: true } },
      },
    });

    if (!sale) {
      res.status(404).json({ message: 'Venta no encontrada.' });
      return;
    }

    res.json(sale);
  } catch {
    res.status(500).json({ message: 'Error al obtener venta.' });
  }
};

// PUT /api/sales/:id/anular
export const cancelSale = async (req: Request, res: Response): Promise<void> => {
  const { reason } = req.body;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sale = await tx.sales.findUnique({
        where: { id: Number(req.params.id) },
        include: { sale_details: true },
      });

      if (!sale) throw new Error('Venta no encontrada.');
      if (sale.status === 'anulada') throw new Error('La venta ya está anulada.');

      // Revertir stock de cada producto
      for (const detail of sale.sale_details) {
        const product = await tx.products.findUnique({
          where: { id: detail.product_id },
        });
        if (!product) continue;

        const stockBefore = product.current_stock;
        const stockAfter = stockBefore + detail.quantity;

        await tx.products.update({
          where: { id: detail.product_id },
          data: { current_stock: stockAfter },
        });

        await tx.inventory_movements.create({
          data: {
            product_id: detail.product_id,
            user_id: req.user!.id,
            type: 'ajuste',
            quantity: detail.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reason: `Anulación venta #${sale.id}: ${reason || 'sin motivo'}`,
            sale_id: sale.id,
          },
        });
      }

      await tx.sales.update({
        where: { id: sale.id },
        data: { status: 'anulada', observation: reason },
      });
    });

    res.json({ message: 'Venta anulada y stock revertido correctamente.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};