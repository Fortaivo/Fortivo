import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { Button } from '../ui/Button';
import { validateAsset, sanitizeString } from '../../lib/validation';
import type { Asset } from '../../types/database';

export interface AssetFormProps {
  asset?: Asset;
  onSubmit: (data: Partial<Asset>) => Promise<void>;
  onCancel: () => void;
}

export function AssetForm({ asset, onSubmit, onCancel }: AssetFormProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { beneficiaries } = useBeneficiaries();
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    type: asset?.type || 'financial',
    description: asset?.description || '',
    estimated_value: asset?.estimated_value ? asset.estimated_value.toString() : '',
    location: asset?.location || '',
    beneficiary_id: asset?.beneficiary_id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      // Sanitize and validate input data
      const sanitizedData = {
        name: sanitizeString(formData.name),
        type: formData.type,
        description: formData.description ? sanitizeString(formData.description) : undefined,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
        location: formData.location ? sanitizeString(formData.location) : undefined,
        beneficiary_id: formData.beneficiary_id || undefined,
      };

      // Validate with Zod schema
      const validationResult = validateAsset(sanitizedData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new Error(firstError.message);
      }

      // Prepare data for submission
      const submitData: Partial<Asset> = {
        name: sanitizedData.name,
        type: sanitizedData.type,
        description: sanitizedData.description || null,
        estimated_value: sanitizedData.estimated_value || null,
        location: sanitizedData.location || null,
        beneficiary_id: sanitizedData.beneficiary_id || null,
      };

      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assets.form.errors.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {asset ? t('assets.form.edit') : t('assets.form.add')}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assets.form.fields.name')} {t('assets.form.fields.required')}
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('assets.form.fields.namePlaceholder')}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assets.form.fields.type')} {t('assets.form.fields.required')}
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as Asset['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="financial">{t('assets.types.financial')}</option>
              <option value="physical">{t('assets.types.physical')}</option>
              <option value="digital">{t('assets.types.digital')}</option>
              <option value="other">{t('assets.types.other')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assets.form.fields.description')}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder={t('assets.form.fields.descriptionPlaceholder')}
              maxLength={500}
            />
          </div>

          <div>
            <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assets.form.fields.estimatedValue')}
            </label>
            <input
              type="number"
              id="estimated_value"
              value={formData.estimated_value}
              onChange={(e) => setFormData((prev) => ({ ...prev, estimated_value: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('assets.form.fields.valuePlaceholder')}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assets.form.fields.location')}
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('assets.form.fields.locationPlaceholder')}
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="beneficiary_id" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assets.form.fields.beneficiary')}
            </label>
            <select
              id="beneficiary_id"
              value={formData.beneficiary_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, beneficiary_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t('assets.form.fields.selectBeneficiary')}</option>
              {beneficiaries.map((beneficiary) => (
                <option key={beneficiary.id} value={beneficiary.id}>
                  {beneficiary.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
              className="flex-1"
            >
              {t('assets.form.buttons.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? t('assets.form.buttons.saving') : asset ? t('assets.form.buttons.updateAsset') : t('assets.form.buttons.addAsset')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}