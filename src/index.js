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
// Route santé
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API Niger Laptop est opérationnelle',
        timestamp: new Date().toISOString(),
        cors: 'active'
    });
});

// Route commande simple (sans MongoDB pour tester)
app.post('/api/orders/create', (req, res) => {
    console.log('📦 Commande reçue:', req.body);
    
    // Validation basique
    const { customer, items, subtotal, total } = req.body;
    
    if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city) {
        return res.status(400).json({ 
            success: false, 
            error: 'Tous les champs client sont requis' 
        });
    }
    
    if (!items || items.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Le panier est vide' 
        });
    }
    
    // Générer un numéro de commande
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `NL-${year}${month}${day}-${random}`;
    
    res.json({ 
        success: true, 
        orderNumber: orderNumber,
        message: 'Commande créée avec succès'
    });
});

// Route contact simple
app.post('/api/contact/send', (req, res) => {
    console.log('📧 Message contact reçu:', req.body);
    
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            error: 'Nom, email et message requis' 
        });
    }
    
    res.json({ 
        success: true, 
        message: 'Message envoyé avec succès' 
    });
});

// Route produits (version simple)
app.get('/api/products', (req, res) => {
    res.json({ 
        success: true, 
        products: [] 
    });
});

app.get('/api/products/featured', (req, res) => {
    res.json({ 
        success: true, 
        products: [] 
    });
});

// Route 404 - DOIT ÊTRE À LA FIN
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: `Route non trouvée: ${req.method} ${req.path}` 
    });
});

// ========== CONNEXION MONGODB (optionnelle) ==========
async function connectDB() {
    if (!process.env.MONGODB_URI) {
        console.log('⚠️ MONGODB_URI non définie, mode sans base de données');
        return;
    }
    
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
