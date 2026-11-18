'use client';

import { useState } from "react";
import { api, errMsg, useAsync, type EnquiryRow } from "@/lib/elixir";
import { ErrorNote, Loading } from "./ui";

const STATUSES = ["new", "contacted", "closed"] as const;
const COLOURS: Record<string, string> = { new: "bg-rose-100 text-rose-700", contacted: "bg-amber-100 text-amber-800", closed: "bg-slate-100 text-slate-600" };

export function EnquiriesView({ onChange }: { onChange: () => void }) {
  const [filter, setFilter] = useState<string | null>(null);
  const list = useAsync(() => api.enquiries(filter), [filter]);
  const [error, setError] = useState<string | null>(null);

  const update = async (row: EnquiryRow, status: string, notes: string | null) => {
    setError(null);
    try { await api.updateEnquiry(row.id, status, notes); list.reload(); onChange(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[null, ...STATUSES].map((s) => (
          <button key={s ?? "all"} onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${filter === s ? "bg-rose-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{s ?? "All"}</button>
        ))}
        {list.data && <span className="ml-auto text-sm text-slate-500">{list.data.total} total · {list.data.new_count} new</span>}
      </div>
      <ErrorNote message={error || list.error} />
      {list.loading && !list.data ? <Loading /> : (
        <div className="space-y-3">
          {list.data?.rows.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No enquiries yet.</p>}
          {list.data?.rows.map((r) => <Row key={r.id} row={r} onSave={update} />)}
        </div>
      )}
    </div>
  );
}

function Row({ row, onSave }: { row: EnquiryRow; onSave: (r: EnquiryRow, status: string, notes: string | null) => void }) {
  const [notes, setNotes] = useState(row.notes ?? "");
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{row.company}</h3>
          <p className="text-sm text-slate-600">{row.contact_name} · <a className="text-rose-600 underline" href={`mailto:${row.email}`}>{row.email}</a></p>
          {row.website && <p className="text-sm"><a className="text-rose-600 underline" href={row.website} target="_blank" rel="noopener noreferrer">{row.website}</a></p>}
        </div>
        <div className="text-right text-xs text-slate-500">
          <span className={`rounded-full px-2.5 py-1 font-semibold capitalize ${COLOURS[row.status]}`}>{row.status}</span>
          <p className="mt-2">{new Date(row.created_at).toLocaleString()}</p>
        </div>
      </div>
      {row.interests.length > 0 && <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Interested in: {row.interests.join(", ")}</p>}
      {row.message && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{row.message}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[14rem] flex-1 text-xs font-semibold text-slate-500">Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800" />
        </label>
        {STATUSES.map((s) => (
          <button key={s} disabled={row.status === s && (row.notes ?? "") === notes} onClick={() => onSave(row, s, notes || null)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium capitalize text-slate-700 hover:bg-slate-50 disabled:opacity-40">{row.status === s ? "Save notes" : `Mark ${s}`}</button>
        ))}
      </div>
    </article>
  );
}
