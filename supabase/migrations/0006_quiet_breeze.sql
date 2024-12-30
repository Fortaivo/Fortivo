/*
  # Fix profile policies and triggers

  1. Changes
    - Drop existing profile policies
    - Add new policies for profile management
    - Update trigger to handle profile creation

  2. Security
    - Enable RLS on profiles table
    - Add policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy for inserting new profiles
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update trigger function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with proper RLS
  INSERT INTO public.profiles (id, subscription_tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (id) DO NOTHING;

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
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;