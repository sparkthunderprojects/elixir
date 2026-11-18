import Link from 'next/link';
import PageShell from '@/components/page-shell';
import { pageMetadata } from '@/lib/seo';
import { getProgramme, gbp, num, pointsValue } from '@/lib/programme';

export const revalidate = 300;
export const metadata = pageMetadata('Elixir Points rewards', 'See what your Elixir Points can buy: discounts, free shipping and more across Sparkthunder brands, with the points cost of each reward.', '/rewards');

export default async function Rewards() {
  const p = await getProgramme();
  return (
    <PageShell title="Elixir Points rewards" intro={`Every ${num(p.redeem_points_per_gbp)} points are worth ${gbp(1)}. Pick a reward and use the code at checkout.`} path="/rewards">
      {p.rewards.length === 0 ? (
        <p className="text-body">New rewards are on the way. Join free and we will have them ready for you.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {p.rewards.map((r) => (
            <li key={r.title} className="rounded-3xl bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-deep">{r.title}</h2>
              <p className="mt-1 text-sm text-body">{r.description}</p>
              <p className="mt-4 font-bold text-elixir">{num(r.point_cost)} points <span className="text-sm font-normal text-body">(worth {gbp(pointsValue(r.point_cost, p))})</span></p>
              <p className="mt-1 text-xs text-body">{r.brand ? `Use at ${r.brand}` : 'Use at any participating brand'}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-10"><Link href="/signup" className="inline-flex rounded-xl bg-elixir px-6 py-3.5 text-sm font-bold text-white hover:bg-elixir-dark">Join free</Link></p>
    </PageShell>
  );
}
