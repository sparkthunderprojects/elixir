'use client';

import { api, useAsync } from "@/lib/elixir";
import { ErrorNote, Loading } from "./ui";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800";
const num = (n: number) => new Intl.NumberFormat("en-GB").format(n);
const gbp = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
const pct = (n: number | null) => (n == null ? "–" : `${Math.round(n * 100)}%`);

export function InsightsView() {
  const q = useAsync(() => api.adminInsights(6), []);
  if (q.loading && !q.data) return <Loading />;
  const d = q.data;
  if (!d) return <ErrorNote message={q.error} />;
  const max = Math.max(1, ...d.monthly.map((m) => Math.max(m.issued, m.redeemed)));
  const tile = (label: string, value: string, sub?: string) => (
    <div className={card}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>{sub && <p className="text-xs text-slate-400">{sub}</p>}</div>
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tile("Members", num(d.members_total), `${num(d.new_members)} joined in ${d.months} months`)}
        {tile("Active last 30 days", num(d.active_30d), "earned or redeemed")}
        {tile("Redemption rate", pct(d.redemption_rate), `${num(d.points_redeemed)} of ${num(d.points_issued)} points`)}
        {tile("Shop at 2+ brands", pct(d.multi_brand_rate), "of members who earned")}
      </div>
      <div className={card}>
        <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-100">Points issued vs redeemed</h2>
        <div className="flex h-40 items-end gap-3">
          {d.monthly.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-full w-full items-end gap-1">
                <div className="w-1/2 rounded-t bg-rose-500" style={{ height: `${Math.max(2, (m.issued / max) * 100)}%` }} title={`${num(m.issued)} issued`} />
                <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${Math.max(2, (m.redeemed / max) * 100)}%` }} title={`${num(m.redeemed)} redeemed`} />
              </div>
              <span className="text-[10px] text-slate-400">{m.month.slice(5)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400"><span className="text-rose-500">■</span> issued &nbsp;<span className="text-emerald-500">■</span> redeemed</p>
      </div>
      <div className={card}>
        <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-100">Brands, last {d.months} months</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400"><tr><th className="py-1">Brand</th><th className="text-right">Spend</th><th className="text-right">Orders</th><th className="text-right">Members</th></tr></thead>
          <tbody>{d.brands.map((b) => (
            <tr key={b.name} className="border-t border-slate-100 dark:border-slate-700"><td className="py-1.5">{b.name}</td><td className="text-right">{gbp(Number(b.spend_gbp))}</td><td className="text-right">{num(b.orders)}</td><td className="text-right">{num(b.members)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
