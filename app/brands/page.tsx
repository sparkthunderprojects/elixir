import Link from 'next/link';
import PageShell from '@/components/page-shell';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;
export const metadata = pageMetadata('Brands that earn Elixir Points', 'Earn and spend Elixir Points across Sparkthunder brands. See which brands take part today.', '/brands');

export default async function Brands() {
  const p = await getProgramme();
  return (
    <PageShell title="Brands that earn Elixir Points" intro="Shop at any of these and your points go into one shared balance." path="/brands">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {p.brands.map((b) => (
          <li key={b.slug} className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-navy">{b.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{b.brand_type === 'partner' ? 'Partner brand' : 'Sparkthunder brand'}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-slate-600">More brands are joining over time, so your points will go even further.</p>
      <p className="mt-6"><Link href="/signup" className="rounded-lg bg-elixir px-6 py-3 font-semibold text-white hover:bg-elixir-dark">Join free</Link></p>
    </PageShell>
  );
}
