const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Middleware CORS
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

/**
 * GET /api/products
 * Récupérer tous les produits
 */
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ id: 1 });
        res.json({ success: true, products });
    } catch (error) {
        console.error('❌ Erreur récupération produits:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/products/featured
 * Récupérer les produits vedettes
 */
router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ featured: true }).limit(8);
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/products/:id
 * Récupérer un produit par son ID
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: parseInt(req.params.id) });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Produit non trouvé' });
        }
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
