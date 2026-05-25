import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { uploadService } from '../services/upload.service';
import { generateSlug, generateSKU, getPaginationParams, paginatedResponse, apiResponse } from '../utils/helpers';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../utils/constants';
import { optionalAuth } from '../middleware/auth';

// Schéma de création/modification produit
const createProductSchema = z.object({
  name: z.string().min(2).max(250),
  description: z.string().max(10000).optional(),
  short_description: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  price: z.number().int().positive('Le prix doit être positif'),
  compare_at_price: z.number().int().positive().optional().nullable(),
  cost_price: z.number().int().positive().optional().nullable(),
  stock_quantity: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(1).max(100).default(5),
  weight_grams: z.number().int().positive().optional(),
  specifications: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([]),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
});

const updateProductSchema = createProductSchema.partial();

const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  in_stock: z.string().optional(),
  is_featured: z.string().optional(),
  is_on_sale: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'oldest', 'name_asc', 'name_desc', 'popular']).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export class ProductsController {
  // Liste des produits avec filtres
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = productQuerySchema.parse(req.query);
      const { page, limit, offset } = getPaginationParams(query);

      // Cache Redis pour les requêtes sans recherche
      const cacheKey = `products:list:${JSON.stringify(query)}:${page}:${limit}`;
      if (!query.search && !query.lat) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      }

      let sql = `SELECT p.*, 
                        COALESCE(AVG(pr.rating), 0) as avg_rating,
                        COUNT(pr.id) as review_count
                 FROM products p
                 LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.is_approved = true
                 WHERE p.is_published = true AND p.deleted_at IS NULL`;
      
      const params: any[] = [];
      let paramCount = 1;

      // Filtres
      if (query.category) {
        sql += ` AND p.category = $${paramCount++}`;
        params.push(query.category);
      }
      if (query.subcategory) {
        sql += ` AND p.subcategory = $${paramCount++}`;
        params.push(query.subcategory);
      }
      if (query.brand) {
        sql += ` AND p.brand ILIKE $${paramCount++}`;
        params.push(`%${query.brand}%`);
      }
      if (query.min_price) {
        sql += ` AND p.price >= $${paramCount++}`;
        params.push(parseInt(query.min_price));
      }
      if (query.max_price) {
        sql += ` AND p.price <= $${paramCount++}`;
        params.push(parseInt(query.max_price));
      }
      if (query.in_stock === 'true') {
        sql += ` AND p.stock_quantity > 0`;
      }
      if (query.is_featured === 'true') {
        sql += ` AND p.is_featured = true`;
      }
      if (query.is_on_sale === 'true') {
        sql += ` AND p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price`;
      }
      if (query.search) {
        sql += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.brand ILIKE $${paramCount} OR p.tags::text ILIKE $${paramCount})`;
        params.push(`%${query.search}%`);
        paramCount++;
      }

      // Group by
      sql += ` GROUP BY p.id`;

      // Comptage total
      const countSql = `SELECT COUNT(*) FROM (${sql}) as filtered`;
      const countResult = await db.query(countSql, params);
      const total = parseInt(countResult.rows[0].count);

      // Tri
      switch (query.sort) {
        case 'price_asc': sql += ` ORDER BY p.price ASC`; break;
        case 'price_desc': sql += ` ORDER BY p.price DESC`; break;
        case 'newest': sql += ` ORDER BY p.created_at DESC`; break;
        case 'oldest': sql += ` ORDER BY p.created_at ASC`; break;
        case 'name_asc': sql += ` ORDER BY p.name ASC`; break;
        case 'name_desc': sql += ` ORDER BY p.name DESC`; break;
        case 'popular': sql += ` ORDER BY review_count DESC, avg_rating DESC`; break;
        default: sql += ` ORDER BY p.is_featured DESC, p.created_at DESC`;
      }

      // Pagination
      sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await db.query(sql, params);

      const response = paginatedResponse(result.rows, total, page, limit);

      // Cache pour 5 minutes
      if (!query.search) {
        await redis.set(cacheKey, JSON.stringify(response), 300);
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Détail d'un produit
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const cacheKey = `product:${id}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const result = await db.query(
        `SELECT p.*, 
                COALESCE(AVG(pr.rating), 0) as avg_rating,
                COUNT(pr.id) as review_count
         FROM products p
         LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.is_approved = true
         WHERE p.id = $1 AND p.deleted_at IS NULL
         GROUP BY p.id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      // Récupérer les avis récents
      const reviews = await db.query(
        `SELECT pr.*, c.full_name as customer_name
         FROM product_reviews pr
         JOIN customers c ON c.id = pr.customer_id
         WHERE pr.product_id = $1 AND pr.is_approved = true
         ORDER BY pr.created_at DESC
         LIMIT 10`,
        [id]
      );

      // Produits similaires (même catégorie)
      const similar = await db.query(
        `SELECT id, name, slug, price, compare_at_price, thumbnail, stock_quantity, avg_rating
         FROM (
           SELECT p.*, COALESCE(AVG(pr.rating), 0) as avg_rating
           FROM products p
           LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.is_approved = true
           WHERE p.category = $1 AND p.id != $2 AND p.is_published = true AND p.deleted_at IS NULL
           GROUP BY p.id
         ) sub
         ORDER BY RANDOM()
         LIMIT 8`,
        [result.rows[0].category, id]
      );

      const product = {
        ...result.rows[0],
        reviews: reviews.rows,
        similar_products: similar.rows,
      };

      // Cache pour 5 minutes
      await redis.set(cacheKey, JSON.stringify(apiResponse(product)), 300);

      res.json(apiResponse(product));
    } catch (error) {
      next(error);
    }
  }

  // Détail par slug
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const result = await db.query(
        `SELECT p.*, 
                COALESCE(AVG(pr.rating), 0) as avg_rating,
                COUNT(pr.id) as review_count
         FROM products p
         LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.is_approved = true
         WHERE p.slug = $1 AND p.deleted_at IS NULL
         GROUP BY p.id`,
        [slug]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      res.json(apiResponse(result.rows[0]));
    } catch (error) {
      next(error);
    }
  }

  // Admin : Créer un produit
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);

      // Générer le slug
      let slug = generateSlug(data.name);
      const existingSlug = await db.query('SELECT id FROM products WHERE slug = $1', [slug]);
      if (existingSlug.rows.length > 0) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      // Générer le SKU si pas fourni
      const sku = data.brand ? generateSKU(data.category, data.brand) : generateSKU(data.category, 'NL');

      const result = await db.query(
        `INSERT INTO products (sku, name, slug, description, short_description, category, subcategory,
          brand, model, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold,
          weight_grams, specifications, tags, is_published, is_featured, meta_title, meta_description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING *`,
        [
          sku, data.name, slug, data.description, data.short_description,
          data.category, data.subcategory, data.brand, data.model,
          data.price, data.compare_at_price, data.cost_price,
          data.stock_quantity, data.low_stock_threshold,
          data.weight_grams, JSON.stringify(data.specifications || {}),
          data.tags, data.is_published, data.is_featured,
          data.meta_title, data.meta_description,
        ]
      );

      // Invalider le cache
      await redis.client.del('products:list:*');

      res.status(201).json(apiResponse(result.rows[0], 'Produit créé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Admin : Modifier un produit
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateProductSchema.parse(req.body);

      // Vérifier l'existence
      const existing = await db.query(
        'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      if (existing.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      // Construire la requête de mise à jour
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      const fields = [
        'name', 'description', 'short_description', 'category', 'subcategory',
        'brand', 'model', 'price', 'compare_at_price', 'cost_price',
        'stock_quantity', 'low_stock_threshold', 'weight_grams',
        'specifications', 'tags', 'is_published', 'is_featured',
        'meta_title', 'meta_description',
      ];

      for (const field of fields) {
        if (data[field as keyof typeof data] !== undefined) {
          updates.push(`${field} = $${paramCount++}`);
          const value = data[field as keyof typeof data];
          values.push(
            field === 'specifications' ? JSON.stringify(value) :
            field === 'tags' && Array.isArray(value) ? value : value
          );
        }
      }

      // Mettre à jour le slug si le nom change
      if (data.name) {
        let slug = generateSlug(data.name);
        const slugExists = await db.query(
          'SELECT id FROM products WHERE slug = $1 AND id != $2',
          [slug, id]
        );
        if (slugExists.rows.length > 0) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }
        updates.push(`slug = $${paramCount++}`);
        values.push(slug);
      }

      if (updates.length === 0) {
        throw new BadRequestError('Aucune modification à effectuer');
      }

      values.push(id);

      const result = await db.query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      // Invalider les caches
      await redis.client.del(`product:${id}`);
      await redis.client.del('products:list:*');

      res.json(apiResponse(result.rows[0], 'Produit mis à jour'));
    } catch (error) {
      next(error);
    }
  }

  // Admin : Supprimer un produit (soft delete)
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `UPDATE products SET deleted_at = NOW(), is_published = false WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      await redis.client.del(`product:${id}`);
      await redis.client.del('products:list:*');

      res.json(apiResponse(null, 'Produit supprimé'));
    } catch (error) {
      next(error);
    }
  }

  // Admin : Uploader des images produit
  static async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new BadRequestError('Aucune image fournie');
      }

      // Vérifier l'existence du produit
      const product = await db.query(
        'SELECT id, images FROM products WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      if (product.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      const currentImages = product.rows[0].images || [];
      const maxImages = 8;

      if (currentImages.length + files.length > maxImages) {
        throw new BadRequestError(`Maximum ${maxImages} images par produit`);
      }

      // Uploader chaque image
      const uploadedImages: { url: string; thumbnail: string; key: string }[] = [];
      
      for (const file of files) {
        const result = await uploadService.uploadProductImage(file.buffer, file.originalname, id);
        uploadedImages.push(result);
      }

      // Mettre à jour les images du produit
      const newImages = [
        ...currentImages,
        ...uploadedImages.map(img => ({ url: img.url, thumbnail: img.thumbnail, key: img.key })),
      ];

      const firstThumbnail = currentImages.length === 0 ? uploadedImages[0].thumbnail : null;

      await db.query(
        `UPDATE products SET images = $1, thumbnail = COALESCE($2, thumbnail) WHERE id = $3`,
        [JSON.stringify(newImages), firstThumbnail, id]
      );

      await redis.client.del(`product:${id}`);
      await redis.client.del('products:list:*');

      res.json(apiResponse({ images: newImages }, `${files.length} image(s) ajoutée(s)`));
    } catch (error) {
      next(error);
    }
  }

  // Admin : Supprimer une image produit
  static async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, imageKey } = req.params;

      const product = await db.query(
        'SELECT id, images, thumbnail FROM products WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      if (product.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      const images = product.rows[0].images || [];
      const imageIndex = images.findIndex((img: any) => img.key === imageKey);

      if (imageIndex === -1) {
        throw new NotFoundError('Image non trouvée');
      }

      // Supprimer du stockage
      const imageToDelete = images[imageIndex];
      await uploadService.deleteFile(imageToDelete.key);
      // Chercher et supprimer le thumbnail correspondant
      const thumbKey = imageToDelete.key.replace(/(\.[^.]+)$/, '-thumb$1');
      await uploadService.deleteFile(thumbKey);

      // Retirer du tableau
      images.splice(imageIndex, 1);

      // Mettre à jour le thumbnail si nécessaire
      let thumbnail = product.rows[0].thumbnail;
      if (thumbnail && thumbnail.includes(imageKey)) {
        thumbnail = images.length > 0 ? images[0].thumbnail : null;
      }

      await db.query(
        `UPDATE products SET images = $1, thumbnail = $2 WHERE id = $3`,
        [JSON.stringify(images), thumbnail, id]
      );

      await redis.client.del(`product:${id}`);
      await redis.client.del('products:list:*');

      res.json(apiResponse({ images }, 'Image supprimée'));
    } catch (error) {
      next(error);
    }
  }

  // Récupérer les catégories distinctes
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'products:categories';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const result = await db.query(
        `SELECT category, COUNT(*) as product_count, 
                MIN(price) as min_price, MAX(price) as max_price
         FROM products 
         WHERE is_published = true AND deleted_at IS NULL
         GROUP BY category
         ORDER BY category`
      );

      await redis.set(cacheKey, JSON.stringify(apiResponse(result.rows)), 600);

      res.json(apiResponse(result.rows));
    } catch (error) {
      next(error);
    }
  }
}
