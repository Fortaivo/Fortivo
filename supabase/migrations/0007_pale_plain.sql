/*
  # Add beneficiary relationship to assets

  1. Changes
    - Add beneficiary_id column to assets table
    - Add foreign key constraint to beneficiaries table
    - Add index for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add beneficiary_id column
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_assets_beneficiary_id ON assets(beneficiary_id);