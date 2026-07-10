// ==========================================
// api.js – Client API avec retry, timeout et fallback local
// ==========================================

const API_BASE = 'http://localhost:3000/api/v1';
const USE_LOCAL_DATA = true; // Mode démonstration
const REQUEST_TIMEOUT = 10000; // 10 secondes

/**
 * Effectue un appel API avec retry automatique et timeout.
 * @param {string} endpoint
 * @param {object} options - Options fetch
 * @param {number} retries - Nombre de tentatives restantes
 * @returns {Promise<any>}
 */
async function apiCall(endpoint, options = {}, retries = 2) {
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(API_BASE + endpoint, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = 'Erreur réseau';
            try {
                const err = await response.json();
                errorMessage = err.error || err.message || errorMessage;
            } catch (e) {
                // Réponse non JSON
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (retries > 0 && error.name !== 'AbortError') {
            console.warn(`Tentative échouée, nouvelle tentative dans ${(3 - retries) * 1000}ms...`);
            await new Promise(r => setTimeout(r, (3 - retries) * 1000));
            return apiCall(endpoint, options, retries - 1);
        }
        if (error.name === 'AbortError') {
            throw new Error('La requête a expiré');
        }
        throw error;
    }
}

// ===================== Auth (non utilisée en local) =====================
async function sendOTP(phone) {
    return apiCall('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
}
async function verifyOTP(phone, code, firstName, lastName) {
    return apiCall('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code, first_name: firstName, last_name: lastName }) });
}

// ===================== Produits =====================
async function getProducts(params = {}) {
    if (USE_LOCAL_DATA) return getLocalProducts(params);
    const query = new URLSearchParams(params).toString();
    return apiCall('/products?' + query);
}

async function getProduct(id) {
    if (USE_LOCAL_DATA) return getLocalProduct(id);
    return apiCall('/products/' + id);
}

function getLocalProducts(params = {}) {
    let products = [...demoData.products];
    if (params.search) {
        const q = params.search.toLowerCase();
        products = products.filter(p => {
            return (p.name_fr && p.name_fr.toLowerCase().includes(q)) ||
                   (p.name_en && p.name_en.toLowerCase().includes(q)) ||
                   (p.description_fr && p.description_fr.toLowerCase().includes(q)) ||
                   (p.description_en && p.description_en.toLowerCase().includes(q));
        });
    }
    return { data: products, pagination: { page: 1, totalPages: 1, total: products.length } };
}

function getLocalProduct(id) {
    const product = demoData.products.find(p => p.id === id);
    if (!product) throw new Error('Produit non trouvé');
    return {
        data: {
            ...product,
            compare_at_price: product.oldPrice,
            thumbnail: product.thumbnail,
            images: product.thumbnail ? [{ url: product.thumbnail, thumbnail: product.thumbnail }] : []
        }
    };
}

// ===================== Commandes (simulation locale) =====================
let localOrders = [];

async function createOrder(data) {
    if (USE_LOCAL_DATA) {
        const order = {
            id: 'local-' + Date.now(),
            order_number: 'NL-LOCAL-' + Date.now(),
            status: 'confirmed',
            payment_status: 'completed',
            total: data.items.reduce((sum, item) => {
                const product = demoData.products.find(p => p.id === item.product_id);
                return sum + (product ? product.price * item.quantity : 0);
            }, 0),
            items: data.items.map(item => {
                const product = demoData.products.find(p => p.id === item.product_id);
                return {
                    product_name: product ? getLocalizedProduct(product).name : 'Produit inconnu',
                    quantity: item.quantity,
                    total_price: product ? product.price * item.quantity : 0
                };
            }),
            created_at: new Date().toISOString()
        };
        localOrders.unshift(order);
        return { data: order };
    }
    return apiCall('/orders', { method: 'POST', body: JSON.stringify(data) });
}

async function getOrders() {
    if (USE_LOCAL_DATA) return { data: localOrders };
    return apiCall('/orders/my-orders');
}

async function getOrder(id) {
    if (USE_LOCAL_DATA) {
        const order = localOrders.find(o => o.id === id);
        if (!order) throw new Error('Commande non trouvée');
        return { data: order };
    }
    return apiCall('/orders/' + id);
}
