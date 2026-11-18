import Link from 'next/link';
import JsonLd from '@/components/json-ld';
import PageShell from '@/components/page-shell';
import { ButtonLink, SectionTitle } from '@/components/ui';
import { SITE_URL } from '@/lib/site';
import type { ViewProps } from '@/components/views/home';

function pillar(path: string, interest: string) {
  return function PillarView({ c }: ViewProps) {
    const benefits = c.list<{ title: string; text: string }>('benefits.items');
    const steps = c.list<{ title: string; text: string }>('steps.items');
    const live = c.t('status.label').toLowerCase().includes('now');
    return (
      <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path={path}>
        <JsonLd data={{
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Elixir 360', item: SITE_URL + '/business' },
            { '@type': 'ListItem', position: 2, name: c.t('intro.title'), item: SITE_URL + path },
          ],
        }} />
        <p className="mb-8">
          <span className={`inline-flex rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider ${live ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{c.t('status.label')}</span>
        </p>
        <SectionTitle>{c.t('benefits.title')}</SectionTitle>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {benefits.map((b, i) => (
            <li key={`${i}-${b.title}`} className="card-depth lift rounded-3xl p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-deep">{b.title}</h3>
              <p className="mt-2 text-body">{b.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-16"><SectionTitle>{c.t('steps.title')}</SectionTitle></div>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={`${i}-${s.title}`} className="card-depth rounded-3xl p-6 sm:p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#e85a68] to-[#b02a3c] text-sm font-extrabold text-white shadow-md">{i + 1}</span>
              <h3 className="mt-4 text-lg font-extrabold text-deep">{s.title}</h3>
              <p className="mt-2 text-body">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-12 max-w-2xl text-center text-body">{c.t('note.text')}</p>
        <div className="hero-deep mt-12 flex flex-col items-center gap-5 rounded-3xl px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold !text-white">{c.t('cta.title')}</h2>
          <ButtonLink href={`/business/contact?interest=${interest}`}>{c.t('cta.button')}</ButtonLink>
          <Link href="/business" className="text-sm font-semibold text-white/80 underline underline-offset-4 hover:text-white">{c.t('cta.back')}</Link>
        </div>
      </PageShell>
    );
  };
}

export const LoyaltyView = pillar('/business/loyalty', 'loyalty');
export const InsightsView = pillar('/business/insights', 'insights');
export const MediaView = pillar('/business/media', 'media');
