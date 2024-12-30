/*
  # Add exchange rates table

  1. New Table
    - Create exchange_rates table for currency conversion
  2. Security
    - Enable RLS
    - Add policies for reading rates
*/

-- Create exchange_rates table
CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rates jsonb NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading exchange rates
CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);