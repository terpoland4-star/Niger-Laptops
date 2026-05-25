import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateAdmin, authorizeAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { z } from 'zod';

const router = Router();

// Routes publiques
router.post('/login', AdminController.login);

// Routes protégées
router.get('/profile', authenticateAdmin, AdminController.getProfile);
router.post('/change-password', authenticateAdmin, AdminController.changePassword);

// Dashboard
router.get('/dashboard/stats', authenticateAdmin, AdminController.getDashboardStats);
router.get('/dashboard/recent-orders', authenticateAdmin, AdminController.getRecentOrders);

// Gestion clients
router.get('/customers', authenticateAdmin, AdminController.getCustomers);
router.get('/customers/:id', authenticateAdmin, AdminController.getCustomerDetail);

// Gestion admins (super_admin uniquement)
router.get('/', authenticateAdmin, authorizeAdmin('super_admin'), AdminController.listAdmins);
router.post('/', authenticateAdmin, authorizeAdmin('super_admin'), AdminController.createAdmin);
router.patch('/:id', authenticateAdmin, authorizeAdmin('super_admin'), AdminController.updateAdmin);

export default router;
