-- Add multi-license pricing columns to soundpacks table
ALTER TABLE soundpacks
  ADD COLUMN basic_license_price_local numeric DEFAULT 0,
  ADD COLUMN basic_license_price_diaspora numeric DEFAULT 0,
  ADD COLUMN premium_license_price_local numeric DEFAULT 0,
  ADD COLUMN premium_license_price_diaspora numeric DEFAULT 0,
  ADD COLUMN exclusive_license_price_local numeric DEFAULT 0,
  ADD COLUMN exclusive_license_price_diaspora numeric DEFAULT 0,
  ADD COLUMN custom_license_price_local numeric DEFAULT 0,
  ADD COLUMN custom_license_price_diaspora numeric DEFAULT 0,
  ADD COLUMN license_type text,
  ADD COLUMN license_terms text;

-- Remove old single-price columns
ALTER TABLE soundpacks
  DROP COLUMN IF EXISTS price_local,
  DROP COLUMN IF EXISTS price_diaspora;

-- Add comment for clarity
COMMENT ON TABLE soundpacks IS 'Soundpacks use the same multi-license pricing model as beats';