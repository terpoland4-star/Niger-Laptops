const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5500', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API Niger Laptop opérationnelle', timestamp: new Date().toISOString() });
});

const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');

app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/contact', contactRoutes);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connecté');
    } catch (error) {
        console.error('❌ Erreur MongoDB:', error.message);
        process.exit(1);
    }
}

async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
}

startServer();
