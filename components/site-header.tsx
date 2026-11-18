'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';

/** Elixir Points header: logo on the left, sign-in state on the right. */
export default function SiteHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getElixirClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getElixirClient().auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link href="/" aria-label="Elixir Points home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/elixir-logo.png" alt="Elixir Points rewards programme" className="h-16 w-auto sm:h-20" />
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {email === undefined ? null : email ? (
            <>
              <span className="hidden text-slate-500 md:inline">{email}</span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 font-medium text-navy hover:bg-slate-100">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-elixir px-4 py-1.5 font-semibold text-white hover:bg-elixir-dark">Join free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
