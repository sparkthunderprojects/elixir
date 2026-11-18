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
          <li key={b.slug} className="rounded-3xl bg-white p-6 sm:p-8">
            <h2 className="text-lg font-bold text-deep">{b.name}</h2>
            <p className="mt-1 text-sm text-body">{b.brand_type === 'partner' ? 'Partner brand' : 'Sparkthunder brand'}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-body">More brands are joining over time, so your points will go even further.</p>
      <p className="mt-6"><Link href="/signup" className="inline-flex rounded-xl bg-elixir px-6 py-3.5 text-sm font-bold text-white hover:bg-elixir-dark">Join free</Link></p>
    </PageShell>
  );
}
