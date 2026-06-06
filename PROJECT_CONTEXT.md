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
- Existe vista separada `tiktok` para filtros/videos de TikTok; no debe vivir dentro de la landing.
- Existe flujo de pago Stripe en modo test para el editor custom: pago único de 5 USD antes de descargar el PDF personalizado.
- Stripe usa Pages Functions `/api/stripe/create-checkout-session`, `/api/stripe/verify-session` y `/api/stripe/webhook`; las claves secretas solo van en variables de Cloudflare.
- Existe auth con Supabase.
- Existe sistema de comentarios en implementación para presets.
- Los comentarios deben permitir lectura pública.
- Los comentarios deben bloquear escritura a invitados.
- Si auth empieza desde comentarios, al terminar debe reabrirse esa misma sección.

## Cambios recientes

- Se añadió una skill local de retorno de contexto auth.
- Se añadió una base de UI para comentarios de presets.
- Se simplificó el diseño del panel de comentarios para móvil y desktop.
- Se definió la lógica guest vs authenticated en comentarios.
- Se reorganizó la navegación superior a Inicio, Personajes, TikTok, Personalizado y Favoritos.
- Se integró Stripe test para pago único de personalizados. No guardar `STRIPE_SECRET_KEY` ni `STRIPE_WEBHOOK_SECRET` en archivos del repo.

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
