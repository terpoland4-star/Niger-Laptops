window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
    initTheme();          // Mode sombre / clair
    initLanguage();       // Sélecteur de langue
    initAccessibilityControls(); // Contrôles d'accessibilité
    renderFooter();       // Pied de page multilingue
    await loadAllProducts(); // Précharger les produits pour la recherche
    await checkAuth();    // Vérifier si un utilisateur est connecté
    initInstallBanner();  // Bannière d'installation PWA
    handleRoute();        // Afficher la page correspondant à l'URL
});

function handleRoute() {
    try {
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
        } else if (path === '/register') {
            renderRegisterPage();
        } else if (path.match(/^\/order\/(.+)/)) {
            const orderId = path.split('/')[2];
            renderOrderDetail(orderId);
        } else if (path === '/about') {
            renderAboutPage();
        } else if (path === '/contact') {
            renderContactPage();
        } else if (path === '/track') {           // ← ajouté
            renderTrackOrderPage();
        } else {
            document.getElementById('app').innerHTML = '<div class="container"><h2>Page non trouvée</h2></div>';
        }
        updateCartCount();
    } catch (error) {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="container" style="margin-top:2rem; padding:1rem; background:#fff3cd; border:1px solid #ffc107; border-radius:8px;">
                    <h2 style="color:#856404;">❌ Erreur de rendu</h2>
                    <p><strong>Message :</strong> ${error.message}</p>
                    <p><strong>Fichier :</strong> app.js</p>
                    <pre style="background:#f8f9fa; padding:0.5rem; border-radius:4px; overflow-x:auto;">${error.stack}</pre>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', updateCartCount);
