import { useState } from 'react';
import { ProfileView } from './ProfileView';
import { ProfileForm } from './ProfileForm';

export function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      {isEditing ? (
        <div className="bg-white shadow rounded-lg p-6">
          <ProfileForm />
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <ProfileView onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
}