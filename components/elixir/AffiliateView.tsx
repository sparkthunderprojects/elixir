'use client';

import { useState } from "react";
import { api, errMsg, useAsync } from "@/lib/elixir";
import { ErrorNote, Loading } from "./ui";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800";
const input = "rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900";

export function AffiliateView({ isAdmin }: { isAdmin: boolean }) {
  const merchants = useAsync(() => api.affMerchantsAdmin(), []);
  const conv = useAsync(() => api.conversions(), []);
  const [error, setError] = useState<string | null>(null);
  const [m, setM] = useState({ name: "", slug: "", url_template: "", points_per_gbp: "1", description: "" });
  const [c, setC] = useState({ merchant: "", order_ref: "", sale: "", who: "" });

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); merchants.reload(); conv.reload(); } catch (e) { setError(errMsg(e)); }
  };
  const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s.trim());

  return (
    <div className="space-y-6">
      <ErrorNote message={error ?? merchants.error ?? conv.error} />
      <div className={card}>
        <h2 className="font-bold text-slate-900 dark:text-slate-100">Merchants</h2>
        <p className="mt-1 text-xs text-slate-500">The link template must start with https:// and contain <code>{"{click}"}</code> where your affiliate network wants its sub-ID, so sales can be matched back to the member.</p>
        {merchants.loading && !merchants.data ? <Loading /> : (
          <ul className="mt-3 space-y-1.5">
            {(merchants.data ?? []).map((x) => (
              <li key={x.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-700/40">
                <span className="min-w-0 truncate"><b>{x.name}</b> <span className="text-slate-500">· {x.points_per_gbp} pts per £1 · {x.active ? "live" : "hidden"}</span></span>
                {isAdmin && <button onClick={() => void act(() => api.saveAffMerchant({ id: x.id, active: !x.active }))} className="text-xs font-semibold text-rose-600 hover:underline">{x.active ? "Hide" : "Show"}</button>}
              </li>
            ))}
            {merchants.data?.length === 0 && <li className="text-sm text-slate-400">No merchants yet</li>}
          </ul>
        )}
        {isAdmin && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Name" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} />
            <input className={input} placeholder="slug (a-z, 0-9, -)" value={m.slug} onChange={(e) => setM({ ...m, slug: e.target.value })} />
            <input className={`${input} sm:col-span-2`} placeholder="https://network.example/go?url=...&subid={click}" value={m.url_template} onChange={(e) => setM({ ...m, url_template: e.target.value })} />
            <input className={input} type="number" min={0} step="0.1" placeholder="Points per £1" value={m.points_per_gbp} onChange={(e) => setM({ ...m, points_per_gbp: e.target.value })} />
            <input className={input} placeholder="Short note (optional)" value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} />
            <button disabled={!m.name || !m.slug || !m.url_template} onClick={() => void act(async () => { await api.saveAffMerchant({ name: m.name, slug: m.slug, url_template: m.url_template, points_per_gbp: Number(m.points_per_gbp), description: m.description || null }); setM({ name: "", slug: "", url_template: "", points_per_gbp: "1", description: "" }); })} className="btn-primary bg-rose-600 hover:bg-rose-700 sm:col-span-2">Add merchant</button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className={card}>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Record a sale</h2>
          <p className="mt-1 text-xs text-slate-500">From your network&apos;s report. Use the click ID (sub-ID) when you have it, otherwise the member&apos;s email. Sales start as pending and credit points only when confirmed.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <select className={input} value={c.merchant} onChange={(e) => setC({ ...c, merchant: e.target.value })}>
              <option value="">Merchant…</option>
              {(merchants.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <input className={input} placeholder="Order reference" value={c.order_ref} onChange={(e) => setC({ ...c, order_ref: e.target.value })} />
            <input className={input} type="number" min={0} step="0.01" placeholder="Sale £" value={c.sale} onChange={(e) => setC({ ...c, sale: e.target.value })} />
            <input className={input} placeholder="Click ID or member email" value={c.who} onChange={(e) => setC({ ...c, who: e.target.value })} />
          </div>
          <button disabled={!c.merchant || !c.order_ref || !c.sale || !c.who} onClick={() => void act(async () => {
            await api.recordConversion(c.merchant, c.order_ref, Number(c.sale), isUuid(c.who) ? c.who.trim() : null, isUuid(c.who) ? null : c.who.trim());
            setC({ ...c, order_ref: "", sale: "", who: "" });
          })} className="btn-primary mt-3 bg-rose-600 hover:bg-rose-700">Record sale</button>
        </div>
      )}

      <div className={card}>
        <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-100">Sales</h2>
        {(conv.data ?? []).length === 0 ? <p className="text-sm text-slate-400">No sales recorded yet.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400"><tr><th className="py-1">Merchant</th><th>Member</th><th>Order</th><th className="text-right">Sale</th><th className="text-right">Points</th><th className="text-right">Status</th><th /></tr></thead>
            <tbody>
              {(conv.data ?? []).map((x) => (
                <tr key={x.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="py-1.5">{x.merchant}</td><td className="text-slate-500">{x.member}</td><td>{x.order_ref}</td>
                  <td className="text-right">£{Number(x.sale_gbp).toFixed(2)}</td><td className="text-right">{x.points}</td><td className="text-right capitalize">{x.status}</td>
                  <td className="space-x-2 pl-3 text-right">
                    {isAdmin && x.status === "pending" && <>
                      <button onClick={() => void act(() => api.setConversion(x.id, "confirmed"))} className="text-xs font-semibold text-emerald-600 hover:underline">Confirm</button>
                      <button onClick={() => void act(() => api.setConversion(x.id, "declined"))} className="text-xs font-semibold text-danger-600 hover:underline">Decline</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
