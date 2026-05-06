/**
 * Niger Laptop - API Client
 * Communication avec le backend
 */

// Configuration de l'API (change l'URL si besoin)
const API_URL = 'https://niger-laptop-backend.onrender.com/api';

// Pour les tests en local, décommente la ligne ci-dessous et commente celle du dessus
// const API_URL = 'http://localhost:5000/api';

/**
 * Envoyer une commande au backend
 * @param {Object} orderData - Les données de la commande
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function submitOrder(orderData) {
    try {
        console.log('📦 Envoi de la commande au backend...', orderData);
        
        const response = await fetch(`${API_URL}/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        console.log('📦 Réponse du backend:', result);
        
        if (result.success) {
            // Stocker le numéro de commande
            localStorage.setItem('lastOrderNumber', result.orderNumber);
            return { 
                success: true, 
                orderNumber: result.orderNumber,
                message: result.message 
            };
        }
        
        return { 
            success: false, 
            error: result.error || 'Erreur inconnue' 
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de la commande:', error);
        return { 
            success: false, 
            error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' 
        };
    }
}

/**
 * Envoyer un message depuis le formulaire de contact
 * @param {Object} data - Les données du formulaire { name, email, phone, message }
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendContactMessage(data) {
    try {
        console.log('📧 Envoi du message de contact...', data);
        
        const response = await fetch(`${API_URL}/contact/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('📧 Réponse du backend:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message:', error);
        return { 
            success: false, 
            error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' 
        };
    }
}

/**
 * Vérifier le statut de l'API (health check)
 * @returns {Promise<Object>} Statut de l'API
 */
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const result = await response.json();
        return { success: true, status: result };
    } catch (error) {
        console.error('❌ API hors ligne:', error);
        return { success: false, error: error.message };
    }
}

// Exporter les fonctions pour les rendre disponibles globalement
window.submitOrder = submitOrder;
window.sendContactMessage = sendContactMessage;
window.checkApiHealth = checkApiHealth;
window.API_URL = API_URL;

console.log('🟢 API Client chargé - Backend:', API_URL);
