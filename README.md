# Papelcool

Editor 3D interactivo de personajes con optimización completa para dispositivos móviles.

## 🎨 Características

- Editor 3D en tiempo real con Three.js
- Personalización completa de personajes (ojos, cejas, nariz, orejas, cabello, ropa)
- Modo juego con controles de movimiento
- Optimizado para iOS y Android
- Interfaz responsive y moderna

## 🚀 Optimizaciones Móviles

- Renderer optimizado para GPU móvil
- Liberación automática de memoria (dispose de texturas)
- Lazy loading de imágenes
- Controles táctiles mejorados (joystick + botón salto)
- Sin fugas de memoria en iOS

## 📱 Compatibilidad

- Safari iOS 12+
- Chrome iOS/Android
- Firefox móvil
- Edge móvil

## 🛠️ Tecnologías

- Three.js (WebGL)
- HTML5 + CSS3
- JavaScript vanilla

## Build de estilos

Tailwind se compila durante desarrollo/despliegue; no se carga su runtime CDN en producción.

```bash
npm install
npm run build:css
```

El archivo generado `assets/css/tailwind.css` debe desplegarse junto con el resto de assets.

## PDFs privados en Cloudflare R2

La Function `/api/preset-template-download` solo lee PDFs mediante un binding R2 privado llamado
`PRESET_PDFS_BUCKET`. En Cloudflare Pages, crea ese binding desde **Settings → Functions → R2 bucket
bindings** y apunta al bucket que contiene los PDFs. El dominio público `r2.dev` del bucket debe estar
desactivado.

Por defecto se buscan objetos bajo `presets-pdfs/<archivo>.pdf`. Define la variable de Pages
`PRESET_PDFS_PREFIX` como una cadena vacía si los PDFs están en la raíz del bucket, o usa otro prefijo.
No expongas URLs directas del bucket en el frontend.

Para desarrollo local puede definirse `PRESET_PDFS_DEV_BASE_URL` en `.env`; esta URL nunca se usa en
la Function desplegada.

## Generador externo de plantillas custom

Después de verificar Stripe, Papelcool envía el manifiesto de colores y texturas a una API externa a
través de Cloudflare Functions. Configura `TEMPLATE_GENERATOR_URL`, `TEMPLATE_GENERATOR_SECRET` y el
binding KV `PAPELCOOL_STRIPE_ACCESS_KV`. El secreto solo debe existir en Cloudflare y en el servicio
generador. La web utiliza `/api/custom-template-job` para crear/consultar trabajos y
`/api/custom-template-download` para descargar el PDF terminado.

## Fourthwall y YouTube Shopping

Papelcool mantiene el frontend nativo en HTML/JavaScript y consume el catálogo público de Fourthwall
mediante su feed JSON. Las tarjetas siguen siendo las mismas `fandom-card` de la web; al pulsar un
producto, se abre su ficha/checkout de Fourthwall, donde se entrega el PDF descargable de forma segura.
No se guarda ningún token de Fourthwall en el navegador.

Para conectar la tienda:

1. Crea la tienda en Fourthwall y publica tus productos digitales PDF desde **Dashboard → Products**.
2. Define `FOURTHWALL_STORE_URL` con la URL pública, por ejemplo `https://tu-tienda.fourthwall.com`.
3. Opcionalmente define `FOURTHWALL_COLLECTION` si quieres mostrar una colección concreta; por defecto
   se usa `all`.
4. Arranca el servidor local con `node dev-server.mjs` y abre `/?view=shop`.
5. En producción, configura las mismas variables en Cloudflare Pages. La Function
   `/api/fourthwall/products` consulta `/collections/all.json`, normaliza precios e imágenes y solo
   devuelve los campos necesarios para Papelcool.

Fourthwall no cobra cuota mensual ni de alta; aplica sus comisiones por venta. Para YouTube, entra en
**Fourthwall → Apps → YouTube**, autoriza el canal y espera la revisión de YouTube Shopping. La conexión
del canal requiere autorización de tu cuenta y no se puede completar desde este repositorio.

Requisitos externos: tienda publicada, checkout y descarga probados, políticas de devolución/contacto
visibles y elegibilidad del canal para YouTube Shopping. El feed público sirve para mostrar el catálogo;
la compra y la entrega digital siguen ocurriendo en Fourthwall.

Mientras `FOURTHWALL_STORE_URL` no esté configurada, Tienda muestra los 30 presets locales como respaldo
visual. En cuanto pongas la URL real, la vista cambia automáticamente al catálogo publicado de Fourthwall.

Documentación oficial: [catálogo público de Fourthwall](https://docs.fourthwall.com/shop-apis/shop-feeds),
[productos digitales](https://docs.fourthwall.com/guides/create-digital-products),
[integración con YouTube](https://fourthwall.com/features/apps-and-integrations/youtube-merch-shelf) y
[precios](https://fourthwall.com/pricing/).

## 📄 Documentación

Ver `OPTIMIZACIONES_MOVILES.md` para detalles técnicos completos.
