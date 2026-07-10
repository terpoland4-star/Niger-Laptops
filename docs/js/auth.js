// ==========================================
// auth.js – Authentification sécurisée
// ==========================================

let currentUser = null;

// Utilisateurs démo avec mots de passe hachés (SHA-256)
const DEMO_USERS = [
    {
        email: 'client@demo.com',
        passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // '123456'
        full_name: 'Client Démo'
    },
    {
        email: 'admin@nigerlaptops.com',
        passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin123'
        full_name: 'Administrateur'
    }
];

/**
 * Hash une chaîne en SHA-256 (utilise Web Crypto API).
 */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie si l'utilisateur est connecté et que le token n'a pas expiré.
 */
async function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token));
            // Vérifier expiration (durée 24h)
            if (payload.exp && Date.now() > payload.exp) {
                throw new Error('Token expiré');
            }
            currentUser = { id: payload.id, email: payload.email, full_name: payload.full_name };
            return true;
        } catch (e) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }
    return false;
}

/**
 * Inscription avec hashage du mot de passe.
 */
async function register(email, password, full_name) {
    if (DEMO_USERS.find(u => u.email === email)) {
        throw new Error(t('emailAlreadyUsed'));
    }
    const hash = await sha256(password);
    DEMO_USERS.push({ email, passwordHash: hash, full_name });
    const user = { id: 'demo-' + Date.now(), email, full_name };
    const tokenPayload = { ...user, exp: Date.now() + 86400000 }; // 24h
    localStorage.setItem('access_token', btoa(JSON.stringify(tokenPayload)));
    localStorage.setItem('refresh_token', 'demo_refresh');
    currentUser = user;
    return user;
}

/**
 * Connexion avec vérification du hash.
 */
async function handleLogin(email, password) {
    const hash = await sha256(password);
    const user = DEMO_USERS.find(u => u.email === email && u.passwordHash === hash);
    if (!user) {
        throw new Error(t('invalidCredentials'));
    }
    const tokenPayload = { id: 'demo-' + Date.now(), email: user.email, full_name: user.full_name, exp: Date.now() + 86400000 };
    localStorage.setItem('access_token', btoa(JSON.stringify(tokenPayload)));
    localStorage.setItem('refresh_token', 'demo_refresh');
    currentUser = { id: tokenPayload.id, email: user.email, full_name: user.full_name };
    showToast(t('loginSuccess'), 'success');
    navigateTo('/');
}

/**
 * Déconnexion.
 */
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    currentUser = null;
    navigateTo('/login');
}

// Expositions globales pour compatibilité
window.register = register;
window.handleLogin = handleLogin;
window.logout = logout;
window.checkAuth = checkAuth;
