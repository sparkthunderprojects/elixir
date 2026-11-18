'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';
import { safeNext } from '@/lib/safe-next';
import { friendlyAuthError } from '@/lib/auth-errors';

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await getElixirClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(friendlyAuthError(error.message));
      setBusy(false);
      return;
    }
    router.push(safeNext(next) ?? '/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">Email
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:border-elixir focus:outline-none focus:ring-2 focus:ring-elixir/20" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Password
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:border-elixir focus:outline-none focus:ring-2 focus:ring-elixir/20" />
      </label>
      {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</p>}
      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-elixir px-4 py-3 font-bold text-white hover:bg-elixir-dark disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in
      </button>
    </form>
  );
}
