/**
 * Niger Laptop - Page Panier dédiée
 */

// ========== DONNÉES ==========
let cart = [];
let promoCode = null;
const PROMOS = { 'NIGER10': 0.1, 'TECH20': 0.2 };
let products = [];

// ========== CHARGEMENT DES PRODUITS ==========
async function loadProducts() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        products = data.products;
        loadCart();
    } catch (error) {
        console.error('Erreur chargement produits:', error);
    }
}

// ========== PANIER ==========
function loadCart() {
    const saved = localStorage.getItem('nigerLaptopCart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch(e) { cart = []; }
    }
    promoCode = localStorage.getItem('nigerLaptopPromo') || null;
    renderCart();
    updateSummary();
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
    if (promoCode) localStorage.setItem('nigerLaptopPromo', promoCode);
    else localStorage.removeItem('nigerLaptopPromo');
    renderCart();
    updateSummary();
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((t, i) => t + i.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = count;
}

function formatPrice(price) {
    return price.toLocaleString('fr-FR') + ' FCFA';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='10' text-anchor='middle' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";

function renderCart() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart" style="font-size:64px;"></i>
                <h3>Votre panier est vide</h3>
                <p>Découvrez nos produits et faites votre sélection</p>
                <a href="index.html" class="btn btn-primary">Découvrir nos produits</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const total = item.price * item.quantity;
        return `
            <div class="cart-item-row" data-id="${item.id}">
                <div class="cart-item-product">
                    <img src="${item.image}" alt="${escapeHtml(item.name)}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                    <div>
                        <h4>${escapeHtml(item.name)}</h4>
                        ${product?.category ? `<p class="cart-item-category">${escapeHtml(product.category)}</p>` : ''}
                    </div>
                </div>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
                <div class="cart-item-quantity">
                    <button class="qty-btn minus" data-id="${item.id}" data-delta="-1">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.id}" data-delta="1">+</button>
                </div>
                <div class="cart-item-total">${formatPrice(total)}</div>
                <div class="cart-item-remove">
                    <button class="remove-btn" data-id="${item.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getSubtotal() {
    return cart.reduce((t, i) => t + i.price * i.quantity, 0);
}

function getDiscount() {
    if (promoCode && PROMOS[promoCode]) {
        return getSubtotal() * PROMOS[promoCode];
    }
    return 0;
}

function getTotal() {
    return getSubtotal() - getDiscount();
}

function updateSummary() {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const total = getTotal();
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cartTotalPage').textContent = formatPrice(total);
    
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    
    if (discount > 0) {
        discountRow.style.display = 'flex';
        discountAmount.textContent = `-${formatPrice(discount)}`;
    } else {
        discountRow.style.display = 'none';
    }
}

// ========== ACTIONS PANIER ==========
function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCart();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
}

function clearCart() {
    cart = [];
    promoCode = null;
    document.getElementById('promoCodeInput').value = '';
    document.getElementById('promoMessagePage').textContent = '';
    saveCart();
}

function applyPromo() {
    const input = document.getElementById('promoCodeInput');
    const message = document.getElementById('promoMessagePage');
    const code = input.value.trim().toUpperCase();
    
    if (PROMOS[code]) {
        promoCode = code;
        message.textContent = `Code promo appliqué : -${PROMOS[code] * 100}%`;
        message.className = 'promo-message success';
        saveCart();
    } else {
        promoCode = null;
        message.textContent = 'Code invalide';
        message.className = 'promo-message error';
        saveCart();
    }
}

function checkout() {
    if (cart.length === 0) {
        showToast('Votre panier est vide', 'error');
        return;
    }
    openModal('checkoutModalPage');
}

// ========== MODALS ==========
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModalPage');
    const msg = document.getElementById('confirmMessagePage');
    const cancel = document.getElementById('confirmCancelPage');
    const ok = document.getElementById('confirmOkPage');
    
    if (!modal || !msg) return;
    
    msg.textContent = message;
    openModal('confirmModalPage');
    
    const cleanup = () => {
        cancel.removeEventListener('click', cancelHandler);
        ok.removeEventListener('click', okHandler);
        closeModal('confirmModalPage');
    };
    
    const cancelHandler = () => cleanup();
    const okHandler = () => {
        onConfirm();
        cleanup();
    };
    
    cancel.addEventListener('click', cancelHandler);
    ok.addEventListener('click', okHandler);
}

function showToast(message, type = 'success') {
    // Créer un toast temporaire
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '10000';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== ÉVÉNEMENTS ==========
function bindEvents() {
    // Délégation d'événements pour les boutons du panier
    document.addEventListener('click', (e) => {
        const minusBtn = e.target.closest('.qty-btn.minus');
        const plusBtn = e.target.closest('.qty-btn.plus');
        const removeBtn = e.target.closest('.remove-btn');
        
        if (minusBtn) {
            const id = parseInt(minusBtn.dataset.id);
            updateQuantity(id, -1);
        }
        if (plusBtn) {
            const id = parseInt(plusBtn.dataset.id);
            updateQuantity(id, 1);
        }
        if (removeBtn) {
            const id = parseInt(removeBtn.dataset.id);
            showConfirm('Retirer ce produit du panier ?', () => removeFromCart(id));
        }
    });
    
    document.getElementById('applyPromoBtnPage')?.addEventListener('click', applyPromo);
    document.getElementById('clearCartBtnPage')?.addEventListener('click', () => {
        if (cart.length > 0) {
            showConfirm('Vider tout le panier ?', () => clearCart());
        }
    });
    document.getElementById('checkoutBtnPage')?.addEventListener('click', checkout);
    document.getElementById('closeCheckoutModalPage')?.addEventListener('click', () => {
        closeModal('checkoutModalPage');
        if (cart.length === 0) {
            window.location.href = 'index.html';
        }
    });
}

// ========== INITIALISATION ==========
async function init() {
    await loadProducts();
    bindEvents();
}

init();
