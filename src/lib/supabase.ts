import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Safe fallback when Supabase is not configured (local API mode)
function createFallbackSupabase() {
  const noop = async () => ({ data: { user: null, session: null }, error: null } as any);
  return {
    auth: {
      getUser: noop,
      getSession: noop,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => { throw new Error('Supabase not configured'); },
      signUp: async () => { throw new Error('Supabase not configured'); },
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
    },
  } as any;
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createFallbackSupabase();