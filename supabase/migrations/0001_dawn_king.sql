/*
  # Initial Schema Setup for Asset Management App

  1. New Tables
    - `profiles`
      - Extended user profile information
      - Linked to Supabase auth.users
    - `assets`
      - Core asset information
      - Supports multiple asset types
    - `beneficiaries`
      - Beneficiary information
      - Links to assets
    - `asset_documents`
      - Document metadata storage
      - Links to assets
    - `subscriptions`
      - User subscription information
      - Tracks tier and status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Implement row-level ownership checks
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  estimated_value decimal(15,2),
  location text,
  acquisition_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_asset_type CHECK (type IN ('financial', 'physical', 'digital', 'other'))
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assets"
  ON assets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  full_name text NOT NULL,
  relationship text,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own beneficiaries"
  ON beneficiaries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create asset_beneficiaries junction table
CREATE TABLE IF NOT EXISTS asset_beneficiaries (
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE CASCADE,
  allocation_percentage decimal(5,2) CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (asset_id, beneficiary_id)
);

ALTER TABLE asset_beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own asset beneficiaries"
  ON asset_beneficiaries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_beneficiaries.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- Create asset_documents table
CREATE TABLE IF NOT EXISTS asset_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  CONSTRAINT valid_file_type CHECK (file_type IN ('pdf', 'image', 'document'))
);

ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own asset documents"
  ON asset_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_documents.asset_id
      AND assets.user_id = auth.uid()
    )
  );

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tier text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'pro', 'premium')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due'))
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();