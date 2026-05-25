import { Router } from 'express';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { authenticateAdmin } from '../middleware/auth';
import { apiResponse } from '../utils/helpers';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';

const router = Router();

// Liste des catégories
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'categories:all';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await db.query(
      `SELECT c.*, 
              COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category = c.name AND p.is_published = true AND p.deleted_at IS NULL
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    await redis.set(cacheKey, JSON.stringify(apiResponse(result.rows)), 600);
    res.json(apiResponse(result.rows));
  } catch (error) {
    next(error);
  }
});

// Admin : Créer une catégorie
router.post('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { name, description, image, parent_id } = req.body;

    if (!name) throw new BadRequestError('Le nom est requis');

    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

    const result = await db.query(
      `INSERT INTO categories (name, slug, description, image, parent_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, description, image, parent_id || null]
    );

    await redis.del('categories:all');
    res.status(201).json(apiResponse(result.rows[0], 'Catégorie créée'));
  } catch (error) {
    next(error);
  }
});

// Admin : Modifier une catégorie
router.put('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, is_active, sort_order } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramCount++}`);
      values.push(image);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new NotFoundError('Catégorie non trouvée');

    await redis.del('categories:all');
    res.json(apiResponse(result.rows[0], 'Catégorie mise à jour'));
  } catch (error) {
    next(error);
  }
});

export default router;
