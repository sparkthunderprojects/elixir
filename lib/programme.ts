import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export interface Tier { id: string; name: string; min_spend_gbp: number; earn_multiplier: number; color: string; perks: string[] }
export interface PublicReward { title: string; description: string; reward_type: string; value: number | null; point_cost: number; brand: string | null }
export interface PublicBrand { slug: string; name: string; brand_type: 'owned' | 'partner' }
export interface Programme {
  earn_points_per_gbp: number;
  redeem_points_per_gbp: number;
  tier_window_months: number;
  tiers: Tier[];
  rewards: PublicReward[];
  brands: PublicBrand[];
}

/** Shown if the live programme can't be read (it matches the starting setup). */
const FALLBACK: Programme = {
  earn_points_per_gbp: 1,
  redeem_points_per_gbp: 200,
  tier_window_months: 12,
  tiers: [
    { id: 'bronze', name: 'Bronze', min_spend_gbp: 0, earn_multiplier: 1, color: '#b45309', perks: [] },
    { id: 'silver', name: 'Silver', min_spend_gbp: 500, earn_multiplier: 1.25, color: '#64748b', perks: [] },
    { id: 'gold', name: 'Gold', min_spend_gbp: 2000, earn_multiplier: 1.5, color: '#d97706', perks: [] },
    { id: 'platinum', name: 'Platinum', min_spend_gbp: 5000, earn_multiplier: 2, color: '#7c3aed', perks: [] },
  ],
  rewards: [
    { title: '£5 off your order', description: 'Redeem at checkout on any Sparkthunder brand', reward_type: 'fixed_discount', value: 5, point_cost: 1000, brand: null },
    { title: '£10 off your order', description: 'Redeem at checkout on any Sparkthunder brand', reward_type: 'fixed_discount', value: 10, point_cost: 2000, brand: null },
    { title: '£25 off your order', description: 'Redeem at checkout on any Sparkthunder brand', reward_type: 'fixed_discount', value: 25, point_cost: 5000, brand: null },
  ],
  brands: [
    { slug: 'sparkthunder-shop', name: 'Sparkthunder Shop', brand_type: 'owned' },
    { slug: 'knightverge', name: 'Knightverge', brand_type: 'owned' },
    { slug: 'roll-combat', name: 'Roll Combat', brand_type: 'owned' },
    { slug: 'miss-petty', name: 'Miss Petty', brand_type: 'owned' },
  ],
};

/**
 * Reads the live programme (rates, tiers, rewards, brands) on the server, so the
 * HTML search engines see always matches what members see. Cached and refreshed
 * every five minutes. Never throws: falls back to the starting setup.
 */
export async function getProgramme(): Promise<Programme> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/elixir_programme`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      body: '{}',
      next: { revalidate: 300, tags: ['programme'] },
    });
    if (!res.ok) return FALLBACK;
    const p = (await res.json()) as Programme;
    if (!p || !Array.isArray(p.tiers) || !p.tiers.length) return FALLBACK;
    return { ...p, rewards: p.rewards ?? [], brands: p.brands?.length ? p.brands : FALLBACK.brands };
  } catch {
    return FALLBACK;
  }
}

export const gbp = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
export const num = (n: number) => new Intl.NumberFormat('en-GB').format(n);
/** What a number of points is worth in pounds. */
export const pointsValue = (points: number, p: Programme) => points / p.redeem_points_per_gbp;
