
export interface User {
  id: string;
  email: string;
  role: 'buyer' | 'producer' | 'admin';
  name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at?: string;
  country?: string;
  producer_name?: string; // For producers only
  default_currency?: 'NGN' | 'USD';
  bank_code?: string;
  account_number?: string;
  verified_account_name?: string;
  paystack_subaccount_code?: string;
  paystack_split_code?: string;
  wallet_address?: string; // Solana wallet address
  settings?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
    autoPlayPreviews?: boolean;
    [key: string]: any;
  };
  // Add full_name for consistency with database schema
  full_name?: string;
  stage_name?: string;
  follower_count?: number;
  // Add status field
  status?: 'active' | 'inactive';
  // Add music_interests field
  music_interests?: string[];
  // Add favorites field
  favorites?: Array<{beat_id: string, added_at: string}>;
}

export interface Beat {
  id: string;
  title: string;
  producer_id: string;
  producer_name: string;
  cover_image_url: string;
  preview_url: string;
  full_track_url: string;
  stems_url?: string; // Add stems_url field
  genre: string;
  track_type: string;
  bpm: number;
  tags: string[];
  description?: string;
  created_at: string;
  updated_at?: string;
  category?: string; // Add category field
  favorites_count: number;
  purchase_count: number;
  status: 'draft' | 'published';
  is_featured?: boolean;
  is_trending?: boolean;
  is_weekly_pick?: boolean;
  license_type?: 'basic' | 'premium' | 'exclusive' | string;
  license_terms?: string;
  basic_license_price_local?: number;
  basic_license_price_diaspora?: number;
  premium_license_price_local?: number;
  premium_license_price_diaspora?: number;
  exclusive_license_price_local?: number;
  exclusive_license_price_diaspora?: number;
  custom_license_price_local?: number;
  custom_license_price_diaspora?: number;
  plays?: number;
  key?: string;
  duration?: string;
  producer?: {
    full_name?: string;
    stage_name?: string;
    wallet_address?: string;
    id?: string;
  };
  users?: {
    full_name?: string;
    stage_name?: string;
    wallet_address?: string;
    id?: string;
  };
  selected_license?: string;
  producer_wallet_address?: string;
  soundpack_id?: string | null;
  type?: 'beat' | 'soundpack_item';
}

export interface Soundpack {
  id: string;
  producer_id: string;
  title: string;
  slug: string;
  description?: string;
  cover_art_url?: string;
  price_local: number;
  price_diaspora: number;
  currency_code: string;
  category: string;
  metadata?: Record<string, any>;
  published: boolean;
  purchase_count: number;
  file_count: number;
  created_at: string;
  updated_at: string;
  sounds?: Beat[];
  producer?: {
    full_name?: string;
    stage_name?: string;
  };
}

export interface Playlist {
  id: string;
  name: string; 
  owner_id: string;
  cover_image?: string;
  is_public: boolean;
  beats: string[]; // Array of beat IDs
  created_at: string;
  updated_at?: string;
}

export interface PlaylistBeat {
  playlist_id: string;
  beat_id: string;
  added_at: string;
}

export interface FavoriteBeat {
  user_id: string;
  beat_id: string;
  added_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  total_amount: number;
  currency: 'NGN' | 'USD';
  payment_provider: 'Paystack' | 'Stripe';
  transaction_reference: string;
  contract_consent_at: string;
  created_at: string;
}

export interface PurchasedBeat {
  purchase_id: string;
  beat_id: string;
  amount: number;
  currency: 'NGN' | 'USD';
}

export interface RoyaltySplit {
  id: string;
  beat_id: string;
  beat_title: string;
  beat_cover_image: string | null;
  collaborator_id: string;
  collaborator_name: string;
  collaborator_email: string;
  collaborator_role: string;
  percentage: number;
  created_at: string;
}

export interface CartItem {
  beat: Beat;
  added_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  notification_type: 'info' | 'success' | 'warning' | 'error' | string;
  is_read: boolean;
  created_date: string;
  related_entity_id?: string;
  related_entity_type?: string;
  sender_id?: string;
}
