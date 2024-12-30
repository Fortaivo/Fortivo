import { useState, useEffect } from 'react';
import { type Asset } from '../types/database';
import { supabase } from '../lib/supabase';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      setLoading(true);
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch assets'));
    } finally {
      setLoading(false);
    }
  }

  async function createAsset(asset: Partial<Asset>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check subscription tier for beneficiary limits
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get current beneficiary count
      const { data: beneficiaries, error: countError } = await supabase
        .from('beneficiaries')
        .select('id', { count: 'exact' });

      if (countError) throw countError;

      const beneficiaryCount = beneficiaries?.length || 0;
      const beneficiaryLimits = {
        free: 1,
        pro: 5,
        premium: Infinity
      };

      if (beneficiaryCount >= beneficiaryLimits[profile.subscription_tier]) {
        throw new Error(`You've reached the maximum number of beneficiaries for your ${profile.subscription_tier} plan`);
      }

      const { data, error } = await supabase
        .from('assets')
        .insert([{ ...asset, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setAssets((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create asset');
    }
  }

  async function updateAsset(id: string, asset: Partial<Asset>) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Asset ID is required for update');
      }

      // Remove undefined values to prevent Supabase errors
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

      // First get all documents for this asset
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