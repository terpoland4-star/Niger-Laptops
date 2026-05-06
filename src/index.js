/**
 * Niger Laptop - Backend API
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
const PORT = process.env.PORT || 5000;

// ========== CONFIGURATION CORS COMPLÈTE ==========
const allowedOrigins = [
    'https://terpoland4-star.github.io',
    'https://terpoland4-star.github.io/Niger-Laptops',
    'http://terpoland4-star.github.io',
    'http://terpoland4-star.github.io/Niger-Laptops',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000'
];

// Middleware CORS personnalisé (le plus fiable)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    } else {
        // Pour debug - log les origines bloquées
        console.log(`⚠️ CORS: Origine non autorisée - ${origin}`);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 heures
    
    // Répondre immédiatement aux requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Middleware CORS standard (complément)
app.use(cors({
    origin: function(origin, callback) {
        // Permettre les requêtes sans origine (ex: Postman, apps natives)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ CORS: Origine bloquée -', origin);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== LOGGER ==========
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - Origine: ${req.headers.origin || 'local'}`);
    next();
});

// ========== ROUTES ==========
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API Niger Laptop est opérationnelle',
        timestamp: new Date().toISOString(),
        cors: 'active'
    });
});

// Import des routes
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');

app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/contact', contactRoutes);

// Route 404 pour les routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({ success: false, error: 'Route non trouvée' });
});

// ========== CONNEXION MONGODB ==========
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connecté avec succès');
    } catch (error) {
        console.error('❌ Erreur connexion MongoDB:', error.message);
        console.log('⚠️ Le serveur continue sans MongoDB (mode dégradé)');
    }
}

// ========== DÉMARRAGE ==========
async function startServer() {
    await connectDB();
    
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 Niger Laptop - Backend API                   ║
║   📡 Port: ${PORT}                                    ║
║   ✅ Status: En ligne                              ║
║   🌐 CORS: Actif (${allowedOrigins.length} origines)   ║
╚════════════════════════════════════════════════════╝
        `);
    });
}

startServer();
