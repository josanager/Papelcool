/* ============================================
   PAPELCOOL - AUTHENTICATION MODULE
   ============================================
   Handles user authentication with:
   - Email/Password sign up and login
   - Google OAuth login
   - Session management
   ============================================ */

// ============================================
// EMAIL AUTHENTICATION
// ============================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password (min 6 characters)
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
async function signUpWithEmail(email, password) {
    const client = getSupabaseClient();
    if (!client) return { user: null, error: new Error('Supabase not initialized') };

    try {
        const { data, error } = await client.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.error('Sign up error:', error.message);
            return { user: null, error };
        }

        console.log('✅ User signed up:', data.user?.email);
        return { user: data.user, error: null };
    } catch (err) {
        console.error('Sign up exception:', err);
        return { user: null, error: err };
    }
}

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
async function signInWithEmail(email, password) {
    const client = getSupabaseClient();
    if (!client) return { user: null, error: new Error('Supabase not initialized') };

    try {
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Sign in error:', error.message);
            return { user: null, error };
        }

        console.log('✅ User signed in:', data.user?.email);
        return { user: data.user, error: null };
    } catch (err) {
        console.error('Sign in exception:', err);
        return { user: null, error: err };
    }
}

// ============================================
// GOOGLE OAUTH
// ============================================

/**
 * Sign in with Google OAuth
 * @returns {Promise<{error: Error|null}>}
 */
async function signInWithGoogle() {
    const client = getSupabaseClient();
    if (!client) return { error: new Error('Supabase not initialized') };

    try {
        const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('Google sign in error:', error.message);
            return { error };
        }

        // Note: This will redirect to Google, so the function won't return normally
        return { error: null };
    } catch (err) {
        console.error('Google sign in exception:', err);
        return { error: err };
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Sign out the current user
 * @returns {Promise<{error: Error|null}>}
 */
async function signOut() {
    const client = getSupabaseClient();
    if (!client) return { error: new Error('Supabase not initialized') };

    try {
        const { error } = await client.auth.signOut();

        if (error) {
            console.error('Sign out error:', error.message);
            return { error };
        }

        console.log('✅ User signed out');
        return { error: null };
    } catch (err) {
        console.error('Sign out exception:', err);
        return { error: err };
    }
}

/**
 * Get the current logged-in user
 * @returns {Promise<Object|null>} Current user or null
 */
async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data: { user } } = await client.auth.getUser();
        return user;
    } catch (err) {
        console.error('Get user error:', err);
        return null;
    }
}

/**
 * Get the current session
 * @returns {Promise<Object|null>} Current session or null
 */
async function getCurrentSession() {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data: { session } } = await client.auth.getSession();
        return session;
    } catch (err) {
        console.error('Get session error:', err);
        return null;
    }
}

/**
 * Listen for authentication state changes
 * @param {Function} callback - Function to call on auth state change
 * @returns {Object} Subscription object with unsubscribe method
 */
function onAuthStateChange(callback) {
    const client = getSupabaseClient();
    if (!client) {
        console.error('Cannot subscribe: Supabase not initialized');
        return { data: { subscription: { unsubscribe: () => { } } } };
    }

    return client.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
            await upsertUserProfile(session.user);
        }
        callback(event, session);
    });
}

// ============================================
// PROFILE SYNCHRONIZATION
// ============================================

/**
 * Upsert user metadata into the public profiles table
 * @param {Object} user - Supabase user object
 */
async function upsertUserProfile(user) {
    const client = getSupabaseClient();
    if (!client) return;

    const nickname = user.user_metadata?.nickname || user.email.split('@')[0];
    const avatar = user.user_metadata?.avatar_url || "";

    try {
        const { error } = await client
            .from('profiles')
            .upsert({
                id: user.id,
                nickname: nickname,
                avatar_url: avatar,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) console.error('Error syncing profile:', error.message);
        else console.log('✅ Profile synced for', nickname);
    } catch (err) {
        console.error('Profile sync exception:', err);
    }
}

/**
 * Search for creators by nickname
 * @param {string} query - Search string
 * @returns {Promise<Array>} List of matching profiles
 */
async function searchCreators(query) {
    const client = getSupabaseClient();
    if (!client || !query || query.length < 2) return [];

    try {
        const { data, error } = await client
            .from('profiles')
            .select('id, nickname, avatar_url')
            .ilike('nickname', `%${query}%`)
            .limit(5);

        if (error) {
            console.error('Search error:', error.message);
            return [];
        }

        return data;
    } catch (err) {
        console.error('Search exception:', err);
        return [];
    }
}
/**
 * Check if a nickname is already taken in the profiles table
 * @param {string} nickname - The nickname to check
 * @returns {Promise<boolean>} - True if available, false if taken
 */
async function isNicknameAvailable(nickname) {
    const client = getSupabaseClient();
    if (!client) return true;

    try {
        const { data, error } = await client
            .from('profiles')
            .select('nickname')
            .eq('nickname', nickname)
            .maybeSingle();

        if (error) {
            console.error('Error checking nickname:', error.message);
            return true; // Erring on the side of allowing it if DB fails
        }

        return !data; // If data exists, nickname is NOT available
    } catch (err) {
        console.error('Nickname check exception:', err);
        return true;
    }
}

window.isNicknameAvailable = isNicknameAvailable;
window.searchCreators = searchCreators;

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Update UI based on auth state
 * @param {Object|null} user - Current user object
 */
function updateAuthUI(user) {
    const loginBtn = document.getElementById('auth-login-btn');
    const registerBtn = document.getElementById('auth-register-btn');
    const userMenu = document.getElementById('auth-user-menu');
    const userEmail = document.getElementById('auth-user-email');
    const userAvatar = document.getElementById('auth-user-avatar');
    const homeGreetingName = document.getElementById('home-greeting-name');
    const homeProfileInitial = document.getElementById('home-profile-initial');

    if (user) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userEmail) userEmail.textContent = user.email;
        if (userAvatar) {
            // Use Gravatar or first letter of email
            const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '';
            const initial = nickname.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';
            userAvatar.textContent = initial;
            if (homeProfileInitial) homeProfileInitial.textContent = initial;
            if (homeGreetingName && nickname) homeGreetingName.textContent = nickname;
        }

        // Enable save character button
        const saveCharBtn = document.getElementById('save-character-btn');
        if (saveCharBtn) saveCharBtn.disabled = false;
    } else {
        // User is logged out
        if (loginBtn) loginBtn.style.display = 'flex';
        if (registerBtn) registerBtn.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (homeGreetingName) homeGreetingName.textContent = 'Creator';
        if (homeProfileInitial) homeProfileInitial.textContent = 'P';

        // Disable save character button
        const saveCharBtn = document.getElementById('save-character-btn');
        if (saveCharBtn) saveCharBtn.disabled = true;
    }
}

// Initialize auth state listener on load
document.addEventListener('DOMContentLoaded', async () => {
    if (!isSupabaseConfigured()) return;

    // Check initial auth state
    const user = await getCurrentUser();
    updateAuthUI(user);

    // Listen for auth changes
    onAuthStateChange((event, session) => {
        updateAuthUI(session?.user || null);
    });
});

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// (Required for main page interaction)
// ============================================
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.getCurrentSession = getCurrentSession;
window.onAuthStateChange = onAuthStateChange;
window.upsertUserProfile = upsertUserProfile;
window.searchCreators = searchCreators;
window.isNicknameAvailable = isNicknameAvailable;
window.updateAuthUI = updateAuthUI;
