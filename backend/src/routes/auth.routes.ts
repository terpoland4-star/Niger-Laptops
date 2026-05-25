import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateCustomer } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { z } from 'zod';

const router = Router();

// Schémas de validation
const sendOtpSchema = z.object({
  phone: z.string().min(8, 'Numéro trop court').max(15, 'Numéro trop long'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(15),
  code: z.string().length(6, 'Le code OTP doit faire 6 chiffres'),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email('Email invalide').optional().nullable(),
  accepts_marketing: z.boolean().optional(),
});

const addAddressSchema = z.object({
  label: z.string().max(100).optional(),
  full_name: z.string().max(200).optional(),
  phone: z.string().optional(),
  address_line1: z.string().min(1, 'Adresse requise').max(500),
  address_line2: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  commune: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  delivery_instructions: z.string().max(500).optional(),
  is_default: z.boolean().optional(),
});

// Routes publiques
router.post('/send-otp', validateBody(sendOtpSchema), AuthController.sendOTP);
router.post('/verify-otp', validateBody(verifyOtpSchema), AuthController.verifyOTP);
router.post('/refresh-token', validateBody(refreshTokenSchema), AuthController.refreshToken);

// Routes protégées
router.post('/logout', authenticateCustomer, AuthController.logout);
router.get('/profile', authenticateCustomer, AuthController.getProfile);
router.patch('/profile', authenticateCustomer, validateBody(updateProfileSchema), AuthController.updateProfile);
router.post('/addresses', authenticateCustomer, validateBody(addAddressSchema), AuthController.addAddress);

// Routes admin (pour gestion clients)
// Ces routes seront définies dans admin.routes.ts

export default router;
