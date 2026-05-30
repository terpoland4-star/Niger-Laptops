// ==========================================
// payments.js – Gestion centralisée des paiements
// Méthodes acceptées :
//   zamani_cash, airtel_money, mynita, amanata, card, bank_transfer, cash_on_delivery
// ==========================================

const PAYMENT_METHODS = {
  ZAMANI_CASH: 'zamani_cash',
  AIRTEL_MONEY: 'airtel_money',
  MYNITA: 'mynita',
  AMANATA: 'amanata',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  CASH_ON_DELIVERY: 'cash_on_delivery',
};

/**
 * Initie un paiement pour une commande donnée.
 * @param {string} orderId - L'identifiant de la commande.
 * @param {string} phone - Numéro de téléphone du client (requis pour les paiements mobiles).
 * @param {string} method - Méthode de paiement (doit correspondre à une des clés de PAYMENT_METHODS).
 * @returns {Promise<{success: boolean, gatewayReference?: string, message?: string}>}
 */
async function initiatePayment(orderId, phone, method) {
  // Paiement à la livraison : rien à faire
  if (method === PAYMENT_METHODS.CASH_ON_DELIVERY) {
    return { success: true, message: 'Paiement à la livraison' };
  }

  // Mode local (démonstration) – simule un paiement réussi
  if (typeof USE_LOCAL_DATA !== 'undefined' && USE_LOCAL_DATA) {
    console.log(`🧪 [DEMO] Paiement ${method} simulé pour la commande ${orderId}`);
    return {
      success: true,
      gatewayReference: `${method.toUpperCase()}-DEMO-${Date.now()}`,
      message: `Paiement ${method} simulé réussi`,
    };
  }

  // Mode production : appel à l'API backend
  try {
    // apiCall est définie dans api.js
    return await apiCall('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, phone, method }),
    });
  } catch (error) {
    console.error('Erreur paiement:', error);
    throw new Error(error.message || 'Le paiement a échoué');
  }
}

/**
 * Vérifie le statut d'un paiement.
 * @param {string} orderId - L'identifiant de la commande.
 * @returns {Promise<{status: string, message?: string}>}
 */
async function checkPaymentStatus(orderId) {
  if (typeof USE_LOCAL_DATA !== 'undefined' && USE_LOCAL_DATA) {
    return { status: 'completed' };
  }

  try {
    const res = await apiCall(`/payments/status/${orderId}`);
    return res.data;
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Retourne les coordonnées bancaires pour le virement (affichage informatif).
 * @returns {{bankName: string, accountNumber: string, accountName: string, swift: string, message: string}}
 */
function getBankDetails() {
  return {
    bankName: 'Bank of Africa (BOA)',
    accountNumber: '0123456789',
    accountName: 'Niger Laptops',
    swift: 'BOANENIXXXX',
    message: 'Veuillez effectuer le virement vers ce compte en indiquant le numéro de commande comme référence.',
  };
}
