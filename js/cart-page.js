/**
 * Niger Laptop - Page Panier dédiée
 * @version 2.0 - Avec livraison et WhatsApp
 */

// ========== DONNÉES ==========
let cart = [];
let promoCode = null;
const PROMOS = { 'NIGER10': 0.1, 'TECH20': 0.2 };
let products = [];

// Tarifs de livraison
const DELIVERY_PRICES = {
    standard: 2500,
    express: 5000
};

let selectedDelivery = 'standard';
let currentTotal = 0;

// Numéro WhatsApp du commerçant (format international sans +)
const WHATSAPP_NUMBER = "22791127870"; // À remplacer par le vrai numéro

// ========== CHARGEMENT DES PRODUITS ==========
async function loadProducts() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        products = data.products;
        loadCart();
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        document.getElementById('cartItemsList').innerHTML = '<div class="error-message">Erreur de chargement du catalogue</div>';
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
    
    if (promoCode && document.getElementById('promoCodeInput')) {
        document.getElementById('promoCodeInput').value = promoCode;
        if (PROMOS[promoCode]) {
            const msg = document.getElementById('promoMessagePage');
            if (msg) {
                msg.textContent = `Code promo appliqué : -${PROMOS[promoCode] * 100}%`;
                msg.className = 'promo-message success';
            }
        }
    }
    
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

function getDeliveryFee() {
    return DELIVERY_PRICES[selectedDelivery] || 0;
}

function getTotal() {
    return getSubtotal() - getDiscount() + getDeliveryFee();
}

function updateSummary() {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const deliveryFee = getDeliveryFee();
    const total = getTotal();
    currentTotal = total;
    
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('cartTotalPage');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    const deliveryFeeEl = document.getElementById('deliveryFee');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (deliveryFeeEl) deliveryFeeEl.textContent = formatPrice(deliveryFee);
    if (totalEl) totalEl.textContent = formatPrice(total);
    
    if (discountRow && discountAmount) {
        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountAmount.textContent = `-${formatPrice(discount)}`;
        } else {
            discountRow.style.display = 'none';
        }
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
    const promoInput = document.getElementById('promoCodeInput');
    const promoMsg = document.getElementById('promoMessagePage');
    if (promoInput) promoInput.value = '';
    if (promoMsg) promoMsg.textContent = '';
    saveCart();
    showToast('Panier vidé', 'success');
}

function applyPromo() {
    const input = document.getElementById('promoCodeInput');
    const message = document.getElementById('promoMessagePage');
    if (!input || !message) return;
    
    const code = input.value.trim().toUpperCase();
    
    if (PROMOS[code]) {
        promoCode = code;
        message.textContent = `Code promo appliqué : -${PROMOS[code] * 100}%`;
        message.className = 'promo-message success';
        saveCart();
        showToast('Code promo appliqué !', 'success');
    } else {
        promoCode = null;
        message.textContent = 'Code invalide';
        message.className = 'promo-message error';
        saveCart();
        showToast('Code promo invalide', 'error');
    }
}

// ========== GÉNÉRATION DU MESSAGE WHATSAPP ==========
function generateWhatsAppMessage() {
    // Récupérer les informations de livraison
    const fullName = document.getElementById('fullName')?.value.trim();
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const quarter = document.getElementById('quarter')?.value.trim();
    const deliveryNotes = document.getElementById('deliveryNotes')?.value.trim();
    
    // Validation
    if (!fullName) { showToast('Veuillez entrer votre nom complet', 'error'); return null; }
    if (!phoneNumber) { showToast('Veuillez entrer votre numéro de téléphone', 'error'); return null; }
    if (!address) { showToast('Veuillez entrer votre adresse', 'error'); return null; }
    if (!city) { showToast('Veuillez entrer votre ville', 'error'); return null; }
    
    if (cart.length === 0) { showToast('Votre panier est vide', 'error'); return null; }
    
    // Construction du message
    let message = "🛍️ *NOUVELLE COMMANDE - Niger Laptop* 🛍️\n\n";
    message += "━═━═━═━═━═━═━\n";
    message += "📋 *DÉTAILS DE LA COMMANDE*\n";
    message += "━═━═━═━═━═━═━\n\n";
    
    // Produits
    message += "*PRODUITS:*\n";
    cart.forEach((item, index) => {
        const product = products.find(p => p.id === item.id);
        const total = item.price * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   • Prix: ${formatPrice(item.price)}\n`;
        message += `   • Quantité: ${item.quantity}\n`;
        message += `   • Total: ${formatPrice(total)}\n\n`;
    });
    
    // Résumé financier
    message += "━═━═━═━═━═━═━\n";
    message += "*RÉSUMÉ FINANCIER*\n";
    message += "━═━═━═━═━═━═━\n";
    message += `💰 Sous-total: ${formatPrice(getSubtotal())}\n`;
    
    const discount = getDiscount();
    if (discount > 0) {
        message += `🏷️ Réduction: -${formatPrice(discount)}\n`;
        if (promoCode) message += `   (Code: ${promoCode})\n`;
    }
    
    const deliveryName = selectedDelivery === 'express' ? 'Express ⚡' : 'Standard 📦';
    message += `🚚 Livraison (${deliveryName}): ${formatPrice(getDeliveryFee())}\n`;
    message += `💵 *TOTAL: ${formatPrice(getTotal())}*\n\n`;
    
    // Informations client
    message += "━═━═━═━═━═━═━\n";
    message += "👤 *INFORMATIONS CLIENT*\n";
    message += "━═━═━═━═━═━═━\n";
    message += `👨‍💼 Nom: ${fullName}\n`;
    message += `📞 Téléphone: ${phoneNumber}\n`;
    message += `📍 Adresse: ${address}\n`;
    message += `🏙️ Ville: ${city}\n`;
    if (quarter) message += `🏘️ Quartier: ${quarter}\n`;
    if (deliveryNotes) message += `📝 Instructions: ${deliveryNotes}\n\n`;
    
    // Mode de paiement
    message += "━═━═━═━═━═━═━\n";
    message += "*MODE DE PAIEMENT*\n";
    message += "━═━═━═━═━═━═━\n";
    message += "💰 Espèces à la livraison\n\n";
    
    message += "━═━═━═━═━═━═━\n";
    message += "✅ Merci pour votre commande !\n";
    message += "📦 Livraison à venir sous 24-72h\n";
    message += "━═━═━═━═━═━═━";
    
    return encodeURIComponent(message);
}

// Envoi vers WhatsApp
function sendToWhatsApp() {
    const message = generateWhatsAppMessage();
    if (!message) return;
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    // Optionnel : vider le panier après commande
    setTimeout(() => {
        showConfirm('Commande envoyée ! Vider le panier ?', () => {
            clearCart();
            showToast('Panier vidé, merci !', 'success');
        });
    }, 500);
}

// ========== MODALS & TOAST ==========
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

let confirmCallback = null;
function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModalPage');
    const msg = document.getElementById('confirmMessagePage');
    const cancel = document.getElementById('confirmCancelPage');
    const ok = document.getElementById('confirmOkPage');
    
    if (!modal || !msg) return;
    
    msg.textContent = message;
    openModal('confirmModalPage');
    
    const cleanup = () => {
        confirmCallback = null;
        cancel.removeEventListener('click', cancelHandler);
        ok.removeEventListener('click', okHandler);
        closeModal('confirmModalPage');
    };
    
    const cancelHandler = () => cleanup();
    const okHandler = () => {
        if (onConfirm) onConfirm();
        cleanup();
    };
    
    cancel.addEventListener('click', cancelHandler);
    ok.addEventListener('click', okHandler);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '10000';
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== ÉVÉNEMENTS ==========
function bindEvents() {
    // Événements panier
    document.addEventListener('click', (e) => {
        const minusBtn = e.target.closest('.qty-btn.minus');
        const plusBtn = e.target.closest('.qty-btn.plus');
        const removeBtn = e.target.closest('.remove-btn');
        
        if (minusBtn) updateQuantity(parseInt(minusBtn.dataset.id), -1);
        if (plusBtn) updateQuantity(parseInt(plusBtn.dataset.id), 1);
        if (removeBtn) {
            const id = parseInt(removeBtn.dataset.id);
            showConfirm('Retirer ce produit du panier ?', () => removeFromCart(id));
        }
    });
    
    // Options de livraison
    const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
    deliveryOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            selectedDelivery = e.target.value;
            updateSummary();
        });
    });
    
    // Boutons
    const applyBtn = document.getElementById('applyPromoBtnPage');
    if (applyBtn) applyBtn.addEventListener('click', applyPromo);
    
    const clearBtn = document.getElementById('clearCartBtnPage');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                showConfirm('Vider tout le panier ?', () => clearCart());
            }
        });
    }
    
    const checkoutBtn = document.getElementById('checkoutBtnPage');
    if (checkoutBtn) checkoutBtn.addEventListener('click', sendToWhatsApp);
}

// ========== MENU MOBILE ==========
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            const expanded = menu.classList.toggle('active');
            toggle.setAttribute('aria-expanded', expanded);
        });
    }
}

// ========== INITIALISATION ==========
async function init() {
    initMobileMenu();
    await loadProducts();
    bindEvents();
}

init();
