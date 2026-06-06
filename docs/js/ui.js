// ==========================================
// ui.js – Composants et rendu des pages (internationalisé, responsive, accessible)
// ==========================================

// ---------- CARTE PRODUIT ----------
function productCard(product) {
    const localized = getLocalizedProduct(product);
    const discount = localized.compare_at_price
        ? Math.round((1 - localized.price / localized.compare_at_price) * 100)
        : 0;
    return `
    <div class="product-card" onclick="navigateTo('/product/${localized.id}')">
        <img src="${localized.thumbnail || 'https://placehold.co/300x200?text=Pas+d%27image'}" alt="${localized.name}" loading="lazy">
        <div class="product-info">
            <small>${localized.brand || ''}</small>
            <h4>${localized.name}</h4>
            <div class="flex-between">
                <span class="price">${formatPrice(localized.price)}</span>
                ${localized.compare_at_price ? `<span class="old-price">${formatPrice(localized.compare_at_price)}</span>` : ''}
            </div>
            ${discount > 0 ? `<span class="badge">${t('discount', {discount})}</span>` : ''}
            <button class="btn btn-primary btn-block add-to-cart-btn" data-product-id="${localized.id}">${t('addToCart')}</button>
        </div>
    </div>`;
}

// ---------- SQUELETTE DE CHARGEMENT ----------
function skeleton(columns = 2) {
    let html = '';
    for (let i = 0; i < columns * 2; i++) {
        html += `<div class="skeleton-card"></div>`;
    }
    return `<div class="product-grid">${html}</div>`;
}

// ---------- PAGE D'ACCUEIL (ONGLETS INSPIRÉS DE TEMU) ----------
async function renderHomePage() {
    const app = document.getElementById('app');

    // Squelette immédiat
    app.innerHTML = `
        <header class="container app-header">
            <img src="assets/images/logo/logolap.png" alt="Niger Laptops" class="logo-animated" style="height:70px; width:auto;" onerror="this.style.display='none'">
            <div>
                <h1 style="font-size:1.5rem;">${t('siteName')}</h1>
                <p style="font-size:0.85rem; color: var(--text-light); margin: 0;">${t('tagline')}</p>
            </div>
            <span style="flex:1"></span>
            <span id="cart-count" class="badge">${getCartCount()}</span>
        </header>
        <nav class="home-nav">
            <a href="#/" class="active"><i class="fas fa-home"></i> ${t('home')}</a>
            <a href="#/cart"><i class="fas fa-shopping-cart"></i> ${t('cart')}</a>
            <a href="#/orders"><i class="fas fa-box"></i> ${t('orders')}</a>
            <a href="#/profile"><i class="fas fa-user"></i> ${t('profile')}</a>
        </nav>
        <main class="container" style="padding-top: 0;">
            <div class="search-wrapper">
                <input type="search" id="search-input" placeholder="${t('searchPlaceholder')}" autocomplete="off" oninput="handleSearchSuggestions()">
                <button class="search-btn" onclick="handleSearchSuggestions()" aria-label="Rechercher">
                    <i class="fas fa-search"></i>
                </button>
                <div id="suggestions-dropdown" class="suggestions-dropdown" style="display:none;"></div>
            </div>
            <div id="search-results-grid" class="product-grid mt-2" style="display:none;"></div>
            ${skeleton(2)}
        </main>
    `;

    // Récupération des produits
    let allProducts = [];
    try {
        const res = await getProducts({ limit: 200 });
        allProducts = res.data || [];
    } catch (e) {
        allProducts = [];
    }

    window._allProducts = allProducts;

    const mainTabs = [
        { key: 'Ordinateurs', label: '💻 Ordinateurs' },
        { key: 'Stockage', label: '💾 Stockage' },
        { key: 'Accessoires', label: '🎧 Accessoires' }
    ];

    let activeTab = 'Ordinateurs';

    function buildContent() {
        const products = window._allProducts.filter(p => p.category === activeTab);
        const newProducts = products.filter(p => p.condition === 'new');
        const usedProducts = products.filter(p => p.condition === 'used');

        const sectionNew = newProducts.length ? `
            <section class="category-section">
                <h3 class="section-subtitle">🆕 ${t('newProducts')}</h3>
                <div class="product-grid">${newProducts.map(p => productCard(p)).join('')}</div>
            </section>` : '';

        const sectionUsed = usedProducts.length ? `
            <section class="category-section">
                <h3 class="section-subtitle">🔄 ${t('usedProducts')}</h3>
                <div class="product-grid">${usedProducts.map(p => productCard(p)).join('')}</div>
            </section>` : '';

        const emptyMsg = (!newProducts.length && !usedProducts.length)
            ? `<p style="text-align:center; padding:2rem;">${t('noProducts')}</p>`
            : '';

        return `
            <div class="temu-tabs">
                ${mainTabs.map(tab => `
                    <button class="temu-tab ${tab.key === activeTab ? 'active' : ''}" data-tab="${tab.key}">
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
            ${sectionNew}
            ${sectionUsed}
            ${emptyMsg}
        `;
    }

    const main = document.querySelector('main.container');
    if (main) {
        main.innerHTML = `
            <div class="search-wrapper">
                <input type="search" id="search-input" placeholder="${t('searchPlaceholder')}" autocomplete="off" oninput="handleSearchSuggestions()">
                <button class="search-btn" onclick="handleSearchSuggestions()" aria-label="Rechercher">
                    <i class="fas fa-search"></i>
                </button>
                <div id="suggestions-dropdown" class="suggestions-dropdown" style="display:none;"></div>
            </div>
            <div id="search-results-grid" class="product-grid mt-2" style="display:none;"></div>
            <div id="temu-content">${buildContent()}</div>
        `;

        document.querySelectorAll('.temu-tab').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.temu-tab').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                activeTab = this.dataset.tab;
                document.getElementById('temu-content').innerHTML = buildContent();
                attachAddToCartListeners();
                initAccessibilityControls();
            });
        });
    }

    function attachAddToCartListeners() {
        document.getElementById('app').addEventListener('click', function (e) {
            const btn = e.target.closest('.add-to-cart-btn');
            if (btn) {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                addToCartFromCard(productId);
            }
        });
    }

    attachAddToCartListeners();
    initAccessibilityControls();
}

// ---------- RECHERCHE DYNAMIQUE ----------
let allProductsCache = [];

async function loadAllProducts() {
    if (allProductsCache.length > 0) return;
    try {
        const res = await getProducts({ limit: 200 });
        allProductsCache = res.data || [];
    } catch (e) {
        allProductsCache = [];
    }
}

function handleSearchSuggestions() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('suggestions-dropdown');
    const resultsGrid = document.getElementById('search-results-grid');
    const categorySections = document.querySelectorAll('.category-section');

    if (!input) return;

    const query = input.value.trim().toLowerCase();

    if (query.length === 0) {
        dropdown.style.display = 'none';
        if (resultsGrid) resultsGrid.style.display = 'none';
        categorySections.forEach(s => s.style.display = '');
        return;
    }

    if (allProductsCache.length === 0) {
        loadAllProducts().then(() => handleSearchSuggestions());
        return;
    }

    const filtered = allProductsCache.filter(p => {
        const loc = getLocalizedProduct(p);
        return loc.name.toLowerCase().includes(query) ||
               loc.description.toLowerCase().includes(query);
    });

    if (resultsGrid) {
        resultsGrid.innerHTML = filtered.map(p => productCard(p)).join('');
        resultsGrid.style.display = 'block';
    }

    categorySections.forEach(s => s.style.display = 'none');

    if (filtered.length === 0) {
        dropdown.style.display = 'none';
    } else {
        const suggestions = filtered.slice(0, 5).map(p => {
            const loc = getLocalizedProduct(p);
            return `<div class="suggestion-item" onclick="navigateTo('/product/${loc.id}'); document.getElementById('suggestions-dropdown').style.display='none';">
                <strong>${loc.name}</strong> – ${formatPrice(loc.price)}
            </div>`;
        }).join('');
        dropdown.innerHTML = suggestions;
        dropdown.style.display = 'block';
    }
}

// ---------- ACCESSIBILITÉ (initialisation unique) ----------
let accessibilityInitialized = false;

function initAccessibilityControls() {
    if (accessibilityInitialized) return;
    accessibilityInitialized = true;

    const highContrastToggle = document.getElementById('high-contrast-toggle');
    if (highContrastToggle) {
        highContrastToggle.checked = localStorage.getItem('highContrast') === 'true';
        applyHighContrast();
        highContrastToggle.addEventListener('click', () => {
            const current = localStorage.getItem('highContrast') === 'true';
            localStorage.setItem('highContrast', !current);
            applyHighContrast();
        });
    }

    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const fontReset = document.getElementById('font-reset');
    if (fontIncrease) fontIncrease.addEventListener('click', () => changeFontSize(1));
    if (fontDecrease) fontDecrease.addEventListener('click', () => changeFontSize(-1));
    if (fontReset) fontReset.addEventListener('click', resetFontSize);
}

function applyHighContrast() {
    document.body.classList.toggle('high-contrast', localStorage.getItem('highContrast') === 'true');
}

let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 16;
document.body.style.fontSize = currentFontSize + 'px';

function changeFontSize(delta) {
    currentFontSize += delta;
    if (currentFontSize < 12) currentFontSize = 12;
    if (currentFontSize > 24) currentFontSize = 24;
    document.body.style.fontSize = currentFontSize + 'px';
    localStorage.setItem('fontSize', currentFontSize);
}

function resetFontSize() {
    currentFontSize = 16;
    document.body.style.fontSize = '16px';
    localStorage.setItem('fontSize', '16');
}

// ---------- FONCTIONS D'AJOUT AU PANIER ----------
window.addToCartFromCard = async function (productId) {
    try {
        const res = await getProduct(productId);
        addToCart(res.data, 1);
        showToast(t('addedToCart'), 'success');
    } catch (e) {
        showToast(t('errorProduct'), 'error');
    }
};

window.addToCartFromDetail = function (productId, stock) {
    getProduct(productId).then(res => {
        addToCart(res.data, 1);
        showToast(t('addedToCart'), 'success');
    }).catch(() => showToast(t('errorProduct'), 'error'));
};

// ---------- PAGE DÉTAIL PRODUIT ----------
async function renderProductPage(productId) {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="container">${t('loading')}</div>`;
    try {
        const res = await getProduct(productId);
        const p = getLocalizedProduct(res.data);
        const stockQty = p.stock_quantity !== undefined ? p.stock_quantity : 10;
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button>
            <img src="${p.thumbnail || 'https://placehold.co/600x400'}" style="width:100%; border-radius:12px; max-height:300px; object-fit:cover;" alt="${p.name}">
            <h2>${p.name}</h2>
            <p>${p.description || ''}</p>
            <div class="flex-between">
                <span class="price">${formatPrice(p.price)}</span>
                ${p.compare_at_price ? `<span class="old-price">${formatPrice(p.compare_at_price)}</span>` : ''}
            </div>
            <div>${t('stock')} : ${stockQty > 0 ? t('inStock') : t('outOfStock')}</div>
            <button class="btn btn-primary btn-block mt-2" onclick="addToCartFromDetail('${p.id}', ${stockQty})">${t('addToCart')}</button>
        </div>`;
    } catch (e) {
        app.innerHTML = `<div class="container">${t('productNotFound')}</div>`;
    }
}

// ---------- PAGE PANIER ----------
function renderCartPage() {
    const app = document.getElementById('app');
    if (cart.length === 0) {
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button>
            <h2>🛒 ${t('emptyCart')}</h2>
            <button class="btn btn-primary" onclick="navigateTo('/')">${t('seeProducts')}</button>
        </div>`;
        return;
    }
    let html = `<div class="container"><button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button><h2>${t('cart')}</h2>`;
    cart.forEach(item => {
        const localized = getLocalizedProduct(item);
        html += `
        <div class="card flex-between">
            <div>
                <strong>${localized.name}</strong><br>
                <small>${formatPrice(localized.price)} x ${item.quantity}</small>
            </div>
            <div class="flex">
                <button class="btn" onclick="cartUpdateQuantity('${localized.id}', ${item.quantity - 1})" aria-label="Réduire la quantité">−</button>
                <span>${item.quantity}</span>
                <button class="btn" onclick="cartUpdateQuantity('${localized.id}', ${item.quantity + 1})" aria-label="Augmenter la quantité">+</button>
                <button class="btn btn-danger" onclick="removeFromCart('${localized.id}'); renderCartPage();" aria-label="Supprimer l'article">🗑</button>
            </div>
        </div>`;
    });
    html += `
        <div class="card">
            <div class="flex-between"><span>${t('subtotal')}</span><span>${formatPrice(getCartTotal())}</span></div>
            <div class="flex-between"><span>${t('delivery')}</span><span>${getCartTotal() >= 25000 ? t('free') : formatPrice(1500)}</span></div>
            <div class="flex-between"><strong>${t('total')}</strong><strong>${formatPrice(getCartTotal() + (getCartTotal() >= 25000 ? 0 : 1500))}</strong></div>
            <button class="btn btn-primary btn-block mt-2" onclick="navigateTo('/checkout')">${t('order')}</button>
        </div>
    </div>`;
    app.innerHTML = html;
}

window.cartUpdateQuantity = function (productId, qty) {
    updateQuantity(productId, qty);
    renderCartPage();
};

// ---------- PAGE CHECKOUT ----------
function renderCheckoutPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button>
        <h2>${t('checkout')}</h2>
        <form id="checkout-form">
            <input type="text" id="fullname" placeholder="${t('namePlaceholder')}" required>
            <input type="tel" id="phone" placeholder="${t('phoneRequired')}" required>
            <textarea id="address" placeholder="${t('addressPlaceholder')}" required></textarea>
            <select id="payment-method" required>
                <option value="">-- ${t('paymentMethod')} --</option>
                <option value="zamani_cash">${t('zamaniCash')}</option>
                <option value="airtel_money">${t('airtelMoney')}</option>
                <option value="mynita">${t('mynita')}</option>
                <option value="amanata">${t('amanata')}</option>
                <option value="card">${t('card')}</option>
                <option value="bank_transfer">${t('bankTransfer')}</option>
                <option value="cash_on_delivery">${t('cashOnDelivery')}</option>
            </select>
            <button type="submit" class="btn btn-primary btn-block mt-2">${t('confirmOrder')}</button>
        </form>
    </div>`;

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('fullname').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const payment = document.getElementById('payment-method').value;

        const orderData = {
            items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
            delivery_address: { full_name: fullname, phone, address_line1: address },
            payment_method: payment
        };
        try {
            const res = await createOrder(orderData);
            const order = res.data;
            if (payment !== 'cash_on_delivery') {
                await initiatePayment(order.id, phone, payment);
            }
            cart = [];
            saveCart();
            showToast(t('orderConfirmed'), 'success');
            navigateTo('/orders');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ---------- PAGE COMMANDES ----------
async function renderOrdersPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `<div class="container"><button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button><h2>${t('myOrders')}</h2></div>`;
    try {
        const res = await getOrders();
        const orders = res.data || [];
        let html = orders.length ? '' : `<p>${t('noOrders')}</p>`;
        orders.forEach(order => {
            html += `<div class="card" onclick="navigateTo('/order/${order.id}')">
                <div class="flex-between"><strong>${order.order_number}</strong><span class="badge">${order.status}</span></div>
                <div>${formatPrice(order.total)}</div>
                <small>${new Date(order.created_at).toLocaleDateString()}</small>
            </div>`;
        });
        app.innerHTML = `<div class="container"><button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button><h2>${t('myOrders')}</h2>${html}</div>`;
    } catch (e) {
        app.innerHTML = `<div class="container">${t('errorLoading')}</div>`;
    }
}

async function renderOrderDetail(orderId) {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `<div class="container">${t('loading')}</div>`;
    try {
        const res = await getOrder(orderId);
        const order = res.data;
        let items = order.items.map(i => `<li>${i.product_name} x${i.quantity} = ${formatPrice(i.total_price)}</li>`).join('');
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/orders')">${t('back')}</button>
            <h2>${t('orderDetails')} ${order.order_number}</h2>
            <p>${t('status')}: ${order.status}</p>
            <p>${t('total')}: ${formatPrice(order.total)}</p>
            <h4>${t('articles')}:</h4>
            <ul>${items}</ul>
        </div>`;
    } catch (e) {
        app.innerHTML = `<div class="container">${t('productNotFound')}</div>`;
    }
}

// ---------- PAGE PROFIL ----------
function renderProfilePage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container text-center">
        <button onclick="navigateTo('/')" style="margin-bottom:16px; display:block; text-align:left;">${t('back')}</button>
        <h2>${t('profileTitle')}</h2>
        <p>${currentUser.full_name || currentUser.email}</p>
        <button class="btn btn-danger btn-block" onclick="logout()">${t('logoutBtn')}</button>
    </div>`;
}

// ---------- PAGE CONNEXION (email/mot de passe) ----------
function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button>
        <h2>${t('loginTitle')}</h2>
        <form id="login-form">
            <input type="email" id="login-email" placeholder="${t('emailPlaceholder')}" required autocomplete="email">
            <input type="password" id="login-password" placeholder="${t('passwordPlaceholder')}" required autocomplete="current-password">
            <button type="submit" class="btn btn-primary btn-block">${t('loginBtn')}</button>
        </form>
        <p style="text-align:center; margin-top:1rem;">
            <a href="#/register">${t('createAccount')}</a>
        </p>
    </div>`;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        try {
            await handleLogin(email, password);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ---------- PAGE INSCRIPTION (email/mot de passe) ----------
function renderRegisterPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/login')" style="margin-bottom:16px;">${t('back')}</button>
        <h2>${t('registerTitle')}</h2>
        <form id="register-form">
            <input type="text" id="reg-fullname" placeholder="${t('fullnamePlaceholder')}" required autocomplete="name">
            <input type="email" id="reg-email" placeholder="${t('emailPlaceholder')}" required autocomplete="email">
            <input type="password" id="reg-password" placeholder="${t('passwordPlaceholder')}" required autocomplete="new-password">
            <button type="submit" class="btn btn-primary btn-block">${t('registerBtn')}</button>
        </form>
    </div>`;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('reg-fullname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        try {
            register(email, password, fullname);
            showToast(t('registerSuccess'), 'success');
            navigateTo('/');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ---------- PAGE À PROPOS ----------
function renderAboutPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('backHome')}</button>
        <h2>${t('aboutTitle')}</h2>
        <p>${t('aboutText1')}</p>
        <p>${t('aboutText2')}</p>
        <h3>${t('valuesTitle')}</h3>
        <ul>
            <li>${t('value1')}</li>
            <li>${t('value2')}</li>
            <li>${t('value3')}</li>
            <li>${t('value4')}</li>
        </ul>
    </div>`;
}

// ---------- PAGE CONTACT ----------
function renderContactPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('backHome')}</button>
        <h2>${t('contactTitle')}</h2>
        <p class="text-center">${t('contactDesc')}</p>

        <div class="card">
            <h3>${t('addressLabel')}</h3>
            <p>${t('address')}</p>
            <a href="https://maps.app.goo.gl/AyfgGYvvXYMBTxBv8" target="_blank" rel="noopener" class="btn btn-outline btn-block">
                ${t('openMaps')}
            </a>
        </div>

        <div class="card">
            <h3>${t('whatsappLabel')}</h3>
            <a href="https://wa.me/22791127870" target="_blank" rel="noopener" class="btn btn-primary btn-block">
                <img src="assets/images/logo/whatsapp.png" style="height:24px; vertical-align:middle;" alt="WhatsApp"> +227 91 12 78 70
            </a>
        </div>

        <div class="card">
            <h3>${t('emailLabel')}</h3>
            <a href="mailto:zoubeirou.zakariya@gmail.com" class="btn btn-outline btn-block">
                ✉️ zoubeirou.zakariya@gmail.com
            </a>
        </div>

        <div class="card text-center">
            <h3>${t('followUs')}</h3>
            <div class="flex" style="justify-content:center; gap:20px; font-size:2rem;">
                <a href="https://www.facebook.com/share/1DANxXYdTC/?mibextid=wwXIfr" target="_blank" rel="noopener" aria-label="Facebook">
                    <i class="fab fa-facebook"></i>
                </a>
            </div>
        </div>
    </div>`;
}
