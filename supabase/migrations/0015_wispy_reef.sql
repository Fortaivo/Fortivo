/*
  # Stripe Integration and Beneficiary Limits

  1. Changes
    - Add Stripe webhook handling
    - Update subscription management
    - Add beneficiary limit enforcement
*/

-- Add Stripe webhook event log
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  status text DEFAULT 'pending',
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Create policy for Stripe service role only
CREATE POLICY "Service role can manage events"
  ON stripe_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to handle subscription updates
CREATE OR REPLACE FUNCTION handle_subscription_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile subscription tier
  UPDATE profiles
  SET subscription_tier = NEW.tier
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription updates
DROP TRIGGER IF EXISTS on_subscription_update ON subscriptions;
CREATE TRIGGER on_subscription_update
  AFTER INSERT OR UPDATE OF tier
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_update();

-- Add function to check beneficiary limit
CREATE OR REPLACE FUNCTION check_beneficiary_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count integer;
  max_limit integer;
BEGIN
  -- Get current beneficiary count
  SELECT COUNT(*)
  FROM beneficiaries
  WHERE user_id = NEW.user_id
  INTO current_count;

  -- Get user's limit
  SELECT beneficiary_limit
  FROM profiles
  WHERE id = NEW.user_id
  INTO max_limit;

  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Beneficiary limit reached. Please upgrade your plan.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for beneficiary limit
DROP TRIGGER IF EXISTS check_beneficiary_limit ON beneficiaries;
CREATE TRIGGER check_beneficiary_limit
  BEFORE INSERT ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION check_beneficiary_limit();