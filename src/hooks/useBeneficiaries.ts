import { useState, useEffect } from 'react';
import { type Beneficiary } from '../types/database';
import { supabase } from '../lib/supabase';

export function useBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  async function fetchBeneficiaries() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBeneficiaries(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch beneficiaries'));
    } finally {
      setLoading(false);
    }
  }

  async function createBeneficiary(beneficiary: Partial<Beneficiary>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's profile and current beneficiary count
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      const { count, error: countError } = await supabase
        .from('beneficiaries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        throw new Error('Failed to count beneficiaries');
      }

      // Check limits based on subscription tier
      const limits = {
        free: 1,
        pro: 5,
        premium: Infinity
      };

      const limit = limits[profile.subscription_tier];
      if (count >= limit) {
        throw new Error(
          `You've reached the maximum number of beneficiaries for your ${
            profile.subscription_tier
          } plan (${limit}). Please upgrade your plan to add more beneficiaries.`
        );
      }

      const { data, error } = await supabase
        .from('beneficiaries')
        .insert([{ ...beneficiary, user_id: user.id }])
        .select()
        .single();

      if (error) {
        // Handle specific database errors
        if (error.code === 'P0001' && error.message.includes('Beneficiary limit')) {
          throw new Error('You\'ve reached your beneficiary limit. Please upgrade your plan.');
        }
        throw new Error('Failed to create beneficiary');
      }

      setBeneficiaries((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create beneficiary';
      console.error('Beneficiary creation error:', err);
      throw new Error(message);
    }
  }

  async function updateBeneficiary(id: string, updates: Partial<Beneficiary>) {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setBeneficiaries((prev) => prev.map((b) => (b.id === id ? data : b)));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update beneficiary');
    }
  }

  async function deleteBeneficiary(id: string) {
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete beneficiary');
    }
  }

  return {
    beneficiaries,
    loading,
    error,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    refresh: fetchBeneficiaries,
  };
}