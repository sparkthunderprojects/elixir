import PageShell from '@/components/page-shell';
import JsonLd from '@/components/json-ld';
import { pageMetadata } from '@/lib/seo';
import { getProgramme, gbp, num } from '@/lib/programme';

export const revalidate = 300;
export const metadata = pageMetadata('Elixir Points FAQ', 'Answers to common questions about Elixir Points: how you earn, what points are worth, how tiers work, and how to redeem rewards.', '/faq');

export default async function Faq() {
  const p = await getProgramme();
  const top = p.tiers[p.tiers.length - 1];
  const items = [
    { q: 'How do I earn Elixir Points?', a: `You earn ${p.earn_points_per_gbp} point for every £1 you spend at a participating Sparkthunder brand. Your tier can multiply this, up to ${top.earn_multiplier}x at ${top.name}.` },
    { q: 'What are Elixir Points worth?', a: `${num(p.redeem_points_per_gbp)} points are worth ${gbp(1)} when you redeem them for a reward.` },
    { q: 'Is it free to join?', a: 'Yes. Joining Elixir Points is free, and your My Sparkthunder account works as your Elixir Points account.' },
    { q: 'Can I earn points as a guest?', a: 'Yes. Points earned with your email address are held for you and added to your balance when you join with that same email.' },
    { q: 'How do tiers work?', a: `Your tier depends on how much you have spent in the last ${p.tier_window_months} months across all participating brands. Spend more and you move up to a tier that earns points faster.` },
    { q: 'How do I use my points?', a: 'Choose a reward and you receive a single-use code to enter at checkout at a participating brand.' },
    { q: 'What happens if I return an order?', a: 'The points earned on the refunded amount are taken back from your balance.' },
    { q: 'Which brands take part?', a: `${p.brands.map((b) => b.name).join(', ')}. More brands will join over time.` },
  ];
  return (
    <PageShell title="Elixir Points FAQ" intro="Quick answers about earning, tiers and rewards." path="/faq">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) }} />
      <dl className="space-y-6">
        {items.map((i) => (
          <div key={i.q}>
            <dt className="text-lg font-bold text-navy"><h2>{i.q}</h2></dt>
            <dd className="mt-1 max-w-3xl text-slate-600">{i.a}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
