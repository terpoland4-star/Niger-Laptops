/**
 * Niger Laptop - Application e-commerce
 * Architecture modulaire
 */

// Imports
import { formatPrice, escapeHtml, getRatingStars, PLACEHOLDER_IMAGE, handleImageError } from './modules/utils.js';
import { 
    loadCart, setCartUpdateCallback, addToCart, removeFromCart, 
    updateQuantity, clearCart, applyPromo, getCartTotal, getCartCount, 
    getCart, renderCartHTML 
} from './modules/cart.js';
import {
    initUI, updateCartUI, showToast, openModal, closeModal, openCart, closeCart,
    showConfirm, showSkeleton, initNavigation, showPage
} from './modules/ui.js';
import {
    setProductsData, setProductsRenderCallback, renderCategories, renderFeaturedProducts,
    renderProductCardsHTML, applyFilters, initProductsPage, bindProductEvents, viewProduct
} from './modules/products.js';
import { initContactForm, initNewsletter } from './modules/forms.js';
import { initSearch, setSearchProducts } from './modules/search.js';

// Données
let categories = [];
let products = [];

// Chargement des données
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        categories = data.categories;
        products = data.products;
        
        // Partager les données avec les modules
        setProductsData(products, categories);
        setSearchProducts(products);
        
        console.log(`✅ ${categories.length} catégories, ${products.length} produits`);
        
        // Rendre les interfaces
        renderCategories();
        renderFeaturedProducts();
        
        // Initialiser la page produits (filtres, etc.)
        initProductsPage();
        
        return true;
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showToast('Impossible de charger le catalogue', 'error');
        return false;
    }
}

// Callback quand le panier change
function onCartUpdate() {
    updateCartUI();
}

// Animation du panier
function animateCartIcon() {
    const icon = document.getElementById('cartIcon');
    if (icon) {
        icon.style.transform = 'scale(1.2)';
        setTimeout(() => { if (icon) icon.style.transform = 'scale(1)'; }, 300);
    }
}

// Gestionnaire de clics dans le panier
function handleCartItemClick(e) {
    const qtyBtn = e.target.closest('.quantity-btn');
    if (qtyBtn) {
        const id = parseInt(qtyBtn.dataset.id);
        const delta = parseInt(qtyBtn.dataset.delta);
        updateQuantity(id, delta, showToast);
        return;
    }
    const removeBtn = e.target.closest('.cart-item-remove');
    if (removeBtn) {
        const id = parseInt(removeBtn.dataset.id);
        removeFromCart(id, showToast);
    }
}

// Checkout
function checkout() {
    if (getCartCount() === 0) {
        showToast('Panier vide', 'error');
        return;
    }
    openModal('checkoutModal');
}

// Événements généraux
function bindGlobalEvents() {
    // Panier
    document.getElementById('cartItems')?.addEventListener('click', handleCartItemClick);
    document.getElementById('cartIcon')?.addEventListener('click', () => {
        animateCartIcon();
        openCart();
    });
    document.getElementById('cartClose')?.addEventListener('click', closeCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
        if (getCartCount() > 0) {
            showConfirm('Vider le panier ?', () => clearCart(false));
        }
    });
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
    document.getElementById('applyPromoBtn')?.addEventListener('click', () => {
        const input = document.getElementById('promoCode');
        const msg = document.getElementById('promoMessage');
        if (!input || !msg) return;
        const result = applyPromo(input.value);
        if (result.success) {
            msg.textContent = `Code promo appliqué : -${result.discount * 100}%`;
            msg.className = 'promo-message success';
        } else {
            msg.textContent = 'Code invalide';
            msg.className = 'promo-message error';
        }
        updateCartUI();
    });
    
    // Modale checkout
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        closeModal('checkoutModal');
        clearCart(true);
        showToast('Merci pour votre commande !', 'success');
        updateCartUI();
    });
    
    // Fermeture avec Echap
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
}

// Thème sombre/clair
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

// Menu mobile
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

// Back to top
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

// Stats animation
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

// AOS
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 100 });
    }
}

// Initialisation principale
async function init() {
    // Skeletons
    showSkeleton('featuredProductsGrid', 'product', 4);
    showSkeleton('categoriesGrid', 'category', 6);
    showSkeleton('allProductsGrid', 'product', 8);
    
    // Initialiser UI
    initUI();
    
    // Configurer callback du panier
    setCartUpdateCallback(onCartUpdate);
    
    // Charger panier
    loadCart();
    updateCartUI();
    
    // Navigation SPA
    initNavigation(showPage);
    
    // Formulaires
    initContactForm();
    initNewsletter();
    
    // Recherche
    initSearch();
    
    // Événements produits
    bindProductEvents(showToast);
    
    // UI compléments
    initThemeToggle();
    initBackToTop();
    initMobileMenu();
    initStatsAnimation();
    initAOS();
    
    // Événements globaux
    bindGlobalEvents();
    
    // Charger les données
    await loadData();
    
    // Page d'accueil par défaut
    showPage('homePage');
}

// Exposer certaines fonctions globalement (pour les onclick inline)
window.PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='45%25' font-size='14' text-anchor='middle' fill='%23999'%3EImage non%3C/text%3E%3Ctext x='50%25' y='55%25' font-size='14' text-anchor='middle' fill='%23999'%3Edisponible%3C/text%3E%3C/svg%3E";
window.handleImageError = (img) => {
    if (!img || img.src === window.PLACEHOLDER_IMAGE) return;
    img.src = window.PLACEHOLDER_IMAGE;
    img.classList.add('placeholder-img');
};

// Démarrer
document.addEventListener('DOMContentLoaded', init);
