import { useState, useEffect } from 'react';
import { type Profile } from '../types/database';
import { supabase } from '../lib/supabase';
import { API_BASE_URL, apiGet, apiPatch } from '../lib/api';
import { useAuth } from '../lib/auth';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (API_BASE_URL) {
        // Local API mode
        try {
          const profile = await apiGet<Profile>('/api/profile');
          setProfile(profile);
        } catch (err: any) {
          if (err.message.includes('404')) {
            // Profile doesn't exist, create a basic one
            setProfile({
              id: user.id,
              full_name: null,
              avatar_url: null,
              subscription_tier: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } else {
            throw err;
          }
        }
      } else {
        // Supabase mode
        const { data: profile, error: selectError } = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();

        if (selectError) throw selectError;
        setProfile(profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      if (!user) throw new Error('User not authenticated');

      if (API_BASE_URL) {
        // Local API mode
        const updatedProfile = await apiPatch<Profile>('/api/profile', updates);
        setProfile(updatedProfile);
        return updatedProfile;
      } else {
        // Supabase mode
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
        return data;
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update profile');
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refresh: fetchProfile,
  };
}