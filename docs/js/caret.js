// ==========================================
// cart.js – Gestion du panier avec Optimistic UI
// ==========================================

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, quantity = 1) {
    // Optimistic UI : mise à jour immédiate
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }
    saveCart();
    showToast(t('addedToCart'), 'success');

    // Simulation d'appel API en arrière-plan (rollback en cas d'erreur)
    try {
        // Ici on pourrait appeler apiCall('/cart/add', { method: 'POST', body: ... })
        // Pour la démo, on ne fait rien.
    } catch (e) {
        // Rollback
        if (existing) {
            existing.quantity -= quantity;
            if (existing.quantity <= 0) removeFromCart(product.id);
        } else {
            removeFromCart(product.id);
        }
        showToast(t('errorProduct'), 'error');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function updateQuantity(productId, quantity) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    if (quantity <= 0) {
        removeFromCart(productId);
    } else {
        item.quantity = quantity;
        saveCart();
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
    const count = getCartCount();
    const el = document.getElementById('cart-count');
    if (el) {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// Exposition sur window pour compatibilité
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.getCartTotal = getCartTotal;
window.getCartCount = getCartCount;
window.updateCartCount = updateCartCount;
