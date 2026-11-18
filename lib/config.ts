/**
 * Which Supabase project Elixir talks to. The URL and anon key are PUBLIC values
 * (shipped to the browser by design; row level security protects the data).
 * Today Elixir shares the My Sparkthunder project, so those are the defaults.
 * To move Elixir to its own project, set the two environment variables and redeploy
 * (see docs/elixir-move-to-own-supabase.md). Never use a service role key here.
 */
const FALLBACK_URL = 'https://cxfrktbatcclkkixvqjq.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZnJrdGJhdGNjbGtraXh2cWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMDUzNjksImV4cCI6MjEwODg4MTM2OX0.YwDNdj8hSt-9NYHXUK4WJ9Cod3hqaRh9TMM5pxl8XgU';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_ELIXIR_SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_ELIXIR_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;
export const MYSPARKTHUNDER_URL = 'https://mysparkthunder.com';
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
