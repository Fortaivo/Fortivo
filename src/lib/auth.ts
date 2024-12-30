import { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { validatePassword } from './validation';

export interface AuthState {
  user: User | null;
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      // Set session duration based on remember me option
      sessionTime: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days vs 1 day
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
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

  const { error } = await supabase.auth.updateUser({
    password,
  });
  if (error) throw error;
}