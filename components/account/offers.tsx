'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';

interface Offer { id: string; brand: string; title: string; body: string | null }

export function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  useEffect(() => {
    getElixirClient().rpc('elixir_offers').then(({ data }) => setOffers(Array.isArray(data) ? (data as Offer[]) : []), () => undefined);
  }, []);
  if (offers.length === 0) return null;

  const open = async (id: string) => {
    const { data } = await getElixirClient().rpc('elixir_offer_click', { p_id: id });
    const url = (data as { url?: string } | null)?.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section>
      <div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-elixir" /><h2 className="text-xl font-extrabold text-deep">Offers for you</h2></div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {offers.map((o) => (
          <li key={o.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sponsored · {o.brand}</p>
              <p className="mt-1 font-bold text-deep">{o.title}</p>
              {o.body && <p className="mt-1 text-sm text-slate-500">{o.body}</p>}
            </div>
            <button onClick={() => void open(o.id)} className="mt-3 self-start rounded-xl border-2 border-elixir px-4 py-1.5 text-sm font-bold text-elixir hover:bg-elixir/5">View offer</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
