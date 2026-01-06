import { useState, useEffect } from 'react';
import { type Asset, type Profile } from '../types/database';
import { supabase } from '../lib/supabase';
import { apiGet, apiPost, apiPatch, apiDelete, API_BASE_URL } from '../lib/api';
import { useAuth } from '../lib/auth';

export function useAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchAssets();
    } else {
      setAssets([]);
      setLoading(false);
    }
  }, [user]);

  async function fetchAssets() {
    try {
      setLoading(true);
      if (API_BASE_URL) {
        const data = await apiGet<Asset[]>('/api/assets');
        setAssets(
          data.map((a: any) => ({
            ...a,
            // map camelCase -> snake_case expected by UI/types
            estimated_value: a.estimated_value ?? a.estimatedValue ?? null,
            beneficiary: a.beneficiary ? { id: a.beneficiary.id, full_name: a.beneficiary.fullName } : undefined,
            created_at: a.created_at ?? a.createdAt,
            updated_at: a.updated_at ?? a.updatedAt,
            acquisition_date: a.acquisition_date ?? a.acquisitionDate,
          }))
        );
      } else {
        const { data, error } = await supabase
          .from('assets')
          .select(`
            *,
            beneficiary:beneficiary_id (
              id,
              full_name
            )
          `)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setAssets(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch assets'));
    } finally {
      setLoading(false);
    }
  }

  async function createAsset(asset: Partial<Asset>) {
    try {
      if (!user) throw new Error('User not authenticated');

      if (API_BASE_URL) {
        // Local API mode - let server handle limits and validation
        const created = await apiPost<Asset>('/api/assets', asset);
        const transformedAsset = {
          ...created,
          estimated_value: created.estimatedValue ?? null,
          beneficiary: created.beneficiary ? { 
            id: created.beneficiary.id, 
            full_name: created.beneficiary.fullName || created.beneficiary.full_name 
          } : undefined,
          created_at: created.createdAt || created.created_at,
          updated_at: created.updatedAt || created.updated_at,
          acquisition_date: created.acquisitionDate || created.acquisition_date,
        } as Asset;
        setAssets((prev) => [transformedAsset, ...prev]);
        return transformedAsset;
      } else {
        // Supabase mode - check limits locally
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        const { count: assetCount, error: countError } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) throw countError;

        const assetLimits: Record<Profile['subscription_tier'], number> = {
          free: 20,
          pro: Number.MAX_SAFE_INTEGER,
          premium: Number.MAX_SAFE_INTEGER
        };

        if ((assetCount ?? 0) >= assetLimits[profile.subscription_tier]) {
          throw new Error(`You've reached the maximum number of assets for your ${profile.subscription_tier} plan`);
        }

        const { data, error } = await supabase
          .from('assets')
          .insert([{ ...asset, user_id: user.id }])
          .select()
          .single();
        if (error) throw error;
        setAssets((prev) => [data, ...prev]);
        return data;
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create asset');
    }
  }

  async function updateAsset(id: string, asset: Partial<Asset>) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Asset ID is required for update');
      }

      if (API_BASE_URL) {
        // Local API mode
        const updated = await apiPatch<Asset>(`/api/assets/${id}`, asset);
        const transformedAsset = {
          ...updated,
          estimated_value: updated.estimatedValue ?? updated.estimated_value ?? null,
          beneficiary: updated.beneficiary ? { 
            id: updated.beneficiary.id, 
            full_name: updated.beneficiary.fullName || updated.beneficiary.full_name 
          } : undefined,
          created_at: updated.createdAt || updated.created_at,
          updated_at: updated.updatedAt || updated.updated_at,
          acquisition_date: updated.acquisitionDate || updated.acquisition_date,
        } as Asset;
        setAssets((prev) => prev.map((a) => (a.id === id ? transformedAsset : a)));
        return transformedAsset;
      } else {
        // Supabase mode
        const cleanAsset = Object.fromEntries(
          Object.entries(asset).filter(([_, v]) => v !== undefined)
        );

        const { data, error } = await supabase
          .from('assets')
          .update(cleanAsset)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          throw new Error('Failed to update asset');
        }

        if (!data) {
          throw new Error('Asset not found');
        }

        setAssets((prev) => prev.map((a) => (a.id === id ? data : a)));
        return data;
      }
    } catch (err) {
      console.error('Asset update error:', err);
      throw err instanceof Error ? err : new Error('Failed to update asset');
    }
  }

  async function deleteAsset(id: string) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Asset ID is required');
      }

      if (API_BASE_URL) {
        // Local API mode - server handles cascade deletion
        await apiDelete(`/api/assets/${id}`);
        setAssets((prev) => prev.filter((a) => a.id !== id));
        return true;
      } else {
        // Supabase mode - handle cascade deletion manually
        const { data: documents, error: fetchError } = await supabase
          .from('asset_documents')
          .select('id, file_path')
          .eq('asset_id', id);

        if (fetchError) {
          console.error('Error fetching asset documents:', fetchError);
          throw new Error('Failed to fetch asset documents');
        }

        // Delete documents from storage if they exist
        if (documents && documents.length > 0) {
          const filePaths = documents.map(doc => doc.file_path).filter(Boolean);
          if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage
              .from('asset-documents')
              .remove(filePaths);

            if (storageError) {
              console.error('Error deleting document files:', storageError);
              throw new Error('Failed to delete document files');
            }
          }
        }

        // Delete document records
        const { error: docDeleteError } = await supabase
          .from('asset_documents')
          .delete()
          .eq('asset_id', id);

        if (docDeleteError) {
          console.error('Error deleting document records:', docDeleteError);
          throw new Error('Failed to delete asset documents');
        }

        // Then delete the asset
        const { error: assetError } = await supabase
          .from('assets')
          .delete()
          .eq('id', id);

        if (assetError) {
          console.error('Error deleting asset:', assetError);
          throw new Error('Failed to delete asset');
        }

        setAssets((prev) => prev.filter((a) => a.id !== id));
        return true;
      }
    } catch (err) {
      console.error('Asset delete error:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete asset';
      throw new Error(message);
    }
  }

  return {
    assets,
    loading,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    refresh: fetchAssets,
  };
}