import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const completedStatuses = ['completada', 'completado'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ventas del día
    const todaySales = await prisma.sales.aggregate({
      where: {
        status: { in: completedStatuses },
        sale_date: { gte: today, lt: tomorrow },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    // Cantidad de productos con bajo stock
    const lowStockResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count 
      FROM products
      WHERE current_stock <= min_stock AND active = true
    `;

    // Productos más vendidos en los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProductsRaw = await prisma.$queryRaw<any[]>`
      SELECT
        p.id AS product_id,
        p.name,
        SUM(sd.quantity) AS total_sold,
        SUM(sd.subtotal) AS income
      FROM sale_details sd
      JOIN sales s ON s.id = sd.sale_id
      JOIN products p ON p.id = sd.product_id
      WHERE s.status IN ('completada', 'completado')
        AND s.sale_date >= ${thirtyDaysAgo}
      GROUP BY p.id, p.name
      ORDER BY SUM(sd.quantity) DESC
      LIMIT 5
    `;

    const topProductsWithNames = topProductsRaw.map((p) => ({
      product_id: Number(p.product_id),
      name: p.name,
      total_sold: Number(p.total_sold ?? 0),
      income: Number(p.income ?? 0),
    }));

    // Ventas de los últimos 7 días para la gráfica
    const weeklySalesRaw = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(sale_date) as day, 
        COUNT(*) as quantity, 
        SUM(total) as income
      FROM sales
      WHERE status IN ('completada', 'completado')
        AND sale_date >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(sale_date)
      ORDER BY day ASC
    `;

    const weeklySales = weeklySalesRaw.map((d) => ({
      day: d.day,
      quantity: Number(d.quantity ?? 0),
      income: Number(d.income ?? 0),
    }));

    res.json({
      today_sales: {
        quantity: Number(todaySales._count.id ?? 0),
        income: todaySales._sum.total ?? 0,
      },
      low_stock_count: Number(lowStockResult[0]?.count ?? 0),
      top_products: topProductsWithNames,
      weekly_sales: weeklySales,
    });
  } catch {
    res.status(500).json({ message: 'Error al obtener datos del dashboard.' });
  }
};
