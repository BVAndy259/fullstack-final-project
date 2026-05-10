import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { consumeProductBatchesFEFO, syncProductSnapshotFromBatches } from '../services/product-batches.service';

// POST /api/sales
export const registerSale = async (req: Request, res: Response): Promise<void> => {
  const { customer_id, items, observation } = req.body;

  if (!items || items.length === 0) {
    res.status(400).json({ message: 'La venta debe tener al menos un producto.' });
    return;
  }

  try {
    const sale = await prisma.$transaction(async (tx: any) => {
      let total = 0;
      const details: any[] = [];

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
        details.push({ product, quantity: Number(item.quantity) });
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
        const stockBefore = detail.product.current_stock;
        const batchConsumptions = await consumeProductBatchesFEFO(tx, detail.product.id, detail.quantity);
        const soldQty = batchConsumptions.reduce((acc, c) => acc + c.quantity, 0);
        const subtotal = batchConsumptions.reduce((acc, c) => acc + c.subtotal, 0);
        total += subtotal;

        for (const c of batchConsumptions) {
          await tx.sale_details.create({
            data: {
              sale_id: newSale.id,
              product_id: detail.product.id,
              quantity: c.quantity,
              unit_price: c.unitPrice,
              subtotal: c.subtotal,
            },
          });

          await tx.sale_batch_items.create({
            data: {
              sale_id: newSale.id,
              product_id: detail.product.id,
              batch_id: c.batchId,
              quantity: c.quantity,
              unit_price: c.unitPrice,
              subtotal: c.subtotal,
            },
          });
        }

        await syncProductSnapshotFromBatches(tx, detail.product.id);
        const refreshedProduct = await tx.products.findUnique({ where: { id: detail.product.id } });
        const stockAfter = refreshedProduct?.current_stock ?? stockBefore - soldQty;

        // Registrar movimiento de inventario
        await tx.inventory_movements.create({
          data: {
            product_id: detail.product.id,
            user_id: req.user!.id,
            type: 'salida',
            quantity: -soldQty,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reason: `Venta #${newSale.id}`,
            sale_id: newSale.id,
          },
        });
      }

      await tx.sales.update({
        where: { id: newSale.id },
        data: { total },
      });

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
    await prisma.$transaction(async (tx: any) => {
      const sale = await tx.sales.findUnique({
        where: { id: Number(req.params.id) },
        include: { sale_details: true, sale_batch_items: true },
      });

      if (!sale) throw new Error('Venta no encontrada.');
      if (sale.status === 'anulada') throw new Error('La venta ya está anulada.');

      const qtyByProduct = new Map<number, number>();
      for (const row of sale.sale_batch_items) {
        const current = qtyByProduct.get(row.product_id) ?? 0;
        qtyByProduct.set(row.product_id, current + Number(row.quantity));

        const batch = await tx.product_batches.findUnique({ where: { id: row.batch_id } });
        if (!batch) continue;

        await tx.product_batches.update({
          where: { id: row.batch_id },
          data: {
            quantity_available: Number(batch.quantity_available) + Number(row.quantity),
            active: true,
          },
        });
      }

      for (const [productId, qty] of qtyByProduct.entries()) {
        const product = await tx.products.findUnique({ where: { id: productId } });
        if (!product) continue;
        const stockBefore = Number(product.current_stock);

        await syncProductSnapshotFromBatches(tx, productId);
        const refreshed = await tx.products.findUnique({ where: { id: productId } });
        const stockAfter = Number(refreshed?.current_stock ?? stockBefore + qty);

        await tx.inventory_movements.create({
          data: {
            product_id: productId,
            user_id: req.user!.id,
            type: 'ajuste',
            quantity: qty,
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
