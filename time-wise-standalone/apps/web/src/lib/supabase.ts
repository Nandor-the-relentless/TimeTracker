import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  // Why: fail fast if env is missing to avoid silent auth/session bugs
  console.error('Missing Supabase env; set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl!, supabaseAnon!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})
