import { useState } from 'react';
import { User } from 'lucide-react';
import { type Profile } from '../../types/database';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useProfile } from '../../hooks/useProfile';
import { useLocale } from '../../hooks/useLocale';
import type { Currency } from '../../lib/currency';

export function ProfileForm() {
  const { profile, loading, error, updateProfile } = useProfile();
  const { currentLanguage, changeLanguage, currentCurrency, changeCurrency } = useLocale();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name ?? '',
    avatar_url: profile?.avatar_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>No profile found</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveError(null);
      await updateProfile(formData);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saveError && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-sm text-red-700">{saveError}</div>
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
          Profile Picture
        </label>
        <div className="mt-1 flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const { data, error } = await supabase.storage
                  .from('avatars')
                  .upload(`${profile?.id}/${file.name}`, file);
                
                if (error) {
                  setSaveError(error.message);
                  return;
                }
                
                const { data: { publicUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(data.path);
                
                setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
              }
            }}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
        
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            id="language"
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
          </select>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
            Currency
          </label>
          <select
            id="currency"
            value={currentCurrency}
            onChange={(e) => changeCurrency(e.target.value as Currency)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="BRL">Brazilian Real (BRL)</option>
            <option value="MXN">Mexican Peso (MXN)</option>
            <option value="ARS">Argentine Peso (ARS)</option>
            <option value="COP">Colombian Peso (COP)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}