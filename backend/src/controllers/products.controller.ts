import { Request, Response } from 'express';
import prisma from '../config/prisma';

// GET /api/products
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category_id, active } = req.query;

    const products = await prisma.products.findMany({
      where: {
        active: active !== undefined ? active === 'true' : true,
        ...(category_id && { category_id: Number(category_id) }),
        ...(search && {
          name: { contains: String(search), mode: 'insensitive' },
        }),
      },
      include: { categories: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(products);
  } catch {
    res.status(500).json({ message: 'Error al obtener productos.' });
  }
};

// GET /api/products/low-stock
export const stockAlerts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id, 
        p.name, 
        p.current_stock, 
        p.min_stock,
        (p.min_stock - p.current_stock) AS missing_units,
        c.name AS category
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.current_stock <= p.min_stock 
        AND p.active = true
      ORDER BY missing_units DESC
    `;

    res.json(alerts);
  } catch {
    res.status(500).json({ message: 'Error al obtener alertas de stock.' });
  }
};

// GET /api/products/:id
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.products.findUnique({
      where: { id: Number(req.params.id) },
      include: { categories: true },
    });

    if (!product) {
      res.status(404).json({ message: 'Producto no encontrado.' });
      return;
    }

    res.json(product);
  } catch {
    res.status(500).json({ message: 'Error al obtener producto.' });
  }
};

// POST /api/products
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, description, category_id, purchase_price,
      sale_price, current_stock, min_stock,
      unit_of_measure, expiry_date, barcode,
    } = req.body;

    const product = await prisma.products.create({
      data: {
        name,
        description,
        category_id: Number(category_id),
        purchase_price: Number(purchase_price),
        sale_price: Number(sale_price),
        current_stock: Number(current_stock) || 0,
        min_stock: Number(min_stock) || 10,
        unit_of_measure: unit_of_measure || 'unidad',
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        barcode: barcode || null,
      },
    });

    res.status(201).json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'El código de barras ya existe.' });
      return;
    }
    res.status(500).json({ message: 'Error al crear producto.' });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, description, category_id, purchase_price,
      sale_price, current_stock, min_stock,
      unit_of_measure, expiry_date, barcode, active,
    } = req.body;

    const product = await prisma.products.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category_id !== undefined && { category_id: Number(category_id) }),
        ...(purchase_price !== undefined && { purchase_price: Number(purchase_price) }),
        ...(sale_price !== undefined && { sale_price: Number(sale_price) }),
        ...(current_stock !== undefined && { current_stock: Number(current_stock) }),
        ...(min_stock !== undefined && { min_stock: Number(min_stock) }),
        ...(unit_of_measure !== undefined && { unit_of_measure }),
        ...(expiry_date !== undefined && { expiry_date: expiry_date ? new Date(expiry_date) : null }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(active !== undefined && { active }),
      },
    });

    res.json(product);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Producto no encontrado.' });
      return;
    }
    res.status(500).json({ message: 'Error al actualizar producto.' });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.products.update({
      where: { id: Number(req.params.id) },
      data: { active: false },
    });

    res.json({ message: 'Producto desactivado correctamente.' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar producto.' });
  }
};
