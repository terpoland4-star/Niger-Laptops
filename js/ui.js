// ==========================================
// ui.js – Composants et rendu des pages
// ==========================================

/* --- Composant carte produit --- */
function productCard(product) {
    const discount = product.compare_at_price
        ? Math.round((1 - product.price / product.compare_at_price) * 100)
        : 0;
    return `
    <div class="product-card" onclick="navigateTo('/product/${product.id}')">
        <img src="${product.thumbnail || 'https://placehold.co/300x200?text=Pas+d%27image'}" alt="${product.name}">
        <div class="product-info">
            <small>${product.brand || ''}</small>
            <h4>${product.name}</h4>
            <div class="flex-between">
                <span class="price">${formatPrice(product.price)}</span>
                ${product.compare_at_price ? `<span class="old-price">${formatPrice(product.compare_at_price)}</span>` : ''}
            </div>
            ${discount > 0 ? `<span class="badge">-${discount}%</span>` : ''}
            <button class="btn btn-primary btn-block" onclick="event.stopPropagation(); addToCartFromCard('${product.id}')">Ajouter</button>
        </div>
    </div>`;
}

/* --- Page d'accueil (catalogue) --- */
async function renderHomePage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <header class="container">
            <h1>🖥️ Niger Laptops</h1>
            <div class="flex-between">
                <input type="search" id="search-input" placeholder="Rechercher un produit..." onkeyup="if(event.key==='Enter')searchProducts()">
                <span id="cart-count" class="badge">${getCartCount()}</span>
            </div>
        </header>
        <main class="container">
            <div id="product-list" class="product-grid"></div>
        </main>
    `;

    try {
        const res = await getProducts({ limit: 20 });
        const products = res.data || [];
        const grid = document.getElementById('product-list');
        grid.innerHTML = products.map(p => productCard(p)).join('');
    } catch (e) {
        showToast('Erreur de chargement des produits');
    }
}

/* --- Ajout rapide depuis la carte produit --- */
window.addToCartFromCard = async function (productId) {
    try {
        const res = await getProduct(productId);
        const product = res.data;
        addToCart(product, 1);
    } catch (e) {
        showToast('Erreur');
    }
};

/* --- Page détail produit --- */
async function renderProductPage(productId) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="container">Chargement...</div>';
    try {
        const res = await getProduct(productId);
        const p = res.data;
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/')" style="margin-bottom:16px;">← Retour</button>
            <img src="${p.thumbnail || 'https://placehold.co/600x400'}" style="width:100%; border-radius:12px; max-height:300px; object-fit:cover;">
            <h2>${p.name}</h2>
            <p>${p.description || ''}</p>
            <div class="flex-between">
                <span class="price">${formatPrice(p.price)}</span>
                ${p.compare_at_price ? `<span class="old-price">${formatPrice(p.compare_at_price)}</span>` : ''}
            </div>
            <div>Stock : ${p.stock_quantity > 0 ? '✅ En stock' : '❌ Rupture'}</div>
            <button class="btn btn-primary btn-block mt-2" onclick="addToCartFromDetail('${p.id}', ${p.stock_quantity})">Ajouter au panier</button>
        </div>`;
    } catch (e) {
        app.innerHTML = '<div class="container">Produit non trouvé</div>';
    }
}

/* --- Ajout depuis la page détail --- */
window.addToCartFromDetail = function (productId, stock) {
    getProduct(productId).then(res => {
        addToCart(res.data, 1);
    });
};

/* --- Page panier --- */
function renderCartPage() {
    const app = document.getElementById('app');
    if (cart.length === 0) {
        app.innerHTML = `
        <div class="container">
            <h2>🛒 Panier vide</h2>
            <button class="btn btn-primary" onclick="navigateTo('/')">Voir les produits</button>
        </div>`;
        return;
    }
    let html = '<div class="container"><h2>Mon panier</h2>';
    cart.forEach(item => {
        html += `
        <div class="card flex-between">
            <div>
                <strong>${item.name}</strong><br>
                <small>${formatPrice(item.price)} x ${item.quantity}</small>
            </div>
            <div class="flex">
                <button class="btn" onclick="cartUpdateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                <span>${item.quantity}</span>
                <button class="btn" onclick="cartUpdateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                <button class="btn btn-danger" onclick="removeFromCart('${item.id}'); renderCartPage();">🗑</button>
            </div>
        </div>`;
    });
    html += `
        <div class="card">
            <div class="flex-between"><span>Sous-total</span><span>${formatPrice(getCartTotal())}</span></div>
            <div class="flex-between"><span>Livraison</span><span>${getCartTotal() >= 25000 ? 'Gratuit' : formatPrice(1500)}</span></div>
            <div class="flex-between"><strong>Total</strong><strong>${formatPrice(getCartTotal() + (getCartTotal() >= 25000 ? 0 : 1500))}</strong></div>
            <button class="btn btn-primary btn-block mt-2" onclick="navigateTo('/checkout')">Commander</button>
        </div>
    </div>`;
    app.innerHTML = html;
}

window.cartUpdateQuantity = function (productId, qty) {
    updateQuantity(productId, qty);
    renderCartPage();
};

/* --- Page checkout (finalisation de commande) --- */
function renderCheckoutPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <h2>Finaliser la commande</h2>
        <form id="checkout-form">
            <input type="text" id="fullname" placeholder="Nom complet" required>
            <input type="tel" id="phone" placeholder="Téléphone (obligatoire pour Orange, Airtel, MyNita, AmanaTa)" required>
            <textarea id="address" placeholder="Adresse complète" required></textarea>
            <select id="payment-method" required>
                <option value="">-- Mode de paiement --</option>
                <option value="orange_money">Orange Money</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="mynita">MyNita</option>
                <option value="amanata">AmanaTa</option>
                <option value="card">💳 Carte Bancaire (Visa/Mastercard)</option>
                <option value="bank_transfer">🏦 Virement Bancaire</option>
                <option value="cash_on_delivery">💵 Espèces à la livraison</option>
            </select>
            <button type="submit" class="btn btn-primary btn-block mt-2">Confirmer la commande</button>
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
                // Pour les paiements électroniques, on initie le paiement
                await initiatePayment(order.id, phone, payment);
            }

            cart = [];
            saveCart();
            showToast('Commande confirmée !');
            navigateTo('/orders');
        } catch (err) {
            showToast(err.message);
        }
    });
}

/* --- Page liste des commandes --- */
async function renderOrdersPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = '<div class="container"><h2>Mes commandes</h2></div>';
    try {
        const res = await getOrders();
        const orders = res.data || [];
        let html = '';
        orders.forEach(order => {
            html += `<div class="card" onclick="navigateTo('/order/${order.id}')">
                <div class="flex-between"><strong>${order.order_number}</strong><span class="badge">${order.status}</span></div>
                <div>${formatPrice(order.total)}</div>
                <small>${new Date(order.created_at).toLocaleDateString()}</small>
            </div>`;
        });
        app.innerHTML = `<div class="container"><h2>Mes commandes</h2>${html}</div>`;
    } catch (e) {
        app.innerHTML = '<div class="container">Erreur</div>';
    }
}

/* --- Page détail d'une commande --- */
async function renderOrderDetail(orderId) {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = '<div class="container">Chargement...</div>';
    try {
        const res = await getOrder(orderId);
        const order = res.data;
        let items = order.items.map(i => `<li>${i.product_name} x${i.quantity} = ${formatPrice(i.total_price)}</li>`).join('');
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/orders')">← Retour</button>
            <h2>Commande ${order.order_number}</h2>
            <p>Statut : ${order.status}</p>
            <p>Total : ${formatPrice(order.total)}</p>
            <h4>Articles :</h4>
            <ul>${items}</ul>
        </div>`;
    } catch (e) {
        app.innerHTML = '<div class="container">Commande non trouvée</div>';
    }
}

/* --- Page profil --- */
function renderProfilePage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container text-center">
        <h2>👤 Profil</h2>
        <p>${currentUser.full_name || currentUser.phone}</p>
        <button class="btn btn-danger btn-block" onclick="logout()">Déconnexion</button>
    </div>`;
}

/* --- Page connexion / inscription (CORRIGÉE) --- */
function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <h2>Connexion</h2>
        <input type="tel" id="login-phone" placeholder="Téléphone (+227...)" required>
        <button id="send-otp-btn" class="btn btn-primary btn-block">Recevoir le code</button>
        <div id="otp-section" style="display:none;">
            <input type="text" id="otp-code" placeholder="Code SMS" maxlength="6">
            <button id="verify-otp-btn" class="btn btn-primary btn-block">Vérifier</button>
        </div>
    </div>`;

    document.getElementById('send-otp-btn').addEventListener('click', async () => {
        const phone = document.getElementById('login-phone').value.trim();
        if (!phone) {
            showToast('Veuillez saisir votre numéro');
            return;
        }
        try {
            await handleSendOTP(phone);
            document.getElementById('otp-section').style.display = 'block';
            document.getElementById('send-otp-btn').disabled = true;
            document.getElementById('send-otp-btn').textContent = 'Code envoyé';
        } catch (e) {
            showToast('Erreur lors de l\'envoi du code');
        }
    });

    document.getElementById('verify-otp-btn').addEventListener('click', async () => {
        const code = document.getElementById('otp-code').value.trim();
        if (code.length !== 6) {
            showToast('Code invalide');
            return;
        }
        try {
            await handleVerifyOTP(code);
            navigateTo('/');
        } catch (e) {
            showToast(e.message || 'Code incorrect');
        }
    });
}

/* --- Recherche (rapide, redirige vers l'accueil avec le paramètre search) --- */
window.searchProducts = function () {
    const query = document.getElementById('search-input')?.value;
    if (!query) return;
    getProducts({ search: query }).then(res => {
        const products = res.data || [];
        const grid = document.getElementById('product-list');
        if (grid) {
            grid.innerHTML = products.map(p => productCard(p)).join('');
        }
    });
};
