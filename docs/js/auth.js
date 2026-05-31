// ==========================================
// auth.js – Authentification par email / mot de passe
// ==========================================

let currentUser = null;

// Base d'utilisateurs simulée (mode local)
const DEMO_USERS = [
    { email: 'client@demo.com', password: '123456', full_name: 'Client Démo' },
    { email: 'admin@nigerlaptops.com', password: 'admin123', full_name: 'Administrateur' }
];

/**
 * Vérifie si l'utilisateur est connecté (token présent et valide).
 */
async function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token));
            currentUser = { id: payload.id, email: payload.email, full_name: payload.full_name };
            return true;
        } catch (e) {
            // Token invalide, on le supprime
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }
    return false;
}

/**
 * Inscription d'un nouvel utilisateur.
 * @param {string} email
 * @param {string} password
 * @param {string} full_name
 * @returns {object} L'utilisateur créé.
 */
function register(email, password, full_name) {
    if (DEMO_USERS.find(u => u.email === email)) {
        throw new Error(t('emailAlreadyUsed') || 'Cet email est déjà utilisé.');
    }
    DEMO_USERS.push({ email, password, full_name });
    const user = { id: 'demo-' + Date.now(), email, full_name };
    localStorage.setItem('access_token', btoa(JSON.stringify(user)));
    localStorage.setItem('refresh_token', 'demo_refresh');
    currentUser = user;
    return user;
}

/**
 * Connexion d'un utilisateur existant.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 */
async function handleLogin(email, password) {
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
        throw new Error(t('invalidCredentials') || 'Email ou mot de passe incorrect.');
    }
    const tokenPayload = { id: 'demo-' + Date.now(), email: user.email, full_name: user.full_name };
    localStorage.setItem('access_token', btoa(JSON.stringify(tokenPayload)));
    localStorage.setItem('refresh_token', 'demo_refresh');
    currentUser = { id: tokenPayload.id, email: user.email, full_name: user.full_name };
    showToast(t('loginSuccess'));
    navigateTo('/');
}

/**
 * Déconnexion.
 */
async function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    currentUser = null;
    navigateTo('/login');
}
