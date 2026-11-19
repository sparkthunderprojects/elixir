'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';

interface Shop { id: string; name: string; description: string | null; points_per_gbp: number }

export function OnlineShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getElixirClient().rpc('elixir_affiliate_merchants').then(({ data }) => setShops(Array.isArray(data) ? (data as Shop[]) : []), () => undefined);
  }, []);
  if (shops.length === 0) return null;

  const go = async (id: string) => {
    setBusy(id); setError(null);
    const { data, error: err } = await getElixirClient().rpc('elixir_affiliate_click', { p_merchant: id });
    setBusy(null);
    const url = (data as { url?: string } | null)?.url;
    if (err || !url) { setError('Could not open that shop. Please try again.'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section>
      <div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-elixir" /><h2 className="text-xl font-extrabold text-deep">Earn more online</h2></div>
      <p className="mt-1 text-body">Shop at these stores through Elixir and earn points. Points are added once the store confirms your order, which can take a few weeks.</p>
      {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {shops.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="min-w-0">
              <p className="font-bold text-deep">{s.name}</p>
              <p className="text-sm text-slate-500">{s.points_per_gbp} point{s.points_per_gbp === 1 ? '' : 's'} per £1{s.description ? ` · ${s.description}` : ''}</p>
            </div>
            <button onClick={() => void go(s.id)} disabled={busy === s.id} className="shrink-0 rounded-xl bg-elixir px-4 py-2 text-sm font-bold text-white hover:bg-elixir-dark disabled:opacity-60">Shop</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
