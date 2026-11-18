import { PAGE_BY_SLUG, defaultsOf, type ImageValue } from '@/lib/cms/schema';
import { gbp, num, type Programme } from '@/lib/programme';

export type Vars = Record<string, string>;

/** Live values that can be written into any text as {earn}, {redeem} and so on. */
export function buildVars(p: Programme): Vars {
  const top = p.tiers[p.tiers.length - 1];
  const n = p.earn_points_per_gbp;
  return {
    earn: String(n),
    earn_label: `${n} point${n === 1 ? '' : 's'}`,
    earn_elixir: `${n} Elixir Point${n === 1 ? '' : 's'}`,
    redeem: num(p.redeem_points_per_gbp),
    gbp1: gbp(1),
    window: String(p.tier_window_months),
    top_tier: top?.name ?? '',
    top_multiplier: String(top?.earn_multiplier ?? ''),
    first_cost: p.rewards[0] ? num(p.rewards[0].point_cost) : '',
    brands: p.brands.map((b) => b.name).join(', '),
  };
}

/** Replaces {token} with its live value. Unknown names are left as written. */
export function fill(s: string, vars: Vars, extra?: Vars): string {
  const all = extra ? { ...vars, ...extra } : vars;
  return s.replace(/\{([a-z0-9_]+)\}/gi, (m, k: string) => (k in all ? all[k] : m));
}

function fillDeep(v: unknown, vars: Vars): unknown {
  if (typeof v === 'string') return fill(v, vars);
  if (Array.isArray(v)) return v.map((x) => fillDeep(x, vars));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, fillDeep(x, vars)]));
  return v;
}

export interface Content {
  /** Text for a field, as 'group.field'. Extra values fill in things like {amount}. */
  t: (key: string, extra?: Vars) => string;
  img: (key: string) => ImageValue;
  list: <T = Record<string, string>>(key: string) => T[];
}

/** Reads a page's content: what was saved, otherwise the launch wording. Live values are filled in. */
export function makeContent(slug: string, stored: Record<string, unknown> | null | undefined, vars: Vars): Content {
  const def = PAGE_BY_SLUG[slug];
  const defaults = def ? defaultsOf(def) : {};
  const get = (key: string): unknown => (stored && key in stored && stored[key] != null ? stored[key] : defaults[key]);
  return {
    t: (key, extra) => { const v = get(key); return typeof v === 'string' ? fill(v, vars, extra) : ''; },
    img: (key) => { const v = get(key); return (v && typeof v === 'object' ? fillDeep(v, vars) : { src: '', alt: '', width: 0, height: 0 }) as ImageValue; },
    list: <T,>(key: string) => { const v = get(key); return (Array.isArray(v) ? fillDeep(v, vars) : []) as T[]; },
  };
}
