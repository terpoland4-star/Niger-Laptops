let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, quantity = 1) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }
    saveCart();
    showToast('Produit ajouté au panier');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function updateQuantity(productId, quantity) {
    const item = cart.find(i => i.id === productId);
    if (item && quantity > 0) {
        item.quantity = quantity;
    } else if (item && quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    saveCart();
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = getCartCount();
  }
