const API_BASE = 'http://localhost:3000/api/v1'; // À modifier selon votre serveur

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(API_BASE + endpoint, { ...options, headers });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur réseau');
    }
    return response.json();
}

// Auth
async function sendOTP(phone) {
    return apiCall('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
}
async function verifyOTP(phone, code, firstName, lastName) {
    return apiCall('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code, first_name: firstName, last_name: lastName }) });
}
async function logout() {
    try { await apiCall('/auth/logout', { method: 'POST' }); } catch(e) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigateTo('/login');
}

// Produits
async function getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiCall('/products?' + query);
}
async function getProduct(id) {
    return apiCall('/products/' + id);
}

// Commandes
async function createOrder(data) {
    return apiCall('/orders', { method: 'POST', body: JSON.stringify(data) });
}
async function getOrders() {
    return apiCall('/orders/my-orders');
}
async function getOrder(id) {
    return apiCall('/orders/' + id);
}

// Paiement (inclut toutes les méthodes)
async function initiatePayment(orderId, phone, method) {
    return apiCall('/payments/initiate', { method: 'POST', body: JSON.stringify({ order_id: orderId, phone, method }) });
}
