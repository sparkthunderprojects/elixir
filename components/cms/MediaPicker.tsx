'use client';

import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Search, Trash2, Upload } from 'lucide-react';
import { cms, uploadImage, type MediaRow } from '@/lib/cms/api';
import { errMsg, useAsync } from '@/lib/elixir';
import type { ImageValue } from '@/lib/cms/schema';
import { ErrorNote, Loading, Modal, Spinner } from '@/components/elixir/ui';

const kb = (n: number | null) => (n == null ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** The image library: upload new pictures, pick one, tidy names and descriptions. */
export default function MediaPicker({ isAdmin, onPick, onClose }: { isAdmin: boolean; onPick: (img: ImageValue) => void; onClose: () => void }) {
  const media = useAsync(() => cms.media(), []);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const [name, setName] = useState('');
  const [alt, setAlt] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const items = useMemo(() => (media.data ?? []).filter((m) => !query || `${m.name} ${m.alt}`.toLowerCase().includes(query.toLowerCase())), [media.data, query]);

  const choose = (m: MediaRow) => { setSelected(m); setName(m.name); setAlt(m.alt); };

  const upload = async (files: FileList | File[]) => {
    setBusy(true); setError(null);
    try {
      let last: MediaRow | null = null;
      for (const f of Array.from(files)) last = await uploadImage(f);
      media.reload();
      if (last) choose(last);
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const saveDetails = async () => {
    if (!selected) return;
    try { await cms.mediaUpdate(selected.id, name, alt); media.reload(); setSelected({ ...selected, name, alt }); } catch (e) { setError(errMsg(e)); }
  };

  const remove = async () => {
    if (!selected || !confirm(`Delete ${selected.name}? Pages using it will lose the picture.`)) return;
    try { await cms.mediaDelete(selected.id); setSelected(null); media.reload(); } catch (e) { setError(errMsg(e)); }
  };

  const use = async () => {
    if (!selected) return;
    if (name !== selected.name || alt !== selected.alt) await saveDetails();
    onPick({ src: selected.url, alt, width: selected.width ?? 0, height: selected.height ?? 0 });
  };

  return (
    <Modal title="Image library" onClose={onClose} wide>
      <div className="space-y-4" style={{ minWidth: 0 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) void upload(e.dataTransfer.files); }}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${over ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}>
          {busy ? <Spinner className="h-6 w-6" /> : <Upload className="h-6 w-6 text-slate-400" />}
          <p className="text-sm text-slate-600">Drop pictures here, or <button type="button" className="font-semibold text-rose-600 underline" onClick={() => input.current?.click()}>choose files</button></p>
          <p className="text-xs text-slate-400">PNG, JPG, WebP, GIF, AVIF or SVG, up to 10 MB each</p>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ''; }} />
        </div>
        <ErrorNote message={error ?? media.error} />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search pictures" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {media.loading && !media.data ? <Loading /> : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => choose(m)} onDoubleClick={() => { choose(m); }}
                  className={`group block w-full overflow-hidden rounded-xl border-2 text-left transition-colors ${selected?.id === m.id ? 'border-rose-500' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="flex h-24 items-center justify-center bg-[conic-gradient(#f1f5f9_25%,#fff_0_50%,#f1f5f9_0_75%,#fff_0)] bg-[length:16px_16px] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.alt || m.name} className="max-h-full max-w-full object-contain" />
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs font-medium text-slate-700">{m.name}</span>
                </button>
              </li>
            ))}
            {items.length === 0 && !media.loading && <li className="col-span-full py-8 text-center text-sm text-slate-400">No pictures yet. Upload your first one above.</li>}
          </ul>
        )}
        {selected && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">{selected.width ? `${selected.width} × ${selected.height} px` : 'Size unknown'} {selected.bytes ? `· ${kb(selected.bytes)}` : ''} {selected.builtin ? '· Built in' : ''}</p>
            <div><label className="label" htmlFor="m-name">Name</label><input id="m-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <label className="label" htmlFor="m-alt">Description for screen readers and Google</label>
              <input id="m-alt" className="input" placeholder="Describe what the picture shows" value={alt} onChange={(e) => setAlt(e.target.value)} />
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              {isAdmin && !selected.builtin ? <button type="button" className="btn-ghost text-rose-600" onClick={remove}><Trash2 className="h-4 w-4" />Delete</button> : <span />}
              <button type="button" className="btn-primary" onClick={use}><ImagePlus className="h-4 w-4" />Use this picture</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
