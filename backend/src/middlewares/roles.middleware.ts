import { Request, Response, NextFunction } from 'express';

export const soloRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tienes permisos para esta acción.' });
      return;
    }

    next();
  };
};