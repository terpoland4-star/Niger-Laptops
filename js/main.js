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
const categories = [
    { id: 1, name: "Ordinateurs", icon: "fas fa-laptop", count: 45 },
    { id: 2, name: "Accessoires", icon: "fas fa-mouse", count: 89 },
    { id: 3, name: "Composants", icon: "fas fa-microchip", count: 56 },
    { id: 4, name: "Réseau", icon: "fas fa-wifi", count: 34 },
    { id: 5, name: "Stockage", icon: "fas fa-hdd", count: 42 },
    { id: 6, name: "Périphériques", icon: "fas fa-keyboard", count: 67 }
];

const products = [
    { id: 1, name: "ASUS ROG Strix G15", category: "Ordinateurs", price: 850000, oldPrice: 950000, image: "💻", badge: "sale", featured: true, rating: 4.5 },
    { id: 2, name: "Souris Gaming Logitech G502", category: "Accessoires", price: 45000, oldPrice: 55000, image: "🖱️", badge: "sale", featured: true, rating: 4.8 },
    { id: 3, name: "Dell XPS 13", category: "Ordinateurs", price: 1250000, oldPrice: null, image: "💻", badge: "new", featured: true, rating: 4.9 },
    { id: 4, name: "Clavier Mécanique RGB", category: "Périphériques", price: 65000, oldPrice: 85000, image: "⌨️", badge: "sale", featured: true, rating: 4.7 },
    { id: 5, name: "SSD NVMe 1To", category: "Stockage", price: 75000, oldPrice: 95000, image: "💾", badge: "sale", featured: false, rating: 4.6 },
    { id: 6, name: "Processeur Intel i7", category: "Composants", price: 350000, oldPrice: null, image: "⚙️", badge: null, featured: false, rating: 4.7 },
    { id: 7, name: "Écran 24 pouces", category: "Périphériques", price: 180000, oldPrice: 220000, image: "🖥️", badge: "sale", featured: true, rating: 4.4 },
    { id: 8, name: "Routeur Wi-Fi 6", category: "Réseau", price: 95000, oldPrice: null, image: "📡", badge: "new", featured: false, rating: 4.8 },
    { id: 9, name: "Casque Gaming HyperX", category: "Accessoires", price: 55000, oldPrice: 75000, image: "🎧", badge: "sale", featured: true, rating: 4.6 },
    { id: 10, name: "Carte Graphique RTX 3060", category: "Composants", price: 450000, oldPrice: 550000, image: "🎮", badge: "sale", featured: false, rating: 4.9 },
    { id: 11, name: "Tablette Samsung Galaxy", category: "Ordinateurs", price: 320000, oldPrice: null, image: "📱", badge: null, featured: false, rating: 4.5 },
    { id: 12, name: "Imprimante HP Laser", category: "Périphériques", price: 150000, oldPrice: 200000, image: "🖨️", badge: "sale", featured: false, rating: 4.3 }
];

// ========== PANIER ==========
let cart = [];

function loadCart() {
    const savedCart = localStorage.getItem('nigerLaptopCart');
    if (savedCart) {
        try {
            const parsed = JSON.parse(savedCart);
            if (Array.isArray(parsed)) {
                cart = parsed.filter(item => item && typeof item.id === 'number' && item.quantity > 0);
            } else {
                cart = [];
            }
        } catch (e) {
            console.warn('Erreur lecture localStorage:', e);
            cart = [];
        }
    } else {
        cart = [];
    }
    updateCartUI();
}

function saveCart() {
    try {
        localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
    } catch (e) {
        console.warn('Erreur sauvegarde localStorage:', e);
        showToast('Erreur de sauvegarde du panier', 'error');
    }
    updateCartUI();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    showToast(`${escapeHtml(product.name)} ajouté au panier`, 'success');
    updateCartCount();
    
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => { 
            if (cartIcon) cartIcon.style.transform = 'scale(1)'; 
        }, 300);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    showToast('Produit retiré du panier', 'info');
}

function updateQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
        }
    }
}

function clearCart() {
    if (cart.length > 0 && confirm('Vider le panier ?')) {
        cart = [];
        saveCart();
        updateCartCount();
        showToast('Panier vidé', 'info');
        closeCart();
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElem = document.getElementById('cartCount');
    if (cartCountElem) cartCountElem.textContent = count;
}

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
                        <button class="quantity-btn" data-id="${item.id}" data-delta="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-delta="1">+</button>
                    </div>
                </div>
                <div class="cart-item-remove" data-id="${item.id}">🗑️</div>
            </div>
        `).join('');
        
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.removeEventListener('click', handleQuantityClick);
            btn.addEventListener('click', handleQuantityClick);
        });
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.removeEventListener('click', handleRemoveClick);
            btn.addEventListener('click', handleRemoveClick);
        });
        
        cartFooter.style.display = 'block';
        cartTotalSpan.textContent = formatPrice(getCartTotal());
    }
    updateCartCount();
}

function handleQuantityClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    const delta = parseInt(e.currentTarget.getAttribute('data-delta'));
    updateQuantity(id, delta);
}

function handleRemoveClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    removeFromCart(id);
}

// ========== FORMATAGE ==========
function formatPrice(price) {
    return price.toLocaleString('fr-FR') + ' FCFA';
}

function getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

// ========== SKELETON LOADING ==========
function showSkeleton(containerId, type = 'product', count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        if (type === 'product') {
            skeletonHTML += `
                <div class="skeleton-product">
                    <div class="skeleton-image"></div>
                    <div style="padding: 20px;">
                        <div class="skeleton-text skeleton-title"></div>
                        <div class="skeleton-text" style="width: 60%;"></div>
                        <div class="skeleton-price"></div>
                    </div>
                </div>
            `;
        } else if (type === 'category') {
            skeletonHTML += `
                <div class="skeleton-product" style="padding: 35px; text-align: center;">
                    <div style="width: 48px; height: 48px; background: var(--bg-tertiary); border-radius: 50%; margin: 0 auto 15px;"></div>
                    <div class="skeleton-text skeleton-title" style="margin: 0 auto;"></div>
                    <div class="skeleton-text" style="width: 50%; margin: 10px auto 0;"></div>
                </div>
            `;
        }
    }
    container.innerHTML = skeletonHTML;
}

// ========== AFFICHAGE PRODUITS AVEC SKELETON ==========
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (grid) {
        grid.innerHTML = categories.map(cat => `
            <a href="#" class="category-card" data-category="${escapeHtml(cat.name)}" data-aos="fade-up" data-aos-delay="${cat.id * 100}">
                <i class="${cat.icon}"></i>
                <h3>${escapeHtml(cat.name)}</h3>
                <p>${cat.count} produits</p>
            </a>
        `).join('');
        
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.getAttribute('data-category');
                showPage('productsPage');
                const filtered = products.filter(p => p.category === category);
                const allProductsGrid = document.getElementById('allProductsGrid');
                if (allProductsGrid) allProductsGrid.innerHTML = renderProductCards(filtered);
                showToast(`${category} : ${filtered.length} produit(s) trouvé(s)`, 'success');
            });
        });
    }
}

function renderCategoriesWithSkeleton() {
    showSkeleton('categoriesGrid', 'category', 6);
    setTimeout(() => {
        renderCategories();
    }, 300);
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (grid) {
        const featured = products.filter(p => p.featured);
        grid.innerHTML = renderProductCards(featured);
    }
}

function renderFeaturedWithSkeleton() {
    showSkeleton('featuredProductsGrid', 'product', 4);
    setTimeout(() => {
        renderFeaturedProducts();
    }, 300);
}

function renderAllProducts() {
    const grid = document.getElementById('allProductsGrid');
    if (grid) {
        grid.innerHTML = renderProductCards(products);
    }
}

function renderProductCards(productList) {
    return productList.map((product, index) => `
        <div class="product-card" data-aos="fade-up" data-aos-delay="${index * 50}">
            ${product.badge ? `<div class="product-badge ${escapeHtml(product.badge)}">${product.badge === 'sale' ? 'PROMO' : 'NOUVEAU'}</div>` : ''}
            <div class="product-image">${escapeHtml(product.image)}</div>
            <div class="product-info">
                <div class="product-title">${escapeHtml(product.name)}</div>
                <div class="product-category">${escapeHtml(product.category)}</div>
                <div class="product-rating">${getRatingStars(product.rating)}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
                        <i class="fas fa-cart-plus"></i> Ajouter
                    </button>
                    <a href="#" class="btn btn-outline view-product-btn" data-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

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
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = 'toast-notification';
    if (type === 'error') toast.classList.add('error');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== CART SIDEBAR ==========
function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

// ========== MODAL ==========
function openModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('open');
        clearCart();
        closeCart();
    }
}

function closeModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('open');
}

// ========== CHECKOUT ==========
function checkout() {
    if (cart.length === 0) {
        showToast('Votre panier est vide', 'error');
        return;
    }
    openModal();
}

// ========== FORMULAIRES AVEC VALIDATION ==========
function isValidEmail(email) {
    return /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email);
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName')?.value.trim();
            const email = document.getElementById('contactEmail')?.value.trim();
            const message = document.getElementById('contactMessage')?.value.trim();
            
            if (!name) { showToast('Veuillez entrer votre nom', 'error'); return; }
            if (!email || !isValidEmail(email)) { showToast('Email valide requis', 'error'); return; }
            if (!message) { showToast('Veuillez écrire un message', 'error'); return; }
            
            showToast('Message envoyé avec succès ! Nous vous répondrons rapidement.', 'success');
            form.reset();
        });
    }
}

function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail')?.value.trim();
            if (!email || !isValidEmail(email)) {
                showToast('Veuillez entrer un email valide', 'error');
                return;
            }
            showToast(`Merci pour votre inscription ! Des offres exclusives seront envoyées à ${escapeHtml(email)}`, 'success');
            form.reset();
        });
    }
}

// ========== SEARCH MODAL ==========
function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const searchModalClose = document.getElementById('searchModalClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchBtn || !searchModal) return;
    
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchModal.classList.add('open');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
        }
        if (searchResults) searchResults.innerHTML = '';
    });
    
    if (searchModalClose) {
        searchModalClose.addEventListener('click', () => {
            searchModal.classList.remove('open');
        });
    }
    
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            searchModal.classList.remove('open');
        }
    });
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 2) {
                if (searchResults) searchResults.innerHTML = '';
                return;
            }
            
            const results = products.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
            
            if (searchResults) {
                if (results.length === 0) {
                    searchResults.innerHTML = '<div class="search-no-results">Aucun produit trouvé</div>';
                } else {
                    searchResults.innerHTML = results.map(p => `
                        <div class="search-result-item" data-id="${p.id}">
                            <span class="search-result-name">${escapeHtml(p.name)}</span>
                            <span class="search-result-price">${formatPrice(p.price)}</span>
                        </div>
                    `).join('');
                    
                    document.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const id = parseInt(item.getAttribute('data-id'));
                            searchModal.classList.remove('open');
                            showPage('productsPage');
                            const filtered = products.filter(p => p.id === id);
                            const allProductsGrid = document.getElementById('allProductsGrid');
                            if (allProductsGrid) allProductsGrid.innerHTML = renderProductCards(filtered);
                            showToast(`Produit trouvé`, 'success');
                        });
                    });
                }
            }
        });
    }
}

// ========== VIEW PRODUCT ==========
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        showToast(`${escapeHtml(product.name)} - ${formatPrice(product.price)}`, 'info');
    }
}

// ========== MOBILE MENU ==========
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
        
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
            });
        });
    }
}

// ========== THEME TOGGLE (Mode sombre/clair) ==========
function initThemeToggle() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.querySelector('.theme-toggle')) {
        const themeBtn = document.createElement('div');
        themeBtn.className = 'theme-toggle';
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        themeBtn.style.cursor = 'pointer';
        themeBtn.style.padding = '8px';
        themeBtn.style.borderRadius = '50%';
        themeBtn.style.background = 'var(--bg-tertiary)';
        themeBtn.style.display = 'flex';
        themeBtn.style.alignItems = 'center';
        themeBtn.style.justifyContent = 'center';
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
                showToast('Mode clair activé', 'success');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
                showToast('Mode sombre activé', 'success');
            }
        });
        
        headerActions.insertBefore(themeBtn, headerActions.firstChild);
    }
}

// ========== BACK TO TOP BUTTON ==========
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== STICKY HEADER EFFECT ==========
function initStickyHeader() {
    const header = document.querySelector('.main-header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
    });
}

// ========== COUNTER ANIMATION ==========
function animateCounter(element, target, duration = 2000) {
    if (!element) return;
    let start = 0;
    const increment = target / (duration / 16);
    
    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    };
    
    updateCounter();
}

function initStatsAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const numbers = entry.target.querySelectorAll('.stat-number');
                numbers.forEach(num => {
                    const target = parseInt(num.textContent);
                    animateCounter(num, target);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) observer.observe(statsSection);
}

// ========== PARALLAX EFFECT ==========
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.backgroundPositionY = scrolled * 0.3 + 'px';
        }
    });
}

// ========== INITIALISATION NAVIGATION ==========
function initNavigation() {
    const navLinks = document.querySelectorAll('[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page === 'home') showPage('homePage');
            if (page === 'products') {
                showPage('productsPage');
                renderAllProducts();
            }
            if (page === 'about') showPage('aboutPage');
            if (page === 'contact') showPage('contactPage');
        });
    });

    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('homePage');
        });
    }
}

// ========== INIT AOS ANIMATIONS ==========
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }
}

// ========== LOGO HOVER EFFECT ==========
function initLogoEffects() {
    const mainLogo = document.getElementById('mainLogo');
    const footerLogo = document.getElementById('footerLogo');
    
    if (mainLogo) {
        mainLogo.addEventListener('mouseenter', () => {
            mainLogo.style.animation = 'none';
            mainLogo.offsetHeight;
            mainLogo.style.animation = 'floatLogo 0.5s ease-in-out';
        });
        
        mainLogo.addEventListener('mouseleave', () => {
            mainLogo.style.animation = 'floatLogo 3s ease-in-out infinite';
        });
    }
    
    if (footerLogo) {
        footerLogo.addEventListener('mouseenter', () => {
            footerLogo.style.transform = 'scale(1.05) translateY(-3px)';
        });
        
        footerLogo.addEventListener('mouseleave', () => {
            footerLogo.style.transform = 'scale(1) translateY(0)';
        });
    }
}

// ========== INITIALISATION GÉNÉRALE ==========
function init() {
    loadCart();
    
    // Afficher les skeletons puis charger les données
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
    
    // Fonctions Premium 2.0
    initThemeToggle();
    initBackToTop();
    initStickyHeader();
    initStatsAnimation();
    initParallax();
    
    // Éléments du panier
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) cartIcon.addEventListener('click', openCart);
    
    const cartClose = document.getElementById('cartClose');
    if (cartClose) cartClose.addEventListener('click', closeCart);
    
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    showPage('homePage');
}

// ========== DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
