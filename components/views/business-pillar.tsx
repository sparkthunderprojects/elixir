import Link from 'next/link';
import JsonLd from '@/components/json-ld';
import { ButtonLink } from '@/components/ui';
import { BizPage, BizPageHead } from '@/components/biz/parts';
import { SITE_URL } from '@/lib/site';
import type { ViewProps } from '@/components/views/home';

function pillar(path: string, interest: string) {
  return function PillarView({ c }: ViewProps) {
    const benefits = c.list<{ title: string; text: string }>('benefits.items');
    const steps = c.list<{ title: string; text: string }>('steps.items');
    return (
      <BizPage>
        <JsonLd data={{
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Elixir 360', item: SITE_URL + '/business' },
            { '@type': 'ListItem', position: 2, name: c.t('intro.title'), item: SITE_URL + path },
          ],
        }} />
        <BizPageHead tag={c.t('status.label')} title={c.t('intro.title')} intro={c.t('intro.text')} />

        <section className="mx-auto max-w-[1200px] px-6 pb-24">
          <h2 className="text-3xl font-black text-elixir-light">{c.t('benefits.title')}</h2>
          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {benefits.map((b, i) => (
              <li key={`${i}-${b.title}`} className="grid gap-2 py-7 md:grid-cols-[1fr_1.6fr] md:gap-10">
                <h3 className="text-xl font-extrabold text-white">{b.title}</h3>
                <p className="text-lg font-light text-white/65">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[#75002a]">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <h2 className="text-3xl font-black text-white/90">{c.t('steps.title')}</h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={`${i}-${s.title}`}>
                  <p className="text-5xl font-black text-black/40">{i + 1}</p>
                  <h3 className="mt-3 text-xl font-extrabold text-white">{s.title}</h3>
                  <p className="mt-2 text-lg font-light text-white/75">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-6 py-20">
          <h2 className="text-4xl font-black text-white">{c.t('cta.title')}</h2>
          <div className="flex flex-wrap items-center gap-6">
            <ButtonLink href={`/business/contact?interest=${interest}`}>{c.t('cta.button')}</ButtonLink>
            <Link href="/business" className="text-sm font-semibold text-white/70 underline underline-offset-4 hover:text-white">{c.t('cta.back')}</Link>
          </div>
        </section>
      </BizPage>
    );
  };
}

export const LoyaltyView = pillar('/business/loyalty', 'loyalty');
export const InsightsView = pillar('/business/insights', 'insights');
export const MediaView = pillar('/business/media', 'media');
