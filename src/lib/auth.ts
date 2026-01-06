import { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { API_BASE_URL, apiPost } from './api';
import { validatePassword } from './validation';

// Local user type for API mode
export interface LocalUser {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | LocalUser | null;
  loading: boolean;
  initialized: boolean;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  initialized: false,
});

export const useAuth = () => useContext(AuthContext);

interface SignUpOptions {
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export async function signUp({ email, password, acceptedTerms }: SignUpOptions) {
  if (!acceptedTerms) {
    throw new Error('You must accept the terms and conditions');
  }

  const validationError = validatePassword(password);
  if (validationError) {
    throw new Error(validationError);
  }

  if (API_BASE_URL) {
    // Local API mode
    try {
      const user = await apiPost<LocalUser>('/auth/signup', { email, password });
      return { user, session: null };
    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('409') || errorMsg.includes('user_exists')) {
        throw new Error('user_already_exists');
      }
      if (errorMsg.includes('400') || errorMsg.includes('missing_fields')) {
        throw new Error('Please provide both email and password');
      }
      throw new Error(errorMsg.includes('signup_failed') ? 'Failed to create account' : errorMsg);
    }
  }

  // Supabase mode
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: import.meta.env.PROD 
        ? 'https://fortivo.netlify.app/auth/callback'
        : `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

interface SignInOptions {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export async function signIn({ email, password, rememberMe }: SignInOptions) {
  if (API_BASE_URL) {
    // Local API mode
    try {
      const user = await apiPost<LocalUser>('/auth/login', { email, password });
      return { user, session: null };
    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('401') || errorMsg.includes('invalid_credentials')) {
        throw new Error('invalid_credentials');
      }
      if (errorMsg.includes('400') || errorMsg.includes('missing_fields')) {
        throw new Error('Please provide both email and password');
      }
      throw new Error(errorMsg.includes('login_failed') ? 'Failed to sign in' : errorMsg);
    }
  }

  // Supabase mode
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (API_BASE_URL) {
    // Local API mode
    try {
      await apiPost('/auth/logout', {});
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout request failed:', error);
    } finally {
      // Force reload to clear any cached state
      window.location.reload();
    }
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  if (API_BASE_URL) {
    // Local API mode - password reset not implemented yet
    throw new Error('Password reset not available in local mode');
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const validationError = validatePassword(password);
  if (validationError) {
    throw new Error(validationError);
  }

  if (API_BASE_URL) {
    // Local API mode - password update not implemented yet
    throw new Error('Password update not available in local mode');
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });
  if (error) throw error;
}