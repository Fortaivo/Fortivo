/*
  # Fix subscription policies and add beneficiary limits

  1. Changes
    - Add beneficiary limit column to profiles
    - Update subscription tier handling
    - Add proper RLS policies
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- Add beneficiary limit column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS beneficiary_limit integer DEFAULT 1;

-- Function to update beneficiary limit based on tier
CREATE OR REPLACE FUNCTION update_beneficiary_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Set beneficiary limit based on subscription tier
  NEW.beneficiary_limit := CASE
    WHEN NEW.subscription_tier = 'free' THEN 1
    WHEN NEW.subscription_tier = 'pro' THEN 5
    WHEN NEW.subscription_tier = 'premium' THEN 2147483647  -- Max INT, effectively unlimited
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update beneficiary limit
DROP TRIGGER IF EXISTS update_beneficiary_limit_on_tier_change ON profiles;
CREATE TRIGGER update_beneficiary_limit_on_tier_change
  BEFORE INSERT OR UPDATE OF subscription_tier
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficiary_limit();

-- Update existing profiles with correct beneficiary limits
UPDATE profiles SET
  beneficiary_limit = CASE
    WHEN subscription_tier = 'free' THEN 1
    WHEN subscription_tier = 'pro' THEN 5
    WHEN subscription_tier = 'premium' THEN 2147483647
    ELSE 1
  END;

-- Create new RLS policies for subscriptions
CREATE POLICY "Users can manage own subscription"
  ON subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);