
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true }
});

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    quarter: { type: String, trim: true },
    notes: { type: String, trim: true }
});

const OrderSchema = new mongoose.Schema({
    orderNumber: { type: String, unique: true, required: true, index: true },
    customer: { type: CustomerSchema, required: true },
    items: [OrderItemSchema],
    delivery: { type: { type: String, enum: ['standard', 'express'], default: 'standard' }, fee: { type: Number, default: 2500 } },
    promoCode: { type: String, uppercase: true, default: null },
    discount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, default: 'cash_on_delivery' },
    whatsappSent: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

OrderSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

OrderSchema.methods.toTextFormat = function() {
    let text = `🛍️ *NOUVELLE COMMANDE - Niger Laptop*\n\n📋 N°: ${this.orderNumber}\n📅 Date: ${new Date(this.createdAt).toLocaleString('fr-FR')}\n\n👤 Client: ${this.customer.name}\n📞 Tél: ${this.customer.phone}\n📍 Adresse: ${this.customer.address}, ${this.customer.city}\n\n📦 Produits:\n`;
    this.items.forEach((item, i) => { text += `${i+1}. ${item.name} x${item.quantity} = ${item.total.toLocaleString('fr-FR')} FCFA\n`; });
    text += `\n💰 TOTAL: ${this.total.toLocaleString('fr-FR')} FCFA\n🚚 Livraison: ${this.delivery.type === 'express' ? 'Express' : 'Standard'}\n💵 Paiement: Espèces à la livraison`;
    return text;
};

module.exports = mongoose.model('Order', OrderSchema);
