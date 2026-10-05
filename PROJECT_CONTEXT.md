# Papelcool Context

## Qué es

Papelcool es una web interactiva para crear y explorar personajes/presets 3D en estilo papercraft.

## Estado actual

- La web ya está en línea y funcionando.
- Se están midiendo métricas con Google Analytics.
- El dominio principal es `papel.cool`.
- La infraestructura pública se gestiona en Cloudflare.
- La base de datos y auth se apoyan en Supabase.

## Fuente de verdad

Lee estos archivos en este orden antes de cambiar algo:

1. `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. la skill local que aplique
4. el código real que vayas a tocar

## Reglas clave

- Si el cambio toca UI o diseño, respetar primero el lenguaje visual de Papelcool.
- Si el cambio toca login, registro o acciones bloqueadas por auth:
  - guardar el contexto exacto del usuario antes de abrir auth
  - devolver al usuario al mismo lugar después de login/registro

## Estado funcional importante

- Existe flujo de presets 3D con vista `preset-preview`.
- El visor de presets incluye modo foto con pose de tres cuartos, cámara y encuadre uniformes calibrados con ZocoVR, fondo blanco, la sombra de contacto original y acabado de papel exclusivo de este modo; exporta PNG cuadrado de 4096 × 4096 y vuelve a rasterizar los SVG para la descarga.
- Existe vista separada `tiktok` para filtros/videos de TikTok; no debe vivir dentro de la landing.
- Existe flujo de pago Stripe en modo test para el editor custom: pago único de 5 USD antes de solicitar el PDF personalizado.
- La plantilla custom se genera fuera de la web mediante una API asíncrona configurada con `TEMPLATE_GENERATOR_URL`.
- Cloudflare valida el pago, sanea el manifiesto y firma las peticiones al generador; el navegador nunca recibe el secreto externo.
- Stripe usa Pages Functions `/api/stripe/create-checkout-session`, `/api/stripe/verify-session` y `/api/stripe/webhook`; las claves secretas solo van en variables de Cloudflare.
- Existe auth con Supabase.
- Existe sistema de comentarios en implementación para presets.
- Los comentarios deben permitir lectura pública.
- Los comentarios deben bloquear escritura a invitados.
- Si auth empieza desde comentarios, al terminar debe reabrirse esa misma sección.
- En escritorio, `preset-preview` queda dividido en dos: 3D a la izquierda y comentarios a la derecha.
- En comentarios de presets, el orden por defecto es recientes primero y debe existir opción para ver los más gustados.

## Cambios recientes

- Se añadió una skill local de retorno de contexto auth.
- Se añadió una base de UI para comentarios de presets.
- El panel de comentarios de presets ya se monta dentro de `preset-preview`, abierto fijo en desktop y como overlay en móvil.
- Se añadió retorno de contexto auth para que login/registro desde comentarios vuelva al mismo preset y reabra el panel.
- Se definió la lógica guest vs authenticated en comentarios.
- Se reorganizó la navegación superior a Inicio, Personajes, TikTok, Personalizado y Favoritos.
- Se integró Stripe test para pago único de personalizados. No guardar `STRIPE_SECRET_KEY` ni `STRIPE_WEBHOOK_SECRET` en archivos del repo.
- Se desacopló la generación de PDFs custom mediante `/api/custom-template-job` y `/api/custom-template-download`.
- Se actualizaron los materiales de texturas superpuestas (overlays) a `MeshStandardMaterial` para responder de forma dinámica y uniforme a las luces y sombras del entorno 3D.
- Las texturas se publican desde `assets/textures/Texturas` en el mismo dominio que la web, sin dependencia de GitHub o jsDelivr durante la carga; el generador de plantillas acepta estas URLs del propio sitio.
- El sufijo hexadecimal de cada textura (por ejemplo, `-FE50C6.svg`) define el color base de su pieza 3D; cabeza, torso, cada brazo y cada pierna se recalculan por separado al cargar, editar o refrescar texturas.
- `Simon-faltastu-bajo` ya dispone de preset 3D completo con las texturas locales de Morat, incluido el bajo.
- `Martin-faltastu-bateria` ya dispone de preset 3D completo con las texturas locales de Morat, incluida la batería, las orejas específicas y la nariz vinculada al color de la cabeza.
- Las narices cuyo archivo usa el código `000000` (o están marcadas como `colorWithHead` cuando el SVG es blanco sin sufijo) se renderizan 25% más oscuras que la cabeza; las demás conservan su color propio.
- La plantilla `instrument` comparte posición Y `0.563` con `eyes`; su plano usa `5.556` para compensar el espacio transparente del SVG y conservar el tamaño visual esperado, tanto en presets como en el personalizador 3D.
- Todas las superficies `hair-back` del visor 3D se orientan 180° sobre el eje Y para mostrar la textura hacia el exterior del modelo.
- Se reemplazó el acceso público a Colecciones por Tienda; la vista `/?view=shop` muestra los 30 presets actuales como respaldo local y consume el catálogo público de Fourthwall mediante `/api/fourthwall/products` cuando `FOURTHWALL_STORE_URL` está configurada.
- La navegación superior incluye `Colecciones`, que abre el catálogo local (`/?view=presets`) para explorar los personajes; `Merch` mantiene el acceso externo a la tienda. Las acciones `Ver más` de los mundos y `Ver todos` de la portada también abren ese catálogo local.
- La integración de tienda conserva las tarjetas `fandom-card` existentes y abre las fichas/checkout de Fourthwall, donde se gestionan los productos PDF descargables. La vinculación con YouTube Shopping se autoriza desde Fourthwall → Apps → YouTube.

## Cómo mantener este archivo

Actualiza este archivo cuando cambie cualquiera de estas cosas:

- estado del producto
- dominio o infraestructura
- analítica
- auth
- comentarios
- vistas principales
- decisiones importantes de UX o arquitectura

## Objetivo

Este archivo debe seguir siendo corto, claro y actualizado.
No sustituye al código; sirve para ubicar rápido a cualquier IA o colaborador humano.
