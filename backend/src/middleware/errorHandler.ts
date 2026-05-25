import { Request, Response, NextFunction } from 'express';

// Classe d'erreur personnalisée pour l'API
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Requête invalide') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflit') {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Trop de requêtes') {
    super(message, 429);
  }
}

// Middleware 404
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.originalUrl} non trouvée`));
};

// Middleware de gestion d'erreurs
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Erreurs de validation Zod
  if (err.name === 'ZodError') {
    const zodError = err as any;
    return res.status(400).json({
      success: false,
      error: 'Validation échouée',
      details: zodError.errors?.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expiré',
    });
  }

  // Erreur PostgreSQL
  if ((err as any).code?.startsWith('23')) {
    return res.status(409).json({
      success: false,
      error: 'Violation de contrainte de base de données',
    });
  }

  // Erreur inconnue
  console.error('❌ ERREUR NON GÉRÉE:', err);

  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message || 'Erreur interne du serveur',
  });
};
