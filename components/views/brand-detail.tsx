import Link from 'next/link';
import { safeHref } from '@/lib/safe-href';
import Image from 'next/image';
import BrandTile from '@/components/brand-tile';
import JsonLd from '@/components/json-ld';
import { ButtonLink } from '@/components/ui';
import { Droplet } from '@/components/art';
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
    <div className="mx-auto max-w-none px-4 pt-6 sm:px-6">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [{ name: 'Home', url: SITE_URL + '/' }, { name: 'Brands', url: SITE_URL + '/brands' }, { name: brand.name, url: SITE_URL + brandPath(slug) }]
          .map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.url })),
      }} />
      {/* Hero banner: the brand's own picture, or its tile colour, with the logo, headline and buttons */}
      <section className="relative isolate overflow-hidden rounded-3xl text-white" style={{ background: `linear-gradient(135deg, ${look?.tile ?? '#2a1218'}, #1a0a0f)` }}>
        {look?.banner && <Image src={look.banner.src} alt={look.banner.alt || `${brand.name} banner`} fill priority sizes="100vw" className="-z-10 object-cover" />}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <Droplet className="float-slow drop-glow pointer-events-none absolute -right-4 top-6 h-32 w-24 text-elixir" />
        <div className="relative flex min-h-[22rem] flex-col justify-end gap-5 px-6 py-10 sm:px-12 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-white/70">
            <ol className="flex gap-2">
              <li><Link href="/" className="hover:text-white">Home</Link></li><li aria-hidden="true">/</li>
              <li><Link href="/brands" className="hover:text-white">Brands</Link></li><li aria-hidden="true">/</li>
              <li aria-current="page" className="text-white">{brand.name}</li>
            </ol>
          </nav>
          {look?.logo && <BrandTile look={look} name={brand.name} className="h-20 w-56 sm:h-24 sm:w-64" />}
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight !text-white sm:text-5xl">{look?.headline || brand.name}</h1>
          <p className="max-w-xl text-lg text-white/85">{look?.tagline || (brand.brand_type === 'partner' ? 'Partner brand' : 'Sparkthunder brand')}</p>
          <div className="flex flex-wrap gap-3">
              {href && <a href={href} rel="noopener" className="glass inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10">{c.t('cards.visit', v)}</a>}
          </div>
        </div>
      </section>
      <div className="py-10">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Brand', name: brand.name, description: look?.about || look?.tagline,
        url: href || `${SITE_URL}${brandPath(slug)}`,
        ...(look?.logo?.src ? { logo: look.logo.src.startsWith('http') ? look.logo.src : SITE_URL + look.logo.src } : {}),
      }} />
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card-depth h-fit rounded-3xl p-6">
          <h2 className="text-xl font-extrabold text-deep">{brand.name}</h2>
          <p className="mt-2 text-body">{look?.about || look?.tagline}</p>
          <p className="mt-4"><Link href="/brands" className="text-sm font-bold text-elixir underline underline-offset-4">&larr; {c.t('detail.back')}</Link></p>
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
        </div>
      </div>
      </div>
    </div>
  );
}
