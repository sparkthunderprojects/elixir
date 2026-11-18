'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/elixir';

const INTERESTS = ['loyalty', 'insights', 'media', 'other'] as const;

/** Partner enquiry form. A hidden field catches bots; the database also rate-limits by email. */
export default function EnquiryForm({ labels }: { labels: Record<string, string> }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'limit' | 'error'>('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    const i = new URLSearchParams(window.location.search).get('interest');
    if (i && (INTERESTS as readonly string[]).includes(i)) setPicked([i]);
  }, []);

  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('hp')) { setState('done'); return; } // bot: pretend it worked
    setState('sending'); setErr('');
    try {
      await api.submitEnquiry({
        company: String(f.get('company') || ''), contact_name: String(f.get('name') || ''), email: String(f.get('email') || ''),
        website: String(f.get('website') || ''), interests: picked, message: String(f.get('message') || ''),
      });
      setState('done');
    } catch (ex) {
      const m = ex instanceof Error ? ex.message : '';
      if (m.includes('too_many_enquiries')) setState('limit');
      else if (/required|valid|email|company|name|long/i.test(m)) { setErr(m); setState('error'); }
      else setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div role="status" className="py-8 text-center">
        <h2 className="text-2xl font-extrabold text-deep">{labels.done_title}</h2>
        <p className="mt-2 text-body">{labels.done_text}</p>
      </div>
    );
  }

  const input = 'mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-deep shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:border-elixir focus:outline-none focus:ring-2 focus:ring-elixir/30';
  const lab = 'block text-sm font-bold text-deep';
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={lab}>{labels.company}<input name="company" required maxLength={120} autoComplete="organization" className={input} /></label>
        <label className={lab}>{labels.name}<input name="name" required maxLength={120} autoComplete="name" className={input} /></label>
        <label className={lab}>{labels.email}<input name="email" type="email" required maxLength={200} autoComplete="email" className={input} /></label>
        <label className={lab}>{labels.website}<input name="website" type="url" maxLength={200} autoComplete="url" placeholder="https://" className={input} /></label>
      </div>
      <fieldset>
        <legend className={lab}>{labels.interests}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((k) => (
            <label key={k} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${picked.includes(k) ? 'border-elixir bg-elixir text-white' : 'border-black/10 bg-white text-deep hover:border-elixir'}`}>
              <input type="checkbox" className="sr-only" checked={picked.includes(k)} onChange={() => toggle(k)} />
              {labels[`interest_${k}`]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={lab}>{labels.message}<textarea name="message" rows={5} maxLength={2000} className={input} /></label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave empty<input name="hp" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state === 'limit' && <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{labels.done_limit}</p>}
      {state === 'error' && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{err || labels.done_error}</p>}
      <div>
        <button disabled={state === 'sending'} className="inline-flex rounded-xl bg-gradient-to-b from-[#e85a68] to-[#b02a3c] px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_-8px_rgba(189,49,65,0.8)] transition hover:-translate-y-0.5 disabled:opacity-60">{labels.submit}</button>
        <p className="mt-3 text-xs text-body">{labels.consent}</p>
      </div>
    </form>
  );
}
