import Link from 'next/link';
import { Gift, ShoppingBag, Sparkles } from 'lucide-react';
import JsonLd from '@/components/json-ld';
import { getProgramme, num, pointsValue, gbp } from '@/lib/programme';
import { SITE_DESCRIPTION, SITE_URL } from '@/lib/site';

export const revalidate = 300;

export default async function HomePage() {
  const p = await getProgramme();
  const steps = [
    { icon: ShoppingBag, title: 'Shop across the family', text: `Earn ${p.earn_points_per_gbp} Elixir Point for every £1 you spend at a Sparkthunder brand. Higher tiers earn faster.` },
    { icon: Sparkles, title: 'Climb the tiers', text: `Your spend over the last ${p.tier_window_months} months decides your tier, from ${p.tiers[0].name} up to ${p.tiers[p.tiers.length - 1].name}.` },
    { icon: Gift, title: 'Spend points anywhere', text: `${num(p.redeem_points_per_gbp)} points are worth ${gbp(1)}. Redeem for rewards at checkout in any brand that takes part.` },
  ];
  const cheapest = p.rewards[0];
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: SITE_URL, name: 'Elixir Points', description: SITE_DESCRIPTION, isPartOf: { '@id': `${SITE_URL}/#website` },
      }} />
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">One rewards balance. Every Sparkthunder brand.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Collect Elixir Points wherever you shop with us, from comics to makeup and beyond, and spend them anywhere in the family.
            {cheapest && <> Rewards start from just {num(cheapest.point_cost)} points.</>}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-lg bg-elixir px-6 py-3 font-semibold text-white hover:bg-elixir-dark">Join free</Link>
            <Link href="/how-it-works" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-navy hover:bg-slate-50">How it works</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="text-center text-2xl font-bold text-navy">Earn, level up, spend</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-elixir/10 text-elixir"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50" aria-labelledby="tiers">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 id="tiers" className="text-center text-2xl font-bold text-navy">Four tiers, faster points</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.tiers.map((t) => (
              <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-lg font-bold" style={{ color: t.color }}>{t.name}</p>
                <p className="mt-1 text-sm text-slate-600">{t.min_spend_gbp === 0 ? 'Where everyone starts' : `From ${gbp(t.min_spend_gbp)} spent`}</p>
                <p className="mt-3 text-sm font-semibold text-navy">{t.earn_multiplier}x points</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center"><Link href="/tiers" className="font-medium text-elixir hover:underline">See all tier details</Link></p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="rewards">
        <h2 id="rewards" className="text-center text-2xl font-bold text-navy">What your points buy</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {p.rewards.slice(0, 3).map((r) => (
            <li key={r.title} className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold text-navy">{r.title}</p>
              <p className="mt-1 text-sm text-slate-600">{r.description}</p>
              <p className="mt-3 text-sm font-bold text-elixir">{num(r.point_cost)} points <span className="font-normal text-slate-500">(worth {gbp(pointsValue(r.point_cost, p))})</span></p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center"><Link href="/rewards" className="font-medium text-elixir hover:underline">See all rewards</Link></p>
      </section>
    </>
  );
}
