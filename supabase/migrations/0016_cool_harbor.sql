-- Add Stripe columns to subscriptions if they don't exist
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Create Stripe prices table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_prices (
  id text PRIMARY KEY,
  tier text NOT NULL,
  active boolean DEFAULT true,
  currency text NOT NULL,
  unit_amount integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'pro', 'premium'))
);

-- Enable RLS if not already enabled
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;

-- Insert or update initial prices
INSERT INTO stripe_prices (id, tier, currency, unit_amount) VALUES
  ('price_pro_monthly', 'pro', 'usd', 99),    -- $0.99
  ('price_premium_monthly', 'premium', 'usd', 199)  -- $1.99
ON CONFLICT (id) DO UPDATE
SET unit_amount = EXCLUDED.unit_amount;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_stripe_prices_tier ON stripe_prices(tier);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_active ON stripe_prices(active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);