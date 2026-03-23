CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metadata jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  resolved_email text := COALESCE(NEW.email, '');
  resolved_name text := COALESCE(
    NULLIF(BTRIM(metadata ->> 'full_name'), ''),
    NULLIF(BTRIM(metadata ->> 'name'), ''),
    NULLIF(BTRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'User'
  );
  resolved_role text := CASE
    WHEN COALESCE(metadata ->> 'role', '') IN ('buyer', 'producer', 'admin') THEN metadata ->> 'role'
    ELSE 'buyer'
  END;
  resolved_country text := COALESCE(NULLIF(BTRIM(metadata ->> 'country'), ''), 'Nigeria');
  resolved_profile_picture text := COALESCE(
    NULLIF(BTRIM(metadata ->> 'profile_picture'), ''),
    NULLIF(BTRIM(metadata ->> 'avatar_url'), '')
  );
  resolved_stage_name text := NULLIF(BTRIM(metadata ->> 'stage_name'), '');
  resolved_wallet_address text := NULLIF(BTRIM(metadata ->> 'wallet_address'), '');
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    country,
    profile_picture,
    stage_name,
    wallet_address
  )
  VALUES (
    NEW.id,
    resolved_email,
    resolved_name,
    resolved_role,
    'active',
    resolved_country,
    resolved_profile_picture,
    resolved_stage_name,
    resolved_wallet_address
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.users.full_name, ''), EXCLUDED.full_name),
    role = COALESCE(NULLIF(public.users.role, ''), EXCLUDED.role),
    status = COALESCE(public.users.status, EXCLUDED.status),
    country = COALESCE(NULLIF(public.users.country, ''), EXCLUDED.country),
    profile_picture = COALESCE(NULLIF(public.users.profile_picture, ''), EXCLUDED.profile_picture),
    stage_name = COALESCE(NULLIF(public.users.stage_name, ''), EXCLUDED.stage_name),
    wallet_address = COALESCE(NULLIF(public.users.wallet_address, ''), EXCLUDED.wallet_address);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

CREATE TEMP TABLE orphan_user_profile_reconciliations ON COMMIT DROP AS
SELECT
  auth_user.id AS auth_user_id,
  orphan_profile.id AS legacy_profile_id,
  orphan_profile.full_name,
  orphan_profile.stage_name,
  orphan_profile.email,
  orphan_profile.role,
  orphan_profile.profile_picture,
  orphan_profile.bio,
  orphan_profile.country,
  orphan_profile.storefront_url,
  orphan_profile.featured_beats,
  orphan_profile.favorites,
  orphan_profile.stripe_id,
  orphan_profile.paystack_id,
  orphan_profile.notifications_opt_in,
  orphan_profile.created_date,
  orphan_profile.settings,
  orphan_profile.is_producer_of_week,
  orphan_profile.bank_code,
  orphan_profile.account_number,
  orphan_profile.verified_account_name,
  orphan_profile.paystack_subaccount_code,
  orphan_profile.paystack_split_code,
  orphan_profile.follower_count,
  orphan_profile.status,
  orphan_profile.music_interests,
  orphan_profile.wallet_address,
  orphan_profile.referral_code,
  orphan_profile.referral_points,
  orphan_profile.referred_count,
  orphan_profile.onboarding_completed,
  orphan_profile.paystack_transfer_recipient_code
FROM auth.users AS auth_user
JOIN public.users AS orphan_profile
  ON LOWER(orphan_profile.email) = LOWER(auth_user.email)
LEFT JOIN public.users AS existing_profile
  ON existing_profile.id = auth_user.id
LEFT JOIN auth.users AS orphan_auth_user
  ON orphan_auth_user.id = orphan_profile.id
WHERE existing_profile.id IS NULL
  AND orphan_profile.id <> auth_user.id
  AND orphan_auth_user.id IS NULL;

DO $$
DECLARE
  reconciliation record;
  ref_constraint record;
BEGIN
  FOR reconciliation IN
    SELECT *
    FROM orphan_user_profile_reconciliations
  LOOP
    UPDATE public.users
    SET
      email = FORMAT('__reconciled__%s@ordersounds.local', reconciliation.legacy_profile_id),
      referral_code = CASE
        WHEN reconciliation.referral_code IS NOT NULL THEN FORMAT('__reconciled__%s', reconciliation.legacy_profile_id)
        ELSE NULL
      END,
      storefront_url = CASE
        WHEN reconciliation.storefront_url IS NOT NULL THEN FORMAT('__reconciled__%s', reconciliation.legacy_profile_id)
        ELSE NULL
      END
    WHERE id = reconciliation.legacy_profile_id;

    INSERT INTO public.users (
      id,
      full_name,
      stage_name,
      email,
      role,
      profile_picture,
      bio,
      country,
      storefront_url,
      featured_beats,
      favorites,
      stripe_id,
      paystack_id,
      notifications_opt_in,
      created_date,
      settings,
      is_producer_of_week,
      bank_code,
      account_number,
      verified_account_name,
      paystack_subaccount_code,
      paystack_split_code,
      follower_count,
      status,
      music_interests,
      wallet_address,
      referral_code,
      referral_points,
      referred_count,
      onboarding_completed,
      paystack_transfer_recipient_code
    )
    VALUES (
      reconciliation.auth_user_id,
      reconciliation.full_name,
      reconciliation.stage_name,
      reconciliation.email,
      reconciliation.role,
      reconciliation.profile_picture,
      reconciliation.bio,
      reconciliation.country,
      reconciliation.storefront_url,
      reconciliation.featured_beats,
      reconciliation.favorites,
      reconciliation.stripe_id,
      reconciliation.paystack_id,
      reconciliation.notifications_opt_in,
      reconciliation.created_date,
      reconciliation.settings,
      reconciliation.is_producer_of_week,
      reconciliation.bank_code,
      reconciliation.account_number,
      reconciliation.verified_account_name,
      reconciliation.paystack_subaccount_code,
      reconciliation.paystack_split_code,
      reconciliation.follower_count,
      reconciliation.status,
      reconciliation.music_interests,
      reconciliation.wallet_address,
      reconciliation.referral_code,
      reconciliation.referral_points,
      reconciliation.referred_count,
      reconciliation.onboarding_completed,
      reconciliation.paystack_transfer_recipient_code
    );

    FOR ref_constraint IN
      SELECT
        conrelid::regclass AS table_name,
        attribute.attname AS column_name
      FROM pg_constraint
      JOIN pg_attribute AS attribute
        ON attribute.attrelid = pg_constraint.conrelid
       AND attribute.attnum = ANY(pg_constraint.conkey)
      WHERE pg_constraint.contype = 'f'
        AND pg_constraint.confrelid = 'public.users'::regclass
    LOOP
      EXECUTE FORMAT(
        'UPDATE %s SET %I = $1 WHERE %I = $2',
        ref_constraint.table_name,
        ref_constraint.column_name,
        ref_constraint.column_name
      )
      USING reconciliation.auth_user_id, reconciliation.legacy_profile_id;
    END LOOP;

    DELETE FROM public.users
    WHERE id = reconciliation.legacy_profile_id;
  END LOOP;
END
$$;

INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  country,
  profile_picture,
  stage_name,
  wallet_address
)
SELECT
  auth_user.id,
  COALESCE(auth_user.email, ''),
  COALESCE(
    NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'name'), ''),
    NULLIF(BTRIM(split_part(COALESCE(auth_user.email, ''), '@', 1)), ''),
    'User'
  ),
  CASE
    WHEN COALESCE(auth_user.raw_user_meta_data ->> 'role', '') IN ('buyer', 'producer', 'admin') THEN auth_user.raw_user_meta_data ->> 'role'
    ELSE 'buyer'
  END,
  'active',
  COALESCE(NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'country'), ''), 'Nigeria'),
  COALESCE(
    NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'profile_picture'), ''),
    NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'avatar_url'), '')
  ),
  NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'stage_name'), ''),
  NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'wallet_address'), '')
FROM auth.users AS auth_user
LEFT JOIN public.users AS public_user
  ON public_user.id = auth_user.id
LEFT JOIN public.users AS email_conflict
  ON LOWER(email_conflict.email) = LOWER(COALESCE(auth_user.email, ''))
WHERE public_user.id IS NULL
  AND email_conflict.id IS NULL;
