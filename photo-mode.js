import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const EXPORT_SIZE = 4096;
// NDC spans -1…1, so this gives the reference model about 67.5% of the frame.
const PHOTO_REFERENCE_FRAME_HEIGHT = 1.35;
// Calibrated from ZocoVR's normalized model so every preset shares the same
// square-photo framing, regardless of the size of its SVG accessories.
const PHOTO_CAMERA_TARGET = new THREE.Vector3(0, 1.23157, 0.00028);
const PHOTO_CAMERA_POSITION = new THREE.Vector3(-2.42029, 2.05956, 6.36947);
const CAMERA_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h4l2-3h4l2 3h4a1 1 0 0 1 1 1v13H3V7a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="4"/></svg>';
const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>';

// Noise in model space gives every face and printed SVG the same paper finish,
// including geometry without UVs. It is never installed on the live materials.
const PAPER_SHADER = `
varying vec3 vPaperPosition;
float paperHash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float paperNoise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(paperHash(i), paperHash(i+vec3(1,0,0)),f.x),
                   mix(paperHash(i+vec3(0,1,0)),paperHash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(paperHash(i+vec3(0,0,1)),paperHash(i+vec3(1,0,1)),f.x),
                   mix(paperHash(i+vec3(0,1,1)),paperHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float paperGrain(vec3 p) {
    vec3 fine = p*260.0, fiber = p*vec3(1050.0,210.0,1050.0);
    float fineFilter = 1.0-smoothstep(0.3, 1.2, length(fwidth(fine)));
    float fiberFilter = 1.0-smoothstep(0.3, 1.2, length(fwidth(fiber)));
    return 0.5 + 0.65*(paperNoise(fine)-0.5)*fineFilter
               + 0.35*(paperNoise(fiber)-0.5)*fiberFilter;
}
`;

function paperMaterial(source) {
    const material = new THREE.MeshPhysicalMaterial({
        color: source.color?.clone() || new THREE.Color(0xffffff),
        map: source.map || null,
        side: source.side,
        transparent: source.transparent,
        opacity: source.opacity,
        alphaTest: source.alphaTest,
        depthWrite: source.depthWrite,
        depthTest: source.depthTest,
        polygonOffset: source.polygonOffset,
        polygonOffsetFactor: source.polygonOffsetFactor,
        polygonOffsetUnits: source.polygonOffsetUnits,
        roughness: 0.76, metalness: 0, envMapIntensity: 0.65,
        sheen: 0.18, sheenColor: new THREE.Color(0xfffaf2), sheenRoughness: 0.85,
        clearcoat: 0
    });
    material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPaperPosition;')
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvPaperPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${PAPER_SHADER}`)
            .replace('#include <color_fragment>', '#include <color_fragment>\nfloat paperFiber = paperGrain(vPaperPosition);\ndiffuseColor.rgb *= 0.975 + 0.04 * paperFiber;')
            .replace('#include <tonemapping_fragment>', `float photoLuma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
                gl_FragColor.rgb = mix(vec3(photoLuma), gl_FragColor.rgb, 1.18);
                #include <tonemapping_fragment>`)
            .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (paperFiber - 0.5) * 0.1, 0.58, 0.94);')
            .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
                float paperHeight = paperFiber * 0.00018 + paperNoise(vPaperPosition * 48.0) * 0.00008;
                vec3 paperQ0 = dFdx(-vViewPosition), paperQ1 = dFdy(-vViewPosition);
                vec3 paperR0 = cross(paperQ1, normal), paperR1 = cross(normal, paperQ0);
                float paperDet = dot(paperQ0, paperR0);
                vec3 paperGradient = sign(paperDet) * (dFdx(paperHeight)*paperR0 + dFdy(paperHeight)*paperR1);
                normal = normalize(abs(paperDet)*normal - paperGradient);
            `);
    };
    material.customProgramCacheKey = () => 'papelcool-paper-photo-v1';
    return material;
}

function visibleCharacterBounds(root) {
    const bounds = new THREE.Box3();
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = alphaCanvas.height = 64;
    const alphaContext = alphaCanvas.getContext('2d', { willReadFrequently: true });
    root.updateMatrixWorld(true);
    root.traverseVisible((mesh) => {
        if (!mesh.isMesh) return;
        const map = Array.isArray(mesh.material) ? mesh.material.find((material) => material.map?.image)?.map : mesh.material?.map;
        if (mesh.geometry.type === 'PlaneGeometry' && map?.image && alphaContext) {
            // Use visible ink for SVG planes so transparent padding does not
            // make one hairstyle or instrument change the shared framing.
            alphaContext.clearRect(0, 0, 64, 64);
            alphaContext.drawImage(map.image, 0, 0, 64, 64);
            const pixels = alphaContext.getImageData(0, 0, 64, 64).data;
            let minX = 64, minY = 64, maxX = -1, maxY = -1;
            for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
                if (pixels[(y * 64 + x) * 4 + 3] < 115) continue;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x + 1);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y + 1);
            }
            if (maxX >= 0) {
                for (const x of [minX, maxX]) for (const y of [minY, maxY]) {
                    bounds.expandByPoint(new THREE.Vector3(
                        (x / 64 - 0.5) * mesh.geometry.parameters.width,
                        (0.5 - y / 64) * mesh.geometry.parameters.height, 0
                    ).applyMatrix4(mesh.matrixWorld));
                }
            }
            return;
        }
        mesh.geometry.computeBoundingBox();
        bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
    });
    if (bounds.isEmpty()) throw new Error('El personaje todavía no está listo.');
    return bounds;
}

function fitPhotoModelToReference(model, camera) {
    const groundY = visibleCharacterBounds(model).min.y;
    // Normalize the projected height, not the raw world height: accessories at
    // different depths otherwise still look like they have different zoom.
    for (let pass = 0; pass < 3; pass++) {
        const bounds = visibleCharacterBounds(model);
        let minY = Infinity, maxY = -Infinity;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
            const projectedY = new THREE.Vector3(x, y, z).project(camera).y;
            minY = Math.min(minY, projectedY);
            maxY = Math.max(maxY, projectedY);
        }
        const projectedHeight = maxY - minY;
        if (!Number.isFinite(projectedHeight) || projectedHeight <= 0) throw new Error('No se pudo medir el encuadre del personaje.');
        const scale = PHOTO_REFERENCE_FRAME_HEIGHT / projectedHeight;
        model.scale.multiplyScalar(scale);
        model.updateMatrixWorld(true);
        const scaledBounds = visibleCharacterBounds(model);
        // Keep every pair of feet on the same baseline as the ZocoVR reference.
        model.position.y += groundY - scaledBounds.min.y;
        model.updateMatrixWorld(true);
    }
}

function fitPhotoCamera(camera) {
    // All presets use the same normalized base rig; camera framing stays fixed
    // so a different hair, instrument or SVG plane cannot change zoom or crop.
    camera.position.copy(PHOTO_CAMERA_POSITION);
    camera.lookAt(PHOTO_CAMERA_TARGET);
    camera.near = 0.2;
    camera.far = 15;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
}

async function rasterTexture(url, limit) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { image.src = ''; reject(new Error('No se pudo preparar una textura para la foto.')); }, 15000);
        image.onload = () => { clearTimeout(timeout); resolve(); };
        image.onerror = () => { clearTimeout(timeout); reject(new Error('No se pudo cargar una textura para la foto.')); };
        image.src = url;
    });
    const scale = limit / Math.max(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar la imagen.');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
}

export function createPresetPhotoMode({ container, getSource, prepare, onActiveChange }) {
    const toolbar = document.createElement('div');
    toolbar.className = 'preset-photo-toolbar';
    toolbar.hidden = true;
    toolbar.innerHTML = `<button class="preset-photo-button" type="button" aria-pressed="false">${CAMERA_ICON}<span>Modo foto</span></button><p class="preset-photo-error" role="status" hidden></p>`;
    const toggle = toolbar.querySelector('button');
    const photoError = toolbar.querySelector('p');
    const surface = document.createElement('div');
    surface.className = 'preset-photo-surface';
    surface.hidden = true;
    surface.innerHTML = `<div class="preset-photo-frame"></div><div class="preset-photo-footer"><button type="button" class="preset-photo-button preset-photo-download">${DOWNLOAD_ICON}<span>Descargar foto</span></button><p class="preset-photo-status" role="status" aria-live="polite">PNG · 4096 × 4096 · Fondo blanco</p></div>`;
    container.append(surface, toolbar);
    const frame = surface.querySelector('.preset-photo-frame');
    const download = surface.querySelector('button');
    const status = surface.querySelector('[role="status"]');
    let runtime = null, generation = 0, busy = false;

    function refresh() { toolbar.hidden = !getSource().available; if (toolbar.hidden) close(false); }
    function resize() {
        if (!runtime || download.disabled) return;
        const size = Math.max(1, Math.floor(Math.min(frame.clientWidth, frame.clientHeight)));
        frame.style.setProperty('--photo-size', `${size}px`);
        runtime.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        runtime.renderer.setSize(size, size, false);
        runtime.renderer.render(runtime.scene, runtime.camera);
    }
    function close(focus = true) {
        if (!runtime && !busy) return;
        generation++;
        surface.hidden = true;
        document.body.classList.remove('preset-photo-active');
        toggle.setAttribute('aria-pressed', 'false');
        toggle.querySelector('span').textContent = 'Modo foto';
        toggle.disabled = false;
        download.disabled = false;
        busy = false;
        if (runtime) {
            runtime.materials.forEach((material) => material.dispose());
            runtime.environment?.dispose();
            runtime.renderer.dispose();
            runtime.renderer.forceContextLoss();
            runtime = null;
        }
        frame.replaceChildren();
        onActiveChange(false);
        if (focus && !toolbar.hidden) toggle.focus();
    }
    async function enter() {
        if (busy || !getSource().available) return;
        busy = true;
        photoError.hidden = true;
        toggle.disabled = true;
        toggle.querySelector('span').textContent = 'Preparando…';
        const token = ++generation;
        try {
            await prepare();
            if (token !== generation || !getSource().available) return;
            const source = getSource();
            if (!source.model) throw new Error('Espera a que cargue el personaje.');
            const photoRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
            photoRenderer.outputColorSpace = THREE.SRGBColorSpace;
            photoRenderer.toneMapping = THREE.ACESFilmicToneMapping;
            photoRenderer.toneMappingExposure = 1.1;
            const photoScene = new THREE.Scene();
            const materials = [];
            runtime = { renderer: photoRenderer, scene: photoScene, materials, environment: null, name: source.name };
            photoScene.background = new THREE.Color(0xffffff);
            const pmrem = new THREE.PMREMGenerator(photoRenderer);
            const room = new RoomEnvironment();
            const environment = pmrem.fromScene(room, 0.04);
            runtime.environment = environment;
            room.dispose(); pmrem.dispose();
            photoScene.environment = environment.texture;
            photoScene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9c0, 0.8));
            const key = new THREE.DirectionalLight(0xffffff, 2.0);
            key.position.set(-3, 6, 5); photoScene.add(key);
            const fill = new THREE.DirectionalLight(0xffffff, 0.5);
            fill.position.set(4, 2, 3); photoScene.add(fill);
            const model = source.model.clone(true);
            model.traverse((mesh) => {
                if (!mesh.isMesh) return;
                const convert = (original) => { const material = paperMaterial(original); materials.push(material); return material; };
                mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
            });
            const photoCamera = new THREE.PerspectiveCamera(32, 1, 0.2, 15);
            fitPhotoCamera(photoCamera);
            photoScene.add(model);
            fitPhotoModelToReference(model, photoCamera);
            const shadow = source.shadow?.clone();
            if (shadow) { shadow.visible = true; photoScene.add(shadow); }
            runtime = { renderer: photoRenderer, scene: photoScene, camera: photoCamera, model, materials, environment, name: source.name };
            frame.append(photoRenderer.domElement);
            surface.hidden = false;
            document.body.classList.add('preset-photo-active');
            toggle.querySelector('span').textContent = 'Salir de foto';
            toggle.setAttribute('aria-pressed', 'true');
            status.textContent = 'PNG · 4096 × 4096 · Fondo blanco';
            onActiveChange(true);
            resize();
        } catch (error) {
            close(false);
            console.error('Modo foto:', error);
            const message = error?.message || 'No se pudo preparar la foto. Espera a que carguen las texturas e inténtalo de nuevo.';
            toggle.querySelector('span').textContent = 'Reintentar foto';
            toggle.title = message;
            photoError.textContent = message;
            photoError.hidden = false;
        } finally {
            if (token === generation) { busy = false; toggle.disabled = false; }
        }
    }
    async function exportPhoto() {
        if (!runtime || busy) return;
        busy = true; download.disabled = true; toggle.disabled = true;
        status.textContent = 'Preparando la foto en alta calidad…';
        const current = runtime, token = generation, replacements = [], textures = new Map();
        try {
            const gl = current.renderer.getContext();
            const supported = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), current.renderer.capabilities.maxTextureSize);
            if (supported < EXPORT_SIZE) throw new Error('Este dispositivo no admite fotos de 4096 px. Prueba en un ordenador.');
            // Rasterize the original SVGs again instead of enlarging the viewer's low-resolution maps.
            for (const material of current.materials) {
                const url = material.map?.userData?.sourceUrl;
                if (!url) continue;
                if (!textures.has(url)) textures.set(url, await rasterTexture(url, 2048));
                if (token !== generation) return;
                replacements.push([material, material.map]);
                material.map = textures.get(url);
                material.needsUpdate = true;
            }
            current.renderer.setPixelRatio(1);
            current.renderer.setSize(EXPORT_SIZE, EXPORT_SIZE, false);
            current.renderer.render(current.scene, current.camera);
            if (gl.isContextLost()) throw new Error('El dispositivo se quedó sin memoria para la foto. Inténtalo de nuevo.');
            const blob = await new Promise((resolve) => current.renderer.domElement.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('No se pudo guardar la foto.');
            if (token !== generation) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Papelcool-${current.name.replace(/[^a-z0-9_-]/gi, '-')}-4096.png`;
            document.body.append(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
            status.textContent = 'Foto lista · PNG · 4096 × 4096';
        } catch (error) {
            if (token === generation) status.textContent = error.message;
            console.error('Descarga de foto:', error);
        } finally {
            replacements.forEach(([material, map]) => { material.map = map; material.needsUpdate = true; });
            textures.forEach((texture) => { texture.dispose(); texture.image.width = texture.image.height = 1; });
            if (token === generation) { busy = false; download.disabled = false; toggle.disabled = false; resize(); }
        }
    }
    toggle.addEventListener('click', () => runtime ? close() : enter());
    download.addEventListener('click', exportPhoto);
    surface.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !busy) close(); });
    toolbar.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !busy) close(); });
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(frame);
    refresh();
    return { close, refresh, dispose() { close(false); observer.disconnect(); resizeObserver.disconnect(); toolbar.remove(); surface.remove(); } };
}
