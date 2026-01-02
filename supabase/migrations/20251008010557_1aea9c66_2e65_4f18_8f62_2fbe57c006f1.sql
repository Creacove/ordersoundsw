-- Create soundpacks table (bundle metadata)
CREATE TABLE soundpacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  cover_art_url text,
  price_local numeric NOT NULL DEFAULT 0,
  price_diaspora numeric NOT NULL DEFAULT 0,
  currency_code text DEFAULT 'NGN',
  category text DEFAULT 'Soundpack',
  metadata jsonb DEFAULT '{}',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  purchase_count integer DEFAULT 0,
  file_count integer DEFAULT 0
);

-- Create indexes for soundpacks
CREATE INDEX idx_soundpacks_producer ON soundpacks(producer_id);
CREATE INDEX idx_soundpacks_published ON soundpacks(published) WHERE published = true;
CREATE INDEX idx_soundpacks_slug ON soundpacks(slug);

-- Extend beats table to link with soundpacks
ALTER TABLE beats
  ADD COLUMN soundpack_id uuid REFERENCES soundpacks(id) ON DELETE SET NULL,
  ADD COLUMN type text DEFAULT 'beat' CHECK (type IN ('beat', 'soundpack_item'));

-- Create indexes for beats extensions
CREATE INDEX idx_beats_soundpack_id ON beats(soundpack_id) WHERE soundpack_id IS NOT NULL;
CREATE INDEX idx_beats_type ON beats(type);

-- Create purchase tracking table
CREATE TABLE user_purchased_soundpacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES soundpacks(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  purchase_date timestamptz DEFAULT now(),
  UNIQUE(user_id, pack_id)
);

-- Create indexes for purchase tracking
CREATE INDEX idx_user_purchased_soundpacks_user ON user_purchased_soundpacks(user_id);
CREATE INDEX idx_user_purchased_soundpacks_pack ON user_purchased_soundpacks(pack_id);

-- Enable RLS on soundpacks
ALTER TABLE soundpacks ENABLE ROW LEVEL SECURITY;

-- RLS policies for soundpacks
CREATE POLICY "Anyone can view published soundpacks"
  ON soundpacks FOR SELECT
  USING (published = true);

CREATE POLICY "Producers can manage their own soundpacks"
  ON soundpacks FOR ALL
  USING (producer_id = auth.uid());

CREATE POLICY "Admins have full access to soundpacks"
  ON soundpacks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Enable RLS on user_purchased_soundpacks
ALTER TABLE user_purchased_soundpacks ENABLE ROW LEVEL SECURITY;

-- RLS policies for purchased soundpacks
CREATE POLICY "Users can view their purchased soundpacks"
  ON user_purchased_soundpacks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create purchase records"
  ON user_purchased_soundpacks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all soundpack purchases"
  ON user_purchased_soundpacks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );