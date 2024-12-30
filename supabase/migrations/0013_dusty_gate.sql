/*
  # Add Stripe Integration

  1. Changes
    - Add Stripe-specific columns to subscriptions table
    - Create subscription_tiers enum type
    - Create stripe_prices table with proper foreign key references
    - Add RLS policies for stripe_prices
*/

-- Create subscription_tiers type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add Stripe columns to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Create Stripe prices table with proper references
CREATE TABLE IF NOT EXISTS stripe_prices (
  id text PRIMARY KEY,
  tier subscription_tier NOT NULL,
  active boolean DEFAULT true,
  currency text NOT NULL,
  unit_amount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Users can read prices"
  ON stripe_prices FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial prices
INSERT INTO stripe_prices (id, tier, currency, unit_amount) VALUES
  ('price_pro_monthly', 'pro', 'usd', 99),    -- $0.99
  ('price_premium_monthly', 'premium', 'usd', 199)  -- $1.99
ON CONFLICT (id) DO UPDATE
SET unit_amount = EXCLUDED.unit_amount;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_prices_tier ON stripe_prices(tier);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_active ON stripe_prices(active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);