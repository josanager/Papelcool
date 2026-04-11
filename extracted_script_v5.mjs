        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

        /* --- Internationalization (i18n) --- */
        const translations = {
            en: {
                flag: '🇺🇸',
                name: 'English',
                'preparing-pdf': 'Preparing PDF...',
                'download-pdf-btn': 'DOWNLOAD PDF',
                'download-message': 'ℹ️ Your download will start through your browser.<br>Please check your downloads folder.',
                'coming-soon-title': 'Coming Soon',
                'coming-soon-body': "This feature will be available very soon. We're working to bring you the best experience.",
                'got-it': 'Got it',
                'back-btn': 'BACK',
                'color-warning-title': 'Color Required',
                'color-warning-body': 'You must select a color to paint the model before downloading.',
                'cat-eyes': 'Eyes',
                'cat-brows': 'Brows',
                'cat-nose': 'Nose',
                'cat-hair': 'Hair',
                'cat-torso': 'Torso',
                'cat-arms': 'Arms',
                'cat-legs': 'Legs',
                'skin-color-title': 'SKIN COLOR',
                'hue-label': 'Hue',
                'lightness-label': 'Lightness',
                'part-all': 'Total',
                'part-head': 'Head',
                'part-torso': 'Torso',
                'part-arm-l': 'Left Arm',
                'part-arm-r': 'Right Arm',
                'part-leg-l': 'Left Leg',
                'part-leg-r': 'Right Leg',
                'download-template-btn': 'DOWNLOAD TEMPLATE',
                'search-presets': 'Search presets...',
                'alert-select-preset': 'Please select a preset character first.',
                'unknown-character': 'Unknown Character',
                'name-none': 'None',
                'name-basic': 'Basic',
                'name-default': 'Default',
                'name-male': 'Male',
                'name-female': 'Female'
            },
            es: {
                flag: '🇪🇸',
                name: 'Español',
                'preparing-pdf': 'Preparando PDF...',
                'download-pdf-btn': 'DESCARGAR PDF',
                'download-message': 'ℹ️ Tu descarga comenzará en el navegador.<br>Por favor, revisa tu carpeta de descargas.',
                'coming-soon-title': 'Próximamente',
                'coming-soon-body': 'Esta función estará disponible muy pronto. Estamos trabajando para brindarte la mejor experiencia.',
                'got-it': 'Entendido',
                'back-btn': 'VOLVER',
                'color-warning-title': 'Color Requerido',
                'color-warning-body': 'Debes seleccionar un color para pintar el modelo antes de descargar.',
                'cat-eyes': 'Ojos',
                'cat-brows': 'Cejas',
                'cat-nose': 'Nariz',
                'cat-hair': 'Pelo',
                'cat-torso': 'Torso',
                'cat-arms': 'Brazos',
                'cat-legs': 'Piernas',
                'skin-color-title': 'COLOR DE PIEL',
                'hue-label': 'Tono',
                'lightness-label': 'Luminosidad',
                'part-all': 'Total',
                'part-head': 'Cabeza',
                'part-torso': 'Torso',
                'part-arm-l': 'Brazo Izq',
                'part-arm-r': 'Brazo Der',
                'part-leg-l': 'Pierna Izq',
                'part-leg-r': 'Pierna Der',
                'download-template-btn': 'DESCARGAR PLANTILLA',
                'search-presets': 'Buscar modelos...',
                'alert-select-preset': 'Por favor, selecciona un personaje preestablecido primero.',
                'unknown-character': 'Personaje Desconocido',
                'name-none': 'Ninguno',
                'name-basic': 'Básico',
                'name-default': 'Predeterminado',
                'name-male': 'Masculino',
                'name-female': 'Femenino'
            }
        };

        class LanguageManager {
            constructor() {
                this.currentLang = localStorage.getItem('papelcool_lang') || 'en';
                this.init();
            }

            init() {
                this.updateUI();
                this.setupSwitcher();
            }

            setLanguage(lang) {
                if (!translations[lang]) return;
                this.currentLang = lang;
                localStorage.setItem('papelcool_lang', lang);
                this.updateUI();

                // Trigger grid repopulation if customize section is visible
                const activeNav = document.querySelector('.custom-nav-btn.active');
                if (activeNav) {
                    const category = activeNav.dataset.category;
                    if (typeof populateOptionsGrid === 'function') {
                        populateOptionsGrid(category);
                    }
                }
            }

            updateUI() {
                const elements = document.querySelectorAll('[data-i18n]');
                elements.forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    const translation = translations[this.currentLang][key];
                    if (translation) {
                        if (el.tagName === 'INPUT' && el.type === 'text') {
                            el.placeholder = translation;
                        } else {
                            el.innerHTML = translation;
                        }
                    }
                });

                // Update search placeholder manually if not tagged
                const searchInput = document.getElementById('preset-search-input');
                if (searchInput) {
                    searchInput.placeholder = translations[this.currentLang]['search-presets'];
                }

                // Update toggle button text
                const toggleText = document.getElementById('lang-toggle-text');
                if (toggleText) {
                    toggleText.textContent = this.currentLang.toUpperCase();
                }
            }

            setupSwitcher() {
                const btn = document.getElementById('lang-toggle-btn');
                if (btn) {
                    btn.addEventListener('click', () => {
                        const newLang = this.currentLang === 'en' ? 'es' : 'en';
                        this.setLanguage(newLang);
                    });
                }
            }

            get(key) {
                return translations[this.currentLang][key] || key;
            }
        }

        const langManager = new LanguageManager();
        window.langManager = langManager; // Make it globally accessible

        let appMode = 'edit';
        let currentMainPart = 'torso';
        let currentHeadPart = null;
        const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, ' ': false };

        // UI Elements (Moved to top to avoid ReferenceError)
        const showcaseButtonsContainer = document.getElementById('showcase-buttons-container');
        const customizeBtn = document.getElementById('customize-btn');
        const presetsBtn = document.getElementById('presets-btn');
        const editorPanelWrapper = document.getElementById('editor-panel-wrapper');
        const presetsSection = document.getElementById('presets-section');
        const customizeSection = document.getElementById('customize-section');

        // Variables para showcase inicial
        let isShowcaseActive = false;
        let showcaseRotationSpeed = 0.3;
        let showcaseCharacterIndex = 0;
        const showcaseCharacters = ['Mira', 'Rumi', 'Zoey'];
        let showcaseCharacterTimer = 0;
        const showcaseCharacterInterval = 4000; // Cambiar cada 4 segundos

        // Variables para cambio de colores aleatorios en showcase
        let showcaseColorTimers = {
            head: 0,
            torso: 0,
            leftArm: 0,
            rightArm: 0,
            leftLeg: 0,
            rightLeg: 0
        };
        const showcaseColorIntervals = {
            head: 800,
            torso: 1200,
            leftArm: 600,
            rightArm: 700,
            leftLeg: 900,
            rightLeg: 1000
        };

        // Variables para cambio de texturas aleatorias en showcase
        let showcaseTextureTimers = {
            eyes: 0,
            eyebrows: 0,
            nose: 0,
            ears: 0,
            hair: 0,
            torso: 0,
            leftArm: 0,
            rightArm: 0,
            leftLeg: 0,
            rightLeg: 0
        };
        const showcaseTextureIntervals = {
            eyes: 2500,      // Cambiar cada 2.5 segundos
            eyebrows: 3000,   // Cambiar cada 3 segundos
            nose: 3200,       // Cambiar cada 3.2 segundos
            ears: 3500,       // Cambiar cada 3.5 segundos
            hair: 4000,       // Cambiar cada 4 segundos
            torso: 4500,      // Cambiar cada 4.5 segundos
            leftArm: 2800,    // Cambiar cada 2.8 segundos
            rightArm: 3200,   // Cambiar cada 3.2 segundos
            leftLeg: 2700,    // Cambiar cada 2.7 segundos
            rightLeg: 3100    // Cambiar cada 3.1 segundos
        };
        let yVelocity = 0;
        let isJumping = false;
        let groundY = 0;

        // Variables para controles móviles
        let joystickActive = false;
        let joystickVector = { x: 0, y: 0 };
        const mobileGameControls = document.getElementById('mobile-game-controls');
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        const jumpButton = document.getElementById('jump-button');

        // Variables para control de cámara
        let cameraView = 'back'; // 'back' o 'front'
        let cameraAngle = 0; // Ángulo actual de la cámara alrededor del personaje
        let targetCameraAngle = 0; // Ángulo objetivo
        let isCameraTransitioning = false;

        const canvasContainer = document.getElementById('canvas-container');

        // Ajusta cámara y renderer al tamaño REAL del contenedor del canvas
        function resizeToCanvasContainer(fovOverride) {
            if (!canvasContainer) return;
            const rect = canvasContainer.getBoundingClientRect();
            const w = Math.max(1, Math.floor(rect.width));
            const h = Math.max(1, Math.floor(rect.height));
            if (typeof fovOverride === 'number') camera.fov = fovOverride;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        const loadingIndicator = document.getElementById('loading-indicator');
        const scene = new THREE.Scene();

        // Crear degradado de fondo estático
        const staticGradientCanvas = document.createElement('canvas');
        staticGradientCanvas.width = 4;
        staticGradientCanvas.height = 512;
        const staticGradientCtx = staticGradientCanvas.getContext('2d');
        const staticGradient = staticGradientCtx.createLinearGradient(0, 0, 0, 512);
        staticGradient.addColorStop(0, '#007EFF');  // Azul claro arriba
        staticGradient.addColorStop(1, '#0000FF');  // Azul puro abajo
        staticGradientCtx.fillStyle = staticGradient;
        staticGradientCtx.fillRect(0, 0, 4, 512);

        // No establecer background en la escena para que sea transparente
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const originalCameraPos = new THREE.Vector3(0, 1.5, 5);
        camera.position.copy(originalCameraPos);

        // Detectar si es móvil para reducir calidad y memoria
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const pixelRatio = isMobileDevice ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;

        const renderer = new THREE.WebGLRenderer({
            antialias: !isMobileDevice, // Desactivar antialiasing en móvil para ahorrar memoria
            alpha: true, // Habilitar transparencia
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(pixelRatio); // Limitar pixel ratio en móvil
        renderer.setClearColor(0x000000, 0); // Color transparente
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        canvasContainer.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.minDistance = 3;  // Zoom in máximo (más cerca)
        controls.maxDistance = 25; // Zoom out máximo (más lejos)

        // Iluminación sin sombras - 100% clara y uniforme
        // Luz ambiental fuerte - ilumina todo uniformemente sin crear sombras
        scene.add(new THREE.AmbientLight(0xffffff, 2.0));

        // Luces direccionales suaves desde múltiples ángulos para eliminar sombras
        // Luz frontal superior
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
        frontLight.position.set(0, 10, 10);
        scene.add(frontLight);

        // Luz frontal inferior (elimina sombras bajo la barbilla)
        const frontBottomLight = new THREE.DirectionalLight(0xffffff, 0.4);
        frontBottomLight.position.set(0, -5, 10);
        scene.add(frontBottomLight);

        // Luz lateral izquierda
        const leftLight = new THREE.DirectionalLight(0xffffff, 0.4);
        leftLight.position.set(-10, 5, 5);
        scene.add(leftLight);

        // Luz lateral derecha
        const rightLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rightLight.position.set(10, 5, 5);
        scene.add(rightLight);

        // Luz trasera (elimina sombras en la parte de atrás)
        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(0, 5, -10);
        scene.add(backLight);

        // Referencia al grid para poder alternar visibilidad
        const gridHelper = new THREE.GridHelper(200, 200, 0x404040);
        gridHelper.material.opacity = 0.4;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Sombra suave bajo los pies (plano con degradado radial)
        let footShadow = null;
        function createFootShadow(size = 1.8) {
            const c = document.createElement('canvas');
            c.width = c.height = 512;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(256, 256, 40, 256, 256, 220);
            g.addColorStop(0, 'rgba(0,0,0,0.4)');
            g.addColorStop(0.6, 'rgba(0,0,0,0.2)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 512, 512);
            const tex = new THREE.CanvasTexture(c);
            tex.needsUpdate = true;
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
            const geo = new THREE.PlaneGeometry(size, size);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(0, 0.01, 0);
            mesh.renderOrder = -1;
            return mesh;
        }

        const modelURL = './papelcool.glb';

        // ============================================
        // DATOS DE TEXTURAS CARGADOS DESDE character-data.js
        // ============================================
        // Los arrays (eyeTextures, hairTextures, etc.) están en character-data.js
        // Aquí solo definimos las variables de estado actuales

        // Variables de estado para texturas actuales
        let currentEyeTextureURL = null;
        let currentEyebrowTextureURL = null;
        let currentNoseTextureURL = null;
        let currentEarTextureURL = null;
        let currentEarSide = null; // 'left' o 'right'

        let currentHairFrontURL = null; // Por defecto 'None'
        let currentHairBackURL = null; // Por defecto 'None'
        let currentHairLeftURL = null; // Por defecto 'None'
        let currentHairRightURL = null; // Por defecto 'None'
        let currentHairUpURL = null; // Por defecto 'None'

        let currentTorsoFrontURL = null; // Por defecto 'None'
        let currentTorsoBackURL = null; // Por defecto 'None'

        let currentArmLeftURL = null; // Por defecto 'None'
        let currentArmRightURL = null; // Por defecto 'None'
        let currentArmSide = null; // 'left' o 'right'

        let currentLegLeftURL = null; // Por defecto 'None'
        let currentLegRightURL = null; // Por defecto 'None'
        let currentLegSide = null; // 'left' o 'right'

        // Cargar iconos de presets dinámicamente
        if (document.getElementById('steve-icon')) {
            document.getElementById('steve-icon').src = presetIcons['Steve'] || 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Minecraft/Steve/Steve-icon.svg';
        }
        document.getElementById('baby-icon').src = presetIcons['Baby'];
        document.getElementById('mystery-icon').src = presetIcons['Mystery'];
        document.getElementById('romance-icon').src = presetIcons['Romance'];
        document.getElementById('abby-icon').src = presetIcons['Abby'];
        document.getElementById('jinu-icon').src = presetIcons['Jinu'];
        document.getElementById('zoey-icon').src = presetIcons['Zoey'];
        document.getElementById('rumi-icon').src = presetIcons['Rumi'];
        document.getElementById('mira-icon').src = presetIcons['Mira'];

        // Habilitar caché de THREE.js para evitar recargas de red
        THREE.Cache.enabled = true;

        const loader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();

        /* ============================================
           SISTEMA 100% SVG - SIN PNG
           ============================================
           VENTAJAS DE SVG:
           - Vectoriales: escalan infinitamente sin pérdida de calidad
           - Menor peso: archivos más pequeños = menos RAM
           - Sin compresión necesaria: no hay degradación
           - Carga más rápida: menos datos a transferir
           - Mejor rendimiento: procesamiento optimizado
           
           SOLUCIÓN ANTI-PIXELADO:
           - SVG se rasteriza a 2048x2048 antes de aplicar como textura
           - Mantiene calidad vectorial en el modelo 3D
           - Sin pixelado visible incluso en zoom cercano
           
           SOLUCIÓN COLORES CORRECTOS:
           - Canvas sin configuración de colorSpace
           - Three.js maneja los colores automáticamente
           - Sin corrección gamma que altere colores
           - imageSmoothingQuality: 'high' para máxima calidad
           - Colores fieles al SVG original
           ============================================ */

        textureLoader.setCrossOrigin('anonymous');

        /* ============================================
           GESTIÓN DE MEMORIA OPTIMIZADA PARA SVG
           ============================================
           SVG son mucho más ligeros que PNG, por lo tanto:
           - NO necesitamos throttle de cambios
           - Podemos mantener más texturas en caché
           - Disposición automática más inteligente
           ============================================ */

        // Cache de texturas con Map para acceso O(1)
        const textureCache = new Map();
        const MAX_CACHED_TEXTURES = isMobileDevice ? 15 : 30;

        function registerTexture(texture, url) {
            if (!url) return;

            // Agregar al cache
            textureCache.set(url, texture);

            // Limpiar cache si excede el límite
            if (textureCache.size > MAX_CACHED_TEXTURES) {
                const firstKey = textureCache.keys().next().value;
                const oldTexture = textureCache.get(firstKey);
                if (oldTexture && oldTexture.dispose) {
                    oldTexture.dispose();
                }
                textureCache.delete(firstKey);
            }
        }

        // Obtener textura del cache
        function getCachedTexture(url) {
            return textureCache.get(url);
        }

        // NOTA: SVG son vectoriales y se escalan perfectamente sin pérdida de calidad
        // No requieren redimensionamiento ni compresión
        // Esto ahorra memoria RAM y mejora el rendimiento

        // Función para cargar SVG a alta resolución con colores correctos y cache
        // Convierte SVG vectorial a imagen de alta calidad antes de usarlo como textura
        function loadSVGAsHighResTexture(url, onLoad, onError) {
            // Verificar cache primero
            const cachedTexture = getCachedTexture(url);
            if (cachedTexture) {
                if (onLoad) onLoad(cachedTexture);
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = function () {
                // Resolución dinámica según dispositivo
                const resolution = isMobileDevice ? 1024 : 2048;

                // Crear canvas de alta resolución
                const canvas = document.createElement('canvas');
                canvas.width = resolution;
                canvas.height = resolution;

                // Contexto optimizado
                const ctx = canvas.getContext('2d', {
                    alpha: true,
                    willReadFrequently: false
                });

                // Dibujar SVG a alta resolución con calidad máxima
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, resolution, resolution);

                // Crear textura desde canvas de alta resolución
                const texture = new THREE.CanvasTexture(canvas);
                texture.encoding = THREE.sRGBEncoding; // IMPORTANTE: Colores correctos y saturados
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                texture.needsUpdate = true;

                // Registrar en cache
                registerTexture(texture, url);

                if (onLoad) onLoad(texture);
            };

            img.onerror = function (error) {
                console.error('Error cargando SVG:', url, error);
                if (onError) onError(error);
            };

            img.src = url;
        }

        // Función para cargar texturas SVG únicamente
        function loadOptimizedTexture(url, onLoad, onError) {
            // Solo soportamos SVG con cache y resolución dinámica
            return loadSVGAsHighResTexture(url, onLoad, onError);
        }

        // Limpieza de memoria simplificada (con SVG es menos crítico)
        function forceMemoryCleanup() {
            // Con SVG ligeros, solo limpiamos renderLists
            // No necesitamos forzar GC agresivamente
            if (isMobileDevice && renderer) {
                renderer.renderLists.dispose();
            }
        }

        // Función helper para crear imágenes SVG con lazy loading optimizado
        // SVG son ligeros: podemos precargar más sin impacto
        function createLazyImage(url, index, maxPreload = 5) {
            const img = document.createElement('img');
            img.dataset.url = url;

            if (isMobileDevice) {
                // SVG ligeros: precargar 5 imágenes (antes 3)
                if (index < maxPreload) {
                    img.src = url;
                } else {
                    // Placeholder SVG transparente mínimo
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
                    img.dataset.src = url;
                }
            } else {
                img.loading = 'lazy';
                img.src = url;
            }

            return img;
        }

        // IntersectionObserver global optimizado para SVG
        let globalImageObserver = null;
        if (isMobileDevice) {
            globalImageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src && !img.src.includes(img.dataset.src)) {
                            img.src = img.dataset.src;
                            globalImageObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '100px', // Cargar antes (antes 50px)
                threshold: 0.01 // Más sensible
            });
        }

        let loadedModel;
        const modelParts = {
            head: null, torso: null, arms: [], legs: [],
            eyebrows: [], nose: null, ears: [], hair: null
        };
        const initialTransforms = new Map();
        let modelCenter = new THREE.Vector3();
        let eyesMesh = null;
        let eyebrowsMesh = null;
        let noseMesh = null;
        let earLeftMesh = null;
        let earRightMesh = null;
        let hairFrontMesh = null;
        let hairBackMesh = null;
        let hairLeftMesh = null;
        let hairRightMesh = null;
        let hairUpMesh = null;
        let torsoFrontMesh = null;
        let torsoBackMesh = null;
        let armLeftFrontMesh = null;
        let armLeftBackMesh = null;
        let armRightFrontMesh = null;
        let armRightBackMesh = null;
        let legLeftFrontMesh = null;
        let legLeftBackMesh = null;
        let legRightFrontMesh = null;
        let legRightBackMesh = null;

        loader.load(
            modelURL,
            function (gltf) {
                loadedModel = gltf.scene;
                loadedModel.traverse((child) => {
                    if (child.isMesh) {
                        const name = child.name.toLowerCase();
                        if (name.includes('head')) modelParts.head = child;
                        else if (name.includes('torso')) modelParts.torso = child;
                        else if (name.includes('arm')) {
                            modelParts.arms.push(child);
                            // Rotar brazo derecho 180 grados en el eje Y
                            if (name.includes('r')) {
                                child.rotation.y = Math.PI;
                            }
                        }
                        else if (name.includes('leg')) modelParts.legs.push(child);
                        else if (name.includes('eyebrow')) modelParts.eyebrows.push(child);
                        else if (name.includes('nose')) modelParts.nose = child;
                        else if (name.includes('ear')) modelParts.ears.push(child);
                        else if (name.includes('hair')) modelParts.hair = child;

                        initialTransforms.set(child, {
                            position: child.position.clone(),
                            rotation: child.rotation.clone()
                        });
                    }
                });

                const box = new THREE.Box3().setFromObject(loadedModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim;
                loadedModel.scale.set(scale, scale, scale);
                loadedModel.position.sub(center.multiplyScalar(scale));
                const scaledHeight = size.y * scale;
                groundY = scaledHeight / 2;
                // Levantar ligeramente el modelo para que no atraviese el suelo
                loadedModel.position.y = groundY + 0.02;
                modelCenter.set(0, groundY + 0.02, 0);
                controls.target.copy(modelCenter);
                scene.add(loadedModel);

                // Establecer el modelo base completamente en blanco al iniciar el showcase
                if (loadedModel) {
                    loadedModel.traverse((child) => {
                        if (child.isMesh && child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.color) mat.color.setHex(0xffffff);
                                });
                            } else if (child.material.color) {
                                child.material.color.setHex(0xffffff);
                            }
                        }
                    });
                }

                // Crear y añadir sombra bajo los pies (inicialmente oculta)
                if (!footShadow) {
                    footShadow = createFootShadow(1.6);
                    footShadow.visible = false;
                    // La altura del suelo está en y = 0, pies casi en 0
                    footShadow.position.y = -0.03;
                    scene.add(footShadow);
                }

                // Iniciar showcase primero (sin texturas iniciales)
                startShowcase();

                // Ocultar loading después de que showcase esté listo
                setTimeout(() => {
                    loadingIndicator.classList.add('fade-out');
                    setTimeout(() => {
                        loadingIndicator.style.display = 'none';
                    }, 500);
                }, 300);

                // Cachear referencias a extremidades para optimizar animación
                cacheLimbReferences();
            },
            (xhr) => {
                // Progreso de carga - solo mantener logo y spinner
            },
            (error) => {
                console.error('Error al cargar modelo:', error);
                console.error('Detalles del error:', error.message, error.stack);
                // Mantener pantalla de carga visible en caso de error
            }
        );

        // Array de imágenes para el botón de cabello animado
        // Puedes añadir más URLs aquí para incluir más imágenes en la rotación
        const hairButtonImages = [
            'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/icon%20buttons/hair%20buttons/Mira-hair-button.png',
            'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/icon%20buttons/hair%20buttons/Rumi-hair-button.png',
            'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/icon%20buttons/hair%20buttons/Zoey-hair-button.png'
            // Añade más URLs aquí si quieres más imágenes
        ];

        // Obsolete UI objects and functions removed


        let isAnimatingCamera = false;
        let cameraTargetPos = new THREE.Vector3(), controlsTargetPos = new THREE.Vector3();

        // Variables para animación circular de cámara
        let isCircularCameraAnimation = false;
        let circularAnimStartAngle = 0;
        let circularAnimTargetAngle = 0;
        let circularAnimProgress = 0;
        let circularAnimTargetDuration = 1.5;
        let circularAnimRadius = 0;
        let circularAnimHeight = 0;

        // Variables para guardar el estado original de la cámara en modo presets
        let savedPresetCameraPos = null;
        let savedPresetCameraTarget = null;
        let savedPresetCameraDistance = null;  // Distancia (zoom) de la cámara al target

        function animateCameraTo(pos, target) {
            cameraTargetPos.copy(pos);
            controlsTargetPos.copy(target);
            isAnimatingCamera = true;
        }

        // Nueva función para animación circular lateral
        function animateCameraCircular(targetAngle, duration = 1500, targetRadius = null) {
            const currentPos = camera.position.clone();
            // Si se proporciona un radio objetivo (distancia/zoom), usarlo; si no, usar el actual
            circularAnimRadius = targetRadius !== null ? targetRadius : Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z);
            circularAnimHeight = currentPos.y;
            circularAnimStartAngle = Math.atan2(currentPos.x, currentPos.z);
            circularAnimTargetAngle = targetAngle;
            circularAnimTargetDuration = duration / 1000; // Convertir a segundos
            circularAnimProgress = 0;
            isCircularCameraAnimation = true;
            isAnimatingCamera = false; // Desactivar animación lineal
        }

        function updateButtons() {
            // Function deprecated
        }

        // Obsolete listeners removed


        // Función para manejar el joystick
        function setupJoystick() {
            let touchId = null;
            const maxDistance = 35; // Radio máximo del joystick

            joystickBase.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (touchId === null) {
                    touchId = e.changedTouches[0].identifier;
                    joystickActive = true;
                }
            });

            joystickBase.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (let touch of e.changedTouches) {
                    if (touch.identifier === touchId) {
                        const rect = joystickBase.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;

                        let deltaX = touch.clientX - centerX;
                        let deltaY = touch.clientY - centerY;

                        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                        if (distance > maxDistance) {
                            const angle = Math.atan2(deltaY, deltaX);
                            deltaX = Math.cos(angle) * maxDistance;
                            deltaY = Math.sin(angle) * maxDistance;
                        }

                        joystickStick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

                        // Normalizar valores para el movimiento
                        joystickVector.x = deltaX / maxDistance;
                        joystickVector.y = -deltaY / maxDistance; // Invertir Y
                    }
                }
            });

            const resetJoystick = (e) => {
                for (let touch of e.changedTouches) {
                    if (touch.identifier === touchId) {
                        touchId = null;
                        joystickActive = false;
                        joystickStick.style.transform = 'translate(-50%, -50%)';
                        joystickVector.x = 0;
                        joystickVector.y = 0;
                    }
                }
            };

            joystickBase.addEventListener('touchend', resetJoystick);
            joystickBase.addEventListener('touchcancel', resetJoystick);
        }

        // Función para manejar el botón de salto
        function setupJumpButton() {
            jumpButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!isJumping) {
                    isJumping = true;
                    yVelocity = 10; // jumpHeight
                }
            });
        }

        // Función para alternar entre modo edición y juego
        function togglePlayMode() {
            appMode = appMode === 'edit' ? 'play' : 'edit';
            const isMobile = window.innerWidth <= 1024;

            // Referencias a los botones de preset-action-buttons
            const backToShowcaseBtn = document.getElementById('back-to-showcase-btn');
            const downloadPdfBtnMoved = document.getElementById('download-pdf-btn-moved');

            if (appMode === 'play') {
                // Modo juego
                // Cambiar icono de los botones a pausa
                const playModeBtnMoved = document.getElementById('play-mode-btn-desktop-moved');
                const playModeCustomBtn = document.getElementById('play-mode-custom-btn');

                [playModeBtnMoved, playModeCustomBtn].forEach(btn => {
                    if (btn) {
                        const iconSpan = btn.querySelector('.button-inner span');
                        if (iconSpan) {
                            iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4M6 19h4V5H6z"/></svg>';
                        } else {
                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4M6 19h4V5H6z"/></svg>';
                        }
                    }
                });

                // Ocultar botones de volver a showcase y descargar PDF
                if (backToShowcaseBtn) {
                    backToShowcaseBtn.style.display = 'none';
                }
                if (downloadPdfBtnMoved && downloadPdfBtnMoved.classList.contains('active')) {
                    downloadPdfBtnMoved.style.display = 'none';
                }

                // Posiciones fijas para modo presets y modo juego
                const presetCameraPos = new THREE.Vector3(0, 1.5, 5);
                const playCameraPos = new THREE.Vector3(0.0000061, 1.5, -5);

                // GUARDAR estado de cámara presets
                savedPresetCameraPos = presetCameraPos.clone();
                savedPresetCameraTarget = modelCenter.clone();
                savedPresetCameraDistance = 5;

                // Ocultar nombre del personaje
                hideCharacterName();

                // En móvil, ocultar el panel del editor y mostrar controles de juego
                if (isMobile) {
                    editorPanelWrapper.classList.add('hidden-mobile');
                    mobileGameControls.classList.add('active');
                } else {
                    // En desktop, ocultar completamente el panel del editor
                    editorPanelWrapper.style.display = 'none';
                }

                // ANIMACIÓN: Girar cámara 180° hacia posición fija de modo juego
                controls.enabled = false;

                // Calcular ángulo objetivo (π radianes = 180°, que lleva a Z = -5)
                const targetAngle = Math.PI;

                // Iniciar animación circular lateral hacia posición fija (rápida)
                animateCameraCircular(targetAngle, 800, 5); // 800ms - rápida

                // Después de la animación, configurar controles para solo rotación horizontal
                setTimeout(() => {
                    // Configurar OrbitControls para solo rotación horizontal
                    controls.enabled = true;
                    controls.enablePan = false;
                    controls.enableZoom = false;
                    const polarAngle = Math.acos(1.5 / 5);
                    controls.minPolarAngle = controls.maxPolarAngle = polarAngle;
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.1;
                }, 800);

            } else {
                // Modo edición (volver a presets)
                // Restaurar icono de los botones a play
                const playModeBtnMoved = document.getElementById('play-mode-btn-desktop-moved');
                const playModeCustomBtn = document.getElementById('play-mode-custom-btn');

                [playModeBtnMoved, playModeCustomBtn].forEach(btn => {
                    if (btn) {
                        const iconSpan = btn.querySelector('.button-inner span');
                        if (iconSpan) {
                            iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.14v14l11-7z"/></svg>';
                        } else {
                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.14v14l11-7z"/></svg>';
                        }
                    }
                });

                // Mostrar botones de volver a showcase y descargar PDF
                if (backToShowcaseBtn) {
                    backToShowcaseBtn.style.display = '';
                }
                if (downloadPdfBtnMoved && downloadPdfBtnMoved.classList.contains('active')) {
                    downloadPdfBtnMoved.style.display = '';
                }

                // Mostrar nombre del personaje si hay uno seleccionado
                if (currentPresetCharacter) {
                    showCharacterName(currentPresetCharacter);
                }

                // En móvil, mostrar el panel del editor y ocultar controles de juego
                if (isMobile) {
                    editorPanelWrapper.classList.remove('hidden-mobile');
                    mobileGameControls.classList.remove('active');
                } else {
                    // En desktop, mostrar el panel del editor
                    editorPanelWrapper.style.display = 'block';
                }

                // ANIMACIÓN DE REGRESO: Volver a posición fija de modo presets
                controls.enabled = false;

                // Resetear posición y rotación del modelo
                if (loadedModel) {
                    loadedModel.position.set(0, groundY, 0);
                    loadedModel.rotation.set(0, 0, 0);
                }

                // Calcular ángulo objetivo para volver a Z=5 (ángulo 0)
                const targetAngle = 0;

                // Iniciar animación circular lateral hacia posición fija de presets (rápida)
                animateCameraCircular(targetAngle, 900, 5); // 900ms - rápida

                // Después de la animación, restaurar configuración completa de OrbitControls
                setTimeout(() => {
                    controls.enabled = true;
                    controls.enablePan = true;
                    controls.enableZoom = true;
                    controls.minPolarAngle = 0;
                    controls.maxPolarAngle = Math.PI;
                    controls.dampingFactor = 0.1;
                }, 900);
            }
        }

        // Inicializar controles móviles
        setupJoystick();
        setupJumpButton();

        function changeEyeTexture(url, isInitialLoad = false) {
            if (!modelParts.head) return;

            loadOptimizedTexture(url,
                (texture) => {
                    // SOLUCIÓN 3: Reutilizar mesh existente para evitar superposición
                    if (isInitialLoad || !eyesMesh) {
                        // Creación inicial de los ojos
                        const eyeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 });
                        const planeHeight = 2.256;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const eyeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        eyesMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
                        eyesMesh.position.set(0, 1.029, 1.129);
                        modelParts.head.add(eyesMesh);
                    } else {
                        // Actualizar textura del mesh existente (móvil y desktop)
                        const oldMap = eyesMesh.material.map;
                        eyesMesh.material.map = texture;
                        eyesMesh.material.needsUpdate = true;

                        // Liberar textura antigua
                        if (oldMap && oldMap !== texture) {
                            oldMap.dispose();
                        }

                        // Limpiar memoria en móvil
                        if (isMobileDevice) {
                            forceMemoryCleanup();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error("No se pudo cargar la textura de los ojos.", error);
                    // Fallback si la textura falla al cargar (crea un placeholder rojo)
                    if (isInitialLoad && !eyesMesh) {
                        const placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
                        const headBox = new THREE.Box3().setFromObject(modelParts.head);
                        const headSize = headBox.getSize(new THREE.Vector3());
                        const eyeGeometry = new THREE.PlaneGeometry(headSize.x * 0.5, headSize.y * 0.2);
                        eyesMesh = new THREE.Mesh(eyeGeometry, placeholderMaterial);
                        eyesMesh.position.set(0, 0, headSize.z / 2 + 0.05); // Posición genérica
                        modelParts.head.add(eyesMesh);
                    }
                }
            );
        }

        // updateEyeCarousel removed


        function changeEyebrowTexture(url, isInitialLoad = false) {
            if (!modelParts.head) return;

            loadOptimizedTexture(url,
                (texture) => {
                    if (isInitialLoad || !eyebrowsMesh) {
                        // Creación inicial de las cejas
                        const eyebrowMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 });
                        const planeHeight = 2.256;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const eyebrowGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        eyebrowsMesh = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
                        eyebrowsMesh.position.set(0, 1.029, 1.129);
                        modelParts.head.add(eyebrowsMesh);
                    } else {
                        // Actualizar textura del mesh existente
                        const oldMap = eyebrowsMesh.material.map;
                        eyebrowsMesh.material.map = texture;
                        eyebrowsMesh.material.needsUpdate = true;

                        // Liberar textura antigua
                        if (oldMap && oldMap !== texture) {
                            oldMap.dispose();
                        }

                        // Limpiar memoria en móvil
                        if (isMobileDevice) {
                            forceMemoryCleanup();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error("No se pudo cargar la textura de las cejas.", error);
                    // Fallback si la textura falla al cargar
                    if (isInitialLoad && !eyebrowsMesh) {
                        const placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
                        const headBox = new THREE.Box3().setFromObject(modelParts.head);
                        const headSize = headBox.getSize(new THREE.Vector3());
                        const eyebrowGeometry = new THREE.PlaneGeometry(headSize.x * 0.5, headSize.y * 0.2);
                        eyebrowsMesh = new THREE.Mesh(eyebrowGeometry, placeholderMaterial);
                        eyebrowsMesh.position.set(0, 0, headSize.z / 2 + 0.05);
                        modelParts.head.add(eyebrowsMesh);
                    }
                }
            );
        }

        // updateEyebrowCarousel removed


        function changeNoseTexture(url, isInitialLoad = false) {
            if (!modelParts.head) return;

            loadOptimizedTexture(url,
                (texture) => {
                    if (isInitialLoad || !noseMesh) {
                        // Creación inicial de la nariz con color aplicable
                        const noseMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5,
                            color: 0xffffff // Color base que se puede modificar
                        });
                        // Mismas dimensiones que los ojos
                        const planeHeight = 2.256;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const noseGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        noseMesh = new THREE.Mesh(noseGeometry, noseMaterial);
                        // Misma posición que los ojos
                        noseMesh.position.set(0, 1.029, 1.129);
                        modelParts.head.add(noseMesh);

                        // Aplicar el color inicial de la cabeza (50% más oscuro)
                        if (modelParts.head && modelParts.head.material && modelParts.head.material.color) {
                            applyNoseColor(modelParts.head.material.color.getHex());
                        } else {
                            // Si no hay color de cabeza definido, usar blanco con 50% oscuridad
                            applyNoseColor(0xffffff);
                        }
                    } else {
                        // Actualizar textura del mesh existente
                        const oldMap = noseMesh.material.map;
                        noseMesh.material.map = texture;
                        noseMesh.material.needsUpdate = true;

                        // Liberar textura antigua
                        if (oldMap && oldMap !== texture) {
                            oldMap.dispose();
                        }

                        // Limpiar memoria en móvil
                        if (isMobileDevice) {
                            forceMemoryCleanup();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error("No se pudo cargar la textura de la nariz.", error);
                    // Fallback si la textura falla al cargar
                    if (isInitialLoad && !noseMesh) {
                        const placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
                        const headBox = new THREE.Box3().setFromObject(modelParts.head);
                        const headSize = headBox.getSize(new THREE.Vector3());
                        const noseGeometry = new THREE.PlaneGeometry(headSize.x * 0.5, headSize.y * 0.2);
                        noseMesh = new THREE.Mesh(noseGeometry, placeholderMaterial);
                        noseMesh.position.set(0, 0, headSize.z / 2 + 0.05);
                        modelParts.head.add(noseMesh);
                    }
                }
            );
        }

        // Función para aplicar color a la nariz (25% más oscuro que la cabeza)
        function applyNoseColor(headColorHex) {
            if (!noseMesh) return;

            // Convertir el color hex a RGB
            const color = new THREE.Color(headColorHex);

            // Oscurecer el color un 25% (multiplicar por 0.75)
            const darkenedColor = new THREE.Color(
                color.r * 0.75,
                color.g * 0.75,
                color.b * 0.75
            );

            // Aplicar el color oscurecido a la nariz
            noseMesh.material.color.copy(darkenedColor);
            noseMesh.material.needsUpdate = true;
        }

        // updateNoseCarousel removed


        function changeEarTexture(side, url, isInitialLoad = false) {
            if (!modelParts.head) return;

            loadOptimizedTexture(url,
                (texture) => {
                    const earMesh = side === 'left' ? earLeftMesh : earRightMesh;

                    if (isInitialLoad || !earMesh) {
                        // Creación inicial de la oreja
                        const earMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const planeHeight = 2.256;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const earGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        const newEarMesh = new THREE.Mesh(earGeometry, earMaterial);

                        // Posición y rotación según el lado
                        if (side === 'left') {
                            newEarMesh.position.set(-1.13, 1.029, 0); // Lado izquierdo
                            newEarMesh.rotation.y = Math.PI / 2; // Rotar 90 grados hacia la izquierda
                            newEarMesh.scale.x = -1; // Invertir horizontalmente para oreja izquierda
                            earLeftMesh = newEarMesh;
                        } else {
                            newEarMesh.position.set(1.13, 1.029, 0); // Lado derecho
                            newEarMesh.rotation.y = -Math.PI / 2; // Rotar 90 grados hacia la derecha
                            earRightMesh = newEarMesh;
                        }

                        modelParts.head.add(newEarMesh);
                    } else {
                        // Actualizar textura del mesh existente
                        if (side === 'left' && earLeftMesh) {
                            const oldMap = earLeftMesh.material.map;
                            earLeftMesh.material.map = texture;
                            earLeftMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        } else if (side === 'right' && earRightMesh) {
                            const oldMap = earRightMesh.material.map;
                            earRightMesh.material.map = texture;
                            earRightMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }

                        // Limpiar memoria en móvil
                        if (isMobileDevice) {
                            forceMemoryCleanup();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error(`No se pudo cargar la textura de la oreja ${side}.`, error);
                }
            );
        }

        // updateEarLeftCarousel removed


        // updateEarRightCarousel removed


        // updateEarSideButtons removed


        function changeHairTexture(frontUrl, backUrl, leftUrl, rightUrl, upUrl, isInitialLoad = false) {
            if (!modelParts.head) return;

            // Si frontUrl es null, significa "None" - remover todo el cabello
            if (frontUrl === null) {
                if (hairFrontMesh) {
                    modelParts.head.remove(hairFrontMesh);
                    if (hairFrontMesh.material.map) hairFrontMesh.material.map.dispose();
                    hairFrontMesh.material.dispose();
                    hairFrontMesh.geometry.dispose();
                    hairFrontMesh = null;
                }
                if (hairBackMesh) {
                    modelParts.head.remove(hairBackMesh);
                    if (hairBackMesh.material.map) hairBackMesh.material.map.dispose();
                    hairBackMesh.material.dispose();
                    hairBackMesh.geometry.dispose();
                    hairBackMesh = null;
                }
                if (hairLeftMesh) {
                    modelParts.head.remove(hairLeftMesh);
                    if (hairLeftMesh.material.map) hairLeftMesh.material.map.dispose();
                    hairLeftMesh.material.dispose();
                    hairLeftMesh.geometry.dispose();
                    hairLeftMesh = null;
                }
                if (hairRightMesh) {
                    modelParts.head.remove(hairRightMesh);
                    if (hairRightMesh.material.map) hairRightMesh.material.map.dispose();
                    hairRightMesh.material.dispose();
                    hairRightMesh.geometry.dispose();
                    hairRightMesh = null;
                }
                if (hairUpMesh) {
                    modelParts.head.remove(hairUpMesh);
                    if (hairUpMesh.material.map) hairUpMesh.material.map.dispose();
                    hairUpMesh.material.dispose();
                    hairUpMesh.geometry.dispose();
                    hairUpMesh = null;
                }
                forceMemoryCleanup();
                return;
            }

            // En móviles, eliminar meshes antiguos completamente antes de crear nuevos
            if (isMobileDevice && !isInitialLoad) {
                if (hairFrontMesh) {
                    modelParts.head.remove(hairFrontMesh);
                    if (hairFrontMesh.material.map) hairFrontMesh.material.map.dispose();
                    hairFrontMesh.material.dispose();
                    hairFrontMesh.geometry.dispose();
                    hairFrontMesh = null;
                }
                if (hairBackMesh) {
                    modelParts.head.remove(hairBackMesh);
                    if (hairBackMesh.material.map) hairBackMesh.material.map.dispose();
                    hairBackMesh.material.dispose();
                    hairBackMesh.geometry.dispose();
                    hairBackMesh = null;
                }
                if (hairLeftMesh) {
                    modelParts.head.remove(hairLeftMesh);
                    if (hairLeftMesh.material.map) hairLeftMesh.material.map.dispose();
                    hairLeftMesh.material.dispose();
                    hairLeftMesh.geometry.dispose();
                    hairLeftMesh = null;
                }
                if (hairRightMesh) {
                    modelParts.head.remove(hairRightMesh);
                    if (hairRightMesh.material.map) hairRightMesh.material.map.dispose();
                    hairRightMesh.material.dispose();
                    hairRightMesh.geometry.dispose();
                    hairRightMesh = null;
                }
                if (hairUpMesh) {
                    modelParts.head.remove(hairUpMesh);
                    if (hairUpMesh.material.map) hairUpMesh.material.map.dispose();
                    hairUpMesh.material.dispose();
                    hairUpMesh.geometry.dispose();
                    hairUpMesh = null;
                }
                forceMemoryCleanup();
            }

            // Cargar front hair
            loadOptimizedTexture(frontUrl,
                (texture) => {
                    if (isInitialLoad || !hairFrontMesh) {
                        // Creación inicial del cabello frontal
                        const hairMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const planeHeight = 5.556;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const hairGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        hairFrontMesh = new THREE.Mesh(hairGeometry, hairMaterial);
                        // Posición del cabello frontal
                        hairFrontMesh.position.set(0, 0.563, 1.130);
                        modelParts.head.add(hairFrontMesh);
                    } else {
                        // Solo actualiza la textura si el mesh ya existe
                        const oldMap = hairFrontMesh.material.map;
                        hairFrontMesh.material.map = texture;
                        hairFrontMesh.material.needsUpdate = true;
                        if (oldMap && oldMap !== texture) oldMap.dispose();
                    }
                },
                undefined,
                (error) => {
                    console.error("No se pudo cargar la textura del cabello frontal.", error);
                }
            );

            // Cargar back hair
            loadOptimizedTexture(backUrl,
                (texture) => {
                    if (isInitialLoad || !hairBackMesh) {
                        // Creación inicial del cabello trasero
                        const hairMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const planeHeight = 5.556;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const hairGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        hairBackMesh = new THREE.Mesh(hairGeometry, hairMaterial);
                        // Posición del cabello trasero (detrás de la cabeza)
                        hairBackMesh.position.set(0, 0.563, -1.129);
                        modelParts.head.add(hairBackMesh);
                    } else {
                        // Solo actualiza la textura si el mesh ya existe
                        const oldMap = hairBackMesh.material.map;
                        hairBackMesh.material.map = texture;
                        hairBackMesh.material.needsUpdate = true;
                        if (oldMap && oldMap !== texture) oldMap.dispose();
                    }
                },
                undefined,
                (error) => {
                    console.error("No se pudo cargar la textura del cabello trasero.", error);
                }
            );

            // Cargar left hair (si existe)
            if (leftUrl) {
                loadOptimizedTexture(leftUrl,
                    (texture) => {
                        if (isInitialLoad || !hairLeftMesh) {
                            // Creación inicial del cabello izquierdo (mismo tamaño que ojos)
                            const hairMaterial = new THREE.MeshBasicMaterial({
                                map: texture,
                                transparent: true,
                                side: THREE.DoubleSide,
                                alphaTest: 0.5
                            });
                            const planeHeight = 2.256; // Mismo tamaño que eyes
                            const aspect = texture.image.width / texture.image.height;
                            const planeWidth = planeHeight * aspect;
                            const hairGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                            hairLeftMesh = new THREE.Mesh(hairGeometry, hairMaterial);
                            // Posición del cabello izquierdo (lado izquierdo de la cabeza)
                            hairLeftMesh.position.set(-1.129, 1.029, 0);
                            hairLeftMesh.rotation.y = -Math.PI / 2; // Rotar 90 grados
                            modelParts.head.add(hairLeftMesh);
                        } else {
                            // Solo actualiza la textura si el mesh ya existe
                            const oldMap = hairLeftMesh.material.map;
                            hairLeftMesh.material.map = texture;
                            hairLeftMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }
                    },
                    undefined,
                    (error) => {
                        console.error("No se pudo cargar la textura del cabello izquierdo.", error);
                    }
                );
            }

            // Cargar right hair (si existe)
            if (rightUrl) {
                loadOptimizedTexture(rightUrl,
                    (texture) => {
                        if (isInitialLoad || !hairRightMesh) {
                            // Creación inicial del cabello derecho (mismo tamaño que ojos)
                            const hairMaterial = new THREE.MeshBasicMaterial({
                                map: texture,
                                transparent: true,
                                side: THREE.DoubleSide,
                                alphaTest: 0.5
                            });
                            const planeHeight = 2.256; // Mismo tamaño que eyes
                            const aspect = texture.image.width / texture.image.height;
                            const planeWidth = planeHeight * aspect;
                            const hairGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                            hairRightMesh = new THREE.Mesh(hairGeometry, hairMaterial);
                            // Posición del cabello derecho (lado derecho de la cabeza)
                            hairRightMesh.position.set(1.129, 1.029, 0);
                            hairRightMesh.rotation.y = Math.PI / 2; // Rotar -90 grados
                            modelParts.head.add(hairRightMesh);
                        } else {
                            // Solo actualiza la textura si el mesh ya existe
                            const oldMap = hairRightMesh.material.map;
                            hairRightMesh.material.map = texture;
                            hairRightMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }
                    },
                    undefined,
                    (error) => {
                        console.error("No se pudo cargar la textura del cabello derecho.", error);
                    }
                );
            }

            // Cargar up hair (si existe)
            if (upUrl) {
                loadOptimizedTexture(upUrl,
                    (texture) => {
                        if (isInitialLoad || !hairUpMesh) {
                            // Creación inicial del cabello superior (como techo, mismo tamaño que eyes)
                            const hairMaterial = new THREE.MeshBasicMaterial({
                                map: texture,
                                transparent: true,
                                side: THREE.DoubleSide,
                                alphaTest: 0.5
                            });
                            const planeHeight = 2.256; // Mismo tamaño que eyes
                            const aspect = texture.image.width / texture.image.height;
                            const planeWidth = planeHeight * aspect;
                            const hairGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                            hairUpMesh = new THREE.Mesh(hairGeometry, hairMaterial);
                            // Posición del cabello superior (arriba de la cabeza, rotado para ser horizontal)
                            hairUpMesh.position.set(0, 2.157, 0);
                            hairUpMesh.rotation.x = -Math.PI / 2; // Rotar 90 grados para que sea horizontal
                            modelParts.head.add(hairUpMesh);
                        } else {
                            // Solo actualiza la textura si el mesh ya existe
                            const oldMap = hairUpMesh.material.map;
                            hairUpMesh.material.map = texture;
                            hairUpMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }
                    },
                    undefined,
                    (error) => {
                        console.error("No se pudo cargar la textura del cabello superior.", error);
                    }
                );
            }
        }

        // updateHairCarousel removed


        function changeTorsoClothing(frontUrl, backUrl, isInitialLoad = false) {
            if (!modelParts.torso) return;

            // Si frontUrl es null, significa "None" - remover la ropa
            if (frontUrl === null) {
                if (torsoFrontMesh) {
                    modelParts.torso.remove(torsoFrontMesh);
                    if (torsoFrontMesh.material.map) torsoFrontMesh.material.map.dispose();
                    torsoFrontMesh.material.dispose();
                    torsoFrontMesh.geometry.dispose();
                    torsoFrontMesh = null;
                }
                if (torsoBackMesh) {
                    modelParts.torso.remove(torsoBackMesh);
                    if (torsoBackMesh.material.map) torsoBackMesh.material.map.dispose();
                    torsoBackMesh.material.dispose();
                    torsoBackMesh.geometry.dispose();
                    torsoBackMesh = null;
                }
                forceMemoryCleanup();
                return;
            }

            // En móviles, eliminar meshes antiguos completamente antes de crear nuevos
            if (isMobileDevice && !isInitialLoad) {
                if (torsoFrontMesh) {
                    modelParts.torso.remove(torsoFrontMesh);
                    if (torsoFrontMesh.material.map) torsoFrontMesh.material.map.dispose();
                    torsoFrontMesh.material.dispose();
                    torsoFrontMesh.geometry.dispose();
                    torsoFrontMesh = null;
                }
                if (torsoBackMesh) {
                    modelParts.torso.remove(torsoBackMesh);
                    if (torsoBackMesh.material.map) torsoBackMesh.material.map.dispose();
                    torsoBackMesh.material.dispose();
                    torsoBackMesh.geometry.dispose();
                    torsoBackMesh = null;
                }
                forceMemoryCleanup();
            }

            // Cargar textura frontal del torso
            loadOptimizedTexture(frontUrl,
                (texture) => {
                    if (isInitialLoad || !torsoFrontMesh) {
                        const clothingMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const planeHeight = 2.145;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const clothingGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        torsoFrontMesh = new THREE.Mesh(clothingGeometry, clothingMaterial);
                        torsoFrontMesh.position.set(0, -1.176, 0.453); // Torso frontal
                        modelParts.torso.add(torsoFrontMesh);
                    } else {
                        const oldMap = torsoFrontMesh.material.map;
                        torsoFrontMesh.material.map = texture;
                        torsoFrontMesh.material.needsUpdate = true;
                        if (oldMap && oldMap !== texture) oldMap.dispose();
                    }
                },
                undefined,
                (error) => {
                    console.error("No se pudo cargar la textura frontal del torso.", error);
                }
            );

            // Cargar textura trasera del torso
            loadOptimizedTexture(backUrl,
                (texture) => {
                    if (isInitialLoad || !torsoBackMesh) {
                        const clothingMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const planeHeight = 2.145;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const clothingGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        torsoBackMesh = new THREE.Mesh(clothingGeometry, clothingMaterial);
                        torsoBackMesh.position.set(0, -1.176, -0.453); // Torso trasero (Z invertido)
                        modelParts.torso.add(torsoBackMesh);
                    } else {
                        const oldMap = torsoBackMesh.material.map;
                        torsoBackMesh.material.map = texture;
                        torsoBackMesh.material.needsUpdate = true;
                        if (oldMap && oldMap !== texture) oldMap.dispose();
                    }
                },
                undefined,
                (error) => {
                    console.error("No se pudo cargar la textura trasera del torso.", error);
                }
            );
        }

        function changeLegClothing(side, url, isInitialLoad = false) {
            if (modelParts.legs.length < 2) return;

            const leftLeg = modelParts.legs.find(leg => leg.name.toLowerCase().includes('l'));
            const rightLeg = modelParts.legs.find(leg => leg.name.toLowerCase().includes('r'));

            if (!leftLeg || !rightLeg) return;

            const targetLeg = side === 'left' ? leftLeg : rightLeg;
            const targetFrontMesh = side === 'left' ? legLeftFrontMesh : legRightFrontMesh;
            const targetBackMesh = side === 'left' ? legLeftBackMesh : legRightBackMesh;

            // Si url es null, significa "None" - remover el estilo
            if (url === null) {
                if (targetFrontMesh) {
                    targetLeg.remove(targetFrontMesh);
                    if (targetFrontMesh.material.map) targetFrontMesh.material.map.dispose();
                    targetFrontMesh.material.dispose();
                    targetFrontMesh.geometry.dispose();
                    if (side === 'left') {
                        legLeftFrontMesh = null;
                    } else {
                        legRightFrontMesh = null;
                    }
                }
                if (targetBackMesh) {
                    targetLeg.remove(targetBackMesh);
                    if (targetBackMesh.material.map) targetBackMesh.material.map.dispose();
                    targetBackMesh.material.dispose();
                    targetBackMesh.geometry.dispose();
                    if (side === 'left') {
                        legLeftBackMesh = null;
                    } else {
                        legRightBackMesh = null;
                    }
                }
                forceMemoryCleanup();
                return;
            }

            // En móviles, eliminar meshes antiguos completamente antes de crear nuevos
            if (isMobileDevice && !isInitialLoad) {
                if (targetFrontMesh) {
                    targetLeg.remove(targetFrontMesh);
                    if (targetFrontMesh.material.map) targetFrontMesh.material.map.dispose();
                    targetFrontMesh.material.dispose();
                    targetFrontMesh.geometry.dispose();
                    if (side === 'left') {
                        legLeftFrontMesh = null;
                    } else {
                        legRightFrontMesh = null;
                    }
                }
                if (targetBackMesh) {
                    targetLeg.remove(targetBackMesh);
                    if (targetBackMesh.material.map) targetBackMesh.material.map.dispose();
                    targetBackMesh.material.dispose();
                    targetBackMesh.geometry.dispose();
                    if (side === 'left') {
                        legLeftBackMesh = null;
                    } else {
                        legRightBackMesh = null;
                    }
                }
                forceMemoryCleanup();
            }

            // Cargar textura de pierna (front)
            loadOptimizedTexture(url,
                (texture) => {
                    if (isInitialLoad || !targetFrontMesh) {
                        // Creación inicial del estilo de pierna frontal
                        const clothingMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const planeHeight = 2.145;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const clothingGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        const newMesh = new THREE.Mesh(clothingGeometry, clothingMaterial);

                        // Posición según el lado - front leg (relativa a cada pierna)
                        if (side === 'left') {
                            newMesh.position.set(0, -1.176, 0.452); // Pierna izquierda frontal
                            legLeftFrontMesh = newMesh;
                        } else {
                            newMesh.position.set(0, -1.176, 0.452); // Pierna derecha frontal
                            newMesh.rotation.y = Math.PI; // Rotar 180 grados
                            legRightFrontMesh = newMesh;
                        }

                        targetLeg.add(newMesh);
                    } else {
                        if (side === 'left' && legLeftFrontMesh) {
                            const oldMap = legLeftFrontMesh.material.map;
                            legLeftFrontMesh.material.map = texture;
                            legLeftFrontMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        } else if (side === 'right' && legRightFrontMesh) {
                            const oldMap = legRightFrontMesh.material.map;
                            legRightFrontMesh.material.map = texture;
                            legRightFrontMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error(`No se pudo cargar la textura frontal de la pierna ${side}.`, error);
                }
            );

            // Cargar textura de pierna (back) - duplicado
            loadOptimizedTexture(url,
                (texture) => {
                    if (isInitialLoad || !targetBackMesh) {
                        // Creación inicial del estilo de pierna trasera (duplicado)
                        const clothingMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const planeHeight = 2.145;
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = planeHeight * aspect;
                        const clothingGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        const newMesh = new THREE.Mesh(clothingGeometry, clothingMaterial);

                        // Posición según el lado - back leg (detrás, relativa a cada pierna)
                        if (side === 'left') {
                            newMesh.position.set(0, -1.176, -0.452); // Pierna izquierda trasera
                            legLeftBackMesh = newMesh;
                        } else {
                            newMesh.position.set(0, -1.176, -0.452); // Pierna derecha trasera
                            newMesh.rotation.y = Math.PI; // Rotar 180 grados
                            legRightBackMesh = newMesh;
                        }

                        targetLeg.add(newMesh);
                    } else {
                        if (side === 'left' && legLeftBackMesh) {
                            const oldMap = legLeftBackMesh.material.map;
                            legLeftBackMesh.material.map = texture;
                            legLeftBackMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        } else if (side === 'right' && legRightBackMesh) {
                            const oldMap = legRightBackMesh.material.map;
                            legRightBackMesh.material.map = texture;
                            legRightBackMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error(`No se pudo cargar la textura trasera de la pierna ${side}.`, error);
                }
            );
        }

        // updateLeg functions removed


        function changeArmClothing(side, url, isInitialLoad = false) {
            if (modelParts.arms.length < 2) return;

            const leftArm = modelParts.arms.find(arm => arm.name.toLowerCase().includes('l'));
            const rightArm = modelParts.arms.find(arm => arm.name.toLowerCase().includes('r'));

            if (!leftArm || !rightArm) return;

            // La imagen del brazo izquierdo sigue al brazo derecho, la imagen del brazo derecho sigue al brazo izquierdo
            const targetArm = side === 'left' ? rightArm : leftArm;
            const targetFrontMesh = side === 'left' ? armLeftFrontMesh : armRightFrontMesh;
            const targetBackMesh = side === 'left' ? armLeftBackMesh : armRightBackMesh;

            // Posiciones y tamaño unificados para front y back
            const armPositions = {
                left: { x: -1.288, y: -0.934, zFront: -0.001, zBack: 0.006 },
                right: { x: -1.288, y: -0.934, zFront: 0.001, zBack: -0.006 }
            };
            const armSize = 1.677; // Tamaño unificado para ambos brazos (frontal y trasero)
            const pos = armPositions[side];

            // Si url es null, significa "None" - remover el estilo
            if (url === null) {
                if (targetFrontMesh) {
                    targetArm.remove(targetFrontMesh);
                    if (targetFrontMesh.material.map) targetFrontMesh.material.map.dispose();
                    targetFrontMesh.material.dispose();
                    targetFrontMesh.geometry.dispose();
                    if (side === 'left') {
                        armLeftFrontMesh = null;
                    } else {
                        armRightFrontMesh = null;
                    }
                }
                if (targetBackMesh) {
                    targetArm.remove(targetBackMesh);
                    if (targetBackMesh.material.map) targetBackMesh.material.map.dispose();
                    targetBackMesh.material.dispose();
                    targetBackMesh.geometry.dispose();
                    if (side === 'left') {
                        armLeftBackMesh = null;
                    } else {
                        armRightBackMesh = null;
                    }
                }
                forceMemoryCleanup();
                return;
            }

            // En móviles, eliminar meshes antiguos completamente antes de crear nuevos
            if (isMobileDevice && !isInitialLoad) {
                if (targetFrontMesh) {
                    targetArm.remove(targetFrontMesh);
                    if (targetFrontMesh.material.map) targetFrontMesh.material.map.dispose();
                    targetFrontMesh.material.dispose();
                    targetFrontMesh.geometry.dispose();
                    if (side === 'left') {
                        armLeftFrontMesh = null;
                    } else {
                        armRightFrontMesh = null;
                    }
                }
                if (targetBackMesh) {
                    targetArm.remove(targetBackMesh);
                    if (targetBackMesh.material.map) targetBackMesh.material.map.dispose();
                    targetBackMesh.material.dispose();
                    targetBackMesh.geometry.dispose();
                    if (side === 'left') {
                        armLeftBackMesh = null;
                    } else {
                        armRightBackMesh = null;
                    }
                }
                forceMemoryCleanup();
            }

            // Cargar textura de brazo (front)
            loadOptimizedTexture(url,
                (texture) => {
                    if (isInitialLoad || !targetFrontMesh) {
                        const clothingMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = armSize * aspect;
                        const clothingGeometry = new THREE.PlaneGeometry(planeWidth, armSize);
                        const newMesh = new THREE.Mesh(clothingGeometry, clothingMaterial);

                        // Posición según el lado - front arm (usa posición unificada)
                        newMesh.position.set(pos.x, pos.y, pos.zFront);
                        if (side === 'left') {
                            newMesh.rotation.y = Math.PI; // 180 grados en el eje Y
                            armLeftFrontMesh = newMesh;
                        } else {
                            newMesh.rotation.y = 0; // Sin rotación
                            armRightFrontMesh = newMesh;
                        }

                        targetArm.add(newMesh);
                    } else {
                        if (side === 'left' && armLeftFrontMesh) {
                            const oldMap = armLeftFrontMesh.material.map;
                            armLeftFrontMesh.material.map = texture;
                            armLeftFrontMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        } else if (side === 'right' && armRightFrontMesh) {
                            const oldMap = armRightFrontMesh.material.map;
                            armRightFrontMesh.material.map = texture;
                            armRightFrontMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error(`No se pudo cargar la textura frontal del brazo ${side}.`, error);
                }
            );

            // Cargar textura de brazo (back) - duplicado
            loadOptimizedTexture(url,
                (texture) => {
                    if (isInitialLoad || !targetBackMesh) {
                        const clothingMaterial = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.5
                        });
                        const aspect = texture.image.width / texture.image.height;
                        const planeWidth = armSize * aspect;
                        const clothingGeometry = new THREE.PlaneGeometry(planeWidth, armSize);
                        const newMesh = new THREE.Mesh(clothingGeometry, clothingMaterial);

                        // Posición según el lado - back arm (usa posición unificada)
                        newMesh.position.set(pos.x, pos.y, pos.zBack);
                        if (side === 'left') {
                            newMesh.rotation.y = Math.PI; // 180 grados en el eje Y
                            armLeftBackMesh = newMesh;
                        } else {
                            newMesh.rotation.y = 0; // Sin rotación
                            armRightBackMesh = newMesh;
                        }

                        targetArm.add(newMesh);
                    } else {
                        if (side === 'left' && armLeftBackMesh) {
                            const oldMap = armLeftBackMesh.material.map;
                            armLeftBackMesh.material.map = texture;
                            armLeftBackMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        } else if (side === 'right' && armRightBackMesh) {
                            const oldMap = armRightBackMesh.material.map;
                            armRightBackMesh.material.map = texture;
                            armRightBackMesh.material.needsUpdate = true;
                            if (oldMap && oldMap !== texture) oldMap.dispose();
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error(`No se pudo cargar la textura trasera del brazo ${side}.`, error);
                }
            );
        }

        // updateArm functions removed


        // updateTorsoClothingCarousel removed


        // updatePaletteDOM removed


        // Sliders de personalización de color
        const hueSlider = document.getElementById('hue-slider');
        const lightnessSlider = document.getElementById('lightness-slider');
        let colorTargetPart = 'all';

        // Part selection logic
        const partButtons = document.querySelectorAll('.part-btn');
        partButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                partButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                colorTargetPart = btn.dataset.part;
            });
        });

        function applyCustomColor() {
            isCustomSkinColorSelected = true;
            const hue = hueSlider.value;
            const lightness = lightnessSlider.value;
            const saturation = 70; // Saturación fija para colores vibrantes

            // Convertir HSL a Hex
            const hslToHex = (h, s, l) => {
                l /= 100;
                const a = s * Math.min(l, 1 - l) / 100;
                const f = n => {
                    const k = (n + h / 30) % 12;
                    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                    return Math.round(255 * color).toString(16).padStart(2, '0');
                };
                return `#${f(0)}${f(8)}${f(4)}`;
            };

            const customColor = hslToHex(hue, saturation, lightness);
            const colorHex = parseInt(customColor.replace('#', '0x'), 16);
            const colorObj = new THREE.Color(colorHex);

            if (!loadedModel) return;

            // Helper to apply color to a mesh and its children, excluding textures
            const applyToPart = (mesh) => {
                if (!mesh) return;
                const textureMeshes = [
                    eyesMesh, eyebrowsMesh, noseMesh, earLeftMesh, earRightMesh,
                    hairFrontMesh, hairBackMesh, hairLeftMesh, hairRightMesh, hairUpMesh,
                    torsoFrontMesh, torsoBackMesh,
                    armLeftFrontMesh, armLeftBackMesh, armRightFrontMesh, armRightBackMesh,
                    legLeftFrontMesh, legLeftBackMesh, legRightFrontMesh, legRightBackMesh
                ];

                mesh.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (textureMeshes.includes(child)) return;
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => { if (mat.color) mat.color.copy(colorObj); });
                        } else {
                            child.material.color.copy(colorObj);
                        }
                    }
                });
            };

            // Aplicar el color según la parte seleccionada
            switch (colorTargetPart) {
                case 'all':
                    if (modelParts.head) {
                        applyToPart(modelParts.head);
                        applyNoseColor(colorHex);
                    }
                    if (modelParts.torso) applyToPart(modelParts.torso);
                    if (modelParts.arms) modelParts.arms.forEach(arm => applyToPart(arm));
                    if (modelParts.legs) modelParts.legs.forEach(leg => applyToPart(leg));
                    if (modelParts.ears) modelParts.ears.forEach(ear => applyToPart(ear));
                    break;
                case 'head':
                    if (modelParts.head) {
                        applyToPart(modelParts.head);
                        applyNoseColor(colorHex);
                    }
                    if (modelParts.ears) modelParts.ears.forEach(ear => applyToPart(ear));
                    break;
                case 'torso':
                    if (modelParts.torso) applyToPart(modelParts.torso);
                    break;
                case 'arm-l':
                    if (modelParts.arms) {
                        const leftArm = modelParts.arms.find(a => a.name.toLowerCase().includes('l'));
                        if (leftArm) applyToPart(leftArm);
                    }
                    break;
                case 'arm-r':
                    if (modelParts.arms) {
                        const rightArm = modelParts.arms.find(a => a.name.toLowerCase().includes('r'));
                        if (rightArm) applyToPart(rightArm);
                    }
                    break;
                case 'leg-l':
                    if (modelParts.legs) {
                        const leftLeg = modelParts.legs.find(l => l.name.toLowerCase().includes('l'));
                        if (leftLeg) applyToPart(leftLeg);
                    }
                    break;
                case 'leg-r':
                    if (modelParts.legs) {
                        const rightLeg = modelParts.legs.find(l => l.name.toLowerCase().includes('r'));
                        if (rightLeg) applyToPart(rightLeg);
                    }
                    break;
            }
        }

        hueSlider.addEventListener('input', applyCustomColor);
        lightnessSlider.addEventListener('input', applyCustomColor);

        window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
        window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });
        // Resize unificado: la lógica de redimensionado se maneja en el handler con debounce más abajo

        const moveSpeed = 5, turnSpeed = 3, jumpHeight = 10, gravity = -30;
        function handlePlayerControls(dt) {
            if (!loadedModel) return;

            // Manejar salto (teclado o botón móvil)
            if (keys[' '] && !isJumping) { isJumping = true; yVelocity = jumpHeight; }
            if (isJumping) {
                yVelocity += gravity * dt;
                loadedModel.position.y += yVelocity * dt;
                if (loadedModel.position.y <= groundY) {
                    loadedModel.position.y = groundY;
                    isJumping = false;
                    yVelocity = 0;
                }
            }

            // Controles de teclado
            if (keys.ArrowLeft) loadedModel.rotation.y += turnSpeed * dt;
            if (keys.ArrowRight) loadedModel.rotation.y -= turnSpeed * dt;
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(loadedModel.quaternion);
            if (keys.ArrowUp) loadedModel.position.add(forward.multiplyScalar(moveSpeed * dt));
            if (keys.ArrowDown) loadedModel.position.add(forward.multiplyScalar(-moveSpeed * dt));

            // Controles de joystick móvil
            if (joystickActive) {
                // Rotación basada en el eje X del joystick
                if (Math.abs(joystickVector.x) > 0.1) {
                    loadedModel.rotation.y -= joystickVector.x * turnSpeed * dt;
                }

                // Movimiento adelante/atrás basado en el eje Y del joystick
                if (Math.abs(joystickVector.y) > 0.1) {
                    const forwardJoy = new THREE.Vector3(0, 0, 1).applyQuaternion(loadedModel.quaternion);
                    loadedModel.position.add(forwardJoy.multiplyScalar(joystickVector.y * moveSpeed * dt));
                }
            }
        }

        const cameraDistance = 8;  // Aumentado para mejor vista
        const cameraHeight = 4;    // Aumentado para vista lateral hacia arriba (no desde arriba)

        function updatePlayCamera() {
            if (!loadedModel) return;

            // No actualizar cámara durante animación circular
            if (isCircularCameraAnimation) return;

            // En modo juego con OrbitControls activos:
            // - Mantener offset del modo juego: (0.0000061, 1.5, -5) desde el modelo
            // - Seguir al modelo en X y Z según el ángulo actual de la cámara
            // - Permitir rotación horizontal libre
            if (controls.enabled) {
                // Calcular el ángulo horizontal actual de la cámara respecto al modelo
                const modelPos = loadedModel.position.clone();
                const camPos = camera.position.clone();
                const relativePos = camPos.sub(modelPos);
                const currentAzimuth = Math.atan2(relativePos.x, relativePos.z);

                // Calcular nueva posición manteniendo el ángulo pero siguiendo al modelo
                // Radio fijo de 5 unidades (distancia desde el modelo)
                const radius = 5;
                const offsetX = Math.sin(currentAzimuth) * radius;
                const offsetZ = Math.cos(currentAzimuth) * radius;

                // Posición deseada = posición del modelo + offset rotado
                const desiredPos = loadedModel.position.clone();
                desiredPos.x += offsetX;
                desiredPos.y += 1.5; // Altura fija relativa al modelo
                desiredPos.z += offsetZ;

                // Actualizar posición de cámara
                camera.position.lerp(desiredPos, 0.1);

                // Target siempre sigue al modelo
                const lookAtPos = loadedModel.position.clone();
                lookAtPos.y = modelCenter.y;
                controls.target.lerp(lookAtPos, 0.1);

                return;
            }

            // Código original solo se ejecuta si controls están desactivados
            // Interpolar suavemente el ángulo actual hacia el ángulo objetivo
            if (isCameraTransitioning) {
                const angleDiff = targetCameraAngle - cameraAngle;
                cameraAngle += angleDiff * 0.1; // Interpolación suave

                // Si estamos muy cerca del objetivo, finalizar la transición
                if (Math.abs(angleDiff) < 0.01) {
                    cameraAngle = targetCameraAngle;
                    isCameraTransitioning = false;
                }
            }

            // Calcular la posición de la cámara basada en el ángulo y la rotación del modelo
            const modelRotation = loadedModel.rotation.y;
            const totalAngle = modelRotation + cameraAngle;

            // Posición relativa de la cámara (girando alrededor del eje Y)
            const offsetX = Math.sin(totalAngle) * cameraDistance;
            const offsetZ = Math.cos(totalAngle) * cameraDistance;

            const desiredPos = loadedModel.position.clone();
            desiredPos.x += offsetX;
            desiredPos.y += cameraHeight;
            desiredPos.z += offsetZ;

            camera.position.lerp(desiredPos, 0.1);

            const lookAtPos = loadedModel.position.clone();
            lookAtPos.y = modelCenter.y;
            controls.target.lerp(lookAtPos, 0.1);
        }


        // Handler de resize optimizado y unificado con debounce
        let resizeTimeout;

        function onWindowResize() {
            const isMobile = window.innerWidth <= 1024;
            const isCustomizationActive = document.body.classList.contains('customization-active');

            // Ajustar visibilidad de paneles según modo y tamaño
            if (appMode === 'play' && isMobile) {
                editorPanelWrapper.classList.add('hidden-mobile');
                mobileGameControls.classList.add('active');
            } else if (appMode === 'edit' && isMobile) {
                editorPanelWrapper.classList.remove('hidden-mobile');
                mobileGameControls.classList.remove('active');
            } else if (!isMobile) {
                mobileGameControls.classList.remove('active');
            }

            // Ajustar cámara y renderer según contexto
            if (isCustomizationActive) {
                // En modo customización, el CSS controla el tamaño del contenedor
                // Usamos resizeToCanvasContainer para ajustar el renderer a ese tamaño
                resizeToCanvasContainer();
            } else if (isShowcaseActive) {
                const showcaseHeight = window.innerHeight * 0.6667;
                camera.fov = window.innerWidth <= 768 ? 50 : 75;
                camera.aspect = window.innerWidth / showcaseHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, showcaseHeight);
            } else {
                camera.fov = 75;
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(onWindowResize, 150);
        });

        const clock = new THREE.Clock();
        const animationSpeed = 10, animationAmplitude = 0.6;

        // Cache de referencias a extremidades para evitar find() en cada frame
        let cachedLimbs = null;

        function cacheLimbReferences() {
            if (modelParts.arms.length >= 2 && modelParts.legs.length >= 2) {
                cachedLimbs = {
                    leftArm: modelParts.arms.find(arm => arm.name.toLowerCase().includes('l')),
                    rightArm: modelParts.arms.find(arm => arm.name.toLowerCase().includes('r')),
                    leftLeg: modelParts.legs.find(leg => leg.name.toLowerCase().includes('l')),
                    rightLeg: modelParts.legs.find(leg => leg.name.toLowerCase().includes('r'))
                };
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1); // Limitar dt para evitar grandes saltos

            // Actualizar showcase si está activo
            updateShowcaseRotation();

            if (appMode === 'play') {
                handlePlayerControls(dt);
                updatePlayCamera();
            }

            // Lógica de animación de caminar optimizada
            if (loadedModel && cachedLimbs) {
                const isMoving = appMode === 'play' && (keys.ArrowUp || keys.ArrowDown || (joystickActive && Math.abs(joystickVector.y) > 0.1));
                const { leftArm, rightArm, leftLeg, rightLeg } = cachedLimbs;

                if (leftArm && rightArm && leftLeg && rightLeg) {
                    if (isMoving) {
                        const elapsedTime = clock.getElapsedTime();
                        const angle = Math.sin(elapsedTime * animationSpeed) * animationAmplitude;
                        const initialLeftArmRot = initialTransforms.get(leftArm).rotation;
                        const initialRightArmRot = initialTransforms.get(rightArm).rotation;
                        const initialLeftLegRot = initialTransforms.get(leftLeg).rotation;
                        const initialRightLegRot = initialTransforms.get(rightLeg).rotation;
                        // Pierna derecha adelante, brazo izquierdo adelante
                        rightLeg.rotation.x = initialRightLegRot.x + angle;
                        leftArm.rotation.x = initialLeftArmRot.x - angle;
                        // Pierna izquierda adelante, brazo derecho adelante
                        leftLeg.rotation.x = initialLeftLegRot.x - angle;
                        rightArm.rotation.x = initialRightArmRot.x + angle;
                    } else {
                        // Volver a la pose original
                        const limbsArray = [leftArm, rightArm, leftLeg, rightLeg];
                        for (let i = 0; i < 4; i++) {
                            const limb = limbsArray[i];
                            const initial = initialTransforms.get(limb);
                            if (initial) {
                                limb.rotation.x = THREE.MathUtils.lerp(limb.rotation.x, initial.rotation.x, 0.1);
                                limb.rotation.y = THREE.MathUtils.lerp(limb.rotation.y, initial.rotation.y, 0.1);
                                limb.rotation.z = THREE.MathUtils.lerp(limb.rotation.z, initial.rotation.z, 0.1);
                            }
                        }
                    }
                }
            }

            // Animación circular de cámara (giro lateral)
            if (isCircularCameraAnimation) {
                // Duración dinámica basada en el tiempo objetivo
                const animDuration = circularAnimTargetDuration || 1.5;
                circularAnimProgress += dt / animDuration;

                if (circularAnimProgress >= 1.0) {
                    circularAnimProgress = 1.0;
                    isCircularCameraAnimation = false;

                    // Al terminar la animación
                    if (appMode === 'play') {
                        // Modo juego: configurar cameraAngle para que updatePlayCamera mantenga la posición
                        if (loadedModel) {
                            const camPos = camera.position.clone();
                            const modelPos = loadedModel.position.clone();
                            const relativePos = camPos.sub(modelPos);
                            cameraAngle = Math.atan2(relativePos.x, relativePos.z) - loadedModel.rotation.y;
                            targetCameraAngle = cameraAngle;
                        }
                    } else {
                        // Modo presets: restaurar posición y target exactos guardados
                        if (savedPresetCameraPos && savedPresetCameraTarget) {
                            camera.position.copy(savedPresetCameraPos);
                            controls.target.copy(savedPresetCameraTarget);
                        }
                    }
                }

                // Interpolación suave con easing (ease-in-out)
                const t = circularAnimProgress;
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                // Calcular ángulo actual interpolado
                const currentAnimAngle = circularAnimStartAngle + (circularAnimTargetAngle - circularAnimStartAngle) * eased;

                // Actualizar posición de cámara en círculo
                camera.position.x = circularAnimRadius * Math.sin(currentAnimAngle);
                camera.position.y = circularAnimHeight;
                camera.position.z = circularAnimRadius * Math.cos(currentAnimAngle);

                // Mantener cámara mirando al centro del modelo
                controls.target.copy(modelCenter);
            }

            // Animación lineal de cámara (para otros casos)
            if (isAnimatingCamera) {
                camera.position.lerp(cameraTargetPos, 0.1);
                controls.target.lerp(controlsTargetPos, 0.1);
                if (camera.position.distanceTo(cameraTargetPos) < 0.1) {
                    isAnimatingCamera = false;
                    camera.position.copy(cameraTargetPos);
                    controls.target.copy(controlsTargetPos);
                }
            }

            controls.update();
            renderer.render(scene, camera);
        }


        // --- DYNAMIC PRESET BUTTON COLORING ---
        function rgbToHsl(r, g, b) {
            r /= 255, g /= 255, b /= 255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h, s, l = (max + min) / 2;

            if (max == min) {
                h = s = 0; // achromatic
            } else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [h * 360, s * 100, l * 100];
        }

        function analyzeTertiaryColor(imageUrl) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = imageUrl;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 50;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, size, size);

                    const imageData = ctx.getImageData(0, 0, size, size).data;
                    const colorCounts = {};
                    const bucketSize = 10;

                    for (let i = 0; i < imageData.length; i += 4) {
                        const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2], a = imageData[i + 3];
                        if (a < 128) continue;
                        const qr = Math.round(r / bucketSize) * bucketSize;
                        const qg = Math.round(g / bucketSize) * bucketSize;
                        const qb = Math.round(b / bucketSize) * bucketSize;
                        const key = `${qr},${qg},${qb}`;
                        colorCounts[key] = (colorCounts[key] || 0) + 1;
                    }

                    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);

                    const isVeryLight = (c) => {
                        const [r, g, b] = c.split(',').map(Number);
                        return r > 220 && g > 220 && b > 220;
                    };

                    const filteredColors = sortedColors.filter(c => !isVeryLight(c[0]));

                    let resultColor;
                    if (filteredColors.length >= 3) {
                        resultColor = filteredColors[2][0];
                    } else if (filteredColors.length >= 2) {
                        resultColor = filteredColors[1][0];
                    } else if (filteredColors.length >= 1) {
                        resultColor = filteredColors[0][0];
                    } else {
                        resultColor = "255,255,255";
                    }

                    const [fr, fg, fb] = resultColor.split(',').map(Number);
                    resolve({ r: fr, g: fg, b: fb });
                };
                img.onerror = reject;
            });
        }

        async function applyDynamicPresetColors() {
            if (typeof presetIcons === 'undefined') {
                setTimeout(applyDynamicPresetColors, 100);
                return;
            }

            const buttons = document.querySelectorAll('.preset-character-btn');
            for (const btn of buttons) {
                const idPart = btn.id.replace('preset-', '').replace('-btn', '');
                const name = idPart.charAt(0).toUpperCase() + idPart.slice(1);
                const iconUrl = presetIcons[name];
                if (!iconUrl) continue;

                try {
                    const rgb = await analyzeTertiaryColor(iconUrl);
                    const inner = btn.querySelector('.button-inner');
                    if (inner) {
                        inner.style.backgroundImage = 'none';
                        inner.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                    }
                } catch (e) {
                    console.warn(`Could not analyze color for ${name}:`, e);
                }
            }
        }

        // Run on load
        window.addEventListener('load', applyDynamicPresetColors);

        // Funciones para el showcase inicial
        // UI Elements moved to top
        function getRandomColor() {
            const hue = Math.floor(Math.random() * 360);
            const saturation = 50 + Math.floor(Math.random() * 50); // 50-100%
            const lightness = 40 + Math.floor(Math.random() * 30); // 40-70%
            return new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }

        function applyRandomColorToPart(part, isHead = false) {
            if (!part) return;
            const randomColor = getRandomColor();

            // Lista de meshes de texturas SVG que NO deben cambiar de color
            // NOTA: noseMesh NO está en esta lista porque debe cambiar con la cabeza
            const svgTextureMeshes = [
                eyesMesh,
                eyebrowsMesh,
                // noseMesh, // EXCLUIDO: la nariz debe cambiar de color con la cabeza
                earLeftMesh,
                earRightMesh,
                hairFrontMesh,
                hairBackMesh,
                hairLeftMesh,
                hairRightMesh,
                hairUpMesh,
                torsoFrontMesh,
                torsoBackMesh,
                armLeftFrontMesh,
                armLeftBackMesh,
                armRightFrontMesh,
                armRightBackMesh,
                legLeftFrontMesh,
                legLeftBackMesh,
                legRightFrontMesh,
                legRightBackMesh
            ];

            part.traverse((child) => {
                // Excluir meshes de texturas SVG del cambio de color (excepto nariz)
                if (svgTextureMeshes.includes(child)) {
                    return; // Saltar este mesh
                }

                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.color) mat.color.copy(randomColor);
                        });
                    } else if (child.material.color) {
                        child.material.color.copy(randomColor);
                    }
                }
            });

            // IMPORTANTE: Restaurar color blanco en texturas SVG para mantener colores originales
            // (excepto nariz que se maneja abajo)
            svgTextureMeshes.forEach(mesh => {
                if (mesh && mesh.material && mesh.material.color) {
                    mesh.material.color.setHex(0xffffff); // Blanco = colores originales del SVG
                    mesh.material.needsUpdate = true;
                }
            });

            // EXCEPCIÓN: Si es la cabeza, aplicar color oscurecido (50%) a la nariz
            if (isHead && noseMesh) {
                const darkenedColor = new THREE.Color(
                    randomColor.r * 0.5,
                    randomColor.g * 0.5,
                    randomColor.b * 0.5
                );
                noseMesh.material.color.copy(darkenedColor);
                noseMesh.material.needsUpdate = true;
            }
        }

        // Funciones para seleccionar texturas aleatorias para showcase
        function getRandomTexture(texturesArray) {
            if (!texturesArray || texturesArray.length === 0) return null;
            return texturesArray[Math.floor(Math.random() * texturesArray.length)];
        }

        function applyRandomEyeTexture() {
            const randomTexture = getRandomTexture(eyeTextures);
            if (randomTexture) {
                currentEyeTextureURL = randomTexture.url;
                changeEyeTexture(randomTexture.url);
            }
        }

        function applyRandomEyebrowTexture() {
            const randomTexture = getRandomTexture(eyebrowTextures);
            if (randomTexture) {
                currentEyebrowTextureURL = randomTexture.url;
                changeEyebrowTexture(randomTexture.url);
            }
        }

        function applyRandomNoseTexture() {
            const randomTexture = getRandomTexture(noseTextures);
            if (randomTexture) {
                currentNoseTextureURL = randomTexture.url;
                changeNoseTexture(randomTexture.url);
            }
        }

        function applyRandomEarTexture() {
            const randomTexture = getRandomTexture(earTextures);
            if (randomTexture) {
                currentEarTextureURL = randomTexture.url;
                changeEarTexture('left', randomTexture.url);
                changeEarTexture('right', randomTexture.url);
            }
        }

        function applyRandomHairTexture() {
            const randomTexture = getRandomTexture(hairTextures);
            if (randomTexture) {
                currentHairFrontURL = randomTexture.frontUrl;
                currentHairBackURL = randomTexture.backUrl;
                currentHairLeftURL = randomTexture.leftUrl;
                currentHairRightURL = randomTexture.rightUrl;
                currentHairUpURL = randomTexture.upUrl;
                changeHairTexture(randomTexture.frontUrl, randomTexture.backUrl, randomTexture.leftUrl, randomTexture.rightUrl, randomTexture.upUrl);
            }
        }

        function applyRandomTorsoTexture() {
            const randomTexture = getRandomTexture(torsoClothingTextures);
            if (randomTexture) {
                currentTorsoFrontURL = randomTexture.frontUrl;
                currentTorsoBackURL = randomTexture.backUrl;
                changeTorsoClothing(randomTexture.frontUrl, randomTexture.backUrl);
            }
        }

        function applyRandomArmTexture(side) {
            const randomTexture = getRandomTexture(armTextures);
            if (randomTexture) {
                if (side === 'left') {
                    currentArmLeftURL = randomTexture.leftUrl;
                } else {
                    currentArmRightURL = randomTexture.rightUrl;
                }
                changeArmClothing(side, side === 'left' ? randomTexture.leftUrl : randomTexture.rightUrl);
            }
        }

        function applyRandomLegTexture(side) {
            const randomTexture = getRandomTexture(legTextures);
            if (randomTexture) {
                if (side === 'left') {
                    currentLegLeftURL = randomTexture.leftUrl;
                } else {
                    currentLegRightURL = randomTexture.rightUrl;
                }
                changeLegClothing(side, side === 'left' ? randomTexture.leftUrl : randomTexture.rightUrl);
            }
        }

        function startShowcase() {
            isShowcaseActive = true;
            showcaseButtonsContainer.classList.remove('hidden');

            // Activar fondo degradado azul
            const showcaseBackground = document.getElementById('showcase-background');
            if (showcaseBackground) showcaseBackground.classList.add('active');

            // Agregar clase al canvas para ajustar su altura
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) canvasContainer.classList.add('showcase-active');

            // Mostrar logo del showcase
            const showcaseLogoContainer = document.getElementById('showcase-logo-container');
            if (showcaseLogoContainer) showcaseLogoContainer.classList.remove('hidden');

            // Mostrar botones de redes sociales
            const socialMediaButtons = document.getElementById('social-media-buttons');
            if (socialMediaButtons) socialMediaButtons.classList.add('active');

            // Ocultar grid y mostrar sombra
            if (typeof gridHelper !== 'undefined') gridHelper.visible = false;
            if (footShadow) footShadow.visible = true;

            // Desactivar controles de cámara (zoom, pan, rotate)
            controls.enabled = false;

            // Ajustar FOV para tamaño óptimo del modelo en showcase
            if (window.innerWidth <= 768) {
                camera.fov = 55; // Móvil: Tamaño moderado del modelo
            } else {
                camera.fov = 60; // Desktop: Tamaño moderado del modelo
            }

            // Ajustar el renderer al tamaño completo de la pantalla
            setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }, 100);

            // Inicializar timers de colores
            const now = Date.now();
            Object.keys(showcaseColorTimers).forEach(key => {
                showcaseColorTimers[key] = now;
            });

            // Inicializar timers de texturas
            Object.keys(showcaseTextureTimers).forEach(key => {
                showcaseTextureTimers[key] = now;
            });

            showcaseCharacterTimer = now;
        }

        function stopShowcase() {
            isShowcaseActive = false;
            showcaseButtonsContainer.classList.add('hidden');

            // Desactivar fondo degradado azul
            const showcaseBackground = document.getElementById('showcase-background');
            if (showcaseBackground) showcaseBackground.classList.remove('active');

            // Remover clase del canvas para restaurar altura completa
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) canvasContainer.classList.remove('showcase-active');

            // Mostrar sombra bajo los pies cuando se sale del showcase
            if (footShadow) footShadow.visible = true;

            // Ocultar logo del showcase
            const showcaseLogoContainer = document.getElementById('showcase-logo-container');
            if (showcaseLogoContainer) showcaseLogoContainer.classList.add('hidden');

            // Ocultar botones de redes sociales
            const socialMediaButtons = document.getElementById('social-media-buttons');
            if (socialMediaButtons) socialMediaButtons.classList.remove('active');

            // Ocultar botones de acciones de presets
            const presetActionButtons = document.getElementById('preset-action-buttons');
            if (presetActionButtons) presetActionButtons.classList.remove('active');

            // Detener rotación del modelo y resetear a 0
            if (loadedModel) {
                loadedModel.rotation.y = 0;
            }

            // NUEVO: Resetear colores del modelo 3D a blanco
            const whiteColor = new THREE.Color(0xffffff);
            if (modelParts.head) {
                modelParts.head.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                if (mat.color) mat.color.copy(whiteColor);
                            });
                        } else {
                            child.material.color.copy(whiteColor);
                        }
                    }
                });
            }
            if (modelParts.torso) {
                modelParts.torso.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                if (mat.color) mat.color.copy(whiteColor);
                            });
                        } else {
                            child.material.color.copy(whiteColor);
                        }
                    }
                });
            }
            modelParts.arms.forEach(arm => {
                if (arm) {
                    arm.traverse((child) => {
                        if (child.isMesh && child.material && child.material.color) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.color) mat.color.copy(whiteColor);
                                });
                            } else {
                                child.material.color.copy(whiteColor);
                            }
                        }
                    });
                }
            });
            modelParts.legs.forEach(leg => {
                if (leg) {
                    leg.traverse((child) => {
                        if (child.isMesh && child.material && child.material.color) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.color) mat.color.copy(whiteColor);
                                });
                            } else {
                                child.material.color.copy(whiteColor);
                            }
                        }
                    });
                }
            });

            // NUEVO: Resetear todas las texturas SVG faciales a "None" (modelo totalmente en blanco)
            // Ojos: eliminar mesh y limpiar referencia/URL
            currentEyeTextureURL = null;
            if (eyesMesh && modelParts.head) {
                modelParts.head.remove(eyesMesh);
                if (eyesMesh.material && eyesMesh.material.map) eyesMesh.material.map.dispose();
                if (eyesMesh.material) eyesMesh.material.dispose();
                if (eyesMesh.geometry) eyesMesh.geometry.dispose();
                eyesMesh = null;
            }

            // Cejas: eliminar mesh y limpiar referencia/URL
            currentEyebrowTextureURL = null;
            if (eyebrowsMesh && modelParts.head) {
                modelParts.head.remove(eyebrowsMesh);
                if (eyebrowsMesh.material && eyebrowsMesh.material.map) eyebrowsMesh.material.map.dispose();
                if (eyebrowsMesh.material) eyebrowsMesh.material.dispose();
                if (eyebrowsMesh.geometry) eyebrowsMesh.geometry.dispose();
                eyebrowsMesh = null;
            }

            // Nariz: eliminar mesh y limpiar referencia/URL
            currentNoseTextureURL = null;
            if (noseMesh && modelParts.head) {
                modelParts.head.remove(noseMesh);
                if (noseMesh.material && noseMesh.material.map) noseMesh.material.map.dispose();
                if (noseMesh.material) noseMesh.material.dispose();
                if (noseMesh.geometry) noseMesh.geometry.dispose();
                noseMesh = null;
            }

            // Orejas: eliminar meshes izquierdo/derecho y limpiar referencia/URL
            currentEarTextureURL = null;
            if (earLeftMesh && modelParts.head) {
                modelParts.head.remove(earLeftMesh);
                if (earLeftMesh.material && earLeftMesh.material.map) earLeftMesh.material.map.dispose();
                if (earLeftMesh.material) earLeftMesh.material.dispose();
                if (earLeftMesh.geometry) earLeftMesh.geometry.dispose();
                earLeftMesh = null;
            }
            if (earRightMesh && modelParts.head) {
                modelParts.head.remove(earRightMesh);
                if (earRightMesh.material && earRightMesh.material.map) earRightMesh.material.map.dispose();
                if (earRightMesh.material) earRightMesh.material.dispose();
                if (earRightMesh.geometry) earRightMesh.geometry.dispose();
                earRightMesh = null;
            }

            // Resetear cabello a "None"
            currentHairFrontURL = null;
            currentHairBackURL = null;
            currentHairLeftURL = null;
            currentHairRightURL = null;
            currentHairUpURL = null;
            changeHairTexture(null, null, null, null, null);

            // Resetear ropa del torso a "None"
            currentTorsoFrontURL = null;
            currentTorsoBackURL = null;
            changeTorsoClothing(null, null);

            // Resetear brazos a "None"
            currentArmLeftURL = null;
            currentArmRightURL = null;
            changeArmClothing('left', null);
            changeArmClothing('right', null);

            // Resetear piernas a "None"
            currentLegLeftURL = null;
            currentLegRightURL = null;
            changeLegClothing('left', null);
            changeLegClothing('right', null);

            // Restaurar grid y ocultar sombra
            if (typeof gridHelper !== 'undefined') gridHelper.visible = true;
            if (footShadow) footShadow.visible = false;

            // Reactivar controles de cámara
            controls.enabled = true;

            // Restaurar FOV original
            camera.fov = 75;

            // Restaurar el renderer al tamaño completo
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function updateShowcaseRotation() {
            if (isShowcaseActive && loadedModel) {
                // Rotación automática suave
                loadedModel.rotation.y += showcaseRotationSpeed * 0.01;

                // Cambio de colores aleatorios en diferentes partes
                const now = Date.now();

                // Cabeza
                if (now - showcaseColorTimers.head > showcaseColorIntervals.head) {
                    if (modelParts.head) applyRandomColorToPart(modelParts.head, true);
                    showcaseColorTimers.head = now;
                }

                // Torso
                if (now - showcaseColorTimers.torso > showcaseColorIntervals.torso) {
                    if (modelParts.torso) applyRandomColorToPart(modelParts.torso);
                    showcaseColorTimers.torso = now;
                }

                // Brazos
                if (now - showcaseColorTimers.leftArm > showcaseColorIntervals.leftArm) {
                    const leftArm = modelParts.arms.find(arm => arm.name.toLowerCase().includes('l'));
                    if (leftArm) applyRandomColorToPart(leftArm);
                    showcaseColorTimers.leftArm = now;
                }

                if (now - showcaseColorTimers.rightArm > showcaseColorIntervals.rightArm) {
                    const rightArm = modelParts.arms.find(arm => arm.name.toLowerCase().includes('r'));
                    if (rightArm) applyRandomColorToPart(rightArm);
                    showcaseColorTimers.rightArm = now;
                }

                // Piernas
                if (now - showcaseColorTimers.leftLeg > showcaseColorIntervals.leftLeg) {
                    const leftLeg = modelParts.legs.find(leg => leg.name.toLowerCase().includes('l'));
                    if (leftLeg) applyRandomColorToPart(leftLeg);
                    showcaseColorTimers.leftLeg = now;
                }

                if (now - showcaseColorTimers.rightLeg > showcaseColorIntervals.rightLeg) {
                    const rightLeg = modelParts.legs.find(leg => leg.name.toLowerCase().includes('r'));
                    if (rightLeg) applyRandomColorToPart(rightLeg);
                    showcaseColorTimers.rightLeg = now;
                }

                // Cambio de texturas aleatorias en diferentes partes
                // Ojos
                if (now - showcaseTextureTimers.eyes > showcaseTextureIntervals.eyes) {
                    applyRandomEyeTexture();
                    showcaseTextureTimers.eyes = now;
                }

                // Cejas
                if (now - showcaseTextureTimers.eyebrows > showcaseTextureIntervals.eyebrows) {
                    applyRandomEyebrowTexture();
                    showcaseTextureTimers.eyebrows = now;
                }

                // Nariz
                if (now - showcaseTextureTimers.nose > showcaseTextureIntervals.nose) {
                    applyRandomNoseTexture();
                    showcaseTextureTimers.nose = now;
                }

                // Orejas
                if (now - showcaseTextureTimers.ears > showcaseTextureIntervals.ears) {
                    applyRandomEarTexture();
                    showcaseTextureTimers.ears = now;
                }

                // Cabello
                if (now - showcaseTextureTimers.hair > showcaseTextureIntervals.hair) {
                    applyRandomHairTexture();
                    showcaseTextureTimers.hair = now;
                }

                // Torso (texturas)
                if (now - showcaseTextureTimers.torso > showcaseTextureIntervals.torso) {
                    applyRandomTorsoTexture();
                    showcaseTextureTimers.torso = now;
                }

                // Brazos izquierdo y derecho
                if (now - showcaseTextureTimers.leftArm > showcaseTextureIntervals.leftArm) {
                    applyRandomArmTexture('left');
                    showcaseTextureTimers.leftArm = now;
                }

                if (now - showcaseTextureTimers.rightArm > showcaseTextureIntervals.rightArm) {
                    applyRandomArmTexture('right');
                    showcaseTextureTimers.rightArm = now;
                }

                // Piernas izquierda y derecha
                if (now - showcaseTextureTimers.leftLeg > showcaseTextureIntervals.leftLeg) {
                    applyRandomLegTexture('left');
                    showcaseTextureTimers.leftLeg = now;
                }

                if (now - showcaseTextureTimers.rightLeg > showcaseTextureIntervals.rightLeg) {
                    applyRandomLegTexture('right');
                    showcaseTextureTimers.rightLeg = now;
                }
            }
        }

        // Sistema de edición móvil optimizado
        // const mobileEditorPanel = document.getElementById('mobile-editor-panel');
        // const mobileOptionsGrid = document.getElementById('mobile-options-grid');
        // const mobilePartTitle = document.getElementById('mobile-part-title');
        // const mobilePartIcon = document.getElementById('mobile-part-icon');
        // const mobileBackBtn = document.getElementById('mobile-back-btn');
        // const mobileNextBtn = document.getElementById('mobile-next-btn');

        const isMobileEditor = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // Definir secuencia de partes para edición móvil
        const mobileParts = [
            {
                id: 'eyes',
                title: 'EYES',
                icon: '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>',
                data: eyeTextures,
                applyFn: changeEyeTexture
            },
            {
                id: 'eyebrows',
                title: 'EYEBROWS',
                icon: '<path d="M9 11c.55 0 1-.45 1-1V8.5c0-.55-.45-1-1-1s-1 .45-1 1V10c0 .55.45 1 1 1zm6 0c.55 0 1-.45 1-1V8.5c0-.55-.45-1-1-1s-1 .45-1 1V10c0 .55.45 1 1 1z"/>',
                data: eyebrowTextures,
                applyFn: changeEyebrowTexture
            },
            {
                id: 'nose',
                title: 'NOSE',
                icon: '<path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z"/>',
                data: noseTextures,
                applyFn: changeNoseTexture
            },
            {
                id: 'ears',
                title: 'EARS',
                icon: '<path d="M7.24 8.75c-.26-.48-.39-1.03-.39-1.67 0-.61.13-1.16.36-1.63.63-1.3 1.84-2.13 3.32-2.14 1.76-.01 3.32 1.1 3.82 2.72.14.46.21.95.21 1.46 0 .6-.13 1.15-.37 1.62-.26.52-.63.96-1.09 1.29-.46.33-1.01.56-1.62.68v.03c-.59.12-1.24.12-1.83 0v-.03c-.61-.12-1.16-.35-1.62-.68-.46-.33-.83-.77-1.09-1.29z"/>',
                data: earTextures,
                applyFn: (url) => { changeEarTexture('left', url); changeEarTexture('right', url); }
            },
            {
                id: 'hair',
                title: 'HAIR',
                icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
                data: hairTextures,
                applyFn: (url) => changeHairTexture(url, url)
            }
        ];

        let currentPartIndex = 0;

        // Función simplificada para limpiar grid (SVG son ligeros)
        function clearMobileGrid() {
            mobileOptionsGrid.innerHTML = '';
        }

        // Función optimizada para cargar parte actual
        function loadCurrentPart() {
            clearMobileGrid();

            const part = mobileParts[currentPartIndex];
            mobilePartTitle.textContent = part.title;
            mobilePartIcon.innerHTML = part.icon;

            // Actualizar botones de navegación
            mobileBackBtn.disabled = false;
            mobileNextBtn.disabled = currentPartIndex === mobileParts.length - 1;

            // Crear fragment para batch insert (más rápido)
            const fragment = document.createDocumentFragment();

            // Cargar opciones de forma optimizada
            part.data.forEach((option) => {
                const card = document.createElement('div');
                card.className = 'mobile-option-card';

                const img = new Image();
                img.src = option.url;
                img.alt = option.name;
                // SOLUCIÓN 2: Carga INMEDIATA sin lazy loading
                img.loading = 'eager';

                card.appendChild(img);

                // Event listener optimizado con delegación
                card.addEventListener('click', () => {
                    // Remover selección anterior
                    mobileOptionsGrid.querySelectorAll('.mobile-option-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');

                    // Aplicar cambio con limpieza previa
                    part.applyFn(option.url, false);
                }, { passive: true });

                fragment.appendChild(card);
            });

            // Insertar todo de una vez (batch insert)
            mobileOptionsGrid.appendChild(fragment);
        }

        // Event listeners de navegación (MOBILE REMOVED)
        /*
        mobileBackBtn.addEventListener('click', () => {
            if (currentPartIndex === 0) {
                // Si estamos en la primera parte (EYES), volver al showcase
                document.body.classList.remove('mobile-edit-mode');
                mobileEditorPanel.classList.remove('active');
                clearMobileGrid();

                // Reiniciar showcase
                startShowcase();
            } else {
                // En otras partes, navegar hacia atrás
                currentPartIndex--;
                loadCurrentPart();
            }
        });

        mobileNextBtn.addEventListener('click', () => {
            if (currentPartIndex < mobileParts.length - 1) {
                currentPartIndex++;
                loadCurrentPart();
            }
        });
        */

        // Event listeners para botones de showcase
        customizeBtn.addEventListener('click', () => {
            // Lógica unificada (siempre modo desktop)
            stopShowcase();
            document.body.classList.add('customization-active');
            editorPanelWrapper.style.display = 'block';
            presetsSection.classList.add('hidden');
            customizeSection.classList.remove('hidden');

            // Trigger resize for 3D canvas
            setTimeout(() => {
                onWindowResize();
            }, 350); // Wait for transition
        });

        presetsBtn.addEventListener('click', () => {
            stopShowcase();
            document.body.classList.remove('customization-active');
            editorPanelWrapper.style.display = 'block';
            presetsSection.classList.remove('hidden');
            customizeSection.classList.add('hidden');

            // Activar fondo degradado azul para presets
            const showcaseBackground = document.getElementById('showcase-background');
            if (showcaseBackground) showcaseBackground.classList.add('active');

            // Mostrar botones de acciones de presets
            const presetActionButtons = document.getElementById('preset-action-buttons');
            if (presetActionButtons) presetActionButtons.classList.add('active');

            // Ocultar botón grande de PDF del centro
            const downloadPdfBtn = document.getElementById('download-pdf-btn');
            if (downloadPdfBtn) downloadPdfBtn.classList.remove('active');

            // Resetear buscador de presets al entrar en la pestaña
            const presetSearchInput = document.getElementById('preset-search-input');
            const presetsContainer = document.getElementById('presets-container');
            if (presetSearchInput && presetsContainer) {
                presetSearchInput.value = '';
                presetsContainer.querySelectorAll('.preset-character-btn').forEach(btn => {
                    btn.style.display = '';
                });
            }
        });

        // Custom Header Actions Logic
        const backToShowcaseCustomBtn = document.getElementById('back-to-showcase-custom-btn');
        if (backToShowcaseCustomBtn) {
            backToShowcaseCustomBtn.addEventListener('click', () => {
                document.body.classList.remove('customization-active');
                editorPanelWrapper.style.display = 'none';
                hideCharacterName();
                customizeSection.classList.add('hidden');
                startShowcase();
                setTimeout(() => { onWindowResize(); }, 100);
            });
        }

        const playModeCustomBtn = document.getElementById('play-mode-custom-btn');
        if (playModeCustomBtn) {
            playModeCustomBtn.addEventListener('click', () => {
                if (typeof togglePlayMode === 'function') {
                    togglePlayMode();
                } else {
                    console.error('togglePlayMode function not found');
                }
            });
        }

        // State for skin color selection
        let isCustomSkinColorSelected = false;

        const downloadPdfCustomBtn = document.getElementById('download-pdf-custom-btn');
        if (downloadPdfCustomBtn) {
            downloadPdfCustomBtn.addEventListener('click', () => {
                if (!isCustomSkinColorSelected) {
                    document.getElementById('color-warning-modal').classList.remove('hidden');
                    return;
                }

                // Set preset character to 'Custom' to allow generation
                currentPresetCharacter = 'Custom';

                // Trigger PDF generation
                generatePDF();
            });
        }

        // Modal close logic
        const closeWarningModal = () => {
            document.getElementById('color-warning-modal').classList.add('hidden');
        };

        const warningCloseBtn = document.getElementById('color-warning-close');
        if (warningCloseBtn) warningCloseBtn.addEventListener('click', closeWarningModal);

        const warningOverlay = document.getElementById('color-warning-overlay');
        if (warningOverlay) warningOverlay.addEventListener('click', closeWarningModal);



        // Lógica de filtrado en tiempo real para la barra de búsqueda de presets
        const presetSearchInput = document.getElementById('preset-search-input');
        const presetsContainer = document.getElementById('presets-container');
        if (presetSearchInput && presetsContainer) {
            presetSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const buttons = presetsContainer.querySelectorAll('.preset-character-btn');
                buttons.forEach(btn => {
                    const img = btn.querySelector('img');
                    const name = img && img.alt ? img.alt.toLowerCase() : '';
                    btn.style.display = !query || name.includes(query) ? '' : 'none';
                });
            });
        }

        // Función para aplicar personaje preestablecido (OPTIMIZADA PARA MÓVIL)
        async function applyPresetCharacter(characterName) {
            // Aplicar color de piel más claro (#F7D5CF) a todos los personajes preestablecidos
            const lightestSkinColor = new THREE.Color('#F7D5CF');

            // Colores especiales para cabeza
            let headColor = lightestSkinColor;
            if (characterName === 'Baby') {
                headColor = new THREE.Color('#FCD5C6'); // Color piel para Baby
            } else if (characterName === 'Mystery') {
                headColor = new THREE.Color('#FCD5C6'); // Color piel para Mystery
            } else if (characterName === 'Romance') {
                headColor = new THREE.Color('#FCD5C6'); // Color piel para Romance
            } else if (characterName === 'Abby') {
                headColor = new THREE.Color('#FCD5C6'); // Color piel para Abby
            } else if (characterName === 'Jinu') {
                headColor = new THREE.Color('#FCD5C6'); // Color piel para Jinu
            } else if (characterName === 'Steve') {
                headColor = new THREE.Color('#AF7E5C'); // Color piel para Steve
            }

            // Aplicar color a la cabeza
            if (modelParts.head) {
                modelParts.head.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        // Excluir meshes de texturas SVG (incluyendo TODO el cabello)
                        if (child !== eyesMesh && child !== eyebrowsMesh && child !== noseMesh &&
                            child !== earLeftMesh && child !== earRightMesh &&
                            child !== hairFrontMesh && child !== hairBackMesh &&
                            child !== hairLeftMesh && child !== hairRightMesh && child !== hairUpMesh) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.color) mat.color.copy(headColor);
                                });
                            } else {
                                child.material.color.copy(headColor);
                            }
                        }
                    }
                });

                // Aplicar color a la nariz (25% más oscuro que la cabeza)
                applyNoseColor(headColor.getHex());
            }

            // Aplicar color al torso
            if (modelParts.torso) {
                // Colores especiales para torso
                let torsoColor = lightestSkinColor;
                if (characterName === 'Baby') {
                    torsoColor = new THREE.Color('#6A68E9');
                } else if (characterName === 'Steve') {
                    torsoColor = new THREE.Color('#00A9AF');
                }
                modelParts.torso.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (child !== torsoFrontMesh && child !== torsoBackMesh) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.color) mat.color.copy(torsoColor);
                                });
                            } else {
                                child.material.color.copy(torsoColor);
                            }
                        }
                    }
                });
            }

            if (modelParts.arms || modelParts.legs) {
                if (characterName === 'Steve') {
                    armsColor = new THREE.Color('#AF7E5C');
                }
                modelParts.arms.forEach(arm => {
                    arm.traverse(child => {
                        if (child.isMesh && child.material) {
                            if (child !== armLeftFrontMesh && child !== armLeftBackMesh &&
                                child !== armRightFrontMesh && child !== armRightBackMesh) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        if (mat.color) mat.color.copy(armsColor);
                                    });
                                } else {
                                    child.material.color.copy(armsColor);
                                }
                            }
                        }
                    });
                });
            }

            if (characterName === 'Baby') {
                legsColor = new THREE.Color('#6A68E9');
            } else if (characterName === 'Steve') {
                legsColor = new THREE.Color('#4332A0');
            }
            modelParts.legs.forEach(leg => {
                leg.traverse(child => {
                    if (child.isMesh && child.material) {
                        if (child !== legLeftFrontMesh && child !== legLeftBackMesh &&
                            child !== legRightFrontMesh && child !== legRightBackMesh) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.color) mat.color.copy(legsColor);
                                });
                            } else {
                                child.material.color.copy(legsColor);
                            }
                        }
                    }
                });
            });

            // Buscar texturas
            let eyeTexture = eyeTextures.find(t => t.name === characterName);
            let eyebrowTexture = eyebrowTextures.find(t => t.name === characterName);
            let noseTexture = (characterName === 'Steve') ? noseTextures.find(t => t.name === 'Steve') : noseTextures.find(t => t.name === 'Default');
            let hairTexture = hairTextures.find(t => t.name === characterName);
            let torsoTexture = torsoClothingTextures.find(t => t.name === characterName);
            let armTexture = armTextures.find(t => t.name === characterName);
            let legTexture = legTextures.find(t => t.name === characterName);

            if (characterName === 'Alex') {
                if (!eyeTexture) eyeTexture = { name: 'Alex', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/eyes/Alex-eyes.svg' };
                if (!noseTexture) noseTexture = { name: 'Alex', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/nose/Alex-nose.svg' };
                if (!hairTexture) hairTexture = {
                    name: 'Alex',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/hair/Alex-hair.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/hair/Alex-hair.svg',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/hair/Alex-hair.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/hair/Alex-hair.svg',
                    upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/hair/Alex-hair.svg'
                };
                if (!torsoTexture) torsoTexture = {
                    name: 'Alex',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/torso/Alex-torso.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/torso/Alex-torso.svg'
                };
                if (!armTexture) armTexture = {
                    name: 'Alex',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/arms/Alex-arm-left.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/arms/Alex-arm-right.svg'
                };
                if (!legTexture) legTexture = {
                    name: 'Alex',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/legs/Alex-leg-left.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Alex/legs/Alex-leg-right.svg'
                };
            } else if (characterName === 'Zombie') {
                if (!eyeTexture) eyeTexture = { name: 'Zombie', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/eyes/Zombie-eyes.svg' };
                if (!noseTexture) noseTexture = { name: 'Zombie', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/nose/Zombie-nose.svg' };
                if (!hairTexture) hairTexture = {
                    name: 'Zombie',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/hair/Zombie-hair.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/hair/Zombie-hair.svg',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/hair/Zombie-hair.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/hair/Zombie-hair.svg',
                    upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/hair/Zombie-hair.svg'
                };
                if (!torsoTexture) torsoTexture = {
                    name: 'Zombie',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/torso/Zombie-torso.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/torso/Zombie-torso.svg'
                };
                if (!armTexture) armTexture = {
                    name: 'Zombie',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/arms/Zombie-arm-left.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/arms/Zombie-arm-right.svg'
                };
                if (!legTexture) legTexture = {
                    name: 'Zombie',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/legs/Zombie-leg-left.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Zombie/legs/Zombie-leg-right.svg'
                };
            } else if (characterName === 'Creeper') {
                if (!eyeTexture) eyeTexture = { name: 'Creeper', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/eyes/Creeper-eyes.svg' };
                if (!noseTexture) noseTexture = { name: 'Creeper', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/nose/Creeper-nose.svg' };
                if (!hairTexture) hairTexture = {
                    name: 'Creeper',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/hair/Creeper-hair.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/hair/Creeper-hair.svg',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/hair/Creeper-hair.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/hair/Creeper-hair.svg',
                    upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/hair/Creeper-hair.svg'
                };
                if (!torsoTexture) torsoTexture = {
                    name: 'Creeper',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/torso/Creeper-torso.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/torso/Creeper-torso.svg'
                };
                if (!legTexture) legTexture = {
                    name: 'Creeper',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/legs/Creeper-leg-left.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Creeper/legs/Creeper-leg-right.svg'
                };
                armTexture = null;
            } else if (characterName === 'Skeleton') {
                if (!eyeTexture) eyeTexture = { name: 'Skeleton', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/eyes/Skeleton-eyes.svg' };
                if (!noseTexture) noseTexture = { name: 'Skeleton', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/nose/Skeleton-nose.svg' };
                if (!torsoTexture) torsoTexture = {
                    name: 'Skeleton',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/torso/Skeleton-torso.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/torso/Skeleton-torso.svg'
                };
                if (!armTexture) armTexture = {
                    name: 'Skeleton',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/arms/Skeleton-arm-left.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/arms/Skeleton-arm-right.svg'
                };
                if (!legTexture) legTexture = {
                    name: 'Skeleton',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/legs/Skeleton-leg-left.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Skeleton/legs/Skeleton-leg-right.svg'
                };
                hairTexture = null;
            } else if (characterName === 'Enderman') {
                if (!eyeTexture) eyeTexture = { name: 'Enderman', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/eyes/Enderman-eyes.svg' };
                if (!noseTexture) noseTexture = { name: 'Enderman', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/nose/Enderman-nose.svg' };
                if (!hairTexture) hairTexture = {
                    name: 'Enderman',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/hair/Enderman-hair.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/hair/Enderman-hair.svg',
                    leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/hair/Enderman-hair.svg',
                    rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/hair/Enderman-hair.svg',
                    upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/hair/Enderman-hair.svg'
                };
                if (!torsoTexture) torsoTexture = {
                    name: 'Enderman',
                    frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/torso/Enderman-torso.svg',
                    backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/main/Minecraft/Enderman/torso/Enderman-torso.svg'
                };
                armTexture = null;
                legTexture = null;
            }

            if (characterName === 'Romance') {
                currentEarTextureURL = null;
                if (earLeftMesh && modelParts.head) {
                    modelParts.head.remove(earLeftMesh);
                    if (earLeftMesh.material && earLeftMesh.material.map) earLeftMesh.material.map.dispose();
                    if (earLeftMesh.material) earLeftMesh.material.dispose();
                    if (earLeftMesh.geometry) earLeftMesh.geometry.dispose();
                    earLeftMesh = null;
                }
                if (earRightMesh && modelParts.head) {
                    modelParts.head.remove(earRightMesh);
                    if (earRightMesh.material && earRightMesh.material.map) earRightMesh.material.map.dispose();
                    if (earRightMesh.material) earRightMesh.material.dispose();
                    if (earRightMesh.geometry) earRightMesh.geometry.dispose();
                    earRightMesh = null;
                }
                earTexture = null;
            } else if (characterName === 'Mystery') {
                currentEyeTextureURL = null;
                if (eyesMesh && modelParts.head) {
                    modelParts.head.remove(eyesMesh);
                    if (eyesMesh.material && eyesMesh.material.map) eyesMesh.material.map.dispose();
                    if (eyesMesh.material) eyesMesh.material.dispose();
                    if (eyesMesh.geometry) eyesMesh.geometry.dispose();
                    eyesMesh = null;
                }

                currentEyebrowTextureURL = null;
                if (eyebrowsMesh && modelParts.head) {
                    modelParts.head.remove(eyebrowsMesh);
                    if (eyebrowsMesh.material && eyebrowsMesh.material.map) eyebrowsMesh.material.map.dispose();
                    if (eyebrowsMesh.material) eyebrowsMesh.material.dispose();
                    if (eyebrowsMesh.geometry) eyebrowsMesh.geometry.dispose();
                    eyebrowsMesh = null;
                }

                eyeTexture = null;
                eyebrowTexture = null;
            } else if (characterName === 'Steve') {
                // Steve no tiene orejas ni cejas
                if (earLeftMesh && modelParts.head) {
                    modelParts.head.remove(earLeftMesh);
                    if (earLeftMesh.material && earLeftMesh.material.map) earLeftMesh.material.map.dispose();
                    if (earLeftMesh.material) earLeftMesh.material.dispose();
                    if (earLeftMesh.geometry) earLeftMesh.geometry.dispose();
                    earLeftMesh = null;
                }
                if (earRightMesh && modelParts.head) {
                    modelParts.head.remove(earRightMesh);
                    if (earRightMesh.material && earRightMesh.material.map) earRightMesh.material.map.dispose();
                    if (earRightMesh.material) earRightMesh.material.dispose();
                    if (earRightMesh.geometry) earRightMesh.geometry.dispose();
                    earRightMesh = null;
                }
                if (eyebrowsMesh && modelParts.head) {
                    modelParts.head.remove(eyebrowsMesh);
                    if (eyebrowsMesh.material && eyebrowsMesh.material.map) eyebrowsMesh.material.map.dispose();
                    if (eyebrowsMesh.material) eyebrowsMesh.material.dispose();
                    if (eyebrowsMesh.geometry) eyebrowsMesh.geometry.dispose();
                    eyebrowsMesh = null;
                }
                earTexture = null;
                eyebrowTexture = null;
                currentEarTextureURL = null;
                currentEyebrowTextureURL = null;
            } else if (characterName === 'Alex') {
                // Alex no tiene orejas ni cejas
                if (earLeftMesh && modelParts.head) {
                    modelParts.head.remove(earLeftMesh);
                    earLeftMesh = null;
                }
                if (earRightMesh && modelParts.head) {
                    modelParts.head.remove(earRightMesh);
                    earRightMesh = null;
                }
                if (eyebrowsMesh && modelParts.head) {
                    modelParts.head.remove(eyebrowsMesh);
                    eyebrowsMesh = null;
                }
                earTexture = null;
                eyebrowTexture = null;
                currentEarTextureURL = null;
                currentEyebrowTextureURL = null;
            } else if (characterName === 'Zombie') {
                // Zombie no tiene orejas ni cejas
                if (earLeftMesh && modelParts.head) {
                    modelParts.head.remove(earLeftMesh);
                    earLeftMesh = null;
                }
                if (earRightMesh && modelParts.head) {
                    modelParts.head.remove(earRightMesh);
                    earRightMesh = null;
                }
                if (eyebrowsMesh && modelParts.head) {
                    modelParts.head.remove(eyebrowsMesh);
                    eyebrowsMesh = null;
                }
                earTexture = null;
                eyebrowTexture = null;
                currentEarTextureURL = null;
                currentEyebrowTextureURL = null;
            } else if (characterName === 'Creeper') {
                // Creeper no tiene orejas, cejas ni brazos
                if (earLeftMesh && modelParts.head) {
                    modelParts.head.remove(earLeftMesh);
                    earLeftMesh = null;
                }
                if (earRightMesh && modelParts.head) {
                    modelParts.head.remove(earRightMesh);
                    earRightMesh = null;
                }
                if (eyebrowsMesh && modelParts.head) {
                    modelParts.head.remove(eyebrowsMesh);
                    eyebrowsMesh = null;
                }

                // Ocultar brazos
                modelParts.arms.forEach(arm => {
                    if (arm) arm.visible = false;
                });

                earTexture = null;
                eyebrowTexture = null;
                currentEarTextureURL = null;
                currentEyebrowTextureURL = null;
            } else if (characterName === 'Skeleton') {
                // Skeleton no tiene orejas, cejas ni pelo
                if (earLeftMesh && modelParts.head) {
                    modelParts.head.remove(earLeftMesh);
                    earLeftMesh = null;
                }
                if (earRightMesh && modelParts.head) {
                    modelParts.head.remove(earRightMesh);
                    earRightMesh = null;
                }
                if (eyebrowsMesh && modelParts.head) {
                    modelParts.head.remove(eyebrowsMesh);
                    eyebrowsMesh = null;
                }
                if (hairFrontMesh && modelParts.head) {
                    // Asumiendo que hairFrontMesh etc existen, eliminarlos o ocultarlos
                    // Mejor usar changeHairTexture(null...) si funciona, pero aquí eliminamos meshes
                    // El código de abajo maneja las texturas, aquí limpiamos partes extra 3D si existen
                }

                earTexture = null;
                eyebrowTexture = null;
                currentEarTextureURL = null;
                currentEyebrowTextureURL = null;
            } else if (characterName === 'Enderman') {
                // Enderman no tiene orejas, cejas, brazos ni piernas
                if (earLeftMesh && modelParts.head) {
                    modelParts.head.remove(earLeftMesh);
                    earLeftMesh = null;
                }
                if (earRightMesh && modelParts.head) {
                    modelParts.head.remove(earRightMesh);
                    earRightMesh = null;
                }
                if (eyebrowsMesh && modelParts.head) {
                    modelParts.head.remove(eyebrowsMesh);
                    eyebrowsMesh = null;
                }

                // Ocultar brazos
                modelParts.arms.forEach(arm => {
                    if (arm) arm.visible = false;
                });

                // Ocultar piernas
                modelParts.legs.forEach(leg => {
                    if (leg) leg.visible = false;
                });

                earTexture = null;
                eyebrowTexture = null;
                currentEarTextureURL = null;
                currentEyebrowTextureURL = null;
            }


            // OPTIMIZACIÓN MÓVIL: Cargar texturas en secuencia para evitar fallas
            // En desktop: carga paralela (rápido)
            // En móvil: carga secuencial con delays (confiable)
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            if (isMobile) {
                // MÓVIL: Carga secuencial con prioridad visual
                console.log('📱 Carga optimizada para móvil - Secuencial');

                // Grupo 1: Cara (más visible)
                if (eyeTexture) {
                    currentEyeTextureURL = eyeTexture.url;
                    changeEyeTexture(eyeTexture.url);
                    await delay(50);
                }
                if (eyebrowTexture) {
                    currentEyebrowTextureURL = eyebrowTexture.url;
                    changeEyebrowTexture(eyebrowTexture.url);
                    await delay(50);
                }
                if (noseTexture) {
                    currentNoseTextureURL = noseTexture.url;
                    changeNoseTexture(noseTexture.url);
                    await delay(50);
                }
                if (earTexture) {
                    currentEarTextureURL = earTexture.url;
                    changeEarTexture('left', earTexture.url);
                    await delay(30);
                    changeEarTexture('right', earTexture.url);
                    await delay(50);
                }

                // Grupo 2: Cabello
                if (hairTexture) {
                    currentHairFrontURL = hairTexture.frontUrl;
                    currentHairBackURL = hairTexture.backUrl;
                    currentHairLeftURL = hairTexture.leftUrl;
                    currentHairRightURL = hairTexture.rightUrl;
                    currentHairUpURL = hairTexture.upUrl;
                    changeHairTexture(hairTexture.frontUrl, hairTexture.backUrl, hairTexture.leftUrl, hairTexture.rightUrl, hairTexture.upUrl);
                    await delay(80);
                }

                // Grupo 3: Torso
                if (torsoTexture) {
                    currentTorsoFrontURL = torsoTexture.frontUrl;
                    currentTorsoBackURL = torsoTexture.backUrl;
                    changeTorsoClothing(torsoTexture.frontUrl, torsoTexture.backUrl);
                    await delay(80);
                }

                // Grupo 4: Brazos (CRÍTICO - a menudo falla)
                if (armTexture) {
                    currentArmLeftURL = armTexture.leftUrl;
                    currentArmRightURL = armTexture.rightUrl;
                    changeArmClothing('left', armTexture.leftUrl);
                    await delay(60); // Delay entre brazos
                    changeArmClothing('right', armTexture.rightUrl);
                    await delay(60);
                }

                // Grupo 5: Piernas (CRÍTICO - a menudo falla)
                if (legTexture) {
                    currentLegLeftURL = legTexture.leftUrl;
                    currentLegRightURL = legTexture.rightUrl;
                    changeLegClothing('left', legTexture.leftUrl);
                    await delay(60); // Delay entre piernas
                    changeLegClothing('right', legTexture.rightUrl);
                }

                console.log('✅ Carga móvil completada');
            } else {
                // DESKTOP: Carga paralela (como antes - rápido)
                console.log('💻 Carga desktop - Paralela');

                if (eyeTexture) {
                    currentEyeTextureURL = eyeTexture.url;
                    changeEyeTexture(eyeTexture.url);
                }
                if (eyebrowTexture) {
                    currentEyebrowTextureURL = eyebrowTexture.url;
                    changeEyebrowTexture(eyebrowTexture.url);
                }
                if (noseTexture) {
                    currentNoseTextureURL = noseTexture.url;
                    changeNoseTexture(noseTexture.url);
                }
                if (earTexture) {
                    currentEarTextureURL = earTexture.url;
                    changeEarTexture('left', earTexture.url);
                    changeEarTexture('right', earTexture.url);
                }
                if (hairTexture) {
                    currentHairFrontURL = hairTexture.frontUrl;
                    currentHairBackURL = hairTexture.backUrl;
                    currentHairLeftURL = hairTexture.leftUrl;
                    currentHairRightURL = hairTexture.rightUrl;
                    currentHairUpURL = hairTexture.upUrl;
                    changeHairTexture(hairTexture.frontUrl, hairTexture.backUrl, hairTexture.leftUrl, hairTexture.rightUrl, hairTexture.upUrl);
                }
                if (torsoTexture) {
                    currentTorsoFrontURL = torsoTexture.frontUrl;
                    currentTorsoBackURL = torsoTexture.backUrl;
                    changeTorsoClothing(torsoTexture.frontUrl, torsoTexture.backUrl);
                }
                if (armTexture) {
                    currentArmLeftURL = armTexture.leftUrl;
                    currentArmRightURL = armTexture.rightUrl;
                    changeArmClothing('left', armTexture.leftUrl);
                    changeArmClothing('right', armTexture.rightUrl);
                }
                if (legTexture) {
                    currentLegLeftURL = legTexture.leftUrl;
                    currentLegRightURL = legTexture.rightUrl;
                    changeLegClothing('left', legTexture.leftUrl);
                    changeLegClothing('right', legTexture.rightUrl);
                }
            }
        }

        // Variables globales para almacenar el personaje actual seleccionado
        let currentPresetCharacter = null;
        let isGeneratingPDF = false; // Flag para evitar múltiples generaciones simultáneas
        let currentPdfInstance = null; // Almacenar la instancia de jsPDF para descarga robusta

        // Event listeners para botones de personajes preestablecidos
        const downloadPdfBtn = document.getElementById('download-pdf-btn');

        // Función para mostrar el nombre del personaje
        function showCharacterName(name) {
            const characterNameDisplay = document.getElementById('character-name-display');
            const characterNameText = document.getElementById('character-name-text');
            characterNameText.textContent = name.toUpperCase();
            characterNameDisplay.classList.add('active');
        }

        // Función para ocultar el nombre del personaje
        function hideCharacterName() {
            const characterNameDisplay = document.getElementById('character-name-display');
            characterNameDisplay.classList.remove('active');
        }

        document.getElementById('preset-mira-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Mira';
            applyPresetCharacter('Mira');
            showCharacterName('Mira');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            // Mostrar botón provisional de descarga rápida
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-rumi-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Rumi';
            applyPresetCharacter('Rumi');
            showCharacterName('Rumi');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
        });

        document.getElementById('preset-zoey-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Zoey';
            applyPresetCharacter('Zoey');
            showCharacterName('Zoey');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            // Mostrar botón provisional de descarga rápida
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-steve-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Steve';
            applyPresetCharacter('Steve');
            showCharacterName('Steve');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            // Mostrar botón provisional de descarga rápida
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        // Event Listeners para nuevos personajes de Minecraft

        document.getElementById('preset-alex-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Alex';
            applyPresetCharacter('Alex');
            showCharacterName('Alex');
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-zombie-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Zombie';
            applyPresetCharacter('Zombie');
            showCharacterName('Zombie');
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-creeper-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Creeper';
            applyPresetCharacter('Creeper');
            showCharacterName('Creeper');
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-skeleton-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Skeleton';
            applyPresetCharacter('Skeleton');
            showCharacterName('Skeleton');
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-enderman-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Enderman';
            applyPresetCharacter('Enderman');
            showCharacterName('Enderman');
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-baby-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Baby';
            applyPresetCharacter('Baby');
            showCharacterName('Baby');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            // Mostrar botón provisional de descarga rápida
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-mystery-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Mystery';
            applyPresetCharacter('Mystery');
            showCharacterName('Mystery');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            // Mostrar botón provisional de descarga rápida
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-romance-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Romance';
            applyPresetCharacter('Romance');
            showCharacterName('Romance');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            // Mostrar botón provisional de descarga rápida
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-abby-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Abby';
            applyPresetCharacter('Abby');
            showCharacterName('Abby');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
            // Mostrar botón provisional de descarga rápida
            const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
            if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'flex';
        });

        document.getElementById('preset-jinu-btn').addEventListener('click', () => {
            currentPresetCharacter = 'Jinu';
            applyPresetCharacter('Jinu');
            showCharacterName('Jinu');
            // Mostrar botón pequeño de PDF en la esquina superior izquierda
            if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.add('active');
        });

        // Event listeners para botones de acciones de presets
        const backToShowcaseBtn = document.getElementById('back-to-showcase-btn');
        const playModeBtnMoved = document.getElementById('play-mode-btn-desktop-moved');
        const downloadPdfBtnMoved = document.getElementById('download-pdf-btn-moved');

        // Botón 1: Volver al showcase
        if (backToShowcaseBtn) {
            backToShowcaseBtn.addEventListener('click', () => {
                // Ocultar panel de editor y secciones
                editorPanelWrapper.style.display = 'none';
                presetsSection.classList.add('hidden');
                customizeSection.classList.add('hidden');

                // Ocultar nombre del personaje
                hideCharacterName();

                // Ocultar botones de acciones de presets
                const presetActionButtons = document.getElementById('preset-action-buttons');
                if (presetActionButtons) presetActionButtons.classList.remove('active');

                // Resetear personaje seleccionado y botones de descarga
                currentPresetCharacter = null;
                if (downloadPdfBtnMoved) downloadPdfBtnMoved.classList.remove('active');
                const quickDownloadBtnTest = document.getElementById('quick-download-btn-test');
                if (quickDownloadBtnTest) quickDownloadBtnTest.style.display = 'none';

                // Restaurar showcase original (misma cámara, fondo, grid y controles)
                startShowcase();
            });
        }

        // Botón 2: Modo juego (usar la función existente togglePlayMode)
        if (playModeBtnMoved) {
            playModeBtnMoved.addEventListener('click', () => {
                togglePlayMode();
            });
        }

        // Botón 3: Abrir página de descarga
        if (downloadPdfBtnMoved) {
            downloadPdfBtnMoved.addEventListener('click', () => {
                if (!currentPresetCharacter) {
                    alert(langManager.get('alert-select-preset'));
                    return;
                }

                // Abrir página de descarga
                openDownloadPage();
            });
        }



        // Variables para la página de descarga
        let generatedPdfBlob = null;
        // Flag para activar POPUP "Coming Soon" en el botón Descargar (DESACTIVADO - Sistema de pago con PayPal activo)
        let comingSoonMode = false;

        // Payment Modal Management
        const accountModal = document.getElementById('account-modal');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const modalLoggedOut = document.getElementById('modal-logged-out');



        // Coming Soon modal handlers
        const comingSoonModal = document.getElementById('coming-soon-modal');
        const comingSoonClose = document.getElementById('coming-soon-close');
        const comingSoonOk = document.getElementById('coming-soon-ok');
        function showComingSoon() {
            if (comingSoonModal) comingSoonModal.style.display = 'flex';
        }
        function hideComingSoon() {
            if (comingSoonModal) comingSoonModal.style.display = 'none';
        }
        if (comingSoonClose) comingSoonClose.addEventListener('click', hideComingSoon);
        if (comingSoonOk) comingSoonOk.addEventListener('click', hideComingSoon);




        // Función para abrir descarga directa
        async function openDownloadPage() {
            // Fallback temporal: mostrar popup "Próximamente" cuando el flag esté activo
            if (comingSoonMode) {
                showComingSoon();
                return;
            }

            // Iniciar generación automática directamente sin modal intermedio
            await generatePDFAfterPayment('automatic-download');
        }

        // Detectar eventos al cargar la página
        window.addEventListener('DOMContentLoaded', async () => {
            const urlParams = new URLSearchParams(window.location.search);

            // Abrir pestaña Presets si viene en la URL (?tab=presets)
            if (urlParams.get('tab') === 'presets' && typeof presetsBtn !== 'undefined' && presetsBtn) {
                try { presetsBtn.click(); } catch (e) { /* noop */ }
            }

            // Limpiar parámetros de URL si existen
            if (urlParams.has('subscribed') || urlParams.has('logged')) {
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        });

        window.addEventListener('message', async (event) => {
            const data = event.data || {};
            if (data.type === 'REQUEST_GENERATE_PDF') {
                try {
                    if (data.preset) {
                        currentPresetCharacter = data.preset;
                        loadPreset(data.preset);
                        await new Promise(r => setTimeout(r, 1500));
                    }
                    const pdfBlob = await generatePDF(true);
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'PDF_READY', blob: pdfBlob, preset: currentPresetCharacter }, '*');
                    }
                } catch (err) {
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'PDF_ERROR', message: (err && err.message) ? err.message : 'Error generating PDF' }, '*');
                    }
                }
            }
        });

        // Función para generar PDF después del pago
        async function generatePDFAfterPayment(receiptId) {
            const pdfProgress = document.getElementById('pdf-progress-container');
            const downloadBtn = document.getElementById('final-download-btn');
            const preparingText = document.getElementById('pdf-preparing-text');
            const progressBarContainer = document.getElementById('pdf-progress-bar-container');
            const progressText = document.getElementById('pdf-progress-text');
            const downloadMessage = document.getElementById('pdf-download-message');

            // Mostrar barra de progreso
            if (pdfProgress) pdfProgress.classList.remove('hidden');

            try {
                // Generar el PDF
                generatedPdfBlob = await generatePDF(true);

                // Calcular tamaño en MB
                const fileSizeMB = (generatedPdfBlob.size / (1024 * 1024)).toFixed(2) + ' MB';

                // NO cerrar el modal, sino reemplazar contenido
                // Ocultar texto "Preparing PDF...", barra y porcentaje
                if (preparingText) preparingText.classList.add('hidden');
                if (progressBarContainer) progressBarContainer.classList.add('hidden');
                if (progressText) progressText.classList.add('hidden');

                // Mostrar botón de descarga DENTRO del modal
                if (downloadBtn) downloadBtn.classList.remove('hidden');
                if (downloadMessage) {
                    downloadMessage.classList.remove('hidden');
                    // Actualizar mensaje con el tamaño en MB
                    const baseMessage = translations[langManager.currentLang]['download-message'] || 'ℹ️ Your download will start through your browser.';
                    downloadMessage.innerHTML = `${baseMessage}<br><span style="color:#00ffff;font-weight:bold;font-size:1rem;">Size: ${fileSizeMB}</span>`;
                }

                // Lanzar confetti
                if (typeof confetti !== 'undefined') {
                    launchConfetti();
                }
            } catch (error) {
                console.error('Error al generar PDF:', error);
                alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
                // Cerrar modal en caso de error
                if (pdfProgress) pdfProgress.classList.add('hidden');
                // Limpiar parámetros de URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        // Event listener para botón de descarga final
        const finalDownloadBtn = document.getElementById('final-download-btn');
        if (finalDownloadBtn) {
            finalDownloadBtn.addEventListener('click', () => {
                if (generatedPdfBlob) {
                    // Descargar el PDF ya generado usando link para asegurar el nombre
                    const isCustom = document.body.classList.contains('customization-active');
                    const filename = isCustom ? 'Papelcool-Custom.pdf' : `Papelcool-${currentPresetCharacter || 'Character'}.pdf`;
                    const url = URL.createObjectURL(generatedPdfBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    // Cerrar el modal completamente
                    const pdfProgress = document.getElementById('pdf-progress-container');
                    const preparingText = document.getElementById('pdf-preparing-text');
                    const progressBarContainer = document.getElementById('pdf-progress-bar-container');
                    const progressText = document.getElementById('pdf-progress-text');
                    const downloadMessage = document.getElementById('pdf-download-message');

                    setTimeout(() => {
                        if (pdfProgress) pdfProgress.classList.add('hidden');

                        // Resetear estado del modal para próxima vez
                        if (preparingText) preparingText.classList.remove('hidden');
                        if (progressBarContainer) progressBarContainer.classList.remove('hidden');
                        if (progressText) progressText.classList.remove('hidden');
                        if (finalDownloadBtn) finalDownloadBtn.classList.add('hidden');
                        if (downloadMessage) downloadMessage.classList.add('hidden');

                        // Resetear barra de progreso
                        const progressBar = document.getElementById('pdf-progress-bar');
                        if (progressBar) progressBar.style.width = '0%';
                        if (progressText) progressText.textContent = '0%';
                    }, 500);

                    // Limpiar parámetros de URL
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Resetear blob
                    generatedPdfBlob = null;
                } else {
                    alert('El PDF aún no está listo. Por favor espera un momento.');
                }
            });
        }

        // Función para obtener color de una parte del modelo 3D
        function getPartColor(part) {
            if (!part) return '#FFFFFF';

            let color = null;
            part.traverse((child) => {
                if (child.isMesh && child.material && child.material.color && !color) {
                    // Excluir meshes de texturas SVG
                    const isTextureMesh = [
                        eyesMesh, eyebrowsMesh, noseMesh, earLeftMesh, earRightMesh,
                        hairFrontMesh, hairBackMesh, torsoFrontMesh, torsoBackMesh,
                        armLeftFrontMesh, armLeftBackMesh, armRightFrontMesh, armRightBackMesh,
                        legLeftFrontMesh, legLeftBackMesh, legRightFrontMesh, legRightBackMesh
                    ].includes(child);

                    if (!isTextureMesh) {
                        if (Array.isArray(child.material)) {
                            color = child.material[0].color;
                        } else {
                            color = child.material.color;
                        }
                    }
                }
            });

            return color ? '#' + color.getHexString() : '#FFFFFF';
        }

        // Función para colorear un SVG (mejorada para colorear TODOS los elementos)
        function colorSVG(svgText, color) {
            // Crear un parser DOM
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;

            // Contador para debug
            let elementsColored = 0;

            // Buscar TODOS los elementos con atributo fill (incluyendo blancos, grises, etc.)
            const elementsWithFill = svgElement.querySelectorAll('[fill]');
            elementsWithFill.forEach(el => {
                const currentFill = el.getAttribute('fill');

                // Colorear TODO excepto 'none' y 'transparent'
                if (currentFill && currentFill !== 'none' && currentFill !== 'transparent') {
                    el.setAttribute('fill', color);
                    elementsColored++;
                }
            });

            // También buscar elementos con style que contenga fill
            const elementsWithStyle = svgElement.querySelectorAll('[style*="fill"]');
            elementsWithStyle.forEach(el => {
                const style = el.getAttribute('style');
                if (style) {
                    // Reemplazar cualquier fill:#xxx con el nuevo color
                    const newStyle = style.replace(/fill:\s*#[0-9a-fA-F]{3,6}/g, `fill:${color}`)
                        .replace(/fill:\s*rgb\([^)]+\)/g, `fill:${color}`)
                        .replace(/fill:\s*[a-zA-Z]+/g, (match) => {
                            // No reemplazar 'none' o 'transparent'
                            if (match.includes('none') || match.includes('transparent')) {
                                return match;
                            }
                            return `fill:${color}`;
                        });
                    el.setAttribute('style', newStyle);
                    elementsColored++;
                }
            });

            // Serializar de vuelta a string
            const serializer = new XMLSerializer();
            return serializer.serializeToString(svgElement);
        }

        // Función para cargar un archivo SVG
        async function loadSVGFile(filename) {
            try {
                const response = await fetch(`templates/${filename}`);
                if (!response.ok) {
                    console.warn(`No se pudo cargar ${filename}`);
                    return null;
                }
                return await response.text();
            } catch (error) {
                console.warn(`Error cargando ${filename}:`, error);
                return null;
            }
        }

        // Función para obtener la URL de textura actual de una parte
        function getCurrentTextureURL(partName) {
            switch (partName) {
                // Texturas faciales
                case 'eyes':
                    return currentEyeTextureURL;
                case 'eyebrows':
                    return currentEyebrowTextureURL;
                case 'nose':
                    return currentNoseTextureURL;
                // Torso
                case 'torso-front':
                    return currentTorsoFrontURL;
                case 'torso-back':
                    return currentTorsoBackURL;
                // Cabello - front, back, left, right, up
                case 'hair-front':
                    return currentHairFrontURL;
                case 'hair-back':
                case 'hair-back-2':  // Duplicado usa la misma textura que hair-back
                    return currentHairBackURL;
                case 'hair-left':
                    return currentHairLeftURL;
                case 'hair-right':
                    return currentHairRightURL;
                case 'hair-up':
                    return currentHairUpURL;
                // Brazos - front y back usan la misma textura pero se posicionan diferente
                case 'arm-left-front':
                case 'arm-left-back':
                    return currentArmLeftURL;
                case 'arm-right-front':
                case 'arm-right-back':
                    return currentArmRightURL;
                // Piernas - front y back usan la misma textura pero se posicionan diferente
                case 'leg-left-front':
                case 'leg-left-back':
                    return currentLegLeftURL;
                case 'leg-right-front':
                case 'leg-right-back':
                    return currentLegRightURL;
                // Orejas
                case 'ear-left':
                case 'ear-right':
                    return currentEarTextureURL;
                default:
                    return null;
            }
        }

        // Función para superponer una textura SVG sobre un template
        async function overlayTextureOnTemplate(templateSVG, textureURL, offsetX = 0, offsetY = 0, width = null, height = null, rotation = 0, flipX = false) {
            if (!textureURL) return templateSVG;

            try {
                // Cargar la textura SVG
                const response = await fetch(textureURL);
                if (!response.ok) return templateSVG;
                const textureSVG = await response.text();

                // Parsear ambos SVGs
                const parser = new DOMParser();
                const templateDoc = parser.parseFromString(templateSVG, 'image/svg+xml');
                const textureDoc = parser.parseFromString(textureSVG, 'image/svg+xml');

                const templateElement = templateDoc.documentElement;
                const textureElement = textureDoc.documentElement;

                // Crear un grupo para la textura con transformaciones
                const textureGroup = templateDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
                textureGroup.setAttribute('id', 'texture-overlay');

                // APLICAR DIMENSIONES SI SE ESPECIFICAN
                // Si width o height están definidos, ajustar el viewBox del grupo
                if (width !== null || height !== null) {
                    // Obtener dimensiones originales del SVG de textura
                    const originalViewBox = textureElement.getAttribute('viewBox');
                    const originalWidth = textureElement.getAttribute('width');
                    const originalHeight = textureElement.getAttribute('height');

                    let origW = parseFloat(originalWidth) || 100;
                    let origH = parseFloat(originalHeight) || 100;

                    // Si hay viewBox, usar esas dimensiones
                    if (originalViewBox) {
                        const vbParts = originalViewBox.split(/\s+/);
                        if (vbParts.length === 4) {
                            origW = parseFloat(vbParts[2]);
                            origH = parseFloat(vbParts[3]);
                        }
                    }

                    // Calcular escala basada en las dimensiones deseadas
                    const scaleX = width !== null ? width / origW : 1.0;
                    const scaleY = height !== null ? height / origH : 1.0;
                }

                // CONSTRUIR TRANSFORMACIÓN COMPLETA
                // El orden de las transformaciones es importante: translate -> rotate -> scale
                const transforms = [];

                // 1. Traslación (posición)
                if (offsetX !== 0 || offsetY !== 0) {
                    transforms.push(`translate(${offsetX}, ${offsetY})`);
                }

                // 2. Rotación (en grados, alrededor del origen)
                if (rotation !== 0) {
                    transforms.push(`rotate(${rotation})`);
                }

                // 3. Escala (tamaño) - calculada a partir de width/height
                if (width !== null || height !== null || flipX) {
                    // Obtener dimensiones originales
                    const originalViewBox = textureElement.getAttribute('viewBox');
                    const originalWidth = textureElement.getAttribute('width');
                    const originalHeight = textureElement.getAttribute('height');

                    let origW = parseFloat(originalWidth) || 100;
                    let origH = parseFloat(originalHeight) || 100;

                    if (originalViewBox) {
                        const vbParts = originalViewBox.split(/\s+/);
                        if (vbParts.length === 4) {
                            origW = parseFloat(vbParts[2]);
                            origH = parseFloat(vbParts[3]);
                        }
                    }

                    let scaleX = width !== null ? width / origW : 1.0;
                    const scaleY = height !== null ? height / origH : 1.0;

                    // Aplicar volteo horizontal si flipX es true
                    if (flipX) {
                        scaleX = -scaleX; // Invertir el eje X para voltear horizontalmente
                    }

                    // Aplicar escala (incluyendo volteo si aplica)
                    if (scaleX !== 1.0 || scaleY !== 1.0) {
                        transforms.push(`scale(${scaleX}, ${scaleY})`);
                    }
                }

                // Aplicar todas las transformaciones
                if (transforms.length > 0) {
                    const transformValue = transforms.join(' ');
                    textureGroup.setAttribute('transform', transformValue);
                }

                // Copiar todos los elementos de la textura al grupo
                Array.from(textureElement.children).forEach(child => {
                    const clonedChild = child.cloneNode(true);
                    textureGroup.appendChild(clonedChild);
                });

                // Agregar el grupo al template (antes del último elemento para que quede visible)
                templateElement.appendChild(textureGroup);

                // Serializar de vuelta
                const serializer = new XMLSerializer();
                return serializer.serializeToString(templateElement);
            } catch (error) {
                console.warn('Error superponiendo textura:', error);
                return templateSVG;
            }
        }

        // Función mejorada para convertir SVG a imagen usando Canvas (más confiable)
        async function svgToImageDataURL(svgContent) {
            return new Promise((resolve, reject) => {
                // Crear un blob del SVG
                const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);

                // Crear imagen temporal
                const img = new Image();
                img.crossOrigin = 'anonymous';

                img.onload = () => {
                    try {
                        // ALTA RESOLUCIÓN: Multiplicar por 16 para calidad máxima absoluta
                        // A4 horizontal: 297mm x 210mm a 300 DPI = 3507.9 x 2480.3 px
                        // Usamos 16x para calidad suprema definitiva: ~56126 x 39685 px (equivalente a ~4800 DPI)
                        const scaleFactor = 16;
                        const baseWidth = img.width || 3508;  // A4 horizontal a 300 DPI
                        const baseHeight = img.height || 2480;

                        const canvas = document.createElement('canvas');
                        canvas.width = baseWidth * scaleFactor;
                        canvas.height = baseHeight * scaleFactor;

                        const ctx = canvas.getContext('2d', {
                            alpha: true,
                            willReadFrequently: false
                        });
                        if (!ctx) {
                            reject(new Error('No se pudo obtener contexto 2D del canvas'));
                            return;
                        }

                        // Configurar calidad de renderizado máxima
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        // NO agregar fondo blanco - mantener transparencia
                        // Los templates SVG tienen fondo transparente para verse superpuestos

                        // Dibujar la imagen SVG escalada a alta resolución
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        // Convertir a data URL
                        const dataURL = canvas.toDataURL('image/png', 1.0);

                        // Limpiar
                        URL.revokeObjectURL(svgUrl);

                        resolve(dataURL);
                    } catch (error) {
                        URL.revokeObjectURL(svgUrl);
                        reject(error);
                    }
                };

                img.onerror = (error) => {
                    URL.revokeObjectURL(svgUrl);
                    reject(new Error('Error cargando imagen SVG: ' + error));
                };

                img.src = svgUrl;
            });
        }

        // Función para mostrar botón de descarga con confetti
        async function showDownloadButton(pdf, filename, progressContainer, percentText) {
            // Ocultar porcentaje
            if (percentText) {
                percentText.style.display = 'none';
            }

            // Ocultar barra de progreso
            const barContainer = document.getElementById('pdf-generation-bar-container');
            if (barContainer) barContainer.style.display = 'none';

            // Crear botón de descarga
            const downloadBtn = document.createElement('button');
            downloadBtn.style.cssText = 'width:100%;padding:1.2rem 2rem;background:linear-gradient(135deg,#00ff88 0%,#00cc66 100%);border:none;border-radius:15px;color:#001628;font-family:\'Montserrat\', sans-serif;font-size:1.1rem;font-weight:700;cursor:pointer;transition:all 0.3s ease;box-shadow:0 4px 20px rgba(0,255,136,0.5);margin-bottom:1rem;';
            downloadBtn.textContent = 'DOWNLOAD PDF';
            downloadBtn.onmouseover = () => {
                downloadBtn.style.transform = 'scale(1.05)';
                downloadBtn.style.boxShadow = '0 6px 30px rgba(0,255,136,0.7)';
            };
            downloadBtn.onmouseout = () => {
                downloadBtn.style.transform = 'scale(1)';
                downloadBtn.style.boxShadow = '0 4px 20px rgba(0,255,136,0.5)';
            };
            downloadBtn.onclick = () => {
                pdf.save(filename);
                // Cerrar modal después de descargar
                setTimeout(() => {
                    const overlay = document.getElementById('pdf-generation-overlay');
                    if (overlay) overlay.remove();
                    isGeneratingPDF = false;
                }, 500);
            };

            // Crear mensaje informativo
            const message = document.createElement('div');
            message.style.cssText = 'color:rgba(255,255,255,0.8);font-size:0.85rem;text-align:center;line-height:1.4;';
            message.innerHTML = 'ℹ️ Your download will start through your browser.<br>Please check your downloads folder.';

            // Agregar botón y mensaje al contenedor
            progressContainer.appendChild(downloadBtn);
            progressContainer.appendChild(message);

            // Lanzar confetti
            launchConfetti();
        }

        // Función para lanzar confetti
        function launchConfetti() {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // Confetti desde la izquierda
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                }));

                // Confetti desde la derecha
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                }));
            }, 250);
        }

        async function generatePDF(returnBlob = false) {
            // Verificar que no se esté generando ya un PDF
            if (isGeneratingPDF && !returnBlob) {
                console.warn('⚠️ Already generating a PDF. Please wait...');
                alert('A PDF is already being generated. Please wait for it to finish.');
                return;
            }

            if (!currentPresetCharacter) {
                alert('Please select a preset character first.');
                return;
            }

            // Verificar que jsPDF esté cargado
            if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
                alert('PDF library not loaded correctly. Please reload the page.');
                console.error('jsPDF no está disponible');
                return;
            }

            // Establecer flag para evitar múltiples ejecuciones
            isGeneratingPDF = true;
            console.log('🔄 Iniciando generación de PDF para:', currentPresetCharacter);

            // Variables para la barra de progreso
            let progressContainer, progressBar, percentText;

            // Si returnBlob es true, usar la barra incrustada en la página de descarga
            if (returnBlob) {
                progressBar = document.getElementById('pdf-progress-bar');
                percentText = document.getElementById('pdf-progress-text');
                progressContainer = null; // No hay popup
            } else {
                // Crear overlay de fondo oscuro transparente
                const overlay = document.createElement('div');
                overlay.id = 'pdf-generation-overlay';
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9998;display:flex;align-items:center;justify-content:center;';

                // Crear ventana flotante (mismo tamaño que modal de PayPal)
                progressContainer = document.createElement('div');
                progressContainer.style.cssText = 'position:relative;background:rgba(0,22,40,0.98);padding:3rem;border-radius:20px;z-index:9999;font-family:\'Montserrat\', sans-serif;width:90%;max-width:500px;box-shadow:0 20px 60px rgba(0,255,255,0.4);border:2px solid rgba(0,255,255,0.6);';

                // Botón de cierre (X)
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
                closeBtn.style.cssText = 'position:absolute;top:15px;right:15px;color:#00ffff;cursor:pointer;background:none;border:none;padding:5px;transition:all 0.3s ease;border-radius:50%;display:flex;align-items:center;justify-content:center;';
                closeBtn.onmouseover = () => {
                    closeBtn.style.color = '#ffffff';
                    closeBtn.style.background = 'rgba(0,255,255,0.1)';
                    closeBtn.style.transform = 'rotate(90deg)';
                };
                closeBtn.onmouseout = () => {
                    closeBtn.style.color = '#00ffff';
                    closeBtn.style.background = 'none';
                    closeBtn.style.transform = 'rotate(0deg)';
                };
                closeBtn.onclick = () => {
                    // Verificar si la generación ha terminado (barra de progreso oculta)
                    const barContainer = document.getElementById('pdf-generation-bar-container');
                    const isFinished = barContainer && barContainer.style.display === 'none';

                    const performClose = () => {
                        const overlay = document.getElementById('pdf-generation-overlay');
                        if (overlay) overlay.remove();
                        isGeneratingPDF = false;
                    };

                    if (isFinished) {
                        // Si ya terminó, cerrar inmediatamente (cancelando la descarga pendiente)
                        performClose();
                    } else {
                        // Si está en progreso, pedir confirmación
                        const lang = localStorage.getItem('papelcool_lang') || 'en';
                        const msg = lang === 'es' ? '¿Cancelar la descarga del PDF?' : 'Cancel PDF download?';
                        if (confirm(msg)) {
                            performClose();
                        }
                    }
                };
                progressContainer.appendChild(closeBtn);

                // Contenedor de la barra
                const barContainer = document.createElement('div');
                barContainer.id = 'pdf-generation-bar-container';
                barContainer.style.cssText = 'width:100%;height:40px;background:rgba(0,0,0,0.5);border-radius:20px;overflow:hidden;border:2px solid rgba(0,255,255,0.4);margin-bottom:1.5rem;';

                // Barra de progreso
                progressBar = document.createElement('div');
                progressBar.style.cssText = 'width:0%;height:100%;background:linear-gradient(90deg,#00ffff,#00ccff,#0099ff);transition:width 0.3s ease;box-shadow:0 0 20px rgba(0,255,255,0.8);';
                barContainer.appendChild(progressBar);
                progressContainer.appendChild(barContainer);

                // Texto de porcentaje
                percentText = document.createElement('div');
                percentText.style.cssText = 'color:#00ffff;font-size:2rem;font-weight:bold;text-align:center;text-shadow:0 0 10px rgba(0,255,255,0.8);';
                percentText.textContent = '0%';
                progressContainer.appendChild(percentText);

                overlay.appendChild(progressContainer);
                document.body.appendChild(overlay);
            }

            // Función para actualizar progreso
            function updateProgress(percent) {
                if (progressBar) { progressBar.style.width = percent + '%'; }
                if (percentText) { percentText.textContent = Math.round(percent) + '%'; }
                try {
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'PDF_PROGRESS', percent }, '*');
                    }
                } catch (e) { }
            }

            try {
                // Inicializar jsPDF (A4 horizontal)
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });

                // Dimensiones A4 horizontal
                const pageWidth = 297;   // 297mm
                const pageHeight = 210;  // 210mm

                // Dimensiones reales del PDF A4 en píxeles
                const PDF_WIDTH_PX = 3507.9;   // Ancho real del PDF en píxeles
                const PDF_HEIGHT_PX = 2480.3;  // Alto real del PDF en píxeles

                // Inicializar progreso
                updateProgress(5);

                console.log('=== OBTENIENDO COLORES DEL MODELO 3D ===');

                // Verificar que loadedModel existe
                if (!loadedModel) {
                    console.error('❌ ERROR: loadedModel es null. El modelo 3D no está cargado.');
                    alert('Please wait for the 3D model to load completely.');
                    if (progressContainer && progressContainer.parentNode) {
                        progressContainer.parentNode.removeChild(progressContainer);
                    }
                    isGeneratingPDF = false;
                    return;
                }

                // Obtener colores por piezas para soporte personalizado
                const headColor = getPartColor(modelParts.head);
                const torsoColor = getPartColor(modelParts.torso);

                // Buscar brazos y piernas específicos
                const armLeft = modelParts.arms.find(a => a.name.toLowerCase().includes('l'));
                const armRight = modelParts.arms.find(a => a.name.toLowerCase().includes('r'));
                const legLeft = modelParts.legs.find(l => l.name.toLowerCase().includes('l'));
                const legRight = modelParts.legs.find(l => l.name.toLowerCase().includes('r'));

                const armLeftColor = armLeft ? getPartColor(armLeft) : (modelParts.arms[0] ? getPartColor(modelParts.arms[0]) : '#FFFFFF');
                const armRightColor = armRight ? getPartColor(armRight) : (modelParts.arms[0] ? getPartColor(modelParts.arms[0]) : '#FFFFFF');
                const legLeftColor = legLeft ? getPartColor(legLeft) : (modelParts.legs[0] ? getPartColor(modelParts.legs[0]) : '#FFFFFF');
                const legRightColor = legRight ? getPartColor(legRight) : (modelParts.legs[0] ? getPartColor(modelParts.legs[0]) : '#FFFFFF');

                console.log('=== COLORES OBTENIDOS ===');
                console.log('Head Color:', headColor);
                console.log('Torso Color:', torsoColor);
                console.log('Arm Left:', armLeftColor, 'Arm Right:', armRightColor);

                // ============================================
                // CONFIGURACIÓN DE TEMPLATES (Plantillas base)
                // ============================================
                const templates = [
                    { file: 'template-head-1.svg', color: headColor, textureName: null, layer: 1 },
                    { file: 'template-arm-left.svg', color: armLeftColor, textureName: null, layer: 2 },
                    { file: 'template-arm-right.svg', color: armRightColor, textureName: null, layer: 2 },
                    { file: 'template-leg-left.svg', color: legLeftColor, textureName: null, layer: 3 },
                    { file: 'template-leg-right.svg', color: legRightColor, textureName: null, layer: 3 },
                    { file: 'template-torso.svg', color: torsoColor, textureName: null, layer: 4 },
                    { file: 'template-border-logo.svg', color: null, textureName: null, layer: 5 },

                    // Texturas (Capa 6+)
                    { file: 'template-textures-layer.svg', color: null, textureName: 'arm-left-front', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'arm-left-back', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'arm-right-front', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'arm-right-back', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'leg-left-front', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'leg-left-back', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'leg-right-front', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'leg-right-back', layer: 6 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'torso-front', layer: 7 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'torso-back', layer: 7 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'hair-left', layer: 7 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'hair-right', layer: 7 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'hair-up', layer: 7 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'ear-left', layer: 8 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'ear-right', layer: 8 }
                ];

                // ============================================
                // CONFIGURACIÓN DE TEXTURAS (Offsets)
                // ============================================
                const textureOffsets = {
                    'eyes': { offsetX: 1413.9, offsetY: 759.9, width: 680.1, height: 680.1, rotation: 0, flipX: false },
                    'eyebrows': { offsetX: 1413.9, offsetY: 759.9, width: 680.1, height: 680.1, rotation: 0, flipX: false },
                    'nose': { offsetX: 1413.9, offsetY: 759.9, width: 680.1, height: 680.1, rotation: 0, flipX: false },
                    'ear-left': { offsetX: 2023.6, offsetY: 999.7, width: 680.1, height: 680.1, rotation: 45, flipX: true },
                    'ear-right': { offsetX: 580.9, offsetY: 2442.4, width: 680.1, height: 680.1, rotation: -135, flipX: false },
                    'hair-front': { offsetX: 916.8, offsetY: 403, width: 1674.2, height: 1674.2, rotation: 0, flipX: false },
                    'hair-back': { offsetX: 2046.2, offsetY: 403, width: 1674.2, height: 1674.2, rotation: 0, flipX: false },
                    'hair-back-2': { offsetX: 1461.7, offsetY: 403, width: 1674.2, height: 1674.2, rotation: 0, flipX: true },
                    'hair-left': { offsetX: 2023.6, offsetY: 999.7, width: 680.1, height: 680.1, rotation: 45, flipX: true },
                    'hair-right': { offsetX: 100, offsetY: 1961.4, width: 680.1, height: 680.1, rotation: -135, flipX: true },
                    'hair-up': { offsetX: 2504.4, offsetY: 518.8, width: 680.1, height: 680.1, rotation: 135, flipX: false },
                    'arm-left-front': { offsetX: 2969.6, offsetY: 960.6, width: 492.9, height: 492.9, rotation: 135, flipX: false },
                    'arm-left-back': { offsetX: 3159.2, offsetY: 771, width: 492.9, height: 492.9, rotation: 135, flipX: true },
                    'arm-right-front': { offsetX: 75.9, offsetY: 100, width: 492.9, height: 492.9, rotation: 0, flipX: false },
                    'arm-right-back': { offsetX: 1329.9, offsetY: 100, width: 492.9, height: 492.9, rotation: 0, flipX: true },
                    'leg-left-front': { offsetX: 2556.6, offsetY: 1979.7, width: 637.3, height: 637.3, rotation: -45, flipX: false },
                    'leg-left-back': { offsetX: 2817.6, offsetY: 1339.3, width: 637.3, height: 637.3, rotation: 135, flipX: false },
                    'leg-right-front': { offsetX: 2556.6, offsetY: 1979.7, width: 637.3, height: 637.3, rotation: -45, flipX: false },
                    'leg-right-back': { offsetX: 2817.6, offsetY: 1339.3, width: 637.3, height: 637.3, rotation: 135, flipX: false },
                    'torso-front': { offsetX: 2556.6, offsetY: 1979.7, width: 637.3, height: 637.3, rotation: -45, flipX: false },
                    'torso-back': { offsetX: 2817.6, offsetY: 1339.3, width: 637.3, height: 637.3, rotation: 135, flipX: false }
                };

                // Ordenar templates por layer
                const sortedTemplates = [...templates].sort((a, b) => a.layer - b.layer);

                // Procesar cada template
                const totalTemplatesPage1 = sortedTemplates.length;
                for (let i = 0; i < sortedTemplates.length; i++) {
                    const template = sortedTemplates[i];
                    updateProgress(10 + ((i + 1) / totalTemplatesPage1) * 40);

                    try {
                        let svgContent = await loadSVGFile(template.file);
                        if (!svgContent) continue;

                        if (template.color) {
                            svgContent = colorSVG(svgContent, template.color);
                        }

                        if (template.textureName) {
                            const textureURL = getCurrentTextureURL(template.textureName);
                            if (textureURL) {
                                const config = textureOffsets[template.textureName] || {
                                    offsetX: 0,
                                    offsetY: 0,
                                    width: null,
                                    height: null,
                                    rotation: 0,
                                    flipX: false
                                };

                                svgContent = await overlayTextureOnTemplate(
                                    svgContent,
                                    textureURL,
                                    config.offsetX,
                                    config.offsetY,
                                    config.width,
                                    config.height,
                                    config.rotation,
                                    config.flipX
                                );
                            }
                        }

                        const imageDataURL = await svgToImageDataURL(svgContent);
                        pdf.addImage(imageDataURL, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'SLOW');
                    } catch (err) {
                        console.error(`Error processing template ${template.file}:`, err);
                    }
                }

                updateProgress(50);
                pdf.addPage();

                const page2Templates = [
                    { file: 'template-head-2.svg', color: headColor, textureName: null, layer: 1 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'eyes', layer: 2 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'eyebrows', layer: 2 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'nose', layer: 2 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'hair-front', layer: 2 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'hair-back', layer: 2 },
                    { file: 'template-textures-layer.svg', color: null, textureName: 'hair-back-2', layer: 2 }
                ];

                const sortedPage2Templates = [...page2Templates].sort((a, b) => a.layer - b.layer);
                for (let i = 0; i < sortedPage2Templates.length; i++) {
                    const template = sortedPage2Templates[i];
                    updateProgress(60 + ((i + 1) / sortedPage2Templates.length) * 30);

                    try {
                        let svgContent = await loadSVGFile(template.file);
                        if (!svgContent) continue;

                        if (template.color) {
                            svgContent = colorSVG(svgContent, template.color);
                        }

                        if (template.textureName) {
                            const textureURL = getCurrentTextureURL(template.textureName);
                            if (textureURL) {
                                const config = textureOffsets[template.textureName] || {
                                    offsetX: 0, offsetY: 0, width: null, height: null, rotation: 0, flipX: false
                                };

                                let coloredTextureURL = textureURL;
                                if (template.textureName === 'nose') {
                                    const headColorHex = headColor.replace('#', '');
                                    const r = parseInt(headColorHex.substr(0, 2), 16);
                                    const g = parseInt(headColorHex.substr(2, 2), 16);
                                    const b = parseInt(headColorHex.substr(4, 2), 16);
                                    const darkenedColor = `#${Math.floor(r * 0.75).toString(16).padStart(2, '0')}${Math.floor(g * 0.75).toString(16).padStart(2, '0')}${Math.floor(b * 0.75).toString(16).padStart(2, '0')}`;

                                    const noseResponse = await fetch(textureURL);
                                    if (noseResponse.ok) {
                                        let noseSVG = await noseResponse.text();
                                        noseSVG = colorSVG(noseSVG, darkenedColor);
                                        const noseBlob = new Blob([noseSVG], { type: 'image/svg+xml;charset=utf-8' });
                                        coloredTextureURL = URL.createObjectURL(noseBlob);
                                    }
                                }

                                svgContent = await overlayTextureOnTemplate(
                                    svgContent, coloredTextureURL, config.offsetX, config.offsetY, config.width, config.height, config.rotation, config.flipX
                                );

                                if (template.textureName === 'nose' && coloredTextureURL !== textureURL) {
                                    URL.revokeObjectURL(coloredTextureURL);
                                }
                            }
                        }

                        const imageDataURL = await svgToImageDataURL(svgContent);
                        pdf.addImage(imageDataURL, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'SLOW');
                    } catch (err) {
                        console.error(`Error processing page 2 template ${template.file}:`, err);
                    }
                }

                updateProgress(100);
                await new Promise(resolve => setTimeout(resolve, 300));

                const isCustomArea = document.body.classList.contains('customization-active');
                const filename = isCustomArea ? 'Papelcool-Custom.pdf' : `Papelcool-${currentPresetCharacter || 'Character'}.pdf`;

                if (returnBlob) {
                    const pdfBlob = pdf.output('blob');
                    if (progressContainer && progressContainer.parentNode) {
                        progressContainer.remove();
                    }
                    return pdfBlob;
                } else {
                    await showDownloadButton(pdf, filename, progressContainer, percentText);
                }
            } catch (error) {
                console.error('❌ Error generating PDF:', error);
                console.log('❌ Error generating PDF:', error);
                alert('Error generating PDF: ' + error.message);
                throw error;
            }
        }

        const triggerGeneratePDF = () => {
            console.log('🖱️ Click en botón DOWNLOAD PDF detectado');
            generatePDF();
        };

        // Event listener para el botón de descargar PDF
        if (typeof downloadPdfBtn !== "undefined" && downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', triggerGeneratePDF);
        }
        if (downloadPdfBtnMoved) {
            downloadPdfBtnMoved.addEventListener('click', triggerGeneratePDF);
        } animate();

        // --- NEW CUSTOMIZATION UI LOGIC ---

        function initNewCustomizationUI() {
            console.log('Initializing New Customization UI...');
            const navButtons = document.querySelectorAll('.custom-nav-btn');

            navButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Remove active class from all
                    navButtons.forEach(b => b.classList.remove('active'));
                    // Add active class to clicked
                    e.currentTarget.classList.add('active');

                    const category = e.currentTarget.dataset.category;
                    populateOptionsGrid(category);
                });
            });

            // Initialize with Eyes
            populateOptionsGrid('eyes');
            populateGlobalColorPalette();
        }

        function populateOptionsGrid(category) {
            const grid = document.getElementById('custom-options-grid');
            if (!grid) return;
            grid.innerHTML = '';

            let items = [];
            let clickHandler = null;
            let type = 'texture';

            switch (category) {
                case 'eyes':
                    items = eyeTextures || [];
                    clickHandler = (item) => {
                        currentEyeTextureURL = item.url;
                        changeEyeTexture(item.url);
                    };
                    break;
                case 'eyebrows':
                    items = eyebrowTextures || [];
                    clickHandler = (item) => {
                        currentEyebrowTextureURL = item.url;
                        changeEyebrowTexture(item.url);
                    };
                    break;
                case 'nose':
                    items = noseTextures || [];
                    clickHandler = (item) => {
                        currentNoseTextureURL = item.url;
                        changeNoseTexture(item.url);
                    };
                    break;
                case 'hair':
                    items = hairTextures || [];
                    clickHandler = (item) => {
                        currentHairFrontURL = item.frontUrl;
                        currentHairBackURL = item.backUrl;
                        currentHairLeftURL = item.leftUrl;
                        currentHairRightURL = item.rightUrl;
                        currentHairUpURL = item.upUrl;
                        changeHairTexture(item.frontUrl, item.backUrl, item.leftUrl, item.rightUrl, item.upUrl);
                    };
                    break;
                case 'torso':
                    items = torsoClothingTextures || [];
                    type = 'clothing';
                    clickHandler = (item) => {
                        currentTorsoFrontURL = item.frontUrl;
                        currentTorsoBackURL = item.backUrl;
                        changeTorsoClothing(item.frontUrl, item.backUrl);
                    };
                    break;
                case 'legs':
                    items = legTextures || [];
                    type = 'clothing';
                    clickHandler = (item) => {
                        currentLegLeftURL = item.leftUrl;
                        currentLegRightURL = item.rightUrl;
                        changeLegClothing('left', item.leftUrl);
                        changeLegClothing('right', item.rightUrl);
                    };
                    break;
                case 'arms':
                    items = armTextures || [];
                    type = 'clothing';
                    clickHandler = (item) => {
                        currentArmLeftURL = item.leftUrl;
                        currentArmRightURL = item.rightUrl;
                        changeArmClothing('left', item.leftUrl);
                        changeArmClothing('right', item.rightUrl);
                    };
                    break;
            }

            items.forEach(item => {
                const btn = document.createElement('div');
                btn.className = 'grid-item-btn';
                const displayName = langManager.get('name-' + item.name.toLowerCase()) || item.name;
                btn.title = displayName;

                const img = document.createElement('img');
                const imgSrc = item.preview || item.url || item.frontUrl || item.leftUrl;

                if (imgSrc) {
                    img.src = imgSrc;
                    img.loading = 'lazy';
                    img.onerror = () => {
                        img.style.display = 'none';
                        const span = document.createElement('span');
                        span.className = 'text-[10px] text-center px-1';
                        span.textContent = displayName;
                        btn.appendChild(span);
                    };
                    btn.appendChild(img);
                } else {
                    const span = document.createElement('span');
                    span.className = 'text-[10px] text-center px-1';
                    span.textContent = displayName;
                    btn.appendChild(span);
                }

                btn.addEventListener('click', () => {
                    grid.querySelectorAll('.grid-item-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (clickHandler) clickHandler(item);
                });

                grid.appendChild(btn);
            });
        }

        function populateGlobalColorPalette() {
            const container = document.getElementById('global-color-palette');
            if (!container) return;
            container.innerHTML = '';

            const colors = [
                '#ffcd94', '#eac086', '#ffad60', '#ffe0bd', '#d1a3a4',
                '#a1665e', '#503335', '#592f2a', '#302e2e', '#472422'
            ];

            colors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch-circle';
                swatch.style.backgroundColor = color;

                swatch.addEventListener('click', () => {
                    container.querySelectorAll('.color-swatch-circle').forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');
                    changeSkinColor(color);
                });

                container.appendChild(swatch);
            });
        }

        function changeSkinColor(hexColor) {
            isCustomSkinColorSelected = true;
            const color = new THREE.Color(hexColor);

            // Helper to apply color excluding textures
            const applyToMesh = (mesh, excludeList) => {
                if (!mesh) return;
                mesh.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (excludeList.includes(child)) return;

                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => { if (mat.color) mat.color.copy(color); });
                        } else {
                            child.material.color.copy(color);
                        }
                    }
                });
            };

            const textureMeshes = [
                eyesMesh, eyebrowsMesh, noseMesh, earLeftMesh, earRightMesh,
                hairFrontMesh, hairBackMesh, hairLeftMesh, hairRightMesh, hairUpMesh,
                torsoFrontMesh, torsoBackMesh,
                armLeftFrontMesh, armLeftBackMesh, armRightFrontMesh, armRightBackMesh,
                legLeftFrontMesh, legLeftBackMesh, legRightFrontMesh, legRightBackMesh
            ];

            if (modelParts.head) {
                applyToMesh(modelParts.head, textureMeshes);
                applyNoseColor(color.getHex());
            }

            if (modelParts.torso) applyToMesh(modelParts.torso, textureMeshes);

            if (modelParts.arms) modelParts.arms.forEach(arm => applyToMesh(arm, textureMeshes));
            if (modelParts.legs) modelParts.legs.forEach(leg => applyToMesh(leg, textureMeshes));
            if (modelParts.ears) modelParts.ears.forEach(ear => applyToMesh(ear, textureMeshes));
        }

        // Initialize after a short delay to ensure DOM is ready
        setTimeout(initNewCustomizationUI, 500);
