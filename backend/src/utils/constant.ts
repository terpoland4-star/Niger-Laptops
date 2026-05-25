// ==========================================
// CONSTANTES NIGER LAPTOPS
// ==========================================

// Statuts de commande
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

// Transitions valides de statuts
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

// Statuts de paiement
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Méthodes de paiement
export const PAYMENT_METHODS = {
  ORANGE_MONEY: 'orange_money',
  AIRTEL_MONEY: 'airtel_money',
  CASH_ON_DELIVERY: 'cash_on_delivery',
  BANK_TRANSFER: 'bank_transfer',
} as const;

// Méthodes de livraison
export const DELIVERY_METHODS = {
  HOME_DELIVERY: 'home_delivery',
  PICKUP_POINT: 'pickup_point',
} as const;

// Rôles admin
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

// Catégories de produits
export const PRODUCT_CATEGORIES = [
  { id: 'cartouches-toners', name: 'Cartouches & Toners', icon: 'print' },
  { id: 'cables-adaptateurs', name: 'Câbles & Adaptateurs', icon: 'cable' },
  { id: 'stockage-memoire', name: 'Stockage & Mémoire', icon: 'sd_storage' },
  { id: 'accessoires-pc', name: 'Accessoires PC', icon: 'keyboard' },
  { id: 'reseau-connectique', name: 'Réseau & Connectique', icon: 'router' },
  { id: 'audio-visioconference', name: 'Audio & Visio', icon: 'headphones' },
  { id: 'batteries-alimentation', name: 'Batteries & Alimentation', icon: 'battery_charging_full' },
];

// Zones de livraison à Niamey
export const DELIVERY_ZONES = [
  { commune: 'Niamey I', areas: ['Plateau', 'Yantala', 'Grande Mosquée'] },
  { commune: 'Niamey II', areas: ['Cité Député', 'Banizoumbou', 'Dar Es Salam'] },
  { commune: 'Niamey III', areas: ['Cité Fayçal', 'Koubia', 'Bobiel'] },
  { commune: 'Niamey IV', areas: ['Cité Château', 'Talladjé', 'Aéroport'] },
  { commune: 'Niamey V', areas: ['Wadata', 'Karadjé', 'Lazaret'] },
];

// Frais de livraison par défaut
export const DEFAULT_DELIVERY_FEES = {
  SHORT: 1000,   // 0-3km
  MEDIUM: 1500,  // 3-7km
  LONG: 2000,    // 7-12km
  EXTRA: 2500,   // 12km+
};

// Seuil livraison gratuite
export const FREE_DELIVERY_THRESHOLD = 25000; // FCFA

// Limites
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

// Messages SMS
export const SMS_TEMPLATES = {
  OTP: (code: string) => `[Niger Laptops] Votre code de vérification est: ${code}. Valable 10 minutes. Ne partagez jamais ce code.`,
  ORDER_CONFIRMED: (orderNumber: string) => `[Niger Laptops] Commande ${orderNumber} confirmée ! Nous préparons votre livraison. Suivez-la sur l'application.`,
  ORDER_OUT_FOR_DELIVERY: (orderNumber: string) => `[Niger Laptops] Votre commande ${orderNumber} est en cours de livraison. À bientôt !`,
  ORDER_DELIVERED: (orderNumber: string) => `[Niger Laptops] Commande ${orderNumber} livrée ! Merci pour votre confiance. Laissez-nous un avis ⭐`,
};

// Messages d'erreur courants
export const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Produit non trouvé',
  PRODUCT_OUT_OF_STOCK: 'Produit en rupture de stock',
  ORDER_NOT_FOUND: 'Commande non trouvée',
  CUSTOMER_NOT_FOUND: 'Client non trouvé',
  INVALID_OTP: 'Code OTP invalide ou expiré',
  PHONE_ALREADY_EXISTS: 'Ce numéro de téléphone est déjà utilisé',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  INVALID_CREDENTIALS: 'Identifiants invalides',
  INSUFFICIENT_STOCK: 'Stock insuffisant pour ce produit',
  PAYMENT_FAILED: 'Le paiement a échoué',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Action interdite',
};
