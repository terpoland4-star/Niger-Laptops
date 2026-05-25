import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { smsService } from '../services/sms.service';
import { generateOrderNumber, calculateDeliveryFee, estimateDeliveryTime, getPaginationParams, paginatedResponse, apiResponse } from '../utils/helpers';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { ORDER_STATUS, VALID_ORDER_TRANSITIONS, PAYMENT_METHODS, DELIVERY_METHODS, LIMITS, ERROR_MESSAGES } from '../utils/constants';
import { env } from '../config/env';

// Schéma de création de commande
const createOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid('ID produit invalide'),
    quantity: z.number().int().min(1, 'Quantité minimale: 1').max(LIMITS.MAX_QUANTITY_PER_ITEM),
  })).min(1, 'Au moins un produit requis').max(LIMITS.MAX_ITEMS_PER_ORDER),
  address_id: z.string().uuid('ID adresse invalide').optional(),
  delivery_address: z.object({
    full_name: z.string().min(1).max(200).optional(),
    phone: z.string().optional(),
    address_line1: z.string().min(1).max(500),
    address_line2: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    commune: z.string().max(50).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    instructions: z.string().max(500).optional(),
  }).optional(),
  delivery_method: z.enum(['home_delivery', 'pickup_point']).default('home_delivery'),
  payment_method: z.enum(['orange_money', 'airtel_money', 'cash_on_delivery']),
  coupon_code: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'confirmed', 'processing', 'ready_for_pickup', 
    'out_for_delivery', 'delivered', 'cancelled'
  ]),
  cancellation_reason: z.string().max(500).optional(),
});

export class OrdersController {
  // Créer une commande
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.customer!.id;
      const data = createOrderSchema.parse(req.body);

      // Vérifier et calculer les produits
      let subtotal = 0;
      const orderItems: any[] = [];
      const productUpdates: { id: string; newStock: number }[] = [];

      for (const item of data.items) {
        const product = await db.query(
          `SELECT id, name, sku, price, stock_quantity, images, is_published 
           FROM products WHERE id = $1 AND deleted_at IS NULL`,
          [item.product_id]
        );

        if (product.rows.length === 0) {
          throw new NotFoundError(`Produit ${item.product_id} non trouvé`);
        }

        const p = product.rows[0];

        if (!p.is_published) {
          throw new BadRequestError(`Le produit "${p.name}" n'est plus disponible`);
        }

        if (p.stock_quantity < item.quantity) {
          throw new BadRequestError(
            `Stock insuffisant pour "${p.name}". Disponible: ${p.stock_quantity}, Demandé: ${item.quantity}`
          );
        }

        const itemTotal = p.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: p.id,
          product_name: p.name,
          product_sku: p.sku,
          product_image: p.images?.[0]?.thumbnail || null,
          quantity: item.quantity,
          unit_price: p.price,
          total_price: itemTotal,
        });

        productUpdates.push({
          id: p.id,
          newStock: p.stock_quantity - item.quantity,
        });
      }

      // Calculer les frais de livraison
      let deliveryFee = 0;
      
      if (data.delivery_method === 'home_delivery') {
        if (subtotal >= 25000) {
          deliveryFee = 0; // Gratuit au-dessus de 25 000 FCFA
        } else if (data.delivery_address?.latitude && data.delivery_address?.longitude) {
          // Calculer la distance depuis le point de retrait principal (Grand Marché)
          const distanceResult = await db.query(
            `SELECT ST_Distance(
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              ST_SetSRID(ST_MakePoint(2.1150, 13.5126), 4326)::geography
            ) as distance`,
            [data.delivery_address.longitude, data.delivery_address.latitude]
          );
          const distance = distanceResult.rows[0]?.distance || 5000;
          deliveryFee = calculateDeliveryFee(distance);
        } else {
          deliveryFee = 1500; // Frais par défaut
        }
      }

      const total = subtotal + deliveryFee;

      // Créer la commande dans une transaction
      const order = await db.transaction(async (client) => {
        // Générer le numéro de commande
        const orderNumber = generateOrderNumber();

        // Insérer la commande
        let deliveryLocationQuery = 'NULL';
        const orderParams: any[] = [
          orderNumber, customerId, data.address_id || null,
          ORDER_STATUS.PENDING, 'pending', data.payment_method,
          data.delivery_method, subtotal, deliveryFee,
          0, data.coupon_code || null, 0, total,
          data.delivery_address ? JSON.stringify(data.delivery_address) : null,
          data.notes || null,
        ];

        if (data.delivery_address?.latitude && data.delivery_address?.longitude) {
          deliveryLocationQuery = `ST_SetSRID(ST_MakePoint($${orderParams.length + 1}, $${orderParams.length + 2}), 4326)`;
          orderParams.push(data.delivery_address.longitude, data.delivery_address.latitude);
        }

        const orderResult = await client.query(
          `INSERT INTO orders (
            order_number, customer_id, address_id, status, payment_status,
            payment_method, delivery_method, subtotal, delivery_fee,
            discount_amount, coupon_code, tax_amount, total,
            delivery_address, delivery_location, delivery_notes
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,${deliveryLocationQuery},$15)
          RETURNING *`,
          orderParams
        );

        const orderId = orderResult.rows[0].id;

        // Insérer les lignes de commande
        for (const item of orderItems) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, product_name, product_sku, product_image, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [orderId, item.product_id, item.product_name, item.product_sku, item.product_image, item.quantity, item.unit_price, item.total_price]
          );
        }

        // Mettre à jour les stocks
        for (const update of productUpdates) {
          await client.query(
            'UPDATE products SET stock_quantity = $1 WHERE id = $2',
            [update.newStock, update.id]
          );
        }

        return orderResult.rows[0];
      });

      // Envoyer notification SMS
      try {
        const customer = await db.query('SELECT phone FROM customers WHERE id = $1', [customerId]);
        if (customer.rows[0]?.phone) {
          await smsService.sendOrderConfirmation(customer.rows[0].phone, order.order_number);
        }
      } catch (smsError) {
        console.warn('⚠️ SMS non envoyé:', smsError);
      }

      // Invalider le cache
      await redis.client.del(`customer:${customerId}:orders`);
      await redis.client.del('products:list:*');

      // Récupérer la commande complète
      const fullOrder = await db.query(
        `SELECT o.*, 
                json_agg(json_build_object(
                  'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name,
                  'product_sku', oi.product_sku, 'product_image', oi.product_image,
                  'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price
                )) as items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.id = $1
         GROUP BY o.id`,
        [order.id]
      );

      res.status(201).json(apiResponse(fullOrder.rows[0], 'Commande créée avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les commandes du client
  static async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.customer!.id;
      const { page, limit, offset } = getPaginationParams(req.query);

      const status = req.query.status as string;

      let statusFilter = '';
      const params: any[] = [customerId];
      let paramCount = 2;

      if (status && Object.values(ORDER_STATUS).includes(status as any)) {
        statusFilter = ` AND o.status = $${paramCount++}`;
        params.push(status);
      }

      const countResult = await db.query(
        `SELECT COUNT(*) FROM orders o WHERE o.customer_id = $1${statusFilter}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await db.query(
        `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
                o.delivery_method, o.subtotal, o.delivery_fee, o.total,
                o.delivery_address, o.estimated_delivery_at, o.delivered_at,
                o.created_at, o.cancelled_at,
                json_agg(json_build_object(
                  'product_name', oi.product_name, 'product_image', oi.product_image,
                  'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price
                )) as items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.customer_id = $1${statusFilter}
         GROUP BY o.id
         ORDER BY o.created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...params, limit, offset]
      );

      res.json(paginatedResponse(result.rows, total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  // Détail d'une commande
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customerId = req.customer?.id;

      const result = await db.query(
        `SELECT o.*, 
                json_agg(json_build_object(
                  'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name,
                  'product_sku', oi.product_sku, 'product_image', oi.product_image,
                  'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price
                )) as items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.id = $1
         GROUP BY o.id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.ORDER_NOT_FOUND);
      }

      const order = result.rows[0];

      // Vérifier que c'est bien la commande du client (sauf admin)
      if (customerId && order.customer_id !== customerId && !req.admin) {
        throw new ForbiddenError('Cette commande ne vous appartient pas');
      }

      res.json(apiResponse(order));
    } catch (error) {
      next(error);
    }
  }

  // Suivi de commande (par numéro)
  static async trackByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber } = req.params;

      const result = await db.query(
        `SELECT o.order_number, o.status, o.payment_status, o.delivery_method,
                o.total, o.delivery_fee, o.estimated_delivery_at, o.delivered_at,
                o.created_at, o.cancelled_at, o.delivery_address,
                json_agg(json_build_object(
                  'product_name', oi.product_name, 'quantity', oi.quantity
                )) as items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.order_number = $1
         GROUP BY o.id`,
        [orderNumber]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Commande non trouvée');
      }

      res.json(apiResponse(result.rows[0]));
    } catch (error) {
      next(error);
    }
  }

  // Admin : Mettre à jour le statut
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, cancellation_reason } = updateOrderStatusSchema.parse(req.body);

      const order = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (order.rows.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.ORDER_NOT_FOUND);
      }

      const currentStatus = order.rows[0].status;

      // Vérifier la transition
      if (!VALID_ORDER_TRANSITIONS[currentStatus]?.includes(status)) {
        throw new BadRequestError(
          `Transition invalide: ${currentStatus} -> ${status}`
        );
      }

      const updates: any = { status };
      let deliveryDateField = '';

      if (status === 'confirmed') {
        updates.estimated_delivery_at = new Date(Date.now() + 60 * 60 * 1000); // +1h
        deliveryDateField = ', estimated_delivery_at = $3';
      }
      if (status === 'delivered') {
        updates.delivered_at = new Date();
        updates.payment_status = 'completed';
        deliveryDateField = ', delivered_at = $3, payment_status = $4';
      }
      if (status === 'cancelled') {
        updates.cancelled_at = new Date();
        updates.cancellation_reason = cancellation_reason || null;
        deliveryDateField = ', cancelled_at = $3, cancellation_reason = $4';
        
        // Restaurer les stocks
        const items = await db.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
          [id]
        );
        for (const item of items.rows) {
          await db.query(
            'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
            [item.quantity, item.product_id]
          );
        }
      }

      const updateValues: any[] = [status, id];
      if (status === 'confirmed' || status === 'delivered' || status === 'cancelled') {
        updateValues.push(updates.estimated_delivery_at || updates.delivered_at || updates.cancelled_at);
        if (status === 'delivered') updateValues.push('completed');
        if (status === 'cancelled') updateValues.push(cancellation_reason || null);
      }

      const result = await db.query(
        `UPDATE orders SET status = $1${deliveryDateField} WHERE id = $2 RETURNING *`,
        updateValues
      );

      // Notifier le client
      try {
        const customer = await db.query('SELECT phone FROM customers WHERE id = $1', [order.rows[0].customer_id]);
        if (customer.rows[0]?.phone) {
          if (status === 'out_for_delivery') {
            await smsService.sendDeliveryNotification(customer.rows[0].phone, order.rows[0].order_number);
          } else if (status === 'delivered') {
            await smsService.sendDeliveredNotification(customer.rows[0].phone, order.rows[0].order_number);
          }
        }
      } catch (smsError) {
        console.warn('⚠️ SMS non envoyé:', smsError);
      }

      // Invalider les caches
      await redis.client.del(`customer:${order.rows[0].customer_id}:orders`);
      await redis.client.del('admin:dashboard');

      res.json(apiResponse(result.rows[0], `Statut mis à jour: ${status}`));
    } catch (error) {
      next(error);
    }
  }

  // Admin : Liste toutes les commandes
  static async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset } = getPaginationParams(req.query);
      const status = req.query.status as string;

      let statusFilter = '';
      const params: any[] = [];
      let paramCount = 1;

      if (status && Object.values(ORDER_STATUS).includes(status as any)) {
        statusFilter = `WHERE o.status = $${paramCount++}`;
        params.push(status);
      }

      const countResult = await db.query(
        `SELECT COUNT(*) FROM orders o ${statusFilter}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await db.query(
        `SELECT o.*, c.full_name as customer_name, c.phone as customer_phone,
                (SELECT json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity))
                 FROM order_items oi WHERE oi.order_id = o.id) as items
         FROM orders o
         JOIN customers c ON c.id = o.customer_id
         ${statusFilter}
         ORDER BY o.created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...params, limit, offset]
      );

      res.json(paginatedResponse(result.rows, total, page, limit));
    } catch (error) {
      next(error);
    }
  }
}
