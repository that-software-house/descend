import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[Supabase] Missing env vars — falling back to local JSON data.');
}

export const supabase = url && key ? createClient(url, key) : null;
