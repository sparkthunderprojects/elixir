export const SITE_URL = (process.env.NEXT_PUBLIC_ELIXIR_SITE_URL || 'https://elixirpoints.com').replace(/\/$/, '');
export const SITE_NAME = 'Elixir Points';
export const SITE_TAGLINE = 'One rewards balance across every Sparkthunder brand';
export const SITE_DESCRIPTION =
  'Earn Elixir Points every time you shop across Sparkthunder brands and spend them anywhere in the family. Free to join, with tiers that reward you for coming back.';

export const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/tiers', label: 'Tiers' },
  { href: '/rewards', label: 'Rewards' },
  { href: '/brands', label: 'Brands' },
  { href: '/faq', label: 'FAQ' },
];

/** Pages that appear in the sitemap. */
export const PUBLIC_PATHS = ['/', '/how-it-works', '/tiers', '/rewards', '/brands', '/faq', '/business', '/business/loyalty', '/business/insights', '/business/media', '/business/about', '/business/contact', '/support'];

/** Address of a brand's own page. */
export const brandPath = (slug: string) => `/brands/${slug}`;
