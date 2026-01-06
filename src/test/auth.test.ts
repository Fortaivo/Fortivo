import { describe, it, expect, vi } from 'vitest';
import { createClient } from '../lib/supabase';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn()
    }
  }))
}));

describe('Authentication', () => {
  describe('Supabase Client', () => {
    it('should create supabase client', () => {
      const client = createClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should have auth methods', () => {
      const client = createClient();
      expect(client.auth.signInWithPassword).toBeDefined();
      expect(client.auth.signUp).toBeDefined();
      expect(client.auth.signOut).toBeDefined();
      expect(client.auth.getSession).toBeDefined();
    });
  });
});
