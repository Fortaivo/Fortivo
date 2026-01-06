import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Beneficiary } from '../../types/database';
import { Button } from '../ui/Button';

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary;
  onSubmit: (data: Partial<Beneficiary>) => Promise<void>;
  onCancel: () => void;
}

export function BeneficiaryForm({ beneficiary, onSubmit, onCancel }: BeneficiaryFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    full_name: beneficiary?.full_name ?? '',
    relationship: beneficiary?.relationship ?? '',
    contact_email: beneficiary?.contact_email ?? '',
    contact_phone: beneficiary?.contact_phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('beneficiaries.form.errors.failedToSave'));
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
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          {t('beneficiaries.form.fields.fullName')} {t('beneficiaries.form.fields.required')}
        </label>
        <input
          type="text"
          id="full_name"
          required
          value={formData.full_name}
          onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={t('beneficiaries.form.fields.namePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
          {t('beneficiaries.form.fields.relationship')}
        </label>
        <input
          type="text"
          id="relationship"
          value={formData.relationship}
          onChange={(e) => setFormData((prev) => ({ ...prev, relationship: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={t('beneficiaries.form.fields.relationshipPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
          {t('beneficiaries.form.fields.email')}
        </label>
        <input
          type="email"
          id="contact_email"
          value={formData.contact_email}
          onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={t('beneficiaries.form.fields.emailPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
          {t('beneficiaries.form.fields.phone')}
        </label>
        <input
          type="tel"
          id="contact_phone"
          value={formData.contact_phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={t('beneficiaries.form.fields.phonePlaceholder')}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('beneficiaries.form.buttons.cancel')}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t('beneficiaries.form.buttons.saving') : beneficiary ? t('beneficiaries.form.buttons.updateBeneficiary') : t('beneficiaries.form.buttons.addBeneficiary')}
        </Button>
      </div>
    </form>
  );
}