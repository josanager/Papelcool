# Papelcool

**Editor 3D interactivo de personajes en estilo papercraft.**  
Pensado para quien quiere personalizar un personaje en el navegador, explorarlo en 3D y (opcionalmente) obtener plantillas asociadas.

## Demo en vivo

### [https://papel.cool](https://papel.cool)

Abre la web y prueba el editor sin instalar nada.

---

## Capturas

| Landing | Editor (ojos) | Detalle (cejas) |
|:---:|:---:|:---:|
| ![Landing de Papelcool](docs/screenshots/papelcool-01-home.png) | ![Editor 3D — personalización de ojos](docs/screenshots/papelcool-02-editor.png) | ![Personalización de cejas](docs/screenshots/papelcool-03-feature.png) |
| Página de inicio | Editor 3D: ojos | Editor 3D: cejas |

---

## Qué es / para qué sirve / objetivo

- **Qué es:** una web interactiva para crear y explorar personajes/presets 3D con estética de papel.
- **Para qué sirve:** personalizar rasgos (ojos, cejas, nariz, orejas, cabello, ropa, etc.), ver el resultado en tiempo real con Three.js y usar flujos de presets y plantillas.
- **Objetivo:** ofrecer una experiencia 3D ligera y usable en móvil y escritorio, con UI moderna y flujo de producto conectado a auth, pagos y generación de plantillas cuando hace falta.

---

## Stack

- **Three.js** (WebGL) — escena y personaje 3D
- **HTML / CSS** — interfaz (estilos con Tailwind compilado)
- **JavaScript** (vanilla) — lógica de la app

---

## Características (resumen)

- Editor 3D en tiempo real
- Personalización de personajes (ojos, cejas, nariz, orejas, cabello, ropa, …)
- Presets / mundos y vistas dedicadas (p. ej. preview de preset)
- Modo juego con controles de movimiento
- Interfaz responsive; atención a rendimiento en móvil
- Auth (Supabase) y flujos de plantillas / pago (Stripe) en el entorno desplegado

---

## Desarrollo local

Necesitas Node.js. Los estilos Tailwind se compilan en desarrollo/despliegue (no se usa el CDN de Tailwind en producción).

```bash
npm install
npm run build:css
```

Sirve el proyecto con un servidor HTTP local (no abras `index.html` con `file://`: CORS y assets 3D fallan). El CSS generado queda en `assets/css/tailwind.css`.

Opcional en desarrollo: `npm run watch:css` para recompilar estilos al cambiar.

---

## Notas de despliegue

Resumen de lo que ya documenta el repo (sin inventar configuración nueva):

- **Hosting:** Cloudflare Pages; dominio público `papel.cool`.
- **PDFs de presets (R2):** la Function `/api/preset-template-download` lee PDFs vía binding R2 privado `PRESET_PDFS_BUCKET` (no exponer `r2.dev` ni URLs directas del bucket). Prefijo por defecto `presets-pdfs/`; variable `PRESET_PDFS_PREFIX` si hace falta. En local puede usarse `PRESET_PDFS_DEV_BASE_URL` (solo desarrollo).
- **Plantillas custom + Stripe:** tras verificar el pago, Cloudflare Functions hablan con un generador externo (`TEMPLATE_GENERATOR_URL` / `TEMPLATE_GENERATOR_SECRET`) y KV `PAPELCOOL_STRIPE_ACCESS_KV`. Endpoints `/api/custom-template-job` y `/api/custom-template-download`. Secretos solo en Cloudflare / servicio generador, nunca en el frontend.
- Más detalle técnico móvil: `OPTIMIZACIONES_MOVILES.md`. Contexto de producto: `PROJECT_CONTEXT.md`.

---

## Licencia / uso

Proyecto personal de portfolio. Revisa el repositorio para el estado actual del código y de la demo.
