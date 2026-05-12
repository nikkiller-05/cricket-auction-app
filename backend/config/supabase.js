    const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (no hardcoded fallbacks - keys MUST come from env)
const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service_role for backend (bypasses RLS); fall back to anon for legacy compat
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  const usingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(
    `Supabase client initialized: ${supabaseUrl} (key=${usingServiceRole ? 'service_role' : 'anon'})`
  );
} else {
  console.warn(
    '⚠️  Supabase NOT initialized - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY'
  );
}

module.exports = supabase;
