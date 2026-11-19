'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Gift } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';

interface Ref { enabled: boolean; code: string | null; bonus_referrer: number; bonus_referee: number; min_spend_gbp: number; invited: number; rewarded: number; points_earned: number }

export function InviteCard() {
  const [r, setR] = useState<Ref | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    getElixirClient().rpc('elixir_my_referrals').then(({ data }) => setR((data as Ref) ?? null), () => undefined);
  }, []);
  if (!r || !r.enabled || !r.code) return null;
  const link = `${window.location.origin}/signup?ref=${r.code}`;
  return (
    <section className="rounded-2xl border border-elixir/20 bg-white p-6">
      <div className="flex items-center gap-2"><Gift className="h-5 w-5 text-elixir" /><h2 className="text-xl font-extrabold text-deep">Invite a friend</h2></div>
      <p className="mt-2 text-body">
        When a friend joins with your link and spends {r.min_spend_gbp > 0 ? `£${r.min_spend_gbp} or more ` : ''}for the first time, you get {r.bonus_referrer.toLocaleString('en-GB')} points and they get {r.bonus_referee.toLocaleString('en-GB')}.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm">{link}</code>
        <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center gap-1.5 rounded-lg bg-elixir px-3 py-2 text-sm font-bold text-white hover:bg-elixir-dark">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-500">{r.invited} invited · {r.rewarded} rewarded · {r.points_earned.toLocaleString('en-GB')} points earned</p>
    </section>
  );
}
