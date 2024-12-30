import { User } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { Button } from '../ui/Button';

interface ProfileViewProps {
  onEdit: () => void;
}

export function ProfileView({ onEdit }: ProfileViewProps) {
  const { profile, loading, error } = useProfile();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User avatar'}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile.full_name || 'Unnamed User'}
            </h2>
            <p className="text-sm text-gray-500">
              Subscription: {profile.subscription_tier}
            </p>
          </div>
        </div>
        <Button onClick={onEdit}>Edit Profile</Button>
      </div>
    </div>
  );
}