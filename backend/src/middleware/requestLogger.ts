import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { env } from '../config/env';

export const requestLogger = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Ajouter requestId à la requête
  (req as any).requestId = requestId;

  // Logger la réponse
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100),
      timestamp: new Date().toISOString(),
    };

    if (env.IS_DEV) {
      const emoji = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
      console.log(`${emoji} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }

    // Stocker dans Redis pour analytics (les 10 000 dernières requêtes)
    try {
      await redis.client.lPush('api:request_logs', JSON.stringify(logData));
      await redis.client.lTrim('api:request_logs', 0, 9999);

      // Incrémenter compteur pour cette route
      const counterKey = `api:counter:${req.method}:${req.route?.path || req.path}`;
      await redis.client.incr(counterKey);
      await redis.client.expire(counterKey, 86400); // 24h
    } catch (error) {
      // Ne pas bloquer si Redis échoue
    }
  });

  next();
};
