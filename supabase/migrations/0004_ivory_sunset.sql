/*
  # Update subscription schema for PayPal integration

  1. Changes
    - Add PayPal subscription ID and order ID columns to subscriptions table
    - Update subscription status options
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add PayPal-specific columns to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paypal_subscription_id text,
ADD COLUMN IF NOT EXISTS paypal_order_id text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_subscription_id ON subscriptions(paypal_subscription_id);

-- Update subscription status check constraint
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE subscriptions
ADD CONSTRAINT valid_status 
CHECK (status IN ('active', 'canceled', 'past_due', 'pending', 'suspended'));