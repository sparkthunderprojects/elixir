'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';
import { friendlyAuthError } from '@/lib/auth-errors';
import { TERMS_VERSION } from '@/lib/terms';
import { MYSPARKTHUNDER_URL } from '@/lib/config';

export default function SignupForm({ next }: { next?: string }) {
  void next;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error } = await getElixirClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { signup_site: 'elixir', terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION },
      },
    });
    if (error) {
      setError(friendlyAuthError(error.message));
      setBusy(false);
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists. Your My Sparkthunder account works here too, so sign in instead.');
      setBusy(false);
      return;
    }
    if (data.session) {
      router.push('/');
      router.refresh();
      return;
    }
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return <p className="text-sm text-slate-700">Check your email. We sent you a link to confirm your address, then you can sign in.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">Email
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:border-elixir focus:outline-none focus:ring-2 focus:ring-elixir/20" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Password
        <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:border-elixir focus:outline-none focus:ring-2 focus:ring-elixir/20" />
        <span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters.</span>
      </label>
      {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</p>}
      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-elixir px-4 py-3 font-bold text-white hover:bg-elixir-dark disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}Create account
      </button>
      <p className="text-xs text-slate-500">
        By joining you agree to the <a className="underline" href={`${MYSPARKTHUNDER_URL}/terms`}>Terms</a> and{' '}
        <a className="underline" href={`${MYSPARKTHUNDER_URL}/privacy`}>Privacy Policy</a>.
      </p>
    </form>
  );
}
