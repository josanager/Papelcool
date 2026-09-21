# Prompt detallado para configurar comentarios de presets en Papelcool

Pega este prompt completo en tu otra IA con acceso al dashboard de Supabase y Cloudflare.

## Rol

Actúa como implementador técnico con acceso real al proyecto de producción/staging de Papelcool en Supabase y Cloudflare. No quiero teoría: quiero que revises la configuración actual, apliques solo los cambios mínimos necesarios y valides el flujo completo de comentarios para presets.

## Objetivo exacto

Dejar totalmente operativos los comentarios de personajes preset en Papelcool con este comportamiento ya preparado en el frontend local:

- Cada preset tiene su propio hilo usando `preset_slug`.
- La lectura es pública.
- Solo usuarios autenticados pueden comentar, responder y dar/quitar like.
- El panel de comentarios en escritorio aparece fijo a la derecha dentro de `preset-preview`.
- En móvil el panel abre como overlay desde abajo.
- El orden por defecto es `Más recientes`.
- Existe un selector para cambiar a `Más gustados`.
- Si el usuario intenta comentar o dar like sin sesión, se abre auth.
- Después de login o registro, el usuario debe volver exactamente al mismo preset y reabrir el panel de comentarios.

## Estado actual del frontend local

Asume como fuente de verdad local estos archivos:

- Proyecto local:
  `/Users/josanestrellaflores/Antigravity/Papelcool`
- Vista principal a probar:
  `http://localhost:8001/?view=preset-preview&preset=Steve`
- Script de comentarios:
  `/Users/josanestrellaflores/Antigravity/Papelcool/preset-comments.js`
- Lógica principal de la app:
  `/Users/josanestrellaflores/Antigravity/Papelcool/index.html`
- Auth:
  `/Users/josanestrellaflores/Antigravity/Papelcool/auth.js`
- SQL listo para ejecutar:
  `/Users/josanestrellaflores/Antigravity/Papelcool/supabase/preset-comments-schema.sql`

## Contexto funcional importante

- La base de datos y auth están en Supabase.
- El hosting público y funciones se gestionan con Cloudflare.
- La tabla pública `profiles` ya existe y la app la usa.
- `profiles.id` debe corresponder con `auth.users.id`.
- El frontend ya quedó preparado para:
  - leer `public.preset_comments`
  - leer/escribir `public.preset_comment_likes`
  - leer `public.profiles`
  - reabrir comentarios tras login/registro
- `auth.js` ya usa `redirectTo: window.location.href` en Google OAuth para no perder el contexto.
- `index.html` ya guarda y restaura el contexto auth desde comentarios.

## Lo que tienes que hacer

### 1. Confirmar el proyecto correcto

1. Entra al proyecto Supabase correcto de Papelcool.
2. Entra al proyecto correcto de Cloudflare Pages o al servicio real que sirve `papel.cool`.
3. Antes de cambiar nada, confirma en qué entorno estás trabajando:
   - producción
   - preview
   - staging

No hagas cambios a ciegas en otro proyecto parecido.

### 2. Configurar Supabase

1. Abre el SQL Editor.
2. Ejecuta exactamente el contenido de:
   `/Users/josanestrellaflores/Antigravity/Papelcool/supabase/preset-comments-schema.sql`
3. Verifica que existan estas tablas:
   - `public.preset_comments`
   - `public.preset_comment_likes`
4. Verifica que RLS esté activo en ambas.
5. Verifica estas reglas:
   - lectura pública de `preset_comments`
   - insert de `preset_comments` solo para autenticados con `auth.uid() = user_id`
   - update/delete de `preset_comments` solo por el dueño
   - lectura pública de `preset_comment_likes`
   - insert/delete de `preset_comment_likes` solo por el dueño
6. Verifica estas relaciones:
   - `preset_comments.user_id -> profiles.id`
   - `preset_comments.parent_id -> preset_comments.id`
   - `preset_comment_likes.comment_id -> preset_comments.id`
   - `preset_comment_likes.user_id -> profiles.id`
7. Comprueba que exista índice suficiente para carga razonable:
   - por `preset_slug`
   - por `parent_id`
   - por `comment_id`
   - por `user_id`

Si el SQL ya crea eso, no inventes más cambios.

### 3. Validar la tabla `profiles`

Revisa que:

- la tabla `public.profiles` exista
- tenga como mínimo `id`, `nickname`, `avatar_url`
- sea legible por el frontend para poder pintar el autor de cada comentario

Si falta una policy de lectura pública o autenticada necesaria para mostrar nombres, corrígela con el cambio mínimo indispensable.

No rediseñes la tabla `profiles`.

### 4. Crear datos de prueba reales

Necesito que dejes datos mínimos para verificar el sistema:

1. Usa una cuenta real o de prueba autenticada.
2. Crea al menos:
   - 1 comentario raíz para `preset_slug = 'Steve'`
   - 1 comentario raíz para otro preset, por ejemplo `Enderman`
   - 1 respuesta hija al comentario raíz de `Steve`
   - 1 o 2 likes repartidos en comentarios de `Steve`
3. Confirma que los comentarios de un preset no aparecen en otro.

### 5. Validaciones SQL obligatorias

Ejecuta consultas como estas y comprueba el resultado:

```sql
select id, preset_slug, parent_id, user_id, body, created_at
from public.preset_comments
where preset_slug = 'Steve'
order by created_at desc;

select comment_id, user_id, created_at
from public.preset_comment_likes
order by created_at desc;
```

Confirma:

- que la jerarquía padre-hijo existe
- que los likes se registran correctamente
- que no hay errores de policy
- que un usuario no puede duplicar likes si la restricción ya lo evita

### 6. Revisar configuración de Auth en Supabase

Ve a `Authentication > URL Configuration` y revisa:

- `Site URL`
- `Redirect URLs`

Debes dejar permitidas todas las URLs reales que usa el proyecto. No inventes dominios.

Como mínimo verifica si aplican estas:

- `http://localhost:8001`
- `https://TU-PROYECTO.pages.dev`
- `https://papel.cool`
- `https://www.papel.cool`

Además, confirma que el retorno desde Google OAuth puede volver a una URL con query params como:

- `?view=preset-preview&preset=Steve`

Eso es importante porque el frontend ahora depende de volver al mismo contexto.

### 7. Revisar Cloudflare

En Cloudflare, revisa el sitio o Pages project correcto y confirma:

1. Que el deploy activo incluye:
   - `index.html`
   - `preset-comments.js`
   - `auth.js`
   - `supabase-config.js`
2. Que no haya una regla de caché que esté sirviendo una versión vieja del `index.html`.
3. Que no haya CSP, WAF, Transform Rules o Rules que bloqueen:
   - `connect-src` hacia el proyecto Supabase real
   - peticiones `fetch` al API REST/Auth de Supabase
   - el callback OAuth de Supabase
4. Que no se estén bloqueando requests CORS del navegador hacia Supabase.

Si no hay bloqueo, dilo explícitamente y no toques nada innecesario.

### 8. Qué probar en navegador después de configurar

Haz pruebas funcionales reales en producción o preview:

1. Abrir un preset:
   - `?view=preset-preview&preset=Steve`
2. En escritorio horizontal:
   - confirmar que el área se ve partida en dos
   - 3D a la izquierda
   - comentarios a la derecha
3. Confirmar que si no hay comentarios suficientes:
   - aparece el estado vacío correcto
   - sigue visible el CTA para comentar
4. Confirmar que el selector funciona:
   - `Más recientes`
   - `Más gustados`
5. Como invitado:
   - poder leer comentarios
   - intentar escribir comentario
   - confirmar que abre login/registro
   - intentar dar like
   - confirmar que también abre login/registro
6. Tras login o registro:
   - volver al mismo preset
   - confirmar que comentarios sigue abierto
   - publicar comentario
   - responder a un comentario
   - dar like
   - quitar like
7. Recargar la página:
   - confirmar que los comentarios siguen
   - confirmar que el hilo corresponde al preset correcto
8. Entrar a otro preset:
   - confirmar que cambia el hilo
   - confirmar que no mezcla comentarios entre presets
9. En móvil o viewport vertical:
   - confirmar que el panel sigue como overlay
   - confirmar que se puede cerrar tocando fuera

### 9. Si encuentras errores

Si algo falla, clasifica la causa con precisión:

- tabla faltante
- RLS incorrecto
- policy insuficiente en `profiles`
- OAuth redirect URL mal configurada
- bloqueo de Cloudflare
- caché de Cloudflare
- deploy desactualizado

Corrige solo lo mínimo necesario y vuelve a probar.

No cambies otras features del sitio.

## Resultado que necesito de vuelta

Quiero un informe corto, preciso y accionable con este formato:

1. Entorno revisado
2. Cambios hechos en Supabase
3. Cambios hechos en Cloudflare
4. URLs de auth que quedaron permitidas
5. Pruebas que pasaron
6. Problemas pendientes, si existe alguno

## Restricciones

- No toques Stripe.
- No modifiques tablas no relacionadas salvo `profiles` si falta una policy estrictamente necesaria para mostrar autores.
- No reescribas la arquitectura.
- No propongas; ejecuta y valida.
