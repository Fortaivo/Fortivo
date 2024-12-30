import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AssetList } from '../components/assets/AssetList';
import { AssetForm } from '../components/assets/AssetForm';
import { Button } from '../components/ui/Button';
import { useAssets } from '../hooks/useAssets';
import { toast } from '../lib/toast';
import type { Asset } from '../types/database';

export function AssetsPage() {
  const { t } = useTranslation();
  const { assets, loading, error, createAsset, updateAsset, deleteAsset } = useAssets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();

  const handleSubmit = async (data: Partial<Asset>) => {
    try {
      const loadingToast = toast.loading(editingAsset ? 'Updating asset...' : 'Creating asset...');
      
      // Ensure we have the asset ID for updates
      if (editingAsset && !editingAsset.id) {
        throw new Error('Invalid asset ID');
      }

      if (editingAsset) {
        await updateAsset(editingAsset.id, data);
        toast.dismiss(loadingToast);
        toast.success('Asset updated successfully');
      } else {
        await createAsset(data);
        toast.dismiss(loadingToast);
        toast.success('Asset created successfully');
      }
      setIsFormOpen(false);
      setEditingAsset(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      console.error('Asset operation error:', err);
      toast.error(message);
    }
  };

  const handleDelete = async (asset: Asset) => {
    try {
      const loadingToast = toast.loading('Deleting asset...');
      await deleteAsset(asset.id);
      toast.dismiss(loadingToast);
      toast.success('Asset deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete asset';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-sm text-red-700">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('assets.title')}</h1>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            {t('common.actions.add')} {t('assets.title')}
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            {editingAsset ? t('assets.form.edit') : t('assets.form.add')}
          </h2>
          <AssetForm
            asset={editingAsset}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingAsset(undefined);
            }}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <AssetList
            assets={assets}
            onAdd={() => setIsFormOpen(true)}
            onEdit={(asset) => {
              setEditingAsset(asset);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}