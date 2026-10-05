(() => {
    const FOURTHWALL_FAVORITES_KEY = 'papelcool:fourthwall-favorites:v1';
    const PREMIUM_PRESET_NAMES = new Set([
        'Villamil-faltastu',
        'Villamil-faltastu-guitarra',
        'Simon-faltastu',
        'Simon-faltastu-bajo',
        'Martin-faltastu',
        'Martin-faltastu-bateria',
        'Isaza-faltastu',
        'Isaza-faltastu-guitarra',
        'Mira',
        'Rumi',
        'Zoey',
        'Jinu',
        'Abby',
        'Romance',
        'Mystery',
        'Baby'
    ]);
    const PRESET_CATEGORY_LABELS = Object.freeze({
        'gorilla-tag': 'Gorilla Tag',
        miraculous: 'Miraculous',
        camilo: 'Camilo',
        morat: 'Morat',
        kpop: 'K-Pop Demon Hunters',
        minecraft: 'Minecraft'
    });

    const state = {
        hasLoaded: false,
        loading: false,
        requestId: 0,
        page: 1,
        perPage: 24,
        search: '',
        orderby: 'date',
        order: 'desc',
        products: [],
        totalPages: 1,
        storeUrl: '',
        catalogMode: 'fourthwall'
    };

    let searchTimer = null;
    let initialized = false;
    let reloadAfterCurrentRequest = false;

    function getElements() {
        return {
            view: document.getElementById('fourthwall-shop-view'),
            grid: document.getElementById('fourthwall-product-grid'),
            status: document.getElementById('fourthwall-catalog-status'),
            search: document.getElementById('fourthwall-product-search'),
            order: document.getElementById('fourthwall-product-order'),
            storeLink: document.getElementById('fourthwall-store-link'),
            pagination: document.getElementById('fourthwall-pagination'),
            previous: document.getElementById('fourthwall-page-previous'),
            next: document.getElementById('fourthwall-page-next'),
            pageLabel: document.getElementById('fourthwall-page-label')
        };
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character]));
    }

    function stripHtml(value) {
        return String(value ?? '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 170);
    }

    function safeHttpUrl(value, fallback = '#') {
        const rawValue = String(value || fallback || '').trim();
        if (!rawValue) return '';
        try {
            const url = new URL(rawValue, window.location.origin);
            return ['http:', 'https:'].includes(url.protocol) ? url.toString() : fallback;
        } catch {
            return fallback;
        }
    }

    function formatPriceValue(value, prices) {
        const amountInMinorUnits = Number(value);
        if (!Number.isFinite(amountInMinorUnits)) return '';

        const minorUnit = Math.min(4, Math.max(0, Number(prices?.currencyMinorUnit) || 2));
        const amount = amountInMinorUnits / (10 ** minorUnit);
        const currencyCode = String(prices?.currencyCode || '').toUpperCase();
        const symbol = prices?.currencySymbol || '';
        const prefix = prices?.currencyPrefix || symbol;
        const suffix = prices?.currencySuffix || '';

        if (prefix || suffix) {
            return `${prefix}${amount.toFixed(minorUnit)}${suffix}`.trim();
        }

        if (currencyCode) {
            try {
                return new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: currencyCode,
                    minimumFractionDigits: minorUnit,
                    maximumFractionDigits: minorUnit
                }).format(amount);
            } catch {
                // Fall through to the store-provided symbol for non-standard currencies.
            }
        }

        return `${prefix}${amount.toFixed(minorUnit)}${suffix}`.trim();
    }

    function getPriceMarkup(product) {
        const prices = product?.prices;
        if (!prices?.price) return '<span class="fourthwall-product-price">Consultar precio</span>';

        const currentPrice = formatPriceValue(prices.price, prices);
        const regularPrice = prices.regularPrice && prices.regularPrice !== prices.price
            ? formatPriceValue(prices.regularPrice, prices)
            : '';

        return `
            <span class="fourthwall-product-price">${escapeHtml(currentPrice)}</span>
            ${regularPrice ? `<span class="fourthwall-product-price--regular">${escapeHtml(regularPrice)}</span>` : ''}
        `;
    }

    function getCategoryLabel(product) {
        return product?.categories?.[0]?.name || 'Papelcool';
    }

    function getProductKey(product) {
        return String(product?.id || product?.slug || product?.name || '').trim();
    }

    function getFourthwallFavoriteKeys() {
        try {
            const stored = JSON.parse(localStorage.getItem(FOURTHWALL_FAVORITES_KEY) || '[]');
            return Array.isArray(stored) ? [...new Set(stored.map(String).filter(Boolean))] : [];
        } catch {
            return [];
        }
    }

    function saveFourthwallFavoriteKeys(keys) {
        try {
            localStorage.setItem(FOURTHWALL_FAVORITES_KEY, JSON.stringify([...new Set(keys)]));
        } catch {}
    }

    function toggleFourthwallFavorite(productKey, button) {
        const key = String(productKey || '').trim();
        if (!key) return;

        const favorites = getFourthwallFavoriteKeys();
        const isFavorite = favorites.includes(key);
        const nextFavorites = isFavorite
            ? favorites.filter((favoriteKey) => favoriteKey !== key)
            : [...favorites, key];
        saveFourthwallFavoriteKeys(nextFavorites);

        if (button) {
            button.classList.toggle('active', !isFavorite);
            button.setAttribute('aria-pressed', String(!isFavorite));
            button.setAttribute('aria-label', !isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos');
        }
    }

    function getLocalPresetProducts() {
        const catalog = Array.isArray(window.papelcoolPresetCatalog)
            ? window.papelcoolPresetCatalog
            : [];

        const products = catalog.map((preset) => {
            const slug = String(preset?.name || '').trim();
            if (!slug) return null;

            const isPremium = PREMIUM_PRESET_NAMES.has(slug);
            const price = isPremium ? '500' : '0';
            const previewUrl = new URL('/', window.location.origin);
            previewUrl.searchParams.set('view', 'preset-preview');
            previewUrl.searchParams.set('preset', slug);

            return {
                id: `preset-${slug}`,
                name: String(preset?.displayName || slug),
                slug,
                permalink: previewUrl.toString(),
                shortDescription: preset?.has3dModel
                    ? 'Personaje 3D para explorar y personalizar en Papelcool.'
                    : 'Plantilla PDF imprimible de Papelcool.',
                images: preset?.icon
                    ? [{ src: String(preset.icon), alt: String(preset?.displayName || slug) }]
                    : [],
                prices: {
                    price,
                    regularPrice: price,
                    salePrice: '',
                    currencyCode: 'USD',
                    currencyMinorUnit: 2,
                    currencySymbol: '$'
                },
                categories: [{
                    id: null,
                    name: PRESET_CATEGORY_LABELS[preset?.fandom] || 'Papelcool',
                    slug: String(preset?.fandom || 'papelcool')
                }],
                isInStock: true,
                onSale: false,
                source: 'preset-catalog'
            };
        }).filter(Boolean);

        const searchTerm = state.search.toLocaleLowerCase();
        const filteredProducts = searchTerm
            ? products.filter((product) => `${product.name} ${getCategoryLabel(product)}`.toLocaleLowerCase().includes(searchTerm))
            : products;

        return filteredProducts.sort((left, right) => {
            const leftName = left.name.toLocaleLowerCase();
            const rightName = right.name.toLocaleLowerCase();
            const nameOrder = leftName.localeCompare(rightName, 'es');
            if (state.orderby === 'title') return state.order === 'asc' ? nameOrder : -nameOrder;
            if (state.orderby === 'price') {
                const priceOrder = Number(left.prices.price) - Number(right.prices.price);
                return state.order === 'asc' ? priceOrder : -priceOrder;
            }
            return 0;
        });
    }

    function getProductMarkup(product) {
        const productKey = getProductKey(product);
        const image = product?.images?.[0];
        const imageUrl = image?.src ? safeHttpUrl(image.src, '') : '';
        const imageMarkup = imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.alt || product.name)}" loading="lazy" decoding="async">`
            : `<span class="preset-icon-placeholder preset-icon-placeholder--fandom">${escapeHtml(product.name || 'Sin imagen')}</span>`;
        const productUrl = safeHttpUrl(product.permalink, state.storeUrl || '#');
        const isFavorite = getFourthwallFavoriteKeys().includes(productKey);
        const productLinkAria = state.catalogMode === 'local'
            ? `Abrir ${product.name} en Papelcool`
            : `Ver ${product.name} en la tienda`;
        const stockLabel = product.isInStock ? '' : ' · Agotado';
        const priceMarkup = getPriceMarkup(product);

        return `
            <div class="fandom-card fourthwall-product-card" data-fourthwall-product="${escapeHtml(productKey)}" data-product-url="${escapeHtml(productUrl)}" tabindex="0" role="link" aria-label="${escapeHtml(productLinkAria)}">
                <button type="button" class="fandom-heart material-symbols-outlined ${isFavorite ? 'active' : ''}" data-fourthwall-favorite="${escapeHtml(productKey)}" aria-label="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}" aria-pressed="${isFavorite}">star</button>
                <div class="fandom-image-container">
                    ${imageMarkup}
                </div>
                <div class="fandom-info">
                    <div class="fandom-meta-row">
                        <span class="fandom-tag">${escapeHtml(getCategoryLabel(product))}</span>
                        <span class="fandom-like-count" aria-label="0 likes${escapeHtml(stockLabel)}">
                            <span class="material-symbols-outlined" aria-hidden="true">favorite</span>
                            <span>0</span>
                        </span>
                    </div>
                    <h3 class="fandom-name">${escapeHtml(product.name || 'Producto Papelcool')}</h3>
                    <span class="fandom-price-tag">${priceMarkup}</span>
                    <button type="button" class="fandom-select-btn">Continuar</button>
                </div>
            </div>
        `;
    }

    function setStatus(message, tone = 'normal') {
        const { status } = getElements();
        if (!status) return;
        status.dataset.tone = tone;
        status.textContent = message;
    }

    function renderError(message, code = '') {
        const { grid, pagination, status } = getElements();
        if (grid) grid.innerHTML = '';
        if (pagination) pagination.hidden = true;
        if (!status) return;

        const isConfigurationError = code === 'fourthwall_not_configured'
            || code === 'fourthwall_invalid_configuration';
        status.dataset.tone = isConfigurationError ? 'configuration' : 'error';
        status.innerHTML = `
            <span>${escapeHtml(isConfigurationError
                ? 'Conecta tu tienda Fourthwall para mostrar el catálogo aquí.'
                : (message || 'No hemos podido cargar el catálogo ahora mismo.'))}</span>
            <button type="button" class="fourthwall-retry-button" id="fourthwall-retry-button">Reintentar</button>
        `;
        document.getElementById('fourthwall-retry-button')?.addEventListener('click', () => loadProducts());
    }

    function renderProducts() {
        const { grid, pagination, previous, next, pageLabel, status } = getElements();
        if (!grid) return;

        if (!state.products.length) {
            grid.innerHTML = '';
            if (pagination) pagination.hidden = true;
            setStatus(state.search ? 'No encontramos productos con esa búsqueda.' : 'Todavía no hay productos publicados en la tienda.', 'empty');
            return;
        }

        grid.innerHTML = state.products.map(getProductMarkup).join('');
        if (status) {
            if (state.catalogMode === 'local') {
                status.dataset.tone = 'local';
                status.textContent = `${state.products.length} productos del catálogo Papelcool · Conecta Fourthwall para activar la compra y YouTube Shopping.`;
            } else {
                status.dataset.tone = 'normal';
                status.textContent = `${state.products.length} producto${state.products.length === 1 ? '' : 's'} disponibles`;
            }
        }

        const hasPagination = state.totalPages > 1;
        if (pagination) pagination.hidden = !hasPagination;
        if (previous) {
            previous.disabled = state.page <= 1;
            previous.setAttribute('aria-disabled', String(previous.disabled));
        }
        if (next) {
            next.disabled = state.page >= state.totalPages;
            next.setAttribute('aria-disabled', String(next.disabled));
        }
        if (pageLabel) pageLabel.textContent = `Página ${state.page} de ${state.totalPages}`;
    }

    function updateStoreLink(storeUrl) {
        const { storeLink } = getElements();
        if (!storeLink) return;
        const safeUrl = safeHttpUrl(storeUrl, '');
        if (!safeUrl) {
            state.storeUrl = '';
            storeLink.hidden = true;
            return;
        }
        state.storeUrl = safeUrl;
        storeLink.href = safeUrl;
        storeLink.hidden = false;
    }

    async function loadProducts(options = {}) {
        const { resetPage = false } = options;
        if (resetPage) state.page = 1;
        if (state.loading) {
            reloadAfterCurrentRequest = true;
            return;
        }

        const { grid } = getElements();
        const requestId = ++state.requestId;
        state.loading = true;
        setStatus('Cargando catálogo…', 'loading');
        if (grid && !state.hasLoaded) grid.innerHTML = '';

        const url = new URL('/api/fourthwall/products', window.location.origin);
        url.searchParams.set('page', String(state.page));
        url.searchParams.set('per_page', String(state.perPage));
        url.searchParams.set('orderby', state.orderby);
        url.searchParams.set('order', state.order);
        if (state.search) url.searchParams.set('search', state.search);

        try {
            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            const payload = await response.json().catch(() => ({}));
            if (requestId !== state.requestId) return;
            if (!response.ok) {
                if (payload.code === 'fourthwall_not_configured') {
                    const localProducts = getLocalPresetProducts();
                    const hasLocalCatalog = Array.isArray(window.papelcoolPresetCatalog)
                        && window.papelcoolPresetCatalog.length > 0;
                    if (hasLocalCatalog) {
                        state.products = localProducts;
                        state.totalPages = 1;
                        state.page = 1;
                        state.catalogMode = 'local';
                        state.hasLoaded = true;
                        updateStoreLink('');
                        renderProducts();
                        return;
                    }
                }
                state.catalogMode = 'fourthwall';
                renderError(payload.error, payload.code);
                return;
            }

            state.products = Array.isArray(payload.products) ? payload.products : [];
            state.totalPages = Math.max(1, Number(payload.pagination?.totalPages) || 1);
            state.page = Math.min(state.page, state.totalPages);
            state.hasLoaded = true;
            state.catalogMode = 'fourthwall';
            updateStoreLink(payload.storeUrl);
            renderProducts();
        } catch {
            state.catalogMode = 'fourthwall';
            if (requestId === state.requestId) renderError('No hemos podido conectar con la tienda Fourthwall.');
        } finally {
            if (requestId === state.requestId) state.loading = false;
            if (requestId === state.requestId && reloadAfterCurrentRequest) {
                reloadAfterCurrentRequest = false;
                loadProducts({ resetPage: true });
            }
        }
    }

    function trackProductClick(productKey) {
        if (typeof window.gtag !== 'function') return;
        const product = state.products.find((item) => String(item.id || item.slug) === String(productKey));
        if (!product) return;
        window.gtag('event', 'select_item', {
            item_list_name: 'Papelcool Fourthwall',
            items: [{
                item_id: String(product.id || product.slug || ''),
                item_name: product.name || ''
            }]
        });
    }

    function init() {
        if (initialized || !document.getElementById('fourthwall-shop-view')) return;
        initialized = true;
        const { search, order, previous, next, grid } = getElements();

        search?.addEventListener('input', () => {
            state.search = search.value.trim().slice(0, 100);
            window.clearTimeout(searchTimer);
            searchTimer = window.setTimeout(() => loadProducts({ resetPage: true }), 300);
        });

        order?.addEventListener('change', () => {
            const [orderby, nextOrder] = String(order.value || 'date-desc').split('-');
            state.orderby = orderby;
            state.order = nextOrder || 'desc';
            loadProducts({ resetPage: true });
        });

        previous?.addEventListener('click', () => {
            if (state.page <= 1) return;
            state.page -= 1;
            loadProducts();
        });

        next?.addEventListener('click', () => {
            if (state.page >= state.totalPages) return;
            state.page += 1;
            loadProducts();
        });

        grid?.addEventListener('click', (event) => {
            const favoriteButton = event.target.closest('[data-fourthwall-favorite]');
            if (favoriteButton) {
                event.stopPropagation();
                toggleFourthwallFavorite(favoriteButton.dataset.fourthwallFavorite, favoriteButton);
                return;
            }

            const selectButton = event.target.closest('.fandom-select-btn');
            if (selectButton) {
                event.stopPropagation();
                const buttonCard = selectButton.closest('[data-fourthwall-product]');
                const buttonProductKey = buttonCard?.dataset.fourthwallProduct;
                const buttonProduct = state.products.find((item) => getProductKey(item) === buttonProductKey);
                if (!buttonProduct) return;
                trackProductClick(buttonProductKey);
                const buttonProductUrl = safeHttpUrl(buttonProduct.permalink, state.storeUrl || '#');
                if (buttonProductUrl && buttonProductUrl !== '#') {
                    window.open(buttonProductUrl, '_blank', 'noopener,noreferrer');
                }
                return;
            }

            const card = event.target.closest('[data-fourthwall-product]');
            if (!card || event.target.closest('button')) return;
            const productKey = card.dataset.fourthwallProduct;
            const product = state.products.find((item) => getProductKey(item) === productKey);
            if (!product) return;

            trackProductClick(productKey);
            const productUrl = safeHttpUrl(product.permalink, state.storeUrl || '#');
            if (productUrl && productUrl !== '#') {
                window.open(productUrl, '_blank', 'noopener,noreferrer');
            }
        });

        grid?.addEventListener('keydown', (event) => {
            if (!['Enter', ' '].includes(event.key)) return;
            const card = event.target.closest('[data-fourthwall-product]');
            if (!card || event.target.closest('button')) return;
            event.preventDefault();
            card.click();
        });
    }

    function open() {
        init();
        const { view } = getElements();
        if (view) {
            view.style.display = 'block';
            view.setAttribute('aria-hidden', 'false');
        }
        if (!state.hasLoaded && !state.loading) loadProducts();
    }

    function close() {
        const { view } = getElements();
        if (view) {
            view.style.display = 'none';
            view.setAttribute('aria-hidden', 'true');
        }
    }

    function setSearch(value) {
        const { search } = getElements();
        const nextSearch = String(value || '').trim().slice(0, 100);
        state.search = nextSearch;
        if (search && search.value !== nextSearch) search.value = nextSearch;
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => loadProducts({ resetPage: true }), 0);
    }

    window.papelcoolFourthwall = { init, open, close, refresh: () => loadProducts(), setSearch };
    document.addEventListener('DOMContentLoaded', init, { once: true });
})();
