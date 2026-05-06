/**
 * Niger Laptop - Page Panier dédiée
 * @version 2.2 - Intégration backend via api.js
 */

// ========== DONNÉES ==========
let cart = [];
let promoCode = null;
const PROMOS = { 'NIGER10': 0.1, 'TECH20': 0.2 };
let products = [];

const DELIVERY_PRICES = { standard: 2500, express: 5000 };
let selectedDelivery = 'standard';

const WHATSAPP_NUMBER = "22791127870";

// ========== FONCTIONS UTILITAIRES ==========
function formatPrice(price) {
    return price.toLocaleString('fr-FR') + ' FCFA';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='10' text-anchor='middle' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";

// ========== SYNCHRONISATION HEADER ==========
function updateHeaderCartCount() {
    const count = cart.reduce((t, i) => t + i.quantity, 0);
    const cartCountElem = document.getElementById('cartCount');
    if (cartCountElem) {
        cartCountElem.textContent = count;
        console.log('📊 Compteur header mis à jour:', count);
    }
}

// ========== CHARGEMENT ==========
async function loadProducts() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        products = data.products;
        console.log('✅ Produits chargés:', products.length);
        loadCart();
    } catch (error) {
        console.error('❌ Erreur chargement produits:', error);
    }
}

function loadCart() {
    const saved = localStorage.getItem('nigerLaptopCart');
    console.log('📦 Chargement panier localStorage:', saved);
    
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch(e) { cart = []; }
    }
    promoCode = localStorage.getItem('nigerLaptopPromo') || null;
    
    renderCart();
    updateSummary();
    updateHeaderCartCount();
}

function saveCart() {
    localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
    if (promoCode) localStorage.setItem('nigerLaptopPromo', promoCode);
    else localStorage.removeItem('nigerLaptopPromo');
    
    renderCart();
    updateSummary();
    updateHeaderCartCount();
    
    console.log('💾 Panier sauvegardé:', cart);
}

// ========== RENDU ==========
function renderCart() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart" style="font-size:64px;"></i>
                <h3>Votre panier est vide</h3>
                <a href="index.html" class="btn btn-primary">Découvrir nos produits</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cart.map(item => {
        const total = item.price * item.quantity;
        return `
            <div class="cart-item-row" data-id="${item.id}">
                <div class="cart-item-product">
                    <img src="${item.image}" alt="${escapeHtml(item.name)}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                    <div>
                        <h4>${escapeHtml(item.name)}</h4>
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

// ========== CALCULS ==========
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

// ========== ACTIONS ==========
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
    showToast('Produit retiré', 'success');
}

function clearCart() {
    console.log('🗑️ Vidage du panier...');
    cart = [];
    promoCode = null;
    const promoInput = document.getElementById('promoCodeInput');
    const promoMsg = document.getElementById('promoMessagePage');
    if (promoInput) promoInput.value = '';
    if (promoMsg) promoMsg.textContent = '';
    saveCart();
    updateHeaderCartCount();
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

// ========== GÉNÉRATION MESSAGE WHATSAPP (fallback) ==========
function generateWhatsAppMessage() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const quarter = document.getElementById('quarter')?.value.trim();
    const deliveryNotes = document.getElementById('deliveryNotes')?.value.trim();
    
    let message = "🛍️ *NOUVELLE COMMANDE - Niger Laptop*\n\n";
    message += "━═━═━═━═━═━═━\n📋 *DÉTAILS DE LA COMMANDE*\n━═━═━═━═━═━═━\n\n";
    
    cart.forEach((item, index) => {
        const total = item.price * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   • Prix: ${formatPrice(item.price)}\n`;
        message += `   • Quantité: ${item.quantity}\n`;
        message += `   • Total: ${formatPrice(total)}\n\n`;
    });
    
    message += "━═━═━═━═━═━═━\n📊 *TOTAL*\n━═━═━═━═━═━═━\n";
    message += `💰 Sous-total: ${formatPrice(getSubtotal())}\n`;
    
    const discount = getDiscount();
    if (discount > 0) message += `🏷️ Réduction: -${formatPrice(discount)}\n`;
    
    const deliveryName = selectedDelivery === 'express' ? 'Express ⚡' : 'Standard 📦';
    message += `🚚 Livraison (${deliveryName}): ${formatPrice(getDeliveryFee())}\n`;
    message += `💵 *TOTAL: ${formatPrice(getTotal())}*\n\n`;
    
    message += "━═━═━═━═━═━═━\n👤 *CLIENT*\n━═━═━═━═━═━═━\n";
    message += `👨‍💼 Nom: ${fullName}\n📞 Tél: ${phoneNumber}\n📍 Adresse: ${address}\n🏙️ Ville: ${city}\n`;
    if (quarter) message += `🏘️ Quartier: ${quarter}\n`;
    if (deliveryNotes) message += `📝 Instructions: ${deliveryNotes}\n`;
    message += `💵 Paiement: Espèces à la livraison\n\n`;
    message += "✅ Merci pour votre commande !";
    
    return encodeURIComponent(message);
}

// ========== ENVOI VERS LE BACKEND (NOUVELLE VERSION) ==========
async function sendToWhatsApp() {
    // Récupérer les données du formulaire
    const fullName = document.getElementById('fullName')?.value.trim();
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const quarter = document.getElementById('quarter')?.value.trim();
    const deliveryNotes = document.getElementById('deliveryNotes')?.value.trim();
    
    // Validation
    if (!fullName) { showToast('Veuillez entrer votre nom complet', 'error'); return; }
    if (!phoneNumber) { showToast('Veuillez entrer votre numéro de téléphone', 'error'); return; }
    if (!address) { showToast('Veuillez entrer votre adresse', 'error'); return; }
    if (!city) { showToast('Veuillez entrer votre ville', 'error'); return; }
    if (cart.length === 0) { showToast('Votre panier est vide', 'error'); return; }
    
    // Vérifier que api.js est chargé
    if (typeof submitOrder === 'undefined') {
        console.error('❌ api.js non chargé !');
        showToast('Erreur technique, réessayez plus tard', 'error');
        return;
    }
    
    // Construire les données de la commande
    const orderData = {
        customer: {
            name: fullName,
            phone: phoneNumber,
            email: email || null,
            address: address,
            city: city,
            quarter: quarter || null,
            notes: deliveryNotes || null
        },
        items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        delivery: {
            type: selectedDelivery,
            fee: getDeliveryFee()
        },
        promoCode: promoCode,
        discount: getDiscount(),
        subtotal: getSubtotal(),
        total: getTotal()
    };
    
    console.log('📦 Envoi au backend:', orderData);
    showToast('Envoi de la commande en cours...', 'info');
    
    // Envoyer au backend
    const result = await submitOrder(orderData);
    
    if (result.success) {
        showToast(`✅ Commande ${result.orderNumber} enregistrée !`, 'success');
        
        // Ouvrir WhatsApp en parallèle (optionnel)
        const whatsappMessage = generateWhatsAppMessage();
        if (whatsappMessage) {
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`, '_blank');
        }
        
        // Vider le panier
        clearCart();
        
        // Rediriger après 3 secondes
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    } else {
        showToast(`❌ Erreur: ${result.error}`, 'error');
    }
}

// ========== UI ==========
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10000;';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModalPage');
    const msg = document.getElementById('confirmMessagePage');
    const cancel = document.getElementById('confirmCancelPage');
    const ok = document.getElementById('confirmOkPage');
    if (!modal || !msg) return;
    
    msg.textContent = message;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    const cleanup = () => {
        cancel.removeEventListener('click', cancelHandler);
        ok.removeEventListener('click', okHandler);
        modal.classList.remove('open');
        document.body.style.overflow = '';
    };
    
    const cancelHandler = () => cleanup();
    const okHandler = () => { if (onConfirm) onConfirm(); cleanup(); };
    
    cancel.addEventListener('click', cancelHandler);
    ok.addEventListener('click', okHandler);
}

// ========== ÉVÉNEMENTS ==========
function bindEvents() {
    // Événements produits
    document.addEventListener('click', (e) => {
        const minusBtn = e.target.closest('.qty-btn.minus');
        const plusBtn = e.target.closest('.qty-btn.plus');
        const removeBtn = e.target.closest('.remove-btn');
        
        if (minusBtn) updateQuantity(parseInt(minusBtn.dataset.id), -1);
        if (plusBtn) updateQuantity(parseInt(plusBtn.dataset.id), 1);
        if (removeBtn) {
            const id = parseInt(removeBtn.dataset.id);
            showConfirm('Retirer ce produit ?', () => removeFromCart(id));
        }
    });
    
    // Livraison
    document.querySelectorAll('input[name="delivery"]').forEach(opt => {
        opt.addEventListener('change', (e) => {
            selectedDelivery = e.target.value;
            updateSummary();
        });
    });
    
    // Boutons
    document.getElementById('applyPromoBtnPage')?.addEventListener('click', applyPromo);
    
    const clearBtn = document.getElementById('clearCartBtnPage');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (cart.length > 0) showConfirm('Vider tout le panier ?', () => clearCart());
        });
    }
    
    document.getElementById('checkoutBtnPage')?.addEventListener('click', sendToWhatsApp);
}

// ========== MENU MOBILE ==========
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.setAttribute('aria-expanded', menu.classList.contains('active'));
        });
    }
}

// ========== INIT ==========
async function init() {
    console.log('🚀 Initialisation de cart-page.js');
    initMobileMenu();
    await loadProducts();
    bindEvents();
}

init();
