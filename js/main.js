// ========== FONCTION D'ÉCHAPPEMENT HTML (SÉCURITÉ XSS) ==========
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========== DONNÉES PRODUITS ==========
const categories = [ /* identique */ ];
const products = [ /* identique */ ];

// ========== PANIER ==========
let cart = [];

// Chargement / sauvegarde (inchangé)
function loadCart() { /* ... */ }
function saveCart() {
    try {
        localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
    } catch (e) {
        console.warn('Erreur sauvegarde localStorage:', e);
        showToast('Erreur de sauvegarde du panier', 'error');
    }
    updateCartUI();
}

function addToCart(productId) { /* ... identique, utilise escapeHtml */ }
function removeFromCart(productId) { /* ... */ }
function updateQuantity(productId, delta) { /* ... */ }
function clearCart(silent = false) {
    if (!silent && cart.length > 0) {
        showConfirm('Vider le panier ?', () => {
            cart = [];
            saveCart();
            updateCartCount();
            showToast('Panier vidé', 'info');
            closeCart();
        });
    } else if (silent) {
        cart = [];
        saveCart();
        updateCartCount();
    }
}
function getCartTotal() { /* ... */ }
function updateCartCount() { /* ... */ }

// ========== DÉLÉGATION ÉVÉNEMENTIELLE DU PANIER ==========
function updateCartUI() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotalSpan = document.getElementById('cartTotal');
    if (!cartItemsDiv || !cartFooter || !cartTotalSpan) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 15px;"></i><br>Votre panier est vide</div>';
        cartFooter.style.display = 'none';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">${escapeHtml(item.image)}</div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-id="${item.id}" data-delta="-1" aria-label="Retirer un ${escapeHtml(item.name)}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-delta="1" aria-label="Ajouter un ${escapeHtml(item.name)}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}" aria-label="Supprimer ${escapeHtml(item.name)}">🗑️</button>
            </div>
        `).join('');
        cartFooter.style.display = 'block';
        cartTotalSpan.textContent = formatPrice(getCartTotal());
    }
    updateCartCount();
}

// Gestion des clics délégués
function handleCartItemClick(e) {
    const target = e.target;
    // Bouton quantité
    const qtyBtn = target.closest('.quantity-btn');
    if (qtyBtn) {
        const id = parseInt(qtyBtn.getAttribute('data-id'));
        const delta = parseInt(qtyBtn.getAttribute('data-delta'));
        updateQuantity(id, delta);
        return;
    }
    // Bouton suppression
    const removeBtn = target.closest('.cart-item-remove');
    if (removeBtn) {
        const id = parseInt(removeBtn.getAttribute('data-id'));
        removeFromCart(id);
        return;
    }
}

// ========== FORMATAGE ==========
function formatPrice(price) { return price.toLocaleString('fr-FR') + ' FCFA'; }
function getRatingStars(rating) { /* identique */ }

// ========== SKELETON LOADING (inchangé) ==========
function showSkeleton(containerId, type = 'product', count = 6) { /* ... */ }

// ========== AFFICHAGE PRODUITS AVEC SKELETON ==========
function renderCategories() { /* ... */ }
function renderCategoriesWithSkeleton() { /* ... */ }
function renderFeaturedProducts() { /* ... */ }
function renderFeaturedWithSkeleton() { /* ... */ }
function renderAllProducts() { /* ... */ }
function renderProductCards(productList) { /* ... */ }

function bindProductEvents() {
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            const id = parseInt(addBtn.getAttribute('data-id'));
            addToCart(id);
        }
        const viewBtn = e.target.closest('.view-product-btn');
        if (viewBtn) {
            e.preventDefault();
            const id = parseInt(viewBtn.getAttribute('data-id'));
            viewProduct(id);
        }
    });
}

// ========== NAVIGATION ==========
function showPage(pageId) {
    const pages = ['homePage', 'productsPage', 'aboutPage', 'contactPage'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.style.display = 'block';

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId.replace('Page', '')) {
            link.classList.add('active');
        }
    });

    if (pageId === 'productsPage') renderAllProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== TOAST ==========
function showToast(message, type = 'success') { /* identique, mais utilise textContent */ }

// ========== CART SIDEBAR avec focus management ==========
function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) {
        sidebar.classList.add('open');
        sidebar.setAttribute('aria-hidden', 'false');
        // Focus sur le bouton de fermeture
        document.getElementById('cartClose')?.focus();
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
    document.getElementById('cartIcon')?.focus();
}

// ========== MODALS GÉNÉRIQUES ==========
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    // Piège focus simple : premier bouton ou contenu
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea');
    if (firstFocusable) firstFocusable.focus();
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// ========== CHECKOUT ==========
function checkout() {
    if (cart.length === 0) {
        showToast('Votre panier est vide', 'error');
        return;
    }
    openModal('checkoutModal');
    // Le panier sera vidé après fermeture (voir closeModalBtn)
}

// ========== CONFIRMATION DIALOG ==========
let confirmCallback = null;
function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const okBtn = document.getElementById('confirmOkBtn');
    if (!modal || !msg) return;

    msg.textContent = message;
    confirmCallback = onConfirm;
    openModal('confirmModal');
    okBtn.focus();

    const cleanup = () => {
        confirmCallback = null;
        cancelBtn.removeEventListener('click', cancelHandler);
        okBtn.removeEventListener('click', okHandler);
        closeModal('confirmModal');
    };

    const cancelHandler = () => cleanup();
    const okHandler = () => {
        if (confirmCallback) confirmCallback();
        cleanup();
    };

    cancelBtn.addEventListener('click', cancelHandler);
    okBtn.addEventListener('click', okHandler);
}

// ========== FORMULAIRES AVEC VALIDATION ==========
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

        if (!name) { showToast('Veuillez entrer votre nom', 'error'); return; }
        if (!email || !isValidEmail(email)) { showToast('Email valide requis', 'error'); return; }
        if (phone && !isValidPhone(phone)) { showToast('Numéro de téléphone invalide', 'error'); return; }
        if (!message) { showToast('Veuillez écrire un message', 'error'); return; }

        showToast('Message envoyé avec succès ! Nous vous répondrons rapidement.', 'success');
        form.reset();
    });
}

// ========== SEARCH AVEC DEBOUNCE ==========
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const searchModalClose = document.getElementById('searchModalClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchBtn || !searchModal) return;

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('searchModal');
        searchInput?.focus();
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
    });

    searchModalClose?.addEventListener('click', () => closeModal('searchModal'));

    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) closeModal('searchModal');
    });

    const performSearch = debounce((query) => {
        if (!searchResults) return;
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        const results = products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">Aucun produit trouvé</div>';
        } else {
            searchResults.innerHTML = results.map(p => `
                <div class="search-result-item" data-id="${p.id}" role="option" tabindex="0">
                    <span class="search-result-name">${escapeHtml(p.name)}</span>
                    <span class="search-result-price">${formatPrice(p.price)}</span>
                </div>
            `).join('');
        }
    }, 300);

    searchInput?.addEventListener('input', (e) => {
        performSearch(e.target.value.trim().toLowerCase());
    });

    // Clic sur résultat (délégation)
    searchResults?.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const id = parseInt(item.getAttribute('data-id'));
        closeModal('searchModal');
        showPage('productsPage');
        const filtered = products.filter(p => p.id === id);
        const allProductsGrid = document.getElementById('allProductsGrid');
        if (allProductsGrid) allProductsGrid.innerHTML = renderProductCards(filtered);
        showToast(`Produit trouvé`, 'success');
    });
}

// ========== INITIALISATION AVEC PERFORMANCES ET ACCESSIBILITÉ ==========
function init() {
    loadCart();

    renderCategoriesWithSkeleton();
    renderFeaturedWithSkeleton();

    initNavigation();
    initContactForm();
    initNewsletter();
    initMobileMenu();
    initSearch();
    initAOS();
    initLogoEffects();
    bindProductEvents();

    initThemeToggle();
    initBackToTop();
    initStickyHeader();
    initStatsAnimation();
    initParallax();  // optimisé avec rAF

    // Écouteurs cart sidebar (délégation sur #cartItems)
    document.getElementById('cartItems')?.addEventListener('click', handleCartItemClick);

    document.getElementById('cartIcon')?.addEventListener('click', openCart);
    document.getElementById('cartClose')?.addEventListener('click', closeCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

    document.getElementById('clearCartBtn')?.addEventListener('click', () => clearCart());
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);

    // Fermeture modale checkout => vide le panier
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        closeModal('checkoutModal');
        clearCart(true); // silencieux
        showToast('Merci pour votre commande !', 'success');
    });

    // Gestion globale touche Escape pour modales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.open, .cart-sidebar.open, .search-modal.open');
            if (openModals.length > 0) {
                const last = openModals[openModals.length - 1];
                if (last.id === 'cartSidebar') closeCart();
                else if (last.id === 'searchModal') closeModal('searchModal');
                else if (last.id === 'checkoutModal') closeModal('checkoutModal');
                else if (last.id === 'confirmModal') closeModal('confirmModal');
            }
        }
    });

    showPage('homePage');
}

// ========== OPTIMISATION SCROLL ANIMATIONS ==========
function initParallax() {
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const hero = document.querySelector('.hero');
                if (hero) hero.style.backgroundPositionY = scrolled * 0.3 + 'px';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initStickyHeader() {
    const header = document.querySelector('.main-header');
    let lastScroll = 0;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentScroll = window.pageYOffset;
                if (currentScroll > lastScroll && currentScroll > 100) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }
                lastScroll = currentScroll;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ========== THEME DÉTECTION PRÉFÉRENCES SYSTÈME ==========
function initThemeToggle() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions || document.querySelector('.theme-toggle')) return;

    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle';
    themeBtn.setAttribute('aria-label', 'Changer le thème');
    themeBtn.setAttribute('title', 'Mode sombre / clair');
    const icon = document.createElement('i');
    icon.className = 'fas fa-moon';
    themeBtn.appendChild(icon);

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            icon.className = 'fas fa-moon';
        }
    };

    // Détection au chargement
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }

    themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        showToast(newTheme === 'dark' ? 'Mode sombre activé' : 'Mode clair activé', 'success');
    });

    headerActions.insertBefore(themeBtn, headerActions.firstChild);
}

// ... autres fonctions (back-to-top, counter animation, mobile menu, etc.) similaires mais avec attributs aria-expanded et gestion focus

// ========== DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
