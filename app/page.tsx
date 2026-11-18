import Link from 'next/link';
import JsonLd from '@/components/json-ld';
import { Droplet, PhoneMock, PointChips, TierSteps, Tickets } from '@/components/art';
import { ButtonLink, SectionTitle, SplitCard } from '@/components/ui';
import { getProgramme, gbp, num, pointsValue } from '@/lib/programme';
import { SITE_DESCRIPTION, SITE_URL } from '@/lib/site';

export const revalidate = 300;

const faqs = [
  { q: 'One balance for every brand', a: 'Every point you earn at any participating Sparkthunder brand lands in the same balance, and you can spend it at any of them.' },
  { q: 'Tiers that reward loyalty', a: 'The more you spend over a rolling window, the higher your tier. Each tier earns points faster than the last.' },
  { q: 'Single-use reward codes', a: 'Choose a reward and you get a single-use code to enter at checkout. Each code works once, so it cannot be reused.' },
  { q: 'Guest purchases count too', a: 'Shopped as a guest? Points earned with your email are held for you and added when you join with that same verified email.' },
];

export default async function HomePage() {
  const p = await getProgramme();
  const top = p.tiers[p.tiers.length - 1];
  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 pt-6 sm:px-6">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: SITE_URL, name: 'Elixir Points', description: SITE_DESCRIPTION, isPartOf: { '@id': `${SITE_URL}/#website` } }} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-deep">
        <Droplet className="float-slow pointer-events-none absolute -left-6 bottom-8 h-24 w-20 text-elixir/60" />
        <Droplet className="float-slower pointer-events-none absolute right-[42%] top-8 h-14 w-11 text-elixir-light/50" />
        <Droplet className="float-slow pointer-events-none absolute right-6 top-16 h-28 w-20 text-elixir/70" />
        <div className="relative grid items-center gap-10 px-6 py-14 sm:px-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-elixir-light">Free to join</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] !text-white sm:text-5xl lg:text-6xl">One rewards balance. Every Sparkthunder brand.</h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">
              Collect Elixir Points wherever you shop with us and spend them anywhere in the family.
              {p.rewards[0] && <> Rewards start at just {num(p.rewards[0].point_cost)} points.</>}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Join Elixir Points</ButtonLink>
              <ButtonLink href="/how-it-works" variant="outline">How it works</ButtonLink>
            </div>
          </div>
          <PhoneMock p={p} />
        </div>
      </section>

      {/* Brands */}
      <section aria-labelledby="brands" className="rounded-3xl bg-elixir px-6 py-10 sm:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="brands" className="text-3xl font-extrabold !text-white sm:text-4xl">Brands that earn Elixir Points</h2>
          <Link href="/brands" className="text-sm font-bold text-white underline underline-offset-4">See all brands</Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {p.brands.slice(0, 7).map((b) => (
            <li key={b.slug} className="flex h-28 items-center justify-center rounded-2xl bg-white/95 p-3 text-center text-sm font-extrabold text-deep">{b.name}</li>
          ))}
          <li className="flex h-28 items-center justify-center rounded-2xl border-2 border-dashed border-white/60 p-3 text-center text-sm font-bold text-white">More brands joining soon</li>
        </ul>
      </section>

      {/* Earn */}
      <section aria-labelledby="earn" className="space-y-5 pt-10">
        <SectionTitle id="earn">Loads of ways to earn</SectionTitle>
        <SplitCard title={`Earn ${p.earn_points_per_gbp} point for every £1`} text="Shop at any participating brand and points land in one shared balance. Refunds take back only the points for the refunded amount." color="#ff876f">
          <PointChips rate={p.earn_points_per_gbp} />
        </SplitCard>
        <SplitCard flip title="Climb the tiers, earn faster" text={`Your tier follows what you spend over ${p.tier_window_months} months. Reach ${top.name} and every £1 earns ${top.earn_multiplier}x points.`} color="#ffd22e">
          <TierSteps p={p} />
        </SplitCard>
        <SplitCard title="Shop as a guest, claim later" text="Points earned with your email while shopping as a guest are held for you and added to your balance when you join with that email." color="#12c791">
          <div className="p-8 text-center" aria-hidden="true">
            <span className="inline-block rounded-2xl bg-white px-6 py-4 text-sm font-bold text-deep shadow-lg">you@email.com</span>
            <p className="mt-3 text-4xl font-extrabold text-white">+120 pts</p>
          </div>
        </SplitCard>
      </section>

      {/* Tiers */}
      <section aria-labelledby="tiers" className="space-y-8 pt-10">
        <SectionTitle id="tiers">Four tiers, faster points</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.tiers.map((t) => (
            <li key={t.id} className="rounded-3xl bg-white p-6">
              <span className="inline-block h-3 w-12 rounded-full" style={{ background: t.color }} />
              <p className="mt-4 text-xl font-extrabold text-deep">{t.name}</p>
              <p className="mt-1 text-sm text-body">{t.min_spend_gbp === 0 ? 'Where everyone starts' : `From ${gbp(t.min_spend_gbp)} spent`}</p>
              <p className="mt-5 text-3xl font-extrabold text-elixir">{t.earn_multiplier}x</p>
              <p className="text-xs text-body">points on every £1</p>
            </li>
          ))}
        </ul>
        <p className="text-center"><Link href="/tiers" className="text-sm font-bold text-elixir underline underline-offset-4">Compare the tiers</Link></p>
      </section>

      {/* Spend */}
      <section aria-labelledby="spend" className="overflow-hidden rounded-3xl bg-navy">
        <div className="grid items-center gap-8 px-6 py-12 sm:px-12 md:grid-cols-2">
          <div>
            <h2 id="spend" className="text-3xl font-extrabold !text-white sm:text-4xl">Spend points on the things you love</h2>
            <p className="mt-4 max-w-md text-white/80">{num(p.redeem_points_per_gbp)} points are worth {gbp(1)}. Choose a reward, get your code, use it at checkout.</p>
            <div className="mt-7"><ButtonLink href="/rewards" variant="light">See rewards</ButtonLink></div>
          </div>
          <div className="rounded-3xl bg-white/10 py-6"><Tickets p={p} /></div>
        </div>
        {p.rewards[0] && <p className="sr-only">{p.rewards[0].title} costs {num(p.rewards[0].point_cost)} points, worth {gbp(pointsValue(p.rewards[0].point_cost, p))}.</p>}
      </section>

      {/* Details accordion */}
      <section aria-labelledby="details" className="rounded-3xl bg-sun px-6 py-12 sm:px-12">
        <h2 id="details" className="text-center text-3xl font-extrabold !text-deep sm:text-4xl">The best of Elixir at a glance</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {faqs.map((f, i) => (
            <details key={f.q} open={i === 0} className="group rounded-2xl bg-white/60 px-5 py-4 open:bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-bold text-deep">
                {f.q}
                <span className="text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-body">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center"><Link href="/faq" className="text-sm font-bold text-deep underline underline-offset-4">More questions answered</Link></p>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="join" className="py-12 text-center">
        <h2 id="join" className="text-3xl font-extrabold text-deep sm:text-4xl">Sign up now, start collecting points</h2>
        <div className="mt-6"><ButtonLink href="/signup">Join Elixir Points</ButtonLink></div>
      </section>
    </div>
  );
}
