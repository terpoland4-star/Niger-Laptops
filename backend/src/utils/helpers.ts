import crypto from 'crypto';

// Générer un OTP à 6 chiffres
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Générer un numéro de commande (NL-YYYYMMDD-XXXX)
export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  return `NL-${year}${month}${day}-${random}`;
};

// Générer un SKU produit
export const generateSKU = (category: string, brand: string): string => {
  const catPrefix = category.substring(0, 3).toUpperCase();
  const brandPrefix = brand.substring(0, 3).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  return `${catPrefix}-${brandPrefix}-${random}`;
};

// Générer un slug à partir d'un nom
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
};

// Formater un prix en FCFA
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
};

// Calculer les frais de livraison selon la distance
export const calculateDeliveryFee = (distanceMeters: number): number => {
  if (distanceMeters <= 3000) return 1000;  // 3km
  if (distanceMeters <= 7000) return 1500;  // 7km
  if (distanceMeters <= 12000) return 2000; // 12km
  return 2500; // Au-delà
};

// Calculer le temps de livraison estimé
export const estimateDeliveryTime = (distanceMeters: number): string => {
  const minutes = Math.ceil(distanceMeters / 500); // ~500m/min en moto
  if (minutes <= 30) return '30 minutes';
  if (minutes <= 45) return '45 minutes';
  if (minutes <= 60) return '60 minutes';
  if (minutes <= 90) return '90 minutes';
  return '120 minutes';
};

// Valider un numéro de téléphone nigérien
export const isValidNigerPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^(\+227)?[89]\d{7}$/.test(cleaned);
};

// Normaliser un numéro de téléphone
export const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('00227')) cleaned = '+' + cleaned.substring(2);
  if (!cleaned.startsWith('+227') && cleaned.length === 8) {
    cleaned = '+227' + cleaned;
  }
  return cleaned;
};

// Pagination helper
export const getPaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

// Réponse paginée standard
export const paginatedResponse = (data: any[], total: number, page: number, limit: number) => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

// Réponse standard API
export const apiResponse = (data: any, message?: string) => {
  return {
    success: true,
    message: message || 'Opération réussie',
    data,
  };
};

// Nettoyer les entrées HTML
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Tronquer un texte
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
