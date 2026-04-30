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
    if (savedCart) cart = JSON.parse(savedCart);
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('nigerLaptopCart', JSON.stringify(cart));
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
    showToast(`${product.name} ajouté au panier`, 'success');
    updateCartCount();
    
    // Animation sur le panier
    const cartIcon = document.getElementById('cartIcon');
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => { cartIcon.style.transform = 'scale(1)'; }, 300);
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
    cart = [];
    saveCart();
    updateCartCount();
    showToast('Panier vidé', 'info');
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotalSpan = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 15px;"></i><br>Votre panier est vide</div>';
        cartFooter.style.display = 'none';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">${item.image}</div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-remove" onclick="removeFromCart(${item.id})">🗑️</div>
            </div>
        `).join('');
        cartFooter.style.display = 'block';
        cartTotalSpan.textContent = formatPrice(getCartTotal());
    }
    updateCartCount();
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

// ========== AFFICHAGE PRODUITS ==========
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (grid) {
        grid.innerHTML = categories.map(cat => `
            <a href="#" class="category-card" data-category="${cat.name}" data-aos="fade-up" data-aos-delay="${cat.id * 100}">
                <i class="${cat.icon}"></i>
                <h3>${cat.name}</h3>
                <p>${cat.count} produits</p>
            </a>
        `).join('');
        
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.getAttribute('data-category');
                showPage('productsPage');
                const filtered = products.filter(p => p.category === category);
                setTimeout(() => {
                    const grid = document.getElementById('allProductsGrid');
                    if (grid) grid.innerHTML = renderProductCards(filtered);
                    showToast(`${category} : ${filtered.length} produit(s) trouvé(s)`, 'success');
                }, 100);
            });
        });
    }
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (grid) {
        const featured = products.filter(p => p.featured);
        grid.innerHTML = renderProductCards(featured);
    }
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
            ${product.badge ? `<div class="product-badge ${product.badge}">${product.badge === 'sale' ? 'PROMO' : 'NOUVEAU'}</div>` : ''}
            <div class="product-image">${product.image}</div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-rating">${getRatingStars(product.rating)}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Ajouter
                    </button>
                    <a href="#" class="btn btn-outline" onclick="viewProduct(${product.id}); return false;">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== NAVIGATION ==========
function showPage(pageId) {
    const pages = ['homePage', 'productsPage', 'aboutPage', 'contactPage'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
    
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
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
}

// ========== MODAL ==========
function openModal() {
    document.getElementById('checkoutModal').classList.add('open');
    clearCart();
    closeCart();
}

function closeModal() {
    document.getElementById('checkoutModal').classList.remove('open');
}

// ========== CHECKOUT ==========
function checkout() {
    if (cart.length === 0) {
        showToast('Votre panier est vide', 'error');
        return;
    }
    openModal();
}

// ========== FORMULAIRES ==========
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
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
            const email = document.getElementById('newsletterEmail').value;
            showToast(`Merci pour votre inscription ! Des offres exclusives seront envoyées à ${email}`, 'success');
            form.reset();
        });
    }
}

// ========== VIEW PRODUCT ==========
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        showToast(`${product.name} - ${formatPrice(product.price)}`, 'info');
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

// ========== SEARCH ==========
function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = prompt('Rechercher un produit :');
            if (query && query.trim()) {
                const results = products.filter(p => 
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    p.category.toLowerCase().includes(query.toLowerCase())
                );
                if (results.length > 0) {
                    showToast(`${results.length} produit(s) trouvé(s)`, 'success');
                    showPage('productsPage');
                    setTimeout(() => {
                        const grid = document.getElementById('allProductsGrid');
                        if (grid) grid.innerHTML = renderProductCards(results);
                    }, 100);
                } else {
                    showToast('Aucun produit trouvé', 'error');
                }
            }
        });
    }
}

// ========== INITIALISATION ==========
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

// ========== DEMARRAGE ==========
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCategories();
    renderFeaturedProducts();
    initNavigation();
    initContactForm();
    initNewsletter();
    initMobileMenu();
    initSearch();
    initAOS();
    initLogoEffects();
    
    document.getElementById('cartIcon').addEventListener('click', openCart);
    document.getElementById('cartClose').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if (confirm('Vider le panier ?')) clearCart();
    });
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    
    showPage('homePage');
});
