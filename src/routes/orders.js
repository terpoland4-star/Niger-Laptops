
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { sendWhatsAppOrder } = require('../services/whatsapp');
const { sendOrderConfirmationEmail } = require('../services/email');

function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NL-${year}${month}${day}-${random}`;
}

router.post('/create', async (req, res) => {
    try {
        const { customer, items, delivery, promoCode, discount, subtotal, total, notes } = req.body;
        
        if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city) {
            return res.status(400).json({ success: false, error: 'Tous les champs client sont requis' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Le panier est vide' });
        }
        
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
            delivery: { type: delivery?.type || 'standard', fee: delivery?.fee || 2500 },
            promoCode: promoCode || null,
            discount: discount || 0,
            subtotal: subtotal,
            total: total,
            notes: notes || null
        });
        
        await order.save();
        console.log(`✅ Commande créée: ${order.orderNumber}`);
        
        await sendWhatsAppOrder(order);
        if (customer.email) await sendOrderConfirmationEmail(order);
        
        res.status(201).json({ success: true, orderNumber: order.orderNumber, message: 'Commande créée' });
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

router.get('/:orderNumber', async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        if (!order) return res.status(404).json({ success: false, error: 'Commande non trouvée' });
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
