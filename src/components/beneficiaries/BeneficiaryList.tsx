import { Users, Plus, Mail, Phone, Heart } from 'lucide-react';
import { type Beneficiary } from '../../types/database';
import { Button } from '../ui/Button';

import { useProfile } from '../../hooks/useProfile';

interface BeneficiaryListProps {
  beneficiaries: Beneficiary[];
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (beneficiary: Beneficiary) => void;
  onAdd: () => void;
}

export function BeneficiaryList({ beneficiaries, onEdit, onDelete, onAdd }: BeneficiaryListProps) {
  const { profile } = useProfile();
  
  // Calculate remaining beneficiary slots
  const limits = {
    free: 1,
    pro: 5,
    premium: Infinity
  };
  
  const limit = profile ? limits[profile.subscription_tier] : 0;
  const remaining = Math.max(0, limit - beneficiaries.length);

  if (beneficiaries.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No beneficiaries yet</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          Add beneficiaries to specify who should inherit your assets. 
          {profile && profile.subscription_tier !== 'premium' && (
            <span className="block mt-1">
              Your {profile.subscription_tier} plan allows {limit} beneficiary{limit !== 1 ? 'ies' : ''}.
            </span>
          )}
        </p>
        <div className="mt-6">
          <Button onClick={onAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Beneficiary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-4">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Beneficiaries</h2>
          <p className="mt-2 text-sm text-gray-700 space-y-1">
            <span className="block">Manage your beneficiaries and their contact details.</span>
            {profile && profile.subscription_tier !== 'premium' && (
              <span className="block text-indigo-600">
                {remaining} {remaining === 1 ? 'slot' : 'slots'} remaining 
                ({beneficiaries.length}/{limit} used)
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button 
            onClick={onAdd} 
            disabled={beneficiaries.length >= limit}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Beneficiary
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {beneficiaries.map((beneficiary) => (
          <article
            key={beneficiary.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {beneficiary.full_name}
                  </h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Heart className="h-4 w-4 mr-1" />
                    {beneficiary.relationship || 'Relationship not specified'}
                  </div>
                </div>
              </div>

              <dl className="mt-4 space-y-3">
                {beneficiary.contact_email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <a
                      href={`mailto:${beneficiary.contact_email}`}
                      className="text-gray-600 hover:text-indigo-600"
                    >
                      {beneficiary.contact_email}
                    </a>
                  </div>
                )}
                {beneficiary.contact_phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <a
                      href={`tel:${beneficiary.contact_phone}`}
                      className="text-gray-600 hover:text-indigo-600"
                    >
                      {beneficiary.contact_phone}
                    </a>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex space-x-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(beneficiary)}>
                  Edit Details
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this beneficiary?')) {
                      onDelete(beneficiary);
                    }
                  }
                }>
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}