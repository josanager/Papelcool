/* ============================================
   PAPELCOOL - SUPABASE CONFIGURATION
   ============================================
   This file initializes the Supabase client for
   authentication and database operations.
   
   IMPORTANT: Replace the placeholder values with
   your actual Supabase project credentials.
   ============================================ */

// Supabase CDN - loaded before this script
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// ============================================
// CONFIGURATION - YOUR SUPABASE CREDENTIALS
// ============================================
const SUPABASE_URL = 'https://gofmxpasmptpuckmlvpc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZm14cGFzbXB0cHVja21sdnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzU4NTAsImV4cCI6MjA4NTgxMTg1MH0.PruvH_mqLFIhU00qa3Bxi31xMD-FWPjZrgSvEwLuqVU';

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Make sure to include the CDN script.');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        console.log('✅ Supabase client initialized');
    }

    return supabaseClient;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the current Supabase client instance
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

/**
 * Check if Supabase is properly configured
 * @returns {boolean} True if configured with real credentials
 */
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
        SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

/**
 * Show configuration warning if not set up
 */
function showConfigWarning() {
    if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase is not configured. Please update supabase-config.js with your credentials.');
        console.warn('📖 Get your credentials from: https://supabase.com/dashboard → Settings → API');
        return true;
    }
    return false;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if (!showConfigWarning()) {
        initSupabase();
    }
});
