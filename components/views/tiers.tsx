import Link from 'next/link';
import PageShell from '@/components/page-shell';
import JsonLd from '@/components/json-ld';
import { gbp } from '@/lib/programme';
import { SITE_URL } from '@/lib/site';
import type { ViewProps } from '@/components/views/home';

export default function TiersView({ p, c }: ViewProps) {
  return (
    <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path="/tiers">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'MemberProgram', name: 'Elixir Points', url: `${SITE_URL}/tiers`,
        description: c.t('seo.description'), hostingOrganization: { '@id': `${SITE_URL}/#organization` },
        hasTiers: p.tiers.map((t) => ({ '@type': 'MemberProgramTier', name: t.name, url: `${SITE_URL}/tiers#${t.id}`, hasTierBenefit: 'https://schema.org/TierBenefitLoyaltyPoints', hasTierRequirement: { '@type': 'MonetaryAmount', value: t.min_spend_gbp, currency: 'GBP' } })),
      }} />
      <div className="grid gap-5 sm:grid-cols-2">
        {p.tiers.map((t) => (
          <section key={t.id} id={t.id} className="card-depth lift rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-bold" style={{ color: t.color }}>{t.name}</h2>
            <p className="mt-1 text-sm text-body">{t.min_spend_gbp === 0 ? c.t('cards.start') : c.t('cards.spend', { amount: gbp(t.min_spend_gbp) })}</p>
            <p className="mt-4 text-2xl font-extrabold text-deep">{t.earn_multiplier}x <span className="text-base font-medium text-body">{c.t('cards.suffix')}</span></p>
            {t.perks.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-body">
                {t.perks.map((perk) => <li key={perk}>{perk}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
      <p className="mt-10"><Link href="/signup" className="inline-flex rounded-xl bg-gradient-to-b from-[#e85a68] to-[#b02a3c] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_-8px_rgba(189,49,65,0.8),inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:-translate-y-0.5">{c.t('cards.button')}</Link></p>
    </PageShell>
  );
}
