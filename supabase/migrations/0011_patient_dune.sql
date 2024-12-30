/*
  # Fix profile handling

  1. Changes
    - Add NOT NULL constraint to subscription_tier
    - Add default timestamps
    - Add trigger for updating updated_at
*/

-- Add NOT NULL constraint to subscription_tier
ALTER TABLE profiles 
ALTER COLUMN subscription_tier SET NOT NULL,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Ensure all existing rows have subscription_tier
UPDATE profiles 
SET subscription_tier = 'free' 
WHERE subscription_tier IS NULL;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_profile_updated_at'
  ) THEN
    CREATE TRIGGER set_profile_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();
  END IF;
END
$$;