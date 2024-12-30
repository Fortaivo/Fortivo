import { useState, useEffect } from 'react';
import { type AssetDocument } from '../types/database';
import { supabase } from '../lib/supabase';

export function useAssetDocuments(assetId: string) {
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (assetId) {
      fetchDocuments();
    }
  }, [assetId]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('asset_documents')
        .select('*')
        .eq('asset_id', assetId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument(file: File, name: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${assetId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('asset-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error: insertError } = await supabase
        .from('asset_documents')
        .insert([{
          asset_id: assetId,
          name: name || file.name,
          file_path: filePath,
          file_type: getFileType(file.type),
          file_size: file.size,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      setDocuments((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to upload document');
    }
  }

  async function deleteDocument(id: string, filePath: string) {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('asset-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete document record
      const { error: deleteError } = await supabase
        .from('asset_documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete document');
    }
  }

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refresh: fetchDocuments,
  };
}

function getFileType(mimeType: string): AssetDocument['file_type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
}