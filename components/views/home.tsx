import Link from 'next/link';
import type { ReactNode } from 'react';
import JsonLd from '@/components/json-ld';
import { ButtonLink, SectionTitle } from '@/components/ui';
import BrandTile from '@/components/brand-tile';
import StoreBadges from '@/components/store-badges';
import { AppPhone, RewardsScreen, TierScreen, WalletScreen } from '@/components/app-screens';
import { brandLooks, sortBrands } from '@/lib/brands';
import type { Content } from '@/lib/cms/resolve';
import type { Programme } from '@/lib/programme';
import { SITE_URL } from '@/lib/site';

export interface ViewProps { p: Programme; c: Content; site: Content }

/** One calm row: a few words on one side, a colour block with the app on the other. */
function AppTile({ title, text, color, flip, children }: { title: string; text: string; color: string; flip?: boolean; children: ReactNode }) {
  return (
    <article className="grid overflow-hidden rounded-3xl bg-white shadow-[0_20px_40px_-28px_rgba(15,26,48,0.45)] ring-1 ring-black/5 md:grid-cols-2">
      <div className={`flex flex-col justify-center px-8 py-12 sm:px-14 ${flip ? 'md:order-2' : ''}`}>
        <h3 className="max-w-sm text-3xl font-extrabold leading-tight text-deep">{title}</h3>
        <p className="mt-4 max-w-sm text-lg text-body">{text}</p>
      </div>
      <div className="relative h-[24rem] overflow-hidden" style={{ background: color }}>
        <div className="absolute left-1/2 top-12 -translate-x-1/2">{children}</div>
      </div>
    </article>
  );
}

export default function HomeView({ p, c, site }: ViewProps) {
  const looks = brandLooks(site);
  return (
    <>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: SITE_URL, name: c.t('seo.title'), description: c.t('seo.description'), isPartOf: { '@id': `${SITE_URL}/#website` } }} />
    <div className="mx-auto max-w-[1200px] space-y-24 px-4 pb-16 pt-6 sm:px-6">

      {/* Hero */}
      <section className="hero-deep relative overflow-hidden rounded-3xl">
        <div className="relative grid items-center gap-10 px-8 py-16 sm:px-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm font-semibold text-elixir-light">{c.t('hero.eyebrow')}</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] !text-white sm:text-5xl lg:text-6xl">{c.t('hero.title')}</h1>
            <p className="mt-5 max-w-md text-lg text-white/80">{c.t('hero.text')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup">{c.t('hero.primary')}</ButtonLink>
              <ButtonLink href="/how-it-works" variant="outline">{c.t('hero.secondary')}</ButtonLink>
            </div>
            <StoreBadges className="mt-6" />
          </div>
          <div className="relative hidden h-[27rem] overflow-hidden md:block">
            <AppPhone className="absolute left-1/2 top-4 -translate-x-1/2"><WalletScreen p={p} /></AppPhone>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section aria-labelledby="brands" className="rounded-3xl bg-elixir px-8 py-12 sm:px-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="brands" className="text-3xl font-extrabold !text-white">{c.t('brands.title')}</h2>
          <Link href="/brands" className="text-sm font-bold text-white underline underline-offset-4">{c.t('brands.link')}</Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {sortBrands(p.brands).slice(0, 4).map((b) => (
            <li key={b.slug} className="lift overflow-hidden rounded-2xl"><Link href={`/brands/${b.slug}`} aria-label={b.name}><BrandTile look={looks[b.slug]} name={b.name} className="h-32" /></Link></li>
          ))}
        </ul>
      </section>

      {/* How it works, three calm rows */}
      <section aria-labelledby="earn" className="space-y-6">
        <SectionTitle id="earn">{c.t('earn.title')}</SectionTitle>
        <div className="space-y-6 pt-6">
          <AppTile title={c.t('earn.a_title')} text={c.t('earn.a_text')} color="#ff876f"><AppPhone><WalletScreen p={p} /></AppPhone></AppTile>
          <AppTile flip title={c.t('earn.b_title')} text={c.t('earn.b_text')} color="#ffd22e"><AppPhone><TierScreen p={p} /></AppPhone></AppTile>
          <AppTile title={c.t('spend.title')} text={c.t('spend.text')} color="#2fd9a8"><AppPhone><RewardsScreen p={p} /></AppPhone></AppTile>
        </div>
      </section>

      {/* Join */}
      <section aria-labelledby="join" className="hero-deep rounded-3xl px-8 py-16 text-center sm:px-14">
        <h2 id="join" className="text-3xl font-extrabold !text-white sm:text-4xl">{c.t('cta.title')}</h2>
        <div className="mt-8 flex flex-col items-center gap-5">
          <ButtonLink href="/signup">{c.t('cta.button')}</ButtonLink>
          <StoreBadges className="justify-center" />
        </div>
      </section>
    </div>
    </>
  );
}
