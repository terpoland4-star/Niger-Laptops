import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from './errorHandler';

// Validation du body
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new BadRequestError(
          `Validation échouée: ${details.map(d => `${d.field}: ${d.message}`).join(', ')}`
        );
      }
      throw error;
    }
  };
};

// Validation des query params
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new BadRequestError(
          `Validation des paramètres échouée: ${details.map(d => `${d.field}: ${d.message}`).join(', ')}`
        );
      }
      throw error;
    }
  };
};

// Validation des params d'URL
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new BadRequestError(
          `Validation des paramètres échouée: ${details.map(d => `${d.field}: ${d.message}`).join(', ')}`
        );
      }
      throw error;
    }
  };
};
