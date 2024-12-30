/*
  # Fix Assets RLS Policies

  1. Changes
    - Drop existing RLS policy for assets table
    - Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
    - Ensure proper user_id checks for all operations

  2. Security
    - Users can only manage their own assets
    - INSERT requires setting correct user_id
    - UPDATE/DELETE restricted to asset owner
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage own assets" ON assets;

-- Create specific policies for each operation
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);