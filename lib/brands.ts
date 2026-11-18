/**
 * Presentation details for the brands on the site, keyed by the brand's slug in the
 * Elixir database. The database decides WHICH brands are active; this decides how they look.
 * A brand with no entry here still appears, as a plain text tile.
 */
export interface BrandLook {
  tagline: string;
  logo?: { src: string; width: number; height: number };
  /** Background behind the logo, chosen so each logo reads clearly. */
  tile: string;
  /** Public website, only where it is known. */
  href?: string;
}

export const BRAND_LOOKS: Record<string, BrandLook> = {
  'sparkthunder-shop': { tagline: 'The official Sparkthunder store', tile: '#ffffff', href: 'https://sparkthunder.shop' },
  knightverge: { tagline: 'Comics, characters and the Knightverge universe', logo: { src: '/brands/knightverge.png', width: 560, height: 125 }, tile: '#17130b', href: 'https://knightverge.com' },
  'roll-combat': { tagline: 'Tabletop RPG games', logo: { src: '/brands/roll-combat.png', width: 560, height: 444 }, tile: '#ffffff' },
  'miss-petty': { tagline: 'Beauty and makeup', logo: { src: '/brands/miss-petty.png', width: 560, height: 247 }, tile: '#ffffff' },
};

const ORDER = ['sparkthunder-shop', 'knightverge', 'roll-combat', 'miss-petty'];

/** Known brands first in a fixed order, then any others (such as future partners) by name. */
export function sortBrands<T extends { slug: string; name: string }>(brands: T[]): T[] {
  const rank = (s: string) => (ORDER.includes(s) ? ORDER.indexOf(s) : ORDER.length);
  return [...brands].sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name));
}
