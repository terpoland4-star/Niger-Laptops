import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { smsService } from '../services/sms.service';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  revokeAllRefreshTokens,
  blacklistToken 
} from '../utils/jwt';
import { isValidNigerPhone, normalizePhone, apiResponse } from '../utils/helpers';
import { BadRequestError, UnauthorizedError, ConflictError } from '../middleware/errorHandler';
import { LIMITS, ERROR_MESSAGES } from '../utils/constants';

// Schémas de validation
const sendOtpSchema = z.object({
  phone: z.string().min(8).max(15),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(15),
  code: z.string().length(6),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export class AuthController {
  // Étape 1: Envoyer OTP
  static async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      
      if (!isValidNigerPhone(phone)) {
        throw new BadRequestError(ERROR_MESSAGES.INVALID_PHONE);
      }

      const normalizedPhone = normalizePhone(phone);

      // Vérifier le rate limiting
      const canSend = await smsService.canSendOTP(normalizedPhone);
      if (!canSend) {
        throw new BadRequestError('Veuillez attendre 1 minute avant de redemander un code');
      }

      // Envoyer OTP
      const result = await smsService.sendOTP(normalizedPhone);

      res.json(apiResponse({
        phone: normalizedPhone,
        expires_in_seconds: LIMITS.OTP_EXPIRY_MINUTES * 60,
      }, 'Code OTP envoyé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Étape 2: Vérifier OTP et connecter/enregistrer
  static async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code, first_name, last_name } = req.body;
      
      if (!isValidNigerPhone(phone)) {
        throw new BadRequestError(ERROR_MESSAGES.INVALID_PHONE);
      }

      const normalizedPhone = normalizePhone(phone);

      // Vérifier OTP
      await smsService.verifyOTP(normalizedPhone, code);

      // Vérifier si le client existe déjà
      let customer = await db.query(
        'SELECT id, phone, email, first_name, last_name, full_name, is_active FROM customers WHERE phone = $1',
        [normalizedPhone]
      );

      let isNewCustomer = false;

      if (customer.rows.length === 0) {
        // Créer un nouveau client
        isNewCustomer = true;
        const newCustomer = await db.query(
          `INSERT INTO customers (phone, first_name, last_name, is_phone_verified) 
           VALUES ($1, $2, $3, true) 
           RETURNING id, phone, email, first_name, last_name, full_name`,
          [normalizedPhone, first_name || null, last_name || null]
        );
        customer = { rows: [newCustomer.rows[0]] };
      } else if (!customer.rows[0].is_active) {
        throw new UnauthorizedError('Ce compte a été désactivé');
      } else {
        // Mettre à jour is_phone_verified si nécessaire
        await db.query(
          'UPDATE customers SET is_phone_verified = true, last_login_at = NOW() WHERE id = $1',
          [customer.rows[0].id]
        );
      }

      const customerData = customer.rows[0];

      // Générer les tokens
      const accessToken = generateAccessToken({
        customerId: customerData.id,
        phone: customerData.phone,
      });

      const refreshToken = await generateRefreshToken(customerData.id);

      res.json(apiResponse({
        customer: {
          id: customerData.id,
          phone: customerData.phone,
          email: customerData.email,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          full_name: customerData.full_name,
        },
        accessToken,
        refreshToken,
        isNewCustomer,
      }, isNewCustomer ? 'Compte créé avec succès' : 'Connexion réussie'));
    } catch (error) {
      next(error);
    }
  }

  // Rafraîchir les tokens
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token requis');
      }

      const tokens = await verifyRefreshToken(refreshToken);

      // Récupérer les infos client
      const customer = await db.query(
        'SELECT id, phone, email, first_name, last_name, full_name FROM customers WHERE id = $1',
        [tokens.customerId]
      );

      res.json(apiResponse({
        customer: customer.rows[0],
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }, 'Tokens rafraîchis avec succès'));
    } catch (error) {
      next(new UnauthorizedError('Refresh token invalide ou expiré'));
    }
  }

  // Déconnexion
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.customer!.id;
      const token = req.headers.authorization?.split(' ')[1];

      // Révoquer tous les refresh tokens
      await revokeAllRefreshTokens(customerId);

      // Blacklister l'access token courant
      if (token) {
        const decoded = require('jsonwebtoken').decode(token);
        if (decoded && decoded.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await blacklistToken(token, ttl);
          }
        }
      }

      res.json(apiResponse(null, 'Déconnexion réussie'));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir le profil
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.customer!.id;

      const result = await db.query(
        `SELECT id, phone, email, first_name, last_name, full_name, 
                is_phone_verified, is_email_verified, accepts_marketing,
                total_orders, total_spent, created_at
         FROM customers WHERE id = $1`,
        [customerId]
      );

      if (result.rows.length === 0) {
        throw new UnauthorizedError(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);
      }

      const customer = result.rows[0];

      // Récupérer les adresses
      const addresses = await db.query(
        'SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC',
        [customerId]
      );

      res.json(apiResponse({
        ...customer,
        addresses: addresses.rows,
      }));
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour le profil
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.customer!.id;
      const { first_name, last_name, email, accepts_marketing } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (first_name !== undefined) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(first_name);
      }
      if (last_name !== undefined) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(last_name);
      }
      if (email !== undefined) {
        // Vérifier si l'email est déjà utilisé
        if (email) {
          const existing = await db.query(
            'SELECT id FROM customers WHERE email = $1 AND id != $2',
            [email, customerId]
          );
          if (existing.rows.length > 0) {
            throw new ConflictError('Cet email est déjà utilisé');
          }
        }
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (accepts_marketing !== undefined) {
        updates.push(`accepts_marketing = $${paramCount++}`);
        values.push(accepts_marketing);
      }

      if (updates.length === 0) {
        throw new BadRequestError('Aucune donnée à mettre à jour');
      }

      values.push(customerId);

      const result = await db.query(
        `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount}
         RETURNING id, phone, email, first_name, last_name, full_name, accepts_marketing`,
        values
      );

      res.json(apiResponse(result.rows[0], 'Profil mis à jour'));
    } catch (error) {
      next(error);
    }
  }

  // Gérer les adresses
  static async addAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.customer!.id;
      const { label, full_name, phone, address_line1, address_line2, city, commune, 
              latitude, longitude, delivery_instructions, is_default } = req.body;

      // Vérifier le nombre d'adresses
      const countResult = await db.query(
        'SELECT COUNT(*) FROM addresses WHERE customer_id = $1',
        [customerId]
      );
      if (parseInt(countResult.rows[0].count) >= LIMITS.MAX_ADDRESSES_PER_CUSTOMER) {
        throw new BadRequestError(`Maximum ${LIMITS.MAX_ADDRESSES_PER_CUSTOMER} adresses autorisées`);
      }

      // Si c'est l'adresse par défaut, retirer le défaut des autres
      if (is_default) {
        await db.query(
          'UPDATE addresses SET is_default = false WHERE customer_id = $1',
          [customerId]
        );
      }

      // Construire la géométrie si coordonnées fournies
      let locationQuery = 'NULL';
      const params: any[] = [
        customerId, label, full_name, phone, address_line1, 
        address_line2, city || 'Niamey', commune, 
        delivery_instructions, is_default || false
      ];

      if (latitude && longitude) {
        locationQuery = `ST_SetSRID(ST_MakePoint($${params.length + 1}, $${params.length + 2}), 4326)`;
        params.push(longitude, latitude);
      }

      const result = await db.query(
        `INSERT INTO addresses (customer_id, label, full_name, phone, address_line1, 
          address_line2, city, commune, location, delivery_instructions, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${locationQuery}, $9, $10)
         RETURNING *`,
        params
      );

      res.status(201).json(apiResponse(result.rows[0], 'Adresse ajoutée'));
    } catch (error) {
      next(error);
    }
  }
}
