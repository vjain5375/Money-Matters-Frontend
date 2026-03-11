import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the client when both env vars are present.
// If not set (dev mode without .env), export null — AddTransaction handles this gracefully.
export const supabase =
    supabaseUrl && supabaseKey
        ? createClient(supabaseUrl, supabaseKey)
        : null;

if (!supabase) {
    console.warn(
        '[MoneyMatters] Supabase not configured. ' +
        'Copy .env.example → .env and fill in your project keys.'
    );
}
