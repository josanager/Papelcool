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
- El visor de presets incluye modo foto con pose de tres cuartos, cámara, escala y posición uniformes fijadas con la referencia de ZocoVR para que todos los modelos 3D compartan exactamente el mismo tamaño físico sin importar peinados, accesorios ni instrumentos, fondo blanco, la sombra de contacto original y acabado de papel exclusivo de este modo; exporta PNG cuadrado de 4096 × 4096 y vuelve a rasterizar los SVG para la descarga.
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
- Las superficies `hair-back` del visor 3D usan rotación `[0, 0, 0]` para alinear la textura en su eje vertical y coincidir con la orientación correcta del peinado y accesorios sin invertirse horizontalmente.
- Se reemplazó el acceso público a Colecciones por Tienda; la vista `/?view=shop` muestra los 30 presets actuales como respaldo local y consume el catálogo público de Fourthwall mediante `/api/fourthwall/products` cuando `FOURTHWALL_STORE_URL` está configurada.
- La navegación superior incluye `Colecciones`, que abre el catálogo local (`/?view=presets`) para explorar los personajes; `Merch` mantiene el acceso externo a la tienda. Las acciones `Ver más` de los mundos y `Ver todos` de la portada también abren ese catálogo local.
- La integración de tienda conserva las tarjetas `fandom-card` existentes y abre las fichas/checkout de Fourthwall, donde se gestionan los productos PDF descargables. La vinculación con YouTube Shopping se autoriza desde Fourthwall → Apps → YouTube.
- El modo foto fija la escala y posición de todos los personajes a las dimensiones de ZocoVR (`PHOTO_MODEL_SCALE` y `PHOTO_MODEL_POSITION`), asegurando que todos tengan el mismo tamaño físico de cuerpo/cabeza y misma posición base sobre la sombra sin encogerse por la presencia de peinados altos o accesorios. La posición vertical de la cámara (`PHOTO_CAMERA_TARGET` y `PHOTO_CAMERA_POSITION`) se ajustó hacia arriba para dejar espacio superior suficiente sin cortar peinados altos como el de Camilo. Además, se calibró la iluminación y contraste equilibrado (exposición 0.98, luz principal 1.52, relleno 0.28, hemisferio 0.42, mapa de entorno 0.38, sin velo de sheen y con suave curva S al 20% en el shader) para mantener sombras limpias y colores vivos sin contraste excesivo.
- La vista inicial de portada (`papel.cool`) se rediseñó a pantalla completa inmersiva (100dvh/100vw) con fondo degradado radial de azules (#38BDF8 a #0284C7), título pop-art en dos líneas «ARMALO COMO QUIERAS!!», botones con bordes negros «COMPRAR AHORA» (redirecciona a store.papel.cool) y «CREA EL TUYO» (continúa al editor 3D personalizado), y el personaje 3D rotando en su eje mientras alterna colores y texturas. Se amplió el espacio 3D en el layout (slot de 94vh / 920px y columnas 1fr 1.25fr en desktop; altura 56vh / 520px en móvil) y se aumentó la presencia del modelo (boost 1.62 en desktop y 1.54 en móvil) manteniendo la cámara retirada a distancia Z = 7.15 con FOV 52/50 y overflow visible para que el modelo luzca más grande e imponente sin que los peinados ni accesorios altos se corten en ningún ángulo. En pantallas horizontales el personaje se alinea a la derecha con margen de respiro y el contenido a la izquierda; en pantallas verticales (móviles/portrait) el título, el modelo 3D y los botones se centran tanto en ancho como en alto sin scroll. Las demás secciones de la landing (`.lp-promo-bar`, mundos, best sellers, bundles, top downloads, proof/FAQ, footer y topbar global) se conservan intactas en el código pero ocultas mediante CSS.
- Al hacer clic en «CREA EL TUYO» (o ingresar a `/?view=custom`), el flujo entra directamente al editor en el paso 1 («Color base»), eliminando la pantalla introductoria y el botón flotante «Empezar». La barra de navegación superior global queda oculta en todo el flujo custom para una experiencia inmersiva limpia a pantalla completa. El fondo en custom adopta el mismo degradado radial azul (#38BDF8 a #0284C7) ocultando las formas flotantes pop-art. En el paso 1, el botón anterior muestra «Inicio» para regresar a la portada, y en los pasos sucesivos «Anterior»/«Siguiente» hasta completar los 13 pasos. La cámara del visor custom se calibró a Z = 5.8 (desktop) y Z = 5.6 (móvil) para ofrecer amplio margen superior sin cortar el modelo.
- En el resultado final terminado del modo custom (`phase === 'finished'` / `custom-editor-finished`), los botones «Editar otra vez» y «Pagar y descargar» se apilan verticalmente uno encima del otro en la esquina superior derecha con márgenes superior y derecho iguales (14px en desktop, 12px en móvil). El contenedor 3D (`#canvas-container`) aprovecha el 100% visible de la pantalla (`inset: 0; 100vw × 100dvh`) eliminando el offset de cabecera que provocaba el corte horizontal en la parte superior. La cámara final se calibra a Z = 6.1 (desktop) y Z = 6.35 (móvil) con objetivo centrado para ofrecer amplio margen de seguridad superior evitando que peinados altos o accesorios se corten.

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
