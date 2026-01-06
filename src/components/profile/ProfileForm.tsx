import { useState } from 'react';
import { User, Phone, MapPin, AlertCircle, FileText, Save } from 'lucide-react';
import { type Profile } from '../../types/database';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useProfile } from '../../hooks/useProfile';
import { useLocale } from '../../hooks/useLocale';
import type { Currency } from '../../lib/currency';
import { API_BASE_URL } from '../../lib/api';

export function ProfileForm() {
  const { profile, loading, error, updateProfile } = useProfile();
  const { currentLanguage, changeLanguage, currentCurrency, changeCurrency } = useLocale();
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: profile?.full_name ?? '',
    date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
    avatar_url: profile?.avatar_url ?? '',
    // Contact Information
    phone_number: profile?.phone_number ?? '',
    email: profile?.email ?? '',
    // Address
    street_address: profile?.street_address ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    zip_code: profile?.zip_code ?? '',
    country: profile?.country ?? '',
    // Emergency Contact
    emergency_contact_name: profile?.emergency_contact_name ?? '',
    emergency_contact_phone: profile?.emergency_contact_phone ?? '',
    emergency_contact_relationship: profile?.emergency_contact_relationship ?? '',
    // Legacy Planning
    special_instructions: profile?.special_instructions ?? '',
    executor_name: profile?.executor_name ?? '',
    executor_phone: profile?.executor_phone ?? '',
    executor_email: profile?.executor_email ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error.message}</div>;
  if (!profile) return <div className="text-center py-8">No profile found</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {saveError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <div className="text-sm text-red-700">{saveError}</div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-md">
          <div className="text-sm text-green-700">Profile saved successfully!</div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <User className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url.startsWith('http') ? formData.avatar_url : `${API_BASE_URL}${formData.avatar_url}`}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load avatar:', formData.avatar_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      if (API_BASE_URL) {
                        // Local API mode - upload to backend
                        const uploadFormData = new FormData();
                        uploadFormData.append('avatar', file);

                        const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
                          method: 'POST',
                          credentials: 'include',
                          body: uploadFormData,
                        });

                        if (!response.ok) throw new Error('Failed to upload avatar');

                        const data = await response.json();
                        // Store the relative path in formData, it will be prefixed when displayed
                        setFormData((prev) => ({ ...prev, avatar_url: data.avatar_url }));
                      } else {
                        // Supabase mode
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
                    } catch (error) {
                      setSaveError(error instanceof Error ? error.message : 'Failed to upload avatar');
                    }
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

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              id="date_of_birth"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Phone className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="john.doe@example.com"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <MapPin className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Address</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="street_address" className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <input
              type="text"
              id="street_address"
              value={formData.street_address}
              onChange={(e) => handleChange('street_address', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="123 Main St, Apt 4B"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="San Francisco"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State / Province
            </label>
            <input
              type="text"
              id="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="CA"
            />
          </div>

          <div>
            <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
              Zip / Postal Code
            </label>
            <input
              type="text"
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => handleChange('zip_code', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="94102"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="United States"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <AlertCircle className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
              Contact Name
            </label>
            <input
              type="text"
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
              Contact Phone
            </label>
            <input
              type="tel"
              id="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="+1 (555) 987-6543"
            />
          </div>

          <div>
            <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <input
              type="text"
              id="emergency_contact_relationship"
              value={formData.emergency_contact_relationship}
              onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Spouse, Sibling, etc."
            />
          </div>
        </div>
      </div>

      {/* Legacy Planning */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Legacy Planning</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700">
              Special Instructions
            </label>
            <textarea
              id="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => handleChange('special_instructions', e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Any special wishes, funeral instructions, distribution preferences, or important notes for your beneficiaries..."
            />
            <p className="mt-1 text-xs text-gray-500">
              This information will help your executor and beneficiaries understand your wishes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="executor_name" className="block text-sm font-medium text-gray-700">
                Executor Name
              </label>
              <input
                type="text"
                id="executor_name"
                value={formData.executor_name}
                onChange={(e) => handleChange('executor_name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Executor's full name"
              />
            </div>

            <div>
              <label htmlFor="executor_phone" className="block text-sm font-medium text-gray-700">
                Executor Phone
              </label>
              <input
                type="tel"
                id="executor_phone"
                value={formData.executor_phone}
                onChange={(e) => handleChange('executor_phone', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label htmlFor="executor_email" className="block text-sm font-medium text-gray-700">
                Executor Email
              </label>
              <input
                type="email"
                id="executor_email"
                value={formData.executor_email}
                onChange={(e) => handleChange('executor_email', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="executor@example.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </Button>
      </div>
    </form>
  );
}
