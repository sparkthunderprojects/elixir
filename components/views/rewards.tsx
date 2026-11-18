import Link from 'next/link';
import PageShell from '@/components/page-shell';
import { gbp, num, pointsValue } from '@/lib/programme';
import type { ViewProps } from '@/components/views/home';

export default function RewardsView({ p, c }: ViewProps) {
  return (
    <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path="/rewards">
      {p.rewards.length === 0 ? (
        <p className="text-body">{c.t('list.empty')}</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {p.rewards.map((r) => (
            <li key={r.title} className="rounded-3xl bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-deep">{r.title}</h2>
              <p className="mt-1 text-sm text-body">{r.description}</p>
              <p className="mt-4 font-bold text-elixir">{num(r.point_cost)} points <span className="text-sm font-normal text-body">({c.t('list.worth', { amount: gbp(pointsValue(r.point_cost, p)) })})</span></p>
              <p className="mt-1 text-xs text-body">{r.brand ? c.t('list.one_brand', { brand: r.brand }) : c.t('list.any_brand')}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-10"><Link href="/signup" className="inline-flex rounded-xl bg-elixir px-6 py-3.5 text-sm font-bold text-white hover:bg-elixir-dark">{c.t('list.button')}</Link></p>
    </PageShell>
  );
}
