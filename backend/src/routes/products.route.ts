import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller';
import { authenticateAdmin, authenticateCustomer } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validator';
import { handleUpload, uploadMultiple } from '../middleware/upload';
import { z } from 'zod';

const router = Router();

// Routes publiques
router.get('/', ProductsController.list);
router.get('/categories', ProductsController.getCategories);
router.get('/slug/:slug', ProductsController.getBySlug);
router.get('/:id', ProductsController.getById);

// Routes admin protégées
router.post('/', authenticateAdmin, validateBody(z.object({}).passthrough()), ProductsController.create);
router.put('/:id', authenticateAdmin, validateBody(z.object({}).passthrough()), ProductsController.update);
router.delete('/:id', authenticateAdmin, ProductsController.delete);
router.post('/:id/images', authenticateAdmin, handleUpload(uploadMultiple), ProductsController.uploadImages);
router.delete('/:id/images/:imageKey', authenticateAdmin, ProductsController.deleteImage);

export default router;
