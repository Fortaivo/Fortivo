import { useState, useEffect } from 'react';
import { type Beneficiary } from '../types/database';
import { supabase } from '../lib/supabase';
import { apiGet, apiPost, apiPatch, apiDelete, API_BASE_URL } from '../lib/api';
import { useAuth } from '../lib/auth';

export function useBeneficiaries() {
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchBeneficiaries();
    } else {
      setBeneficiaries([]);
      setLoading(false);
    }
  }, [user]);

  async function fetchBeneficiaries() {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (API_BASE_URL) {
        const rows = await apiGet<Beneficiary[]>('/api/beneficiaries');
        // Transform API response to match frontend types
        const transformedRows = (rows as any[]).map(row => ({
          ...row,
          full_name: row.full_name || row.fullName,
          contact_email: row.contact_email || row.contactEmail,
          contact_phone: row.contact_phone || row.contactPhone,
          created_at: row.created_at || row.createdAt,
          updated_at: row.updated_at || row.updatedAt,
        }));
        setBeneficiaries(transformedRows);
      } else {
        const { data, error } = await supabase
          .from('beneficiaries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBeneficiaries(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch beneficiaries'));
    } finally {
      setLoading(false);
    }
  }

  async function createBeneficiary(beneficiary: Partial<Beneficiary>) {
    try {
      if (!user) throw new Error('User not authenticated');
      
      if (API_BASE_URL) {
        // Local API mode - let server handle limits
        const created = await apiPost<Beneficiary>('/api/beneficiaries', beneficiary);
        const transformedBeneficiary = {
          ...created,
          full_name: (created as any).full_name || (created as any).fullName,
          contact_email: (created as any).contact_email || (created as any).contactEmail,
          contact_phone: (created as any).contact_phone || (created as any).contactPhone,
          created_at: (created as any).created_at || (created as any).createdAt,
          updated_at: (created as any).updated_at || (created as any).updatedAt,
        } as Beneficiary;
        setBeneficiaries((prev) => [transformedBeneficiary, ...prev]);
        return transformedBeneficiary;
      } else {
        // Supabase mode - check limits locally
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

        const limits = {
          free: 1,
          pro: 5,
          premium: Infinity
        } as const;

        const limit = limits[profile.subscription_tier as keyof typeof limits];
        if ((count ?? 0) >= limit) {
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
          if ((error as any).code === 'P0001' && (error as any).message.includes('Beneficiary limit')) {
            throw new Error('You\'ve reached your beneficiary limit. Please upgrade your plan.');
          }
          throw new Error('Failed to create beneficiary');
        }

        setBeneficiaries((prev) => [data, ...prev]);
        return data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create beneficiary';
      console.error('Beneficiary creation error:', err);
      throw new Error(message);
    }
  }

  async function updateBeneficiary(id: string, updates: Partial<Beneficiary>) {
    try {
      if (API_BASE_URL) {
        const updated = await apiPatch<Beneficiary>(`/api/beneficiaries/${id}`, updates);
        const transformedBeneficiary = {
          ...updated,
          full_name: (updated as any).full_name || (updated as any).fullName,
          contact_email: (updated as any).contact_email || (updated as any).contactEmail,
          contact_phone: (updated as any).contact_phone || (updated as any).contactPhone,
          created_at: (updated as any).created_at || (updated as any).createdAt,
          updated_at: (updated as any).updated_at || (updated as any).updatedAt,
        } as Beneficiary;
        setBeneficiaries((prev) => prev.map((b) => (b.id === id ? transformedBeneficiary : b)));
        return transformedBeneficiary;
      } else {
        const { data, error } = await supabase
          .from('beneficiaries')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        setBeneficiaries((prev) => prev.map((b) => (b.id === id ? data : b)));
        return data;
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update beneficiary');
    }
  }

  async function deleteBeneficiary(id: string) {
    try {
      if (API_BASE_URL) {
        await apiDelete(`/api/beneficiaries/${id}`);
        setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      } else {
        const { error } = await supabase
          .from('beneficiaries')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      }
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