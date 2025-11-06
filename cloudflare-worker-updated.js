// Cloudflare Worker - Sistema de OAuth y Suscripción para Papelcool
// Versión actualizada con mejor manejo de CORS y cookies

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Manejar OPTIONS para CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  // OAuth callback
  if (url.pathname === '/api/auth/callback') {
    return handleOAuthCallback(url, request);
  }
  
  // Login endpoint
  if (url.pathname === '/api/auth/login') {
    return handleLogin();
  }
  
  // Session check
  if (url.pathname === '/api/auth/session') {
    return handleSession(request);
  }
  
  // Logout
  if (url.pathname === '/api/auth/logout') {
    return handleLogout();
  }
  
  // Check memberships
  if (url.pathname === '/api/auth/memberships') {
    return handleMemberships(request);
  }
  
  // Si no es ninguna de las rutas de auth, pasar al origen
  return fetch(request);
}

// Manejar CORS preflight
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://papelcool.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// Iniciar login OAuth
function handleLogin() {
  const authUrl = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=https://papelcool.com/api/auth/callback&response_type=code&scope=user:read+memberships:read`;
  return Response.redirect(authUrl, 302);
}

// Callback OAuth
async function handleOAuthCallback(url, request) {
  const code = url.searchParams.get('code');
  
  if (!code) {
    console.error('No code in callback');
    return Response.redirect('https://papelcool.com/?error=auth_failed', 302);
  }
  
  try {
    console.log('Intercambiando código por token...');
    
    // Intercambiar code por access token
    const tokenResponse = await fetch('https://api.whop.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: WHOP_CLIENT_ID,
        client_secret: WHOP_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://papelcool.com/api/auth/callback'
      })
    });
    
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
      encoder.encode(JWT_SECRET),
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
    
    // Redirigir con cookie
    const response = Response.redirect('https://papelcool.com/?logged=true', 302);
    response.headers.set('Set-Cookie', 
      `whop_session=${sessionToken}; Path=/; Domain=papelcool.com; HttpOnly; Secure; SameSite=Lax; Max-Age=${7*24*60*60}`
    );
    
    return response;
    
  } catch (error) {
    console.error('OAuth error:', error.message);
    return Response.redirect('https://papelcool.com/?error=oauth_error', 302);
  }
}

// Verificar sesión actual
async function handleSession(request) {
  const session = await getSession(request);
  
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
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://papelcool.com',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
  
  return response;
}

// Obtener membresías del usuario
async function handleMemberships(request) {
  const session = await getSession(request);
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated', hasActivePlan: false }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://papelcool.com',
        'Access-Control-Allow-Credentials': 'true'
      }
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
      return new Response(JSON.stringify({ hasActivePlan: false, memberships: [] }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://papelcool.com',
          'Access-Control-Allow-Credentials': 'true'
        }
      });
    }
    
    const memberships = await membershipsResponse.json();
    
    // Filtrar por nuestro plan específico y status activo
    const activeMembership = memberships.data?.find(m => 
      m.plan_id === WHOP_PLAN_ID && 
      m.valid === true && 
      (m.status === 'active' || m.status === 'trialing')
    );
    
    console.log('Memberships check:', activeMembership ? 'ACTIVE' : 'INACTIVE');
    
    return new Response(JSON.stringify({
      hasActivePlan: !!activeMembership,
      membership: activeMembership || null
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://papelcool.com',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
    
  } catch (error) {
    console.error('Memberships error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch memberships', hasActivePlan: false }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://papelcool.com',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }
}

// Logout
function handleLogout() {
  const response = Response.redirect('https://papelcool.com/?logged_out=true', 302);
  response.headers.set('Set-Cookie', 
    'whop_session=; Path=/; Domain=papelcool.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return response;
}

// Helper: extraer y validar sesión
async function getSession(request) {
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
      encoder.encode(JWT_SECRET),
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
