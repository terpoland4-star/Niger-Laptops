import { env } from '../config/env';
import { db } from '../config/database';
import { BadRequestError } from '../middleware/errorHandler';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../utils/constants';
import crypto from 'crypto';

interface PaymentProvider {
  requestPayment(phone: string, amount: number, reference: string, orderId: string): Promise<{ success: boolean; gatewayReference?: string; message?: string }>;
  checkStatus(gatewayReference: string): Promise<{ status: string; message?: string }>;
}

// ---------- ORANGE MONEY ----------
class OrangeMoneyProvider implements PaymentProvider {
  private apiKey: string;
  private apiSecret: string;
  private merchantId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.OM_API_KEY || '';
    this.apiSecret = env.OM_API_SECRET || '';
    this.merchantId = env.OM_MERCHANT_ID || '';
    this.baseUrl = env.IS_DEV
      ? 'https://api.sandbox.orange-sonatel.com'
      : 'https://api.orange.com';
  }

  private generateToken(): string {
    return Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
  }

  async requestPayment(phone: string, amount: number, reference: string, orderId: string) {
    if (env.IS_DEV || !this.apiKey) {
      console.log(`🧪 [DEV] Orange Money simulé: ${amount} FCFA`);
      return {
        success: true,
        gatewayReference: `OM-DEV-${crypto.randomBytes(6).toString('hex')}`,
        message: 'Paiement simulé réussi',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/orange-money-webpay/cm/v1/webpayment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.generateToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_key: this.merchantId,
          currency: 'XOF',
          order_id: orderId,
          amount: amount,
          return_url: `${env.APP_URL}/api/v1/payments/callback/orange`,
          cancel_url: `${env.APP_URL}/api/v1/payments/cancel`,
          notif_url: `${env.APP_URL}/api/v1/payments/webhook/orange`,
          lang: 'fr',
          reference: reference,
        }),
      });

      const data = await response.json();
      if (response.ok && data.pay_token) {
        return { success: true, gatewayReference: data.pay_token, message: 'Demande envoyée' };
      }
      return { success: false, message: data.message || 'Erreur Orange Money' };
    } catch (error) {
      console.error('❌ Orange Money:', error);
      return { success: false, message: 'Service Orange Money indisponible' };
    }
  }

  async checkStatus(gatewayReference: string) {
    if (env.IS_DEV || !this.apiKey) return { status: 'completed' };
    try {
      const response = await fetch(`${this.baseUrl}/orange-money-webpay/cm/v1/transactionstatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.generateToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pay_token: gatewayReference }),
      });
      const data = await response.json();
      return { status: data.status === 'SUCCESS' ? 'completed' : 'pending', message: data.message };
    } catch (error) {
      return { status: 'error', message: 'Erreur vérification' };
    }
  }
}

// ---------- AIRTEL MONEY ----------
class AirtelMoneyProvider implements PaymentProvider {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.AM_API_KEY || '';
    this.apiSecret = env.AM_API_SECRET || '';
    this.baseUrl = env.IS_DEV
      ? 'https://api.sandbox.airtel.africa'
      : 'https://openapi.airtel.africa';
  }

  private generateToken(): string {
    return Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
  }

  async requestPayment(phone: string, amount: number, reference: string, orderId: string) {
    if (env.IS_DEV || !this.apiKey) {
      console.log(`🧪 [DEV] Airtel Money simulé: ${amount} FCFA`);
      return {
        success: true,
        gatewayReference: `AM-DEV-${crypto.randomBytes(6).toString('hex')}`,
        message: 'Paiement simulé réussi',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/merchant/v1/payments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.generateToken()}`,
          'Content-Type': 'application/json',
          'X-Country': 'NE',
          'X-Currency': 'XOF',
        },
        body: JSON.stringify({
          reference: reference,
          subscriber: { country: 'NE', currency: 'XOF', msisdn: phone },
          transaction: { amount: amount, country: 'NE', currency: 'XOF', id: orderId },
        }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'SUCCESS') {
        return { success: true, gatewayReference: data.transaction.id, message: 'Paiement effectué' };
      }
      return { success: false, message: data.message || 'Erreur Airtel Money' };
    } catch (error) {
      console.error('❌ Airtel Money:', error);
      return { success: false, message: 'Service Airtel Money indisponible' };
    }
  }

  async checkStatus(gatewayReference: string) {
    if (env.IS_DEV || !this.apiKey) return { status: 'completed' };
    try {
      const response = await fetch(`${this.baseUrl}/standard/v1/payments/${gatewayReference}`, {
        headers: { 'Authorization': `Bearer ${this.generateToken()}`, 'X-Country': 'NE' },
      });
      const data = await response.json();
      return {
        status: data.status === 'SUCCESS' ? 'completed' : data.status === 'FAILED' ? 'failed' : 'pending',
        message: data.message,
      };
    } catch (error) {
      return { status: 'error', message: 'Erreur vérification' };
    }
  }
}

// ---------- MYNITA ----------
class MyNitaProvider implements PaymentProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.MYNITA_API_KEY || '';
    this.baseUrl = env.IS_DEV
      ? 'https://api.sandbox.mynita.ne'
      : 'https://api.mynita.ne';
  }

  async requestPayment(phone: string, amount: number, reference: string, orderId: string) {
    if (env.IS_DEV || !this.apiKey) {
      console.log(`🧪 [DEV] MyNita simulé: ${amount} FCFA`);
      return {
        success: true,
        gatewayReference: `MN-DEV-${crypto.randomBytes(6).toString('hex')}`,
        message: 'Paiement MyNita simulé réussi',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          amount: amount,
          currency: 'XOF',
          order_id: orderId,
          reference: reference,
        }),
      });

      const data = await response.json();
      if (response.ok && data.transaction_id) {
        return { success: true, gatewayReference: data.transaction_id, message: 'Paiement initié' };
      }
      return { success: false, message: data.message || 'Erreur MyNita' };
    } catch (error) {
      console.error('❌ MyNita:', error);
      return { success: false, message: 'Service MyNita indisponible' };
    }
  }

  async checkStatus(gatewayReference: string) {
    if (env.IS_DEV || !this.apiKey) return { status: 'completed' };
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/${gatewayReference}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      const data = await response.json();
      return {
        status: data.status === 'SUCCESS' ? 'completed' : data.status === 'FAILED' ? 'failed' : 'pending',
        message: data.message,
      };
    } catch (error) {
      return { status: 'error', message: 'Erreur vérification' };
    }
  }
}

// ---------- AMANATA ----------
class AmanaTaProvider implements PaymentProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.AMANATA_API_KEY || '';
    this.baseUrl = env.IS_DEV
      ? 'https://api.sandbox.amanata.ne'
      : 'https://api.amanata.ne';
  }

  async requestPayment(phone: string, amount: number, reference: string, orderId: string) {
    if (env.IS_DEV || !this.apiKey) {
      console.log(`🧪 [DEV] AmanaTa simulé: ${amount} FCFA`);
      return {
        success: true,
        gatewayReference: `AT-DEV-${crypto.randomBytes(6).toString('hex')}`,
        message: 'Paiement AmanaTa simulé réussi',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/merchant/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msisdn: phone,
          amount: amount,
          currency: 'XOF',
          external_id: orderId,
          reference: reference,
        }),
      });

      const data = await response.json();
      if (response.ok && data.id) {
        return { success: true, gatewayReference: data.id, message: 'Paiement initié' };
      }
      return { success: false, message: data.message || 'Erreur AmanaTa' };
    } catch (error) {
      console.error('❌ AmanaTa:', error);
      return { success: false, message: 'Service AmanaTa indisponible' };
    }
  }

  async checkStatus(gatewayReference: string) {
    if (env.IS_DEV || !this.apiKey) return { status: 'completed' };
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payment/status/${gatewayReference}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      const data = await response.json();
      return {
        status: data.status === 'SUCCESS' ? 'completed' : data.status === 'FAILED' ? 'failed' : 'pending',
        message: data.message,
      };
    } catch (error) {
      return { status: 'error', message: 'Erreur vérification' };
    }
  }
}

// ---------- CARTE BANCAIRE (Visa/Mastercard via PayDunya ou similaire) ----------
class CardProvider implements PaymentProvider {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.CARD_API_KEY || '';
    this.apiSecret = env.CARD_API_SECRET || '';
    this.baseUrl = env.IS_DEV
      ? 'https://api.sandbox.paydunya.com'
      : 'https://api.paydunya.com';
  }

  async requestPayment(phone: string, amount: number, reference: string, orderId: string) {
    // phone n'est pas nécessaire pour le paiement par carte, mais on le garde par cohérence
    if (env.IS_DEV || !this.apiKey) {
      console.log(`🧪 [DEV] Carte Bancaire simulé: ${amount} FCFA`);
      return {
        success: true,
        gatewayReference: `CARD-DEV-${crypto.randomBytes(6).toString('hex')}`,
        message: 'Paiement par carte simulé réussi',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/softpay/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'xof',
          description: `Commande ${orderId}`,
          external_id: reference,
          return_url: `${env.APP_URL}/api/v1/payments/callback/card`,
          cancel_url: `${env.APP_URL}/api/v1/payments/cancel`,
        }),
      });

      const data = await response.json();
      if (response.ok && data.response_text === 'success') {
        return { success: true, gatewayReference: data.token, message: 'Redirection vers la page de paiement' };
      }
      return { success: false, message: data.message || 'Erreur carte bancaire' };
    } catch (error) {
      console.error('❌ Carte Bancaire:', error);
      return { success: false, message: 'Service carte bancaire indisponible' };
    }
  }

  async checkStatus(gatewayReference: string) {
    if (env.IS_DEV || !this.apiKey) return { status: 'completed' };
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/softpay/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: gatewayReference }),
      });
      const data = await response.json();
      return {
        status: data.status === 'completed' ? 'completed' : data.status === 'cancelled' ? 'failed' : 'pending',
        message: data.message,
      };
    } catch (error) {
      return { status: 'error', message: 'Erreur vérification' };
    }
  }
}

// ---------- VIREMENT BANCAIRE ----------
class BankTransferProvider implements PaymentProvider {
  async requestPayment(phone: string, amount: number, reference: string, orderId: string) {
    console.log(`🏦 [VIREMENT] Commande ${orderId} en attente de virement`);
    return {
      success: true,
      gatewayReference: `BANK-${crypto.randomBytes(6).toString('hex')}`,
      message: 'Virement bancaire enregistré. Veuillez effectuer le virement.',
    };
  }

  async checkStatus(gatewayReference: string) {
    return { status: 'pending' };
  }
}

// ---------- SERVICE UNIFIÉ ----------
class PaymentService {
  private providers: Record<string, PaymentProvider> = {};

  constructor() {
    this.providers = {
      orange_money: new OrangeMoneyProvider(),
      airtel_money: new AirtelMoneyProvider(),
      mynita: new MyNitaProvider(),
      amanata: new AmanaTaProvider(),
      card: new CardProvider(),
      bank_transfer: new BankTransferProvider(),
    };
  }

  getProvider(method: string): PaymentProvider {
    const provider = this.providers[method];
    if (!provider) {
      throw new BadRequestError(`Méthode de paiement non supportée: ${method}`);
    }
    return provider;
  }

  async initiatePayment(orderId: string, amount: number, phone: string, method: string) {
    const provider = this.getProvider(method);
    const reference = `PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    await db.query(
      `INSERT INTO payment_logs (order_id, payment_method, amount, currency, reference, status)
       VALUES ($1, $2, $3, 'XOF', $4, 'processing')`,
      [orderId, method, amount, reference]
    );

    const result = await provider.requestPayment(phone, amount, reference, orderId);

    if (result.success) {
      await db.query(
        `UPDATE payment_logs SET gateway_reference = $1, status = 'completed' WHERE reference = $2`,
        [result.gatewayReference, reference]
      );

      // Pour le virement, on laisse le statut de paiement à 'pending'
      const paymentStatus = method === 'bank_transfer' ? 'pending' : 'completed';
      await db.query(
        `UPDATE orders SET payment_status = $1, payment_reference = $2, paid_at = NOW(), status = 'confirmed'
         WHERE id = $3`,
        [paymentStatus, result.gatewayReference, orderId]
      );
    } else {
      await db.query(
        `UPDATE payment_logs SET gateway_response = $1, status = 'failed' WHERE reference = $2`,
        [JSON.stringify(result), reference]
      );
    }

    return result;
  }

  async handleWebhook(method: string, payload: any) {
    console.log(`📥 Webhook ${method}:`, payload);
    const gatewayReference = payload.pay_token || payload.transaction?.id || payload.token;
    if (gatewayReference) {
      const log = await db.query(
        'SELECT order_id FROM payment_logs WHERE gateway_reference = $1',
        [gatewayReference]
      );
      if (log.rows.length > 0) {
        const status = payload.status === 'SUCCESS' || payload.response_text === 'success' ? 'completed' : 'failed';
        await db.query(
          `UPDATE payment_logs SET status = $1, gateway_response = $2 WHERE gateway_reference = $3`,
          [status, JSON.stringify(payload), gatewayReference]
        );
        if (status === 'completed') {
          await db.query(
            `UPDATE orders SET payment_status = 'completed', paid_at = NOW()
             WHERE id = $1 AND payment_status != 'completed'`,
            [log.rows[0].order_id]
          );
        }
      }
    }
  }
}

export const paymentService = new PaymentService();
