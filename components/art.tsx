import type { CSSProperties } from 'react';
import type { Programme } from '@/lib/programme';
import { gbp, num } from '@/lib/programme';

/** The Elixir droplet, drawn in SVG so it stays sharp at any size. Tinted by the text colour, with a glossy finish. Always carries the white "e", so every drop on the site is the brand mark. */
export function Droplet({ className, style }: { className?: string; style?: CSSProperties }) {
  const d = 'M50 4C50 4 8 56 8 86a42 42 0 0 0 84 0C92 56 50 4 50 4Z';
  return (
    <svg viewBox="0 0 100 130" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="dp-shade" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="0.45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="dp-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id="dp-e" x1="50" y1="66" x2="50" y2="108" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#ffe4e1" /></linearGradient>
        <filter id="dp-es" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2.2" stdDeviation="1.6" floodColor="#5a0a18" floodOpacity="0.55" /></filter>
      </defs>
      <path d={d} fill="currentColor" />
      <path d={d} fill="url(#dp-shade)" />
      <path d="M47 13C35 31 20 52 16.5 72c-.5 3-.4 6 .6 9 1.2-22 14-42 32-61Z" fill="url(#dp-gloss)" />
      <path d="M31 88H69A19 19 0 1 0 63.4 101.4" fill="none" stroke="url(#dp-e)" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#dp-es)" />
    </svg>
  );
}

/** A phone showing an example Elixir balance. Illustrative, labelled as an example. */
export function PhoneMock({ p, note = 'Example balance' }: { p: Programme; note?: string }) {
  const tier = p.tiers[0];
  const next = p.tiers[1];
  const points = 1000;
  return (
    <div className="relative mx-auto w-[270px]" aria-label="Example of the Elixir Points member view">
      <span aria-hidden="true" className="glow-ring pulse-glow -inset-10 bg-elixir/60" />
      <div className="relative rounded-[2.4rem] border-[9px] border-[#1b2a47] bg-page p-3 shadow-[0_40px_70px_-20px_rgba(0,0,0,0.7),0_0_0_1.5px_rgba(255,255,255,0.18),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between px-1 pb-2 text-[11px] font-semibold text-navy">
          <span>Good afternoon</span>
          <span className="h-5 w-5 rounded-full bg-elixir/15" />
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#2b4a78] via-navy to-[#12213b] p-4 text-white shadow-[0_10px_20px_-10px_rgba(15,26,48,0.8),inset_0_1px_0_rgba(255,255,255,0.18)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Elixir Points</span>
            <Droplet className="h-5 w-4 text-elixir-light" />
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums">{num(points)}</p>
          <p className="text-xs text-white/70">points, worth {gbp(points / p.redeem_points_per_gbp)}</p>
        </div>
        <div className="card-depth mt-2 rounded-2xl p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-deep">
            <span style={{ color: tier.color }}>{tier.name}</span>
            {next && <span className="text-body">{next.name} at {gbp(next.min_spend_gbp)}</span>}
          </div>
          <div className="mt-2 h-2 rounded-full bg-page"><div className="h-2 w-2/5 rounded-full bg-gradient-to-r from-elixir-light to-elixir shadow-[0_0_8px_rgba(224,82,95,0.7)]" /></div>
        </div>
        <div className="mt-2 space-y-1.5">
          {[['Order at the shop', '+40'], ['Order at the shop', '+25'], ['Reward redeemed', '-1,000']].map(([t, v], i) => (
            <div key={i} className="card-depth flex items-center justify-between rounded-xl px-3 py-2 text-[11px]">
              <span className="font-medium text-deep">{t}</span>
              <span className={`font-bold ${v.startsWith('-') ? 'text-body' : 'text-mint'}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-white/50">{note}</p>
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
        <span key={c.l} className={`absolute ${c.l} ${c.a} rounded-2xl bg-gradient-to-b from-white to-[#fff1ee] px-4 py-3 text-lg font-extrabold text-elixir shadow-[0_14px_28px_-8px_rgba(120,30,40,0.5),inset_0_1px_0_#fff] ring-1 ring-white/70`}>
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
          <div className="w-full rounded-t-2xl shadow-[0_12px_20px_-8px_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-10px_14px_rgba(0,0,0,0.18)]" style={{ height: 50 + i * 36, background: `linear-gradient(180deg, color-mix(in srgb, ${t.color} 75%, white), ${t.color})` }} />
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
        <div key={r.title} className={`flex items-center justify-between rounded-2xl bg-gradient-to-b from-white to-[#f4f0ec] px-4 py-3 shadow-[0_14px_24px_-10px_rgba(0,0,0,0.55),inset_0_1px_0_#fff] ${i % 2 ? 'ml-8' : 'mr-8'}`}>
          <span className="text-sm font-bold text-deep">{r.title}</span>
          <span className="text-xs font-bold text-elixir">{num(r.point_cost)}</span>
        </div>
      ))}
    </div>
  );
}
