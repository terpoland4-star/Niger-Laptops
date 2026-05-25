import { env } from '../config/env';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { SMS_TEMPLATES, LIMITS } from '../utils/constants';
import { generateOTP } from '../utils/helpers';

// Interface pour le service SMS
interface SmsProvider {
  send(phone: string, message: string): Promise<boolean>;
}

// Provider Twilio (production)
class TwilioProvider implements SmsProvider {
  private client: any;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = await import('twilio');
        this.client = twilio.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        this.initialized = true;
        console.log('✅ Twilio initialisé');
      } catch (error) {
        console.warn('⚠️ Twilio non disponible, mode développement');
      }
    }
  }

  async send(phone: string, message: string): Promise<boolean> {
    if (!this.initialized || !this.client) {
      console.log(`📱 [DEV] SMS to ${phone}: ${message}`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur Twilio:', error);
      return false;
    }
  }
}

// Provider console (développement)
class ConsoleProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<boolean> {
    console.log(`\n📱 ======= SMS SENT =======`);
    console.log(`   To: ${phone}`);
    console.log(`   Message: ${message}`);
    console.log(`   ========================\n`);
    return true;
  }
}

class SmsService {
  private provider: SmsProvider;

  constructor() {
    if (env.IS_PROD && env.TWILIO_ACCOUNT_SID) {
      this.provider = new TwilioProvider();
    } else {
      this.provider = new ConsoleProvider();
    }
  }

  // Envoyer OTP
  async sendOTP(phone: string): Promise<{ success: boolean; expiresAt: Date }> {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + LIMITS.OTP_EXPIRY_MINUTES * 60 * 1000);
    const message = SMS_TEMPLATES.OTP(otp);

    // Supprimer les anciens OTP pour ce numéro
    await db.query('DELETE FROM otp_sessions WHERE phone = $1', [phone]);

    // Stocker le nouvel OTP
    await db.query(
      'INSERT INTO otp_sessions (phone, otp_code, expires_at) VALUES ($1, $2, $3)',
      [phone, otp, expiresAt]
    );

    // Envoyer
    const sent = await this.provider.send(phone, message);

    if (!sent) {
      throw new Error('Échec de l\'envoi du SMS');
    }

    // Rate limiting: 1 OTP par minute par numéro
    await redis.set(`otp_rate:${phone}`, '1', 60);

    return { success: true, expiresAt };
  }

  // Vérifier OTP
  async verifyOTP(phone: string, code: string): Promise<boolean> {
    const result = await db.query(
      `SELECT id, otp_code, attempts, expires_at 
       FROM otp_sessions 
       WHERE phone = $1 
         AND expires_at > NOW() 
         AND is_verified = false 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [phone]
    );

    if (result.rows.length === 0) {
      throw new Error('Aucun OTP trouvé. Veuillez en demander un nouveau.');
    }

    const otpSession = result.rows[0];

    // Vérifier le nombre de tentatives
    if (otpSession.attempts >= LIMITS.OTP_MAX_ATTEMPTS) {
      await db.query('DELETE FROM otp_sessions WHERE phone = $1', [phone]);
      throw new Error('Trop de tentatives. Veuillez demander un nouveau code.');
    }

    // Incrémenter les tentatives
    await db.query(
      'UPDATE otp_sessions SET attempts = attempts + 1 WHERE id = $1',
      [otpSession.id]
    );

    // Vérifier le code
    if (otpSession.otp_code !== code) {
      throw new Error('Code OTP incorrect');
    }

    // Marquer comme vérifié
    await db.query(
      'UPDATE otp_sessions SET is_verified = true WHERE id = $1',
      [otpSession.id]
    );

    return true;
  }

  // Vérifier si un OTP peut être envoyé (rate limit)
  async canSendOTP(phone: string): Promise<boolean> {
    const rateKey = `otp_rate:${phone}`;
    const exists = await redis.exists(rateKey);
    return !exists;
  }

  // Envoyer notification de commande
  async sendOrderConfirmation(phone: string, orderNumber: string): Promise<void> {
    const message = SMS_TEMPLATES.ORDER_CONFIRMED(orderNumber);
    await this.provider.send(phone, message);
  }

  // Envoyer notification de livraison
  async sendDeliveryNotification(phone: string, orderNumber: string): Promise<void> {
    const message = SMS_TEMPLATES.ORDER_OUT_FOR_DELIVERY(orderNumber);
    await this.provider.send(phone, message);
  }

  // Envoyer notification de livraison terminée
  async sendDeliveredNotification(phone: string, orderNumber: string): Promise<void> {
    const message = SMS_TEMPLATES.ORDER_DELIVERED(orderNumber);
    await this.provider.send(phone, message);
  }

  // Envoyer message personnalisé
  async sendCustomMessage(phone: string, message: string): Promise<boolean> {
    return this.provider.send(phone, message);
  }
}

export const smsService = new SmsService();
