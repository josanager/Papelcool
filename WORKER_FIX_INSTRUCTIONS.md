# 🔧 Instrucciones para corregir Worker y resolver loop infinito

## 🔴 Problema actual

1. **Error en consola**: `Session check error: {}`
2. **Loop infinito de login**: Usuario se loguea → vuelve a papelcool → NO está logueado → intenta descargar → pide login otra vez

## 🎯 Causa raíz

El problema es que después del callback OAuth:
- La cookie de sesión NO se está estableciendo correctamente
- O el endpoint `/api/auth/session` NO está leyendo la cookie
- Resultado: El usuario se loguea pero el frontend no detecta la sesión

## ✅ Solución paso a paso

### Paso 1: Actualizar código del Worker

He creado un Worker actualizado con los siguientes cambios:

**Archivo**: `cloudflare-worker-updated.js`

**Cambios importantes**:
1. ✅ Añadido `Domain=papelcool.com` en las cookies
2. ✅ Mejorado manejo de CORS con headers correctos
3. ✅ Añadido logs detallados para debugging
4. ✅ Mejor manejo de errores
5. ✅ Cache-Control en `/api/auth/session` para evitar cacheo

### Paso 2: Reemplazar código en Cloudflare

1. **Ve al dashboard de Cloudflare Workers**
   - URL: https://dash.cloudflare.com
   - Navega a: Workers & Pages → tu Worker

2. **Editar código**
   - Click en "Edit Code" o "Quick Edit"
   - **BORRA TODO** el código actual
   - **COPIA Y PEGA** el contenido de `cloudflare-worker-updated.js`

3. **Verificar Secrets (no cambiar)**
   ```
   JWT_SECRET          = a9d3f0c74b8a2d5f9c1e67b2543a8dc2f9e3a1b0c6d7e84531f2ab9c08de7f5a
   WHOP_CLIENT_ID      = app_Nob8AG75YcmU4Z
   WHOP_CLIENT_SECRET  = uuzT_bcta647tVDTd3JmMHeYWcfFQG-rjpUyJb9UozM
   WHOP_PLAN_ID        = plan_RU15lzvMLBOB3
   ```

4. **Deploy el Worker**
   - Click en "Save and Deploy"
   - Espera confirmación de deploy exitoso

### Paso 3: Verificar Routes

Asegúrate de tener SOLO esta ruta configurada:

```
https://papelcool.com/api/auth/*
```

**Cómo verificar**:
1. En el Worker, ve a Settings → Triggers → Routes
2. Elimina cualquier otra ruta vieja
3. Solo debe estar: `https://papelcool.com/api/auth/*`

### Paso 4: Probar con consola abierta

1. **Abrir DevTools** (F12)
2. **Ir a Console tab**
3. **Ir a** `https://papelcool.com`
4. **Observar logs**:
   - Deberías ver: `Session response status: 200`
   - Y: `Usuario NO autenticado` (si no estás logueado)
   
5. **Hacer login**:
   - Selecciona un preset
   - Click en Download PDF
   - Click en "Login with Whop"
   - Completa el login

6. **Después de callback**:
   - Deberías volver a `papelcool.com/?logged=true`
   - En console deberías ver:
     - `Session response status: 200`
     - `✓ Usuario autenticado: tu-email@ejemplo.com`
   - El botón Account debe aparecer arriba a la derecha

### Paso 5: Si todavía no funciona

#### Opción A: Verificar cookies en DevTools

1. F12 → Application tab → Cookies → https://papelcool.com
2. Busca cookie llamada `whop_session`
3. Debe tener:
   - Domain: `.papelcool.com` o `papelcool.com`
   - Path: `/`
   - HttpOnly: ✓
   - Secure: ✓
   - SameSite: `Lax`

**Si NO existe la cookie**:
- El problema está en el callback del Worker
- Revisa logs del Worker en Cloudflare dashboard

#### Opción B: Probar en Incógnito

1. Abre ventana de incógnito
2. Ve a `https://papelcool.com`
3. Intenta el flujo completo de login
4. A veces las cookies viejas causan conflictos

#### Opción C: Verificar redirect_uri en Whop

1. Ve a https://whop.com/apps
2. Abre tu app OAuth
3. Verifica que el redirect URI sea EXACTAMENTE:
   ```
   https://papelcool.com/api/auth/callback
   ```

### Paso 6: Ver logs del Worker

Para ver qué está pasando en el Worker:

1. Dashboard de Cloudflare → Workers → tu Worker
2. Click en "Logs" o "Begin log stream"
3. Hacer el flujo de login
4. Ver logs en tiempo real

Deberías ver:
```
Intercambiando código por token...
✓ Token obtenido
✓ Usuario obtenido: email@ejemplo.com
✓ Cookie de sesión creada
```

Si ves errores, busca en los logs para identificar el problema específico.

## 🐛 Debugging común

### Error: "Session response status: 404"
- **Causa**: La ruta no está configurada correctamente
- **Solución**: Verifica que la ruta `https://papelcool.com/api/auth/*` esté en Cloudflare

### Error: "Session response status: 500"
- **Causa**: Error en el código del Worker
- **Solución**: Revisa logs del Worker, probablemente falta un Secret

### Error: "Usuario NO autenticado" después de login
- **Causa**: La cookie no se está estableciendo o leyendo
- **Solución**: Verifica cookies en DevTools y logs del Worker

### Error: "TypeError: Failed to fetch"
- **Causa**: CORS o la ruta no existe
- **Solución**: Verifica que el Worker esté desplegado y la ruta configurada

## 📝 Checklist final

Antes de probar, verifica:

- [ ] Worker actualizado con código nuevo
- [ ] Secrets configurados (4 secrets)
- [ ] Route configurada: `https://papelcool.com/api/auth/*`
- [ ] Worker deployed exitosamente
- [ ] Redirect URI en Whop: `https://papelcool.com/api/auth/callback`
- [ ] DNS de papelcool.com apunta a Cloudflare (proxy naranja)
- [ ] Frontend actualizado (ya está en GitHub)

## 🎉 Resultado esperado

Después de aplicar los cambios:

1. ✅ Usuario hace login → callback exitoso
2. ✅ Cookie establecida correctamente
3. ✅ Vuelve a `/?logged=true`
4. ✅ `checkSession()` detecta sesión activa
5. ✅ Botón Account aparece
6. ✅ Usuario intenta descargar → ve página de pricing
7. ✅ NO más loop infinito de login

---

**Última actualización**: Nov 6, 2025
**Archivo de código**: `cloudflare-worker-updated.js`
