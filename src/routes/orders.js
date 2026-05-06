const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { sendWhatsAppOrder } = require('../services/whatsapp');
const { sendOrderConfirmationEmail } = require('../services/email');

// Middleware CORS spécifique pour cette route
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * Générer un numéro de commande unique
 * Format: NL-YYYYMMDD-XXXX
 */
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NL-${year}${month}${day}-${random}`;
}

/**
 * POST /api/orders/create
 * Créer une nouvelle commande
 */
router.post('/create', async (req, res) => {
    try {
        const { customer, items, delivery, promoCode, discount, subtotal, total, notes } = req.body;
        
        console.log('📦 Réception commande:', { customer: customer?.name, itemsCount: items?.length });
        
        // Validation des données requises
        if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tous les champs client requis sont obligatoires (nom, téléphone, adresse, ville)' 
            });
        }
        
        if (!items || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Le panier ne peut pas être vide' 
            });
        }
        
        // Créer la commande
        const order = new Order({
            orderNumber: generateOrderNumber(),
            customer: {
                name: customer.name,
                phone: customer.phone,
                email: customer.email || null,
                address: customer.address,
                city: customer.city,
                quarter: customer.quarter || null,
                notes: customer.notes || null
            },
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            delivery: {
                type: delivery?.type || 'standard',
                fee: delivery?.fee || 2500
            },
            promoCode: promoCode || null,
            discount: discount || 0,
            subtotal: subtotal,
            total: total,
            notes: notes || null,
            status: 'pending',
            paymentMethod: 'cash_on_delivery'
        });
        
        await order.save();
        console.log(`✅ Nouvelle commande créée: ${order.orderNumber}`);
        
        // Envoyer notification WhatsApp (ne pas bloquer si erreur)
        try {
            const whatsappResult = await sendWhatsAppOrder(order);
            console.log(`📱 WhatsApp: ${whatsappResult.success ? 'OK' : 'Échec'}`);
        } catch (whatsappError) {
            console.log('⚠️ Erreur WhatsApp:', whatsappError.message);
        }
        
        // Envoyer email de confirmation (si email fourni)
        if (customer.email) {
            try {
                await sendOrderConfirmationEmail(order);
                console.log(`📧 Email envoyé à ${customer.email}`);
            } catch (emailError) {
                console.log('⚠️ Erreur email:', emailError.message);
            }
        }
        
        res.status(201).json({
            success: true,
            orderNumber: order.orderNumber,
            message: 'Commande créée avec succès'
        });
        
    } catch (error) {
        console.error('❌ Erreur création commande:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur interne du serveur: ' + error.message 
        });
    }
});

/**
 * GET /api/orders/:orderNumber
 * Récupérer une commande par son numéro
 */
router.get('/:orderNumber', async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Commande non trouvée' 
            });
        }
        
        res.json({ success: true, order });
        
    } catch (error) {
        console.error('❌ Erreur récupération commande:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur interne du serveur' 
        });
    }
});

/**
 * GET /api/orders/status/:orderNumber
 * Vérifier le statut d'une commande
 */
router.get('/status/:orderNumber', async (req, res) => {
    try {
        const order = await Order.findOne({ 
            orderNumber: req.params.orderNumber 
        }).select('orderNumber status createdAt total');
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Commande non trouvée' 
            });
        }
        
        res.json({ success: true, status: order.status, order });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
