import type { CSSProperties } from 'react';
import type { Programme } from '@/lib/programme';
import { gbp, num } from '@/lib/programme';

/** The Elixir droplet, drawn in SVG so it stays sharp at any size. */
export function Droplet({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 130" className={className} style={style} aria-hidden="true">
      <path d="M50 4C50 4 8 56 8 86a42 42 0 0 0 84 0C92 56 50 4 50 4Z" fill="currentColor" />
    </svg>
  );
}

/** A phone showing an example Elixir balance. Illustrative, labelled as an example. */
export function PhoneMock({ p }: { p: Programme }) {
  const tier = p.tiers[0];
  const next = p.tiers[1];
  const points = 1000;
  return (
    <div className="relative mx-auto w-[270px]" aria-label="Example of the Elixir Points member view">
      <div className="rounded-[2.4rem] border-[9px] border-deep bg-page p-3 shadow-2xl">
        <div className="flex items-center justify-between px-1 pb-2 text-[11px] font-semibold text-navy">
          <span>Good afternoon</span>
          <span className="h-5 w-5 rounded-full bg-elixir/15" />
        </div>
        <div className="rounded-2xl bg-navy p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Elixir Points</span>
            <Droplet className="h-5 w-4 text-elixir-light" />
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums">{num(points)}</p>
          <p className="text-xs text-white/70">points, worth {gbp(points / p.redeem_points_per_gbp)}</p>
        </div>
        <div className="mt-2 rounded-2xl bg-white p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-deep">
            <span style={{ color: tier.color }}>{tier.name}</span>
            {next && <span className="text-body">{next.name} at {gbp(next.min_spend_gbp)}</span>}
          </div>
          <div className="mt-2 h-2 rounded-full bg-page"><div className="h-2 w-2/5 rounded-full bg-elixir" /></div>
        </div>
        <div className="mt-2 space-y-1.5">
          {[['Order at the shop', '+40'], ['Order at the shop', '+25'], ['Reward redeemed', '-1,000']].map(([t, v], i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[11px]">
              <span className="font-medium text-deep">{t}</span>
              <span className={`font-bold ${v.startsWith('-') ? 'text-body' : 'text-mint'}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-white/50">Example balance</p>
    </div>
  );
}

/** Floating point chips for the "earn" card. */
export function PointChips({ rate }: { rate: number }) {
  const chips = [
    { l: 'left-[8%] top-[18%]', t: `+${rate * 20}`, a: 'float-slow' },
    { l: 'left-[38%] top-[44%]', t: `+${rate * 50}`, a: 'float-slower' },
    { l: 'left-[66%] top-[14%]', t: `+${rate * 35}`, a: 'float-slow' },
  ];
  return (
    <div className="relative h-full min-h-[200px] w-full" aria-hidden="true">
      {chips.map((c) => (
        <span key={c.l} className={`absolute ${c.l} ${c.a} rounded-2xl bg-white px-4 py-3 text-lg font-extrabold text-elixir shadow-lg`}>
          {c.t} <span className="text-xs font-semibold text-body">pts</span>
        </span>
      ))}
    </div>
  );
}

/** A stack of stepped bars, one per tier. */
export function TierSteps({ p }: { p: Programme }) {
  return (
    <div className="flex h-full min-h-[200px] items-end justify-center gap-3 pb-6" aria-hidden="true">
      {p.tiers.map((t, i) => (
        <div key={t.id} className="flex w-16 flex-col items-center gap-2">
          <span className="text-xs font-bold text-deep">{t.earn_multiplier}x</span>
          <div className="w-full rounded-t-2xl" style={{ height: 50 + i * 36, background: t.color }} />
        </div>
      ))}
    </div>
  );
}

/** Reward tickets. */
export function Tickets({ p }: { p: Programme }) {
  const list = p.rewards.slice(0, 3);
  return (
    <div className="flex h-full min-h-[200px] flex-col justify-center gap-3 px-6" aria-hidden="true">
      {list.map((r, i) => (
        <div key={r.title} className={`flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-md ${i % 2 ? 'ml-8' : 'mr-8'}`}>
          <span className="text-sm font-bold text-deep">{r.title}</span>
          <span className="text-xs font-bold text-elixir">{num(r.point_cost)}</span>
        </div>
      ))}
    </div>
  );
}
