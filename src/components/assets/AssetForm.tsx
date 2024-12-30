import { useState } from 'react';
import { type Asset } from '../../types/database';
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { Button } from '../ui/Button';

export interface AssetFormProps {
  asset?: Asset;
  onSubmit: (data: Partial<Asset>) => Promise<void>;
  onCancel: () => void;
}

export function AssetForm({ asset, onSubmit, onCancel }: AssetFormProps) {
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
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Asset name is required');
      }

      // Prepare data for submission
      const submitData: Partial<Asset> = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        location: formData.location.trim() || null,
        beneficiary_id: formData.beneficiary_id || null,
      };

      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="type"
          required
          value={formData.type}
          onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as Asset['type'] }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="financial">Financial</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700">
          Estimated Value
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="estimated_value"
            step="0.01"
            value={formData.estimated_value}
            onChange={(e) => setFormData((prev) => ({ ...prev, estimated_value: e.target.value }))}
            className="pl-7 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="beneficiary" className="block text-sm font-medium text-gray-700">
          Beneficiary
        </label>
        <select
          id="beneficiary"
          value={formData.beneficiary_id}
          onChange={(e) => setFormData((prev) => ({ ...prev, beneficiary_id: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">No beneficiary assigned</option>
          {beneficiaries.map((beneficiary) => (
            <option key={beneficiary.id} value={beneficiary.id}>
              {beneficiary.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}