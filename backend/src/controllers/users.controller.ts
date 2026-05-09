import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

// GET /api/users
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error al obtener usuarios.' });
  }
};

// GET /api/users/:id
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Error al obtener usuario.' });
  }
};

// POST /api/users
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: role || 'vendedor',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'El email ya está registrado.' });
      return;
    }
    res.status(500).json({ message: 'Error al crear usuario.' });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, active } = req.body;

    const user = await prisma.users.update({
      where: { id: Number(req.params.id) },
      data: { name, email, role, active },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }
    res.status(500).json({ message: 'Error al actualizar usuario.' });
  }
};

// PUT /api/users/:id/password
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      res.status(400).json({ message: 'Contraseña actual y nueva son requeridas.' });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }

    const passwordValido = await bcrypt.compare(current_password, user.password_hash);
    if (!passwordValido) {
      res.status(401).json({ message: 'Contraseña actual incorrecta.' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(new_password, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash },
    });

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch {
    res.status(500).json({ message: 'Error al actualizar contraseña.' });
  }
};