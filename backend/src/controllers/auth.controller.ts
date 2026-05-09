import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    return;
  }

  try {
    // Buscar el usuario por email
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || !user.active) {
      res.status(401).json({ message: 'Credenciales inválidas.' });
      return;
    }

    // Comparar la contraseña con el hash guardado
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ message: 'Credenciales inválidas.' });
      return;
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};