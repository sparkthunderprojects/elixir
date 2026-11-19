'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Copy, Check } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';
import { CardCodes } from '@/components/account/card-codes';

interface Me {
  enrolled: boolean; card_no: string; display_name: string | null; joined_at: string;
  expiry_months: number | null; expires_on: string | null;
  balance: number; balance_gbp: number; lifetime_earned: number; lifetime_redeemed: number;
  tier: { name: string; color: string; earn_multiplier: number; perks: string[] };
  window_spend_gbp: number; next_tier: { name: string; spend_needed_gbp: number } | null;
  history: { created_at: string; kind: string; delta: number; description: string | null; brand: string | null }[];
  codes: { code: string; expires_at: string; title: string }[];
}
interface Reward { id: string; title: string; description: string | null; point_cost: number; brand: string | null; can_afford: boolean }

const KIND: Record<string, string> = { earn: 'Earned', redeem: 'Spent', adjust: 'Adjustment', reversal: 'Refund', expire: 'Expired' };
const ERRORS: Record<string, string> = {
  insufficient_points: 'You do not have enough points for that yet.', out_of_stock: 'Sorry, that reward has run out.',
  limit_reached: 'You have reached the limit for that reward.', reward_unavailable: 'That reward is no longer available.', member_suspended: 'Your account cannot redeem right now. Please contact support.',
};
const fmt = (n: number) => n.toLocaleString('en-GB');
const day = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Wallet() {
  const [me, setMe] = useState<Me | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [state, setState] = useState<'loading' | 'out' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    const sb = getElixirClient();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) { setState('out'); return; }
    try {
      let r = await sb.rpc('elixir_me');
      if (r.error) throw r.error;
      if (!r.data?.enrolled) { await sb.rpc('elixir_join'); r = await sb.rpc('elixir_me'); if (r.error) throw r.error; }
      const rw = await sb.rpc('elixir_rewards_available');
      setMe(r.data as Me); setRewards((rw.data as Reward[]) ?? []); setState('ready');
    } catch { setState('error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function redeem(r: Reward) {
    setBusy(r.id); setNote(null);
    const { data, error } = await getElixirClient().rpc('elixir_redeem', { p_reward_id: r.id });
    setBusy(null);
    if (error) { const k = Object.keys(ERRORS).find((x) => error.message.includes(x)); setNote({ ok: false, text: k ? ERRORS[k] : 'Something went wrong. Please try again.' }); return; }
    setNote({ ok: true, text: `Done. Your code for ${data.title} is ${data.code}. Use it at checkout.` });
    load();
  }
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1500); } catch { /* ignore */ } };

  if (state === 'loading') return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-elixir" /></div>;
  if (state === 'out') return (
    <div className="card-depth mx-auto max-w-md rounded-3xl p-8 text-center">
      <h1 className="text-2xl font-extrabold text-deep">My Elixir</h1>
      <p className="mt-2 text-body">Sign in to see your points, card and rewards.</p>
      <Link href="/login?next=/account" className="mt-5 inline-flex rounded-xl bg-elixir px-6 py-3 text-sm font-bold text-white hover:bg-elixir-dark">Sign in</Link>
    </div>
  );
  if (state === 'error' || !me) return (
    <div className="card-depth mx-auto max-w-md rounded-3xl p-8 text-center">
      <p className="text-body">We could not load your account just now. Please try again in a moment.</p>
      <button onClick={() => { setState('loading'); load(); }} className="mt-4 rounded-xl bg-elixir px-5 py-2.5 text-sm font-bold text-white">Try again</button>
    </div>
  );

  const progress = me.next_tier ? Math.max(4, Math.min(100, (me.window_spend_gbp / (me.window_spend_gbp + me.next_tier.spend_needed_gbp)) * 100)) : 100;
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="hero-deep relative overflow-hidden rounded-3xl p-6 text-white sm:p-8">
          <div className="flex items-start justify-between">
            <Image src="/elixir-mark.png" alt="Elixir" width={44} height={60} className="h-14 w-auto drop-shadow-lg" />
            <span className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white" style={{ background: me.tier.color }}>{me.tier.name}</span>
          </div>
          <p className="mt-6 text-sm text-white/70">Your balance</p>
          <p className="text-5xl font-extrabold tracking-tight">{fmt(me.balance)} <span className="text-xl font-bold text-white/80">points</span></p>
          <p className="mt-1 text-white/80">Worth £{me.balance_gbp.toFixed(2)} in rewards</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-white/60">Earned in total</dt><dd className="text-lg font-bold">{fmt(me.lifetime_earned)}</dd></div>
            <div><dt className="text-white/60">Spent in total</dt><dd className="text-lg font-bold">{fmt(me.lifetime_redeemed)}</dd></div>
          </dl>
          <p className="mt-6 text-sm text-white/70">{me.display_name ?? 'Member'} · since {day(me.joined_at)}</p>
        </div>
        <div className="space-y-4">
          <CardCodes value={me.card_no} />
          <div className="card-depth rounded-2xl p-5">
            <p className="text-sm font-bold text-deep">{me.tier.name} · {me.tier.earn_multiplier}x points</p>
            {me.next_tier ? (
              <>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-gradient-to-r from-[#e85a68] to-[#b02a3c]" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-sm text-body">Spend £{me.next_tier.spend_needed_gbp.toFixed(2)} more to reach {me.next_tier.name}.</p>
              </>
            ) : <p className="mt-2 text-sm text-body">You are at the top tier.</p>}
          </div>
        </div>
      </section>

      {me.expires_on && me.balance > 0 && (() => {
        const days = Math.ceil((new Date(me.expires_on).getTime() - Date.now()) / 864e5);
        if (days > 60) return null;
        return <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {days <= 0 ? 'Your points are due to expire.' : `Your points will expire in ${days} day${days === 1 ? '' : 's'}.`} Earn or spend any points before {day(me.expires_on)} to keep them. Points expire after {me.expiry_months} months with no activity.
        </p>;
      })()}

      {note && <p role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${note.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{note.text}</p>}

      {me.codes.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold text-deep">Your reward codes</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {me.codes.map((c) => (
              <li key={c.code} className="card-depth flex items-center justify-between gap-3 rounded-2xl p-4">
                <div><p className="font-bold text-deep">{c.title}</p><p className="font-mono text-sm text-body">{c.code}</p><p className="text-xs text-body">Valid until {day(c.expires_at)}</p></div>
                <button onClick={() => copy(c.code)} aria-label={`Copy code ${c.code}`} className="rounded-lg border border-black/10 p-2 text-deep hover:bg-black/5">{copied === c.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xl font-extrabold text-deep">Rewards you can claim</h2>
        {rewards.length === 0 ? <p className="mt-3 text-body">No rewards are available right now. Check back soon.</p> : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((r) => (
              <li key={r.id} className="card-depth flex flex-col rounded-2xl p-5">
                <p className="font-extrabold text-deep">{r.title}</p>
                {r.description && <p className="mt-1 flex-1 text-sm text-body">{r.description}</p>}
                <p className="mt-3 text-sm font-bold text-elixir">{fmt(r.point_cost)} points{r.brand ? ` · ${r.brand}` : ''}</p>
                <button disabled={!r.can_afford || busy === r.id} onClick={() => redeem(r)}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-elixir px-4 py-2.5 text-sm font-bold text-white hover:bg-elixir-dark disabled:cursor-not-allowed disabled:opacity-45">
                  {busy === r.id && <Loader2 className="h-4 w-4 animate-spin" />}{r.can_afford ? 'Claim reward' : `Need ${fmt(r.point_cost - me.balance)} more`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-extrabold text-deep">Your history</h2>
        {me.history.length === 0 ? <p className="mt-3 text-body">Nothing here yet. Shop with any Sparkthunder brand to start earning.</p> : (
          <ul className="mt-4 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {me.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0"><p className="truncate font-semibold text-deep">{h.description || KIND[h.kind] || h.kind}</p><p className="text-xs text-body">{KIND[h.kind] ?? h.kind}{h.brand ? ` · ${h.brand}` : ''} · {day(h.created_at)}</p></div>
                <p className={`shrink-0 font-extrabold ${h.delta >= 0 ? 'text-emerald-700' : 'text-deep'}`}>{h.delta >= 0 ? '+' : ''}{fmt(h.delta)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
