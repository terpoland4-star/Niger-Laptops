// ==========================================
// app.js – Routeur, initialisation, navigation
// ==========================================

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', async () => {
    initTheme();
    initLanguage();
    initAccessibilityControls();
    renderFooter();
    await loadAllProducts();
    await checkAuth();
    initInstallBanner();
    handleRoute();
    setInterval(checkAbandonedCart, 60000);
});

function setActiveNav(path) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(el => el.classList.remove('active'));

    const map = {
        '/': 'nav-home',
        '/home': 'nav-home',
        '/list': 'nav-cart',   // ← le badge reste sur l'onglet panier/liste
        '/orders': 'nav-orders',
    };

    let activeId = 'nav-home';
    if (path.startsWith('/product')) {
        activeId = 'nav-products';
    } else if (path.startsWith('/order')) {
        activeId = 'nav-orders';
    } else {
        activeId = map[path] || 'nav-home';
    }

    const activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.classList.add('active');
}

function handleRoute() {
    try {
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');
        const match = path.match(/^\/product\/(.+)/);

        if (path === '/' || path === '/home') {
            renderHomePage();
        } else if (match) {
            renderProductPage(match[1]);
        } else if (path === '/list' || path === '/cart') {   // compatibilité
            renderCartPage();   // qui affiche maintenant la liste
        } else if (path === '/checkout') {
            // rediriger vers la liste ou WhatsApp
            renderCartPage();
        } else if (path === '/orders') {
            renderOrdersPage();
        } else if (path === '/profile') {
            renderProfilePage();
        } else if (path === '/login') {
            renderLoginPage();
        } else if (path === '/register') {
            renderRegisterPage();
        } else if (path.match(/^\/order\/(.+)/)) {
            const orderId = path.split('/')[2];
            renderOrderDetail(orderId);
        } else if (path === '/about') {
            renderAboutPage();
        } else if (path === '/contact') {
            renderContactPage();
        } else if (path === '/track') {
            renderTrackOrderPage();
        } else if (path === '/compare') {
            renderComparePage();
        } else if (path === '/wishlist') {
            renderWishlistPage();
        } else if (path === '/blog') {
            renderBlogPage();
        } else {
            document.getElementById('app').innerHTML = '<div class="container"><h2>Page non trouvée</h2></div>';
        }

        updateListCount(); // remplace updateCartCount
        setActiveNav(path);
    } catch (error) {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="container" style="margin-top:2rem; padding:1rem; background:#fff3cd; border:1px solid #ffc107; border-radius:8px;">
                    <h2 style="color:#856404;">❌ Erreur de rendu</h2>
                    <p><strong>Message :</strong> ${error.message}</p>
                    <pre style="background:#f8f9fa; padding:0.5rem; border-radius:4px; overflow-x:auto;">${error.stack}</pre>
                </div>
            `;
        }
    }
}

// Garder la fonction checkAbandonedCart mais sans effet pour l'instant
function checkAbandonedCart() {}
