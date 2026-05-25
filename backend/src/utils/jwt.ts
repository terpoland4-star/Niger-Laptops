import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../config/database';
import { JwtPayload, AdminJwtPayload } from '../middleware/auth';
import crypto from 'crypto';

// Générer un token d'accès client
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

// Générer un refresh token client
export const generateRefreshToken = async (customerId: string): Promise<string> => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

  await db.query(
    'INSERT INTO refresh_tokens (customer_id, token, expires_at) VALUES ($1, $2, $3)',
    [customerId, token, expiresAt]
  );

  return token;
};

// Vérifier et rafraîchir les tokens
export const verifyRefreshToken = async (refreshToken: string) => {
  const result = await db.query(
    `SELECT rt.customer_id, c.phone 
     FROM refresh_tokens rt 
     JOIN customers c ON c.id = rt.customer_id 
     WHERE rt.token = $1 AND rt.expires_at > NOW()`,
    [refreshToken]
  );

  if (result.rows.length === 0) {
    throw new Error('Refresh token invalide ou expiré');
  }

  const { customer_id, phone } = result.rows[0];

  // Supprimer l'ancien refresh token
  await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

  // Générer de nouveaux tokens
  const newAccessToken = generateAccessToken({
    customerId: customer_id,
    phone,
  });
  const newRefreshToken = await generateRefreshToken(customer_id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    customerId: customer_id,
  };
};

// Générer un token admin
export const generateAdminToken = (payload: AdminJwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '8h',
  });
};

// Révoquer tous les refresh tokens d'un client
export const revokeAllRefreshTokens = async (customerId: string): Promise<void> => {
  await db.query('DELETE FROM refresh_tokens WHERE customer_id = $1', [customerId]);
};

// Blacklister un access token (pour la déconnexion)
export const blacklistToken = async (token: string, expiresIn: number): Promise<void> => {
  const { redis } = await import('../config/redis');
  await redis.set(`blacklist:${token}`, '1', expiresIn);
};
