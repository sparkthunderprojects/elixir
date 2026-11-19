import type { ReactNode } from 'react';
import { Droplet } from '@/components/art';
import { gbp, num, type Programme } from '@/lib/programme';

/**
 * Pictures of the Elixir Points phone app. They are drawn from the same colours and layout as the real
 * screens, with made-up example numbers, so they stay sharp at any size and never go out of date.
 */
export function AppPhone({ children, className = '', label = 'The Elixir Points app' }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div role="img" aria-label={label} className={`relative mx-auto h-[540px] w-[262px] shrink-0 overflow-hidden rounded-[2.4rem] border-[8px] border-[#101c33] bg-page shadow-[0_40px_70px_-24px_rgba(0,0,0,0.65),0_0_0_1.5px_rgba(255,255,255,0.14)] ${className}`}>
      <span aria-hidden="true" className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#101c33]" />
      <div aria-hidden="true" className="h-full px-3 pb-3 pt-8 text-left">{children}</div>
    </div>
  );
}

const card = 'rounded-2xl bg-white shadow-[0_6px_14px_-8px_rgba(15,26,48,0.35)] ring-1 ring-black/5';

export function WalletScreen({ p }: { p: Programme }) {
  const points = 1240;
  const t = p.tiers[1] ?? p.tiers[0], next = p.tiers[2];
  return (
    <>
      <p className="px-1 pb-2 text-[11px] font-bold text-navy">Good afternoon</p>
      <div className="rounded-2xl bg-gradient-to-br from-[#2b4a78] via-navy to-[#12213b] p-4 text-white shadow-lg">
        <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Your balance</span><Droplet className="h-5 w-4 text-elixir-light" /></div>
        <p className="mt-3 text-[34px] font-extrabold leading-none tabular-nums">{num(points)}</p>
        <p className="mt-1 text-[11px] text-white/70">points, worth {gbp(points / p.redeem_points_per_gbp)}</p>
      </div>
      <div className={`${card} mt-2.5 p-3`}>
        <div className="flex items-center justify-between text-[11px] font-bold"><span style={{ color: t.color }}>{t.name}</span>{next && <span className="text-body">{next.name} at {gbp(next.min_spend_gbp)}</span>}</div>
        <div className="mt-2 h-2 rounded-full bg-page"><div className="h-2 w-3/5 rounded-full bg-gradient-to-r from-elixir-light to-elixir" /></div>
      </div>
      <p className="mt-3 px-1 text-[11px] font-bold text-deep">Recent activity</p>
      <div className="mt-1.5 space-y-1.5">
        {[['Sparkthunder Shop', '+120'], ['Knightverge', '+45'], ['Reward claimed', '-1,000'], ['Miss Petty', '+60']].map(([a, b]) => (
          <div key={a + b} className={`${card} flex items-center justify-between px-3 py-2 text-[11px]`}><span className="font-semibold text-deep">{a}</span><span className={`font-extrabold ${b.startsWith('-') ? 'text-body' : 'text-mint'}`}>{b}</span></div>
        ))}
      </div>
    </>
  );
}

/** A scannable-looking code. Decorative: not a real QR code. */
function CodePattern() {
  const n = 21;
  const cells: ReactNode[] = [];
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on = rnd() > 0.52;
    if (finder(x, y)) { const fx = x % 14, fy = y % 14; const edge = fx === 0 || fy === 0 || fx === 6 || fy === 6; const core = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4; on = edge || core; }
    if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  }
  return <svg viewBox={`0 0 ${n} ${n}`} className="h-full w-full" fill="#0f1a30" shapeRendering="crispEdges">{cells}</svg>;
}

export function CardScreen() {
  return (
    <>
      <p className="px-1 pb-2 text-[11px] font-bold text-navy">Your Elixir card</p>
      <div className="rounded-2xl bg-gradient-to-br from-[#d03a4c] via-elixir to-[#8a1d2c] p-4 text-white shadow-lg">
        <div className="flex items-center justify-between"><Droplet className="h-7 w-5 text-white/90" /><span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">Silver</span></div>
        <p className="mt-6 text-[10px] uppercase tracking-widest text-white/70">Card number</p>
        <p className="font-mono text-sm font-bold tracking-wider">ELX-1042-7F3A</p>
      </div>
      <div className={`${card} mt-2.5 p-4`}>
        <div className="mx-auto h-32 w-32"><CodePattern /></div>
        <div className="mt-4 flex h-9 items-stretch justify-center gap-[2px]">
          {Array.from({ length: 38 }, (_, i) => <span key={i} className="bg-deep" style={{ width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1 }} />)}
        </div>
        <p className="mt-2 text-center text-[10px] text-body">Show this at the till to earn points</p>
      </div>
    </>
  );
}

export function RewardsScreen({ p }: { p: Programme }) {
  const rewards = p.rewards.slice(0, 4);
  return (
    <>
      <p className="px-1 pb-2 text-[11px] font-bold text-navy">Rewards</p>
      <div className="space-y-2">
        {rewards.map((r, i) => (
          <div key={r.title} className={`${card} p-3`}>
            <div className="flex items-start justify-between gap-2"><p className="text-[12px] font-extrabold leading-tight text-deep">{r.title}</p><span className="shrink-0 rounded-full bg-elixir/10 px-2 py-0.5 text-[10px] font-extrabold text-elixir">{num(r.point_cost)} pts</span></div>
            <span className={`mt-2.5 block rounded-lg py-1.5 text-center text-[11px] font-bold ${i < 2 ? 'bg-elixir text-white' : 'bg-page text-body'}`}>{i < 2 ? 'Claim reward' : 'Keep saving'}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function TierScreen({ p }: { p: Programme }) {
  const cur = 1;
  return (
    <>
      <p className="px-1 pb-2 text-[11px] font-bold text-navy">Your tier</p>
      <div className={`${card} p-4 text-center`}>
        <span className="mx-auto block h-3 w-14 rounded-full" style={{ background: p.tiers[cur]?.color }} />
        <p className="mt-3 text-2xl font-extrabold text-deep">{p.tiers[cur]?.name}</p>
        <p className="text-[11px] text-body">{p.tiers[cur]?.earn_multiplier}x points on everything</p>
        <div className="mt-3 h-2 rounded-full bg-page"><div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-elixir-light to-elixir" /></div>
        <p className="mt-1.5 text-[10px] text-body">Spend {gbp(430)} more to reach {p.tiers[cur + 1]?.name}</p>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {p.tiers.map((t, i) => (
          <div key={t.id} className={`${card} flex items-center justify-between px-3 py-2.5 text-[11px] ${i === cur ? 'ring-2 ring-elixir' : ''}`}>
            <span className="flex items-center gap-2 font-bold text-deep"><span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />{t.name}</span>
            <span className="font-extrabold text-elixir">{t.earn_multiplier}x</span>
          </div>
        ))}
      </div>
    </>
  );
}
