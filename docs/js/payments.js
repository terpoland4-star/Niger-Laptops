// ==========================================
// payments.js – Gestion des paiements (avec validation)
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
 * Initie un paiement pour une commande.
 */
async function initiatePayment(orderId, phone, method) {
  // Vérifier le numéro pour les paiements mobiles
  if (['airtel_money', 'mynita', 'amanata', 'zamani_cash'].includes(method) && !isValidNigerPhone(phone)) {
    showToast('Numéro de téléphone invalide', 'error');
    throw new Error('Numéro invalide');
  }

  if (method === PAYMENT_METHODS.CASH_ON_DELIVERY) {
    return { success: true, message: 'Paiement à la livraison' };
  }

  if (typeof USE_LOCAL_DATA !== 'undefined' && USE_LOCAL_DATA) {
    console.log(`🧪 [DEMO] Paiement ${method} simulé pour la commande ${orderId}`);
    return {
      success: true,
      gatewayReference: `${method.toUpperCase()}-DEMO-${Date.now()}`,
      message: `Paiement ${method} simulé réussi`,
    };
  }

  try {
    return await apiCall('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, phone, method }),
    });
  } catch (error) {
    throw new Error(error.message || 'Le paiement a échoué');
  }
}

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

function getBankDetails() {
  return {
    bankName: 'Bank of Africa (BOA)',
    accountNumber: '0123456789',
    accountName: 'Niger Laptops',
    swift: 'BOANENIXXXX',
    message: 'Veuillez effectuer le virement avec la référence de commande.',
  };
}
