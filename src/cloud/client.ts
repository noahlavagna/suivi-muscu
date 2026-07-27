import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cloudConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export const supabase: SupabaseClient | null = cloudConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
