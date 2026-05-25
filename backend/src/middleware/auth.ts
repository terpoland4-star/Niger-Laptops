import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../config/database';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

// Interface pour le payload JWT
export interface JwtPayload {
  customerId: string;
  phone: string;
  iat?: number;
  exp?: number;
}

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Étendre l'interface Request
declare global {
  namespace Express {
    interface Request {
      customer?: {
        id: string;
        phone: string;
        email?: string;
        fullName?: string;
      };
      admin?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware d'authentification client
export const authenticateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token d\'authentification requis');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Token d\'authentification requis');
    }

    // Vérifier si le token est blacklisté
    const { redis } = await import('../config/redis');
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token révoqué');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Vérifier que le client existe toujours
    const result = await db.query(
      'SELECT id, phone, email, full_name, is_active FROM customers WHERE id = $1 AND is_active = true',
      [decoded.customerId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Compte introuvable ou désactivé');
    }

    const customer = result.rows[0];
    req.customer = {
      id: customer.id,
      phone: customer.phone,
      email: customer.email,
      fullName: customer.full_name,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expiré, veuillez vous reconnecter'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token invalide'));
    } else {
      next(error);
    }
  }
};

// Middleware d'authentification optionnelle (pour les routes publiques avec personnalisation)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const result = await db.query(
      'SELECT id, phone, email, full_name, is_active FROM customers WHERE id = $1 AND is_active = true',
      [decoded.customerId]
    );

    if (result.rows.length > 0) {
      const customer = result.rows[0];
      req.customer = {
        id: customer.id,
        phone: customer.phone,
        email: customer.email,
        fullName: customer.full_name,
      };
    }
  } catch {
    // Ignorer les erreurs pour l'auth optionnelle
  }
  
  next();
};

// Middleware d'authentification admin
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token d\'authentification admin requis');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Token d\'authentification admin requis');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;

    const result = await db.query(
      'SELECT id, email, role, is_active FROM admins WHERE id = $1 AND is_active = true',
      [decoded.adminId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Compte admin introuvable ou désactivé');
    }

    const admin = result.rows[0];
    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token admin expiré'));
    } else {
      next(new UnauthorizedError('Authentification admin échouée'));
    }
  }
};

// Middleware d'autorisation par rôle admin
export const authorizeAdmin = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new ForbiddenError('Accès refusé'));
    }

    if (roles.length > 0 && !roles.includes(req.admin.role)) {
      return next(new ForbiddenError('Rôle insuffisant pour cette action'));
    }

    next();
  };
};
