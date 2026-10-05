const MAX_PER_PAGE = 100;
const MAX_SEARCH_LENGTH = 100;
const ALLOWED_ORDER_BY = new Set(['date', 'id', 'title', 'slug', 'price', 'popularity']);
const ALLOWED_ORDER = new Set(['asc', 'desc']);

/**
 * Read-only Fourthwall catalog proxy.
 *
 * Fourthwall exposes each shop's public collection as JSON, so the catalog can
 * be rendered by Papelcool without putting an API key in the browser. Product
 * pages and checkout remain hosted by Fourthwall.
 */
export async function handleFourthwallProducts(request, env) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, { Allow: 'GET' });
  }

  const rawStoreUrl = String(env.FOURTHWALL_STORE_URL || '').trim();
  if (!rawStoreUrl) {
    return jsonResponse({
      error: 'Fourthwall store is not configured.',
      code: 'fourthwall_not_configured'
    }, 503);
  }

  let storeUrl;
  try {
    storeUrl = new URL(rawStoreUrl);
  } catch {
    return jsonResponse({
      error: 'Fourthwall store URL is invalid.',
      code: 'fourthwall_invalid_configuration'
    }, 503);
  }

  if (!['http:', 'https:'].includes(storeUrl.protocol)) {
    return jsonResponse({
      error: 'Fourthwall store URL must use HTTP or HTTPS.',
      code: 'fourthwall_invalid_configuration'
    }, 503);
  }

  storeUrl.search = '';
  storeUrl.hash = '';
  const collection = resolveCollection(env, new URL(request.url).searchParams);
  if (!collection) {
    return jsonResponse({
      error: 'Fourthwall collection is invalid.',
      code: 'fourthwall_invalid_configuration'
    }, 503);
  }

  const collectionUrl = new URL(
    `collections/${encodeURIComponent(collection)}.json`,
    `${stripTrailingSlash(storeUrl.toString())}/`
  );

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(collectionUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Papelcool Fourthwall Catalog/1.0'
      }
    });
  } catch {
    return jsonResponse({
      error: 'Unable to reach the Fourthwall store.',
      code: 'fourthwall_upstream_unreachable'
    }, 502);
  }

  if (!upstreamResponse.ok) {
    return jsonResponse({
      error: 'Fourthwall could not return the product catalog.',
      code: 'fourthwall_upstream_error'
    }, 502);
  }

  let payload;
  try {
    payload = await upstreamResponse.json();
  } catch {
    return jsonResponse({
      error: 'Fourthwall returned an invalid product catalog.',
      code: 'fourthwall_invalid_response'
    }, 502);
  }

  const rawProducts = Array.isArray(payload) ? payload : payload?.products;
  if (!Array.isArray(rawProducts)) {
    return jsonResponse({
      error: 'Fourthwall returned an invalid product catalog.',
      code: 'fourthwall_invalid_response'
    }, 502);
  }

  const params = new URL(request.url).searchParams;
  const search = String(params.get('search') || '').trim().slice(0, MAX_SEARCH_LENGTH).toLocaleLowerCase();
  const page = parsePositiveInteger(params.get('page'), 1, 10000);
  const perPage = parsePositiveInteger(params.get('per_page'), 24, MAX_PER_PAGE);
  const orderby = normalizeOrderBy(params.get('orderby'));
  const order = normalizeOrder(params.get('order'));
  const collectionTitle = normalizeText(payload?.title) || 'Papelcool';

  const filteredProducts = rawProducts
    .map((product) => normalizeProduct(product, storeUrl, collection, collectionTitle))
    .filter(Boolean)
    .filter((product) => !search || `${product.name} ${product.slug} ${collectionTitle}`.toLocaleLowerCase().includes(search));

  sortProducts(filteredProducts, orderby, order);

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;

  return jsonResponse({
    products: filteredProducts.slice(start, start + perPage),
    storeUrl: stripTrailingSlash(storeUrl.toString()),
    pagination: {
      page: safePage,
      perPage,
      total,
      totalPages
    }
  }, 200, {
    'Cache-Control': 'public, max-age=60, s-maxage=180',
    'X-Content-Type-Options': 'nosniff'
  });
}

function resolveCollection(env, params) {
  const collection = String(params.get('collection') || env.FOURTHWALL_COLLECTION || 'all').trim();
  return /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(collection) ? collection : '';
}

function normalizeOrderBy(value) {
  const orderby = String(value || 'date').toLowerCase();
  return ALLOWED_ORDER_BY.has(orderby) ? orderby : 'date';
}

function normalizeOrder(value) {
  const order = String(value || 'desc').toLowerCase();
  return ALLOWED_ORDER.has(order) ? order : 'desc';
}

function sortProducts(products, orderby, order) {
  const direction = order === 'asc' ? 1 : -1;
  products.sort((left, right) => {
    let comparison = 0;
    if (orderby === 'title' || orderby === 'slug') {
      comparison = (orderby === 'slug' ? left.slug : left.name).localeCompare(
        orderby === 'slug' ? right.slug : right.name,
        'es'
      );
    } else if (orderby === 'price') {
      comparison = Number(left.prices?.price || 0) - Number(right.prices?.price || 0);
    } else if (orderby === 'id') {
      comparison = String(left.id || '').localeCompare(String(right.id || ''));
    } else if (orderby === 'date' || orderby === 'popularity') {
      comparison = String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
    }

    return comparison === 0
      ? String(left.name || '').localeCompare(String(right.name || ''), 'es')
      : comparison * direction;
  });
}

function normalizeProduct(product, storeUrl, collection, collectionTitle) {
  if (!product || typeof product !== 'object') return null;

  const slug = normalizeText(product.handle || product.slug);
  const name = normalizeText(product.title || product.name) || 'Producto Papelcool';
  const fallbackPermalink = slug
    ? new URL(`products/${encodeURIComponent(slug)}`, `${stripTrailingSlash(storeUrl.toString())}/`).toString()
    : stripTrailingSlash(storeUrl.toString());
  const currentMinorPrice = getMinorPrice(product);
  const compareMinorPrice = toMinorUnits(product.compare_at_price);
  const currencyCode = getCurrencyCode(product);
  const hasSalePrice = compareMinorPrice !== null && currentMinorPrice !== null && compareMinorPrice > currentMinorPrice;

  return {
    id: normalizeText(product.id) || null,
    name,
    slug,
    permalink: normalizeHttpUrl(product.url || product.permalink, fallbackPermalink, storeUrl),
    shortDescription: normalizeText(product.description || product.short_description),
    images: product.image
      ? [{ src: normalizeHttpUrl(product.image, '', storeUrl), alt: name }].filter((image) => image.src)
      : Array.isArray(product.images)
        ? product.images.slice(0, 4).map((image) => ({
          src: normalizeHttpUrl(image?.src || image, '', storeUrl),
          alt: normalizeText(image?.alt) || name
        })).filter((image) => image.src)
        : [],
    prices: currentMinorPrice === null
      ? null
      : {
        price: String(currentMinorPrice),
        regularPrice: String(hasSalePrice ? compareMinorPrice : currentMinorPrice),
        salePrice: hasSalePrice ? String(currentMinorPrice) : '',
        currencyCode,
        currencyMinorUnit: 2,
        currencySymbol: ''
      },
    categories: [{ id: null, name: collectionTitle, slug: collection }],
    isInStock: product.available !== false,
    onSale: hasSalePrice,
    createdAt: normalizeText(product.created_at || product.createdAt),
    variants: Array.isArray(product.variants) ? product.variants.slice(0, 20) : []
  };
}

function getMinorPrice(product) {
  const variantPrice = product?.variants?.find((variant) => variant?.price?.cents !== undefined)?.price?.cents;
  if (Number.isFinite(Number(variantPrice))) return Math.round(Number(variantPrice));
  return toMinorUnits(product?.price);
}

function getCurrencyCode(product) {
  const variantCurrency = product?.variants?.find((variant) => variant?.price?.currency_iso)?.price?.currency_iso;
  return normalizeText(variantCurrency || product?.currency || 'USD').toUpperCase().slice(0, 3) || 'USD';
}

function toMinorUnits(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function normalizeText(value) {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  return decodeHtmlEntities(text).slice(0, 4000);
}

function decodeHtmlEntities(value) {
  return String(value || '').replace(/&(#x?[\da-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code) => {
    const namedEntities = {
      amp: '&',
      apos: "'",
      gt: '>',
      lt: '<',
      nbsp: ' ',
      quot: '"'
    };
    const named = namedEntities[String(code).toLowerCase()];
    if (named) return named;
    if (String(code).toLowerCase().startsWith('#x')) {
      const parsed = Number.parseInt(String(code).slice(2), 16);
      return Number.isInteger(parsed) && parsed >= 0 && parsed <= 0x10ffff
        ? String.fromCodePoint(parsed)
        : entity;
    }
    if (String(code).startsWith('#')) {
      const parsed = Number.parseInt(String(code).slice(1), 10);
      return Number.isInteger(parsed) && parsed >= 0 && parsed <= 0x10ffff
        ? String.fromCodePoint(parsed)
        : entity;
    }
    return entity;
  });
}

function normalizeHttpUrl(value, fallback, baseUrl) {
  try {
    const parsed = new URL(String(value || fallback), baseUrl);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function parsePositiveInteger(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function jsonResponse(payload, status, extraHeaders = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });

  return new Response(JSON.stringify(payload), { status, headers });
}
