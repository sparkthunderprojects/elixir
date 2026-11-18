import Link from 'next/link';
import PageShell from '@/components/page-shell';
import JsonLd from '@/components/json-ld';
import { pageMetadata } from '@/lib/seo';
import { getProgramme, gbp } from '@/lib/programme';
import { SITE_URL } from '@/lib/site';

export const revalidate = 300;
export const metadata = pageMetadata('Elixir Points tiers', 'Compare the Elixir Points tiers. The more you spend across Sparkthunder brands, the higher your tier and the faster you earn points.', '/tiers');

export default async function Tiers() {
  const p = await getProgramme();
  return (
    <PageShell title="Elixir Points tiers" intro={`Spend more across Sparkthunder brands in a ${p.tier_window_months}-month window and you move up, earning points faster.`} path="/tiers">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'MemberProgram', name: 'Elixir Points', url: `${SITE_URL}/tiers`,
        description: 'Rewards programme across the Sparkthunder family of brands.', hostingOrganization: { '@id': `${SITE_URL}/#organization` },
        hasTiers: p.tiers.map((t) => ({ '@type': 'MemberProgramTier', name: t.name, url: `${SITE_URL}/tiers#${t.id}`, hasTierBenefit: 'https://schema.org/TierBenefitLoyaltyPoints', hasTierRequirement: { '@type': 'MonetaryAmount', value: t.min_spend_gbp, currency: 'GBP' } })),
      }} />
      <div className="grid gap-5 sm:grid-cols-2">
        {p.tiers.map((t) => (
          <section key={t.id} id={t.id} className="rounded-3xl bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold" style={{ color: t.color }}>{t.name}</h2>
            <p className="mt-1 text-sm text-body">{t.min_spend_gbp === 0 ? 'Everyone starts here' : `Spend ${gbp(t.min_spend_gbp)} in ${p.tier_window_months} months`}</p>
            <p className="mt-4 text-2xl font-extrabold text-deep">{t.earn_multiplier}x <span className="text-base font-medium text-body">points on every £1</span></p>
            {t.perks.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-body">
                {t.perks.map((perk) => <li key={perk}>{perk}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
      <p className="mt-10"><Link href="/signup" className="inline-flex rounded-xl bg-elixir px-6 py-3.5 text-sm font-bold text-white hover:bg-elixir-dark">Join free and start earning</Link></p>
    </PageShell>
  );
}
