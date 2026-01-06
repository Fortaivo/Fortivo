import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetForm } from '../components/assets/AssetForm';

// Mock hooks
vi.mock('../hooks/useBeneficiaries', () => ({
  useBeneficiaries: () => ({
    beneficiaries: [
      { id: '1', full_name: 'John Doe', email: 'john@example.com', relationship: 'Spouse', phone: '1234567890' }
    ],
    loading: false
  })
}));

const renderAssetForm = (asset = null, onSubmit = vi.fn().mockResolvedValue({}), onCancel = vi.fn()) => {
  return render(<AssetForm asset={asset} onSubmit={onSubmit} onCancel={onCancel} />);
};

describe('AssetForm Component', () => {
  it('should render asset form', () => {
    renderAssetForm();

    expect(screen.getByLabelText(/asset name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asset type/i)).toBeInTheDocument();
  });

  it('should handle name input', () => {
    renderAssetForm();

    const nameInput = screen.getByLabelText(/asset name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'House' } });

    expect(nameInput.value).toBe('House');
  });

  it('should handle value input', () => {
    renderAssetForm();

    const valueInput = screen.getByLabelText(/estimated value/i) as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: '250000' } });

    expect(valueInput.value).toBe('250000');
  });

  it('should show Add Asset button when creating new asset', () => {
    renderAssetForm();

    expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
  });

  it('should show Update Asset button when editing existing asset', () => {
    const existingAsset = {
      id: '1',
      name: 'House',
      type: 'physical' as const,
      description: 'My house',
      estimated_value: 250000,
      location: 'New York',
      beneficiary_id: null,
      user_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    renderAssetForm(existingAsset);

    expect(screen.getByRole('button', { name: /update asset/i })).toBeInTheDocument();
  });

  it('should pre-fill form when editing existing asset', () => {
    const existingAsset = {
      id: '1',
      name: 'House',
      type: 'physical' as const,
      description: 'My house',
      estimated_value: 250000,
      location: 'New York',
      beneficiary_id: null,
      user_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    renderAssetForm(existingAsset);

    const nameInput = screen.getByLabelText(/asset name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('House');
  });

  it('should have a cancel button', () => {
    renderAssetForm();

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onCancel when cancel is clicked', () => {
    const onCancel = vi.fn();
    renderAssetForm(null, vi.fn(), onCancel);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
