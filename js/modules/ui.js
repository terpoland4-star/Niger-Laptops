import { renderCartHTML, getCartTotal, getCartCount, clearCart } from './cart.js';
import { formatPrice } from './utils.js';

// Éléments DOM (initialisés après chargement)
let cartItemsDiv, cartFooter, cartTotalSpan, cartCountSpan, cartSidebar, cartOverlay;

export function initUI() {
    cartItemsDiv = document.getElementById('cartItems');
    cartFooter = document.getElementById('cartFooter');
    cartTotalSpan = document.getElementById('cartTotal');
    cartCountSpan = document.getElementById('cartCount');
    cartSidebar = document.getElementById('cartSidebar');
    cartOverlay = document.getElementById('cartOverlay');
}

// Mettre à jour tout l'UI du panier
export function updateCartUI() {
    if (!cartItemsDiv) return;
    
    cartItemsDiv.innerHTML = renderCartHTML();
    
    const total = getCartTotal();
    const count = getCartCount();
    
    if (cartTotalSpan) cartTotalSpan.textContent = formatPrice(total);
    if (cartCountSpan) cartCountSpan.textContent = count;
    
    const badge = document.getElementById('cartItemCountBadge');
    if (badge) badge.textContent = count > 0 ? `(${count} article${count > 1 ? 's' : ''})` : '';
    
    if (cartFooter) {
        cartFooter.style.display = cartItemsDiv.querySelector('.empty-cart') ? 'none' : 'block';
    }
}

// Toast notification
let toastTimeout = null;
export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    if (!toast || !msg) return;
    
    msg.textContent = message;
    toast.className = `toast-notification ${type}`;
    toast.classList.add('show');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// Modals
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Panier sidebar
export function openCart() {
    if (cartSidebar) {
        cartSidebar.classList.add('open');
        cartSidebar.setAttribute('aria-hidden', 'false');
    }
    if (cartOverlay) {
        cartOverlay.classList.add('open');
        cartOverlay.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
}

export function closeCart() {
    if (cartSidebar) {
        cartSidebar.classList.remove('open');
        cartSidebar.setAttribute('aria-hidden', 'true');
    }
    if (cartOverlay) {
        cartOverlay.classList.remove('open');
        cartOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
}

// Confirmation dialog
let confirmCallback = null;
export function showConfirm(message, onConfirm) {
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

// Skeleton loading
export function showSkeleton(containerId, type = 'product', count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < count; i++) {
        if (type === 'product') {
            html += `<div class="skeleton-product"><div class="skeleton-image"></div><div style="padding:20px"><div class="skeleton-text skeleton-title"></div><div class="skeleton-text" style="width:60%"></div><div class="skeleton-price"></div></div></div>`;
        } else if (type === 'category') {
            html += `<div class="skeleton-product" style="padding:35px;text-align:center"><div style="width:48px;height:48px;background:#e0e0e0;border-radius:50%;margin:0 auto 15px"></div><div class="skeleton-text skeleton-title" style="margin:0 auto"></div><div class="skeleton-text" style="width:50%;margin:10px auto 0"></div></div>`;
        }
    }
    container.innerHTML = html;
}

// Navigation SPA
export function initNavigation(showPageCallback) {
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (showPageCallback) showPageCallback(page + 'Page');
        });
    });
    
    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (showPageCallback) showPageCallback('homePage');
        });
    }
}

export function showPage(pageId) {
    const pages = ['homePage', 'productsPage', 'aboutPage', 'contactPage'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    const page = document.getElementById(pageId);
    if (page) page.style.display = 'block';
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId.replace('Page', '')) {
            link.classList.add('active');
        }
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
