import { User, Phone, MapPin, AlertCircle, FileText, Mail, Calendar } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { Button } from '../ui/Button';
import { API_BASE_URL } from '../../lib/api';

interface ProfileViewProps {
  onEdit: () => void;
}

export function ProfileView({ onEdit }: ProfileViewProps) {
  const { profile, loading, error } = useProfile();

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error.message}</div>;
  if (!profile) return <div className="text-center py-8">No profile found</div>;

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${API_BASE_URL}${avatarUrl}`;
  };

  const avatarUrl = getAvatarUrl(profile.avatar_url);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const InfoSection = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoField = ({ label, value }: { label: string, value: string | null }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || 'Not provided'}</dd>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Avatar */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.full_name || 'User avatar'}
                className="h-20 w-20 rounded-full object-cover"
                onError={(e) => {
                  console.error('Failed to load avatar:', avatarUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.full_name || 'Unnamed User'}
              </h2>
              <p className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  profile.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                  profile.subscription_tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)} Plan
                </span>
              </p>
            </div>
          </div>
          <Button onClick={onEdit}>Edit Profile</Button>
        </div>
      </div>

      {/* Basic Information */}
      <InfoSection icon={User} title="Basic Information">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Full Name" value={profile.full_name} />
          <InfoField label="Date of Birth" value={profile.date_of_birth ? formatDate(profile.date_of_birth) : null} />
        </dl>
      </InfoSection>

      {/* Contact Information */}
      <InfoSection icon={Phone} title="Contact Information">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Phone Number" value={profile.phone_number} />
          <InfoField label="Email Address" value={profile.email} />
        </dl>
      </InfoSection>

      {/* Address */}
      <InfoSection icon={MapPin} title="Address">
        <dl className="grid grid-cols-1 gap-4">
          <InfoField label="Street Address" value={profile.street_address} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="City" value={profile.city} />
            <InfoField label="State/Province" value={profile.state} />
            <InfoField label="Zip/Postal Code" value={profile.zip_code} />
          </div>
          <InfoField label="Country" value={profile.country} />
        </dl>
      </InfoSection>

      {/* Emergency Contact */}
      <InfoSection icon={AlertCircle} title="Emergency Contact">
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="Contact Name" value={profile.emergency_contact_name} />
          <InfoField label="Contact Phone" value={profile.emergency_contact_phone} />
          <InfoField label="Relationship" value={profile.emergency_contact_relationship} />
        </dl>
      </InfoSection>

      {/* Legacy Planning */}
      <InfoSection icon={FileText} title="Legacy Planning">
        <dl className="space-y-4">
          {profile.special_instructions && (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Special Instructions</dt>
              <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
                {profile.special_instructions}
              </dd>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="Executor Name" value={profile.executor_name} />
            <InfoField label="Executor Phone" value={profile.executor_phone} />
            <InfoField label="Executor Email" value={profile.executor_email} />
          </div>
        </dl>
      </InfoSection>
    </div>
  );
}
