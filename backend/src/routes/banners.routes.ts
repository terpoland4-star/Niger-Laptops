import { Router } from 'express';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { authenticateAdmin } from '../middleware/auth';
import { handleUpload, uploadSingle } from '../middleware/upload';
import { uploadService } from '../services/upload.service';
import { apiResponse } from '../utils/helpers';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

// Liste des bannières actives
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'banners:active';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await db.query(
      `SELECT * FROM banners 
       WHERE is_active = true 
         AND (starts_at IS NULL OR starts_at <= NOW()) 
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY sort_order ASC, created_at DESC`
    );

    await redis.set(cacheKey, JSON.stringify(apiResponse(result.rows)), 300);
    res.json(apiResponse(result.rows));
  } catch (error) {
    next(error);
  }
});

// Admin : Toutes les bannières
router.get('/all', authenticateAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(apiResponse(result.rows));
  } catch (error) {
    next(error);
  }
});

// Admin : Créer une bannière
router.post('/', authenticateAdmin, handleUpload(uploadSingle), async (req, res, next) => {
  try {
    const { title, subtitle, link_url, starts_at, ends_at, sort_order } = req.body;
    const file = req.file;

    if (!file) throw new Error('Image requise');

    const upload = await uploadService.uploadBanner(file.buffer, file.originalname);

    const result = await db.query(
      `INSERT INTO banners (title, subtitle, image_url, link_url, starts_at, ends_at, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, subtitle, upload.url, link_url, starts_at || null, ends_at || null, sort_order || 0]
    );

    await redis.del('banners:active');
    res.status(201).json(apiResponse(result.rows[0], 'Bannière créée'));
  } catch (error) {
    next(error);
  }
});

// Admin : Modifier une bannière
router.put('/:id', authenticateAdmin, handleUpload(uploadSingle), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, link_url, is_active, starts_at, ends_at, sort_order } = req.body;
    const file = req.file;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title) { updates.push(`title = $${paramCount++}`); values.push(title); }
    if (subtitle !== undefined) { updates.push(`subtitle = $${paramCount++}`); values.push(subtitle); }
    if (link_url !== undefined) { updates.push(`link_url = $${paramCount++}`); values.push(link_url); }
    if (is_active !== undefined) { updates.push(`is_active = $${paramCount++}`); values.push(is_active); }
    if (starts_at !== undefined) { updates.push(`starts_at = $${paramCount++}`); values.push(starts_at); }
    if (ends_at !== undefined) { updates.push(`ends_at = $${paramCount++}`); values.push(ends_at); }
    if (sort_order !== undefined) { updates.push(`sort_order = $${paramCount++}`); values.push(sort_order); }

    if (file) {
      const upload = await uploadService.uploadBanner(file.buffer, file.originalname);
      updates.push(`image_url = $${paramCount++}`);
      values.push(upload.url);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE banners SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new NotFoundError('Bannière non trouvée');

    await redis.del('banners:active');
    res.json(apiResponse(result.rows[0], 'Bannière mise à jour'));
  } catch (error) {
    next(error);
  }
});

// Admin : Supprimer une bannière
router.delete('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM banners WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) throw new NotFoundError('Bannière non trouvée');
    
    await redis.del('banners:active');
    res.json(apiResponse(null, 'Bannière supprimée'));
  } catch (error) {
    next(error);
  }
});

export default router;
