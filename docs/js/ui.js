// ==========================================
// ui.js – Composants et rendu des pages (moderne, sécurisé, accessible)
// ==========================================

// ---------- COMPARATEUR ----------
let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');

function toggleCompare(productId) {
    const idx = compareList.indexOf(productId);
    if (idx > -1) {
        compareList.splice(idx, 1);
        showToast('Produit retiré du comparateur');
    } else {
        if (compareList.length >= 3) {
            showToast('Vous ne pouvez comparer que 3 produits maximum', 'warning');
            return;
        }
        compareList.push(productId);
        showToast('Produit ajouté au comparateur');
    }
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareButtons();
    if (compareList.length >= 2) {
        const btn = document.getElementById('compare-floating-btn');
        if (!btn) {
            const floatBtn = document.createElement('button');
            floatBtn.id = 'compare-floating-btn';
            floatBtn.className = 'btn btn-primary compare-float';
            floatBtn.innerHTML = `<i class="fas fa-balance-scale"></i> Comparer (${compareList.length})`;
            floatBtn.onclick = () => navigateTo('/compare');
            document.body.appendChild(floatBtn);
        } else {
            btn.innerHTML = `<i class="fas fa-balance-scale"></i> Comparer (${compareList.length})`;
        }
    } else {
        const btn = document.getElementById('compare-floating-btn');
        if (btn) btn.remove();
    }
}

function updateCompareButtons() {
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const pid = btn.dataset.productId;
        if (compareList.includes(pid)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-check"></i> Comparer';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-balance-scale"></i> Comparer';
        }
    });
}

// ---------- LISTE DE SOUHAITS ----------
let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

function toggleWishlist(productId) {
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        showToast('Retiré des favoris');
    } else {
        wishlist.push(productId);
        showToast('Ajouté aux favoris');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistButtons();
}

function updateWishlistButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const pid = btn.dataset.productId;
        btn.classList.toggle('active', wishlist.includes(pid));
        btn.querySelector('i').className = wishlist.includes(pid) ? 'fas fa-heart' : 'far fa-heart';
    });
}

// ---------- RECOMMANDATIONS ----------
function getRecommendations(currentProduct, max = 4) {
    const all = window._allProducts || [];
    if (!all.length) return [];
    let candidates = all.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id);
    candidates.sort(() => Math.random() - 0.5);
    if (candidates.length < max) {
        const others = all.filter(p => p.id !== currentProduct.id && !candidates.some(c => c.id === p.id));
        others.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const needed = max - candidates.length;
        candidates = candidates.concat(others.slice(0, needed));
    }
    return candidates.slice(0, max);
}

// ---------- CARTE PRODUIT (WhatsApp + Liste + Comparer + Favoris) ----------
function productCard(product) {
    const localized = getLocalizedProduct(product);
    const whatsappLink = `https://wa.me/22791127870?text=${encodeURIComponent('Bonjour, je suis intéressé par : ' + localized.name + '. Pouvez-vous me donner plus d\'informations ?')}`;

    return `
    <article class="product-card" data-id="${escapeHTML(localized.id)}" tabindex="0" role="button" aria-label="${escapeHTML(localized.name)}">
        <img src="${escapeHTML(localized.thumbnail || 'https://placehold.co/300x200?text=Pas+d%27image')}" 
             alt="${escapeHTML(localized.name)}" loading="lazy" width="300" height="200">
        <div class="product-info">
            <small>${escapeHTML(localized.brand || '')}</small>
            <h4>${escapeHTML(localized.name)}</h4>
            <div class="flex-between">
                <span class="price" style="font-style:italic;">Prix sur demande</span>
            </div>
            <a href="${whatsappLink}" target="_blank" rel="noopener" class="btn btn-primary btn-block">💬 Discutez sur WhatsApp</a>
            <div class="flex" style="gap:0.3rem; margin-top:0.4rem;">
                <button class="btn btn-sm btn-outline flex-1 add-to-list-btn" data-product-id="${escapeHTML(localized.id)}" onclick="event.stopPropagation(); addToListFromCard('${escapeHTML(localized.id)}')">
                    + Liste
                </button>
                <button class="btn btn-sm btn-outline compare-btn" data-product-id="${escapeHTML(localized.id)}" onclick="event.stopPropagation(); toggleCompare('${escapeHTML(localized.id)}')">
                    <i class="fas fa-balance-scale"></i>
                </button>
                <button class="btn btn-sm btn-outline wishlist-btn" data-product-id="${escapeHTML(localized.id)}" onclick="event.stopPropagation(); toggleWishlist('${escapeHTML(localized.id)}')">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    </article>`;
}

// ---------- SQUELETTE DE CHARGEMENT ----------
function skeleton(columns = 2) {
    let html = '';
    for (let i = 0; i < columns * 2; i++) {
        html += `<div class="skeleton-card"></div>`;
    }
    return `<div class="product-grid">${html}</div>`;
}

// ---------- PAGE D'ACCUEIL ----------
async function renderHomePage() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <header class="container app-header">
            <img src="assets/images/logo/logolap.png" alt="Niger Laptops" class="logo-animated" style="height:70px; width:auto;" onerror="this.style.display='none'">
            <div>
                <h1 style="font-size:1.5rem;">${t('siteName')}</h1>
                <p style="font-size:0.85rem; color: var(--text-secondary); margin: 0;">${t('tagline')}</p>
            </div>
            <span style="flex:1"></span>
        </header>
        <main class="container" style="padding-top: 0;">
            <div class="search-wrapper">
                <input type="search" id="search-input" placeholder="${t('searchPlaceholder')}" autocomplete="off" oninput="handleSearchSuggestions()" aria-label="${t('searchPlaceholder')}">
                <button class="search-btn" onclick="handleSearchSuggestions()" aria-label="Rechercher">
                    <i class="fas fa-search"></i>
                </button>
                <div id="suggestions-dropdown" class="suggestions-dropdown" style="display:none;"></div>
            </div>
            <div id="search-results-grid" class="product-grid mt-2" style="display:none;"></div>
            ${skeleton(2)}
        </main>
    `;

    let allProducts = [];
    try {
        const res = await getProducts({ limit: 200 });
        allProducts = res.data || [];
    } catch (e) {
        allProducts = [];
    }
    window._allProducts = allProducts;
    allProductsCache = allProducts;   // Synchronisation du cache de recherche

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
                <input type="search" id="search-input" placeholder="${t('searchPlaceholder')}" autocomplete="off" oninput="handleSearchSuggestions()" aria-label="${t('searchPlaceholder')}">
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
                updateCompareButtons();
                updateWishlistButtons();
            });
        });
    }

    // Écouteur unique, évite l'accumulation
    app.addEventListener('click', function (e) {
        const btn = e.target.closest('.add-to-list-btn');
        if (btn) {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            const product = window._allProducts?.find(p => p.id === productId);
            if (product) addToList(product, 1);
        }
    });

    updateCompareButtons();
    updateWishlistButtons();
    if (compareList.length >= 2 && !document.getElementById('compare-floating-btn')) {
        const floatBtn = document.createElement('button');
        floatBtn.id = 'compare-floating-btn';
        floatBtn.className = 'btn btn-primary compare-float';
        floatBtn.innerHTML = `<i class="fas fa-balance-scale"></i> Comparer (${compareList.length})`;
        floatBtn.onclick = () => navigateTo('/compare');
        document.body.appendChild(floatBtn);
    }
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
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    if (query.length === 0) {
        dropdown.style.display = 'none';
        if (resultsGrid) resultsGrid.style.display = 'none';
        document.querySelectorAll('.category-section').forEach(s => s.style.display = '');
        return;
    }

    if (allProductsCache.length === 0) {
        loadAllProducts().then(handleSearchSuggestions);
        return;
    }

    const filtered = allProductsCache.filter(p => {
        const loc = getLocalizedProduct(p);
        return loc.name.toLowerCase().includes(query) ||
               loc.description.toLowerCase().includes(query);
    });

    if (resultsGrid) {
        resultsGrid.innerHTML = filtered.map(p => productCard(p)).join('');
        resultsGrid.style.display = filtered.length ? 'block' : 'none';
    }
    document.querySelectorAll('.category-section').forEach(s => s.style.display = 'none');

    if (filtered.length && filtered.length <= 5) {
        dropdown.innerHTML = filtered.slice(0, 5).map(p => {
            const loc = getLocalizedProduct(p);
            return `<div class="suggestion-item" onclick="navigateTo('/product/${loc.id}'); document.getElementById('suggestions-dropdown').style.display='none';">
                <strong>${escapeHTML(loc.name)}</strong> – Prix sur demande
            </div>`;
        }).join('');
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
    updateCompareButtons();
    updateWishlistButtons();
}

// ---------- ACCESSIBILITÉ ----------
let accessibilityInitialized = false;

function initAccessibilityControls() {
    if (accessibilityInitialized) return;
    accessibilityInitialized = true;

    const contrastBtn = document.getElementById('contrast-btn');
    if (contrastBtn) {
        if (localStorage.getItem('highContrast') === 'true') {
            document.body.classList.add('high-contrast');
            contrastBtn.setAttribute('aria-pressed', 'true');
        }
        contrastBtn.addEventListener('click', () => {
            const isHigh = document.body.classList.toggle('high-contrast');
            localStorage.setItem('highContrast', isHigh);
            contrastBtn.setAttribute('aria-pressed', isHigh);
        });
    }

    const fontPlus = document.getElementById('font-plus');
    const fontMinus = document.getElementById('font-minus');
    const fontReset = document.getElementById('font-reset');
    if (fontPlus) fontPlus.addEventListener('click', () => changeFontSize(1));
    if (fontMinus) fontMinus.addEventListener('click', () => changeFontSize(-1));
    if (fontReset) fontReset.addEventListener('click', resetFontSize);
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

// ---------- AVIS CLIENTS ----------
function getReviews(productId) {
    const stored = localStorage.getItem('productReviews');
    const all = stored ? JSON.parse(stored) : {};
    return all[productId] || [];
}

function saveReview(productId, review) {
    const stored = localStorage.getItem('productReviews');
    const all = stored ? JSON.parse(stored) : {};
    if (!all[productId]) all[productId] = [];
    all[productId].push(review);
    localStorage.setItem('productReviews', JSON.stringify(all));
}

function calcAvg(reviews) {
    if (!reviews.length) return 0;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ---------- PAGE DÉTAIL PRODUIT ----------
async function renderProductPage(productId) {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `<div class="container">${t('loading')}</div>`;
    try {
        const res = await getProduct(productId);
        const p = getLocalizedProduct(res.data);
        const reviews = getReviews(productId);
        const avg = calcAvg(reviews);

        let reviewsHTML = reviews.length ?
            `<div class="reviews-section">
                <h3>⭐ ${t('customerReviews')} (${reviews.length})</h3>
                <p class="rating-average">${renderStars(avg)} ${avg}/5</p>
                ${reviews.slice().reverse().map(r => `
                    <div class="review-card">
                        <div class="review-stars">${renderStars(r.rating)}</div>
                        <p class="review-comment">${escapeHTML(r.comment || '')}</p>
                        <small class="review-author">– ${escapeHTML(r.author || t('anonymous'))}</small>
                    </div>`).join('')}
            </div>` : `<p>${t('noReviews')}</p>`;

        let reviewFormHTML = '';
        if (currentUser) {
            reviewFormHTML = `
                <div class="review-form card mt-2">
                    <h4>${t('leaveReview')}</h4>
                    <select id="review-rating" aria-label="Note sur 5">
                        <option value="5">★★★★★</option>
                        <option value="4">★★★★</option>
                        <option value="3">★★★</option>
                        <option value="2">★★</option>
                        <option value="1">★</option>
                    </select>
                    <textarea id="review-comment" placeholder="${t('reviewCommentPlaceholder')}" aria-label="Commentaire"></textarea>
                    <button onclick="submitReview('${escapeHTML(productId)}')" class="btn btn-primary btn-block mt-2">${t('submitReview')}</button>
                </div>`;
        }

        const whatsappLink = `https://wa.me/22791127870?text=${encodeURIComponent('Bonjour, je suis intéressé par : ' + p.name + '. Pouvez-vous me donner plus d\'informations ?')}`;

        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/')" style="margin-bottom:16px;">${t('back')}</button>
            <img src="${escapeHTML(p.thumbnail || 'https://placehold.co/600x400')}" style="width:100%; border-radius:var(--radius); max-height:300px; object-fit:cover;" alt="${escapeHTML(p.name)}">
            <h2>${escapeHTML(p.name)}</h2>
            <p>${escapeHTML(p.description || '')}</p>
            <div class="flex-between">
                <span class="price" style="font-style:italic;">Prix sur demande</span>
            </div>
            <a href="${whatsappLink}" target="_blank" rel="noopener" class="btn btn-primary btn-block mt-2">💬 Discutez sur WhatsApp</a>
            <button class="btn btn-outline btn-block mt-2 add-to-list-btn" data-product-id="${escapeHTML(p.id)}" onclick="addToListFromCard('${escapeHTML(p.id)}')">
                + Ajouter à ma liste
            </button>
            ${reviewsHTML}
            ${reviewFormHTML}
        </div>`;
        updateCompareButtons();
        updateWishlistButtons();
    } catch (e) {
        app.innerHTML = `<div class="container">${t('productNotFound')}</div>`;
    }
}

window.submitReview = function(productId) {
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value.trim();
    if (!rating) return;
    saveReview(productId, {
        rating,
        comment,
        author: currentUser?.full_name || currentUser?.email || 'Client',
        date: new Date().toISOString()
    });
    showToast(t('reviewSubmitted'), 'success');
    renderProductPage(productId);
};

window.addToListFromCard = function(productId) {
    const product = window._allProducts?.find(p => p.id === productId);
    if (product) addToList(product, 1);
};

// ---------- PAGE COMPARATEUR ----------
function renderComparePage() {
    const app = document.getElementById('app');
    if (!app) return;

    if (compareList.length < 2) {
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/')">${t('back')}</button>
            <h2><i class="fas fa-balance-scale"></i> Comparer les produits</h2>
            <p>Ajoutez au moins 2 produits au comparateur.</p>
            <button class="btn btn-primary" onclick="navigateTo('/')">${t('seeProducts')}</button>
        </div>`;
        return;
    }

    const products = compareList
        .map(id => window._allProducts?.find(p => p.id === id))
        .filter(Boolean);

    if (products.length < 2) {
        app.innerHTML = `<div class="container"><button onclick="navigateTo('/')">${t('back')}</button><p>Produits introuvables.</p></div>`;
        return;
    }

    const rows = [
        { label: 'Image', render: p => `<img src="${escapeHTML(p.thumbnail || 'https://placehold.co/150x150')}" style="width:120px; height:auto; border-radius:8px;" alt="${escapeHTML(getLocalizedProduct(p).name)}">` },
        { label: 'Nom', render: p => escapeHTML(getLocalizedProduct(p).name) },
        { label: 'Marque', render: p => escapeHTML(p.brand || '-') },
        { label: 'Prix', render: () => 'Sur demande' },
        { label: 'Condition', render: p => p.condition === 'new' ? t('newProducts') : t('usedProducts') },
        { label: 'Description', render: p => escapeHTML(getLocalizedProduct(p).description || '-') },
        { label: '', render: p => `<a href="https://wa.me/22791127870?text=${encodeURIComponent('Bonjour, je suis intéressé par : ' + getLocalizedProduct(p).name)}" class="btn btn-primary btn-sm">WhatsApp</a>` }
    ];

    let tableHTML = '<div class="compare-table-wrapper"><table class="compare-table"><thead><tr><th>Caractéristique</th>';
    products.forEach(p => {
        tableHTML += `<th>${escapeHTML(getLocalizedProduct(p).name)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    rows.forEach(row => {
        tableHTML += '<tr>';
        tableHTML += `<td class="compare-label">${row.label}</td>`;
        products.forEach(p => {
            tableHTML += `<td>${row.render(p)}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table></div>';

    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')">${t('back')}</button>
        <h2 style="margin-top:1rem;"><i class="fas fa-balance-scale"></i> Comparer les produits</h2>
        ${tableHTML}
        <button class="btn btn-outline btn-block mt-2" onclick="compareList = []; localStorage.removeItem('compareList'); updateCompareButtons(); navigateTo('/'); 
            const fb = document.getElementById('compare-floating-btn'); if(fb) fb.remove();">
            Vider le comparateur
        </button>
    </div>`;
}

// ---------- PAGE LISTE (ex‑panier) ----------
function renderCartPage() {
    const app = document.getElementById('app');
    if (!app) return;
    const list = window.list || [];

    if (list.length === 0) {
        app.innerHTML = `<div class="container"><button onclick="navigateTo('/')">${t('back')}</button><h2>📋 Ma liste</h2><p>Votre liste est vide.</p></div>`;
        return;
    }

    let html = `<div class="container"><button onclick="navigateTo('/')">${t('back')}</button><h2>📋 Ma liste</h2>`;
    list.forEach(item => {
        const loc = getLocalizedProduct(item);
        html += `
        <div class="card flex-between">
            <div>
                <strong>${escapeHTML(loc.name)}</strong><br>
                <small>Quantité : ${item.quantity}</small>
            </div>
            <button class="btn btn-danger" onclick="removeFromList('${escapeHTML(item.id)}'); renderCartPage();">🗑</button>
        </div>`;
    });

    const message = `Bonjour, je suis intéressé par les articles suivants :\n\n${list.map(item => `- ${getLocalizedProduct(item).name} x${item.quantity}`).join('\n')}\n\nPouvez-vous me donner les prix et disponibilités ?`;
    const encoded = encodeURIComponent(message);

    html += `
    <div class="card text-center">
        <a href="https://wa.me/22791127870?text=${encoded}" target="_blank" rel="noopener" class="btn btn-primary btn-block">
            💬 Envoyer ma liste sur WhatsApp
        </a>
    </div>
    </div>`;
    app.innerHTML = html;
}

// ---------- ENVOI WHATSAPP (ancien, conservé) ----------
function sendOrderToWhatsApp({ orderNumber, customerName, phone, address, paymentMethod, total, items }) {
    const message = 
        `🛒 *Nouvelle commande Niger Laptops*\n\n` +
        `📦 N° ${orderNumber}\n` +
        `👤 Client : ${customerName}\n` +
        `📞 Tél : ${phone}\n` +
        `📍 Adresse : ${address}\n` +
        `💰 Total : ${formatPrice(total)}\n` +
        `💳 Paiement : ${paymentMethod}\n\n` +
        `📋 *Articles :*\n` +
        items.map(item => `- ${item.name} x${item.quantity}`).join('\n');

    window.open(`https://wa.me/22791127870?text=${encodeURIComponent(message)}`, '_blank');
}

// ---------- CHECKOUT (conservé mais non utilisé) ----------
function renderCheckoutPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')">${t('back')}</button>
        <h2>${t('checkout')}</h2>
        <form id="checkout-form">
            <input type="text" id="fullname" placeholder="${t('namePlaceholder')}" required aria-label="${t('namePlaceholder')}">
            <input type="tel" id="phone" placeholder="${t('phoneRequired')}" required aria-label="${t('phoneRequired')}">
            <textarea id="address" placeholder="${t('addressPlaceholder')}" required aria-label="${t('addressPlaceholder')}"></textarea>
            <select id="payment-method" required aria-label="${t('paymentMethod')}">
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
        const fullname = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const payment = document.getElementById('payment-method').value;
        const list = window.list || [];

        const message = `Bonjour, je souhaite passer commande :\n\nNom : ${fullname}\nTél : ${phone}\nAdresse : ${address}\nPaiement : ${payment}\n\nArticles :\n${list.map(item => `- ${getLocalizedProduct(item).name} x${item.quantity}`).join('\n')}`;
        window.open(`https://wa.me/22791127870?text=${encodeURIComponent(message)}`, '_blank');
        showToast('Redirection vers WhatsApp...', 'success');
    });
}

// ---------- PAGE COMMANDES ----------
async function renderOrdersPage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `<div class="container"><button onclick="navigateTo('/')">${t('back')}</button><h2>${t('myOrders')}</h2></div>`;
    try {
        const res = await getOrders();
        const orders = res.data || [];
        let html = orders.length ? '' : `<p>${t('noOrders')}</p>`;
        orders.forEach(order => {
            html += `<div class="card" onclick="navigateTo('/order/${order.id}')">
                <div class="flex-between"><strong>${escapeHTML(order.order_number)}</strong><span class="badge">${escapeHTML(order.status)}</span></div>
                <div>${formatPrice(order.total)}</div>
                <small>${formatDate(order.created_at)}</small>
            </div>`;
        });
        app.innerHTML = `<div class="container"><button onclick="navigateTo('/')">${t('back')}</button><h2>${t('myOrders')}</h2>${html}</div>`;
    } catch (e) {
        app.innerHTML = `<div class="container">${t('errorLoading')}</div>`;
    }
}

async function renderOrderDetail(orderId) {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `<div class="container">${t('loading')}</div>`;
    try {
        const res = await getOrder(orderId);
        const order = res.data;
        let items = order.items.map(i => `<li>${escapeHTML(i.product_name)} x${i.quantity} = ${formatPrice(i.total_price)}</li>`).join('');
        app.innerHTML = `
        <div class="container">
            <button onclick="navigateTo('/orders')">${t('back')}</button>
            <h2>${t('orderDetails')} ${escapeHTML(order.order_number)}</h2>
            <p>${t('status')}: ${escapeHTML(order.status)}</p>
            <p>${t('total')}: ${formatPrice(order.total)}</p>
            <h4>${t('articles')}:</h4>
            <ul>${items}</ul>
        </div>`;
    } catch (e) {
        app.innerHTML = `<div class="container">${t('productNotFound')}</div>`;
    }
}

// ---------- SUIVI DE COMMANDE ----------
function renderTrackOrderPage() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')">${t('back')}</button>
        <h2>📦 ${t('trackOrderTitle')}</h2>
        <form id="track-order-form">
            <input type="text" id="track-order-number" placeholder="${t('orderNumberPlaceholder')}" required aria-label="${t('orderNumberPlaceholder')}">
            <button type="submit" class="btn btn-primary btn-block mt-2">${t('trackOrderBtn')}</button>
        </form>
        <div id="track-order-result" class="mt-2"></div>
    </div>`;

    document.getElementById('track-order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const orderNumber = document.getElementById('track-order-number').value.trim();
        const resultDiv = document.getElementById('track-order-result');
        resultDiv.innerHTML = t('loading');
        try {
            const res = await getOrders();
            const orders = res.data || [];
            const order = orders.find(o => o.order_number === orderNumber);
            if (order) {
                const statusLabel = t(order.status) || order.status;
                resultDiv.innerHTML = `
                <div class="card">
                    <h3>${t('orderDetails')} ${escapeHTML(order.order_number)}</h3>
                    <p><strong>${t('status')} :</strong> ${escapeHTML(statusLabel)}</p>
                    <p><strong>${t('total')} :</strong> ${formatPrice(order.total)}</p>
                    <p><strong>${t('createdAt')} :</strong> ${formatDate(order.created_at)}</p>
                </div>`;
            } else {
                resultDiv.innerHTML = `<p>${t('orderNotFoundTrack')}</p>`;
            }
        } catch (err) {
            resultDiv.innerHTML = `<p>${t('errorLoading')}</p>`;
        }
    });
}

// ---------- PAGE PROFIL ----------
function renderProfilePage() {
    if (!currentUser) { navigateTo('/login'); return; }
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
    <div class="container text-center">
        <button onclick="navigateTo('/')" style="margin-bottom:16px; display:block; text-align:left;">${t('back')}</button>
        <h2>${t('profileTitle')}</h2>
        <p>${escapeHTML(currentUser.full_name || currentUser.email)}</p>
        <button class="btn btn-outline btn-block" onclick="subscribeToNotifications()">🔔 ${t('notificationsSubscribe')}</button>
        <button class="btn btn-danger btn-block mt-2" onclick="logout()">${t('logoutBtn')}</button>
    </div>`;
}

function subscribeToNotifications() {
    if (typeof OneSignal !== 'undefined') {
        OneSignal.push(function () {
            OneSignal.registerForPushNotifications()
                .then(() => showToast('🔔 Notifications activées !', 'success'))
                .catch((err) => showToast('Erreur : ' + (err.message || 'inconnue'), 'error'));
        });
    } else {
        showToast('Service de notifications indisponible', 'error');
    }
}

// ---------- PAGE CONNEXION ----------
function renderLoginPage() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')">${t('back')}</button>
        <h2>${t('loginTitle')}</h2>
        <form id="login-form">
            <label for="login-email">${t('emailPlaceholder')}</label>
            <input type="email" id="login-email" placeholder="${t('emailPlaceholder')}" required autocomplete="email">
            <label for="login-password">${t('passwordPlaceholder')}</label>
            <input type="password" id="login-password" placeholder="${t('passwordPlaceholder')}" required autocomplete="current-password">
            <button type="submit" class="btn btn-primary btn-block mt-2">${t('loginBtn')}</button>
        </form>
        <p style="text-align:center; margin-top:1rem;">
            <a href="#/register">${t('createAccount')}</a>
        </p>
    </div>`;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (!isValidEmail(email)) {
            showToast('Email invalide', 'error');
            return;
        }
        try {
            await handleLogin(email, password);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ---------- PAGE INSCRIPTION ----------
function renderRegisterPage() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/login')">${t('back')}</button>
        <h2>${t('registerTitle')}</h2>
        <form id="register-form">
            <label for="reg-fullname">${t('fullnamePlaceholder')}</label>
            <input type="text" id="reg-fullname" placeholder="${t('fullnamePlaceholder')}" required autocomplete="name">
            <label for="reg-email">${t('emailPlaceholder')}</label>
            <input type="email" id="reg-email" placeholder="${t('emailPlaceholder')}" required autocomplete="email">
            <label for="reg-password">${t('passwordPlaceholder')}</label>
            <input type="password" id="reg-password" placeholder="${t('passwordPlaceholder')}" required autocomplete="new-password" minlength="6">
            <button type="submit" class="btn btn-primary btn-block mt-2">${t('registerBtn')}</button>
        </form>
    </div>`;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('reg-fullname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        if (!isValidEmail(email)) {
            showToast('Email invalide', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Mot de passe trop court (6 caractères min)', 'error');
            return;
        }
        try {
            await register(email, password, fullname);
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
    if (!app) return;
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')">${t('backHome')}</button>
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
    if (!app) return;
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')">${t('backHome')}</button>
        <h2>${t('contactTitle')}</h2>
        <p class="text-center">${t('contactDesc')}</p>
        
        <form id="contact-form" class="card">
            <label for="contact-name">${t('namePlaceholder')}</label>
            <input type="text" id="contact-name" placeholder="${t('namePlaceholder')}" required>
            <label for="contact-email">${t('emailPlaceholder')}</label>
            <input type="email" id="contact-email" placeholder="${t('emailPlaceholder')}" required>
            <label for="contact-phone">${t('phonePlaceholder') || 'Téléphone'}</label>
            <input type="tel" id="contact-phone" placeholder="${t('phonePlaceholder') || 'Téléphone'}">
            <label for="contact-message">${t('messagePlaceholder')}</label>
            <textarea id="contact-message" placeholder="${t('messagePlaceholder')}" required></textarea>
            <button type="submit" class="btn btn-primary btn-block mt-2">${t('sendMessage')}</button>
            <p id="contact-status" style="text-align:center; margin-top:1rem;"></p>
        </form>

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
            <a href="mailto:moctarhamadine54@gmail.com" class="btn btn-outline btn-block">
                ✉️ moctarhamadine54@gmail.com
            </a>
        </div>

        <div class="card text-center">
            <h3>${t('followUs')}</h3>
            <div class="flex" style="justify-content:center; gap:20px; font-size:2rem;">
                <a href="https://www.facebook.com/100063546250480" target="_blank" rel="noopener" aria-label="Facebook">
                    <i class="fab fa-facebook"></i>
                </a>
            </div>
        </div>
    </div>`;

    document.getElementById('contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('contact-status');
        status.textContent = 'Envoi en cours...';
        try {
            await emailjs.send("service_4vlnw9a", "template_kw3ckfd", {
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                message: document.getElementById('contact-message').value,
            });
            status.textContent = '✅ Message envoyé !';
            document.getElementById('contact-form').reset();
        } catch (err) {
            status.textContent = '❌ Erreur réseau';
        }
    });
}

// ---------- PAGE FAVORIS ----------
function renderWishlistPage() {
    const app = document.getElementById('app');
    if (!app) return;
    const products = wishlist.map(id => window._allProducts?.find(p => p.id === id)).filter(Boolean);
    if (!products.length) {
        app.innerHTML = `<div class="container"><button onclick="navigateTo('/')">${t('back')}</button><h2>❤️ Favoris</h2><p>Aucun favori pour le moment.</p></div>`;
        return;
    }
    let html = `<div class="container"><button onclick="navigateTo('/')">${t('back')}</button><h2>❤️ Favoris</h2><div class="product-grid">`;
    html += products.map(p => productCard(p)).join('');
    html += '</div></div>';
    app.innerHTML = html;
    updateCompareButtons();
    updateWishlistButtons();
}

// ---------- PAGE BLOG ----------
function renderBlogPage() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
    <div class="container">
        <button onclick="navigateTo('/')">← Accueil</button>
        <h2>📝 Blog</h2>
        <article class="card">
            <h3>Guide d'achat : quel PC choisir en 2026 ?</h3>
            <p>Découvrez nos conseils pour choisir le meilleur ordinateur selon votre budget et vos besoins.</p>
        </article>
        <article class="card">
            <h3>Les avantages du paiement mobile au Niger</h3>
            <p>Rapide, sécurisé et accessible à tous, le paiement mobile révolutionne le commerce.</p>
        </article>
    </div>`;
}

// ---------- EXPOSITIONS GLOBALES ----------
window.renderHomePage = renderHomePage;
window.renderProductPage = renderProductPage;
window.renderComparePage = renderComparePage;
window.renderCartPage = renderCartPage;
window.renderCheckoutPage = renderCheckoutPage;
window.renderOrdersPage = renderOrdersPage;
window.renderOrderDetail = renderOrderDetail;
window.renderTrackOrderPage = renderTrackOrderPage;
window.renderProfilePage = renderProfilePage;
window.renderLoginPage = renderLoginPage;
window.renderRegisterPage = renderRegisterPage;
window.renderAboutPage = renderAboutPage;
window.renderContactPage = renderContactPage;
window.renderWishlistPage = renderWishlistPage;
window.renderBlogPage = renderBlogPage;
window.initAccessibilityControls = initAccessibilityControls;
window.toggleCompare = toggleCompare;
window.toggleWishlist = toggleWishlist;
window.updateCompareButtons = updateCompareButtons;
window.updateWishlistButtons = updateWishlistButtons;
window.addToListFromCard = addToListFromCard;
