# Prompt para configurar comentarios de presets en Papelcool

Usa este prompt completo dentro de tu IA con acceso al dashboard de Supabase y Cloudflare.

## Objetivo

Configura en **Papelcool** un sistema de comentarios para los presets 3D con este comportamiento:

- Cada preset tiene su propio hilo de comentarios.
- Los comentarios son públicos para leer.
- Solo usuarios autenticados pueden comentar, responder y dar/quitar like.
- Las respuestas usan relación padre-hijo.
- Los likes se guardan por usuario y por comentario.
- La web ya tiene la UI implementada en `preset-comments.js`.
- La base de datos es **Supabase**.
- El hosting/backend operativo del proyecto está en **Cloudflare Pages / Cloudflare**.
- El proyecto no debe romper el login actual ni las tablas existentes.

## Contexto técnico del frontend ya implementado

- Proyecto: `Papelcool`
- Vista afectada: `http://localhost:8001/?view=preset-preview&preset=Enderman`
- Archivo frontend nuevo: `preset-comments.js`
- Script SQL preparado en el repo:
  `/Users/josanestrellaflores/Antigravity/Papelcool/supabase/preset-comments-schema.sql`
- Auth actual: Supabase Auth
- Tabla de perfiles ya usada por la app: `public.profiles`
- Clave de relación actual esperada:
  `profiles.id` coincide con `auth.users.id`

## Lo que tienes que hacer

### 1. En Supabase

1. Entra al proyecto correcto de Papelcool.
2. Abre el SQL Editor.
3. Ejecuta **exactamente** el contenido del archivo:
   `/Users/josanestrellaflores/Antigravity/Papelcool/supabase/preset-comments-schema.sql`
4. Verifica que se creen estas tablas:
   - `public.preset_comments`
   - `public.preset_comment_likes`
5. Verifica que ambas tengan RLS activado.
6. Verifica que existan estas políticas:
   - lectura pública de comentarios
   - inserción de comentarios solo para usuarios autenticados y solo con `auth.uid() = user_id`
   - update/delete de comentarios solo por su dueño
   - lectura pública de likes
   - inserción y borrado de likes solo por su dueño
7. Verifica que existan estas relaciones:
   - `preset_comments.user_id -> profiles.id`
   - `preset_comments.parent_id -> preset_comments.id`
   - `preset_comment_likes.comment_id -> preset_comments.id`
   - `preset_comment_likes.user_id -> profiles.id`
8. Crea datos de prueba manualmente:
   - inicia sesión con una cuenta real o crea una cuenta de prueba
   - inserta 1 comentario raíz para `preset_slug = 'Enderman'`
   - inserta 1 respuesta a ese comentario
   - inserta 1 like para uno de los comentarios

### 2. Verificación en Supabase

Comprueba con consultas SQL:

```sql
select * from public.preset_comments where preset_slug = 'Enderman' order by created_at asc;
select * from public.preset_comment_likes;
```

Confirma:

- que aparecen los comentarios
- que `parent_id` funciona
- que el like quedó registrado
- que no hay errores de permisos

### 3. Auth URLs en Supabase

Ve a **Authentication > URL Configuration** y revisa:

- `Site URL`
- `Redirect URLs`

Debes asegurarte de incluir:

- el dominio de producción de Papelcool en Cloudflare
- el dominio `*.pages.dev` si la app corre en Cloudflare Pages
- el dominio local si se usa para pruebas

Como mínimo, añade las URLs reales que use el proyecto, por ejemplo:

- `http://localhost:8001`
- `https://TU-PROYECTO.pages.dev`
- `https://TU-DOMINIO-REAL.com`

No inventes dominios. Usa los dominios reales existentes del proyecto.

### 4. En Cloudflare

Revisa la app correcta de Papelcool en Cloudflare Pages o el producto que estén usando para producción.

Comprueba:

1. Que el deploy activo incluye el archivo `preset-comments.js`.
2. Que no haya reglas de caché o transformaciones que rompan:
   - `index.html`
   - `preset-comments.js`
   - `auth.js`
   - `supabase-config.js`
3. Que no existan reglas que bloqueen llamadas del navegador a:
   - `https://gofmxpasmptpuckmlvpc.supabase.co`
4. Que CSP, WAF o Rules no estén bloqueando:
   - `connect-src` hacia Supabase
   - peticiones `fetch`
   - respuestas de auth de Supabase
5. Si existe una política CSP custom, asegúrate de que permita como mínimo:
   - `connect-src` al dominio de Supabase del proyecto
   - assets actuales del sitio

Si Cloudflare no tiene CSP custom ni reglas bloqueantes, dilo explícitamente y no cambies nada innecesario.

### 5. Pruebas funcionales obligatorias

Prueba estos casos en producción o preview:

1. Abrir un preset:
   - `?view=preset-preview&preset=Enderman`
2. Ver el botón flotante de comentarios a la derecha.
3. En móvil:
   - pulsar el botón
   - confirmar que sale un panel desde abajo
   - pulsar fuera
   - confirmar que se cierra
4. En horizontal/desktop:
   - abrir comentarios
   - confirmar que sale panel flotante a la derecha
5. Como usuario no logueado:
   - ver comentarios
   - intentar comentar
   - confirmar que pide login
   - intentar dar like
   - confirmar que pide login
6. Como usuario logueado:
   - publicar comentario
   - responder comentario
   - dar like
   - quitar like
7. Confirmar que los datos persisten tras recargar.
8. Confirmar que cambiar de preset cambia también el hilo de comentarios.

### 6. Si encuentras errores

Si falla algo:

- no improvises cambios grandes
- identifica si el fallo es:
  - RLS
  - tabla ausente
  - relación mal creada
  - URL de auth
  - CSP / bloqueo de Cloudflare
  - caché
- corrige solo lo mínimo necesario
- vuelve a probar el flujo completo

## Resultado esperado

Al final necesito un informe corto y preciso con:

1. Qué cambiaste en Supabase
2. Qué cambiaste en Cloudflare
3. Qué URLs de auth quedaron configuradas
4. Qué pruebas pasaron
5. Qué problema queda pendiente, si existe alguno

No toques otras tablas del proyecto fuera de lo necesario para esta feature.
