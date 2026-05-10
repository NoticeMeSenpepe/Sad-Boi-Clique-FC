// ============================================================
// Supabase client — single shared instance for the whole app.
// The values come from Vite environment variables defined in
// `.env.local` for local dev and from Vercel project settings
// in production. Both values are anon-public-key keys, safe to
// embed in the front-end bundle (security comes from RLS).
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

if (url && key) {
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — falling back to mock data.');
}

/**
 * Returns the configured Supabase client, or null if env vars are missing.
 * Callers should treat null as "use mock data" rather than crashing.
 */
export function getSupabase(): SupabaseClient | null {
  return client;
}

/** EA club identifiers used in API queries. */
export const SBC_CLUB_ID  = import.meta.env.VITE_SBC_CLUB_ID  || '477926';
export const SBC_PLATFORM = import.meta.env.VITE_SBC_PLATFORM || 'common-gen5';
