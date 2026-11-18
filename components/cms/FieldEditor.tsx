'use client';

import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Copy, GripVertical, ImageIcon, Plus, Trash2, Braces } from 'lucide-react';
import { TOKENS, type FieldDef, type ImageValue } from '@/lib/cms/schema';
import MediaPicker from '@/components/cms/MediaPicker';

type Value = unknown;
interface Props { def: FieldDef; value: Value; onChange: (v: Value) => void; isAdmin: boolean; limit?: number; idPrefix: string }

const blank = (fields: FieldDef[]): Record<string, unknown> => Object.fromEntries(fields.map((f) => [f.key, f.type === 'list' ? [] : f.default]));

function TokenMenu({ onInsert }: { onInsert: (t: string) => void }) {
  return (
    <label className="inline-flex items-center gap-1 text-xs text-slate-500">
      <Braces className="h-3.5 w-3.5" />
      <select style={{ width: "10.5rem" }} className="cursor-pointer rounded border-0 bg-transparent py-0.5 text-xs text-slate-500 focus:ring-0" value="" aria-label="Insert a live value"
        onChange={(e) => { if (e.target.value) onInsert(`{${e.target.value}}`); }}>
        <option value="">Insert live value</option>
        {TOKENS.map((t) => <option key={t.token} value={t.token}>{t.label}</option>)}
      </select>
    </label>
  );
}

export default function FieldEditor({ def, value, onChange, isAdmin, limit, idPrefix }: Props) {
  const id = `${idPrefix}-${def.key}`;
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [picking, setPicking] = useState(false);

  const insert = (t: string) => {
    const el = ref.current; const cur = typeof value === 'string' ? value : '';
    if (!el) { onChange(cur + t); return; }
    const a = el.selectionStart ?? cur.length; const b = el.selectionEnd ?? cur.length;
    onChange(cur.slice(0, a) + t + cur.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + t.length, a + t.length); });
  };

  const head = (
    <div className="mb-1.5 flex items-end justify-between gap-2">
      <label className="label !mb-0" htmlFor={id}>{def.label}</label>
      {(def.type === 'text' || def.type === 'textarea') && <TokenMenu onInsert={insert} />}
    </div>
  );
  const help = def.help ? <p className="mt-1 text-xs text-slate-400">{def.help}</p> : null;

  if (def.type === 'text' || def.type === 'link') {
    const v = typeof value === 'string' ? value : '';
    return (
      <div>{head}
        <input ref={ref as React.RefObject<HTMLInputElement>} id={id} className="input" value={v} onChange={(e) => onChange(e.target.value)} />
        {limit ? <p className={`mt-1 text-xs ${v.length > limit ? 'text-amber-600' : 'text-slate-400'}`}>{v.length} / {limit} characters</p> : null}
        {help}
      </div>
    );
  }
  if (def.type === 'textarea') {
    const v = typeof value === 'string' ? value : '';
    return (
      <div>{head}
        <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} id={id} className="input min-h-[5rem] resize-y" rows={Math.min(8, Math.max(3, Math.ceil(v.length / 60)))} value={v} onChange={(e) => onChange(e.target.value)} />
        {limit ? <p className={`mt-1 text-xs ${v.length > limit ? 'text-amber-600' : 'text-slate-400'}`}>{v.length} / {limit} characters</p> : null}
        {help}
      </div>
    );
  }
  if (def.type === 'color') {
    const v = typeof value === 'string' && value ? value : '#ffffff';
    return (
      <div>{head}
        <div className="flex items-center gap-2">
          <input id={id} type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#ffffff'} onChange={(e) => onChange(e.target.value)} />
          <input className="input max-w-[9rem] font-mono" value={v} onChange={(e) => onChange(e.target.value)} aria-label={`${def.label} (hex code)`} />
        </div>
        {help}
      </div>
    );
  }
  if (def.type === 'image') {
    const v = (value && typeof value === 'object' ? value : def.default) as ImageValue;
    return (
      <div>
        <p className="label">{def.label}</p>
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-[conic-gradient(#f1f5f9_25%,#fff_0_50%,#f1f5f9_0_75%,#fff_0)] bg-[length:14px_14px] p-1.5">
            {v.src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.src} alt={v.alt} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-slate-300" />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input id={id} className="input" placeholder="Describe the picture (alt text)" value={v.alt} onChange={(e) => onChange({ ...v, alt: e.target.value })} aria-label={`${def.label}: description`} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary !py-1.5" onClick={() => setPicking(true)}>{v.src ? 'Change picture' : 'Choose picture'}</button>
              {v.src && <button type="button" className="btn-ghost !py-1.5" onClick={() => onChange({ src: '', alt: '', width: 0, height: 0 })}>Remove</button>}
            </div>
          </div>
        </div>
        {help}
        {picking && <MediaPicker isAdmin={isAdmin} onClose={() => setPicking(false)} onPick={(img) => { onChange(img); setPicking(false); }} />}
      </div>
    );
  }

  // list
  if (def.type !== 'list') return null;
  const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
  return <ListEditor def={def} items={items} onChange={onChange} isAdmin={isAdmin} idPrefix={id} help={help} />;
}

function ListEditor({ def, items, onChange, isAdmin, idPrefix, help }: { def: Extract<FieldDef, { type: 'list' }>; items: Record<string, unknown>[]; onChange: (v: Value) => void; isAdmin: boolean; idPrefix: string; help: React.ReactNode }) {
  const [open, setOpen] = useState<number | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items]; const [it] = next.splice(from, 1); next.splice(to, 0, it); onChange(next);
    setOpen((o) => (o === from ? to : o));
  };
  const title = (it: Record<string, unknown>, i: number) => {
    const t = it[def.titleField]; return typeof t === 'string' && t.trim() ? t : `New ${def.itemLabel} ${i + 1}`;
  };
  return (
    <div>
      <p className="label">{def.label}</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} draggable={drag === i} onDragOver={(e) => { if (drag !== null) e.preventDefault(); }} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }} onDragEnd={() => setDrag(null)}
            className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-1 p-2">
              <span onMouseDown={() => setDrag(i)} onMouseUp={() => setDrag(null)} className="cursor-grab p-1 text-slate-300 hover:text-slate-500" title="Drag to reorder" aria-hidden="true"><GripVertical className="h-4 w-4" /></span>
              <button type="button" className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open === i ? '' : '-rotate-90'}`} />
                <span className="truncate">{title(it, i)}</span>
              </button>
              <button type="button" className="btn-ghost !p-1.5" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp className="h-4 w-4" /></button>
              <button type="button" className="btn-ghost !p-1.5" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><ArrowDown className="h-4 w-4" /></button>
              <button type="button" className="btn-ghost !p-1.5" aria-label="Duplicate" onClick={() => { const next = [...items]; next.splice(i + 1, 0, JSON.parse(JSON.stringify(it))); onChange(next); setOpen(i + 1); }}><Copy className="h-4 w-4" /></button>
              <button type="button" className="btn-ghost !p-1.5 text-rose-600" aria-label="Delete" onClick={() => { if (confirm(`Delete this ${def.itemLabel}?`)) { onChange(items.filter((_, n) => n !== i)); setOpen(null); } }}><Trash2 className="h-4 w-4" /></button>
            </div>
            {open === i && (
              <div className="space-y-4 border-t border-slate-100 p-4">
                {def.fields.map((f) => (
                  <FieldEditor key={f.key} def={f} idPrefix={`${idPrefix}-${i}`} isAdmin={isAdmin}
                    value={it[f.key] ?? f.default}
                    onChange={(v) => { const next = [...items]; next[i] = { ...it, [f.key]: v }; onChange(next); }} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      <button type="button" className="btn-secondary mt-3" onClick={() => { onChange([...items, blank(def.fields)]); setOpen(items.length); }}><Plus className="h-4 w-4" />Add {def.itemLabel}</button>
      {help}
    </div>
  );
}
