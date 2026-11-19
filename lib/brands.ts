import type { Content } from '@/lib/cms/resolve';
import type { ImageValue } from '@/lib/cms/schema';

/**
 * How each brand looks on the site, keyed by the brand's slug in the Elixir database.
 * The dashboard decides WHICH brands are active; the CMS (Site-wide > Brand logos) decides how they look.
 * A brand with no entry still appears, as a plain text tile.
 */
export interface BrandLook {
  tagline: string;
  logo?: ImageValue;
  /** Background behind the logo, chosen so each logo reads clearly. */
  tile: string;
  /** Public website, only where it is known. */
  href?: string;
  /** A short paragraph for the brand's own page. */
  about?: string;
}

export type BrandLooks = Record<string, BrandLook>;

export function brandLooks(site: Content): BrandLooks {
  const out: BrandLooks = {};
  for (const b of site.list<{ slug: string; tagline: string; logo: ImageValue; tile: string; href: string; about: string }>('brands.items')) {
    if (!b.slug) continue;
    out[b.slug] = { tagline: b.tagline, logo: b.logo?.src ? b.logo : undefined, tile: b.tile || '#ffffff', href: b.href || undefined, about: b.about || undefined };
  }
  return out;
}

const ORDER = ['sparkthunder-shop', 'knightverge', 'roll-combat', 'miss-petty'];

/** Known brands first in a fixed order, then any others (such as future partners) by name. */
export function sortBrands<T extends { slug: string; name: string }>(brands: T[]): T[] {
  const rank = (s: string) => (ORDER.includes(s) ? ORDER.indexOf(s) : ORDER.length);
  return [...brands].sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name));
}
