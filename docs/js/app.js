window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
    initTheme();       // ← Mode sombre
    initLanguage();    // ← Sélecteur de langue
    renderFooter();    // ← Pied de page multilingue
    await checkAuth();
    handleRoute();
});

function handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '');
    const match = path.match(/^\/product\/(.+)/);

    if (path === '/' || path === '/home') {
        renderHomePage();
    } else if (match) {
        renderProductPage(match[1]);
    } else if (path === '/cart') {
        renderCartPage();
    } else if (path === '/checkout') {
        renderCheckoutPage();
    } else if (path === '/orders') {
        renderOrdersPage();
    } else if (path === '/profile') {
        renderProfilePage();
    } else if (path === '/login') {
        renderLoginPage();
    } else if (path.match(/^\/order\/(.+)/)) {
        const orderId = path.split('/')[2];
        renderOrderDetail(orderId);
    } else if (path === '/about') {
        renderAboutPage();
    } else if (path === '/contact') {
        renderContactPage();
    } else {
        document.getElementById('app').innerHTML = '<div class="container"><h2>Page non trouvée</h2></div>';
    }
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', updateCartCount);
