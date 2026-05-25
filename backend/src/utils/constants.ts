// ==========================================
// CONSTANTES NIGER LAPTOPS – Méthodes de paiement étendues
// ==========================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_for_pickup', 'out_for_delivery', 'cancelled'],
  ready_for_pickup: ['delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: ['refunded'],
  refunded: [],
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Méthodes de paiement (ajoutez MyNita, AmanaTa, carte, virement)
export const PAYMENT_METHODS = {
  ORANGE_MONEY: 'orange_money',
  AIRTEL_MONEY: 'airtel_money',
  MYNITA: 'mynita',
  AMANATA: 'amanata',
  CARD: 'card',                    // Carte bancaire Visa / Mastercard
  BANK_TRANSFER: 'bank_transfer',  // Virement bancaire classique
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const;

export const DELIVERY_METHODS = {
  HOME_DELIVERY: 'home_delivery',
  PICKUP_POINT: 'pickup_point',
} as const;

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

export const PRODUCT_CATEGORIES = [
  { id: 'cartouches-toners', name: 'Cartouches & Toners', icon: 'print' },
  { id: 'cables-adaptateurs', name: 'Câbles & Adaptateurs', icon: 'cable' },
  { id: 'stockage-memoire', name: 'Stockage & Mémoire', icon: 'sd_storage' },
  { id: 'accessoires-pc', name: 'Accessoires PC', icon: 'keyboard' },
  { id: 'reseau-connectique', name: 'Réseau & Connectique', icon: 'router' },
  { id: 'audio-visioconference', name: 'Audio & Visio', icon: 'headphones' },
  { id: 'batteries-alimentation', name: 'Batteries & Alimentation', icon: 'battery_charging_full' },
];

export const DELIVERY_ZONES = [
  { commune: 'Niamey I', areas: ['Plateau', 'Yantala', 'Grande Mosquée'] },
  { commune: 'Niamey II', areas: ['Cité Député', 'Banizoumbou', 'Dar Es Salam'] },
  { commune: 'Niamey III', areas: ['Cité Fayçal', 'Koubia', 'Bobiel'] },
  { commune: 'Niamey IV', areas: ['Cité Château', 'Talladjé', 'Aéroport'] },
  { commune: 'Niamey V', areas: ['Wadata', 'Karadjé', 'Lazaret'] },
];

export const DEFAULT_DELIVERY_FEES = {
  SHORT: 1000,
  MEDIUM: 1500,
  LONG: 2000,
  EXTRA: 2500,
};

export const FREE_DELIVERY_THRESHOLD = 25000;

export const LIMITS = {
  MAX_ITEMS_PER_ORDER: 20,
  MAX_QUANTITY_PER_ITEM: 10,
  MAX_ADDRESSES_PER_CUSTOMER: 5,
  MAX_IMAGES_PER_PRODUCT: 8,
  MAX_IMAGE_SIZE_MB: 5,
  OTP_EXPIRY_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 5,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 30,
  CART_EXPIRY_HOURS: 24,
};

export const SMS_TEMPLATES = {
  OTP: (code: string) => `[Niger Laptops] Votre code de vérification est: ${code}. Valable 10 minutes.`,
  ORDER_CONFIRMED: (orderNumber: string) => `[Niger Laptops] Commande ${orderNumber} confirmée !`,
  ORDER_OUT_FOR_DELIVERY: (orderNumber: string) => `[Niger Laptops] Commande ${orderNumber} en cours de livraison.`,
  ORDER_DELIVERED: (orderNumber: string) => `[Niger Laptops] Commande ${orderNumber} livrée ! Merci.`,
};

export const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Produit non trouvé',
  PRODUCT_OUT_OF_STOCK: 'Produit en rupture de stock',
  ORDER_NOT_FOUND: 'Commande non trouvée',
  CUSTOMER_NOT_FOUND: 'Client non trouvé',
  INVALID_OTP: 'Code OTP invalide ou expiré',
  PHONE_ALREADY_EXISTS: 'Ce numéro est déjà utilisé',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  INVALID_CREDENTIALS: 'Identifiants invalides',
  INSUFFICIENT_STOCK: 'Stock insuffisant',
  PAYMENT_FAILED: 'Le paiement a échoué',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Action interdite',
};
