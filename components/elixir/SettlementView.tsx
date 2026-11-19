'use client';

import { useState } from "react";
import { api, errMsg, useAsync } from "@/lib/elixir";
import { ErrorNote, Loading } from "./ui";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800";
const gbp = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

function lastMonth() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return [from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)];
}

export function SettlementView() {
  const list = useAsync(() => api.settlements(), []);
  const tb = useAsync(() => api.trialBalance(), []);
  const [[from, to], setRange] = useState(lastMonth());
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null); setMsg(null);
    try { await fn(); list.reload(); tb.reload(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h2 className="font-bold text-slate-900 dark:text-slate-100">Generate partner statements</h2>
        <p className="mt-1 text-sm text-slate-500">Totals the points each partner funded in the period (net of refunds) and prices them at the redeem value. Draft statements are hidden from partners until you issue them.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={(e) => setRange([e.target.value, to])} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" />
          <span className="text-slate-400">to</span>
          <input type="date" value={to} onChange={(e) => setRange([from, e.target.value])} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" />
          <button disabled={busy} onClick={() => void act(async () => { const r = await api.generateSettlements(from, to); setMsg(`${r.created} new draft statement(s)${r.skipped ? `. ${r.skipped} partner(s) skipped because they already have a statement covering some of these days.` : ''}`); })} className="btn-primary bg-rose-600 hover:bg-rose-700">Generate</button>
        </div>
        {msg && <p className="mt-2 text-sm text-emerald-600">{msg}</p>}
      </div>
      <ErrorNote message={error ?? list.error ?? tb.error} />
      <div className={card}>
        <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-100">Statements</h2>
        {list.loading && !list.data ? <Loading /> : (list.data ?? []).length === 0 ? <p className="text-sm text-slate-400">None yet. Only partner brands (not owned brands) are billed.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400"><tr><th className="py-1">Partner</th><th>Period</th><th className="text-right">Points</th><th className="text-right">Amount</th><th className="text-right">Status</th><th /></tr></thead>
            <tbody>
              {(list.data ?? []).map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="py-1.5 font-medium">{s.brand}</td>
                  <td className="text-slate-500">{s.period_start} → {s.period_end}</td>
                  <td className="text-right">{s.points_funded.toLocaleString("en-GB")}</td>
                  <td className="text-right font-semibold">{gbp(Number(s.amount_gbp))}</td>
                  <td className="text-right capitalize">{s.status}</td>
                  <td className="pl-3 text-right">
                    {s.status === "draft" && <button disabled={busy} onClick={() => void act(() => api.issueSettlement(s.id))} className="text-xs font-semibold text-rose-600 hover:underline">Issue</button>}
                    {s.status === "issued" && <button disabled={busy} onClick={() => void act(() => api.paySettlement(s.id))} className="text-xs font-semibold text-emerald-600 hover:underline">Mark paid</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className={card}>
        <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-100">Trial balance</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400"><tr><th className="py-1">Account</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead>
          <tbody>
            {(tb.data ?? []).map((a) => (
              <tr key={a.code} className="border-t border-slate-100 dark:border-slate-700"><td className="py-1.5">{a.code} · {a.name}</td><td className="text-right">{gbp(Number(a.debit))}</td><td className="text-right">{gbp(Number(a.credit))}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-400">Every entry is double-sided and the journal cannot be edited or deleted. Debits always equal credits.</p>
      </div>
    </div>
  );
}
