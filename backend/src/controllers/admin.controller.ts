import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { generateAdminToken } from '../utils/jwt';
import { getPaginationParams, paginatedResponse, apiResponse } from '../utils/helpers';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../middleware/errorHandler';
import { ADMIN_ROLES } from '../utils/constants';

// Schémas de validation
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
});

const createAdminSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  full_name: z.string().min(2, 'Nom requis'),
  role: z.enum(['super_admin', 'manager', 'staff']).default('staff'),
});

const updateAdminSchema = z.object({
  full_name: z.string().min(2).optional(),
  role: z.enum(['super_admin', 'manager', 'staff']).optional(),
  is_active: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(8, 'Minimum 8 caractères'),
});

export class AdminController {
  // ==========================================
  // AUTHENTIFICATION
  // ==========================================

  // Connexion admin
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Vérifier les tentatives de connexion
      const attemptsKey = `admin:login_attempts:${email}`;
      const attempts = await redis.get(attemptsKey);
      if (attempts && parseInt(attempts) >= 5) {
        throw new BadRequestError('Compte bloqué temporairement. Réessayez dans 30 minutes.');
      }

      const result = await db.query(
        'SELECT id, email, password_hash, full_name, role, is_active FROM admins WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        await redis.client.incr(attemptsKey);
        await redis.client.expire(attemptsKey, 1800);
        throw new UnauthorizedError('Email ou mot de passe incorrect');
      }

      const admin = result.rows[0];

      if (!admin.is_active) {
        throw new ForbiddenError('Ce compte admin est désactivé');
      }

      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      if (!isValidPassword) {
        await redis.client.incr(attemptsKey);
        await redis.client.expire(attemptsKey, 1800);
        throw new UnauthorizedError('Email ou mot de passe incorrect');
      }

      // Réinitialiser les tentatives
      await redis.del(attemptsKey);

      // Mettre à jour last_login
      await db.query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

      // Générer le token
      const token = generateAdminToken({
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      res.json(apiResponse({
        admin: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role,
        },
        accessToken: token,
      }, 'Connexion réussie'));
    } catch (error) {
      next(error);
    }
  }

  // Profil admin
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.admin!.id;

      const result = await db.query(
        'SELECT id, email, full_name, role, last_login_at, created_at FROM admins WHERE id = $1',
        [adminId]
      );

      res.json(apiResponse(result.rows[0]));
    } catch (error) {
      next(error);
    }
  }

  // Changer mot de passe admin
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.admin!.id;
      const { current_password, new_password } = changePasswordSchema.parse(req.body);

      const admin = await db.query('SELECT password_hash FROM admins WHERE id = $1', [adminId]);
      
      const isValid = await bcrypt.compare(current_password, admin.rows[0].password_hash);
      if (!isValid) {
        throw new BadRequestError('Mot de passe actuel incorrect');
      }

      const newHash = await bcrypt.hash(new_password, 12);
      await db.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, adminId]);

      res.json(apiResponse(null, 'Mot de passe mis à jour'));
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // GESTION ADMINS (super_admin uniquement)
  // ==========================================

  // Lister les admins
  static async listAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset } = getPaginationParams(req.query);

      const count = await db.query('SELECT COUNT(*) FROM admins');
      const total = parseInt(count.rows[0].count);

      const result = await db.query(
        `SELECT id, email, full_name, role, is_active, last_login_at, created_at 
         FROM admins ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json(paginatedResponse(result.rows, total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  // Créer un admin
  static async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, full_name, role } = createAdminSchema.parse(req.body);

      // Vérifier si l'email existe déjà
      const existing = await db.query('SELECT id FROM admins WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new BadRequestError('Cet email est déjà utilisé');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await db.query(
        `INSERT INTO admins (email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at`,
        [email, passwordHash, full_name, role]
      );

      res.status(201).json(apiResponse(result.rows[0], 'Admin créé'));
    } catch (error) {
      next(error);
    }
  }

  // Modifier un admin
  static async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateAdminSchema.parse(req.body);

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.full_name) {
        updates.push(`full_name = $${paramCount++}`);
        values.push(data.full_name);
      }
      if (data.role) {
        updates.push(`role = $${paramCount++}`);
        values.push(data.role);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(data.is_active);
      }

      if (updates.length === 0) {
        throw new BadRequestError('Aucune modification');
      }

      values.push(id);
      const result = await db.query(
        `UPDATE admins SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, full_name, role, is_active`,
        values
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Admin non trouvé');
      }

      res.json(apiResponse(result.rows[0], 'Admin mis à jour'));
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // DASHBOARD & ANALYTICS
  // ==========================================

  // Statistiques du dashboard
  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'admin:dashboard:stats';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Périodes
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Commandes du jour
      const todayOrders = await db.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM orders WHERE created_at::date = $1`,
        [today]
      );

      // Commandes du mois
      const monthOrders = await db.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM orders WHERE created_at >= $1`,
        [startOfMonth]
      );

      // Mois dernier (comparaison)
      const lastMonthOrders = await db.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM orders WHERE created_at >= $1 AND created_at <= $2`,
        [startOfLastMonth, endOfLastMonth]
      );

      // Commandes en attente
      const pendingOrders = await db.query(
        `SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed')`
      );

      // Produits en rupture
      const lowStock = await db.query(
        `SELECT COUNT(*) as count FROM products 
         WHERE stock_quantity <= low_stock_threshold AND is_published = true AND deleted_at IS NULL`
      );

      // Nouveaux clients ce mois
      const newCustomers = await db.query(
        `SELECT COUNT(*) as count FROM customers WHERE created_at >= $1`,
        [startOfMonth]
      );

      // Total clients
      const totalCustomers = await db.query('SELECT COUNT(*) as count FROM customers');

      // Total produits
      const totalProducts = await db.query(
        'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
      );

      // Chiffre d'affaires total
      const totalRevenue = await db.query(
        `SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = 'completed'`
      );

      // Commandes par statut
      const ordersByStatus = await db.query(
        `SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC`
      );

      // Top produits
      const topProducts = await db.query(
        `SELECT p.id, p.name, p.thumbnail, p.price,
                COUNT(oi.id) as order_count,
                SUM(oi.quantity) as total_sold
         FROM products p
         JOIN order_items oi ON oi.product_id = p.id
         JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'completed'
         WHERE p.deleted_at IS NULL
         GROUP BY p.id
         ORDER BY total_sold DESC
         LIMIT 10`
      );

      // Revenus par jour (30 derniers jours)
      const revenueByDay = await db.query(
        `SELECT created_at::date as date, 
                COUNT(*) as order_count,
                COALESCE(SUM(total), 0) as revenue
         FROM orders 
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY created_at::date
         ORDER BY date ASC`
      );

      const stats = {
        today: {
          orders: parseInt(todayOrders.rows[0].count),
          revenue: parseInt(todayOrders.rows[0].revenue),
        },
        thisMonth: {
          orders: parseInt(monthOrders.rows[0].count),
          revenue: parseInt(monthOrders.rows[0].revenue),
        },
        lastMonth: {
          orders: parseInt(lastMonthOrders.rows[0].count),
          revenue: parseInt(lastMonthOrders.rows[0].revenue),
        },
        pendingOrders: parseInt(pendingOrders.rows[0].count),
        lowStockProducts: parseInt(lowStock.rows[0].count),
        newCustomersThisMonth: parseInt(newCustomers.rows[0].count),
        totalCustomers: parseInt(totalCustomers.rows[0].count),
        totalProducts: parseInt(totalProducts.rows[0].count),
        totalRevenue: parseInt(totalRevenue.rows[0].total),
        ordersByStatus: ordersByStatus.rows,
        topProducts: topProducts.rows,
        revenueByDay: revenueByDay.rows,
      };

      // Cache 5 minutes
      await redis.set(cacheKey, JSON.stringify(apiResponse(stats)), 300);

      res.json(apiResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  // Commandes récentes
  static async getRecentOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await db.query(
        `SELECT o.id, o.order_number, o.status, o.payment_status, o.total,
                o.delivery_method, o.created_at,
                c.full_name as customer_name, c.phone as customer_phone,
                (SELECT json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity))
                 FROM order_items oi WHERE oi.order_id = o.id) as items
         FROM orders o
         JOIN customers c ON c.id = o.customer_id
         ORDER BY o.created_at DESC
         LIMIT 20`
      );

      res.json(apiResponse(result.rows));
    } catch (error) {
      next(error);
    }
  }

  // Liste des clients
  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset } = getPaginationParams(req.query);
      const search = req.query.search as string;

      let whereClause = '';
      const params: any[] = [];
      let paramCount = 1;

      if (search) {
        whereClause = `WHERE (c.phone ILIKE $1 OR c.full_name ILIKE $1 OR c.email ILIKE $1)`;
        params.push(`%${search}%`);
        paramCount++;
      }

      const countResult = await db.query(
        `SELECT COUNT(*) FROM customers c ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await db.query(
        `SELECT c.*, 
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'completed'), 0) as total_spent
         FROM customers c
         LEFT JOIN orders o ON o.customer_id = c.id
         ${whereClause}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...params, limit, offset]
      );

      res.json(paginatedResponse(result.rows, total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  // Détail client
  static async getCustomerDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const customer = await db.query(
        `SELECT c.*, 
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'completed'), 0) as total_spent
         FROM customers c
         LEFT JOIN orders o ON o.customer_id = c.id
         WHERE c.id = $1
         GROUP BY c.id`,
        [id]
      );

      if (customer.rows.length === 0) {
        throw new NotFoundError('Client non trouvé');
      }

      // Commandes du client
      const orders = await db.query(
        `SELECT o.id, o.order_number, o.status, o.payment_status, o.total, o.created_at,
                (SELECT json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity))
                 FROM order_items oi WHERE oi.order_id = o.id) as items
         FROM orders o
         WHERE o.customer_id = $1
         ORDER BY o.created_at DESC
         LIMIT 50`,
        [id]
      );

      // Adresses
      const addresses = await db.query(
        'SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC',
        [id]
      );

      res.json(apiResponse({
        ...customer.rows[0],
        recent_orders: orders.rows,
        addresses: addresses.rows,
      }));
    } catch (error) {
      next(error);
    }
  }
        }
