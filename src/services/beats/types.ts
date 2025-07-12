
import { Beat } from '@/types';

export interface SupabaseBeat {
  id: string;
  title: string;
  producer_id: string;
  users?: {
    full_name?: string | null;
    stage_name?: string | null;
  } | null;
  cover_image?: string | null;
  audio_preview?: string | null;
  audio_file?: string | null;
  basic_license_price_local?: number | null;
  basic_license_price_diaspora?: number | null;
  premium_license_price_local?: number | null;
  premium_license_price_diaspora?: number | null;
  exclusive_license_price_local?: number | null;
  exclusive_license_price_diaspora?: number | null;
  custom_license_price_local?: number | null;
  custom_license_price_diaspora?: number | null;
  genre?: string | null;
  track_type?: string | null;
  bpm?: number | null;
  tags?: string[] | null;
  description?: string | null;
  upload_date?: string | null;
  favorites_count?: number | null;
  purchase_count?: number | null;
  status?: string | null;
  key?: string | null;
  plays?: number | null;
  is_trending?: boolean | null;
  is_featured?: boolean | null;
  is_weekly_pick?: boolean | null;
  category?: string | null;
}
