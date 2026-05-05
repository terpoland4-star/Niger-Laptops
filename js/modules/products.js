import { escapeHtml, formatPrice, getRatingStars, PLACEHOLDER_IMAGE, handleImageError } from './utils.js';
import { addToCart } from './cart.js';
import { showToast, openModal, closeModal } from './ui.js';

let products = [];
let categories = [];
let currentPage = 1;
const productsPerPage = 8;
let filteredProducts = [];
let onProductsRender = null;

export function setProductsData(productsData, categoriesData) {
    products = productsData;
    categories = categoriesData;
}

export function setProductsRenderCallback(callback) {
    onProductsRender = callback;
}

// Rendu des catégories
export function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid || !categories.length) return;
    
    grid.innerHTML = categories.map(cat => `
        <div class="category-card" data-category="${escapeHtml(cat.name)}">
            <i class="${cat.icon}"></i>
            <h3>${escapeHtml(cat.name)}</h3>
            <p>${cat.count} produits</p>
        </div>
    `).join('');
    
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const catName = card.dataset.category;
            const catFilter = document.getElementById('categoryFilter');
            if (catFilter) {
                catFilter.value = catName;
                applyFilters();
            }
            // Naviguer vers page produits
            document.querySelector('[data-page="products"]')?.click();
        });
    });
}

// Rendu des produits vedettes
export function renderFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (!grid || !products.length) return;
    
    const featured = products.filter(p => p.featured === true);
    grid.innerHTML = renderProductCardsHTML(featured);
}

// Rendu d'une liste de produits (HTML)
export function renderProductCardsHTML(productList) {
    return productList.map((p, idx) => `
        <div class="product-card" data-aos="fade-up" data-aos-delay="${idx * 50}">
            ${p.badge ? `<div class="product-badge ${p.badge}">${p.badge === 'sale' ? 'PROMO' : 'NOUVEAU'}</div>` : ''}
            <div class="product-image">
                <img src="${p.image}" 
                     alt="${escapeHtml(p.name)}" 
                     loading="lazy"
                     onerror="this.src='${PLACEHOLDER_IMAGE}'">
            </div>
            <div class="product-info">
                <div class="product-title">${escapeHtml(p.name)}</div>
                <div class="product-category">${escapeHtml(p.category)}</div>
                <div class="product-rating">${getRatingStars(p.rating)}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(p.price)}</span>
                    ${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" data-id="${p.id}">
                        <i class="fas fa-cart-plus"></i> Ajouter
                    </button>
                    <button class="btn btn-outline view-product-btn" data-id="${p.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtres et tri
function getFilteredAndSorted() {
    let list = [...products];
    const catFilter = document.getElementById('categoryFilter')?.value || '';
    const minPrice = parseInt(document.getElementById('minPrice')?.value) || 0;
    const maxPriceInput = document.getElementById('maxPrice')?.value;
    const maxPrice = maxPriceInput ? parseInt(maxPriceInput) : Infinity;
    const sort = document.getElementById('sortBy')?.value || 'default';
    
    if (catFilter) list = list.filter(p => p.category === catFilter);
    list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    switch (sort) {
        case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
        case 'price-asc': list.sort((a, b) => a.price - b.price); break;
        case 'price-desc': list.sort((a, b) => b.price - a.price); break;
        case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    }
    return list;
}

function renderPagination(totalItems) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / productsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Précédent</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Suivant</button>`;
    container.innerHTML = html;
    
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                applyFilters();
            }
        });
    });
}

function renderProductsPage(list) {
    const grid = document.getElementById('allProductsGrid');
    const noResults = document.getElementById('noResultsMessage');
    
    if (!grid) return;
    
    if (list.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    const start = (currentPage - 1) * productsPerPage;
    const paginated = list.slice(start, start + productsPerPage);
    grid.innerHTML = renderProductCardsHTML(paginated);
    renderPagination(list.length);
}

export function applyFilters() {
    filteredProducts = getFilteredAndSorted();
    currentPage = 1;
    renderProductsPage(filteredProducts);
    if (onProductsRender) onProductsRender();
}

export function initProductsPage() {
    const catSelect = document.getElementById('categoryFilter');
    if (catSelect && products.length) {
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        catSelect.innerHTML = '<option value="">Toutes</option>' + 
            uniqueCategories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    
    document.getElementById('applyFiltersBtn')?.addEventListener('click', applyFilters);
    document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);
    document.getElementById('sortBy')?.addEventListener('change', applyFilters);
    
    applyFilters();
}

// Vue détaillée du produit
export function viewProduct(productId, showToastFn) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const content = document.getElementById('productDetailContent');
    if (!content) return;
    
    let specsHtml = '';
    if (product.specs) {
        specsHtml = `
            <div class="product-specs">
                <h4>Fiche technique</h4>
                <table class="specs-table">
                    ${Object.entries(product.specs).map(([key, val]) => `
                        <tr><th>${escapeHtml(key)}</th><td>${escapeHtml(String(val))}</td></tr>
                    `).join('')}
                </table>
            </div>
        `;
    }
    
    content.innerHTML = `
        <button class="modal-close" id="closeProductDetailModalInner">&times;</button>
        <h3>${escapeHtml(product.name)}</h3>
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1; text-align:center;">
                <img src="${product.image}" alt="${product.name}" style="max-width:100%;" onerror="this.src='${PLACEHOLDER_IMAGE}'">
            </div>
            <div style="flex:2;">
                <p>${escapeHtml(product.description)}</p>
                <p class="current-price" style="font-size:24px;">${formatPrice(product.price)}</p>
                <button class="btn btn-primary add-to-cart-detail" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Ajouter au panier
                </button>
            </div>
        </div>
        ${specsHtml}
    `;
    
    openModal('productDetailModal');
    
    document.getElementById('closeProductDetailModalInner')?.addEventListener('click', () => {
        closeModal('productDetailModal');
    });
    
    content.querySelector('.add-to-cart-detail')?.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        addToCart(id, products, showToastFn);
        closeModal('productDetailModal');
    });
}

// Écouter les clics sur les boutons produits
export function bindProductEvents(showToastFn) {
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            addToCart(parseInt(addBtn.dataset.id), products, showToastFn);
        }
        
        const viewBtn = e.target.closest('.view-product-btn');
        if (viewBtn) {
            e.preventDefault();
            viewProduct(parseInt(viewBtn.dataset.id), showToastFn);
        }
    });
}
