
import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/config/publicEnv';
import type { Database } from './types';

export const SUPABASE_URL = publicEnv.supabaseUrl;
export const SUPABASE_PUBLISHABLE_KEY = publicEnv.supabasePublishableKey;

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    global: {
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY
      }
    }
  }
);

