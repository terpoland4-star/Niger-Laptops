/**
 * Niger Laptop - Application e-commerce v2.3
 * @author HAM Global-Words
 * @version 2.3 - Placeholder intégré, gestion erreurs images
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

// ========== PLACEHOLDER INTÉGRÉ (DataURI SVG) ==========
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='45%25' font-size='14' text-anchor='middle' fill='%23999' font-family='sans-serif'%3EImage non%3C/text%3E%3Ctext x='50%25' y='55%25' font-size='14' text-anchor='middle' fill='%23999' font-family='sans-serif'%3Edisponible%3C/text%3E%3C/svg%3E";

function handleImageError(img) {
    if (!img) return;
    if (img.src === PLACEHOLDER_IMAGE) return;
    img.src = PLACEHOLDER_IMAGE;
    img.classList.add('placeholder-img');
}

// ========== DONNÉES (chargées depuis data.json) ==========
let categories = [];
let products = [];
let dataLoaded = false;

async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        const data = await response.json();
        if (!data.categories || !Array.isArray(data.categories) || !data.products || !Array.isArray(data.products)) {
            throw new Error('Format JSON invalide');
        }
        categories = data.categories;
        products = data.products;
        dataLoaded = true;
        console.log(`✅ ${categories.length} catégories, ${products.length} produits chargés`);
        return true;
    } catch (error) {
        console.error('❌ Échec du chargement des données :', error);
        showErrorMessage('Impossible de charger le catalogue. Rafraîchissez la page ou réessayez plus tard.');
        return false;
    }
}

function showErrorMessage(msg) {
    const grids = ['categoriesGrid', 'featuredProductsGrid', 'allProductsGrid'];
    grids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>${msg}</p></div>`;
    });
}

// ========== PANIER ==========
let cart = [];
let promoCode = null;
const PROMOS = { 'NIGER10': 0.1, 'TECH20': 0.2 };

function loadCart() {
    const saved = localStorage.getItem('nigerLaptopCart');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            cart = Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'number' && item.quantity > 0) : [];
        } catch(e) { cart = []; }
    }
    promoCode = localStorage.getItem('nigerLaptopPromo') || null;
    updateCartUI();
}

function saveCart() {
    try {
        localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
        if (promoCode) localStorage.setItem('nigerLaptopPromo', promoCode);
        else localStorage.removeItem('nigerLaptopPromo');
    } catch(e) { showToast('Erreur de sauvegarde', 'error'); }
    updateCartUI();
}

function addToCart(productId) {
    if (!dataLoaded) { showToast('Catalogue en chargement...', 'error'); return; }
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
    showToast('Produit retiré', 'info');
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
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
            const promoInput = document.getElementById('promoCode');
            const promoMsg = document.getElementById('promoMessage');
            if (promoInput) promoInput.value = '';
            if (promoMsg) promoMsg.textContent = '';
            saveCart();
            showToast('Panier vidé', 'info');
            closeCart();
        });
    } else if (silent) {
        cart = [];
        promoCode = null;
        saveCart();
    }
}

function getCartTotal() {
    const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
    if (promoCode && PROMOS[promoCode]) return Math.round(subtotal * (1 - PROMOS[promoCode]));
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
    if (!cartItemsDiv) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size:48px;"></i><br>Votre panier est vide</div>';
        if (cartFooter) cartFooter.style.display = 'none';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="handleImageError(this)">
                </div>
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
        if (cartFooter) cartFooter.style.display = 'block';
        if (cartTotalSpan) cartTotalSpan.textContent = formatPrice(getCartTotal());
    }
    updateCartCount();
}

function handleCartItemClick(e) {
    const qtyBtn = e.target.closest('.quantity-btn');
    if (qtyBtn) {
        updateQuantity(parseInt(qtyBtn.dataset.id), parseInt(qtyBtn.dataset.delta));
        return;
    }
    const removeBtn = e.target.closest('.cart-item-remove');
    if (removeBtn) removeFromCart(parseInt(removeBtn.dataset.id));
}

function animateCartIcon() {
    const icon = document.getElementById('cartIcon');
    if (icon) {
        icon.style.transform = 'scale(1.2)';
        setTimeout(() => { if (icon) icon.style.transform = 'scale(1)'; }, 300);
    }
}

function applyPromo() {
    const input = document.getElementById('promoCode');
    const message = document.getElementById('promoMessage');
    if (!input || !message) return;
    const code = input.value.trim().toUpperCase();
    if (PROMOS[code]) {
        promoCode = code;
        message.textContent = `Code promo appliqué : -${PROMOS[code] * 100}%`;
        message.className = 'promo-message success';
    } else {
        promoCode = null;
        message.textContent = 'Code invalide';
        message.className = 'promo-message error';
    }
    saveCart();
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
        if (type === 'product') {
            html += `<div class="skeleton-product"><div class="skeleton-image"></div><div style="padding:20px"><div class="skeleton-text skeleton-title"></div><div class="skeleton-text" style="width:60%"></div><div class="skeleton-price"></div></div></div>`;
        } else if (type === 'category') {
            html += `<div class="skeleton-product" style="padding:35px;text-align:center"><div style="width:48px;height:48px;background:var(--bg-tertiary);border-radius:50%;margin:0 auto 15px"></div><div class="skeleton-text skeleton-title" style="margin:0 auto"></div><div class="skeleton-text" style="width:50%;margin:10px auto 0"></div></div>`;
        }
    }
    container.innerHTML = html;
}

// ========== RENDU PRODUITS ==========
function renderProductCards(productList) {
    return productList.map((p, idx) => `
        <div class="product-card" data-aos="fade-up" data-aos-delay="${idx * 50}">
            ${p.badge ? `<div class="product-badge ${escapeHtml(p.badge)}">${p.badge === 'sale' ? 'PROMO' : 'NOUVEAU'}</div>` : ''}
            <div class="product-image">
                <img src="${escapeHtml(p.image)}" 
                     alt="${escapeHtml(p.name)}" 
                     loading="lazy"
                     onerror="handleImageError(this)">
            </div>
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
            const catFilter = document.getElementById('categoryFilter');
            if (catFilter) {
                catFilter.value = cat;
                applyFiltersAndRender();
            }
        });
    });
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (grid) grid.innerHTML = renderProductCards(products.filter(p => p.featured === true));
}

// ========== FILTRES ET PAGINATION ==========
let currentPage = 1;
const productsPerPage = 8;
let productsPageInitialized = false;
let filteredProducts = [];

function getFilteredAndSorted() {
    let list = [...products];
    const catFilter = document.getElementById('categoryFilter')?.value || '';
    const minPrice = parseInt(document.getElementById('minPrice')?.value) || 0;
    const maxPriceInput = document.getElementById('maxPrice')?.value;
    const maxPrice = maxPriceInput ? parseInt(maxPriceInput) : Infinity;
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
    const noResults = document.getElementById('noResultsMessage');
    const pagination = document.getElementById('paginationContainer');
    if (!grid) return;
    
    if (list.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        if (pagination) pagination.innerHTML = '';
        return;
    }
    if (noResults) noResults.style.display = 'none';
    
    const start = (currentPage - 1) * productsPerPage;
    const paginated = list.slice(start, start + productsPerPage);
    grid.innerHTML = renderProductCards(paginated);
    renderPagination(list.length);
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
                applyFiltersAndRender(false);
                const toolbar = document.getElementById('productsToolbar');
                if (toolbar) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function applyFiltersAndRender(scrollToTop = false) {
    filteredProducts = getFilteredAndSorted();
    currentPage = 1;
    renderProductsPage(filteredProducts);
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initProductsPage() {
    if (productsPageInitialized) return;
    productsPageInitialized = true;
    
    const catSelect = document.getElementById('categoryFilter');
    if (catSelect) {
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        catSelect.innerHTML = '<option value="">Toutes</option>' + uniqueCategories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    
    document.getElementById('applyFiltersBtn')?.addEventListener('click', () => applyFiltersAndRender(true));
    document.getElementById('categoryFilter')?.addEventListener('change', () => applyFiltersAndRender(true));
    document.getElementById('sortBy')?.addEventListener('change', () => applyFiltersAndRender(true));
    
    applyFiltersAndRender();
}

// ========== VUE PRODUIT AVEC SPECS ==========
function viewProduct(productId) {
    if (!dataLoaded) { showToast('Catalogue en chargement...', 'error'); return; }
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productDetailModal');
    const content = document.getElementById('productDetailContent');
    if (!modal || !content) return;

    const userRatings = JSON.parse(localStorage.getItem('nigerRatings') || '{}');
    const userRating = userRatings[productId] || 0;

    let specsHtml = '';
    if (product.specs) {
        specsHtml = `
            <div class="product-specs">
                <h4>Fiche technique</h4>
                <table class="specs-table">
                    ${Object.entries(product.specs).map(([key, val]) => `
                        <tr>
                            <th>${escapeHtml(key.replace(/([A-Z])/g, ' $1').trim())}</th>
                            <td>${escapeHtml(String(val))}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
    }

    content.innerHTML = `
        <button class="modal-close" id="closeProductDetailModalInner" aria-label="Fermer">&times;</button>
        <h3 id="productDetailTitle">${escapeHtml(product.name)}</h3>
        <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:20px;">
            <div style="text-align:center; flex:1; min-width:120px;">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" style="max-width:100%; height:auto;" onerror="handleImageError(this)">
            </div>
            <div style="flex:2; min-width:250px;">
                <p style="color:var(--text-muted);">${escapeHtml(product.category)}</p>
                <p>${escapeHtml(product.description)}</p>
                <p class="current-price" style="font-size:24px;">${formatPrice(product.price)}</p>
                ${product.oldPrice ? `<p class="old-price" style="text-decoration:line-through;">${formatPrice(product.oldPrice)}</p>` : ''}
                <div class="product-rating" style="margin:10px 0;">${getRatingStars(product.rating)} (${product.rating})</div>
                <div class="user-rating" style="margin:15px 0;">
                    <span>Votre note : </span>
                    <span class="star-rating" data-product-id="${product.id}">
                        ${[1,2,3,4,5].map(s => `<i class="${s <= userRating ? 'fas' : 'far'} fa-star" data-star="${s}" style="cursor:pointer; color:#ffc107;"></i>`).join('')}
                    </span>
                </div>
                <button class="btn btn-primary add-to-cart-btn-detail" data-id="${product.id}"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>
            </div>
        </div>
        ${specsHtml}
    `;
    
    openModal('productDetailModal');

    content.querySelectorAll('.star-rating i').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.star);
            const ratings = JSON.parse(localStorage.getItem('nigerRatings') || '{}');
            ratings[productId] = rating;
            localStorage.setItem('nigerRatings', JSON.stringify(ratings));
            content.querySelectorAll('.star-rating i').forEach((s, idx) => {
                s.className = (idx + 1 <= rating) ? 'fas fa-star' : 'far fa-star';
            });
            showToast(`Vous avez noté ${rating} étoile(s)`, 'success');
        });
    });

    const addBtnDetail = content.querySelector('.add-to-cart-btn-detail');
    if (addBtnDetail) {
        addBtnDetail.addEventListener('click', () => {
            addToCart(parseInt(addBtnDetail.dataset.id));
            closeModal('productDetailModal');
        });
    }

    const closeInner = document.getElementById('closeProductDetailModalInner');
    if (closeInner) closeInner.addEventListener('click', () => closeModal('productDetailModal'));
}

// ========== ÉVÉNEMENTS PRODUITS ==========
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
            showPage(link.dataset.page + 'Page');
        });
    });
    const logoLink = document.getElementById('logoLink');
    if (logoLink) logoLink.addEventListener('click', (e) => { e.preventDefault(); showPage('homePage'); });
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
    }
    if (overlay) {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) {
        sidebar.classList.remove('open');
        sidebar.setAttribute('aria-hidden', 'true');
    }
    if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
}

// ========== MODALS ==========
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

function initProductDetailModal() {
    const modal = document.getElementById('productDetailModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal('productDetailModal');
        });
    }
}

// ========== CONFIRMATION ==========
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
    if (ok) ok.focus();

    const cleanup = () => {
        confirmCallback = null;
        cancel?.removeEventListener('click', cancelHandler);
        ok?.removeEventListener('click', okHandler);
        closeModal('confirmModal');
    };
    const cancelHandler = () => cleanup();
    const okHandler = () => { if (confirmCallback) confirmCallback(); cleanup(); };
    cancel?.addEventListener('click', cancelHandler);
    ok?.addEventListener('click', okHandler);
}

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
        const name = document.getElementById('contactName')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const phone = document.getElementById('contactPhone')?.value.trim();
        const message = document.getElementById('contactMessage')?.value.trim();
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
        const email = document.getElementById('newsletterEmail')?.value.trim();
        if (!email || !isValidEmail(email)) { showToast('Email valide requis', 'error'); return; }
        showToast('Inscription réussie !', 'success');
        form.reset();
    });
}

// ========== RECHERCHE ==========
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
        input?.focus();
        if (input) input.value = '';
        if (results) results.innerHTML = '';
    });
    closeBtn?.addEventListener('click', () => closeModal('searchModal'));
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

    input?.addEventListener('input', (e) => performSearch(e.target.value.trim().toLowerCase()));

    results?.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const id = parseInt(item.dataset.id);
        closeModal('searchModal');
        viewProduct(id);
    });
}

// ========== UI COMPLÉMENTS ==========
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

function initStickyHeader() {
    const header = document.querySelector('.main-header');
    if (!header) return;
    let lastScroll = 0;
    let ticking = false;
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

function initStatsAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.stat-number').forEach(num => {
                    const target = parseInt(num.textContent);
                    let start = 0;
                    const inc = target / 50;
                    const update = () => {
                        start += inc;
                        if (start < target) {
                            num.textContent = Math.floor(start) + '+';
                            requestAnimationFrame(update);
                        } else num.textContent = target + '+';
                    };
                    update();
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    const stats = document.querySelector('.hero-stats');
    if (stats) observer.observe(stats);
}

function initAOS() {
    if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true, offset: 100 });
}

// ========== INIT PRINCIPALE ==========
async function init() {
    // Skeletons
    showSkeleton('featuredProductsGrid', 'product', 4);
    showSkeleton('categoriesGrid', 'category', 6);
    showSkeleton('allProductsGrid', 'product', 8);

    // Chargement des données
    const success = await loadData();
    if (!success) return;

    // Rendu des données
    renderCategories();
    renderFeaturedProducts();
    
    // Init composants
    loadCart();
    initNavigation();
    initContactForm();
    initNewsletter();
    initMobileMenu();
    initSearch();
    initAOS();
    bindProductEvents();
    initProductDetailModal();
    initThemeToggle();
    initBackToTop();
    initStickyHeader();
    initStatsAnimation();

    // Écouteurs panier
    const cartItems = document.getElementById('cartItems');
    if (cartItems) cartItems.addEventListener('click', handleCartItemClick);
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

    // Fermeture modales avec ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.open, .cart-sidebar.open, .search-modal.open');
            if (openModals.length > 0) {
                const last = openModals[openModals.length - 1];
                if (last.id === 'cartSidebar') closeCart();
                else closeModal(last.id);
            }
        }
    });

    showPage('homePage');
}

// Rendre handleImageError accessible globalement
window.handleImageError = handleImageError;

// Démarrage
document.addEventListener('DOMContentLoaded', init);
