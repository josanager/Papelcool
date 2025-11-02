// Módulo de edición de cuerpo (Body)
// Maneja: torso, arms, legs

let loadToken = 0;
let activeObservers = [];
let activeListeners = [];
let currentSubcategory = null;

export function mountBody(api) {
    console.log('[BODY] Mounting body module');
    loadToken++;
    
    const { ui } = api;
    
    // Mostrar botones de subcategorías de cuerpo
    const bodyCategories = ['torso', 'arms', 'legs'];
    
    bodyCategories.forEach(category => {
        const btn = document.getElementById(`${category}-btn`);
        if (btn) {
            btn.style.display = '';
            btn.classList.remove('hidden');
        }
    });
    
    return {
        loadSubcategory: (subcategory) => loadBodySubcategory(subcategory, api),
        unloadSubcategory: () => unloadBodySubcategory(api)
    };
}

export function unmountBody(api) {
    console.log('[BODY] Unmounting body module');
    loadToken++;
    
    // Limpiar subcategoría activa
    unloadBodySubcategory(api);
    
    // Ocultar todos los botones de cuerpo
    const bodyCategories = ['torso', 'arms', 'legs'];
    bodyCategories.forEach(category => {
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

function loadBodySubcategory(subcategory, api) {
    console.log(`[BODY] Loading subcategory: ${subcategory}`);
    
    const currentToken = ++loadToken;
    
    // Descargar subcategoría anterior si existe
    if (currentSubcategory && currentSubcategory !== subcategory) {
        unloadBodySubcategory(api);
    }
    
    currentSubcategory = subcategory;
    
    // Cargar carrusel según subcategoría
    switch(subcategory) {
        case 'torso':
            loadTorsoCarousel(api, currentToken);
            break;
        case 'arms':
            loadArmsCarousel(api, currentToken);
            break;
        case 'legs':
            loadLegsCarousel(api, currentToken);
            break;
    }
}

function unloadBodySubcategory(api) {
    if (!currentSubcategory) return;
    
    console.log(`[BODY] Unloading subcategory: ${currentSubcategory}`);
    
    const { ui } = api;
    
    // Limpiar carruseles activos
    const containers = [
        ui.torsoCarouselContainer,
        ui.armLeftCarouselContainer,
        ui.armRightCarouselContainer,
        ui.legLeftCarouselContainer,
        ui.legRightCarouselContainer
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

function loadTorsoCarousel(api, token) {
    const { ui, torsoTextures, currentTorsoFrontURL, changeTorsoClothing, createLazyImage, globalImageObserver, isMobileDevice, getTransformedUrl } = api;
    
    ui.torsoCarouselContainer.innerHTML = '';
    
    torsoTextures.forEach((texture, index) => {
        if (loadToken !== token) return;
        
        const transformedUrl = texture.frontUrl ? getTransformedUrl(texture.frontUrl, { w: 512, fm: 'webp' }) : null;
        
        if (!transformedUrl) {
            // "None" option
            const noneDiv = document.createElement('div');
            noneDiv.className = 'w-12 h-12 rounded-lg cursor-pointer border-2 hover:border-cyan-400 flex items-center justify-center bg-gray-800';
            noneDiv.textContent = 'None';
            noneDiv.dataset.frontUrl = 'null';
            
            const clickHandler = (e) => {
                e.preventDefault();
                if (loadToken !== token) return;
                changeTorsoClothing(null, null);
            };
            
            noneDiv.addEventListener('click', clickHandler);
            activeListeners.push({ element: noneDiv, event: 'click', handler: clickHandler });
            
            ui.torsoCarouselContainer.appendChild(noneDiv);
            return;
        }
        
        const thumb = createLazyImage(transformedUrl, index, 2);
        thumb.className = 'w-12 h-12 rounded-lg cursor-pointer border-2 hover:border-cyan-400 object-fill';
        thumb.dataset.originalFrontUrl = texture.frontUrl;
        thumb.dataset.originalBackUrl = texture.backUrl;
        
        if (isMobileDevice && thumb.dataset.src && globalImageObserver) {
            globalImageObserver.observe(thumb);
            activeObservers.push(globalImageObserver);
        }
        
        thumb.classList.toggle('border-cyan-500', texture.frontUrl === currentTorsoFrontURL);
        thumb.classList.toggle('border-transparent', texture.frontUrl !== currentTorsoFrontURL);
        
        const clickHandler = (e) => {
            e.preventDefault();
            if (loadToken !== token) return;
            const frontUrl = e.target.dataset.originalFrontUrl;
            const backUrl = e.target.dataset.originalBackUrl;
            changeTorsoClothing(frontUrl, backUrl);
        };
        
        thumb.addEventListener('click', clickHandler);
        activeListeners.push({ element: thumb, event: 'click', handler: clickHandler });
        
        ui.torsoCarouselContainer.appendChild(thumb);
    });
}

function loadArmsCarousel(api, token) {
    console.log('[BODY] Arms carousel loaded');
    // Similar pattern for arms (left/right)
}

function loadLegsCarousel(api, token) {
    console.log('[BODY] Legs carousel loaded');
    // Similar pattern for legs (left/right)
}
