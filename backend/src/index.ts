import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { db } from './config/database';
import { redis } from './config/redis';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import orderRoutes from './routes/orders.routes';
import paymentRoutes from './routes/payments.routes';
import adminRoutes from './routes/admin.routes';
import categoryRoutes from './routes/categories.routes';
import bannerRoutes from './routes/banners.routes';

const app = express();

// ==========================================
// MIDDLEWARES GLOBAUX
// ==========================================

// Sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: env.IS_PROD ? undefined : false,
}));

// CORS
app.use(cors({
  origin: env.IS_DEV ? '*' : [
    'https://nigerlaptops.ne',
    'https://admin.nigerlaptops.ne',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost:4000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.IS_DEV) {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
});
app.use(globalLimiter);

// Rate limiting plus strict pour l'auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
  },
});

// ==========================================
// ROUTES
// ==========================================

// Santé du serveur
app.get('/api/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  const redisHealthy = await redis.healthCheck();

  res.json({
    success: true,
    app: env.APP_NAME || 'Niger Laptops API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      redis: redisHealthy ? 'healthy' : 'unhealthy',
    },
  });
});

// Routes API
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/banners', bannerRoutes);

// ==========================================
// GESTION ERREURS
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// DÉMARRAGE
// ==========================================
const startServer = async () => {
  try {
    // Connexion Redis
    await redis.connect();
    console.log('✅ Redis connecté');

    // Test connexion DB
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    console.log('✅ Base de données connectée');

    // Démarrage serveur
    app.listen(env.PORT, () => {
      console.log(`
╔══════════════════════════════════════════╗
║        🚀 NIGER LAPTOPS API v1.0        ║
╠══════════════════════════════════════════╣
║  Environnement : ${env.NODE_ENV.padEnd(22)}║
║  Port          : ${String(env.PORT).padEnd(22)}║
║  Base données  : ${env.DB_NAME.padEnd(22)}║
║  URL           : http://localhost:${env.PORT}  ║
╚══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
};

// Gestion arrêt gracieux
process.on('SIGTERM', async () => {
  console.log('👋 Arrêt gracieux...');
  await redis.disconnect();
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 Arrêt forcé...');
  await redis.disconnect();
  await db.pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

startServer();
