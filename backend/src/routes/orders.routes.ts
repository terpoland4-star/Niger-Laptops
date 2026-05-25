import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller';
import { authenticateCustomer, authenticateAdmin, authorizeAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { z } from 'zod';

const router = Router();

// Routes clients
router.post('/', authenticateCustomer, OrdersController.create);
router.get('/my-orders', authenticateCustomer, OrdersController.getMyOrders);
router.get('/track/:orderNumber', OrdersController.trackByNumber);
router.get('/:id', authenticateCustomer, OrdersController.getById);

// Routes admin
router.get('/', authenticateAdmin, OrdersController.adminList);
router.patch('/:id/status', authenticateAdmin, authorizeAdmin('super_admin', 'manager'), OrdersController.updateStatus);

export default router;
