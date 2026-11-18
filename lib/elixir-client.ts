import { getBrowserClient } from '@/lib/supabase/client';

/** The one place Elixir picks its Supabase client (configured in lib/config.ts). */
export const getElixirClient = getBrowserClient;
