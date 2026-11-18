import Link from 'next/link';
import PageShell from '@/components/page-shell';
import { pageMetadata } from '@/lib/seo';
import { getProgramme, gbp, num } from '@/lib/programme';

export const revalidate = 300;
export const metadata = pageMetadata('How Elixir Points works', 'Earn Elixir Points on every Sparkthunder brand purchase, climb the tiers for faster points, and redeem them for rewards at checkout. Here is exactly how it works.', '/how-it-works');

export default async function HowItWorks() {
  const p = await getProgramme();
  const sections = [
    { h: '1. Join for free', t: 'Create a free account, or use your existing My Sparkthunder login, which is the same account. Shop as a guest if you like: points earned with your email are waiting for you when you join.' },
    { h: '2. Earn points when you shop', t: `You earn ${p.earn_points_per_gbp} Elixir Point for every £1 you spend, before any tier bonus. Points are added to one balance, whichever Sparkthunder brand you bought from. If an order is refunded, the points for the refunded amount are taken back.` },
    { h: '3. Climb the tiers', t: `Your tier is based on what you have spent in the last ${p.tier_window_months} months. Each tier earns points faster than the last, up to ${p.tiers[p.tiers.length - 1].earn_multiplier}x at ${p.tiers[p.tiers.length - 1].name}.` },
    { h: '4. Spend points on rewards', t: `Every ${num(p.redeem_points_per_gbp)} points are worth ${gbp(1)}. Pick a reward and you get a single-use code to use at checkout.` },
  ];
  return (
    <PageShell title="How Elixir Points works" intro="One balance, every Sparkthunder brand. Four simple steps." path="/how-it-works">
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-bold text-navy">{s.h}</h2>
            <p className="mt-2 max-w-3xl text-slate-600">{s.t}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 flex flex-wrap gap-4">
        <Link href="/tiers" className="font-medium text-elixir hover:underline">Compare the tiers</Link>
        <Link href="/rewards" className="font-medium text-elixir hover:underline">Browse rewards</Link>
        <Link href="/faq" className="font-medium text-elixir hover:underline">Read the FAQ</Link>
      </p>
    </PageShell>
  );
}
