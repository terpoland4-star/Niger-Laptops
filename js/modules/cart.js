import { formatPrice, escapeHtml } from './utils.js';

// État du panier
let cart = [];
let promoCode = null;
const PROMOS = { 'NIGER10': 0.1, 'TECH20': 0.2 };

// Callbacks pour mettre à jour l'UI
let onCartUpdate = null;

export function setCartUpdateCallback(callback) {
    onCartUpdate = callback;
}

// Charger depuis localStorage
export function loadCart() {
    const saved = localStorage.getItem('nigerLaptopCart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch(e) { cart = []; }
    }
    promoCode = localStorage.getItem('nigerLaptopPromo') || null;
    if (onCartUpdate) onCartUpdate();
}

// Sauvegarder
function saveCart() {
    localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
    if (promoCode) localStorage.setItem('nigerLaptopPromo', promoCode);
    else localStorage.removeItem('nigerLaptopPromo');
    if (onCartUpdate) onCartUpdate();
}

// Ajouter un produit
export function addToCart(productId, products, showToast) {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ 
            id: product.id, 
            name: product.name, 
            price: product.price, 
            image: product.image, 
            quantity: 1 
        });
    }
    saveCart();
    if (showToast) showToast(`${escapeHtml(product.name)} ajouté au panier`, 'success');
    return true;
}

// Retirer un produit
export function removeFromCart(productId, showToast) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    if (showToast) showToast('Produit retiré', 'info');
}

// Modifier quantité
export function updateQuantity(productId, delta, showToast) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId, showToast);
    } else {
        saveCart();
    }
}

// Vider le panier
export function clearCart(silent = false) {
    cart = [];
    promoCode = null;
    saveCart();
    if (!silent && onCartUpdate) onCartUpdate();
}

// Appliquer code promo
export function applyPromo(code) {
    const upperCode = code.trim().toUpperCase();
    if (PROMOS[upperCode]) {
        promoCode = upperCode;
        saveCart();
        return { success: true, discount: PROMOS[upperCode] };
    }
    return { success: false };
}

// Total du panier
export function getCartTotal() {
    const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
    if (promoCode && PROMOS[promoCode]) {
        return Math.round(subtotal * (1 - PROMOS[promoCode]));
    }
    return subtotal;
}

// Nombre d'articles
export function getCartCount() {
    return cart.reduce((t, i) => t + i.quantity, 0);
}

// Obtenir le panier (pour affichage)
export function getCart() {
    return [...cart];
}

// Rendu HTML du panier
export function renderCartHTML() {
    if (cart.length === 0) {
        return '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size:48px;"></i><br>Votre panier est vide</div>';
    }
    
    return cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${escapeHtml(item.name)}" onerror="window.handleImageError?.(this)">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" data-id="${item.id}" data-delta="-1">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-id="${item.id}" data-delta="1">+</button>
                </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">🗑️</button>
        </div>
    `).join('');
}
