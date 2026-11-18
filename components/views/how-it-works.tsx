import Link from 'next/link';
import PageShell from '@/components/page-shell';
import type { ViewProps } from '@/components/views/home';

export default function HowItWorksView({ c }: ViewProps) {
  const steps = c.list<{ h: string; t: string }>('steps.items');
  return (
    <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path="/how-it-works">
      <div className="grid gap-5 sm:grid-cols-2">
        {steps.map((s, i) => (
          <section key={`${i}-${s.h}`} className="card-depth rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-deep">{s.h}</h2>
            <p className="mt-2 max-w-3xl text-body">{s.t}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 flex flex-wrap gap-4">
        <Link href="/tiers" className="font-bold text-elixir underline underline-offset-4">{c.t('links.tiers')}</Link>
        <Link href="/rewards" className="font-bold text-elixir underline underline-offset-4">{c.t('links.rewards')}</Link>
        <Link href="/faq" className="font-bold text-elixir underline underline-offset-4">{c.t('links.faq')}</Link>
      </p>
    </PageShell>
  );
}
