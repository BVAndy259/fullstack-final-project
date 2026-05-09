import { Request, Response } from 'express';
import prisma from '../config/prisma';

// GET /api/customers
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const customers = await prisma.customers.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { dni: { contains: String(search), mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    });

    res.json(customers);
  } catch {
    res.status(500).json({ message: 'Error al obtener clientes.' });
  }
};

// GET /api/customers/:id
export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customers.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        sales: {
          orderBy: { sale_date: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      res.status(404).json({ message: 'Cliente no encontrado.' });
      return;
    }

    res.json(customer);
  } catch {
    res.status(500).json({ message: 'Error al obtener cliente.' });
  }
};

// POST /api/customers
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, dni, phone, email } = req.body;

    if (!name) {
      res.status(400).json({ message: 'El nombre es requerido.' });
      return;
    }

    const customer = await prisma.customers.create({
      data: {
        name,
        dni: dni || null,
        phone: phone || null,
        email: email || null,
      },
    });

    res.status(201).json(customer);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'El DNI ya está registrado.' });
      return;
    }
    res.status(500).json({ message: 'Error al crear cliente.' });
  }
};

// PUT /api/customers/:id
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, dni, phone, email } = req.body;

    const customer = await prisma.customers.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        dni: dni || null,
        phone: phone || null,
        email: email || null,
      },
    });

    res.json(customer);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Cliente no encontrado.' });
      return;
    }
    res.status(500).json({ message: 'Error al actualizar cliente.' });
  }
};