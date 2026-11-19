'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Receipt, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { api, errMsg, useAsync, type PartnerBrand } from '@/lib/elixir';
import { SUPABASE_URL } from '@/lib/config';
import { gbp } from '@/lib/programme';
import { ErrorNote, KpiCard, Loading } from '@/components/elixir/ui';
import { KeyModal } from '@/components/elixir/AdminViews';

const RANGES = [7, 30, 90];
const num = (n: number) => new Intl.NumberFormat('en-GB').format(n);

export default function Portal() {
  const brands = useAsync(() => api.partnerBrands(), []);
  const [picked, setPicked] = useState<string | null>(null);

  if (brands.loading && !brands.data) return <Loading />;
  if (brands.error) return <ErrorNote message={brands.error} />;
  const list = brands.data ?? [];
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Partner portal</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">This account is not linked to a partner yet. If you are an Elixir 360 partner, ask your account manager to link your sign-in email.</p>
        <Link href="/business/contact" className="mt-5 inline-block rounded-xl bg-elixir px-5 py-2.5 text-sm font-bold text-white hover:bg-elixir-dark">Talk to Elixir 360</Link>
      </div>
    );
  }
  const brand = list.find((b) => b.brand_id === picked) ?? list[0];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{brand.name}</h1>
          <p className="text-sm text-slate-500">Elixir partner dashboard {!brand.active && <span className="ml-1 font-semibold text-danger-600">· inactive</span>}</p>
        </div>
        {list.length > 1 && (
          <select value={brand.brand_id} onChange={(e) => setPicked(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium">
            {list.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.name}</option>)}
          </select>
        )}
      </div>
      <Dashboard key={brand.brand_id} brand={brand} />
    </div>
  );
}

function Dashboard({ brand }: { brand: PartnerBrand }) {
  const [days, setDays] = useState(30);
  const ov = useAsync(() => api.partnerOverview(brand.brand_id, days), [brand.brand_id, days]);
  const d = ov.data;
  const max = Math.max(1, ...(d?.daily ?? []).map((x) => x.points));
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r} onClick={() => setDays(r)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${days === r ? 'bg-elixir text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{r} days</button>
        ))}
      </div>
      <ErrorNote message={ov.error} />
      {ov.loading && !d ? <Loading /> : d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Points issued" value={num(d.points_issued)} sub={`${num(d.points_redeemed)} redeemed here`} icon={<Sparkles className="h-6 w-6" />} accent="bg-elixir" />
            <KpiCard label="Points you fund" value={num(d.points_funded)} sub={`≈ ${gbp(d.funding_cost_gbp)} at redeem value`} icon={<Receipt className="h-6 w-6" />} accent="bg-amber-500" />
            <KpiCard label="Elixir spend" value={gbp(d.spend_gbp)} sub={`${num(d.orders)} orders`} icon={<ShoppingBag className="h-6 w-6" />} accent="bg-emerald-500" />
            <KpiCard label="Members shopping" value={num(d.members)} sub={`last ${d.days} days`} icon={<Users className="h-6 w-6" />} accent="bg-sky-500" />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold text-slate-900">Points issued per day</h2>
            <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Daily points issued">
              {d.daily.map((x) => (
                <div key={x.day} title={`${x.day}: ${num(x.points)} points, ${x.orders} orders`} className="flex-1 rounded-t bg-elixir/80" style={{ height: `${Math.max(2, (Math.max(0, x.points) / max) * 100)}%` }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-400"><span>{d.daily[0]?.day}</span><span>{d.daily.at(-1)?.day}</span></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-bold text-slate-900">Recent activity</h2>
            {d.recent.length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400"><tr><th className="py-1 pr-3">When</th><th className="pr-3">Member</th><th className="pr-3">Type</th><th className="pr-3 text-right">Points</th><th className="pr-3 text-right">Spend</th><th>Reference</th></tr></thead>
                  <tbody>
                    {d.recent.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1.5 pr-3 text-slate-500">{new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="pr-3 font-mono text-xs">{r.member}</td>
                        <td className="pr-3 capitalize">{r.kind}</td>
                        <td className={`pr-3 text-right font-semibold ${r.delta < 0 ? 'text-danger-600' : 'text-emerald-600'}`}>{r.delta > 0 ? '+' : ''}{num(r.delta)}</td>
                        <td className="pr-3 text-right">{r.spend_gbp == null ? '–' : gbp(Number(r.spend_gbp))}</td>
                        <td className="text-slate-500">{r.source_ref ?? '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-400">Members are shown as anonymous IDs. Elixir never shares personal details with partners.</p>
          </section>
        </>
      )}
      <Campaigns brand={brand} />
      <Statements brandId={brand.brand_id} />
      {brand.role === 'owner' ? <Integration brand={brand} /> : <p className="text-sm text-slate-500">API keys are managed by your account owner.</p>}
    </div>
  );
}

function Integration({ brand }: { brand: PartnerBrand }) {
  const keys = useAsync(() => api.partnerKeys(brand.brand_id), [brand.brand_id]);
  const [issued, setIssued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const label = prompt('Label for the new key (e.g. "production")', 'production');
    if (label === null) return;
    setError(null);
    try { setIssued((await api.partnerCreateKey(brand.brand_id, label)).key); keys.reload(); } catch (e) { setError(errMsg(e)); }
  };
  const revoke = async (id: string) => {
    if (!confirm('Revoke this key? Any server using it will stop earning points immediately.')) return;
    setError(null);
    try { await api.partnerRevokeKey(brand.brand_id, id); keys.reload(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Integration</h2>
        <button onClick={create} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"><KeyRound className="h-3.5 w-3.5" />New key</button>
      </div>
      <ErrorNote message={error ?? keys.error} />
      <ul className="space-y-1.5">
        {(keys.data ?? []).map((k) => (
          <li key={k.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span><code className="text-xs">{k.prefix}…</code> <span className="ml-2 text-slate-600">{k.label}</span>{k.revoked_at && <span className="ml-2 text-xs font-semibold text-danger-600">Revoked</span>}</span>
            {!k.revoked_at && <button onClick={() => void revoke(k.id)} className="text-xs font-medium text-danger-600 hover:underline">Revoke</button>}
          </li>
        ))}
        {keys.data?.length === 0 && <li className="text-sm text-slate-400">No keys yet</li>}
      </ul>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Send each paid order from your server</p>
      <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{`POST ${SUPABASE_URL}/functions/v1/elixir-api/earn
x-elixir-key: <your key>

{ "source_ref": "ORDER-1001", "amount": 49.99, "currency": "GBP", "email": "member@example.com" }`}</pre>
      <p className="mt-2 text-xs text-slate-500">Also available: /refund, /check-code, /consume-code. Keep your key in server-side environment variables only.</p>
      {issued && <KeyModal brand={brand.name} apiKey={issued} onClose={() => setIssued(null)} />}
    </section>
  );
}

function Statements({ brandId }: { brandId: string }) {
  const st = useAsync(() => api.partnerSettlements(brandId), [brandId]);
  const rows = st.data ?? [];
  if (rows.length === 0) return null;
  const d = (x: string) => new Date(x).toLocaleDateString('en-GB', { dateStyle: 'medium' });
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-bold text-slate-900">Funding statements</h2>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-400"><tr><th className="py-1">Period</th><th className="text-right">Points funded</th><th className="text-right">Amount</th><th className="text-right">Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period_start + r.period_end} className="border-t border-slate-100">
              <td className="py-1.5">{d(r.period_start)} – {d(r.period_end)}</td>
              <td className="text-right">{num(r.points_funded)}</td>
              <td className="text-right font-semibold">{gbp(Number(r.amount_gbp))}</td>
              <td className={`text-right font-semibold ${r.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{r.status === 'paid' ? 'Paid' : 'Due'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const STATUS: Record<string, string> = { draft: 'Draft', pending: 'In review', approved: 'Approved', rejected: 'Needs changes' };

function Campaigns({ brand }: { brand: PartnerBrand }) {
  const list = useAsync(() => api.partnerCampaigns(brand.brand_id), [brand.brand_id]);
  const owner = brand.role === 'owner';
  const empty = { id: '', title: '', body: '', link_url: '', starts_on: today(), ends_on: inDays(14) };
  const [f, setF] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = list.data ?? [];
  if (!owner && rows.length === 0) return null;

  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); list.reload(); } catch (e) { setError(errMsg(e)); } };
  const save = () => run(async () => {
    await api.partnerSaveCampaign(brand.brand_id, { id: f.id || undefined, title: f.title, body: f.body || null, link_url: f.link_url, starts_on: f.starts_on, ends_on: f.ends_on } as never);
    setOpen(false); setF(empty);
  });
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Campaigns</h2>
        {owner && !open && <button onClick={() => { setF(empty); setOpen(true); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">New campaign</button>}
      </div>
      <p className="mb-3 text-xs text-slate-500">Offers shown to Elixir members. Every campaign is reviewed by Elixir 360 before it goes live, and any fee is agreed at approval.</p>
      <ErrorNote message={error ?? list.error} />
      {open && (
        <div className="mb-4 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
          <input className={`${inp} sm:col-span-2`} maxLength={80} placeholder="Headline (max 80 characters)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea className={`${inp} sm:col-span-2`} maxLength={280} rows={2} placeholder="Short description (max 280 characters)" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <input className={`${inp} sm:col-span-2`} placeholder="https://your-landing-page" value={f.link_url} onChange={(e) => setF({ ...f, link_url: e.target.value })} />
          <label className="text-xs text-slate-500">Starts<input type="date" className={inp} value={f.starts_on} onChange={(e) => setF({ ...f, starts_on: e.target.value })} /></label>
          <label className="text-xs text-slate-500">Ends<input type="date" className={inp} value={f.ends_on} onChange={(e) => setF({ ...f, ends_on: e.target.value })} /></label>
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={!f.title || !f.link_url} onClick={() => void save()} className="rounded-lg bg-elixir px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50">Save draft</button>
            <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-1.5 text-sm text-slate-500">Cancel</button>
          </div>
        </div>
      )}
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id} className="rounded-xl border border-slate-100 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-500">{c.starts_on} → {c.ends_on} · {num(c.impressions)} views · {num(c.clicks)} clicks{c.status === 'approved' && c.fee_gbp > 0 ? ` · fee ${gbp(Number(c.fee_gbp))} (${c.fee_status === 'none' ? 'to be invoiced' : c.fee_status})` : ''}</p>
                {c.status === 'rejected' && c.reject_reason && <p className="mt-1 text-xs text-danger-600">Reviewer note: {c.reject_reason}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold">{STATUS[c.status]}</span>
                {owner && (c.status === 'draft' || c.status === 'rejected') && <>
                  <button onClick={() => { setF({ id: c.id, title: c.title, body: c.body ?? '', link_url: c.link_url, starts_on: c.starts_on, ends_on: c.ends_on }); setOpen(true); }} className="text-xs font-semibold text-slate-600 hover:underline">Edit</button>
                  {c.status === 'draft' && <button onClick={() => void run(() => api.partnerSubmitCampaign(brand.brand_id, c.id))} className="text-xs font-semibold text-elixir hover:underline">Submit</button>}
                </>}
              </div>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-slate-400">No campaigns yet.</li>}
      </ul>
    </section>
  );
}
