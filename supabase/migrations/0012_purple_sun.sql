/*
  # Fix profile creation issues

  1. Changes
    - Add unique constraint on user_id in subscriptions
    - Improve error handling in user setup trigger
    - Add defensive checks for duplicate profiles
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Improve user setup function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists boolean;
  subscription_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = NEW.id
  ) INTO profile_exists;

  -- Check if subscription already exists
  SELECT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = NEW.id
  ) INTO subscription_exists;

  -- Create profile if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO profiles (
      id,
      subscription_tier,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      'free',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
  END IF;

  -- Create subscription if it doesn't exist
  IF NOT subscription_exists THEN
    INSERT INTO subscriptions (
      user_id,
      tier,
      status,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      'free',
      'active',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + INTERVAL '100 years'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details but don't fail the transaction
  RAISE WARNING 'Error in handle_new_user_setup for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;