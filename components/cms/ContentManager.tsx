'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, ExternalLink, History, Info, Monitor, RefreshCw, Rocket, Smartphone, Tablet, Undo2 } from 'lucide-react';
import { cms, type CmsPage, type CmsPageRow, type CmsRevision } from '@/lib/cms/api';
import { PAGES, PAGE_BY_SLUG, TOKENS, defaultsOf, type PageDef } from '@/lib/cms/schema';
import { errMsg } from '@/lib/elixir';
import { useAuth } from '@/components/elixir/session';
import { ErrorNote, Loading, Modal, Spinner, Toast } from '@/components/elixir/ui';
import FieldEditor from '@/components/cms/FieldEditor';

type Values = Record<string, unknown>;
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const BUILTIN_IMAGES = [
  { path: '/elixir-logo.png', name: 'Elixir logo', alt: 'Elixir Points', width: 0, height: 0 },
  { path: '/elixir-mark.png', name: 'Elixir droplet mark', alt: '', width: 147, height: 200 },
  { path: '/brands/sparkthunder-shop.png', name: 'Sparkthunder Shop logo', alt: 'Sparkthunder Shop logo', width: 438, height: 120 },
  { path: '/brands/knightverge.png', name: 'Knightverge logo', alt: 'Knightverge logo', width: 560, height: 125 },
  { path: '/brands/roll-combat.png', name: 'Roll Combat logo', alt: 'Roll Combat logo', width: 560, height: 444 },
  { path: '/brands/miss-petty.png', name: 'Miss Petty logo', alt: 'Miss Petty logo', width: 560, height: 247 },
];

const DEVICES = { desktop: { w: 1280, icon: Monitor, label: 'Desktop' }, tablet: { w: 820, icon: Tablet, label: 'Tablet' }, mobile: { w: 390, icon: Smartphone, label: 'Phone' } } as const;
const KNOWN = new Set([...TOKENS.map((t) => t.token), 'amount', 'brand']);

function ago(iso: string | null): string {
  if (!iso) return 'never';
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Problems worth a second look before publishing. Never blocks; just warns. */
function check(def: PageDef, values: Values): string[] {
  const out: string[] = [];
  const scan = (v: unknown, where: string) => {
    if (typeof v === 'string') {
      for (const m of Array.from(v.matchAll(/\{([a-z0-9_]+)\}/gi))) if (!KNOWN.has(m[1])) out.push(`${where}: "{${m[1]}}" is not a live value, so it will show as written.`);
    } else if (Array.isArray(v)) v.forEach((x) => scan(x, where));
    else if (v && typeof v === 'object') Object.values(v as Values).forEach((x) => scan(x, where));
  };
  for (const g of def.groups) for (const f of g.fields) scan(values[`${g.id}.${f.key}`], `${g.label} › ${f.label}`);
  const nav = values['nav.items'];
  if (Array.isArray(nav)) for (const it of nav as { label?: string; href?: string }[]) if (it.href && !/^(\/|https?:\/\/)/.test(it.href)) out.push(`Menu: the link "${it.label}" should start with / or https://`);
  const seoTitle = values['seo.title']; const seoDesc = values['seo.description'];
  if (typeof seoTitle === 'string' && seoTitle.length > 60) out.push('Search engines: the page title is over 60 characters and may be cut off in Google.');
  if (typeof seoDesc === 'string' && seoDesc.length > 160) out.push('Search engines: the description is over 160 characters and may be cut off in Google.');
  return out;
}

export default function ContentManager() {
  const { staff } = useAuth();
  const isAdmin = staff.role === 'admin';
  const [pages, setPages] = useState<CmsPageRow[] | null>(null);
  const [slug, setSlug] = useState<string>('home');
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    try {
      let rows = await cms.pages();
      const missing = PAGES.filter((p) => !rows.some((r) => r.slug === p.slug));
      if (missing.length && isAdmin) {
        // First visit: move all the text and images that are in the site today into the CMS.
        for (let i = 0; i < missing.length; i++) {
          const p = missing[i];
          setSetup(`Moving your site content into the CMS (${i + 1} of ${missing.length}): ${p.title}`);
          await cms.save(p.slug, p.title, defaultsOf(p));
          await cms.publish(p.slug, 'Content moved in from the original site', 'import');
        }
        const have = new Set((await cms.media()).map((m) => m.path));
        for (const img of BUILTIN_IMAGES.filter((b) => !have.has(b.path))) await cms.addBuiltinImage({ ...img, url: img.path });
        setSetup(null);
        await cms.refreshSite();
        rows = await cms.pages();
      }
      setPages(rows);
    } catch (e) { setSetup(null); setError(errMsg(e)); }
  }, [isAdmin]);

  useEffect(() => { void loadPages(); }, [loadPages]);

  if (error) return <div className="mx-auto max-w-xl space-y-3 py-10"><ErrorNote message={error} /><p className="text-sm text-slate-500">If this says a function does not exist, the CMS SQL has not been run in Supabase yet.</p></div>;
  if (setup) return <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center"><Spinner className="h-8 w-8" /><p className="text-sm font-medium text-slate-700">{setup}</p><p className="text-xs text-slate-400">This happens once. Please keep this page open.</p></div>;
  if (!pages) return <Loading />;
  const ready = PAGES.filter((p) => pages.some((r) => r.slug === p.slug));
  if (!ready.length) return <div className="mx-auto max-w-xl py-10 text-center text-sm text-slate-600">The website content has not been set up yet. Ask an admin to open this page once.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="btn-ghost !px-2" aria-label="Back to dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          <div><h1 className="text-xl font-bold text-slate-900">Website content</h1><p className="text-sm text-slate-500">Edit any wording or picture, check it in the preview, then publish.</p></div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Pages" className="panel h-fit p-2 lg:sticky lg:top-20">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {ready.map((p) => {
              const row = pages.find((r) => r.slug === p.slug)!;
              return (
                <li key={p.slug}>
                  <button type="button" onClick={() => setSlug(p.slug)} aria-current={slug === p.slug ? 'page' : undefined}
                    className={`flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${slug === p.slug ? 'bg-rose-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                    {p.title}
                    <span className={`h-2 w-2 shrink-0 rounded-full ${row.has_changes ? 'bg-amber-400' : 'bg-emerald-400'}`} title={row.has_changes ? 'Unpublished changes' : 'Live'} />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <Editor key={slug} slug={slug} isAdmin={isAdmin} onChanged={loadPages} />
      </div>
    </div>
  );
}

function Editor({ slug, isAdmin, onChanged }: { slug: string; isAdmin: boolean; onChanged: () => Promise<void> }) {
  const def = PAGE_BY_SLUG[slug];
  const defaults = useMemo(() => defaultsOf(def), [def]);
  const [page, setPage] = useState<CmsPage | null>(null);
  const [values, setValues] = useState<Values>({});
  const [save, setSave] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(def.groups[0]?.id ?? null);
  const [rev, setRev] = useState(0);
  const [modal, setModal] = useState<'publish' | 'history' | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICES>('desktop');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Values>({});
  const seq = useRef(0);

  const load = useCallback(async () => {
    try {
      const p = await cms.get(slug);
      if (!p) throw new Error('Page not found');
      setPage(p);
      const merged = { ...defaults, ...p.draft };
      latest.current = merged; setValues(merged); setSave('idle'); setRev((r) => r + 1);
    } catch (e) { setError(errMsg(e)); }
  }, [slug, defaults]);
  useEffect(() => { void load(); }, [load]);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const mine = ++seq.current;
    setSave('saving');
    try {
      await cms.save(slug, def.title, latest.current);
      if (mine === seq.current) { setSave('saved'); setRev((r) => r + 1); setPage((p) => (p ? { ...p, has_changes: true, draft_updated_at: new Date().toISOString() } : p)); }
    } catch (e) { setSave('error'); setError(errMsg(e)); }
  }, [slug, def.title]);

  const change = (key: string, v: unknown) => {
    const next = { ...latest.current, [key]: v };
    latest.current = next; setValues(next); setSave('dirty'); setError(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 1200);
  };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (save === 'dirty' || save === 'saving') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [save]);
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void cms.save(slug, def.title, latest.current).catch(() => undefined); } }, [slug, def.title]);

  const problems = useMemo(() => check(def, values), [def, values]);

  const publish = async (note: string) => {
    setError(null);
    try {
      await flush();
      await cms.publish(slug, note);
      await cms.refreshSite();
      setModal(null); setToast('Published. The change is live on the site now.');
      setTimeout(() => setToast(null), 5000);
      await load(); await onChanged();
    } catch (e) { setError(errMsg(e)); setModal(null); }
  };

  const discard = async () => {
    if (!confirm('Throw away all unpublished changes to this page? The live version stays as it is.')) return;
    try { if (timer.current) { clearTimeout(timer.current); timer.current = null; } await cms.discard(slug); await load(); await onChanged(); setToast('Changes discarded.'); setTimeout(() => setToast(null), 4000); } catch (e) { setError(errMsg(e)); }
  };

  if (!page) return error ? <ErrorNote message={error} /> : <Loading />;

  const dirty = page.has_changes || save === 'dirty';
  const status = save === 'saving' ? 'Saving…' : save === 'dirty' ? 'Unsaved…' : save === 'error' ? 'Not saved' : dirty ? 'Draft saved, not live yet' : 'Live, no changes';

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{def.title}</h2>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              {save === 'saving' ? <Spinner className="h-3 w-3" /> : <span className={`h-2 w-2 rounded-full ${save === 'error' ? 'bg-rose-500' : dirty ? 'bg-amber-400' : 'bg-emerald-400'}`} />}
              {status}{page.published_at ? ` · last published ${ago(page.published_at)}${page.published_by ? ` by ${page.published_by}` : ''}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModal('history')}><History className="h-4 w-4" />History</button>
            {isAdmin && <button type="button" className="btn-secondary" disabled={!page.has_changes} onClick={discard}><Undo2 className="h-4 w-4" />Discard</button>}
            {isAdmin
              ? <button type="button" className="btn-primary" disabled={!dirty || save === 'saving'} onClick={() => setModal('publish')}><Rocket className="h-4 w-4" />Publish</button>
              : <span className="chip bg-slate-100 text-slate-600" title="Only admins can publish">Admins publish</span>}
          </div>
        </div>
        <ErrorNote message={error} />
        <Toast message={toast} />
        {slug === 'site' && <p className="flex gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-800"><Info className="mt-0.5 h-4 w-4 shrink-0" />Header and footer changes show in the preview once published. Brand logo changes show in the preview straight away.</p>}

        {def.groups.map((g) => (
          <section key={g.id} className="panel overflow-hidden">
            <button type="button" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? null : g.id)} className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left">
              <span className="font-semibold text-slate-900">{g.label}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open === g.id ? 'rotate-180' : ''}`} />
            </button>
            {open === g.id && (
              <div className="space-y-5 border-t border-slate-100 px-5 py-5">
                {g.help && <p className="text-xs text-slate-500">{g.help}</p>}
                {g.fields.map((f) => {
                  const key = `${g.id}.${f.key}`;
                  return <FieldEditor key={key} def={f} idPrefix={`${slug}-${g.id}`} isAdmin={isAdmin} value={values[key] ?? f.default}
                    limit={g.id === 'seo' && f.key === 'title' ? 60 : g.id === 'seo' && f.key === 'description' ? 160 : undefined}
                    onChange={(v) => change(key, v)} />;
                })}
              </div>
            )}
          </section>
        ))}
        <details className="panel p-4 text-sm text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-800">Live values you can use in any text</summary>
          <p className="mt-2 text-xs text-slate-500">Write these in curly brackets and the site fills in the current number, so text never goes out of date when you change the programme settings.</p>
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">{TOKENS.map((t) => <li key={t.token}><code className="rounded bg-slate-100 px-1.5 py-0.5">{`{${t.token}}`}</code> {t.label}</li>)}</ul>
        </details>
      </div>

      <Preview slug={slug} rev={rev} device={device} setDevice={setDevice} />

      {modal === 'publish' && <PublishModal problems={problems} onClose={() => setModal(null)} onPublish={publish} />}
      {modal === 'history' && <HistoryModal slug={slug} isAdmin={isAdmin} onClose={() => setModal(null)} onRestored={async () => { setModal(null); await load(); await onChanged(); setToast('Version loaded into the draft. Check it, then publish.'); setTimeout(() => setToast(null), 5000); }} />}
    </div>
  );
}

function Preview({ slug, rev, device, setDevice }: { slug: string; rev: number; device: keyof typeof DEVICES; setDevice: (d: keyof typeof DEVICES) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el); setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const dw = DEVICES[device].w;
  const scale = Math.min(1, width / dw);
  const height = 760;
  const live = PAGE_BY_SLUG[slug]?.path ?? '/';
  return (
    <div className="panel flex min-w-0 flex-col p-3 xl:sticky xl:top-20 xl:h-[calc(100vh-7rem)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Preview size">
          {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((d) => {
            const I = DEVICES[d].icon;
            return <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${device === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><I className="h-3.5 w-3.5" />{DEVICES[d].label}</button>;
          })}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-400"><Check className="h-3.5 w-3.5" />Preview of your draft</span>
          <a href={live} target="_blank" rel="noopener" className="btn-ghost !px-2 !py-1.5"><ExternalLink className="h-3.5 w-3.5" />Live page</a>
        </div>
      </div>
      <div ref={box} className="relative min-h-[28rem] flex-1 overflow-hidden rounded-xl bg-slate-200">
        <div style={{ width: dw, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: 'top left', marginLeft: scale < 1 || device === 'desktop' ? 0 : (width - dw) / 2 }}>
          <iframe key={`${slug}-${rev}`} title={`Preview of ${slug}`} src={`/admin/preview/${slug}?v=${rev}`} className="h-full w-full border-0 bg-white" style={{ minHeight: height }} />
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><RefreshCw className="h-3 w-3" />The preview refreshes a moment after you stop typing.</p>
    </div>
  );
}

function PublishModal({ problems, onClose, onPublish }: { problems: string[]; onClose: () => void; onPublish: (note: string) => Promise<void> }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Publish this page" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">This puts your draft live on the site straight away. The current live version is kept in History, so you can always go back.</p>
        {problems.length > 0 && (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Worth a second look</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">{problems.slice(0, 8).map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        )}
        <div><label className="label" htmlFor="pub-note">What changed? (optional)</label><input id="pub-note" className="input" placeholder="e.g. New hero heading" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={busy} onClick={async () => { setBusy(true); await onPublish(note); setBusy(false); }}>{busy ? <Spinner className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}Publish now</button>
        </div>
      </div>
    </Modal>
  );
}

function HistoryModal({ slug, isAdmin, onClose, onRestored }: { slug: string; isAdmin: boolean; onClose: () => void; onRestored: () => Promise<void> }) {
  const [rows, setRows] = useState<CmsRevision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { cms.revisions(slug).then(setRows, (e) => setError(errMsg(e))); }, [slug]);
  const kind = { import: 'Moved in from the original site', publish: 'Published', restore: 'Restored' } as const;
  return (
    <Modal title="Version history" onClose={onClose} wide>
      <div className="space-y-3">
        <ErrorNote message={error} />
        {!rows ? <Loading /> : rows.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Nothing published yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{kind[r.kind]}{i === 0 ? ' (current live version)' : ''}</p>
                  <p className="truncate text-xs text-slate-500">{new Date(r.created_at).toLocaleString('en-GB')} · {r.created_by ?? 'unknown'}{r.note ? ` · ${r.note}` : ''}</p>
                </div>
                {isAdmin && i > 0 && <button type="button" className="btn-secondary shrink-0" onClick={async () => { try { await cms.restore(r.id); await onRestored(); } catch (e) { setError(errMsg(e)); } }}>Restore to draft</button>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
