const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: null },
    image: { type: String, required: true },
    badge: { type: String, enum: ['sale', 'new', null], default: null },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    description: { type: String, required: true },
    specs: { type: Object, default: {} },
    stock: { type: Number, default: 10, min: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

ProductSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Product', ProductSchema);
