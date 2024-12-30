/*
  # Initialize user data on signup

  This migration adds a trigger to automatically create profile and subscription records
  when a new user signs up.

  1. New Function
    - Creates a function to handle user creation
    - Initializes profile with default values
    - Sets up free subscription tier

  2. Trigger
    - Adds trigger on auth.users table
    - Runs after insert to create required records
*/

-- Function to handle new user setup
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, subscription_tier)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NULL), 'free');

  -- Create initial free subscription
  INSERT INTO public.subscriptions (
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_setup();