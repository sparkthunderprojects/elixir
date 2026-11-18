import Link from 'next/link';
import PageShell from '@/components/page-shell';
import BrandTile from '@/components/brand-tile';
import JsonLd from '@/components/json-ld';
import { brandLooks, sortBrands } from '@/lib/brands';
import type { ViewProps } from '@/components/views/home';

export default function BrandsView({ p, c, site }: ViewProps) {
  const looks = brandLooks(site);
  const brands = sortBrands(p.brands);
  return (
    <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path="/brands">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList', name: c.t('intro.title'),
        itemListElement: brands.map((b, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Brand', name: b.name, ...(looks[b.slug]?.href ? { url: looks[b.slug].href } : {}) } })),
      }} />
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {brands.map((b) => {
          const look = looks[b.slug];
          return (
            <li key={b.slug} className="flex flex-col rounded-3xl bg-white p-4">
              <BrandTile look={look} name={b.name} className="h-44" />
              <div className="flex flex-1 flex-col p-3 pt-5">
                <h2 className="text-xl font-extrabold text-deep">{b.name}</h2>
                <p className="mt-1 text-sm text-body">{look?.tagline || (b.brand_type === 'partner' ? c.t('cards.partner') : c.t('cards.owned'))}</p>
                {look?.href && <a href={look.href} className="mt-4 text-sm font-bold text-elixir underline underline-offset-4" rel="noopener">{c.t('cards.visit', { brand: b.name })}</a>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-body">{c.t('cards.footnote')}</p>
      <p className="mt-6"><Link href="/signup" className="inline-flex rounded-xl bg-elixir px-6 py-3.5 text-sm font-bold text-white hover:bg-elixir-dark">{c.t('cards.button')}</Link></p>
    </PageShell>
  );
}
