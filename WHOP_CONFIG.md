# Configuración de Whop OAuth - Solución al error redirect_uri

## 🔴 Error actual
```
redirect_uri no válido. Si eres el desarrollador de esta aplicación,
especifica un URI de redirección válido o actualiza tu aplicación.
```

## ✅ Solución

Este error ocurre porque el `redirect_uri` configurado en tu aplicación de Whop no coincide con el que está usando el Worker de Cloudflare.

### Pasos para corregir:

1. **Ir al dashboard de Whop**
   - Accede a: https://whop.com/apps
   - Inicia sesión si es necesario

2. **Seleccionar tu aplicación OAuth**
   - Busca la aplicación con Client ID: `app_Nob8AG75YcmU4Z`
   - Haz clic para editar/configurar

3. **Actualizar Redirect URIs**
   En la sección de "OAuth Redirect URIs" o "Callback URLs", asegúrate de tener **EXACTAMENTE** esta URL:
   ```
   https://papelcool.com/api/auth/callback
   ```
   
   **IMPORTANTE:**
   - ✅ Debe ser `https://` (no `http://`)
   - ✅ No debe terminar con `/` (sin barra final)
   - ✅ Debe coincidir exactamente, incluidas mayúsculas/minúsculas

4. **Guardar cambios**
   - Asegúrate de guardar/aplicar los cambios en el dashboard de Whop
   - Los cambios pueden tardar unos segundos en propagarse

5. **Probar de nuevo**
   - Ve a https://papelcool.com
   - Haz clic en cualquier preset
   - Haz clic en el botón de Download PDF
   - En el modal, haz clic en "Login with Whop"
   - Ahora debería funcionar correctamente

## 📝 Configuración completa de Whop App

Para referencia, esta es la configuración completa de tu aplicación OAuth:

```
Application Name: Papelcool
Client ID: app_Nob8AG75YcmU4Z
Client Secret: uuzT_bcta647tVDTd3JmMHeYWcfFQG-rjpUyJb9UozM
Redirect URIs: https://papelcool.com/api/auth/callback
Scopes: user:read, memberships:read
```

## ❓ Si el problema persiste

1. Verifica que no haya espacios al inicio o final del redirect_uri en Whop
2. Asegúrate de que el dominio `papelcool.com` esté correctamente configurado en Cloudflare
3. Verifica que el Worker de Cloudflare tenga la ruta configurada: `https://papelcool.com/api/auth/*`
4. Intenta limpiar cookies y caché del navegador
5. Prueba en una ventana de incógnito

## 🔍 Debugging

Si quieres ver exactamente qué redirect_uri está enviando el Worker, puedes:

1. Abrir DevTools del navegador (F12)
2. Ir a la pestaña "Network"
3. Hacer clic en "Login with Whop"
4. Buscar la petición a `whop.com/oauth`
5. Ver los parámetros de la URL, específicamente `redirect_uri`

Debería mostrar: `redirect_uri=https://papelcool.com/api/auth/callback`
