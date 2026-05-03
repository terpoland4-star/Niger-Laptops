/**
 * Niger Laptop - Application e-commerce
 * @author HAM Global-Words
 * @version 2.0 Premium
 */

// ========== ÉCHAPPEMENT HTML (SÉCURITÉ XSS) ==========
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========== DONNÉES ==========
const categories = [
    { id: 1, name: "Ordinateurs", icon: "fas fa-laptop", count: 45 },
    { id: 2, name: "Accessoires", icon: "fas fa-mouse", count: 89 },
    { id: 3, name: "Composants", icon: "fas fa-microchip", count: 56 },
    { id: 4, name: "Réseau", icon: "fas fa-wifi", count: 34 },
    { id: 5, name: "Stockage", icon: "fas fa-hdd", count: 42 },
    { id: 6, name: "Périphériques", icon: "fas fa-keyboard", count: 67 }
];

const products = [
    { id: 1, name: "ASUS ROG Strix G15", category: "Ordinateurs", price: 850000, oldPrice: 950000, image: "💻", badge: "sale", featured: true, rating: 4.5, description: "PC portable gaming avec RTX 3060, 16Go RAM, SSD 512Go." },
    { id: 2, name: "Souris Gaming Logitech G502", category: "Accessoires", price: 45000, oldPrice: 55000, image: "🖱️", badge: "sale", featured: true, rating: 4.8, description: "Souris gaming 11 boutons programmables, capteur 25K." },
    { id: 3, name: "Dell XPS 13", category: "Ordinateurs", price: 1250000, oldPrice: null, image: "💻", badge: "new", featured: true, rating: 4.9, description: "Ultrabook 13 pouces, écran InfinityEdge, processeur i7." },
    { id: 4, name: "Clavier Mécanique RGB", category: "Périphériques", price: 65000, oldPrice: 85000, image: "⌨️", badge: "sale", featured: true, rating: 4.7, description: "Clavier mécanique rétroéclairé RGB, switches Cherry MX." },
    { id: 5, name: "SSD NVMe 1To", category: "Stockage", price: 75000, oldPrice: 95000, image: "💾", badge: "sale", featured: false, rating: 4.6, description: "SSD NVMe M.2, vitesse de lecture 3500 Mo/s." },
    { id: 6, name: "Processeur Intel i7", category: "Composants", price: 350000, oldPrice: null, image: "⚙️", badge: null, featured: false, rating: 4.7, description: "Intel Core i7-12700K, 12 cœurs, socket LGA1700." },
    { id: 7, name: "Écran 24 pouces", category: "Périphériques", price: 180000, oldPrice: 220000, image: "🖥️", badge: "sale", featured: true, rating: 4.4, description: "Écran IPS Full HD, temps de réponse 1ms." },
    { id: 8, name: "Routeur Wi-Fi 6", category: "Réseau", price: 95000, oldPrice: null, image: "📡", badge: "new", featured: false, rating: 4.8, description: "Routeur Wi-Fi 6 AX3000, double bande, 4 ports Gigabit." },
    { id: 9, name: "Casque Gaming HyperX", category: "Accessoires", price: 55000, oldPrice: 75000, image: "🎧", badge: "sale", featured: true, rating: 4.6, description: "Casque circum-auriculaire avec microphone détachable." },
    { id: 10, name: "Carte Graphique RTX 3060", category: "Composants", price: 450000, oldPrice: 550000, image: "🎮", badge: "sale", featured: false, rating: 4.9, description: "NVIDIA GeForce RTX 3060 12Go GDDR6." },
    { id: 11, name: "Tablette Samsung Galaxy", category: "Ordinateurs", price: 320000, oldPrice: null, image: "📱", badge: null, featured: false, rating: 4.5, description: "Tablette 10.4 pouces, 64Go, stylet inclus." },
    { id: 12, name: "Imprimante HP Laser", category: "Périphériques", price: 150000, oldPrice: 200000, image: "🖨️", badge: "sale", featured: false, rating: 4.3, description: "Imprimante laser monochrome, recto-verso automatique." }
];

// ========== PANIER ==========
let cart = [];
let promoCode = null;
const PROMOS = { 'NIGER10': 0.1, 'TECH20': 0.2 }; // réductions en pourcentage

function loadCart() {
    const saved = localStorage.getItem('nigerLaptopCart');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            cart = Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'number' && item.quantity > 0) : [];
        } catch (e) { cart = []; }
    }
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
    saveCart();
    showToast(`${escapeHtml(product.name)} ajouté au panier`, 'success');
    animateCartIcon();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    showToast('Produit retiré', 'info');
}

function updateQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(productId);
    else saveCart();
}

function clearCart(silent = false) {
    if (!silent && cart.length > 0) {
        showConfirm('Vider le panier ?', () => {
            cart = [];
            promoCode = null;
            document.getElementById('promoCode').value = '';
            document.getElementById('promoMessage').textContent = '';
            saveCart();
            updateCartCount();
            showToast('Panier vidé', 'info');
            closeCart();
        });
    } else if (silent) {
        cart = [];
        promoCode = null;
        saveCart();
        updateCartCount();
    }
}

function getCartTotal() {
    const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
    if (promoCode && PROMOS[promoCode]) {
        return Math.round(subtotal * (1 - PROMOS[promoCode]));
    }
    return subtotal;
}

function updateCartCount() {
    const count = cart.reduce((t, i) => t + i.quantity, 0);
    const cartCountElem = document.getElementById('cartCount');
    if (cartCountElem) cartCountElem.textContent = count;
    const badge = document.getElementById('cartItemCountBadge');
    if (badge) badge.textContent = count > 0 ? `(${count} article${count > 1 ? 's' : ''})` : '';
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotalSpan = document.getElementById('cartTotal');
    if (!cartItemsDiv || !cartFooter || !cartTotalSpan) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size:48px;"></i><br>Votre panier est vide</div>';
        cartFooter.style.display = 'none';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">${escapeHtml(item.image)}</div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-id="${item.id}" data-delta="-1" aria-label="Retirer">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-delta="1" aria-label="Ajouter">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}" aria-label="Supprimer">🗑️</button>
            </div>
        `).join('');
        cartFooter.style.display = 'block';
        cartTotalSpan.textContent = formatPrice(getCartTotal());
    }
    updateCartCount();
}

// Délégation événementielle panier
function handleCartItemClick(e) {
    const btn = e.target.closest('.quantity-btn');
    if (btn) {
        const id = parseInt(btn.dataset.id);
        const delta = parseInt(btn.dataset.delta);
        updateQuantity(id, delta);
        return;
    }
    const removeBtn = e.target.closest('.cart-item-remove');
    if (removeBtn) {
        const id = parseInt(removeBtn.dataset.id);
        removeFromCart(id);
        return;
    }
}

function animateCartIcon() {
    const icon = document.getElementById('cartIcon');
    if (icon) {
        icon.style.transform = 'scale(1.2)';
        setTimeout(() => { if (icon) icon.style.transform = 'scale(1)'; }, 300);
    }
}

// ========== CODE PROMO ==========
function applyPromo() {
    const input = document.getElementById('promoCode');
    const message = document.getElementById('promoMessage');
    const code = input.value.trim().toUpperCase();
    if (PROMOS[code]) {
        promoCode = code;
        message.textContent = `Code promo appliqué : -${PROMOS[code] * 100}%`;
        message.className = 'promo-message success';
        saveCart(); // met à jour l'UI
    } else {
        promoCode = null;
        message.textContent = 'Code invalide';
        message.className = 'promo-message error';
        updateCartUI();
    }
}

// ========== FORMATAGE ==========
function formatPrice(price) { return price.toLocaleString('fr-FR') + ' FCFA'; }
function getRatingStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
    if (half) stars += '<i class="fas fa-star-half-alt"></i>';
    const empty = 5 - Math.ceil(rating);
    for (let i = 0; i < empty; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

// ========== SKELETON LOADING ==========
function showSkeleton(containerId, type = 'product', count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        if (type === 'product') html += `<div class="skeleton-product"><div class="skeleton-image"></div><div style="padding:20px"><div class="skeleton-text skeleton-title"></div><div class="skeleton-text" style="width:60%"></div><div class="skeleton-price"></div></div></div>`;
        else if (type === 'category') html += `<div class="skeleton-product" style="padding:35px;text-align:center"><div style="width:48px;height:48px;background:var(--bg-tertiary);border-radius:50%;margin:0 auto 15px"></div><div class="skeleton-text skeleton-title" style="margin:0 auto"></div><div class="skeleton-text" style="width:50%;margin:10px auto 0"></div></div>`;
    }
    container.innerHTML = html;
}

// ========== RENDU CATÉGORIES ==========
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    grid.innerHTML = categories.map(cat => `
        <a href="#" class="category-card" data-category="${escapeHtml(cat.name)}">
            <i class="${cat.icon}"></i>
            <h3>${escapeHtml(cat.name)}</h3>
            <p>${cat.count} produits</p>
        </a>
    `).join('');
    grid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = card.dataset.category;
            showPage('productsPage');
            document.getElementById('categoryFilter').value = cat;
            applyFiltersAndRender();
        });
    });
}

// ========== RENDU PRODUITS ==========
let currentPage = 1;
const productsPerPage = 8;
let filteredProducts = [...products];

function getFilteredAndSorted() {
    let list = [...products];
    const catFilter = document.getElementById('categoryFilter')?.value || '';
    const minPrice = parseInt(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = document.getElementById('maxPrice')?.value ? parseInt(document.getElementById('maxPrice').value) : Infinity;
    const sort = document.getElementById('sortBy')?.value || 'default';

    if (catFilter) list = list.filter(p => p.category === catFilter);
    list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);

    switch (sort) {
        case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
        case 'price-asc': list.sort((a, b) => a.price - b.price); break;
        case 'price-desc': list.sort((a, b) => b.price - a.price); break;
        case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    }
    return list;
}

function renderProductsPage(list) {
    const grid = document.getElementById('allProductsGrid');
    if (!grid) return;
    const start = (currentPage - 1) * productsPerPage;
    const paginated = list.slice(start, start + productsPerPage);
    grid.innerHTML = renderProductCards(paginated);
    renderPagination(list.length);
}

function renderProductCards(productList) {
    return productList.map((p, idx) => `
        <div class="product-card" data-aos="fade-up" data-aos-delay="${idx * 50}">
            ${p.badge ? `<div class="product-badge ${escapeHtml(p.badge)}">${p.badge === 'sale' ? 'PROMO' : 'NOUVEAU'}</div>` : ''}
            <div class="product-image">${escapeHtml(p.image)}</div>
            <div class="product-info">
                <div class="product-title">${escapeHtml(p.name)}</div>
                <div class="product-category">${escapeHtml(p.category)}</div>
                <div class="product-rating">${getRatingStars(p.rating)}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(p.price)}</span>
                    ${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" data-id="${p.id}"><i class="fas fa-cart-plus"></i> Ajouter</button>
                    <button class="btn btn-outline view-product-btn" data-id="${p.id}"><i class="fas fa-eye"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination(totalItems) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    const totalPages = Math.ceil(totalItems / productsPerPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Précédent</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Suivant</button>`;
    container.innerHTML = html;
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                applyFiltersAndRender();
                window.scrollTo({ top: document.getElementById('productsToolbar').offsetTop - 100, behavior: 'smooth' });
            }
        });
    });
}

function applyFiltersAndRender() {
    filteredProducts = getFilteredAndSorted();
    currentPage = 1; // réinitialise à la première page
    renderProductsPage(filteredProducts);
}

// ========== INITIALISATION PAGE PRODUITS ==========
function initProductsPage() {
    // Remplir le filtre catégorie
    const catSelect = document.getElementById('categoryFilter');
    if (catSelect) {
        catSelect.innerHTML = '<option value="">Toutes</option>' + [...new Set(products.map(p => p.category))].map(c => `<option value="${c}">${c}</option>`).join('');
    }
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFiltersAndRender);
    // Appliquer les filtres lors du changement des champs (optionnel)
    document.getElementById('categoryFilter').addEventListener('change', applyFiltersAndRender);
    document.getElementById('sortBy').addEventListener('change', applyFiltersAndRender);
    applyFiltersAndRender();
}

// ========== VUE DÉTAILLÉE PRODUIT ==========
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const modal = document.getElementById('productDetailModal');
    const content = document.getElementById('productDetailContent');
    if (!modal || !content) return;

    // Récupérer la note utilisateur si existante
    const userRatings = JSON.parse(localStorage.getItem('nigerRatings') || '{}');
    const userRating = userRatings[productId] || 0;

    content.innerHTML = `
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="font-size:80px; text-align:center; flex:1;">${escapeHtml(product.image)}</div>
            <div style="flex:2;">
                <h3>${escapeHtml(product.name)}</h3>
                <p style="color:var(--text-muted);">${escapeHtml(product.category)}</p>
                <p>${escapeHtml(product.description)}</p>
                <p class="current-price" style="font-size:24px;">${formatPrice(product.price)}</p>
                ${product.oldPrice ? `<p class="old-price">${formatPrice(product.oldPrice)}</p>` : ''}
                <div class="product-rating" style="margin:10px 0;">${getRatingStars(product.rating)} (${product.rating})</div>
                <div class="user-rating" style="margin:15px 0;">
                    <span>Votre note : </span>
                    <div class="star-rating" data-product-id="${product.id}">
                        ${[1,2,3,4,5].map(s => `<i class="${s <= userRating ? 'fas' : 'far'} fa-star" data-star="${s}" style="cursor:pointer;"></i>`).join('')}
                    </div>
                </div>
                <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>
            </div>
        </div>
    `;
    openModal('productDetailModal');

    // Gestion du clic sur les étoiles
    content.querySelectorAll('.star-rating i').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.star);
            const ratings = JSON.parse(localStorage.getItem('nigerRatings') || '{}');
            ratings[productId] = rating;
            localStorage.setItem('nigerRatings', JSON.stringify(ratings));
            // Re-render les étoiles
            content.querySelectorAll('.star-rating i').forEach((s, idx) => {
                s.className = (idx + 1 <= rating) ? 'fas fa-star' : 'far fa-star';
            });
            showToast(`Vous avez noté ${rating} étoile(s)`, 'success');
        });
    });
}

function initProductDetailModal() {
    document.getElementById('closeProductDetailModal').addEventListener('click', () => closeModal('productDetailModal'));
    document.getElementById('productDetailModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('productDetailModal');
    });
}

// ========== ÉVÉNEMENTS PRODUITS (délégation) ==========
function bindProductEvents() {
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            addToCart(parseInt(addBtn.dataset.id));
        }
        const viewBtn = e.target.closest('.view-product-btn');
        if (viewBtn) {
            e.preventDefault();
            viewProduct(parseInt(viewBtn.dataset.id));
        }
    });
}

// ========== NAVIGATION ==========
function showPage(pageId) {
    ['homePage','productsPage','aboutPage','contactPage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const page = document.getElementById(pageId);
    if (page) page.style.display = 'block';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId.replace('Page','')) link.classList.add('active');
    });
    if (pageId === 'productsPage') initProductsPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNavigation() {
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page + 'Page');
        });
    });
    document.getElementById('logoLink')?.addEventListener('click', (e) => { e.preventDefault(); showPage('homePage'); });
}

// ========== TOAST ==========
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.className = `toast-notification ${type}`;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== CART SIDEBAR ==========
function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) {
        sidebar.classList.add('open');
        sidebar.setAttribute('aria-hidden', 'false');
        document.getElementById('cartClose')?.focus();
    }
    if (overlay) { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); }
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) { sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden', 'true'); }
    if (overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); }
    document.body.style.overflow = '';
    document.getElementById('cartIcon')?.focus();
}

// ========== MODALS GÉNÉRIQUES ==========
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const focusable = modal.querySelector('button, [href], input, select, textarea');
    if (focusable) focusable.focus();
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// ========== CONFIRMATION DIALOG ==========
let confirmCallback = null;
function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    const cancel = document.getElementById('confirmCancelBtn');
    const ok = document.getElementById('confirmOkBtn');
    if (!modal || !msg) return;
    msg.textContent = message;
    confirmCallback = onConfirm;
    openModal('confirmModal');
    ok.focus();

    const cleanup = () => {
        confirmCallback = null;
        cancel.removeEventListener('click', cancelHandler);
        ok.removeEventListener('click', okHandler);
        closeModal('confirmModal');
    };
    const cancelHandler = () => cleanup();
    const okHandler = () => { if (confirmCallback) confirmCallback(); cleanup(); };
    cancel.addEventListener('click', cancelHandler);
    ok.addEventListener('click', okHandler);
}

// ========== CHECKOUT ==========
function checkout() {
    if (cart.length === 0) { showToast('Panier vide', 'error'); return; }
    openModal('checkoutModal');
}

// ========== FORMULAIRES ==========
function isValidEmail(email) { return /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email); }
function isValidPhone(phone) { return phone === '' || /^\+?[\d\s\-]{7,}$/.test(phone); }

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        if (!name) { showToast('Nom requis', 'error'); return; }
        if (!email || !isValidEmail(email)) { showToast('Email valide requis', 'error'); return; }
        if (phone && !isValidPhone(phone)) { showToast('Téléphone invalide', 'error'); return; }
        if (!message) { showToast('Message requis', 'error'); return; }
        showToast('Message envoyé !', 'success');
        form.reset();
    });
}

function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value.trim();
        if (!email || !isValidEmail(email)) { showToast('Email valide requis', 'error'); return; }
        showToast('Inscription réussie !', 'success');
        form.reset();
    });
}

// ========== RECHERCHE (avec debounce) ==========
function debounce(fn, delay) {
    let timer;
    return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
}

function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const modal = document.getElementById('searchModal');
    const closeBtn = document.getElementById('searchModalClose');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    if (!searchBtn || !modal) return;

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('searchModal');
        input.focus();
        input.value = '';
        results.innerHTML = '';
    });
    closeBtn.addEventListener('click', () => closeModal('searchModal'));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal('searchModal'); });

    const performSearch = debounce((query) => {
        if (!results) return;
        if (query.length < 2) { results.innerHTML = ''; return; }
        const res = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
        results.innerHTML = res.length ? res.map(p => `
            <div class="search-result-item" data-id="${p.id}" role="option" tabindex="0">
                <span>${escapeHtml(p.name)}</span>
                <span class="search-result-price">${formatPrice(p.price)}</span>
            </div>
        `).join('') : '<div class="search-no-results">Aucun produit trouvé</div>';
    }, 300);

    input.addEventListener('input', (e) => performSearch(e.target.value.trim().toLowerCase()));

    results.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const id = parseInt(item.dataset.id);
        closeModal('searchModal');
        viewProduct(id);
    });
}

// ========== THÈME ==========
function initThemeToggle() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions || document.querySelector('.theme-toggle')) return;
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Changer le thème');
    const icon = document.createElement('i');
    icon.className = 'fas fa-moon';
    btn.appendChild(icon);

    const apply = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            icon.className = 'fas fa-moon';
        }
    };

    const saved = localStorage.getItem('theme');
    if (saved) apply(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) apply('dark');

    btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        apply(next);
        localStorage.setItem('theme', next);
        showToast(next === 'dark' ? 'Mode sombre activé' : 'Mode clair activé', 'success');
    });
    headerActions.insertBefore(btn, headerActions.firstChild);
}

// ========== BACK TO TOP ==========
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.setAttribute('aria-label', 'Haut de page');
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 300);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ========== STICKY HEADER & PARALLAX ==========
function initStickyHeader() {
    const header = document.querySelector('.main-header');
    let lastScroll = 0, ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const y = window.pageYOffset;
                header.style.transform = (y > lastScroll && y > 100) ? 'translateY(-100%)' : 'translateY(0)';
                lastScroll = y;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initParallax() {
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const hero = document.querySelector('.hero');
                if (hero) hero.style.backgroundPositionY = window.pageYOffset * 0.3 + 'px';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ========== MOBILE MENU ==========
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            const expanded = menu.classList.toggle('active');
            toggle.setAttribute('aria-expanded', expanded);
        });
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

// ========== STATS ANIMATION ==========
function animateCounter(el, target) {
    let start = 0;
    const inc = target / 100;
    const update = () => {
        start += inc;
        if (start < target) {
            el.textContent = Math.floor(start) + '+';
            requestAnimationFrame(update);
        } else el.textContent = target + '+';
    };
    update();
}

function initStatsAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.stat-number').forEach(num => {
                    animateCounter(num, parseInt(num.textContent));
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    const stats = document.querySelector('.hero-stats');
    if (stats) observer.observe(stats);
}

// ========== INIT AOS ==========
function initAOS() {
    if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true, offset: 100 });
}

// ========== LOGO EFFECTS ==========
function initLogoEffects() {
    const mainLogo = document.getElementById('mainLogo');
    const footerLogo = document.getElementById('footerLogo');
    if (mainLogo) {
        mainLogo.addEventListener('mouseenter', () => { mainLogo.style.animation = 'none'; mainLogo.offsetHeight; mainLogo.style.animation = 'floatLogo 0.5s ease-in-out'; });
        mainLogo.addEventListener('mouseleave', () => { mainLogo.style.animation = 'floatLogo 3s ease-in-out infinite'; });
    }
    if (footerLogo) {
        footerLogo.addEventListener('mouseenter', () => { footerLogo.style.transform = 'scale(1.05) translateY(-3px)'; });
        footerLogo.addEventListener('mouseleave', () => { footerLogo.style.transform = 'scale(1) translateY(0)'; });
    }
}

// ========== INIT GÉNÉRALE ==========
function init() {
    loadCart();
    renderCategories();
    renderFeaturedWithSkeleton();

    initNavigation();
    initContactForm();
    initNewsletter();
    initMobileMenu();
    initSearch();
    initAOS();
    initLogoEffects();
    bindProductEvents();
    initProductDetailModal();

    initThemeToggle();
    initBackToTop();
    initStickyHeader();
    initStatsAnimation();
    initParallax();

    // Écouteurs panier
    document.getElementById('cartItems')?.addEventListener('click', handleCartItemClick);
    document.getElementById('cartIcon')?.addEventListener('click', openCart);
    document.getElementById('cartClose')?.addEventListener('click', closeCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.getElementById('clearCartBtn')?.addEventListener('click', () => clearCart());
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
    document.getElementById('applyPromoBtn')?.addEventListener('click', applyPromo);

    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        closeModal('checkoutModal');
        clearCart(true);
        showToast('Merci pour votre commande !', 'success');
    });

    // Gestion Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.open, .cart-sidebar.open, .search-modal.open');
            if (modals.length) {
                const last = modals[modals.length - 1];
                if (last.id === 'cartSidebar') closeCart();
                else closeModal(last.id);
            }
        }
    });

    showPage('homePage');
}

function renderFeaturedWithSkeleton() {
    showSkeleton('featuredProductsGrid', 'product', 4);
    setTimeout(() => {
        const grid = document.getElementById('featuredProductsGrid');
        if (grid) grid.innerHTML = renderProductCards(products.filter(p => p.featured));
    }, 300);
}

document.addEventListener('DOMContentLoaded', init);
