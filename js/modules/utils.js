// ========== UTILITAIRES ==========

// Protection XSS
export function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Formatage des prix
export function formatPrice(price) {
    return price.toLocaleString('fr-FR') + ' FCFA';
}

// Étoiles de notation
export function getRatingStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
    if (half) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < 5 - Math.ceil(rating); i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

// Placeholder intégré (DataURI)
export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='45%25' font-size='14' text-anchor='middle' fill='%23999'%3EImage non%3C/text%3E%3Ctext x='50%25' y='55%25' font-size='14' text-anchor='middle' fill='%23999'%3Edisponible%3C/text%3E%3C/svg%3E";

// Gestionnaire d'erreur d'image
export function handleImageError(img) {
    if (!img || img.src === PLACEHOLDER_IMAGE) return;
    img.src = PLACEHOLDER_IMAGE;
    img.classList.add('placeholder-img');
}
