/**
 * js/supabase-client.js
 * ----------------------
 * Initializes and exports a single Supabase client instance.
 * Loaded after the Supabase CDN script and config.js.
 */

const { createClient } = supabase;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
