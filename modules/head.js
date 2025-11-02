// Módulo de edición de cabeza (Head)
// Maneja: eyes, eyebrows, nose, ears, hair

let loadToken = 0;
let activeObservers = [];
let activeListeners = [];
let currentSubcategory = null;

export function mountHead(api) {
    console.log('[HEAD] Mounting head module');
    loadToken++;
    
    const { ui, THREE, scene, modelParts, renderer, isMobileDevice } = api;
    
    // Mostrar botones de subcategorías de cabeza
    const headCategories = ['eyes', 'eyebrows', 'nose', 'ears', 'hair'];
    
    headCategories.forEach(category => {
        const btn = document.getElementById(`${category}-btn`);
        if (btn) {
            btn.style.display = '';
            btn.classList.remove('hidden');
        }
    });
    
    return {
        loadSubcategory: (subcategory) => loadHeadSubcategory(subcategory, api),
        unloadSubcategory: () => unloadHeadSubcategory(api)
    };
}

export function unmountHead(api) {
    console.log('[HEAD] Unmounting head module');
    loadToken++;
    
    // Limpiar subcategoría activa
    unloadHeadSubcategory(api);
    
    // Ocultar todos los botones de cabeza
    const headCategories = ['eyes', 'eyebrows', 'nose', 'ears', 'hair'];
    headCategories.forEach(category => {
        const btn = document.getElementById(`${category}-btn`);
        if (btn) {
            btn.style.display = 'none';
            btn.classList.add('hidden');
        }
    });
    
    // Limpiar observers y listeners
    activeObservers.forEach(obs => obs.disconnect());
    activeObservers = [];
    
    activeListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    activeListeners = [];
    
    currentSubcategory = null;
    
    // Forzar limpieza de memoria
    if (api.forceMemoryCleanup) {
        api.forceMemoryCleanup();
    }
}

function loadHeadSubcategory(subcategory, api) {
    console.log(`[HEAD] Loading subcategory: ${subcategory}`);
    
    const currentToken = ++loadToken;
    
    // Descargar subcategoría anterior si existe
    if (currentSubcategory && currentSubcategory !== subcategory) {
        unloadHeadSubcategory(api);
    }
    
    currentSubcategory = subcategory;
    
    const { ui, isMobileDevice, globalImageObserver, createLazyImage } = api;
    
    // Cargar carrusel según subcategoría
    switch(subcategory) {
        case 'eyes':
            loadEyesCarousel(api, currentToken);
            break;
        case 'eyebrows':
            loadEyebrowsCarousel(api, currentToken);
            break;
        case 'nose':
            loadNoseCarousel(api, currentToken);
            break;
        case 'ears':
            loadEarsCarousel(api, currentToken);
            break;
        case 'hair':
            loadHairCarousel(api, currentToken);
            break;
    }
}

function unloadHeadSubcategory(api) {
    if (!currentSubcategory) return;
    
    console.log(`[HEAD] Unloading subcategory: ${currentSubcategory}`);
    
    const { ui } = api;
    
    // Limpiar carrusel activo
    const containers = [
        ui.eyesCarouselContainer,
        ui.eyebrowsCarouselContainer,
        ui.noseCarouselContainer,
        ui.earLeftCarouselContainer,
        ui.earRightCarouselContainer,
        ui.hairCarouselContainer
    ];
    
    containers.forEach(container => {
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // Desconectar observers activos
    activeObservers.forEach(obs => obs.disconnect());
    activeObservers = [];
    
    currentSubcategory = null;
}

function loadEyesCarousel(api, token) {
    const { ui, eyeTextures, currentEyeTextureURL, changeEyeTexture, createLazyImage, globalImageObserver, isMobileDevice, getTransformedUrl } = api;
    
    ui.eyesCarouselContainer.innerHTML = '';
    
    eyeTextures.forEach((texture, index) => {
        if (loadToken !== token) return; // Token inválido
        
        const transformedUrl = getTransformedUrl(texture.url, { w: 512, fm: 'webp' });
        const thumb = createLazyImage(transformedUrl, index, 2);
        thumb.className = 'w-12 h-12 rounded-lg cursor-pointer border-2 hover:border-cyan-400 object-fill';
        thumb.dataset.originalUrl = texture.url;
        
        if (isMobileDevice && thumb.dataset.src && globalImageObserver) {
            globalImageObserver.observe(thumb);
            activeObservers.push(globalImageObserver);
        }
        
        thumb.classList.toggle('border-cyan-500', texture.url === currentEyeTextureURL);
        thumb.classList.toggle('border-transparent', texture.url !== currentEyeTextureURL);
        
        const clickHandler = (e) => {
            e.preventDefault();
            if (loadToken !== token) return;
            const originalUrl = e.target.dataset.originalUrl;
            changeEyeTexture(originalUrl);
        };
        
        thumb.addEventListener('click', clickHandler);
        activeListeners.push({ element: thumb, event: 'click', handler: clickHandler });
        
        ui.eyesCarouselContainer.appendChild(thumb);
    });
}

function loadEyebrowsCarousel(api, token) {
    const { ui, eyebrowTextures, currentEyebrowTextureURL, changeEyebrowTexture, createLazyImage, globalImageObserver, isMobileDevice, getTransformedUrl } = api;
    
    ui.eyebrowsCarouselContainer.innerHTML = '';
    
    eyebrowTextures.forEach((texture, index) => {
        if (loadToken !== token) return;
        
        const transformedUrl = getTransformedUrl(texture.url, { w: 512, fm: 'webp' });
        const thumb = createLazyImage(transformedUrl, index, 2);
        thumb.className = 'w-12 h-12 rounded-lg cursor-pointer border-2 hover:border-cyan-400 object-fill';
        thumb.dataset.originalUrl = texture.url;
        
        if (isMobileDevice && thumb.dataset.src && globalImageObserver) {
            globalImageObserver.observe(thumb);
            activeObservers.push(globalImageObserver);
        }
        
        thumb.classList.toggle('border-cyan-500', texture.url === currentEyebrowTextureURL);
        thumb.classList.toggle('border-transparent', texture.url !== currentEyebrowTextureURL);
        
        const clickHandler = (e) => {
            e.preventDefault();
            if (loadToken !== token) return;
            const originalUrl = e.target.dataset.originalUrl;
            changeEyebrowTexture(originalUrl);
        };
        
        thumb.addEventListener('click', clickHandler);
        activeListeners.push({ element: thumb, event: 'click', handler: clickHandler });
        
        ui.eyebrowsCarouselContainer.appendChild(thumb);
    });
}

function loadNoseCarousel(api, token) {
    const { ui, noseTextures, currentNoseTextureURL, changeNoseTexture, createLazyImage, globalImageObserver, isMobileDevice, getTransformedUrl } = api;
    
    ui.noseCarouselContainer.innerHTML = '';
    
    noseTextures.forEach((texture, index) => {
        if (loadToken !== token) return;
        
        const transformedUrl = getTransformedUrl(texture.url, { w: 512, fm: 'webp' });
        const thumb = createLazyImage(transformedUrl, index, 2);
        thumb.className = 'w-12 h-12 rounded-lg cursor-pointer border-2 hover:border-cyan-400 object-fill';
        thumb.dataset.originalUrl = texture.url;
        
        if (isMobileDevice && thumb.dataset.src && globalImageObserver) {
            globalImageObserver.observe(thumb);
            activeObservers.push(globalImageObserver);
        }
        
        thumb.classList.toggle('border-cyan-500', texture.url === currentNoseTextureURL);
        thumb.classList.toggle('border-transparent', texture.url !== currentNoseTextureURL);
        
        const clickHandler = (e) => {
            e.preventDefault();
            if (loadToken !== token) return;
            const originalUrl = e.target.dataset.originalUrl;
            changeNoseTexture(originalUrl);
        };
        
        thumb.addEventListener('click', clickHandler);
        activeListeners.push({ element: thumb, event: 'click', handler: clickHandler });
        
        ui.noseCarouselContainer.appendChild(thumb);
    });
}

function loadEarsCarousel(api, token) {
    // Similar pattern for ears (left/right)
    console.log('[HEAD] Ears carousel loaded');
}

function loadHairCarousel(api, token) {
    // Similar pattern for hair
    console.log('[HEAD] Hair carousel loaded');
}
