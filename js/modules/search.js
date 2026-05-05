import { formatPrice, escapeHtml } from './utils.js';
import { openModal, closeModal, showToast } from './ui.js';
import { viewProduct } from './products.js';

let products = [];

export function setSearchProducts(productsData) {
    products = productsData;
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const modal = document.getElementById('searchModal');
    const closeBtn = document.getElementById('searchModalClose');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    
    if (!searchBtn || !modal) return;
    
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('searchModal');
        input?.focus();
        if (input) input.value = '';
        if (results) results.innerHTML = '';
    });
    
    closeBtn?.addEventListener('click', () => closeModal('searchModal'));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal('searchModal'); });
    
    const performSearch = debounce((query) => {
        if (!results) return;
        if (query.length < 2) {
            results.innerHTML = '';
            return;
        }
        
        const res = products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query)
        );
        
        results.innerHTML = res.length ? res.map(p => `
            <div class="search-result-item" data-id="${p.id}">
                <span>${escapeHtml(p.name)}</span>
                <span class="search-result-price">${formatPrice(p.price)}</span>
            </div>
        `).join('') : '<div class="search-no-results">Aucun produit trouvé</div>';
    }, 300);
    
    input?.addEventListener('input', (e) => performSearch(e.target.value.trim().toLowerCase()));
    
    results?.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const id = parseInt(item.dataset.id);
        closeModal('searchModal');
        viewProduct(id, showToast);
    });
}
