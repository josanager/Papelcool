// Cloudflare Worker - Sistema de OAuth y Suscripción para Papelcool
// Versión actualizada con mejor manejo de CORS y cookies

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

const ALLOWED_ORIGINS = new Set([
  'https://papelcool.com',
  'https://www.papelcool.com',
  'https://papelcool.pages.dev'
]);

function resolveOrigin(request) {
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)) {
    return requestOrigin;
  }
  const { protocol, hostname } = new URL(request.url);
  const fallbackOrigin = `${protocol}//${hostname}`;
  if (ALLOWED_ORIGINS.has(fallbackOrigin)) {
    return fallbackOrigin;
  }
  return 'https://papelcool.com';
}

function applyCorsHeaders(headers, origin, includeCredentials = true) {
  headers.set('Access-Control-Allow-Origin', origin);
  if (includeCredentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  headers.set('Vary', 'Origin');
}

function resolveCookieDomain(hostname) {
  if (!hostname) return null;

  if (hostname === 'papelcool.com' || hostname.endsWith('.papelcool.com')) {
    return 'papelcool.com';
  }

  if (hostname === 'papelcool.pages.dev') {
    return 'papelcool.pages.dev';
  }

  if (hostname.includes('.')) {
    return hostname;
  }

  return null;
}

function formatCookie(name, value, {
  domain,
  path = '/',
  httpOnly = false,
  secure = false,
  sameSite,
  maxAge
} = {}) {
  let cookie = `${name}=${value}`;
  if (domain) cookie += `; Domain=${domain}`;
  if (path) cookie += `; Path=${path}`;
  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  if (typeof maxAge === 'number') cookie += `; Max-Age=${maxAge}`;
  return cookie;
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  // Manejar OPTIONS para CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }
  
  // OAuth callback
  if (url.pathname === '/api/auth/callback') {
    return handleOAuthCallback(url, request, env);
  }
  
  // Login endpoint
  if (url.pathname === '/api/auth/login') {
    return handleLogin(request, env);
  }
  
  // Session check
  if (url.pathname === '/api/auth/session') {
    return handleSession(request, env);
  }
  
  // Logout
  if (url.pathname === '/api/auth/logout') {
    return handleLogout(request);
  }
  
  // Check memberships
  if (url.pathname === '/api/auth/memberships') {
    return handleMemberships(request, env);
  }
  
  // Debug
  if (url.pathname === '/api/auth/debug') {
    return handleDebug(request, env);
  }
  
  // Si no es ninguna de las rutas de auth, pasar al origen
  return fetch(request);
}

// Manejar CORS preflight
function handleCORS(request) {
  const origin = resolveOrigin(request);
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400'
  });
  applyCorsHeaders(headers, origin);
  return new Response(null, {
    status: 204,
    headers
  });
}

// Endpoint de diagnóstico (no expone valores, solo estados)
function handleDebug(request, env) {
  const origin = resolveOrigin(request);
  const cookies = request.headers.get('Cookie') || '';
  const hasSession = /whop_session=([^;]+)/.test(cookies);
  const hasOauth = /whop_oauth=([^;]+)/.test(cookies);
  const info = {
    env: {
      HAS_JWT_SECRET: !!env.JWT_SECRET,
      HAS_CLIENT_ID: !!env.WHOP_CLIENT_ID,
      HAS_CLIENT_SECRET: !!env.WHOP_CLIENT_SECRET,
      HAS_PLAN_ID: !!env.WHOP_PLAN_ID
    },
    cookies: {
      has_whop_session: hasSession,
      has_whop_oauth: hasOauth
    },
    route_ok: true,
    now: new Date().toISOString()
  };
  const headers = new Headers({ 'Content-Type': 'application/json' });
  applyCorsHeaders(headers, origin);
  return new Response(JSON.stringify(info, null, 2), { headers });
}

// Helpers PKCE
function base64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomBytes(length) {
  const array = new Uint8Array(length);
  (globalThis.crypto || crypto).getRandomValues(array);
  return array;
}

function safeRandomBytes(length) {
  try {
    return randomBytes(length);
  } catch (e) {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }
}

async function pkceChallengeFromVerifier(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

// Iniciar login OAuth
async function handleLogin(request, env) {
  try {
    const url = new URL(request.url);
    const cookieDomain = resolveCookieDomain(url.hostname);
    const secure = url.protocol === 'https:';
    const REDIRECT_URI = 'https://papelcool.com/api/auth/callback';
    const scope = encodeURIComponent('user:read memberships:read');
    const state = base64UrlEncode(safeRandomBytes(16));
    let verifier = null;
    let challenge = null;
    try {
      verifier = base64UrlEncode(randomBytes(32));
      challenge = await pkceChallengeFromVerifier(verifier);
    } catch (e) {
      // Fallback sin PKCE
      console.warn('PKCE generation failed, continuing without PKCE');
    }

    const baseUrl = `https://whop.com/oauth?client_id=${encodeURIComponent(env.WHOP_CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}&state=${state}`;
    const authUrl = challenge ? `${baseUrl}&code_challenge=${challenge}&code_challenge_method=S256` : baseUrl;

    // Guardar state y verifier en cookie temporal
    const meta = { state, ts: Date.now() };
    if (verifier) meta.verifier = verifier;
    const oauthMeta = btoa(JSON.stringify(meta));
    const resp = Response.redirect(authUrl, 302);
    const cookie = formatCookie('whop_oauth', oauthMeta, {
      domain: cookieDomain,
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      maxAge: 600
    });
    resp.headers.set('Set-Cookie', cookie);
    return resp;
  } catch (err) {
    const origin = resolveOrigin(request);
    return new Response(JSON.stringify({ error: 'login_failed', message: String(err && err.message || err) }), {
      status: 500,
      headers: (() => {
        const headers = new Headers({ 'Content-Type': 'application/json' });
        applyCorsHeaders(headers, origin);
        return headers;
      })()
    });
  }
}

// Callback OAuth
async function handleOAuthCallback(url, request, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieDomain = resolveCookieDomain(url.hostname);
  const secure = url.protocol === 'https:';

  if (!code) {
    console.error('No code in callback');
    return Response.redirect('https://papelcool.com/?error=auth_failed', 302);
  }
  
  try {
    console.log('Intercambiando código por token...');
    // Leer cookie PKCE/state
    const cookies = request.headers.get('Cookie') || '';
    const match = cookies.match(/whop_oauth=([^;]+)/);
    let code_verifier = undefined;
    if (match) {
      try {
        const meta = JSON.parse(atob(match[1]));
        if (!state || state !== meta.state) {
          console.warn('State mismatch');
        } else {
          code_verifier = meta.verifier;
        }
      } catch (e) {
        console.warn('Failed to parse whop_oauth cookie');
      }
    } else {
      console.warn('No whop_oauth cookie found for PKCE');
    }
    
    // Intercambiar code por access token (usar x-www-form-urlencoded)
    const tokenBody = new URLSearchParams({
      client_id: env.WHOP_CLIENT_ID,
      client_secret: env.WHOP_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://papelcool.com/api/auth/callback'
    });
    if (code_verifier) tokenBody.set('code_verifier', code_verifier);

    let tokenResponse = await fetch('https://api.whop.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenBody.toString()
    });

    // Fallback por si el endpoint alternativo es requerido
    if (!tokenResponse.ok) {
      console.warn('Primary token endpoint failed, trying fallback /oauth/token');
      tokenResponse = await fetch('https://api.whop.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: tokenBody.toString()
      });
    }
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return Response.redirect('https://papelcool.com/?error=token_failed', 302);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('✓ Token obtenido');
    
    // Obtener info del usuario
    const userResponse = await fetch('https://api.whop.com/v5/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userResponse.ok) {
      console.error('User fetch failed:', userResponse.status);
      return Response.redirect('https://papelcool.com/?error=user_failed', 302);
    }
    
    const userData = await userResponse.json();
    console.log('✓ Usuario obtenido:', userData.email);
    
    // Crear token de sesión firmado
    const sessionData = JSON.stringify({
      user_id: userData.id,
      email: userData.email,
      access_token: accessToken,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionData);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const sessionToken = btoa(sessionData) + '.' + signatureHex;
    
    console.log('✓ Cookie de sesión creada');
    
    // Responder con HTML (200) para asegurar que el navegador persista la cookie
    const html = `<!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Logging in...</title></head>
        <body style="background:#0a0e27;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;">
          <div>
            <h1 style="font-family:Arial;margin:0 0 8px;">Iniciando sesión...</h1>
            <p>Redirigiendo a Papelcool</p>
            <script>
              setTimeout(function(){ window.location.replace('https://papelcool.com/?logged=true'); }, 50);
            </script>
          </div>
        </body>
      </html>`;
    const response = new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
    // Limpiar cookie PKCE/state y setear sesión
    const clearOauthCookie = formatCookie('whop_oauth', '', {
      domain: cookieDomain,
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      maxAge: 0
    });
    const sessionCookie = formatCookie('whop_session', sessionToken, {
      domain: cookieDomain,
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60
    });
    response.headers.set('Set-Cookie', clearOauthCookie);
    response.headers.append('Set-Cookie', sessionCookie);
    return response;

  } catch (error) {
    console.error('OAuth error:', error.message);
    return Response.redirect('https://papelcool.com/?error=oauth_error', 302);
  }
}

// Verificar sesión actual
async function handleSession(request, env) {
  const session = await getSession(request, env);
  const origin = resolveOrigin(request);

  const response = new Response(JSON.stringify(
    session ? {
      authenticated: true,
      user: {
        id: session.user_id,
        email: session.email
      }
    } : {
      authenticated: false
    }
  ), {
    status: 200,
    headers: (() => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
      applyCorsHeaders(headers, origin);
      return headers;
    })()
  });

  return response;
}

// Obtener membresías del usuario
async function handleMemberships(request, env) {
  const session = await getSession(request, env);
  const origin = resolveOrigin(request);

  if (!session) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    applyCorsHeaders(headers, origin);
    return new Response(JSON.stringify({ error: 'Not authenticated', hasActivePlan: false }), {
      status: 401,
      headers
    });
  }
  
  try {
    const membershipsResponse = await fetch(`https://api.whop.com/v5/me/memberships`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!membershipsResponse.ok) {
      console.error('Memberships fetch failed:', membershipsResponse.status);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      applyCorsHeaders(headers, origin);
      return new Response(JSON.stringify({ hasActivePlan: false, memberships: [] }), {
        status: 200,
        headers
      });
    }
    
    const memberships = await membershipsResponse.json();
    
    // Filtrar por nuestro plan específico y status activo
    const activeMembership = memberships.data?.find(m => 
      m.plan_id === env.WHOP_PLAN_ID && 
      m.valid === true && 
      (m.status === 'active' || m.status === 'trialing')
    );
    
    console.log('Memberships check:', activeMembership ? 'ACTIVE' : 'INACTIVE');
    
    const headers = new Headers({ 'Content-Type': 'application/json' });
    applyCorsHeaders(headers, origin);
    return new Response(JSON.stringify({
      hasActivePlan: !!activeMembership,
      membership: activeMembership || null
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Memberships error:', error);
    const headers = new Headers({ 'Content-Type': 'application/json' });
    applyCorsHeaders(headers, origin);
    return new Response(JSON.stringify({ error: 'Failed to fetch memberships', hasActivePlan: false }), {
      status: 500,
      headers
    });
  }
}

// Logout
function handleLogout(request) {
  const url = new URL(request.url);
  const cookieDomain = resolveCookieDomain(url.hostname);
  const secure = url.protocol === 'https:';
  const response = Response.redirect('https://papelcool.com/?logged_out=true', 302);
  const cookie = formatCookie('whop_session', '', {
    domain: cookieDomain,
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    maxAge: 0
  });
  response.headers.set('Set-Cookie', cookie);
  return response;
}

// Helper: extraer y validar sesión
async function getSession(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(/whop_session=([^;]+)/);
  
  if (!match) {
    console.log('No session cookie found');
    return null;
  }
  
  const token = match[1];
  const parts = token.split('.');
  
  if (parts.length !== 2) {
    console.log('Invalid token format');
    return null;
  }
  
  const [dataB64, signatureHex] = parts;
  
  try {
    const sessionData = atob(dataB64);
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionData);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
    );
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);
    
    if (!valid) {
      console.log('Invalid signature');
      return null;
    }
    
    const session = JSON.parse(sessionData);
    
    if (Date.now() > session.exp) {
      console.log('Session expired');
      return null;
    }
    
    console.log('✓ Valid session for:', session.email);
    return session;
  } catch (error) {
    console.error('Session validation error:', error.message);
    return null;
  }
}
