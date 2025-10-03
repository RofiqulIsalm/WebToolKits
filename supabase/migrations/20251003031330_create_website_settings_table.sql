/*
  # Create Website Settings Table

  1. New Tables
    - `website_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting identifier
      - `value` (text) - Setting value (can store URLs, text, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `website_settings` table
    - Add policy for public read access
    - Add policy for public write access (you can restrict this later if needed)
*/

CREATE TABLE IF NOT EXISTS website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read website settings"
  ON website_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert website settings"
  ON website_settings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update website settings"
  ON website_settings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete website settings"
  ON website_settings FOR DELETE
  TO public
  USING (true);