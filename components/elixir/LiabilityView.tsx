'use client';

import { useState } from "react";
import { api, errMsg, useAsync, type ExpiryRun } from "@/lib/elixir";
import { formatNumber } from "@/lib/elixir-format";
import { ErrorNote, Loading } from "./ui";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800";

export function LiabilityView({ isAdmin }: { isAdmin: boolean }) {
  const lia = useAsync(() => api.liability(), []);
  const pol = useAsync(() => api.expiryPolicy(), []);
  const [months, setMonths] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<ExpiryRun | null>(null);
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null); setMsg(null);
    try { await fn(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const refresh = () => { lia.reload(); pol.reload(); };
  const L = lia.data;

  return (
    <div className="space-y-5">
      <ErrorNote message={error || lia.error} />
      {lia.loading && !L ? <Loading /> : L && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Points outstanding" value={formatNumber(L.outstanding_points)} sub={`${formatNumber(L.members_with_balance)} members hold points`} />
            <Stat label="Value if all redeemed" value={`£${L.outstanding_gbp.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} sub={`At ${L.redeem_points_per_gbp} points per £1`} />
            <Stat label="Issued, spent, expired" value={`${formatNumber(L.issued_points)} / ${formatNumber(L.redeemed_points)} / ${formatNumber(L.expired_points)}`} sub="Points, all time" />
            <Stat label="Breakage so far" value={`${L.breakage_pct}%`} sub="Expired points as a share of points issued" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">How long points have sat unused</h3>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Since last activity</th><th className="py-1 text-right">Members</th><th className="py-1 text-right">Points</th></tr></thead>
                <tbody>{L.ageing.length === 0 && <tr><td colSpan={3} className="py-3 text-slate-500">No points outstanding.</td></tr>}
                  {L.ageing.map((a) => <tr key={a.bucket} className="border-t border-slate-100"><td className="py-2">{a.bucket}</td><td className="py-2 text-right">{formatNumber(a.members)}</td><td className="py-2 text-right font-semibold">{formatNumber(a.points)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className={card}>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Last 12 months</h3>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Month</th><th className="py-1 text-right">Issued</th><th className="py-1 text-right">Spent</th><th className="py-1 text-right">Expired</th></tr></thead>
                <tbody>{L.monthly.length === 0 && <tr><td colSpan={4} className="py-3 text-slate-500">No activity yet.</td></tr>}
                  {L.monthly.map((m) => <tr key={m.month} className="border-t border-slate-100"><td className="py-2">{m.month}</td><td className="py-2 text-right">{formatNumber(m.issued)}</td><td className="py-2 text-right">{formatNumber(m.redeemed)}</td><td className="py-2 text-right">{formatNumber(m.expired)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className={card}>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Points expiry</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Rule: a member&apos;s whole balance expires after a set number of months with no earning or spending. Expiry is {pol.data?.months ? `on: ${pol.data.months} months` : "off"}.
          {pol.data?.months ? ` Due now: ${formatNumber(pol.data.due_points)} points across ${formatNumber(pol.data.due_members)} members.` : ""}
          {L?.expiring_soon ? ` Due within 60 days: ${formatNumber(L.expiring_soon.points)} points across ${formatNumber(L.expiring_soon.members)} members.` : ""}
        </p>
        {isAdmin ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-500">Months of inactivity (3 to 120)
              <input value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={pol.data?.months ? String(pol.data.months) : "e.g. 24"}
                className="mt-1 block w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800" />
            </label>
            <button disabled={busy || !months} onClick={() => act(async () => { await api.setExpiryPolicy(Number(months)); setMonths(""); setMsg("Expiry rule saved. Nothing expires until you run it below."); refresh(); })}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Save rule</button>
            <button disabled={busy || !pol.data?.months} onClick={() => act(async () => { await api.setExpiryPolicy(null); setRun(null); setMsg("Expiry switched off."); refresh(); })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40">Switch off</button>
            <span className="mx-2 h-6 w-px bg-slate-200" />
            <button disabled={busy || !pol.data?.months} onClick={() => act(async () => { const r = await api.runExpiry(true); setRun(r); })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40">Preview expiry</button>
            <button disabled={busy || !run || !run.dry_run || run.members === 0}
              onClick={() => { if (!window.confirm(`Expire ${run?.points.toLocaleString("en-GB")} points held by ${run?.members} members? This cannot be undone.`)) return;
                act(async () => { const r = await api.runExpiry(false); setRun(r); setMsg(`Expired ${r.points.toLocaleString("en-GB")} points from ${r.members} members.${r.more_to_do ? " More are due: run it again." : ""}`); refresh(); }); }}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Run expiry now</button>
          </div>
        ) : <p className="mt-3 text-sm text-slate-500">Only admins can change or run expiry.</p>}
        {run?.dry_run && <p className="mt-3 text-sm font-medium text-slate-700">Preview: {formatNumber(run.points)} points across {formatNumber(run.members)} members would expire.</p>}
        {msg && <p className="mt-3 text-sm font-medium text-emerald-700">{msg}</p>}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className={card}>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
