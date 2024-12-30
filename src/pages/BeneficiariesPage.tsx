import { useState } from 'react';
import { BeneficiaryList } from '../components/beneficiaries/BeneficiaryList';
import { BeneficiaryForm } from '../components/beneficiaries/BeneficiaryForm';
import { useBeneficiaries } from '../hooks/useBeneficiaries';
import type { Beneficiary } from '../types/database';

export function BeneficiariesPage() {
  const { beneficiaries, loading, error, createBeneficiary, updateBeneficiary, deleteBeneficiary } = useBeneficiaries();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | undefined>();

  const handleSubmit = async (data: Partial<Beneficiary>) => {
    if (editingBeneficiary) {
      await updateBeneficiary(editingBeneficiary.id, data);
    } else {
      await createBeneficiary(data);
    }
    setIsFormOpen(false);
    setEditingBeneficiary(undefined);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Beneficiaries</h1>

      {isFormOpen ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            {editingBeneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}
          </h2>
          <BeneficiaryForm
            beneficiary={editingBeneficiary}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingBeneficiary(undefined);
            }}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <BeneficiaryList
            beneficiaries={beneficiaries}
            onAdd={() => setIsFormOpen(true)}
            onEdit={(beneficiary) => {
              setEditingBeneficiary(beneficiary);
              setIsFormOpen(true);
            }}
            onDelete={deleteBeneficiary}
          />
        </div>
      )}
    </div>
  );
}