import Link from 'next/link';
import { safeHref } from '@/lib/safe-href';
import PageShell from '@/components/page-shell';
import BrandTile from '@/components/brand-tile';
import JsonLd from '@/components/json-ld';
import { ButtonLink } from '@/components/ui';
import { brandLooks } from '@/lib/brands';
import { num, type Programme } from '@/lib/programme';
import { SITE_URL, brandPath } from '@/lib/site';
import type { Content } from '@/lib/cms/resolve';

/** One brand's own page: what it is, how points work there, and the rewards that apply. */
export default function BrandDetailView({ slug, p, c, site }: { slug: string; p: Programme; c: Content; site: Content }) {
  const brand = p.brands.find((b) => b.slug === slug)!;
  const look = brandLooks(site)[slug];
  const rate = brand.earn_points_per_gbp ?? p.earn_points_per_gbp;
  const v = { brand: brand.name, brand_earn: `${num(rate)} Elixir Point${rate === 1 ? '' : 's'}` };
  const mine = p.rewards.filter((r) => r.brand === brand.name);
  const shared = p.rewards.filter((r) => !r.brand);
  const rewards = [...mine, ...shared].slice(0, 6);
  const href = look?.href ? safeHref(look.href) : undefined;
  return (
    <PageShell title={brand.name} intro={look?.tagline || (brand.brand_type === 'partner' ? 'Partner brand' : 'Sparkthunder brand')} path={brandPath(slug)}>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Brand', name: brand.name, description: look?.about || look?.tagline,
        url: href || `${SITE_URL}${brandPath(slug)}`,
        ...(look?.logo?.src ? { logo: look.logo.src.startsWith('http') ? look.logo.src : SITE_URL + look.logo.src } : {}),
      }} />
      <p className="mb-6"><Link href="/brands" className="text-sm font-bold text-elixir underline underline-offset-4">&larr; {c.t('detail.back')}</Link></p>
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card-depth rounded-3xl p-4">
          <BrandTile look={look} name={brand.name} className="h-64" />
          <div className="p-3 pt-5">
            <p className="text-body">{look?.about || look?.tagline}</p>
            {href && <a href={href} className="mt-4 inline-flex text-sm font-bold text-elixir underline underline-offset-4" rel="noopener">{c.t('cards.visit', v)}</a>}
          </div>
        </div>
        <div className="space-y-6">
          <section className="card-depth rounded-3xl p-6">
            <h2 className="text-xl font-extrabold text-deep">{c.t('detail.earn_title', v)}</h2>
            <p className="mt-2 text-body">{c.t('detail.earn_text', v)}</p>
          </section>
          <section className="card-depth rounded-3xl p-6">
            <h2 className="text-xl font-extrabold text-deep">{c.t('detail.spend_title', v)}</h2>
            <p className="mt-2 text-body">{c.t('detail.spend_text', v)}</p>
          </section>
          <section className="card-depth rounded-3xl p-6">
            <h2 className="text-xl font-extrabold text-deep">{c.t('detail.rewards_title', v)}</h2>
            {rewards.length ? (
              <ul className="mt-3 divide-y divide-black/5">
                {rewards.map((r) => (
                  <li key={r.title} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-bold text-deep">{r.title}</p>
                      <p className="text-sm text-body">{r.description || (r.brand ? r.brand : c.t('detail.rewards_all'))}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-elixir/10 px-3 py-1 text-sm font-bold text-elixir">{num(r.point_cost)} pts</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-body">{c.t('detail.rewards_empty')}</p>}
            <p className="mt-4"><Link href="/rewards" className="text-sm font-bold text-elixir underline underline-offset-4">{c.t('detail.rewards_link')}</Link></p>
          </section>
          <ButtonLink href="/signup">{c.t('detail.join')}</ButtonLink>
        </div>
      </div>
    </PageShell>
  );
}
