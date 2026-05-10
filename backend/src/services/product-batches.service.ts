type BatchConsumption = {
  batchId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export const syncProductSnapshotFromBatches = async (tx: any, productId: number): Promise<void> => {
  const [summary, nextBatch] = await Promise.all([
    tx.product_batches.aggregate({
      where: { product_id: productId, quantity_available: { gt: 0 }, active: true },
      _sum: { quantity_available: true },
    }),
    tx.product_batches.findFirst({
      where: { product_id: productId, quantity_available: { gt: 0 }, active: true },
      orderBy: [{ expiry_date: 'asc' }, { received_at: 'asc' }, { id: 'asc' }],
    }),
  ]);

  await tx.products.update({
    where: { id: productId },
    data: {
      current_stock: Number(summary._sum.quantity_available ?? 0),
      purchase_price: nextBatch ? nextBatch.purchase_price : 0,
      sale_price: nextBatch ? nextBatch.sale_price : 0,
      expiry_date: nextBatch ? nextBatch.expiry_date : null,
    },
  });
};

export const consumeProductBatchesFEFO = async (
  tx: any,
  productId: number,
  quantityRequested: number
): Promise<BatchConsumption[]> => {
  const batches = await tx.product_batches.findMany({
    where: {
      product_id: productId,
      quantity_available: { gt: 0 },
      active: true,
    },
    orderBy: [{ expiry_date: 'asc' }, { received_at: 'asc' }, { id: 'asc' }],
  });

  const totalAvailable = batches.reduce((acc: number, b: any) => acc + Number(b.quantity_available), 0);
  if (totalAvailable < quantityRequested) {
    throw new Error(`Stock insuficiente para producto ID ${productId}. Disponible: ${totalAvailable}`);
  }

  let remaining = quantityRequested;
  const consumptions: BatchConsumption[] = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const take = Math.min(Number(batch.quantity_available), remaining);
    const unitPrice = Number(batch.sale_price);
    const subtotal = unitPrice * take;

    const newAvailable = Number(batch.quantity_available) - take;
    await tx.product_batches.update({
      where: { id: batch.id },
      data: {
        quantity_available: newAvailable,
        active: newAvailable > 0,
      },
    });

    consumptions.push({
      batchId: batch.id,
      quantity: take,
      unitPrice,
      subtotal,
    });

    remaining -= take;
  }

  return consumptions;
};
