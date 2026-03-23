import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { mapSupabaseUser } from '@/lib/supabase';
import type { User } from '@/types';

type UserProfileRow = Database['public']['Tables']['users']['Row'];
type UserProfileInsert = Database['public']['Tables']['users']['Insert'];
type UserProfileUpdate = Database['public']['Tables']['users']['Update'];

const USER_PROFILE_SELECT = `
  id,
  email,
  full_name,
  role,
  status,
  country,
  bio,
  profile_picture,
  stage_name,
  wallet_address,
  account_number,
  bank_code,
  verified_account_name,
  paystack_subaccount_code,
  paystack_split_code,
  referral_code,
  referral_points,
  referred_count,
  onboarding_completed,
  follower_count,
  music_interests,
  favorites,
  settings
`;

const VALID_ROLES = new Set<User['role']>(['buyer', 'producer', 'admin']);
const VALID_STATUSES = new Set<NonNullable<User['status']>>(['active', 'inactive']);

const trimToNull = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getMetadataValue = (user: AuthUser, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = trimToNull(user.user_metadata?.[key]);
    if (value) {
      return value;
    }
  }

  return null;
};

const getDefaultDisplayName = (user: AuthUser) => {
  return (
    getMetadataValue(user, 'full_name', 'name') ??
    trimToNull(user.email?.split('@')[0]) ??
    'User'
  );
};

const normalizeRole = (value: unknown): User['role'] => {
  if (typeof value === 'string' && VALID_ROLES.has(value as User['role'])) {
    return value as User['role'];
  }

  return 'buyer';
};

const normalizeStatus = (value: unknown): NonNullable<User['status']> => {
  if (typeof value === 'string' && VALID_STATUSES.has(value as NonNullable<User['status']>)) {
    return value as NonNullable<User['status']>;
  }

  return 'active';
};

const selectUserProfile = async (userId: string): Promise<UserProfileRow | null> => {
  const { data, error } = await supabase
    .from('users')
    .select(USER_PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const buildUserProfileInsert = (
  user: AuthUser,
  overrides: Partial<UserProfileInsert> = {}
): UserProfileInsert => {
  return {
    id: user.id,
    email: trimToNull(overrides.email) ?? user.email ?? '',
    full_name: trimToNull(overrides.full_name) ?? getDefaultDisplayName(user),
    role: normalizeRole(overrides.role ?? getMetadataValue(user, 'role')),
    status: normalizeStatus(overrides.status),
    country: trimToNull(overrides.country) ?? getMetadataValue(user, 'country') ?? 'Nigeria',
    profile_picture:
      trimToNull(overrides.profile_picture) ??
      getMetadataValue(user, 'profile_picture', 'avatar_url'),
    stage_name: trimToNull(overrides.stage_name) ?? getMetadataValue(user, 'stage_name'),
    wallet_address:
      trimToNull(overrides.wallet_address) ?? getMetadataValue(user, 'wallet_address'),
  };
};

export const ensureUserProfile = async (
  user: AuthUser,
  overrides: Partial<UserProfileInsert> = {}
): Promise<UserProfileRow> => {
  const existingProfile = await selectUserProfile(user.id);
  if (existingProfile) {
    return existingProfile;
  }

  const { data, error } = await supabase
    .from('users')
    .insert(buildUserProfileInsert(user, overrides))
    .select(USER_PROFILE_SELECT)
    .single();

  if (!error) {
    return data;
  }

  if (error.code === '23505' || error.message.toLowerCase().includes('duplicate key')) {
    const recoveredProfile = await selectUserProfile(user.id);
    if (recoveredProfile) {
      return recoveredProfile;
    }
  }

  throw error;
};

export const updateUserProfileRecord = async (
  user: AuthUser,
  updates: UserProfileUpdate
): Promise<UserProfileRow> => {
  await ensureUserProfile(user);

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select(USER_PROFILE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const mapJsonArray = <T>(value: unknown): T[] | undefined => {
  return Array.isArray(value) ? (value as T[]) : undefined;
};

const mapJsonObject = <T extends Record<string, unknown>>(value: unknown): T | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }

  return undefined;
};

export const toAppUser = (authUser: AuthUser, profile: UserProfileRow): User => {
  const mappedUser = mapSupabaseUser(authUser);
  const fullName = trimToNull(profile.full_name) ?? mappedUser.name;
  const stageName = trimToNull(profile.stage_name) ?? mappedUser.producer_name ?? undefined;
  const country = trimToNull(profile.country) ?? mappedUser.country ?? '';
  const avatarUrl = trimToNull(profile.profile_picture) ?? mappedUser.avatar_url ?? '';

  return {
    ...mappedUser,
    email: trimToNull(profile.email) ?? mappedUser.email,
    role: normalizeRole(profile.role),
    status: normalizeStatus(profile.status),
    name: fullName,
    full_name: fullName,
    country,
    avatar_url: avatarUrl,
    producer_name: stageName,
    stage_name: stageName,
    wallet_address: trimToNull(profile.wallet_address) ?? '',
    bio: trimToNull(profile.bio) ?? mappedUser.bio ?? '',
    bank_code: trimToNull(profile.bank_code) ?? undefined,
    account_number: trimToNull(profile.account_number) ?? undefined,
    verified_account_name: trimToNull(profile.verified_account_name) ?? undefined,
    paystack_subaccount_code: trimToNull(profile.paystack_subaccount_code) ?? undefined,
    paystack_split_code: trimToNull(profile.paystack_split_code) ?? undefined,
    referral_code: trimToNull(profile.referral_code) ?? undefined,
    referral_points: profile.referral_points ?? undefined,
    referred_count: profile.referred_count ?? undefined,
    onboarding_completed: profile.onboarding_completed ?? undefined,
    follower_count: profile.follower_count ?? undefined,
    music_interests: mapJsonArray<string>(profile.music_interests),
    favorites: mapJsonArray<NonNullable<User['favorites']>[number]>(profile.favorites),
    settings: mapJsonObject<NonNullable<User['settings']>>(profile.settings),
  };
};

export const loadAppUser = async (
  authUser: AuthUser,
  overrides: Partial<UserProfileInsert> = {}
): Promise<User> => {
  const profile = await ensureUserProfile(authUser, overrides);
  return toAppUser(authUser, profile);
};
