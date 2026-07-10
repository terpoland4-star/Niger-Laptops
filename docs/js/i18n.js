// ==========================================
// i18n.js – Internationalisation dynamique (sans reload)
// ==========================================

const TRANSLATIONS = {
    fr: {
        siteName: 'Niger Laptops',
        tagline: 'Ordinateurs portables & accessoires à Niamey. Livraison rapide, paiement à la livraison.',
        home: 'Accueil',
        cart: 'Panier',
        orders: 'Commandes',
        profile: 'Profil',
        searchPlaceholder: 'Rechercher un produit...',
        addToCart: 'Ajouter au panier',
        emptyCart: 'Votre panier est vide',
        seeProducts: 'Voir les produits',
        back: '← Retour',
        backHome: '← Accueil',
        checkout: 'Finaliser la commande',
        subtotal: 'Sous-total',
        delivery: 'Livraison',
        free: 'Offerte',
        total: 'Total',
        order: 'Commander',
        confirmOrder: 'Confirmer la commande',
        paymentMethod: 'Mode de paiement',
        zamaniCash: 'Zamani Cash',
        airtelMoney: 'Airtel Money',
        mynita: 'MyNita',
        amanata: 'AmanaTa',
        card: '💳 Carte Bancaire',
        bankTransfer: '🏦 Virement Bancaire',
        cashOnDelivery: '💵 Paiement à la livraison',
        orderConfirmed: 'Commande confirmée !',
        myOrders: 'Mes commandes',
        noOrders: 'Aucune commande pour le moment.',
        loading: 'Chargement...',
        productNotFound: 'Produit introuvable',
        errorLoading: 'Erreur de chargement',
        stock: 'Stock',
        inStock: '✅ En stock',
        outOfStock: '❌ Rupture de stock',
        aboutTitle: 'À propos de Niger Laptops',
        aboutText1: 'Boutique en ligne spécialisée en informatique au Niger.',
        aboutText2: 'Livraison en 60 minutes dans Niamey.',
        valuesTitle: 'Nos valeurs',
        value1: '🛍️ Large choix',
        value2: '🚚 Livraison rapide',
        value3: '💳 Paiement mobile sécurisé',
        value4: '📞 Support réactif',
        contactTitle: 'Contact',
        contactDesc: 'Une question ? Écrivez-nous.',
        addressLabel: '📍 Adresse',
        address: 'Cité Sonuci, Niamey (Niger)',
        openMaps: '🗺️ Voir sur Google Maps',
        whatsappLabel: '📞 WhatsApp',
        emailLabel: '📧 Email',
        followUs: 'Suivez-nous',
        usefulLinks: 'Liens utiles',
        loginTitle: 'Connexion',
        phonePlaceholder: 'Téléphone',
        sendCode: 'Recevoir le code',
        verifyCode: 'Vérifier',
        codeSent: 'Code envoyé',
        invalidCode: 'Code invalide',
        enterPhone: 'Veuillez saisir votre numéro',
        logoutBtn: 'Déconnexion',
        profileTitle: '👤 Mon profil',
        namePlaceholder: 'Nom complet',
        addressPlaceholder: 'Adresse complète',
        phoneRequired: 'Téléphone (obligatoire)',
        orderDetails: 'Détails de la commande',
        status: 'Statut',
        articles: 'Articles',
        loginSuccess: 'Connexion réussie',
        addedToCart: 'Ajouté au panier',
        errorProduct: 'Erreur produit',
        noProducts: 'Aucun produit trouvé.',
        discount: '-{discount}%',
        developerTitle: 'Conçu par Hamadine AG MOCTAR',
        developerSub: 'Développeur Full Stack – HAM Global Words',
        developerAddress: '📍 Tchangarey, Niamey',
        devContact: '💡 Besoin d\'un site ? Contactez-moi !',
        emailPlaceholder: 'Email',
        passwordPlaceholder: 'Mot de passe',
        loginBtn: 'Se connecter',
        registerTitle: 'Créer un compte',
        registerBtn: 'S\'inscrire',
        fullnamePlaceholder: 'Nom complet',
        createAccount: 'Pas de compte ? S\'inscrire',
        registerSuccess: 'Compte créé avec succès !',
        emailAlreadyUsed: 'Cet email est déjà utilisé.',
        invalidCredentials: 'Email ou mot de passe incorrect.',
        accessibilityTitle: 'Accessibilité',
        highContrast: 'Contraste élevé',
        fontSize: 'Taille du texte',
        increase: 'Augmenter',
        decrease: 'Diminuer',
        resetAccessibility: 'Réinitialiser',
        installTitle: 'Ajouter à l\'écran d\'accueil',
        installSubtitle: 'Installez cette application pour une meilleure expérience',
        installBtn: 'Installer',
        later: 'Plus tard',
        iosInstallStep1: 'Appuyez sur Partager',
        iosInstallStep2: 'Sélectionnez "Sur l\'écran d\'accueil"',
        iosInstallStep3: 'Puis "Ajouter"',
        close: 'Fermer',
        newProducts: 'Produits neufs',
        usedProducts: 'Produits d\'occasion',
        messagePlaceholder: 'Votre message',
        sendMessage: 'Envoyer',
        kycTitle: 'Vérification d\'identité requise',
        kycDescription: 'Pour les commandes > 1 000 000 FCFA.',
        kycIdLabel: 'Pièce d\'identité',
        kycSelfieLabel: 'Selfie avec la pièce',
        kycSend: 'Envoyer pour vérification',
        kycCancel: 'Annuler',
        customerReviews: 'Avis clients',
        noReviews: 'Aucun avis pour le moment.',
        leaveReview: 'Laisser un avis',
        reviewCommentPlaceholder: 'Votre commentaire...',
        submitReview: 'Publier l\'avis',
        reviewSubmitted: 'Avis publié !',
        anonymous: 'Anonyme',
        trackOrderTitle: 'Suivi de commande',
        orderNumberPlaceholder: 'Numéro de commande',
        trackOrderBtn: 'Suivre',
        orderNotFoundTrack: 'Commande introuvable.',
        createdAt: 'Date',
        notificationsSubscribe: 'Activer les notifications',
    },
    en: {
        siteName: 'Niger Laptops',
        tagline: 'Laptops & accessories in Niamey. Fast delivery, cash on delivery.',
        home: 'Home',
        cart: 'Cart',
        orders: 'Orders',
        profile: 'Profile',
        searchPlaceholder: 'Search a product...',
        addToCart: 'Add to cart',
        emptyCart: 'Your cart is empty',
        seeProducts: 'See products',
        back: '← Back',
        backHome: '← Home',
        checkout: 'Checkout',
        subtotal: 'Subtotal',
        delivery: 'Delivery',
        free: 'Free',
        total: 'Total',
        order: 'Order',
        confirmOrder: 'Confirm order',
        paymentMethod: 'Payment method',
        zamaniCash: 'Zamani Cash',
        airtelMoney: 'Airtel Money',
        mynita: 'MyNita',
        amanata: 'AmanaTa',
        card: '💳 Credit Card',
        bankTransfer: '🏦 Bank Transfer',
        cashOnDelivery: '💵 Cash on Delivery',
        orderConfirmed: 'Order confirmed!',
        myOrders: 'My orders',
        noOrders: 'No orders yet.',
        loading: 'Loading...',
        productNotFound: 'Product not found',
        errorLoading: 'Error loading',
        stock: 'Stock',
        inStock: '✅ In stock',
        outOfStock: '❌ Out of stock',
        aboutTitle: 'About Niger Laptops',
        aboutText1: 'Online computer store in Niger.',
        aboutText2: 'Delivery within 60 minutes in Niamey.',
        valuesTitle: 'Our values',
        value1: '🛍️ Wide range',
        value2: '🚚 Fast delivery',
        value3: '💳 Secure mobile payment',
        value4: '📞 Reactive support',
        contactTitle: 'Contact',
        contactDesc: 'Have a question? Write to us.',
        addressLabel: '📍 Address',
        address: 'Cité Sonuci, Niamey (Niger)',
        openMaps: '🗺️ View on Google Maps',
        whatsappLabel: '📞 WhatsApp',
        emailLabel: '📧 Email',
        followUs: 'Follow us',
        usefulLinks: 'Useful links',
        loginTitle: 'Login',
        phonePlaceholder: 'Phone',
        sendCode: 'Send code',
        verifyCode: 'Verify',
        codeSent: 'Code sent',
        invalidCode: 'Invalid code',
        enterPhone: 'Please enter your number',
        logoutBtn: 'Logout',
        profileTitle: '👤 My profile',
        namePlaceholder: 'Full name',
        addressPlaceholder: 'Full address',
        phoneRequired: 'Phone (required)',
        orderDetails: 'Order details',
        status: 'Status',
        articles: 'Items',
        loginSuccess: 'Logged in',
        addedToCart: 'Added to cart',
        errorProduct: 'Product error',
        noProducts: 'No products found.',
        discount: '-{discount}%',
        developerTitle: 'Designed by Hamadine AG MOCTAR',
        developerSub: 'Full Stack Developer – HAM Global Words',
        developerAddress: '📍 Tchangarey, Niamey',
        devContact: '💡 Need a website? Contact me!',
        emailPlaceholder: 'Email',
        passwordPlaceholder: 'Password',
        loginBtn: 'Login',
        registerTitle: 'Create account',
        registerBtn: 'Sign up',
        fullnamePlaceholder: 'Full name',
        createAccount: 'No account? Sign up',
        registerSuccess: 'Account created!',
        emailAlreadyUsed: 'Email already used.',
        invalidCredentials: 'Invalid email or password.',
        accessibilityTitle: 'Accessibility',
        highContrast: 'High contrast',
        fontSize: 'Font size',
        increase: 'Increase',
        decrease: 'Decrease',
        resetAccessibility: 'Reset',
        installTitle: 'Add to Home Screen',
        installSubtitle: 'Install this app for a better experience',
        installBtn: 'Install',
        later: 'Later',
        iosInstallStep1: 'Tap Share',
        iosInstallStep2: 'Select "Add to Home Screen"',
        iosInstallStep3: 'Then "Add"',
        close: 'Close',
        newProducts: 'New products',
        usedProducts: 'Used products',
        messagePlaceholder: 'Your message',
        sendMessage: 'Send',
        kycTitle: 'Identity verification required',
        kycDescription: 'For orders over 1,000,000 FCFA.',
        kycIdLabel: 'ID document',
        kycSelfieLabel: 'Selfie with ID',
        kycSend: 'Submit for verification',
        kycCancel: 'Cancel',
        customerReviews: 'Customer reviews',
        noReviews: 'No reviews yet.',
        leaveReview: 'Leave a review',
        reviewCommentPlaceholder: 'Your comment...',
        submitReview: 'Submit review',
        reviewSubmitted: 'Review submitted!',
        anonymous: 'Anonymous',
        trackOrderTitle: 'Order tracking',
        orderNumberPlaceholder: 'Order number',
        trackOrderBtn: 'Track',
        orderNotFoundTrack: 'Order not found.',
        createdAt: 'Date',
        notificationsSubscribe: 'Enable notifications',
    }
};

let currentLang = localStorage.getItem('lang') || 'fr';

/**
 * Traduit une clé avec interpolation.
 */
function t(key, params = {}) {
    let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.fr[key] || key;
    Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
    });
    return text;
}

/**
 * Traduit une catégorie.
 */
function translateCategory(category) {
    const cats = {
        fr: { 'Ordinateurs': 'Ordinateurs', 'Stockage': 'Stockage', 'Accessoires': 'Accessoires' },
        en: { 'Ordinateurs': 'Laptops', 'Stockage': 'Storage', 'Accessoires': 'Accessories' }
    };
    return (cats[currentLang] && cats[currentLang][category]) || category;
}

/**
 * Retourne le produit localisé (nom, description).
 */
function getLocalizedProduct(product) {
    const lang = currentLang;
    return {
        ...product,
        name: product[`name_${lang}`] || product.name_fr || product.name,
        description: product[`description_${lang}`] || product.description_fr || product.description,
    };
}

/**
 * Change la langue sans recharger la page.
 */
function setLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('lang', lang);
    // Mise à jour des textes visibles via l'événement personnalisé
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    // Mise à jour du sélecteur
    const sel = document.getElementById('lang-selector');
    if (sel) sel.value = lang;
}

/**
 * Initialise le sélecteur de langue dans le menu.
 */
function initLanguage() {
    const sel = document.getElementById('lang-selector');
    if (!sel) return;
    sel.value = currentLang;
    sel.addEventListener('change', (e) => setLanguage(e.target.value));
}

// Écoute l'événement pour mettre à jour les composants (sera utilisé par les pages)
document.addEventListener('languageChanged', () => {
    // On relance le rendu de la page courante si une fonction de rendu existe
    if (typeof handleRoute === 'function') handleRoute();
});

/**
 * Génère le pied de page (inchangé, utilise `t()` qui prend la langue courante).
 */
function renderFooter() {
    const footer = document.getElementById('footer-app');
    if (!footer) return;
    footer.innerHTML = `
        <footer class="promo-footer" role="contentinfo">
            <div class="promo-footer-content">
                <div class="promo-left">
                    <h4 style="margin-bottom: 0.5rem; color: white;">
                        <img src="assets/images/logo/logolap.png" alt="Niger Laptops" style="height:24px; width:auto; vertical-align:middle; margin-right:8px;">
                        ${t('siteName')}
                    </h4>
                    <p style="margin-bottom: 0.5rem;">📍 ${t('address')}</p>
                    <a href="https://maps.app.goo.gl/AyfgGYvvXYMBTxBv8" target="_blank" rel="noopener" 
                       class="btn btn-outline btn-sm" style="color:white; border-color:white; margin-bottom:0.8rem;">
                        <i class="fas fa-map-marker-alt"></i> ${t('openMaps')}
                    </a>
                    <p style="margin-bottom: 0.5rem;">
                        <a href="https://wa.me/22791127870" target="_blank" rel="noopener" class="promo-link">
                            <img src="assets/images/logo/whatsapp.png" alt="WhatsApp" style="height:24px; vertical-align:middle;"> +227 91 12 78 70
                        </a>
                    </p>
                    <p style="margin-bottom: 0.5rem;">
                        <a href="mailto:zoubeirou.zakariya@gmail.com" class="promo-link">
                            <i class="fas fa-envelope"></i> zoubeirou.zakariya@gmail.com
                        </a>
                    </p>
                    <div class="useful-links" style="margin-top: 1rem;">
                        <h4 style="color: white; margin-bottom: 0.5rem;">🔗 ${t('usefulLinks')}</h4>
                        <a href="#/about" class="promo-link" style="display: block; margin-bottom: 0.3rem;">
                            <i class="fas fa-info-circle"></i> ${t('aboutTitle')}
                        </a>
                        <a href="#/contact" class="promo-link" style="display: block; margin-bottom: 0.3rem;">
                            <i class="fas fa-envelope"></i> ${t('contactTitle')}
                        </a>
                        <a href="#/orders" class="promo-link" style="display: block; margin-bottom: 0.3rem;">
                            <i class="fas fa-box"></i> ${t('myOrders')}
                        </a>
                        <a href="#/cart" class="promo-link" style="display: block; margin-bottom: 0.3rem;">
                            <i class="fas fa-shopping-cart"></i> ${t('cart')}
                        </a>
                    </div>
                    <div class="social-links" style="justify-content: flex-start; gap: 15px; font-size: 1.5rem; margin-top: 0.5rem;">
                        <span style="color: white; font-size: 0.9rem; margin-right: 0.5rem;">${t('followUs')}</span>
                        <a href="https://www.facebook.com/share/1DANxXYdTC/?mibextid=wwXIfr" target="_blank" rel="noopener" aria-label="Facebook">
                            <i class="fab fa-facebook"></i>
                        </a>
                    </div>
                </div>
                <div class="promo-right">
                    <img src="assets/images/logo/logoHAM.png" alt="HAM Global Words" style="height:50px; border-radius:50px; margin-bottom:1.5rem;">
                    <div class="promo-name">${t('developerTitle')}</div>
                    <div class="promo-title">${t('developerSub')}</div>
                    <div class="promo-location">${t('developerAddress')}</div>
                    <div style="margin-top: 0.8rem;">
                        <p class="promo-tagline">${t('devContact')}</p>
                        <a href="https://wa.me/22786762903" target="_blank" rel="noopener" class="promo-link">
                            <img src="assets/images/logo/whatsapp.png" style="height:24px; vertical-align:middle;"> +227 86 76 29 03
                        </a><br>
                        <a href="mailto:hamadineagmoctar@gmail.com" class="promo-link">
                            <i class="fas fa-envelope"></i> hamadineagmoctar@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    `;
}
