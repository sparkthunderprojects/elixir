import Link from 'next/link';
import PageShell from '@/components/page-shell';
import BrandTile from '@/components/brand-tile';
import JsonLd from '@/components/json-ld';
import { pageMetadata } from '@/lib/seo';
import { BRAND_LOOKS, sortBrands } from '@/lib/brands';
import { getProgramme } from '@/lib/programme';
import { SITE_URL } from '@/lib/site';

export const revalidate = 300;
export const metadata = pageMetadata('Brands that earn Elixir Points', 'Earn and spend Elixir Points across Sparkthunder brands: Sparkthunder Shop, Knightverge, Roll Combat and Miss Petty. See every brand that takes part.', '/brands');

export default async function Brands() {
  const p = await getProgramme();
  const brands = sortBrands(p.brands);
  return (
    <PageShell title="Brands that earn Elixir Points" intro="Shop at any of these and your points go into one shared balance." path="/brands">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList', name: 'Brands that earn Elixir Points',
        itemListElement: brands.map((b, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Brand', name: b.name, ...(BRAND_LOOKS[b.slug]?.href ? { url: BRAND_LOOKS[b.slug].href } : {}) } })),
      }} />
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {brands.map((b) => {
          const look = BRAND_LOOKS[b.slug];
          return (
            <li key={b.slug} className="flex flex-col rounded-3xl bg-white p-4">
              <BrandTile slug={b.slug} name={b.name} className="h-44" />
              <div className="flex flex-1 flex-col p-3 pt-5">
                <h2 className="text-xl font-extrabold text-deep">{b.name}</h2>
                <p className="mt-1 text-sm text-body">{look?.tagline ?? (b.brand_type === 'partner' ? 'Partner brand' : 'Sparkthunder brand')}</p>
                {look?.href && <a href={look.href} className="mt-4 text-sm font-bold text-elixir underline underline-offset-4" rel="noopener">Visit {b.name}</a>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-body">More brands are joining over time, so your points will go even further.</p>
      <p className="mt-6"><Link href="/signup" className="inline-flex rounded-xl bg-elixir px-6 py-3.5 text-sm font-bold text-white hover:bg-elixir-dark">Join free</Link></p>
    </PageShell>
  );
}
