// ==========================================
// ui.js – Composants et rendu des pages
// ==========================================

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

// ==========================================
// PAGE D'ACCUEIL (CARROUSELS PAR CATÉGORIE)
// ==========================================
async function renderHomePage() {
    const app = document.getElementById('app');

    // Récupérer les produits
    let allProducts = [];
    try {
        const res = await getProducts({ limit: 200 });
        allProducts = res.data || [];
    } catch (e) {
        allProducts = [];
    }

    // Regrouper par catégorie
    const categoriesMap = {};
    allProducts.forEach(p => {
        const cat = p.category || 'Sans catégorie';
        if (!categoriesMap[cat]) categoriesMap[cat] = [];
        categoriesMap[cat].push(p);
    });

    // Générer le HTML des catégories
    let categoriesHTML = '';
    for (const [catName, products] of Object.entries(categoriesMap)) {
        const catId = catName.replace(/\s+/g, '-').toLowerCase();
        categoriesHTML += `
        <section class="category-section mb-2">
            <div class="flex-between" style="padding: 0 16px;">
                <h3>${catName}</h3>
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

    // Assembler la page
    app.innerHTML = `
        <header class="container app-header">
            <img src="assets/images/logo/logolap.png" alt="Niger Laptops" class="logo-animated" style="height:70px; width:auto;" onerror="this.style.display='none'">
            <div>
                <h1 style="font-size:1.5rem;">Niger Laptops</h1>
                <p style="font-size:0.85rem; color: var(--text-light); margin: 0;">
                    Consommables & accessoires informatiques à Niamey. Paiement par Zamani Cash, Airtel Money, MyNita, AmanaTa, carte bancaire. Livraison express sous 60 minutes.
                </p>
            </div>
            <span style="flex:1"></span>
            <span id="cart-count" class="badge">${getCartCount()}</span>
        </header>

        <nav class="home-nav">
            <a href="#/" class="active"><i class="fas fa-home"></i> Accueil</a>
            <a href="#/cart"><i class="fas fa-shopping-cart"></i> Panier</a>
            <a href="#/orders"><i class="fas fa-box"></i> Commandes</a>
            <a href="#/profile"><i class="fas fa-user"></i> Profil</a>
        </nav>

        <main class="container" style="padding-top: 0;">
            <input type="search" id="search-input" placeholder="Rechercher un produit..." onkeyup="if(event.key==='Enter')searchProducts()">
            ${categoriesHTML || '<p style="text-align:center; padding:2rem;">Aucun produit trouvé.</p>'}
        </main>
    `;

    // Attacher les événements de défilement aux flèches
    document.querySelectorAll('.prev-btn, .next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const container = document.getElementById(targetId);
            if (container) {
                const scrollAmount = 280; // largeur approximative d'une carte
                if (btn.classList.contains('prev-btn')) {
                    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        });
    });
}

// ==========================================
// FONCTIONS D'AJOUT AU PANIER
// ==========================================
window.addToCartFromCard = async function (productId) {
    try {
        const res = await getProduct(productId);
        const product = res.data;
        addToCart(product, 1);
    } catch (e) {
        showToast('Erreur');
    }
};

window.addToCartFromDetail = function (productId, stock) {
    getProduct(productId).then(res => {
        addToCart(res.data, 1);
    });
};

// ==========================================
// PAGE DÉTAIL PRODUIT (bouton retour déjà présent)
// ==========================================
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

// ==========================================
// PAGE PANIER (bouton retour ajouté)
// ==========================================
function renderCartPage() {
    const app = document.getElementById('app');
    if (cart.length === 0) {
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/')" style="margin-bottom:16px;">← Retour</button>
            <h2>🛒 Panier vide</h2>
            <button class="btn btn-primary" onclick="navigateTo('/')">Voir les produits</button>
        </div>`;
        return;
    }
    let html = '<div class="container"><button onclick="navigateTo(\'/\')" style="margin-bottom:16px;">← Retour</button><h2>Mon panier</h2>';
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

// ==========================================
// PAGE CHECKOUT (bouton retour ajouté)
// ==========================================
function renderCheckoutPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">← Retour</button>
        <h2>Finaliser la commande</h2>
        <form id="checkout-form">
            <input type="text" id="fullname" placeholder="Nom complet" required>
            <input type="tel" id="phone" placeholder="Téléphone (obligatoire pour Airtel, MyNita, AmanaTa)" required>
            <textarea id="address" placeholder="Adresse complète" required></textarea>
            <select id="payment-method" required>
                <option value="">-- Mode de paiement --</option>
                <option value="zamani_cash">Zamani Cash</option>
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

// ==========================================
// PAGE COMMANDES (bouton retour ajouté)
// ==========================================
async function renderOrdersPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = '<div class="container"><button onclick="navigateTo(\'/\')" style="margin-bottom:16px;">← Retour</button><h2>Mes commandes</h2></div>';
    try {
        const res = await getOrders();
        const orders = res.data || [];
        let html = orders.length ? '' : '<p>Aucune commande</p>';
        orders.forEach(order => {
            html += `<div class="card" onclick="navigateTo('/order/${order.id}')">
                <div class="flex-between"><strong>${order.order_number}</strong><span class="badge">${order.status}</span></div>
                <div>${formatPrice(order.total)}</div>
                <small>${new Date(order.created_at).toLocaleDateString()}</small>
            </div>`;
        });
        app.innerHTML = `<div class="container"><button onclick="navigateTo('/')" style="margin-bottom:16px;">← Retour</button><h2>Mes commandes</h2>${html}</div>`;
    } catch (e) {
        app.innerHTML = '<div class="container">Erreur</div>';
    }
}

// ==========================================
// DÉTAIL COMMANDE (bouton retour déjà présent)
// ==========================================
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

// ==========================================
// PAGE PROFIL (bouton retour ajouté)
// ==========================================
function renderProfilePage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container text-center">
        <button onclick="navigateTo('/')" style="margin-bottom:16px; display:block; text-align:left;">← Retour</button>
        <h2>👤 Profil</h2>
        <p>${currentUser.full_name || currentUser.phone}</p>
        <button class="btn btn-danger btn-block" onclick="logout()">Déconnexion</button>
    </div>`;
}

// ==========================================
// PAGE CONNEXION (bouton retour ajouté)
// ==========================================
function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">← Retour</button>
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
        if (!phone) { showToast('Veuillez saisir votre numéro'); return; }
        await handleSendOTP(phone);
        document.getElementById('otp-section').style.display = 'block';
        document.getElementById('send-otp-btn').disabled = true;
        document.getElementById('send-otp-btn').textContent = 'Code envoyé';
    });

    document.getElementById('verify-otp-btn').addEventListener('click', async () => {
        const code = document.getElementById('otp-code').value.trim();
        if (code.length !== 6) { showToast('Code invalide'); return; }
        try {
            await handleVerifyOTP(code);
            navigateTo('/');
        } catch (e) {
            showToast(e.message || 'Code incorrect');
        }
    });
}

// ==========================================
// PAGE À PROPOS (bouton retour déjà présent)
// ==========================================
function renderAboutPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">← Accueil</button>
        <h2>À propos de Niger Laptops</h2>
        <p>Niger Laptops est une boutique en ligne spécialisée dans la vente de consommables et accessoires informatiques à Niamey.</p>
        <p>Notre mission : offrir aux particuliers, étudiants, entreprises et administrations un accès rapide et fiable aux produits informatiques du quotidien, avec une livraison en moins de 60 minutes.</p>
        <h3>Nos valeurs</h3>
        <ul>
            <li>🛍️ Large choix de produits</li>
            <li>🚚 Livraison rapide dans Niamey</li>
            <li>💳 Paiement mobile sécurisé</li>
            <li>📞 Support client réactif</li>
        </ul>
    </div>`;
}

// ==========================================
// PAGE CONTACT (bouton retour déjà présent)
// ==========================================
function renderContactPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')" style="margin-bottom:16px;">← Accueil</button>
        <h2>Contactez Niger Laptops</h2>
        <p class="text-center">Votre boutique de consommables informatiques à Niamey. Livraison sous 60 minutes.</p>

        <div class="card">
            <h3>📍 Adresse</h3>
            <p>Cité Sonuci, sur la latérite de chez Seyni Omar, Niamey (Niger)</p>
            <a href="https://maps.app.goo.gl/AyfgGYvvXYMBTxBv8" target="_blank" rel="noopener" class="btn btn-outline btn-block">
                🗺️ Ouvrir dans Google Maps
            </a>
        </div>

        <div class="card">
            <h3>📞 WhatsApp</h3>
            <a href="https://wa.me/22791127870" target="_blank" rel="noopener" class="btn btn-primary btn-block">
                <img src="assets/images/logo/whatsapp.png" style="height:24px; vertical-align:middle;"> +227 91 12 78 70
            </a>
        </div>

        <div class="card">
            <h3>📧 Email</h3>
            <a href="mailto:zoubeirou.zakariya@gmail.com" class="btn btn-outline btn-block">
                ✉️ zoubeirou.zakariya@gmail.com
            </a>
        </div>

        <div class="card text-center">
            <h3>Suivez-nous</h3>
            <div class="flex" style="justify-content:center; gap:20px; font-size:2rem;">
                <a href="https://www.facebook.com/share/1DANxXYdTC/?mibextid=wwXIfr" target="_blank" rel="noopener" aria-label="Facebook">
                    <i class="fab fa-facebook"></i>
                </a>
            </div>
        </div>
    </div>`;
}

// ==========================================
// RECHERCHE
// ==========================================
window.searchProducts = function () {
    const query = document.getElementById('search-input')?.value;
    if (!query) return;
    getProducts({ search: query }).then(res => {
        const products = res.data || [];
        const grid = document.getElementById('product-list');
        if (grid) grid.innerHTML = products.map(p => productCard(p)).join('');
    });
};
