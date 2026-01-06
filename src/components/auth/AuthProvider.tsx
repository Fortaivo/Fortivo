import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthContext, LocalUser } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../../lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (API_BASE_URL) {
      (async () => {
        try {
          console.log('Checking auth at:', `${API_BASE_URL}/auth/me`);
          const me = await fetch(`${API_BASE_URL}/auth/me`, { 
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Auth response status:', me.status);
          if (me.ok) {
            const data = await me.json();
            console.log('Auth successful, user:', data);
            setUser({ id: data.id, email: data.email } as LocalUser);
          } else {
            console.log('Auth failed, status:', me.status);
            setUser(null);
          }
        } catch (e) {
          console.error('Auth check failed:', e);
          setUser(null);
        } finally {
          setLoading(false);
          setInitialized(true);
        }
      })();
      return;
    }

    // Check active sessions and sets the user (Supabase mode)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);
    });

    // Listen for changes on auth state (Supabase mode only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}