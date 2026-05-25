import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { paymentService } from '../services/payments.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { apiResponse } from '../utils/helpers';
import { PAYMENT_METHODS } from '../utils/constants';

const initiatePaymentSchema = z.object({
  order_id: z.string().uuid('ID commande invalide'),
  phone: z.string().min(8).optional(),  // optionnel pour carte/virement
  method: z.enum([
    'orange_money',
    'airtel_money',
    'mynita',
    'amanata',
    'card',
    'bank_transfer',
    'cash_on_delivery',
  ]),
});

export class PaymentsController {
  static async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.customer!.id;
      const { order_id, phone, method } = initiatePaymentSchema.parse(req.body);

      // Si la méthode est cash_on_delivery, on ne passe pas par le paymentService
      if (method === 'cash_on_delivery') {
        // Mise à jour directe de la commande (déjà géré dans OrdersController)
        return res.json(apiResponse({ order_id }, 'Paiement à la livraison sélectionné'));
      }

      // Vérifier la commande
      const order = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
        [order_id, customerId]
      );
      if (order.rows.length === 0) {
        throw new NotFoundError('Commande non trouvée');
      }
      const orderData = order.rows[0];

      if (orderData.payment_status === 'completed') {
        throw new BadRequestError('Cette commande a déjà été payée');
      }
      if (orderData.status === 'cancelled') {
        throw new BadRequestError('Cette commande a été annulée');
      }

      // Pour les méthodes nécessitant un téléphone, vérifier qu'il est fourni
      const phoneRequiredMethods = ['orange_money', 'airtel_money', 'mynita', 'amanata'];
      if (phoneRequiredMethods.includes(method) && !phone) {
        throw new BadRequestError('Le numéro de téléphone est requis pour cette méthode de paiement');
      }

      // Utiliser un numéro par défaut si non fourni (carte, virement)
      const paymentPhone = phone || orderData.phone || '0000000000';

      const result = await paymentService.initiatePayment(
        order_id,
        orderData.total,
        paymentPhone,
        method
      );

      if (!result.success) {
        throw new BadRequestError(result.message || 'Le paiement a échoué');
      }

      res.json(apiResponse({
        order_id,
        gateway_reference: result.gatewayReference,
        message: result.message,
      }, 'Paiement initié'));
    } catch (error) {
      next(error);
    }
  }

  static async checkStatus(req: Request, res: Response, next: NextFunction) {
    // ... inchangé
    try {
      const { orderId } = req.params;
      const customerId = req.customer!.id;
      const log = await db.query(
        `SELECT pl.*, o.customer_id 
         FROM payment_logs pl 
         JOIN orders o ON o.id = pl.order_id 
         WHERE pl.order_id = $1 
         ORDER BY pl.created_at DESC 
         LIMIT 1`,
        [orderId]
      );
      if (log.rows.length === 0) throw new NotFoundError('Aucun paiement trouvé');
      if (log.rows[0].customer_id !== customerId) throw new ForbiddenError('Cette commande ne vous appartient pas');
      res.json(apiResponse({
        status: log.rows[0].status,
        method: log.rows[0].payment_method,
        amount: log.rows[0].amount,
        created_at: log.rows[0].created_at,
      }));
    } catch (error) {
      next(error);
    }
  }

  static async orangeWebhook(req: Request, res: Response) {
    await paymentService.handleWebhook('orange_money', req.body);
    res.status(200).json({ status: 'OK' });
  }
  static async airtelWebhook(req: Request, res: Response) {
    await paymentService.handleWebhook('airtel_money', req.body);
    res.status(200).json({ status: 'OK' });
  }
  static async mynitaWebhook(req: Request, res: Response) {
    await paymentService.handleWebhook('mynita', req.body);
    res.status(200).json({ status: 'OK' });
  }
  static async amanataWebhook(req: Request, res: Response) {
    await paymentService.handleWebhook('amanata', req.body);
    res.status(200).json({ status: 'OK' });
  }
  static async cardWebhook(req: Request, res: Response) {
    await paymentService.handleWebhook('card', req.body);
    res.status(200).json({ status: 'OK' });
  }

  static async callback(req: Request, res: Response) {
    const { status, order_id } = req.query;
    const redirectUrl = `nigerlaptops://payment/callback?status=${status}&order_id=${order_id}`;
    res.redirect(redirectUrl);
  }
                         }
