-- Phase 1.1: Add referral columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referred_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Phase 1.2: Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed')),
  reward_points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Prevent self-referrals
  CONSTRAINT no_self_referral CHECK (referrer_user_id != referred_user_id),
  -- Ensure unique referral per referred user
  CONSTRAINT unique_referred_user UNIQUE (referred_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);

-- Phase 1.3: Enable RLS on referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "users_see_own_referrals" 
ON referrals FOR SELECT 
USING (auth.uid() = referrer_user_id);

-- System can insert referrals (for signup flow)
CREATE POLICY "system_insert_referral" 
ON referrals FOR INSERT 
WITH CHECK (true);

-- System can update referral status
CREATE POLICY "system_update_referral" 
ON referrals FOR UPDATE 
USING (true);

-- Admins can see all referrals
CREATE POLICY "admins_see_all_referrals"
ON referrals FOR SELECT
USING (is_admin());

-- Phase 1.4: Atomic reward function
CREATE OR REPLACE FUNCTION award_referral_success(
  referral_uuid UUID,
  reward_points INTEGER DEFAULT 10
)
RETURNS TABLE(
  referrer_id UUID,
  total_points INTEGER,
  success BOOLEAN,
  message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  updated_points INTEGER;
BEGIN
  -- Lock the referral row for update
  SELECT * INTO r FROM referrals WHERE id = referral_uuid FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, 0, false, 'Referral not found';
    RETURN;
  END IF;

  -- Check if already successful (idempotent)
  IF r.status = 'successful' THEN
    SELECT referral_points INTO updated_points FROM users WHERE id = r.referrer_user_id;
    RETURN QUERY SELECT r.referrer_user_id, updated_points, true, 'Already awarded';
    RETURN;
  END IF;

  -- Update referral status
  UPDATE referrals
  SET 
    status = 'successful',
    updated_at = NOW(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{awarded_at}',
      to_jsonb(NOW())
    )
  WHERE id = referral_uuid;

  -- Award points atomically
  UPDATE users
  SET 
    referral_points = referral_points + reward_points,
    referred_count = referred_count + 1
  WHERE id = r.referrer_user_id
  RETURNING referral_points INTO updated_points;

  RETURN QUERY SELECT r.referrer_user_id, updated_points, true, 'Points awarded successfully';
END;
$$;

-- Phase 1.5: Referral code generation function
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: ORD-XXXXXX (6 random alphanumeric)
    new_code := 'ORD-' || UPPER(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Phase 1.6: Trigger for auto-generating referral codes
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ensure_referral_code
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION ensure_referral_code();

-- Phase 1.7: Create referral logs table for observability
CREATE TABLE IF NOT EXISTS referral_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  referral_id UUID REFERENCES referrals(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_logs_event_type ON referral_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_logs_user_id ON referral_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_logs_created_at ON referral_logs(created_at);