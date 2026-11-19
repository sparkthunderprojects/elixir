'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';

/** Sign out, and delete the Elixir account (required by the App Store and Google Play). */
export function AccountSettings() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function signOut() {
    await getElixirClient().auth.signOut();
    router.push('/');
    router.refresh();
  }
  async function remove() {
    setBusy(true); setErr('');
    const sb = getElixirClient();
    const { error } = await sb.rpc('elixir_delete_my_account', { p_confirm: text.trim() });
    if (error) { setBusy(false); setErr(error.message.includes('Staff') ? error.message : 'We could not delete your account just now. Please try again or contact us.'); return; }
    await sb.auth.signOut();
    try { sessionStorage.removeItem('elixir-joined'); } catch { /* ignore */ }
    router.push('/?account=deleted');
    router.refresh();
  }

  return (
    <section className="border-t border-black/5 pt-8">
      <h2 className="text-xl font-extrabold text-deep">Account</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border-2 border-elixir px-4 py-2.5 text-sm font-bold text-elixir hover:bg-elixir/5"><LogOut className="h-4 w-4" /> Sign out</button>
        <button onClick={() => setOpen((o) => !o)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50">Delete my Elixir account</button>
      </div>
      {open && (
        <div className="mt-4 max-w-xl rounded-2xl bg-rose-50 p-5 text-sm text-rose-900">
          <p className="font-bold">This cannot be undone.</p>
          <p className="mt-2">Your Elixir membership will be closed and your name and email removed from it. Any points you have left are lost. Your Sparkthunder sign-in is separate and is not deleted.</p>
          <label htmlFor="del-confirm" className="mt-4 block font-semibold">Type DELETE to confirm</label>
          <input id="del-confirm" value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="characters" autoComplete="off" className="input mt-1 w-full" />
          {err && <p role="alert" className="mt-2 font-semibold">{err}</p>}
          <button disabled={text.trim() !== 'DELETE' || busy} onClick={remove} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete my account
          </button>
        </div>
      )}
    </section>
  );
}
