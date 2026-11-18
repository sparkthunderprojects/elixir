import Link from 'next/link';
import JsonLd from '@/components/json-ld';
import { Droplet, PhoneMock, PointChips, TierSteps, Tickets } from '@/components/art';
import { ButtonLink, SectionTitle, SplitCard } from '@/components/ui';
import BrandTile from '@/components/brand-tile';
import { brandLooks, sortBrands } from '@/lib/brands';
import type { Content } from '@/lib/cms/resolve';
import { gbp, num, pointsValue, type Programme } from '@/lib/programme';
import { SITE_URL } from '@/lib/site';

export interface ViewProps { p: Programme; c: Content; site: Content }

export default function HomeView({ p, c, site }: ViewProps) {
  const looks = brandLooks(site);
  const faqs = c.list<{ q: string; a: string }>('faq.items');
  const rewardsLine = c.t('hero.rewards_line');
  return (
    <div className="mx-auto max-w-none space-y-5 px-4 pt-6 sm:px-6">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: SITE_URL, name: c.t('seo.title'), description: c.t('seo.description'), isPartOf: { '@id': `${SITE_URL}/#website` } }} />

      {/* Hero */}
      <section className="hero-deep relative overflow-hidden rounded-3xl">
        <span aria-hidden="true" className="glow-ring pulse-glow -right-10 top-0 h-80 w-80 bg-elixir/50" />
        <Droplet className="float-slow drop-glow pointer-events-none absolute -left-4 bottom-8 h-24 w-20 text-elixir" />
        <Droplet className="float-slower drop-glow pointer-events-none absolute right-[42%] top-8 h-14 w-11 text-elixir-light" />
        <Droplet className="float-slow drop-glow pointer-events-none absolute right-6 top-16 h-28 w-20 text-elixir" />
        <div className="relative grid items-center gap-10 px-6 py-14 sm:px-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-elixir-light">{c.t('hero.eyebrow')}</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] !text-white sm:text-5xl lg:text-6xl">{c.t('hero.title')}</h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">
              {c.t('hero.text')}
              {p.rewards[0] && rewardsLine && <> {rewardsLine}</>}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup">{c.t('hero.primary')}</ButtonLink>
              <ButtonLink href="/how-it-works" variant="outline">{c.t('hero.secondary')}</ButtonLink>
            </div>
          </div>
          <PhoneMock p={p} note={c.t('hero.phone_note')} />
        </div>
      </section>

      {/* Brands */}
      <section aria-labelledby="brands" className="relative overflow-hidden rounded-3xl bg-[radial-gradient(60%_120%_at_85%_0%,#ee6674,transparent_60%),linear-gradient(135deg,#d03a4c,#bd3141_50%,#8a1d2c)] px-6 py-10 shadow-[0_30px_50px_-28px_rgba(138,29,44,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] sm:px-12">
        <Droplet className="pointer-events-none absolute -right-6 -top-6 h-44 w-36 -rotate-12 text-elixir-light opacity-25" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="brands" className="text-3xl font-extrabold !text-white sm:text-4xl">{c.t('brands.title')}</h2>
          <Link href="/brands" className="text-sm font-bold text-white underline underline-offset-4">{c.t('brands.link')}</Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {sortBrands(p.brands).slice(0, 9).map((b) => (
            <li key={b.slug} className="lift rounded-2xl shadow-[0_14px_24px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/25"><BrandTile look={looks[b.slug]} name={b.name} className="h-36" /></li>
          ))}
          <li className="flex h-36 items-center justify-center glass rounded-2xl border-2 border-dashed border-white/50 p-3 text-center text-sm font-bold text-white">{c.t('brands.more')}</li>
        </ul>
      </section>

      {/* Earn */}
      <section aria-labelledby="earn" className="space-y-5 pt-10">
        <SectionTitle id="earn">{c.t('earn.title')}</SectionTitle>
        <SplitCard title={c.t('earn.a_title')} text={c.t('earn.a_text')} color="#ff876f">
          <PointChips rate={p.earn_points_per_gbp} />
        </SplitCard>
        <SplitCard flip title={c.t('earn.b_title')} text={c.t('earn.b_text')} color="#ffd22e">
          <TierSteps p={p} />
        </SplitCard>
        <SplitCard title={c.t('earn.c_title')} text={c.t('earn.c_text')} color="#12c791">
          <div className="p-8 text-center" aria-hidden="true">
            <span className="inline-block rounded-2xl bg-gradient-to-b from-white to-[#f4efe9] px-6 py-4 text-sm font-bold text-deep shadow-[0_14px_26px_-10px_rgba(0,60,40,0.6),inset_0_1px_0_#fff]">you@email.com</span>
            <p className="mt-3 text-4xl font-extrabold text-white">+120 pts</p>
          </div>
        </SplitCard>
      </section>

      {/* Tiers */}
      <section aria-labelledby="tiers" className="space-y-8 pt-10">
        <SectionTitle id="tiers">{c.t('tiers.title')}</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.tiers.map((t) => (
            <li key={t.id} className="card-depth lift relative overflow-hidden rounded-3xl p-6">
              <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-2xl" style={{ background: t.color }} />
              <span className="relative inline-block h-3 w-12 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_8px_-2px_rgba(0,0,0,0.3)]" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${t.color} 70%, white), ${t.color})` }} />
              <p className="mt-4 text-xl font-extrabold text-deep">{t.name}</p>
              <p className="mt-1 text-sm text-body">{t.min_spend_gbp === 0 ? c.t('tiers.start') : `From ${gbp(t.min_spend_gbp)} spent`}</p>
              <p className="mt-5 text-3xl font-extrabold text-elixir">{t.earn_multiplier}x</p>
              <p className="text-xs text-body">{c.t('tiers.suffix')}</p>
            </li>
          ))}
        </ul>
        <p className="text-center"><Link href="/tiers" className="text-sm font-bold text-elixir underline underline-offset-4">{c.t('tiers.link')}</Link></p>
      </section>

      {/* Spend */}
      <section aria-labelledby="spend" className="relative overflow-hidden rounded-3xl bg-[radial-gradient(50%_90%_at_90%_10%,rgba(224,82,95,0.4),transparent_65%),linear-gradient(150deg,#14233f,#1d3557_60%,#274a78)] shadow-[0_30px_50px_-28px_rgba(15,26,48,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="grid items-center gap-8 px-6 py-12 sm:px-12 md:grid-cols-2">
          <div>
            <h2 id="spend" className="text-3xl font-extrabold !text-white sm:text-4xl">{c.t('spend.title')}</h2>
            <p className="mt-4 max-w-md text-white/80">{c.t('spend.text')}</p>
            <div className="mt-7"><ButtonLink href="/rewards" variant="light">{c.t('spend.button')}</ButtonLink></div>
          </div>
          <div className="glass rounded-3xl py-6"><Tickets p={p} /></div>
        </div>
        {p.rewards[0] && <p className="sr-only">{p.rewards[0].title} costs {num(p.rewards[0].point_cost)} points, worth {gbp(pointsValue(p.rewards[0].point_cost, p))}.</p>}
      </section>

      {/* Details accordion */}
      <section aria-labelledby="details" className="rounded-3xl bg-[radial-gradient(60%_80%_at_15%_0%,#fff0a8,transparent_60%),linear-gradient(160deg,#ffdb4d,#ffc400)] px-6 py-12 shadow-[0_30px_50px_-28px_rgba(180,130,0,0.7),inset_0_1px_0_rgba(255,255,255,0.6)] sm:px-12">
        <h2 id="details" className="text-center text-3xl font-extrabold !text-deep sm:text-4xl">{c.t('faq.title')}</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {faqs.map((f, i) => (
            <details key={`${i}-${f.q}`} open={i === 0} className="group rounded-2xl bg-white/60 px-5 py-4 shadow-[0_8px_16px_-10px_rgba(120,80,0,0.5)] ring-1 ring-white/50 open:bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-bold text-deep">
                {f.q}
                <span className="text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-body">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center"><Link href="/faq" className="text-sm font-bold text-deep underline underline-offset-4">{c.t('faq.link')}</Link></p>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="join" className="hero-deep relative overflow-hidden rounded-3xl px-6 py-16 text-center">
        <Droplet className="float-slow drop-glow pointer-events-none mx-auto h-16 w-12 text-elixir" />
        <h2 id="join" className="relative mt-5 text-3xl font-extrabold !text-white sm:text-4xl">{c.t('cta.title')}</h2>
        <div className="relative mt-7"><ButtonLink href="/signup">{c.t('cta.button')}</ButtonLink></div>
      </section>
      <div className="h-6" />
    </div>
  );
}
