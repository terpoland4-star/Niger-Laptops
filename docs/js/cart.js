// ==========================================
// cart.js – Liste d'intérêt (ex‑panier)
// ==========================================

let list = JSON.parse(localStorage.getItem('interestList') || '[]');

function saveList() {
    localStorage.setItem('interestList', JSON.stringify(list));
    updateListCount();
}

function addToList(product, quantity = 1) {
    const existing = list.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        list.push({ ...product, quantity });
    }
    saveList();
    showToast('Ajouté à votre liste');
}

function removeFromList(productId) {
    list = list.filter(item => item.id !== productId);
    saveList();
}

function updateQuantity(productId, quantity) {
    const item = list.find(i => i.id === productId);
    if (!item) return;
    if (quantity <= 0) {
        removeFromList(productId);
    } else {
        item.quantity = quantity;
        saveList();
    }
}

function getListCount() {
    return list.reduce((sum, item) => sum + item.quantity, 0);
}

function updateListCount() {
    const count = getListCount();
    const el = document.getElementById('cart-count');
    if (el) {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// Expositions globales (pour compatibilité avec l'ancien nommage)
window.addToCart = addToList;
window.addToList = addToList;
window.removeFromCart = removeFromList;
window.removeFromList = removeFromList;
window.updateQuantity = updateQuantity;
window.getCartTotal = () => 0; // plus de prix
window.getCartCount = getListCount;
window.updateCartCount = updateListCount;
