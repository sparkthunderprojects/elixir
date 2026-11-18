import Link from 'next/link';
import PageShell from '@/components/page-shell';
import BrandTile from '@/components/brand-tile';
import { ButtonLink, SectionTitle } from '@/components/ui';
import { brandLooks, sortBrands } from '@/lib/brands';
import type { ViewProps } from '@/components/views/home';

/** An illustrative partner dashboard: shapes only, deliberately no figures. */
function DashboardPicture({ title, note }: { title: string; note: string }) {
  const bars = [38, 55, 44, 70, 62, 84, 76];
  return (
    <div className="glass w-full max-w-sm rounded-3xl p-5 text-white" role="img" aria-label={`${title}. ${note}`}>
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-4 flex h-28 items-end gap-2" aria-hidden="true">
        {bars.map((h, i) => <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#b02a3c] to-[#ff8a96]" style={{ height: `${h}%` }} />)}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => <span key={i} className="h-8 rounded-lg bg-white/15" />)}
      </div>
      <p className="mt-3 text-[11px] text-white/70">{note}</p>
    </div>
  );
}

export default function BusinessView({ p, c, site }: ViewProps) {
  const cards = c.list<{ href: string; status: string; title: string; text: string }>('offer.items');
  const why = c.list<{ title: string; text: string }>('why.items');
  const steps = c.list<{ title: string; text: string }>('steps.items');
  const looks = brandLooks(site);
  const brands = sortBrands(p.brands);
  return (
    <div className="mx-auto max-w-none px-4 pt-6 sm:px-6">
      <div className="hero-deep relative overflow-hidden rounded-3xl px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/70">{c.t('hero.eyebrow')}</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-extrabold !text-white sm:text-6xl">{c.t('hero.title')}</h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">{c.t('hero.text')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/business/contact">{c.t('hero.primary')}</ButtonLink>
              <ButtonLink href="#offer" variant="outline">{c.t('hero.secondary')}</ButtonLink>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end"><DashboardPicture title={c.t('hero.dash_title')} note={c.t('hero.dash_note')} /></div>
        </div>
      </div>

      <section className="py-16" aria-labelledby="offer">
        <SectionTitle id="offer">{c.t('offer.title')}</SectionTitle>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card, i) => {
            const live = card.status.toLowerCase().includes('now');
            return (
              <li key={`${i}-${card.title}`} className="card-depth lift flex flex-col rounded-3xl p-6 sm:p-8">
                <span className={`self-start rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${live ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{card.status}</span>
                <h3 className="mt-4 text-2xl font-extrabold text-deep">{card.title}</h3>
                <p className="mt-2 flex-1 text-body">{card.text}</p>
                <Link href={card.href} className="mt-5 text-sm font-bold text-elixir underline underline-offset-4">{c.t('offer.more')}</Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="pb-16">
        <SectionTitle>{c.t('why.title')}</SectionTitle>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {why.map((w, i) => (
            <li key={`${i}-${w.title}`} className="card-depth rounded-3xl p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-deep">{w.title}</h3>
              <p className="mt-2 text-body">{w.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pb-16">
        <SectionTitle>{c.t('steps.title')}</SectionTitle>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={`${i}-${s.title}`} className="card-depth rounded-3xl p-6 sm:p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#e85a68] to-[#b02a3c] text-sm font-extrabold text-white shadow-md">{i + 1}</span>
              <h3 className="mt-4 text-lg font-extrabold text-deep">{s.title}</h3>
              <p className="mt-2 text-body">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {brands.length > 0 && (
        <section className="pb-16">
          <SectionTitle>{c.t('family.title')}</SectionTitle>
          <p className="mt-3 text-center text-body">{c.t('family.text')}</p>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {brands.map((b) => <li key={b.slug}><BrandTile look={looks[b.slug]} name={b.name} className="h-28" /></li>)}
          </ul>
        </section>
      )}

      <div className="hero-deep mb-8 flex flex-col items-center gap-5 rounded-3xl px-6 py-14 text-center text-white">
        <h2 className="text-3xl font-extrabold !text-white sm:text-4xl">{c.t('cta.title')}</h2>
        <p className="max-w-lg text-white/80">{c.t('cta.text')}</p>
        <ButtonLink href="/business/contact">{c.t('cta.button')}</ButtonLink>
      </div>
    </div>
  );
}
