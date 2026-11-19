'use client';

import { useState } from "react";
import { api, errMsg, useAsync } from "@/lib/elixir";
import { ErrorNote, Loading } from "./ui";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800";
const gbp = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export function CampaignsView() {
  const list = useAsync(() => api.adminCampaigns(), []);
  const [fees, setFees] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); list.reload(); } catch (e) { setError(errMsg(e)); } };

  if (list.loading && !list.data) return <Loading />;
  const rows = list.data ?? [];
  return (
    <div className="space-y-4">
      <ErrorNote message={error ?? list.error} />
      {rows.length === 0 && <div className={card}><p className="text-sm text-slate-400">No campaigns submitted yet.</p></div>}
      {rows.map((c) => (
        <div key={c.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{c.brand} · {c.starts_on} → {c.ends_on}</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{c.title}</p>
              {c.body && <p className="text-sm text-slate-600 dark:text-slate-300">{c.body}</p>}
              <a href={c.link_url} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-rose-600 hover:underline">{c.link_url}</a>
              {c.status === "approved" && <p className="mt-1 text-xs text-slate-500">{c.impressions} views · {c.clicks} clicks · fee {gbp(Number(c.fee_gbp))} ({c.fee_status})</p>}
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize dark:bg-slate-700">{c.status}</span>
          </div>
          {c.status === "pending" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input type="number" min={0} step="0.01" placeholder="Fee £ (0 = free)" value={fees[c.id] ?? ""} onChange={(e) => setFees({ ...fees, [c.id]: e.target.value })} className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900" />
              <button onClick={() => void act(() => api.reviewCampaign(c.id, "approved", Number(fees[c.id] || 0), null))} className="btn-primary bg-emerald-600 hover:bg-emerald-700">Approve</button>
              <button onClick={() => { const r = prompt("Reason for the partner (they will see this):"); if (r) void act(() => api.reviewCampaign(c.id, "rejected", 0, r)); }} className="btn-secondary">Send back</button>
            </div>
          )}
          {c.status === "approved" && c.fee_gbp > 0 && c.fee_status === "none" && <button onClick={() => void act(() => api.billCampaign(c.id))} className="btn-secondary mt-3">Bill {gbp(Number(c.fee_gbp))}</button>}
          {c.fee_status === "billed" && <button onClick={() => void act(() => api.campaignPaid(c.id))} className="btn-secondary mt-3">Mark paid</button>}
        </div>
      ))}
    </div>
  );
}
