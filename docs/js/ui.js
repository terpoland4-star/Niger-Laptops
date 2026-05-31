// ==========================================
// ui.js – Composants et rendu des pages (internationalisé)
// ==========================================

function productCard(product) {
    const localized = getLocalizedProduct(product);       // on récupère les champs traduits
    const discount = localized.compare_at_price
        ? Math.round((1 - localized.price / localized.compare_at_price) * 100)
        : 0;
    return `
    <div class="product-card" onclick="navigateTo('/product/${localized.id}')">
        <img src="${localized.thumbnail || 'https://placehold.co/300x200?text=Pas+d%27image'}" alt="${localized.name}">
        <div class="product-info">
            <small>${localized.brand || ''}</small>
            <h4>${localized.name}</h4>
            <div class="flex-between">
                <span class="price">${formatPrice(localized.price)}</span>
                ${localized.compare_at_price ? `<span class="old-price">${formatPrice(localized.compare_at_price)}</span>` : ''}
            </div>
            ${discount > 0 ? `<span class="badge">${t('discount', {discount})}</span>` : ''}
            <button class="btn btn-primary btn-block" onclick="event.stopPropagation(); addToCartFromCard('${localized.id}')">${t('addToCart')}</button>
        </div>
    </div>`;
}

// ==========================================
// PAGE D'ACCUEIL (CARROUSELS PAR CATÉGORIE)
// ==========================================
async function renderHomePage() {
    const app = document.getElementById('app');

    let allProducts = [];
    try {
        const res = await getProducts({ limit: 200 });
        allProducts = res.data || [];
    } catch (e) {
        allProducts = [];
    }

    const categoriesMap = {};
    allProducts.forEach(p => {
        const cat = p.category || 'Sans catégorie';
        if (!categoriesMap[cat]) categoriesMap[cat] = [];
        categoriesMap[cat].push(p);
    });

    let categoriesHTML = '';
    for (const [catName, products] of Object.entries(categoriesMap)) {
        const catId = catName.replace(/\s+/g, '-').toLowerCase();
        categoriesHTML += `
        <section class="category-section mb-2">
            <div class="flex-between" style="padding: 0 16px;">
                <h3>${translateCategory(catName)}</h3>
                <div class="carousel-controls">
                    <button class="btn btn-sm btn-outline prev-btn" data-target="${catId}">←</button>
                    <button class="btn btn-sm btn-outline next-btn" data-target="${catId}">→</button>
                </div>
            </div>
            <div class="carousel-container" id="${catId}">
                ${products.map(p => productCard(p)).join('')}
            </div>
        </section>`;
    }

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
                <input type="search" id="search-input" placeholder="${t('searchPlaceholder')}" onkeyup="if(event.key==='Enter')searchProducts()">
                <button class="search-btn" onclick="searchProducts()" aria-label="Rechercher">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            ${categoriesHTML || `<p style="text-align:center; padding:2rem;">${t('noProducts')}</p>`}
        </main>
    `;

    document.querySelectorAll('.prev-btn, .next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const container = document.getElementById(targetId);
            if (container) {
                const scrollAmount = 280;
                if (btn.classList.contains('prev-btn')) {
                    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        });
    });
}

window.addToCartFromCard = async function (productId) {
    try {
        const res = await getProduct(productId);
        const product = res.data;
        addToCart(product, 1);      // le produit brut est stocké, on localisera à l'affichage
    } catch (e) {
        showToast(t('errorProduct'));
    }
};

window.addToCartFromDetail = function (productId, stock) {
    getProduct(productId).then(res => {
        addToCart(res.data, 1);
    });
};

async function renderProductPage(productId) {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="container">${t('loading')}</div>`;
    try {
        const res = await getProduct(productId);
        const p = getLocalizedProduct(res.data);       // on localise pour l'affichage
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button>
            <img src="${p.thumbnail || 'https://placehold.co/600x400'}" style="width:100%; border-radius:12px; max-height:300px; object-fit:cover;">
            <h2>${p.name}</h2>
            <p>${p.description || ''}</p>
            <div class="flex-between">
                <span class="price">${formatPrice(p.price)}</span>
                ${p.compare_at_price ? `<span class="old-price">${formatPrice(p.compare_at_price)}</span>` : ''}
            </div>
            <div>${t('stock')} : ${p.stock_quantity > 0 ? t('inStock') : t('outOfStock')}</div>
            <button class="btn btn-primary btn-block mt-2" onclick="addToCartFromDetail('${p.id}', ${p.stock_quantity})">${t('addToCart')}</button>
        </div>`;
    } catch (e) {
        app.innerHTML = `<div class="container">${t('productNotFound')}</div>`;
    }
}

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
        const localized = getLocalizedProduct(item);   // localisation pour le panier
        html += `
        <div class="card flex-between">
            <div>
                <strong>${localized.name}</strong><br>
                <small>${formatPrice(localized.price)} x ${item.quantity}</small>
            </div>
            <div class="flex">
                <button class="btn" onclick="cartUpdateQuantity('${localized.id}', ${item.quantity - 1})">−</button>
                <span>${item.quantity}</span>
                <button class="btn" onclick="cartUpdateQuantity('${localized.id}', ${item.quantity + 1})">+</button>
                <button class="btn btn-danger" onclick="removeFromCart('${localized.id}'); renderCartPage();">🗑</button>
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
            showToast(t('orderConfirmed'));
            navigateTo('/orders');
        } catch (err) {
            showToast(err.message);
        }
    });
}

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

function renderProfilePage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container text-center">
        <button onclick="navigateTo('/')" style="margin-bottom:16px; display:block; text-align:left;">${t('back')}</button>
        <h2>${t('profileTitle')}</h2>
        <p>${currentUser.full_name || currentUser.phone}</p>
        <button class="btn btn-danger btn-block" onclick="logout()">${t('logoutBtn')}</button>
    </div>`;
}

function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button>
        <h2>${t('loginTitle')}</h2>
        <input type="tel" id="login-phone" placeholder="${t('phonePlaceholder')}" required>
        <button id="send-otp-btn" class="btn btn-primary btn-block">${t('sendCode')}</button>
        <div id="otp-section" style="display:none;">
            <input type="text" id="otp-code" placeholder="Code SMS" maxlength="6">
            <button id="verify-otp-btn" class="btn btn-primary btn-block">${t('verifyCode')}</button>
        </div>
    </div>`;

    document.getElementById('send-otp-btn').addEventListener('click', async () => {
        const phone = document.getElementById('login-phone').value.trim();
        if (!phone) { showToast(t('enterPhone')); return; }
        await handleSendOTP(phone);
        document.getElementById('otp-section').style.display = 'block';
        document.getElementById('send-otp-btn').disabled = true;
        document.getElementById('send-otp-btn').textContent = t('codeSent');
    });

    document.getElementById('verify-otp-btn').addEventListener('click', async () => {
        const code = document.getElementById('otp-code').value.trim();
        if (code.length !== 6) { showToast(t('invalidCode')); return; }
        try {
            await handleVerifyOTP(code);
            navigateTo('/');
        } catch (e) {
            showToast(e.message || t('invalidCode'));
        }
    });
}

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
                <img src="assets/images/logo/whatsapp.png" style="height:24px; vertical-align:middle;"> +227 91 12 78 70
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

window.searchProducts = function () {
    const query = document.getElementById('search-input')?.value;
    if (!query) return;
    getProducts({ search: query }).then(res => {
        const products = res.data || [];
        const grid = document.getElementById('product-list');
        if (grid) grid.innerHTML = products.map(p => productCard(p)).join('');
    });
};
